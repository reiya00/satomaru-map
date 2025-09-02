/// <reference types="google.maps" />
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { LAYER_THEME } from "@/theme/layers";
import type Supercluster from "supercluster";
import {
  pinsToPointFeatures,
  buildClusterIndex,
  getClustersForMap,
  getPinScaleForZoom,
  getClusterSize,
  pickClusterColor,
  type ClusterProps,
  type AnyClusterItem,
  type PointFeature,
  type ClusterFeature,
  type PointProps,
} from "@/lib/cluster";
import type { Point as GeoPoint } from "geojson";

// Google Maps JavaScript API Loader を利用
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

// AdvancedMarker/Pin の簡易型
type AdvancedMarker = google.maps.marker.AdvancedMarkerElement;
type PinElementCtor = new (opts: google.maps.marker.PinElementOptions) => google.maps.marker.PinElement;

type MarkerLib = {
  AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement;
  PinElement: PinElementCtor;
} | null;

type Props = {
  selectedLayer: LayerKey;
  pendingLayer?: LayerKey | null;
  // 追加: タグ一発配置
  pendingTagKey?: string | null;
  onPendingConsumed?: () => void;
  onPendingTagConsumed?: () => void;
  // 外部からの可視レイヤー
  visibleLayers: Record<LayerKey, boolean>;
};

type Visibility = Pin["visibility"];

function isClusterFeature(f: AnyClusterItem): f is ClusterFeature {
  const props = (f as { properties?: unknown }).properties;
  return typeof props === "object" && props !== null && "cluster" in props && (props as { cluster?: unknown }).cluster === true;
}

