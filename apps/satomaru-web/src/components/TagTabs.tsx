import React from 'react';
import type { LayerKey } from '@/types/pin';
import { TAGS } from '@/data/tagCatalog';
import { LAYER_THEME } from '@/theme/layers';

export type TagTabsProps = {
  activeLayer: LayerKey;
  pendingTagKey: string | null;
  onSelect: (tagKey: string) => void;
};

export const TagTabs: React.FC<TagTabsProps> = ({ activeLayer, pendingTagKey, onSelect }) => {
  const tags = TAGS[activeLayer] ?? [];
  const theme = LAYER_THEME[activeLayer];
  if (!tags.length) return (
    <div className="flex gap-2 py-2 px-3 border-b text-xs" style={{ background: theme.pastel, color: theme.text }}>このレイヤーのタグは未登録です</div>
  );

  return (
    <div className="flex flex-wrap items-center gap-2 py-2 px-3 border-b" style={{ background: theme.pastel }}>
      {tags.map((t) => (
        <button
          key={t.key}
          onClick={() => onSelect(t.key)}
          className="text-sm px-3 py-1 rounded-full border transition-colors"
          style={pendingTagKey === t.key
            ? { background: theme.base, color: '#fff', borderColor: theme.base }
            : { background: '#fff', color: theme.text, borderColor: theme.border }}
          title={t.label}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
};

export default TagTabs;
