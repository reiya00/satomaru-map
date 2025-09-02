import type { LayerKey } from "./pin";

export type TagDef = {
  key: string;
  label: string;
  layer: LayerKey;
  color?: string;
  icon?: string;
};
