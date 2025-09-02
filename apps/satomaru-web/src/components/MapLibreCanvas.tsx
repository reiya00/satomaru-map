import { useEffect, useRef, useState, useMemo } from "react";
import maplibregl, { Map as MaplibreMap, Marker, Popup, MapMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { LAYER_LABELS, Pin, LayerKey } from "@/types/pin";
import { loadPins, savePins } from "@/lib/pinsStorage";
import { nanoid } from "nanoid";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TAGS } from "@/data/tagCatalog";
import type { TagDef } from "@/types/tag";
import { LAYER_THEME } from "@/theme/layers";

const STYLE_URL =
  import.meta.env.VITE_MAP_STYLE_URL || "https://demotiles.maplibre.org/style.json";

type Props = {
  selectedLayer: LayerKey;
  selectedTag: string | null; // 旧 UI 互換
  // 追加: 一発配置のための props
  pendingLayer?: LayerKey | null;
  pendingTagKey?: string | null;
  onPendingConsumed?: () => void;
  onPendingTagConsumed?: () => void;
  // 追加: レイヤーの可視状態
  visibleLayers: Record<LayerKey, boolean>;
};

type Draft = { lng: number; lat: number } | null;

type Visibility = Pin["visibility"];

export default function MapLibreCanvas({ selectedLayer, selectedTag, pendingLayer = null, pendingTagKey = null, onPendingConsumed, onPendingTagConsumed, visibleLayers }: Props) {
  // 一発配置の有無に関係なく pins は内部管理
  const [pins, setPins] = useState<Pin[]>(() => loadPins());

  // フォーム用（旧 通常配置用に残す）
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("personal");

  // 選択ピン（ポップアップ用）
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedPin = useMemo(() => pins.find((p) => p.id === selectedId) ?? null, [pins, selectedId]);

  // Map refs
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const markersRef = useRef<globalThis.Map<string, Marker>>(new globalThis.Map());
  const popupRef = useRef<Popup | null>(null);
  const ghostMarkerRef = useRef<Marker | null>(null);

  // マーカーDOM生成（テーマ対応）
  const createMarkerEl = (themeColor: string, { ghost = false } = {}) => {
    const el = document.createElement("div");
    const size = 22;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.borderRadius = "50%";
    el.style.background = ghost ? "transparent" : themeColor;
    el.style.border = ghost ? `2px dashed ${themeColor}` : `2px solid #ffffff`;
    el.style.boxShadow = ghost ? "none" : "0 1px 6px rgba(0,0,0,0.3)";
    el.style.opacity = ghost ? "0.8" : "1";
    el.style.pointerEvents = ghost ? "none" : "auto";
    el.style.transform = "translate(-50%, -50%)";
    return el;
  };

  // 地図初期化
  useEffect(() => {
    if (!mapDivRef.current) return;

    const map = new maplibregl.Map({
      container: mapDivRef.current,
      style: STYLE_URL,
      center: [132.455, 34.383],
      zoom: 10,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    // cleanup で使用する参照を固定
    const markersMap = markersRef.current;

    return () => {
      // クリーンアップ
      markersMap.forEach((m: Marker) => m.remove());
      markersMap.clear();
      ghostMarkerRef.current?.remove();
      ghostMarkerRef.current = null;
      popupRef.current?.remove();
      popupRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // pins/visibleLayers -> Marker反映
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const existing = markersRef.current;
    const nextIds = new Set(pins.map((p) => p.id));

    // remove
    for (const [id, marker] of existing.entries()) {
      if (!nextIds.has(id)) {
        marker.remove();
        existing.delete(id);
      }
    }

    // update existing and add new
    for (const pin of pins) {
      const theme = LAYER_THEME[pin.layer];
      if (existing.has(pin.id)) {
        const marker = existing.get(pin.id)!;
        // 位置更新
        const cur = marker.getLngLat();
        if (cur.lng !== pin.lng || cur.lat !== pin.lat) {
          marker.setLngLat([pin.lng, pin.lat]);
        }
        // 色/表示更新
        const el = marker.getElement() as HTMLElement;
        el.style.background = theme.base;
        el.style.display = visibleLayers[pin.layer] ? "" : "none";
        continue;
      }

      // add
      const el = createMarkerEl(theme.base);
      // 初期の可視状態
      el.style.display = visibleLayers[pin.layer] ? "" : "none";
      const marker = new maplibregl.Marker({ element: el, draggable: true })
        .setLngLat([pin.lng, pin.lat])
        .addTo(map);

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setSelectedId(pin.id);
      });

      marker.on("dragend", () => {
        const pos = marker.getLngLat();
        setPins((prev) => {
          const next = prev.map((p) => (p.id === pin.id ? { ...p, lng: pos.lng, lat: pos.lat } : p));
          savePins(next);
          return next;
        });
      });

      existing.set(pin.id, marker);
    }
  }, [pins, visibleLayers]);

  // 選択ピン -> Popup
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    popupRef.current?.remove();

    if (!selectedPin) return;

    // 選択ピンのレイヤーが非表示なら閉じる
    if (!visibleLayers[selectedPin.layer]) {
      setSelectedId(null);
      return;
    }

    const container = document.createElement("div");
    container.style.minWidth = "240px";

    const titleEl = document.createElement("div");
    titleEl.textContent = selectedPin.tagLabel ?? selectedPin.title ?? "無題のピン";
    titleEl.style.fontWeight = "bold";
    titleEl.style.marginBottom = "4px";

    const layerEl = document.createElement("div");
    layerEl.textContent = `レイヤー: ${LAYER_LABELS[selectedPin.layer]}`;
    layerEl.style.fontSize = "12px";
    layerEl.style.color = "#555";
    layerEl.style.marginBottom = "4px";

    if (selectedPin.description) {
      const descEl = document.createElement("div");
      descEl.textContent = selectedPin.description;
      descEl.style.whiteSpace = "pre-wrap";
      descEl.style.marginBottom = "8px";
      container.appendChild(descEl);
    }

    const delBtn = document.createElement("button");
    delBtn.textContent = "削除";
    delBtn.style.background = "#dc2626";
    delBtn.style.color = "white";
    delBtn.style.border = "none";
    delBtn.style.borderRadius = "6px";
    delBtn.style.padding = "6px 10px";
    delBtn.style.cursor = "pointer";

    delBtn.addEventListener("click", () => {
      setPins((prev) => {
        const next = prev.filter((p) => p.id !== selectedPin.id);
        savePins(next);
        return next;
      });
      popupRef.current?.remove();
      setSelectedId(null);
    });

    container.appendChild(titleEl);
    container.appendChild(layerEl);
    container.appendChild(delBtn);

    const popup = new maplibregl.Popup({ offset: 12 })
      .setDOMContent(container)
      .setLngLat([selectedPin.lng, selectedPin.lat])
      .addTo(map);

    popupRef.current = popup;
  }, [selectedPin, visibleLayers]);

  // 一発配置のクリック確定（タグ優先 → レイヤー）
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onClick = (e: MapMouseEvent) => {
      // タグ一発配置
      if (pendingTagKey) {
        const tag = (TAGS as Record<LayerKey, TagDef[]>)[selectedLayer]?.find((t) => t.key === pendingTagKey);
        if (!tag) return;
        const { lng, lat } = e.lngLat;
        const newPin: Pin = {
          id: nanoid(),
          title: "",
          description: undefined,
          layer: selectedLayer,
          lng,
          lat,
          tagKey: tag.key,
          tagLabel: tag.label,
          createdAt: new Date().toISOString(),
          visibility: "personal",
        };
        setPins((prev) => {
          const next = [...prev, newPin];
          savePins(next);
          return next;
        });
        setSelectedId(newPin.id);
        onPendingTagConsumed?.();
        return;
      }

      // レイヤー一発配置
      if (pendingLayer) {
        const { lng, lat } = e.lngLat;
        const newPin: Pin = {
          id: nanoid(),
          title: "",
          description: undefined,
          layer: pendingLayer,
          lng,
          lat,
          createdAt: new Date().toISOString(),
          visibility: "personal",
        };
        setPins((prev) => {
          const next = [...prev, newPin];
          savePins(next);
          return next;
        });
        setSelectedId(newPin.id);
        onPendingConsumed?.();
        return;
      }

      // 旧 挙動（selectedTag によるダイアログ起動）
      if (selectedTag) {
        const { lng, lat } = e.lngLat;
        setDraft({ lng, lat });
        setTitle(selectedTag ?? "");
        setDescription("");
        setVisibility("personal");
        setOpen(true);
      }
    };

    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
    };
  }, [pendingTagKey, pendingLayer, selectedLayer, selectedTag, onPendingConsumed, onPendingTagConsumed]);

  // カーソル＆ゴースト（旧 selectedTag 用）
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const showCrosshair = Boolean(pendingTagKey) || !!pendingLayer || Boolean(selectedTag);

    const onMouseMove = (e: MapMouseEvent) => {
      if (!selectedTag || pendingTagKey || pendingLayer) return; // 一発配置中はゴーストを使わない
      const { lng, lat } = e.lngLat;
      if (!ghostMarkerRef.current) {
        const theme = LAYER_THEME[selectedLayer];
        const el = createMarkerEl(theme.base, { ghost: true });
        ghostMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map);
      } else {
        ghostMarkerRef.current.setLngLat([lng, lat]);
      }
    };

    if (showCrosshair) {
      map.getCanvas().style.cursor = "crosshair";
    } else {
      map.getCanvas().style.cursor = "";
    }

    if (selectedTag && !pendingTagKey && !pendingLayer) {
      map.on("mousemove", onMouseMove);
    } else {
      map.off("mousemove", onMouseMove);
      ghostMarkerRef.current?.remove();
      ghostMarkerRef.current = null;
    }

    return () => {
      map.off("mousemove", onMouseMove);
    };
  }, [selectedTag, pendingTagKey, pendingLayer, selectedLayer]);

  // 起動時にlocalStorageから再読込
  useEffect(() => {
    const stored = loadPins();
    setPins(stored);
  }, []);

  const resetForm = () => {
    setOpen(false);
    setDraft(null);
    setTitle("");
    setDescription("");
    setVisibility("personal");
  };

  const handleSubmit = () => {
    if (!draft) return;
    const t = title.trim();
    if (!t) return; // タイトル必須

    const newPin: Pin = {
      id: nanoid(),
      title: t,
      description: description.trim() ? description.trim() : undefined,
      layer: selectedLayer,
      lng: draft.lng,
      lat: draft.lat,
      createdAt: new Date().toISOString(),
      visibility,
    };

    setPins((prev) => {
      const next = [...prev, newPin];
      savePins(next);
      return next;
    });

    resetForm();
  };

  return (
    <div ref={mapDivRef} style={{ width: "100%", height: "100%" }}>
      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : resetForm())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ピンの詳細</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="title">タイトル</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: スーパー、病院、公園など"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="desc">コメント（任意）</Label>
              <Textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="メモや補足情報を入力"
                rows={4}
              />
            </div>

            <div className="grid gap-2">
              <Label>公開範囲</Label>
              <RadioGroup
                value={visibility}
                onValueChange={(v) => setVisibility(v as Visibility)}
                className="grid grid-cols-3 gap-3"
              >
                <label className="flex items-center gap-2 p-2 border rounded-md cursor-pointer">
                  <RadioGroupItem value="personal" />
                  <span className="text-sm">個人</span>
                </label>
                <label className="flex items-center gap-2 p-2 border rounded-md cursor-pointer">
                  <RadioGroupItem value="group" />
                  <span className="text-sm">グループ</span>
                </label>
                <label className="flex items-center gap-2 p-2 border rounded-md cursor-pointer">
                  <RadioGroupItem value="public" />
                  <span className="text-sm">公開</span>
                </label>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={resetForm}>キャンセル</Button>
            <Button onClick={handleSubmit} disabled={!title.trim()}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
