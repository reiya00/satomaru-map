import React from 'react';
import { Pin } from '../types';
import { useI18n } from '../hooks/useI18n';
import { tagData } from '../data/tags';

interface PinDetailCardProps {
  pin: Pin;
  onEdit?: () => void;
  onDelete?: () => void;
  onClose: () => void;
}

export const PinDetailCard: React.FC<PinDetailCardProps> = ({
  pin,
  onEdit,
  onDelete,
  onClose,
}) => {
  const { t } = useI18n();
  
  const tagLabel = tagData.tags[pin.layer]?.find(t => t.key === pin.tag)?.label || pin.tag;
  const layerName = t(`layers.${pin.layer}`);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold">{tagLabel}</h3>
              <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full mt-1">
                {layerName}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              ×
            </button>
          </div>
          
          {pin.note && (
            <div className="mb-4">
              <p className="text-gray-700">{pin.note}</p>
            </div>
          )}
          
          <div className="space-y-2 text-sm text-gray-500 mb-6">
            <div>
              {t('app.title')}: {pin.lat.toFixed(6)}, {pin.lng.toFixed(6)}
            </div>
            <div>
              {t('messages.selectVisibility')}: {t(`visibility.${pin.visibility}`)}
            </div>
            <div>
              {new Date(pin.createdAt).toLocaleString('ja-JP')}
            </div>
          </div>
          
          <div className="flex gap-3">
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex-1 px-4 py-2 text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ minHeight: '44px' }}
              >
                {t('actions.edit')}
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="flex-1 px-4 py-2 text-red-700 bg-red-100 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                style={{ minHeight: '44px' }}
              >
                {t('actions.delete')}
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              style={{ minHeight: '44px' }}
            >
              {t('actions.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
