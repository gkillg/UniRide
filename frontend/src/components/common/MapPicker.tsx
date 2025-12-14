import React, { useEffect, useRef } from 'react';
import * as L from 'leaflet';

// API Key provided for 2GIS
const API_KEY = "5d98480b-bdc3-45fb-bb82-bd59a18d07f0";

interface MapPickerProps {
  onSelect: (data: { name: string; coords: [number, number] }) => void;
  onClose: () => void;
}

const MapPicker: React.FC<MapPickerProps> = ({ onSelect, onClose }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Prevent double initialization
    if (mapInstanceRef.current) return;

    // Initialize Leaflet Map centered on Almaty
    const map = L.map(mapContainerRef.current).setView([43.2389, 76.8897], 13);
    mapInstanceRef.current = map;

    // 2GIS Tiles Integration
    L.tileLayer('https://tile{s}.maps.2gis.com/tiles?x={x}&y={y}&z={z}&v=1', {
      subdomains: ['0', '1', '2', '3'],
      attribution: '&copy; <a href="http://2gis.ru">2GIS</a>',
      maxZoom: 18,
    }).addTo(map);

    // Map Click Event with Reverse Geocoding
    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      
      // Loading indicator logic could go here (e.g., cursor change)
      map.getContainer().style.cursor = 'wait';

      try {
          // Call 2GIS Geocoding API
          const response = await fetch(`https://catalog.api.2gis.com/3.0/items/geocode?lat=${lat}&lon=${lng}&fields=items.point&key=${API_KEY}`);
          const data = await response.json();
          
          const item = data.result?.items?.[0];
          // Prefer full_name, fallback to name, fallback to coords
          const address = item?.full_name || item?.name || `Координаты: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          
          // Reset cursor
          map.getContainer().style.cursor = '';

          // Confirm selection
          if(confirm(`Выбрать точку?\n${address}`)) {
            onSelect({
                name: address,
                coords: [lat, lng]
            });
            onClose();
          }
      } catch (error) {
          console.error("Geocoding error:", error);
          map.getContainer().style.cursor = '';
          
          const fallbackName = `Точка (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
          if(confirm(`Не удалось определить точный адрес. Использовать координаты?\n${fallbackName}`)) {
              onSelect({
                  name: fallbackName,
                  coords: [lat, lng]
              });
              onClose();
          }
      }
    });

    return () => {
      if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
      }
    };
  }, [onSelect, onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white p-4 rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                 <div>
                     <h3 className="text-xl font-bold text-[#002f6c]">Выберите место на карте</h3>
                     <p className="text-xs text-gray-500">Используются карты 2GIS. Кликните для выбора адреса.</p>
                 </div>
                 <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition">
                     <i className="fas fa-times text-2xl"></i>
                 </button>
            </div>
            <div className="flex-grow bg-gray-100 rounded border border-gray-300 relative overflow-hidden">
                <div ref={mapContainerRef} className="w-full h-full"></div>
            </div>
        </div>
    </div>
  );
};

export default MapPicker;