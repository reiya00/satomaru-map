import { useEffect, useMemo, useRef, useState } from "react";
import { loadPins, removePin, replacePins } from "@/lib/pinsStorage";
import type { Pin, LayerKey } from "@/types/pin";
import { LAYER_LABELS } from "@/types/pin";
import { useNavigate } from "react-router-dom";

export default function PinIndexPage() {
  const [pins, setPins] = useState<Pin[]>(() => loadPins());
  const [q, setQ] = useState("");
  const [layer, setLayer] = useState<LayerKey | "all">("all");
  const [order, setOrder] = useState<"new" | "old">("new");
  const navigate = useNavigate();

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key !== "satomaru.pins") return;
      setPins(loadPins());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    const arr = pins
      .filter((p) => {
        const inLayer = layer === "all" ? true : p.layer === layer;
        const hit = !kw || p.title.toLowerCase().includes(kw) || (p.description ?? "").toLowerCase().includes(kw);
        return inLayer && hit;
      })
      .sort((a, b) => (order === "new" ? (a.createdAt < b.createdAt ? 1 : -1) : (a.createdAt > b.createdAt ? 1 : -1)));
    return arr;
  }, [pins, q, layer, order]);

  const onExport = () => {
    const blob = new Blob([JSON.stringify(pins, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pins-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fileRef = useRef<HTMLInputElement | null>(null);
  const onImportClick = () => fileRef.current?.click();
  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const text = await f.text();
      const json = JSON.parse(text) as unknown;
      if (!Array.isArray(json)) throw new Error("invalid");
      const hasId = (p: unknown): p is Pin =>
        typeof p === "object" && p !== null && typeof (p as { id?: unknown }).id === "string";
      const ok: Pin[] = (json as unknown[]).filter(hasId) as Pin[];
      replacePins(ok);
      setPins(ok);
    } catch {
      alert("インポート失敗: JSON を確認してください");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">ピン一覧</h1>

      <div className="flex flex-wrap gap-3 items-center mb-4">
        <input className="border rounded px-2 py-1" placeholder="検索（タイトル/メモ）" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="border rounded px-2 py-1" value={layer} onChange={(e) => setLayer(e.target.value as LayerKey | "all")}> 
          <option value="all">すべてのレイヤー</option>
          {(["sumai","kurashi","manabi","asobi","other"] as LayerKey[]).map((l) => (
            <option key={l} value={l}>{LAYER_LABELS[l]}</option>
          ))}
        </select>
        <select className="border rounded px-2 py-1" value={order} onChange={(e) => setOrder(e.target.value as "new" | "old")}>
          <option value="new">新しい順</option>
          <option value="old">古い順</option>
        </select>
        <button className="border rounded px-3 py-1" onClick={onExport}>Export</button>
        <button className="border rounded px-3 py-1" onClick={onImportClick}>Import</button>
        <input type="file" ref={fileRef} accept="application/json" className="hidden" onChange={onImportFile} />
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="text-left border-b">
            <th className="p-2">タイトル</th>
            <th className="p-2">レイヤー</th>
            <th className="p-2">作成日</th>
            <th className="p-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="p-2">{p.title}</td>
              <td className="p-2">{LAYER_LABELS[p.layer]}</td>
              <td className="p-2">{new Date(p.createdAt).toLocaleString()}</td>
              <td className="p-2 flex gap-2">
                <button className="border rounded px-2 py-1" onClick={() => navigate(`/map?pin=${p.id}`)}>地図へ</button>
                <button className="border rounded px-2 py-1" onClick={() => navigate(`/map?pin=${p.id}`)}>編集</button>
                <button className="border rounded px-2 py-1 text-red-600 border-red-300" onClick={() => { setPins(removePin(p.id)); }}>削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