export default function GoogleMapCanvas({ selectedLayer, pendingLayer = null, pendingTagKey = null, onPendingConsumed, onPendingTagConsumed, visibleLayers }: Props) {
  const [pins, setPins] = useState<Pin[]>(() => loadPins());
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<{ lng: number; lat: number } | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Pin["visibility"]>("personal");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editLayer, setEditLayer] = useState<LayerKey>(selectedLayer);
  const [editingPin, setEditingPin] = useState<Pin | null>(null);

  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, AdvancedMarker>>(new Map()); // 個別ピン
  const clusterMarkersRef = useRef<Map<number, AdvancedMarker>>(new Map()); // クラスタ
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const currentLocMarkerRef = useRef<google.maps.Marker | null>(null);
  const markerLibRef = useRef<MarkerLib>(null);
  const clusterIndexRef = useRef<Supercluster<PointProps, ClusterProps> | null>(null);
  const refreshMarkersRef = useRef<() => void>(() => {});

  const selectedPin = useMemo(() => pins.find((p) => p.id === selectedId) ?? null, [pins, selectedId]);

  // 配置モード中のみカーソルをクロスヘアに（タグ もしくは pendingLayer 有効時）
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const active = Boolean(pendingTagKey) || !!pendingLayer;
    if (active) {
      map.setOptions({ draggableCursor: "crosshair", draggingCursor: "grabbing", gestureHandling: "greedy", scrollwheel: true });
    } else {
      map.setOptions({ draggableCursor: undefined, draggingCursor: undefined, gestureHandling: "greedy", scrollwheel: true });
    }
  }, [pendingLayer, pendingTagKey]);

  // Google Maps の読み込み
  useEffect(() => {
    if (!mapDivRef.current) return;

    const init = async () => {
      if (!API_KEY) return;
      const [{ Loader }] = await Promise.all([
        import("@googlemaps/js-api-loader"),
      ]);
      const loader = new Loader({
        apiKey: API_KEY,
        version: "weekly",
        libraries: ["marker"],
      });
      const { Map } = await loader.importLibrary("maps");
      const markerLib = (await loader.importLibrary("marker")) as unknown as {
        AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement;
        PinElement: PinElementCtor;
      };

      const map = new Map(mapDivRef.current!, {
        center: { lat: 34.383, lng: 132.455 },
        zoom: 10,
        mapId: import.meta.env.VITE_GOOGLE_MAP_ID as string | undefined,
        disableDefaultUI: false,
        isFractionalZoomEnabled: false,
      });
      mapRef.current = map as unknown as google.maps.Map;

      // AdvancedMarker/Pin を保持
      markerLibRef.current = {
        AdvancedMarkerElement: markerLib.AdvancedMarkerElement,
        PinElement: markerLib.PinElement,
      };

      // InfoWindow 準備
      infoWindowRef.current = new google.maps.InfoWindow();
      infoWindowRef.current.addListener("closeclick", () => setSelectedId(null));

      // マップの移動/ズームでクラスタを再描画
      map.addListener("idle", () => {
        try { refreshMarkersRef.current(); } catch (err) { console.debug("refresh idle failed", err); }
      });
      map.addListener("zoom_changed", () => {
        try { refreshMarkersRef.current(); } catch (err) { console.debug("refresh zoom failed", err); }
      });
    };

    // cleanup で使用する参照をここで固定
    const pointMap = markersRef.current;
    const clusterMap = clusterMarkersRef.current;

    init();
    return () => {
      // Google Maps は自動GCされるため特に破棄は不要
      pointMap.forEach((m) => {
        try { m.map = null; } catch (err) { console.debug("marker cleanup failed", err); }
      });
      pointMap.clear();
      clusterMap.forEach((m) => {
        try { m.map = null; } catch (err) { console.debug("cluster cleanup failed", err); }
      });
      clusterMap.clear();
      currentLocMarkerRef.current?.setMap(null);
      currentLocMarkerRef.current = null;
      mapRef.current = null;
      infoWindowRef.current?.close();
      infoWindowRef.current = null;
      markerLibRef.current = null;
      clusterIndexRef.current = null;
    };
  }, []);

  // pins/visibleLayers の変化でクラスタindexを再構築し、再描画
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const points = pinsToPointFeatures(pins, visibleLayers);
    try {
      clusterIndexRef.current = buildClusterIndex(points);
    } catch (err) {
      console.debug("buildClusterIndex failed", err);
      clusterIndexRef.current = null;
    }
    // 最新の描画関数を呼び出す
    refreshMarkersRef.current();
  }, [pins, visibleLayers]);

  // クラスタ・ピンの再描画
  const refreshMarkers = useCallback(() => {
    const map = mapRef.current;
    const markerLib = markerLibRef.current;
    const index = clusterIndexRef.current;
    if (!map || !markerLib || !index) return;

    const { AdvancedMarkerElement, PinElement } = markerLib;

    const items: AnyClusterItem[] = getClustersForMap(index, map);
    const visiblePointIds = new Set<string>();
    const visibleClusterIds = new Set<number>();
    const zoom = Math.round(map.getZoom() ?? 10);
    const pinScale = getPinScaleForZoom(zoom);

    // まず既存クラスターを非表示にし、必要なものだけ更新
    for (const [, m] of clusterMarkersRef.current.entries()) {
      try { m.map = null; } catch { /* noop */ }
    }

    for (const item of items) {
      const [lng, lat] = (item.geometry as GeoPoint).coordinates as [number, number];
      const pos = { lat, lng } as google.maps.LatLngLiteral;
      // クラスタ
      if (isClusterFeature(item)) {
        const props = item.properties as ClusterProps & { cluster_id: number; point_count: number };
        const cid = (item as ClusterFeature).properties.cluster_id;
        const count = (item as ClusterFeature).properties.point_count;
        const size = getClusterSize(count);
        const color = pickClusterColor(props);

        const content = document.createElement("div");
        content.style.width = `${size}px`;
        content.style.height = `${size}px`;
        content.style.lineHeight = `${size}px`;
        content.style.borderRadius = "9999px";
        content.style.background = color;
        content.style.border = "2px solid #ffffff";
        content.style.display = "grid";
        content.style.setProperty("place-items", "center");
        content.style.color = "#fff";
        content.style.fontWeight = "700";
        content.style.fontSize = `${Math.round(size / 2.2)}px`;
        content.style.boxShadow = "0 1px 6px rgba(0,0,0,0.25)";
        content.textContent = `${count}`;

        let marker = clusterMarkersRef.current.get(cid);
        if (!marker) {
          marker = new AdvancedMarkerElement({ map, position: pos, content });
          // クリックでズームイン
          marker.addListener("gmp-click", () => {
            try {
              const expZoom = index.getClusterExpansionZoom(cid);
              map.setZoom(expZoom);
              map.panTo(pos);
            } catch (err) {
              console.debug("cluster expand failed", err);
            }
          });
          clusterMarkersRef.current.set(cid, marker);
        } else {
          marker.position = new google.maps.LatLng(pos.lat, pos.lng);
          marker.content = content;
          marker.map = map;
        }
        visibleClusterIds.add(cid);
        continue;
      }

      // 単独ピン
      const pid = (item as PointFeature).properties.id as string;
      const pinData = pins.find((p) => p.id === pid);
      if (!pinData) continue;
      visiblePointIds.add(pid);

      const theme = LAYER_THEME[pinData.layer];
      const pinEl = new PinElement({
        background: theme.base,
        borderColor: "#ffffff",
        glyph: "",
        scale: pinScale,
      });
      const content = pinEl.element as HTMLElement;

      let marker = markersRef.current.get(pid);
      if (!marker) {
        marker = new AdvancedMarkerElement({ map, position: pos, content, gmpDraggable: true });
        marker.addListener("gmp-click", () => setSelectedId(pid));
        marker.addListener?.("click", () => setSelectedId(pid));
        marker.addListener("dragend", (e: google.maps.MapMouseEvent) => {
          const latLng = e?.latLng as google.maps.LatLng | undefined;
          if (!latLng) return;
          const lat2 = latLng.lat();
          const lng2 = latLng.lng();
          setPins((prev) => {
            const next = prev.map((p) => (p.id === pid ? { ...p, lat: lat2, lng: lng2 } : p));
            savePins(next);
            return next;
          });
        });
        markersRef.current.set(pid, marker);
      } else {
        // 更新
        marker.position = new google.maps.LatLng(pos.lat, pos.lng);
        marker.content = content;
        marker.map = map;
      }
    }

    // 表示対象外は非表示
    for (const [id, m] of markersRef.current.entries()) {
      if (!visiblePointIds.has(id)) {
        try { m.map = null; } catch { /* noop */ }
      }
    }
    for (const [cid, m] of clusterMarkersRef.current.entries()) {
      if (!visibleClusterIds.has(cid)) {
        try { m.map = null; } catch { /* noop */ }
      }
    }
  }, [pins]);

  // refreshMarkers の最新関数をrefに保持
  useEffect(() => {
    refreshMarkersRef.current = refreshMarkers;
  }, [refreshMarkers]);

  // InfoWindow 表示・更新（編集・削除ボタン含む）
  useEffect(() => {
    const map = mapRef.current;
    const iw = infoWindowRef.current;
    if (!map || !iw) return;

    if (!selectedPin) {
      iw.close();
      return;
    }

    // 選択ピンのレイヤーが非表示なら閉じる
    if (!visibleLayers[selectedPin.layer]) {
      setSelectedId(null);
      iw.close();
      return;
    }

    const eid = `edit-${selectedPin.id}`;
    const did = `delete-${selectedPin.id}`;

    const titleText = selectedPin.tagLabel ?? selectedPin.title ?? "無題のピン";

    const html = `
      <div style="min-width:220px; max-width:280px;">
        <div style="font-weight:600; margin-bottom:4px;">${titleText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
        ${selectedPin.description ? `<div style="font-size:12px; white-space:pre-wrap; line-height:1.4; margin-bottom:8px;">${(selectedPin.description || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>` : ""}
        <div style="display:flex; gap:8px;">
          <button id="${eid}" style="padding:4px 8px; border:1px solid #ccc; border-radius:6px; background:#fff; cursor:pointer;">編集</button>
          <button id="${did}" style="padding:4px 8px; border:1px solid #ef4444; color:#ef4444; border-radius:6px; background:#fff; cursor:pointer;">削除</button>
        </div>
      </div>
    `;
    iw.setContent(html);
    iw.setPosition({ lat: selectedPin.lat, lng: selectedPin.lng });
    iw.open({ map });

    const onDomReady = () => {
      const editBtn = document.getElementById(eid);
      const delBtn = document.getElementById(did);
      if (editBtn) {
        editBtn.addEventListener("click", () => {
          setEditingPin(selectedPin);
          setTitle(selectedPin.title);
          setDescription(selectedPin.description ?? "");
          setVisibility(selectedPin.visibility);
          setEditLayer(selectedPin.layer);
          setOpen(true);
        }, { once: true });
      }
      if (delBtn) {
        delBtn.addEventListener("click", () => {
          setPins((prev) => {
            const next = prev.filter((p) => p.id !== selectedPin.id);
            savePins(next);
            return next;
          });
          setSelectedId(null);
        }, { once: true });
      }
    };

    google.maps.event.addListenerOnce(iw, "domready", onDomReady);
  }, [selectedPin, visibleLayers]);

  // URL クエリ pin=<id> 指定時に選択＆フォーカス
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const params = new URLSearchParams(window.location.search);
    const pid = params.get("pin");
    if (!pid) return;
    const p = pins.find((x) => x.id === pid);
    if (!p) return;
    setSelectedId(pid);
    map.panTo({ lat: p.lat, lng: p.lng });
    map.setZoom(Math.max(map.getZoom() ?? 10, 15));
  }, [pins]);

  // 配置モードのクリック確定（新規作成）
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const listenerClick = map.addListener("click", (e: google.maps.MapMouseEvent) => {
      // 一発配置モード（タグ）優先
      if (pendingTagKey) {
        if (!e.latLng) return;
        const tag = TAGS[selectedLayer]?.find((t) => t.key === pendingTagKey);
        if (!tag) return;
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        const newPin: Pin = {
          id: nanoid(),
          title: "",
          description: undefined,
          layer: selectedLayer,
          lat,
          lng,
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
        map.panTo({ lat, lng });
        map.setZoom(Math.max(map.getZoom() ?? 10, 15));
        onPendingTagConsumed?.();
        return;
      }

      // 一発配置モード（レイヤー）
      if (pendingLayer) {
        if (!e.latLng) return;
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        const newPin: Pin = {
          id: nanoid(),
          title: "",
          description: undefined,
          layer: pendingLayer,
          lat,
          lng,
          createdAt: new Date().toISOString(),
          visibility: "personal",
        };
        setPins((prev) => {
          const next = [...prev, newPin];
          savePins(next);
          return next;
        });
        setSelectedId(newPin.id);
        map.panTo({ lat, lng });
        map.setZoom(Math.max(map.getZoom() ?? 10, 15));
        onPendingConsumed?.();
        return;
      }

      // 旧 来歴の通常配置は未使用
    });

    return () => {
      google.maps.event.removeListener(listenerClick);
    };
  }, [pendingTagKey, pendingLayer, selectedLayer, onPendingConsumed, onPendingTagConsumed]);

  // submit（新規 or 編集）
  const resetForm = () => {
    setOpen(false);
    setDraft(null);
    setTitle("");
    setDescription("");
    setVisibility("personal");
    setEditingPin(null);
  };

  const handleSubmit = () => {
    const t = title.trim();
    if (!t) return;

    if (editingPin) {
      // 更新
      const updated: Pin = {
        ...editingPin,
        title: t,
        description: description.trim() ? description.trim() : undefined,
        layer: editLayer,
      };
      setPins((prev) => {
        const next = prev.map((p) => (p.id === updated.id ? updated : p));
        savePins(next);
        return next;
      });
      resetForm();
      return;
    }

    // 追加
    if (!draft) return;
    const newPin: Pin = {
      id: nanoid(),
      title: t,
      description: description.trim() ? description.trim() : undefined,
      layer: editLayer,
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

  const panToCurrentLocation = () => {
    const map = mapRef.current;
    if (!map || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        map.panTo({ lat, lng });
        map.setZoom(Math.max(map.getZoom() ?? 10, 15));
        // マーカーを表示/更新
        if (!currentLocMarkerRef.current) {
          currentLocMarkerRef.current = new google.maps.Marker({
            map,
            position: { lat, lng },
            icon: { path: google.maps.SymbolPath.CIRCLE, scale: 6, fillColor: "#2563eb", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 2 },
            zIndex: 9999,
          });
        } else {
          currentLocMarkerRef.current.setPosition({ lat, lng });
          currentLocMarkerRef.current.setMap(map);
        }
      },
      () => {
        // 失敗時は何もしない（許可されていない等）
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="w-full h-full relative">
      {/* 右上：現在地へ移動 */}
      <div className="absolute right-2 top-2 z-[1]">
        <button onClick={panToCurrentLocation} className="px-3 py-2 bg-white/90 backdrop-blur rounded shadow border text-sm">現在地</button>
      </div>

      {/* GoogleMap コンテナ */}
      <div ref={mapDivRef} style={{ position: "absolute", inset: 0 }} />
      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : resetForm())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPin ? "ピンを編集" : "ピンの詳細"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="title">タイトル</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="desc">コメント（任意）</Label>
              <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="layer">レイヤー</Label>
              <select id="layer" className="border rounded px-2 py-1" value={editLayer} onChange={(e) => setEditLayer(e.target.value as LayerKey)}>
                {["sumai","kurashi","manabi","asobi","other"].map((l) => (
                  <option key={l} value={l as string}>{LAYER_LABELS[l as LayerKey]}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>公開範囲</Label>
              <RadioGroup value={visibility} onValueChange={(v) => setVisibility(v as Visibility)} className="grid grid-cols-3 gap-3">
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
            <Button onClick={handleSubmit} disabled={!title.trim()}>{editingPin ? "更新" : "保存"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
