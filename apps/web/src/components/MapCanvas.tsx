import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Pin, LayerKey } from '../types';

interface MapCanvasProps {
  pins: Pin[];
  selectedTag: string | null;
  onTap: (lat: number, lng: number) => void;
  onPinClick: (id: string) => void;
}

const layerShapes: Record<LayerKey, string> = {
  sumai: '■',
  kurashi: '●',
  manabi: '▲',
  asobi: '◆',
  other: '⬟',
};

export const MapCanvas: React.FC<MapCanvasProps> = ({ 
  pins, 
  selectedTag, 
  onTap, 
  onPinClick 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: process.env.REACT_APP_MAP_STYLE_URL || 'https://demotiles.maplibre.org/style.json',
      center: [132.5248, 34.2291],
      zoom: 13,
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    map.current.on('click', (e) => {
      if (selectedTag) {
        onTap(e.lngLat.lat, e.lngLat.lng);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const markers: maplibregl.Marker[] = [];

    pins.forEach((pin) => {
      const el = document.createElement('div');
      el.className = 'pin-marker';
      el.style.cssText = `
        width: 32px;
        height: 32px;
        background: white;
        border: 2px solid #333;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      `;
      el.textContent = layerShapes[pin.layer];
      
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onPinClick(pin.id);
      });

      const marker = new maplibregl.Marker(el)
        .setLngLat([pin.lng, pin.lat])
        .addTo(map.current!);
      
      markers.push(marker);
    });

    return () => {
      markers.forEach(marker => marker.remove());
    };
  }, [pins, mapLoaded, onPinClick]);

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-full"
      style={{ minHeight: '400px' }}
    />
  );
};
