import { useState, useEffect, useRef, useLayoutEffect } from "react";
import MapCanvas from "@/components/MapCanvas";
import type { LayerKey } from "@/types/pin";
import { LAYER_LABELS } from "@/types/pin";
import LayerVisibility from "@/components/LayerVisibility";
import { LAYER_THEME } from "@/theme/layers";
import { Link } from "react-router-dom";
import { TagTabs } from "@/components/TagTabs";

const TABS: LayerKey[] = ["sumai", "kurashi", "manabi", "asobi", "other"];

const VISIBLE_LS_KEY = "satomaru.visibleLayers.v1";

// ドック幅（閉時は 0）
const DOCK_WIDTH = 240;

export default function MapPage() {
  const [selectedLayer, setSelectedLayer] = useState<LayerKey>("sumai");
  const [pendingLayer, setPendingLayer] = useState<LayerKey | null>(null);
  const [pendingTagKey, setPendingTagKey] = useState<string | null>(null);
  const [dockOpen, setDockOpen] = useState(true);

  // レイヤー可視状態（永続化）
  const [visibleLayers, setVisibleLayers] = useState<Record<LayerKey, boolean>>({
    sumai: true,
    kurashi: true,
    manabi: true,
    asobi: true,
    other: true,
  });
  useEffect(() => {
    try {
      const raw = localStorage.getItem(VISIBLE_LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setVisibleLayers((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch (err) {
      console.debug("visibleLayers load failed", err);
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(VISIBLE_LS_KEY, JSON.stringify(visibleLayers));
    } catch (err) {
      console.debug("visibleLayers save failed", err);
    }
  }, [visibleLayers]);

  const headerRef = useRef<HTMLDivElement>(null);
  const [headerH, setHeaderH] = useState(96);
  useLayoutEffect(() => {
    const measure = () => setHeaderH(headerRef.current?.offsetHeight ?? 96);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // 画面の縦スクロールを禁止（保険）
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = { height: html.style.height, overflow: html.style.overflow };
    const prevBody = { height: body.style.height, overflow: body.style.overflow };
    html.style.height = "100%"; html.style.overflow = "hidden";
    body.style.height = "100%"; body.style.overflow = "hidden";
    return () => { html.style.height = prevHtml.height; html.style.overflow = prevHtml.overflow; body.style.height = prevBody.height; body.style.overflow = prevBody.overflow; };
  }, []);

  // レイヤータブ選択時：一発配置モード（レイヤー）に切替し、タグモードは解除
  const handleSelectLayer = (l: LayerKey) => {
    setSelectedLayer(l);
    setPendingLayer(l);
    setPendingTagKey(null);
  };

  // タグタブ選択時：タグ一発配置。レイヤー一発は解除
  const handleSelectTag = (key: string) => {
    setPendingTagKey(key);
    setPendingLayer(null);
  };

  const theme = LAYER_THEME[selectedLayer];

  return (
    <div className="w-full h-screen" style={{ position: "relative" }}>
      {/* 左サイドドック（中身：レイヤー表示のみ） */}
      <aside
        style={{
          position: 'fixed', top: headerH, left: 0, bottom: 0,
          width: dockOpen ? DOCK_WIDTH : 0,
          overflow: 'hidden',
          transition: 'width .2s ease',
          zIndex: 1001,
        }}
      >
        <div className="h-full bg-white/95 backdrop-blur border-r shadow-sm flex flex-col">
          {/* ドック内の旧トグルボタンは削除 */}
          {dockOpen && (
            <div className="overflow-auto">
              <div className="p-2 text-xs text-gray-500">レイヤー表示</div>
              <LayerVisibility value={visibleLayers} onChange={setVisibleLayers} />
              {/* 旧：個別タグは左ドックから削除 */}
            </div>
          )}
        </div>
      </aside>

      {/* ドックの開閉トグル（常時表示） */}
      <button
        onClick={() => setDockOpen((v) => !v)}
        aria-label={dockOpen ? 'ドックを閉じる' : 'ドックを開く'}
        title={dockOpen ? '閉じる' : '開く'}
        style={{
          position: 'fixed',
          top: headerH + 8,
          left: dockOpen ? DOCK_WIDTH : 0,
          transform: 'translateX(-50%)',
          width: 28,
          height: 28,
          display: 'grid',
          placeItems: 'center',
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 6,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          zIndex: 1002,
        }}
      >
        {dockOpen ? '＜' : '＞'}
      </button>

      {/* 上部固定タブバー + 個別タグ */}
      <div
        ref={headerRef}
        style={{position:'fixed', top:0, left:0, right:0, display:'flex', flexDirection:'column', background: theme.pastel, color: theme.text, borderBottom:'1px solid #eee', zIndex:1000}}
      >
        <div style={{ height:48, display:'flex', gap:8, alignItems:'center', padding:'0 12px'}}>
          {TABS.map((l) => {
            const sel = selectedLayer===l;
            return (
              <button
                key={l}
                className="px-3 py-1 rounded border"
                style={sel ? { background: theme.base, color: '#fff', borderColor: theme.base } : { background: '#fff', color: theme.text, borderColor: 'transparent' }}
                onClick={() => handleSelectLayer(l)}
              >
                {LAYER_LABELS[l]}
              </button>
            );
          })}
          <div style={{marginLeft:'auto', fontSize:12, opacity:0.9}}>
            {pendingTagKey ? 'タグを配置：地図をクリック' : pendingLayer ? `${LAYER_LABELS[pendingLayer]} を配置：地図をクリック` : 'タブを選んで配置'}
          </div>
          <Link to="/pins" className="ml-2 px-3 py-1 rounded border" style={{ background: theme.base, color: '#fff', borderColor: theme.base }}>
            ピン一覧
          </Link>
        </div>
        <TagTabs activeLayer={selectedLayer} pendingTagKey={pendingTagKey} onSelect={handleSelectTag} />
      </div>

      {/* マップ領域（ヘッダー高とドック幅を避ける）*/}
      <div style={{ position:'absolute', top:headerH, left:dockOpen?DOCK_WIDTH:0, right:0, bottom:0 }}>
        <MapCanvas
          selectedLayer={selectedLayer}
          selectedTag={pendingTagKey}
          pendingLayer={pendingLayer}
          pendingTagKey={pendingTagKey}
          onPendingConsumed={() => setPendingLayer(null)}
          onPendingTagConsumed={() => setPendingTagKey(null)}
          visibleLayers={visibleLayers}
        />
      </div>
    </div>
  );
}
