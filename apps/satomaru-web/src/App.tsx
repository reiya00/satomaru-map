import { useState, useEffect } from 'react';
import './App.css';
import { LayerKey, Pin, AppState } from './types';
import { MapCanvas } from './components/MapCanvas';
import { LayerTabs } from './components/LayerTabs';
import { TagChips } from './components/TagChips';
import { PinPreview } from './components/PinPreview';
import { PinDetailCard } from './components/PinDetailCard';
import { useI18n } from './hooks/useI18n';

function App() {
  const { t } = useI18n();
  const [state, setState] = useState<AppState>({
    selectedLayer: 'sumai',
    selectedTag: null,
    draftPin: null,
    visibility: 'group',
    note: '',
  });
  
  const [pins, setPins] = useState<Pin[]>([]);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadPins = async () => {
    try {
      const response = await fetch('http://localhost:8000/pins');
      if (response.ok) {
        const data = await response.json();
        setPins(data.items);
      }
    } catch (error) {
      console.error('Failed to load pins:', error);
    }
  };

  useEffect(() => {
    loadPins();
  }, []);

  const handleLayerChange = (layer: LayerKey) => {
    setState(prev => ({
      ...prev,
      selectedLayer: layer,
      selectedTag: null,
    }));
  };

  const handleTagSelect = (tagKey: string) => {
    setState(prev => ({
      ...prev,
      selectedTag: prev.selectedTag === tagKey ? null : tagKey,
    }));
  };

  const handleMapTap = (lat: number, lng: number) => {
    if (!state.selectedTag) {
      setToast(t('messages.selectTagFirst'));
      setTimeout(() => setToast(null), 3000);
      return;
    }
    
    setState(prev => ({
      ...prev,
      draftPin: { lat, lng },
      note: '',
      visibility: 'group',
    }));
  };

  const handleSavePin = async () => {
    if (!state.draftPin || !state.selectedTag) return;
    
    try {
      const response = await fetch('http://localhost:8000/pins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat: state.draftPin.lat,
          lng: state.draftPin.lng,
          layer: state.selectedLayer,
          tag: state.selectedTag,
          note: state.note,
          visibility: state.visibility,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.detail?.code === 'PII_DETECTED') {
          setToast(t('errors.piiDetected'));
        } else if (errorData.detail?.code === 'RATE_LIMIT') {
          setToast(t('errors.rateLimit'));
        } else {
          setToast(t('errors.saveFailed'));
        }
        setTimeout(() => setToast(null), 3000);
        return;
      }

      await loadPins();
      
      setState(prev => ({
        ...prev,
        draftPin: null,
        selectedTag: null,
        note: '',
      }));
      
      setToast(t('messages.saved', { visibility: t(`visibility.${state.visibility}`) }));
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      setToast(t('errors.saveFailed'));
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleCancelPin = () => {
    setState(prev => ({
      ...prev,
      draftPin: null,
      note: '',
    }));
  };

  const handlePinClick = (pinId: string) => {
    const pin = pins.find(p => p.id === pinId);
    if (pin) {
      setSelectedPin(pin);
    }
  };

  const handleDeletePin = async () => {
    if (!selectedPin) return;
    
    try {
      const response = await fetch(`http://localhost:8000/pins/${selectedPin.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadPins();
        setSelectedPin(null);
        setToast(t('messages.deleted'));
        setTimeout(() => setToast(null), 3000);
      } else {
        setToast(t('errors.deleteFailed'));
        setTimeout(() => setToast(null), 3000);
      }
    } catch (error) {
      setToast(t('errors.deleteFailed'));
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <h1 className="text-xl font-semibold text-gray-900">{t('app.title')}</h1>
      </header>
      
      <div className="flex-1 relative" style={{ paddingBottom: '140px' }}>
        <MapCanvas
          pins={pins}
          selectedTag={state.selectedTag}
          onTap={handleMapTap}
          onPinClick={handlePinClick}
        />
      </div>
      
      <div className="bg-white fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200">
        <LayerTabs
          value={state.selectedLayer}
          onChange={handleLayerChange}
        />
        <TagChips
          layer={state.selectedLayer}
          value={state.selectedTag}
          onSelect={handleTagSelect}
        />
      </div>
      
      {state.draftPin && state.selectedTag && (
        <PinPreview
          tag={state.selectedTag}
          layer={state.selectedLayer}
          lat={state.draftPin.lat}
          lng={state.draftPin.lng}
          visibility={state.visibility}
          note={state.note}
          onChangeNote={(note) => setState(prev => ({ ...prev, note }))}
          onChangeVisibility={(visibility) => setState(prev => ({ ...prev, visibility }))}
          onSave={handleSavePin}
          onCancel={handleCancelPin}
        />
      )}
      
      {selectedPin && (
        <PinDetailCard
          pin={selectedPin}
          onDelete={handleDeletePin}
          onClose={() => setSelectedPin(null)}
        />
      )}
      
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;
