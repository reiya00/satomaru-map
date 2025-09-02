import type { Feature, Point } from "geojson";
import Supercluster from "supercluster";
import type { LayerKey, Pin } from "@/types/pin";
import { LAYER_THEME } from "@/theme/layers";

export type PointProps = {
  id: string;
  layer: LayerKey;
};

export type ClusterProps = {
  counts: Record<LayerKey, number>;
  total: number;
};

export type PointFeature = Feature<Point, PointProps>;
export type ClusterFeature = Feature<Point, ClusterProps & {
  cluster: true;
  cluster_id: number;
  point_count: number;
  point_count_abbreviated?: number | string;
}>;

export type AnyClusterItem = PointFeature | ClusterFeature;

export function pinsToPointFeatures(pins: Pin[], visibleLayers: Record<LayerKey, boolean>): PointFeature[] {
  const arr: PointFeature[] = [];
  for (const p of pins) {
    if (!visibleLayers[p.layer]) continue; // 可視レイヤーのみクラスタ対象
    arr.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      properties: { id: p.id, layer: p.layer },
    });
  }
  return arr;
}

export function buildClusterIndex(points: PointFeature[]) {
  const index = new Supercluster<PointProps, ClusterProps>({
    radius: 50,
    maxZoom: 19,
    map: (props) => {
      const counts: Record<LayerKey, number> = { sumai: 0, kurashi: 0, manabi: 0, asobi: 0, other: 0 };
      counts[props.layer] = 1;
      return { counts, total: 1 };
    },
    reduce: (acc, props) => {
      acc.total += props.total;
      (Object.keys(acc.counts) as LayerKey[]).forEach((k) => {
        acc.counts[k] += props.counts[k] || 0;
      });
    },
  });
  index.load(points);
  return index;
}

export function mapBoundsToBbox(map: google.maps.Map): [number, number, number, number] | null {
  const b = map.getBounds();
  if (!b) return null;
  const ne = b.getNorthEast();
  const sw = b.getSouthWest();
  if (!ne || !sw) return null;
  return [sw.lng(), sw.lat(), ne.lng(), ne.lat()];
}

export function getClustersForMap(index: Supercluster<PointProps, ClusterProps>, map: google.maps.Map): AnyClusterItem[] {
  const bbox = mapBoundsToBbox(map);
  if (!bbox) return [];
  const zoom = Math.max(0, Math.floor(map.getZoom() ?? 10));
  return index.getClusters(bbox, zoom) as unknown as AnyClusterItem[];
}

// 既定サイズ係数（約 2/3）
export const BASE_PIN_SCALE = 0.66;

export function getPinScaleForZoom(zoom: number): number {
  const z = Math.max(0, Math.min(22, zoom));
  let s: number;
  if (z <= 10) s = 0.9;
  else if (z <= 12) s = 1.0;
  else if (z <= 14) s = 1.15;
  else if (z <= 16) s = 1.3;
  else if (z <= 18) s = 1.45;
  else s = 1.6;
  return BASE_PIN_SCALE * s;
}

export function getClusterSize(pointCount: number): number {
  if (pointCount < 10) return 26;
  if (pointCount < 25) return 32;
  if (pointCount < 50) return 40;
  if (pointCount < 100) return 48;
  if (pointCount < 250) return 56;
  return 64;
}

export function pickClusterColor(props: ClusterProps): string {
  // 最多レイヤーの色を採用
  let top: LayerKey = "other";
  let max = -1;
  (Object.keys(props.counts) as LayerKey[]).forEach((k) => {
    if (props.counts[k] > max) {
      top = k;
      max = props.counts[k];
    }
  });
  return LAYER_THEME[top].base;
}
