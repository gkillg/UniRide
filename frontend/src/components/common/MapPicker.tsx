import React, { useEffect, useRef } from 'react';

interface MapPickerProps {
  onSelect: (location: string) => void;
  onClose: () => void;
}

const MapPicker: React.FC<MapPickerProps> = ({ onSelect, onClose }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
    if (!mapContainerRef.current || !(window as any).L) return;

    const L = (window as any).L; // Используем глобальный L
    const map = L.map(mapContainerRef.current).setView([43.2389, 76.8897], 13);
  
    // Add OSM Tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Map Click Event
    map.on('click', async (e: any) => {
      const { lat, lng } = e.latlng;
      
      const locationName = `Selected Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      
      if(confirm(`Select this location?\n${locationName}`)) {
        onSelect(locationName);
        onClose();
      }
    });

    return () => {
      map.remove();
    };
  }, [onSelect, onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white p-4 rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-bold text-[#002f6c]">Select Location on Map</h3>
                 <button onClick={onClose} className="text-gray-500 hover:text-red-500"><i className="fas fa-times text-2xl"></i></button>
            </div>
            <div className="flex-grow bg-gray-100 rounded border border-gray-300 relative overflow-hidden">
                <div ref={mapContainerRef} className="w-full h-full"></div>
            </div>
            <div className="mt-2 text-xs text-gray-500 text-center">
                Click anywhere on the map to select a point.
            </div>
        </div>
    </div>
  );
};

export default MapPicker;
