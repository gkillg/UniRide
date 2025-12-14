import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/localStorageDB';
import MapPicker from '../common/MapPicker';

interface TripFormProps {
  setPage: (page: string) => void;
  selectedTripId: number | null;
}

const POPULAR_LOCATIONS = [
  { name: "ATU Main Campus (Tole Bi 100)", coords: [43.2565, 76.9284] },
  { name: "ATU Dormitory #1", coords: [43.2389, 76.8897] },
  { name: "Almaty-2 Railway Station", coords: [43.2775, 76.9427] },
  { name: "Sayran Bus Station", coords: [43.2435, 76.8576] },
  { name: "Mega Alma-Ata", coords: [43.2033, 76.8920] },
  { name: "Dostyk Plaza", coords: [43.2335, 76.9567] },
];

const TripForm: React.FC<TripFormProps> = ({ setPage, selectedTripId }) => {
  const { user } = useAuth();
  const isEditMode = Boolean(selectedTripId);
  
  const [formData, setFormData] = useState({
      origin: '', destination: '', date: '', seats: 1, price: 0, description: ''
  });
  const [showMap, setShowMap] = useState(false);
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);

  useEffect(() => {
      if (isEditMode && selectedTripId) {
          try {
              const trip = api.getTrip(selectedTripId);
              setFormData({
                  origin: trip.origin,
                  destination: trip.destination,
                  date: trip.date,
                  seats: trip.seats,
                  price: trip.price,
                  description: trip.description
              });
          } catch(e) {
              console.error(e);
          }
      }
  }, [isEditMode, selectedTripId]);

  const handleMapSelect = (location: string) => {
      if(activeField) {
          setFormData({ ...formData, [activeField]: location });
      }
  };

  const openMap = (field: 'origin' | 'destination') => {
      setActiveField(field);
      setShowMap(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;

      try {
          if (isEditMode && selectedTripId) {
              api.updateTrip(selectedTripId, formData, user.id);
          } else {
              api.createTrip(formData, user.id);
          }
          alert(isEditMode ? "Trip Updated" : "Trip Created");
          setPage('home');
      } catch(e) {
          alert((e as Error).message);
      }
  };

  return (
      <div className="max-w-xl mx-auto mt-12 px-4 flex-grow relative">
          {showMap && <MapPicker onSelect={handleMapSelect} onClose={() => setShowMap(false)} />}
          
          <div className="bg-white p-10 rounded-lg shadow-xl border-t-4 border-[#002f6c]">
              <h2 className="text-2xl font-bold text-[#002f6c] mb-6 text-center uppercase tracking-wide">{isEditMode ? "Edit Trip Details" : "Create New Trip"}</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Popular Places Quick Select */}
                  <div className="bg-gray-50 p-3 rounded border border-gray-200">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-2">Quick Select Popular Places:</p>
                      <div className="flex flex-wrap gap-2">
                          {POPULAR_LOCATIONS.map(loc => (
                              <button type="button" key={loc.name} 
                                  onClick={() => {
                                      if(!formData.origin) setFormData({...formData, origin: loc.name});
                                      else if(!formData.destination) setFormData({...formData, destination: loc.name});
                                  }}
                                  className="bg-white border border-[#bda06d] text-[#002f6c] px-2 py-1 text-xs rounded hover:bg-[#bda06d] hover:text-white transition"
                              >
                                  {loc.name}
                              </button>
                          ))}
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                      <div>
                          <label className="block text-gray-700 text-xs font-bold uppercase mb-2">From</label>
                          <div className="flex">
                              <input required type="text" className="w-full border-gray-300 border-l border-t border-b rounded-l p-3 focus:ring-1 focus:ring-[#bda06d] focus:outline-none transition text-sm" 
                                  value={formData.origin}
                                  onChange={e => setFormData({...formData, origin: e.target.value})} placeholder="e.g. ATU Campus" />
                              <button type="button" onClick={() => openMap('origin')} className="bg-[#002f6c] text-white px-3 rounded-r hover:bg-blue-800"><i className="fas fa-map-marker-alt"></i></button>
                          </div>
                      </div>
                      <div>
                          <label className="block text-gray-700 text-xs font-bold uppercase mb-2">To</label>
                          <div className="flex">
                              <input required type="text" className="w-full border-gray-300 border-l border-t border-b rounded-l p-3 focus:ring-1 focus:ring-[#bda06d] focus:outline-none transition text-sm" 
                                  value={formData.destination}
                                  onChange={e => setFormData({...formData, destination: e.target.value})} placeholder="e.g. Dostyk Plaza" />
                              <button type="button" onClick={() => openMap('destination')} className="bg-[#002f6c] text-white px-3 rounded-r hover:bg-blue-800"><i className="fas fa-map-marker-alt"></i></button>
                          </div>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                      <div>
                          <label className="block text-gray-700 text-xs font-bold uppercase mb-2">Date & Time</label>
                          <input required type="datetime-local" className="w-full border-gray-300 border rounded p-3 focus:ring-1 focus:ring-[#bda06d] focus:outline-none transition text-sm" 
                              value={formData.date}
                              onChange={e => setFormData({...formData, date: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-gray-700 text-xs font-bold uppercase mb-2">Seats</label>
                          <input required type="number" min="1" className="w-full border-gray-300 border rounded p-3 focus:ring-1 focus:ring-[#bda06d] focus:outline-none transition" 
                              value={formData.seats}
                              onChange={e => setFormData({...formData, seats: parseInt(e.target.value)})} />
                      </div>
                  </div>
                  
                  <div>
                      <label className="block text-gray-700 text-xs font-bold uppercase mb-2">Price (KZT)</label>
                      <input required type="number" min="0" className="w-full border-gray-300 border rounded p-3 focus:ring-1 focus:ring-[#bda06d] focus:outline-none transition" 
                              value={formData.price}
                              onChange={e => setFormData({...formData, price: parseInt(e.target.value)})} />
                  </div>
                  
                  <div>
                      <label className="block text-gray-700 text-xs font-bold uppercase mb-2">Description</label>
                      <textarea className="w-full border-gray-300 border rounded p-3 focus:ring-1 focus:ring-[#bda06d] focus:outline-none transition" rows={3}
                          placeholder="Add details (luggage, music, etc.)"
                          value={formData.description}
                          onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setPage('home')} className="w-1/3 border border-gray-300 text-gray-600 font-bold py-3 rounded hover:bg-gray-50 uppercase text-xs">Cancel</button>
                      <button type="submit" className="w-2/3 bg-[#002f6c] text-white font-bold py-3 rounded hover:bg-blue-900 transition shadow-lg uppercase text-xs tracking-wider">
                          {isEditMode ? "Save Changes" : "Publish Trip"}
                      </button>
                  </div>
              </form>
          </div>
      </div>
  );
};

export default TripForm;
