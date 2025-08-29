export type Visibility = 'personal' | 'group' | 'public';
export type LayerKey = 'sumai' | 'kurashi' | 'manabi' | 'asobi' | 'other';

export interface Pin {
  id: string;
  lat: number;
  lng: number;
  layer: LayerKey;
  tag: string;
  note?: string;
  visibility: Visibility;
  group_id?: string | null;
  status?: 'active' | 'hidden' | 'draft';
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePin {
  lat: number;
  lng: number;
  layer: LayerKey;
  tag: string;
  note?: string;
  visibility: Visibility;
  group_id?: string;
}

export interface UpdatePin {
  tag?: string;
  note?: string;
  visibility?: Visibility;
  status?: 'active' | 'hidden' | 'draft';
}

export interface Layer {
  key: LayerKey;
  name: string;
  order: number;
}

export interface Tag {
  key: string;
  label: string;
}

export interface TagData {
  layers: Layer[];
  tags: Record<LayerKey, Tag[]>;
}

export interface AppState {
  selectedLayer: LayerKey;
  selectedTag: string | null;
  draftPin: { lat: number; lng: number } | null;
  visibility: Visibility;
  note: string;
}

export interface PinsResponse {
  items: Pin[];
  page: number;
  page_size: number;
  total: number;
}
