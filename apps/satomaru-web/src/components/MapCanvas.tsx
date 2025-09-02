import { LayerKey } from "@/types/pin";
import MapLibreCanvas from "./MapLibreCanvas";
import GoogleMapCanvas from "./GoogleMapCanvas";

export type MapCanvasProps = {
  selectedLayer: LayerKey;
  selectedTag: string | null;
  pendingLayer?: LayerKey | null;
  onPendingConsumed?: () => void;
  // 一発配置: タグ
  pendingTagKey?: string | null;
  onPendingTagConsumed?: () => void;
  // レイヤーの可視状態
  visibleLayers: Record<LayerKey, boolean>;
};

export default function MapCanvas(props: MapCanvasProps) {
  const provider = (import.meta.env.VITE_MAP_PROVIDER as string | undefined)?.toLowerCase();
  if (provider === "google") {
    return <GoogleMapCanvas {...props} />;
  }
  // default: MapLibre
  return <MapLibreCanvas {...props} />;
}

