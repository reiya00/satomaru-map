import React, { useState } from 'react';
import { LayerKey, Visibility } from '../types';
import { useI18n } from '../hooks/useI18n';
import { tagData } from '../data/tags';

interface PinPreviewProps {
  tag: string;
  layer: LayerKey;
  lat: number;
  lng: number;
  visibility: Visibility;
  note: string;
  onChangeNote: (note: string) => void;
  onChangeVisibility: (visibility: Visibility) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const PinPreview: React.FC<PinPreviewProps> = ({
  tag,
  layer,
  lat,
  lng,
  visibility,
  note,
  onChangeNote,
  onChangeVisibility,
  onSave,
  onCancel,
}) => {
  const { t } = useI18n();
  const [showVisibilityPicker, setShowVisibilityPicker] = useState(false);
  
  const tagLabel = tagData.tags[layer]?.find(t => t.key === tag)?.label || tag;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">{tagLabel}</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('messages.noteOptional')}
              </label>
              <textarea
                value={note}
                onChange={(e) => onChangeNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder={t('messages.noteOptional')}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('messages.selectVisibility')}
              </label>
              <button
                onClick={() => setShowVisibilityPicker(true)}
                className="w-full px-3 py-2 text-left border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ minHeight: '44px' }}
              >
                {t(`visibility.${visibility}`)}
              </button>
            </div>
            
            <div className="text-xs text-gray-500">
              {t('app.title')}: {lat.toFixed(6)}, {lng.toFixed(6)}
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              style={{ minHeight: '44px' }}
            >
              {t('actions.cancel')}
            </button>
            <button
              onClick={onSave}
              className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ minHeight: '44px' }}
            >
              {t('actions.save')}
            </button>
          </div>
        </div>
      </div>
      
      {showVisibilityPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-60">
          <div className="bg-white rounded-t-lg w-full max-w-md">
            <div className="p-4">
              <h4 className="text-lg font-semibold mb-4">{t('messages.selectVisibility')}</h4>
              <div className="space-y-2">
                {(['personal', 'group', 'public'] as Visibility[]).map((vis) => (
                  <button
                    key={vis}
                    onClick={() => {
                      onChangeVisibility(vis);
                      setShowVisibilityPicker(false);
                    }}
                    className={`w-full px-4 py-3 text-left rounded-md transition-colors ${
                      visibility === vis 
                        ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                        : 'hover:bg-gray-50'
                    }`}
                    style={{ minHeight: '44px' }}
                  >
                    {t(`visibility.${vis}`)}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowVisibilityPicker(false)}
                className="w-full mt-4 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                style={{ minHeight: '44px' }}
              >
                {t('actions.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
