import React from 'react';
import { LayerKey } from '../types';
import { useI18n } from '../hooks/useI18n';
import { LAYER_THEME } from '@/theme/layers';

interface LayerTabsProps {
  value: LayerKey;
  onChange: (layer: LayerKey) => void;
}

const layerShapes: Record<LayerKey, string> = {
  sumai: '■',
  kurashi: '●',
  manabi: '▲',
  asobi: '◆',
  other: '⬟',
};

export const LayerTabs: React.FC<LayerTabsProps> = ({ value, onChange }) => {
  const { t } = useI18n();
  const layers: LayerKey[] = ['sumai', 'kurashi', 'manabi', 'asobi', 'other'];
  
  return (
    <div className="flex bg-white border-t border-gray-200 overflow-x-auto">
      {layers.map((layer) => {
        const theme = LAYER_THEME[layer];
        const selected = value === layer;
        return (
          <button
            key={layer}
            onClick={() => onChange(layer)}
            className="flex-1 min-w-0 px-3 py-3 text-sm font-medium transition-colors"
            style={selected
              ? { background: theme.base, color: '#fff', borderBottom: `2px solid ${theme.base}` }
              : { background: theme.pastel, color: theme.text }}
          >
            <div className="flex flex-col items-center gap-1" style={{ minHeight: 44 }}>
              <span className="text-lg">{layerShapes[layer]}</span>
              <span className="text-xs truncate">{t(`layers.${layer}`)}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
