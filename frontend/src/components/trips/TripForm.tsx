import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/localStorageDB';
import MapPicker from '../common/MapPicker';

interface TripFormProps {
  setPage: (page: string) => void;
  selectedTripId: number | null;
}

const POPULAR_LOCATIONS = [
  { name: "ATU Main Campus (Tole Bi 100)", icon: "fa-university", coords: [43.2565, 76.9284] },
  { name: "ATU Dormitory #1", icon: "fa-bed", coords: [43.2389, 76.8897] },
  { name: "Almaty-2 Railway Station", icon: "fa-train", coords: [43.2775, 76.9427] },
  { name: "Sayran Bus Station", icon: "fa-bus", coords: [43.2435, 76.8576] },
  { name: "Mega Alma-Ata", icon: "fa-shopping-bag", coords: [43.2033, 76.8920] },
  { name: "Dostyk Plaza", icon: "fa-store", coords: [43.2335, 76.9567] },
];

const PREFERENCES = [
    { id: 'music', label: "Музыка", icon: "fa-music" },
    { id: 'nosmoke', label: "Не курить", icon: "fa-ban" },
    { id: 'luggage', label: "Багаж", icon: "fa-suitcase" },
    { id: 'chat', label: "Болтаем", icon: "fa-comments" },
    { id: 'silent', label: "Тишина", icon: "fa-volume-mute" },
];

const PRICE_PRESETS = [0, 200, 300, 500, 1000];

