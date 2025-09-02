import type { LayerKey } from "@/types/pin";

export type ThemeColor = {
  base: string;    // ピン背景・選択時ボタン
  border: string;  // ピン枠
  pastel: string;  // 非選択ボタン/背景の淡色
  text: string;    // ラベル文字色
};

// 可愛いパステル調の統一カラーパレット
export const LAYER_THEME: Record<LayerKey, ThemeColor> = {
  sumai:   { base: '#E74C3C', border: '#B03A2E', pastel: '#FFE5E5', text: '#8A2A2A' },
  kurashi: { base: '#27AE60', border: '#1E8449', pastel: '#E6F6EC', text: '#1C5E3A' },
  manabi:  { base: '#2980B9', border: '#21618C', pastel: '#E7F1FB', text: '#1D4B73' },
  // kakawari 相当は現行コードの asobi に割当て
  asobi:   { base: '#8E44AD', border: '#6C3483', pastel: '#F3E9F7', text: '#513068' },
  // others 相当は現行コードの other に割当て
  other:   { base: '#7F8C8D', border: '#566573', pastel: '#F1F3F4', text: '#3C4043' },
};
