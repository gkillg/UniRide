import React, { useEffect, useRef } from 'react';
import * as L from 'leaflet';

// API Key provided for 2GIS
const API_KEY = "5d98480b-bdc3-45fb-bb82-bd59a18d07f0";

interface MapPickerProps {
  onSelect: (data: { name: string; coords: [number, number] }) => void;
  onClose: () => void;
  initialCoords?: [number, number]; // Added prop for initial centering
}

const MapPicker: React.FC<MapPickerProps> = ({ onSelect, onClose, initialCoords }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Default center (Almaty)
  const defaultCenter: [number, number] = [43.2389, 76.8897];
  const center = initialCoords || defaultCenter;

  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Prevent double initialization
    if (mapInstanceRef.current) return;

    // Initialize Leaflet Map
    const map = L.map(mapContainerRef.current).setView(center, 13);
    mapInstanceRef.current = map;

    // 2GIS Tiles Integration
    L.tileLayer('https://tile{s}.maps.2gis.com/tiles?x={x}&y={y}&z={z}&v=1', {
      subdomains: ['0', '1', '2', '3'],
      attribution: '&copy; <a href="http://2gis.ru">2GIS</a>',
      maxZoom: 18,
    }).addTo(map);

    // Add initial marker if coords exist
    if (initialCoords) {
        markerRef.current = L.marker(initialCoords).addTo(map);
    }

    // Map Click Event with Reverse Geocoding
    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      
      // Update Marker position
      if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
      } else {
          markerRef.current = L.marker([lat, lng]).addTo(map);
      }

      // Show loading state (cursor)
      map.getContainer().style.cursor = 'wait';

      try {
          // Call 2GIS Geocoding API
          const response = await fetch(`https://catalog.api.2gis.com/3.0/items/geocode?lat=${lat}&lon=${lng}&fields=items.point&key=${API_KEY}`);
          const data = await response.json();
          
          const item = data.result?.items?.[0];
          // Prefer full_name, fallback to name, fallback to coords formatted
          const address = item?.full_name || item?.name || `Координаты: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          
          // Reset cursor
          map.getContainer().style.cursor = '';

          // Confirm selection
          // Slight timeout to allow marker to move visually before alert
          setTimeout(() => {
              if(confirm(`Выбрать этот адрес?\n${address}`)) {
                onSelect({
                    name: address,
                    coords: [lat, lng]
                });
                onClose(); // Close modal after selection
              }
          }, 100);

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
  }, []); // Only run once on mount

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-fade-in">
            <div className="bg-[#002f6c] text-white p-4 flex justify-between items-center shadow-md z-10">
                 <div>
                     <h3 className="text-lg font-bold flex items-center">
                        <i className="fas fa-map-marked-alt mr-2"></i> Выберите место
                     </h3>
                     <p className="text-xs text-blue-200">Используются карты 2GIS. Кликните для выбора адреса.</p>
                 </div>
                 <button onClick={onClose} className="text-white/80 hover:text-white transition w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10">
                     <i className="fas fa-times text-xl"></i>
                 </button>
            </div>
            <div className="flex-grow bg-gray-100 relative">
                <div ref={mapContainerRef} className="w-full h-full outline-none"></div>
            </div>
        </div>
    </div>
  );
};

export default MapPicker;