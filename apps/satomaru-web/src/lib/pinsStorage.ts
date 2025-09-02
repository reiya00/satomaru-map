import { Pin } from "../types/pin";

const STORAGE_KEY = "satomaru.pins";

// NOTE: 将来は fetch ベースのAPIに差し替え予定
// - GET /pins
// - POST /pins
// ベースURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

export function loadPins(): Pin[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as Partial<Pin>[];
    // 軽いバリデーション + 正規化（後方互換: visibilityの補完）
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (p) =>
          typeof p?.id === "string" &&
          typeof p?.title === "string" &&
          typeof p?.layer === "string" &&
          typeof p?.lng === "number" &&
          typeof p?.lat === "number"
      )
      .map((p) => ({
        id: p.id!,
        title: p.title!,
        description: p.description,
        layer: p.layer as Pin["layer"],
        lng: p.lng!,
        lat: p.lat!,
        createdAt: p.createdAt ?? new Date().toISOString(),
        visibility: (p as Pin).visibility ?? "personal",
      }));
  } catch {
    return [];
  }
}

export function savePins(pins: Pin[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pins));
  } catch {
    // no-op
  }
}

// 追加: 1件登録/更新（id が一致するものを置き換え）
export function upsertPin(pin: Pin): Pin[] {
  const current = loadPins();
  const next = [...current.filter((p) => p.id !== pin.id), pin];
  savePins(next);
  return next;
}

// 追加: 1件削除
export function removePin(id: string): Pin[] {
  const next = loadPins().filter((p) => p.id !== id);
  savePins(next);
  return next;
}

// 追加: 置き換え
export function replacePins(pins: Pin[]): Pin[] {
  savePins(pins);
  return pins;
}
