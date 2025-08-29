import React from 'react';
import { LayerKey } from '../types';
import { useI18n } from '../hooks/useI18n';

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

const layerColors: Record<LayerKey, string> = {
  sumai: 'bg-red-500 text-white',
  kurashi: 'bg-green-500 text-white',
  manabi: 'bg-blue-500 text-white',
  asobi: 'bg-purple-500 text-white',
  other: 'bg-gray-500 text-white',
};

export const LayerTabs: React.FC<LayerTabsProps> = ({ value, onChange }) => {
  const { t } = useI18n();
  
  const layers: LayerKey[] = ['sumai', 'kurashi', 'manabi', 'asobi', 'other'];
  
  return (
    <div className="flex bg-white border-t border-gray-200 overflow-x-auto">
      {layers.map((layer) => (
        <button
          key={layer}
          onClick={() => onChange(layer)}
          className={`
            flex-1 min-w-0 px-3 py-3 text-sm font-medium transition-colors
            ${value === layer 
              ? `${layerColors[layer]} border-b-2 border-current` 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }
          `}
          style={{ minHeight: '44px' }}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg">{layerShapes[layer]}</span>
            <span className="text-xs truncate">{t(`layers.${layer}`)}</span>
          </div>
        </button>
      ))}
    </div>
  );
};