const TripForm: React.FC<TripFormProps> = ({ setPage, selectedTripId }) => {
  const { user } = useAuth();
  const isEditMode = Boolean(selectedTripId);
  
  // Extended state to hold coords
  const [formData, setFormData] = useState<{
      origin: string;
      destination: string;
      date: string;
      seats: number;
      price: number;
      description: string;
      originCoords?: [number, number];
      destCoords?: [number, number];
  }>({
      origin: '', destination: '', date: '', seats: 1, price: 0, description: ''
  });

  const [showMap, setShowMap] = useState(false);
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);
  
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);

  useEffect(() => {
      if (isEditMode && selectedTripId) {
          try {
              const trip = api.getTrip(selectedTripId);
              const d = new Date(trip.date);
              const formattedDate = !isNaN(d.getTime()) ? d.toISOString().slice(0, 16) : '';
              
              setFormData({
                  origin: trip.origin,
                  destination: trip.destination,
                  date: formattedDate,
                  seats: trip.seats,
                  price: trip.price,
                  description: trip.description,
                  originCoords: trip.originCoords,
                  destCoords: trip.destCoords
              });
              
              const foundPrefs = PREFERENCES.filter(p => trip.description.includes(p.label)).map(p => p.id);
              setSelectedPrefs(foundPrefs);

          } catch(e) {
              console.error(e);
          }
      }
  }, [isEditMode, selectedTripId]);

  // Updated handler for MapPicker
  const handleMapSelect = (data: { name: string, coords: [number, number] }) => {
      if(activeField) {
          if (activeField === 'origin') {
              setFormData({ 
                  ...formData, 
                  origin: data.name, 
                  originCoords: data.coords 
              });
          } else if (activeField === 'destination') {
              setFormData({ 
                  ...formData, 
                  destination: data.name, 
                  destCoords: data.coords 
              });
          }
      }
  };

  const openMap = (field: 'origin' | 'destination') => {
      setActiveField(field);
      setShowMap(true);
  };

  const incrementSeats = () => setFormData(prev => ({...prev, seats: Math.min(prev.seats + 1, 6)}));
  const decrementSeats = () => setFormData(prev => ({...prev, seats: Math.max(prev.seats - 1, 1)}));

  const togglePref = (prefId: string, prefLabel: string) => {
      let newPrefs;
      if (selectedPrefs.includes(prefId)) {
          newPrefs = selectedPrefs.filter(p => p !== prefId);
      } else {
          newPrefs = [...selectedPrefs, prefId];
      }
      setSelectedPrefs(newPrefs);
      
      let cleanDesc = formData.description;
      PREFERENCES.forEach(p => {
          cleanDesc = cleanDesc.replace(new RegExp(`\\s*•\\s*${p.label}`, 'g'), '');
      });
      cleanDesc = cleanDesc.trim();
      
      const tagsString = newPrefs.map(id => {
          const p = PREFERENCES.find(item => item.id === id);
          return p ? ` • ${p.label}` : '';
      }).join('');
      
      setFormData(prev => ({ ...prev, description: cleanDesc + (cleanDesc ? ' ' : '') + tagsString }));
  };

  const setDateQuick = (type: 'today' | 'tomorrow') => {
      const d = new Date();
      if (type === 'tomorrow') d.setDate(d.getDate() + 1);
      d.setMinutes(0);
      d.setMilliseconds(0);
      const offset = d.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(d.getTime() - offset)).toISOString().slice(0, 16);
      setFormData({ ...formData, date: localISOTime });
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
          setPage('home');
      } catch(e) {
          alert((e as Error).message);
      }
  };

  // Quick select helper for Popular Locations (handles both text and coords)
  const handlePopularSelect = (loc: typeof POPULAR_LOCATIONS[0]) => {
      if (!formData.origin) {
          setFormData({ 
              ...formData, 
              origin: loc.name,
              originCoords: loc.coords as [number, number]
          });
      } else {
          setFormData({ 
              ...formData, 
              destination: loc.name,
              destCoords: loc.coords as [number, number]
          });
      }
  };

  return (
      <div className="max-w-3xl mx-auto mt-8 px-4 flex-grow relative pb-12">
          {showMap && <MapPicker onSelect={handleMapSelect} onClose={() => setShowMap(false)} />}
          
          <button onClick={() => setPage('home')} className="mb-6 flex items-center text-gray-500 hover:text-[#002f6c] transition font-medium text-sm">
            <i className="fas fa-arrow-left mr-2"></i> Назад к списку
          </button>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              {/* Header */}
              <div className="bg-[#002f6c] p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-10 translate-x-10 blur-2xl"></div>
                  <h2 className="text-3xl font-bold relative z-10">
                      {isEditMode ? "Редактировать поездку" : "Создать поездку"}
                  </h2>
                  <p className="text-blue-200 relative z-10 mt-1">Заполните детали маршрута</p>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 space-y-8">
                  
                  {/* Section 1: Route */}
                  <div>
                      <h3 className="text-[#002f6c] font-bold text-sm uppercase tracking-wide mb-4 border-b border-gray-100 pb-2">
                          <i className="fas fa-route mr-2"></i> Маршрут
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                          {/* Desktop Line - visible only on md+ */}
                          <div className="hidden md:block absolute left-1/2 top-10 bottom-4 w-px bg-gray-200 -translate-x-1/2 z-0"></div>
                          
                          {/* From */}
                          <div className="relative group z-10">
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Откуда</label>
                              <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                      <i className="fas fa-map-marker-alt text-[#002f6c]"></i>
                                  </div>
                                  <input 
                                      required 
                                      type="text" 
                                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-[#002f6c] focus:border-[#002f6c] block pl-10 p-3.5 transition-colors shadow-sm" 
                                      placeholder="Например: Главный корпус ATU"
                                      value={formData.origin}
                                      onChange={e => setFormData({...formData, origin: e.target.value})}
                                  />
                                  <button 
                                      type="button" 
                                      onClick={() => openMap('origin')} 
                                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-[#002f6c] transition bg-white rounded-lg shadow-sm border border-gray-100 hover:border-gray-300"
                                      title="Выбрать на карте"
                                  >
                                      <i className="fas fa-map"></i>
                                  </button>
                              </div>
                              {formData.originCoords && (
                                  <div className="text-[10px] text-green-600 mt-1 flex items-center">
                                      <i className="fas fa-check-circle mr-1"></i> Координаты: {formData.originCoords[0].toFixed(4)}, {formData.originCoords[1].toFixed(4)}
                                  </div>
                              )}
                          </div>

                          {/* To */}
                          <div className="relative group z-10">
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Куда</label>
                              <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                      <i className="fas fa-flag-checkered text-[#bda06d]"></i>
                                  </div>
                                  <input 
                                      required 
                                      type="text" 
                                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-[#002f6c] focus:border-[#002f6c] block pl-10 p-3.5 transition-colors shadow-sm" 
                                      placeholder="Например: Dostyk Plaza"
                                      value={formData.destination}
                                      onChange={e => setFormData({...formData, destination: e.target.value})}
                                  />
                                  <button 
                                      type="button" 
                                      onClick={() => openMap('destination')} 
                                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-[#002f6c] transition bg-white rounded-lg shadow-sm border border-gray-100 hover:border-gray-300"
                                      title="Выбрать на карте"
                                  >
                                      <i className="fas fa-map"></i>
                                  </button>
                              </div>
                              {formData.destCoords && (
                                  <div className="text-[10px] text-green-600 mt-1 flex items-center">
                                      <i className="fas fa-check-circle mr-1"></i> Координаты: {formData.destCoords[0].toFixed(4)}, {formData.destCoords[1].toFixed(4)}
                                  </div>
                              )}
                          </div>
                      </div>

                      {/* Quick Tags */}
                      <div className="mt-4">
                          <p className="text-xs text-gray-400 mb-2 font-medium">Популярные места (быстрый выбор):</p>
                          <div className="flex flex-wrap gap-2">
                              {POPULAR_LOCATIONS.map(loc => (
                                  <button 
                                      key={loc.name}
                                      type="button"
                                      onClick={() => handlePopularSelect(loc)}
                                      className="px-3 py-1.5 bg-gray-50 hover:bg-white text-gray-600 hover:text-[#002f6c] rounded-lg text-xs font-medium transition-all border border-gray-200 hover:border-[#002f6c] hover:shadow-sm flex items-center"
                                  >
                                      <i className={`fas ${loc.icon} mr-1.5 opacity-70`}></i>
                                      {loc.name.split(' (')[0]}
                                  </button>
                              ))}
                          </div>
                      </div>
                  </div>

                  {/* Section 2: Details */}
                  <div>
                      <h3 className="text-[#002f6c] font-bold text-sm uppercase tracking-wide mb-4 border-b border-gray-100 pb-2">
                          <i className="fas fa-clock mr-2"></i> Детали поездки
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          
                          {/* Left Column: Date & Price */}
                          <div className="space-y-6">
                              <div>
                                  <div className="flex justify-between items-center mb-2">
                                      <label className="text-xs font-bold text-gray-500 uppercase">Дата и время</label>
                                      <div className="flex space-x-2">
                                          <button type="button" onClick={() => setDateQuick('today')} className="text-[10px] bg-blue-50 text-[#002f6c] px-2 py-0.5 rounded font-bold hover:bg-blue-100 transition">Сегодня</button>
                                          <button type="button" onClick={() => setDateQuick('tomorrow')} className="text-[10px] bg-blue-50 text-[#002f6c] px-2 py-0.5 rounded font-bold hover:bg-blue-100 transition">Завтра</button>
                                      </div>
                                  </div>
                                  <div className="relative">
                                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                          <i className="fas fa-calendar-alt text-gray-400"></i>
                                      </div>
                                      <input 
                                          required 
                                          type="datetime-local" 
                                          className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-[#002f6c] focus:border-[#002f6c] block w-full pl-10 p-3.5 shadow-sm" 
                                          value={formData.date}
                                          onChange={e => setFormData({...formData, date: e.target.value})}
                                      />
                                  </div>
                              </div>

                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Цена (за место)</label>
                                  <div className="relative mb-3">
                                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                          <i className="fas fa-tenge-sign text-gray-400"></i>
                                      </div>
                                      <input 
                                          required 
                                          type="number" 
                                          min="0" 
                                          step="50"
                                          className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-[#002f6c] focus:border-[#002f6c] block w-full pl-10 p-3.5 shadow-sm font-bold" 
                                          placeholder="0"
                                          value={formData.price}
                                          onChange={e => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                                      />
                                  </div>
                                  {/* Price Presets */}
                                  <div className="flex flex-wrap gap-2">
                                      {PRICE_PRESETS.map(p => (
                                          <button 
                                              key={p}
                                              type="button"
                                              onClick={() => setFormData({...formData, price: p})}
                                              className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                                                  formData.price === p 
                                                  ? 'bg-[#002f6c] text-white border-[#002f6c]' 
                                                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#002f6c]'
                                              }`}
                                          >
                                              {p === 0 ? 'Бесплатно' : `${p} ₸`}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          </div>

                          {/* Right Column: Seats & Prefs */}
                          <div className="space-y-6">
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Количество мест</label>
                                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                                      <span className="text-sm font-medium text-gray-700">Сколько пассажиров?</span>
                                      <div className="flex items-center space-x-3">
                                          <button 
                                              type="button" 
                                              onClick={decrementSeats}
                                              className="w-8 h-8 rounded-full bg-white shadow border border-gray-200 text-gray-600 hover:text-[#002f6c] flex items-center justify-center transition disabled:opacity-50"
                                              disabled={formData.seats <= 1}
                                          >
                                              <i className="fas fa-minus"></i>
                                          </button>
                                          <div className="w-8 text-center font-bold text-xl text-[#002f6c]">
                                              {formData.seats}
                                          </div>
                                          <button 
                                              type="button" 
                                              onClick={incrementSeats}
                                              className="w-8 h-8 rounded-full bg-white shadow border border-gray-200 text-gray-600 hover:text-[#002f6c] flex items-center justify-center transition disabled:opacity-50"
                                              disabled={formData.seats >= 6}
                                          >
                                              <i className="fas fa-plus"></i>
                                          </button>
                                      </div>
                                  </div>
                              </div>

                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Предпочтения (теги)</label>
                                  <div className="flex flex-wrap gap-2">
                                      {PREFERENCES.map(pref => (
                                          <button
                                              key={pref.id}
                                              type="button"
                                              onClick={() => togglePref(pref.id, pref.label)}
                                              className={`flex items-center px-3 py-2 rounded-lg text-xs font-medium transition border ${
                                                  selectedPrefs.includes(pref.id)
                                                  ? 'bg-blue-50 text-[#002f6c] border-[#002f6c]'
                                                  : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'
                                              }`}
                                          >
                                              <i className={`fas ${pref.icon} mr-2`}></i>
                                              {pref.label}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="mt-6">
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Комментарий водителя</label>
                          <textarea 
                              className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-[#002f6c] focus:border-[#002f6c] block w-full p-4 shadow-inner" 
                              rows={3}
                              placeholder="Детали (например: багаж, музыка, где именно встреча...)"
                              value={formData.description}
                              onChange={e => setFormData({...formData, description: e.target.value})}
                          ></textarea>
                      </div>
                  </div>

                  <div className="pt-4 flex gap-4 border-t border-gray-100">
                      <button 
                          type="button" 
                          onClick={() => setPage('home')} 
                          className="w-1/3 py-4 px-5 text-sm font-bold text-gray-600 focus:outline-none bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 hover:text-[#002f6c] transition"
                      >
                          Отмена
                      </button>
                      <button 
                          type="submit" 
                          className="w-2/3 text-white bg-gradient-to-r from-[#002f6c] to-[#1e4a8a] hover:from-[#00224f] hover:to-[#163a6e] font-bold rounded-xl text-sm px-5 py-4 focus:outline-none transition shadow-lg hover:shadow-xl flex items-center justify-center transform hover:-translate-y-0.5"
                      >
                          <i className="fas fa-paper-plane mr-2"></i>
                          {isEditMode ? "Сохранить изменения" : "Опубликовать поездку"}
                      </button>
                  </div>
              </form>
          </div>
      </div>
  );
};

export default TripForm;