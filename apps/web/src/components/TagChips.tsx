import React from 'react';
import { LayerKey, Tag } from '../types';
import { tagData } from '../data/tags';

interface TagChipsProps {
  layer: LayerKey;
  value: string | null;
  onSelect: (tagKey: string) => void;
}

const layerColors: Record<LayerKey, string> = {
  sumai: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
  kurashi: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
  manabi: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
  asobi: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
};

const selectedColors: Record<LayerKey, string> = {
  sumai: 'bg-red-500 text-white border-red-500',
  kurashi: 'bg-green-500 text-white border-green-500',
  manabi: 'bg-blue-500 text-white border-blue-500',
  asobi: 'bg-purple-500 text-white border-purple-500',
  other: 'bg-gray-500 text-white border-gray-500',
};

export const TagChips: React.FC<TagChipsProps> = ({ layer, value, onSelect }) => {
  const tags = tagData.tags[layer] || [];
  
  return (
    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tags.map((tag) => (
          <button
            key={tag.key}
            onClick={() => onSelect(tag.key)}
            className={`
              flex-shrink-0 px-3 py-2 text-sm font-medium rounded-full border transition-colors
              ${value === tag.key 
                ? selectedColors[layer]
                : layerColors[layer]
              }
            `}
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            {tag.label}
          </button>
        ))}
      </div>
    </div>
  );
};
