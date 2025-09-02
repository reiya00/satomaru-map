export type LayerKey = "sumai" | "kurashi" | "manabi" | "asobi" | "other";
export type Visibility = "personal" | "group" | "public";

export interface Pin {
  id: string;
  title: string;
  description?: string;
  layer: LayerKey;
  lng: number;
  lat: number;
  // 追加: 個別タグ（任意）
  tagKey?: string;
  tagLabel?: string;
  createdAt: string; // ISO string
  visibility: Visibility;
}

// UI 表示用の日本語ラベル
export const LAYER_LABELS: Record<LayerKey, string> = {
  sumai: "住まい",
  kurashi: "暮らし",
  manabi: "学び",
  asobi: "遊び",
  other: "その他",
};

// 反復用（セレクトに使用）
export const LAYERS: LayerKey[] = ["sumai", "kurashi", "manabi", "asobi", "other"];
