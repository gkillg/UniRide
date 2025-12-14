import React, { useState, useEffect } from 'react';
import { Trip } from '../../types';
import { api } from '../../utils/localStorageDB';
import TripCard from './TripCard';

interface TripListProps {
  setPage: (page: string) => void;
  setSelectedTripId: (id: number | null) => void;
}

const TripList: React.FC<TripListProps> = ({ setPage, setSelectedTripId }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filter, setFilter] = useState("");
  
  // States for filters
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [priceFilter, setPriceFilter] = useState<string | null>(null);
  const [seatsFilter, setSeatsFilter] = useState<string | null>(null);

  useEffect(() => {
    setTrips(api.getTrips());
  }, []);

  const filteredTrips = trips.filter(trip => {
    // 1. Text Filter (Destination/Origin/Description)
    const matchesText = filter === "" || 
      trip.destination.toLowerCase().includes(filter.toLowerCase()) || 
      trip.origin.toLowerCase().includes(filter.toLowerCase()) ||
      trip.description?.toLowerCase().includes(filter.toLowerCase());
    
    if (!matchesText) return false;
    
    // 2. Date Filter
    const tripDate = new Date(trip.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    if (dateFilter === 'today') {
      const isToday = tripDate >= today && tripDate < tomorrow;
      if (!isToday) return false;
    }
    
    if (dateFilter === 'tomorrow') {
      const isTomorrow = tripDate >= tomorrow && tripDate < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
      if (!isTomorrow) return false;
    }
    
    if (dateFilter === 'week') {
      if (tripDate < today || tripDate > nextWeek) return false;
    }
    
    // 3. Price Filter
    if (priceFilter === 'free' && trip.price > 0) return false;
    if (priceFilter === '500' && trip.price > 500) return false;
    
    // 4. Seats Filter
    if (seatsFilter === '2plus' && trip.seats < 2) return false;
    
    return true;
  });

  // Helper functions for display text
  const getDateFilterText = () => {
    switch(dateFilter) {
      case 'today': return 'Сегодня';
      case 'tomorrow': return 'Завтра';
      case 'week': return 'Эта неделя';
      default: return 'Любая дата';
    }
  };

  const getPriceFilterText = () => {
    switch(priceFilter) {
      case 'free': return 'Только бесплатные';
      case '500': return 'До 500 ₸';
      default: return 'Любая цена';
    }
  };

  const getSeatsFilterText = () => {
    switch(seatsFilter) {
      case '2plus': return '2+ свободных места';
      default: return 'Любое кол-во мест';
    }
  };

  return (
    <div className="max-w-7xl mx-auto mt-6 px-4 pb-12 flex-grow">
      
      {/* New Hero Header */}
      <div className="bg-gradient-atu rounded-3xl p-8 mb-10 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#bda06d]/20 rounded-full translate-y-24 -translate-x-16 blur-2xl"></div>
        
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-3 tracking-tight">Найдите свою поездку</h1>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl font-light">
            Соединяйтесь с другими студентами ATU. Экономьте деньги и помогайте окружающей среде.
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="flex-1 relative w-full">
              <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input 
                type="text" 
                placeholder="Куда направляетесь? (например: 'MEGA' или 'Общежитие')" 
                className="w-full pl-12 pr-4 py-4 text-gray-900 bg-white/95 backdrop-blur-sm border-none rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-[#bda06d] focus:bg-white placeholder-gray-500"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      console.log('Поиск по тексту:', filter);
                    }
                }}
              />
            </div>
            <button 
                onClick={() => {
                    console.log('Выполняется поиск');
                }}
                className="bg-[#bda06d] hover:bg-[#a38855] text-white font-bold px-8 py-4 rounded-xl transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap flex items-center justify-center min-w-[140px]"
            >
              <i className="fas fa-search mr-2"></i>
              Найти
            </button>
          </div>
          
          {/* Quick Filters */}
          <div className="mt-6">
            <div className="flex flex-wrap gap-3">
                {/* Date Filters */}
                <button onClick={() => setDateFilter('today')} className={`px-4 py-2 rounded-full transition flex items-center ${dateFilter === 'today' ? 'bg-white text-[#002f6c]' : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'}`}>
                    <i className="fas fa-calendar-day mr-2"></i>Сегодня
                </button>
                <button onClick={() => setDateFilter('tomorrow')} className={`px-4 py-2 rounded-full transition flex items-center ${dateFilter === 'tomorrow' ? 'bg-white text-[#002f6c]' : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'}`}>
                    <i className="fas fa-calendar-alt mr-2"></i>Завтра
                </button>
                <button onClick={() => setDateFilter('week')} className={`px-4 py-2 rounded-full transition flex items-center ${dateFilter === 'week' ? 'bg-white text-[#002f6c]' : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'}`}>
                    <i className="fas fa-calendar-week mr-2"></i>Эта неделя
                </button>

                {/* Price Filters */}
                <button onClick={() => setPriceFilter('free')} className={`px-4 py-2 rounded-full transition flex items-center ${priceFilter === 'free' ? 'bg-white text-[#002f6c]' : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'}`}>
                    <i className="fas fa-gift mr-2"></i>Бесплатно
                </button>
                <button onClick={() => setPriceFilter('500')} className={`px-4 py-2 rounded-full transition flex items-center ${priceFilter === '500' ? 'bg-white text-[#002f6c]' : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'}`}>
                    <i className="fas fa-money-bill-wave mr-2"></i>До 500 ₸
                </button>

                {/* Seats Filter */}
                <button onClick={() => setSeatsFilter('2plus')} className={`px-4 py-2 rounded-full transition flex items-center ${seatsFilter === '2plus' ? 'bg-white text-[#002f6c]' : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'}`}>
                    <i className="fas fa-user-friends mr-2"></i>2+ места
                </button>

                {/* Reset Button */}
                {(dateFilter || priceFilter || seatsFilter || filter) && (
                    <button 
                    onClick={() => {
                        setDateFilter(null);
                        setPriceFilter(null);
                        setSeatsFilter(null);
                        setFilter('');
                    }}
                    className="px-4 py-2 rounded-full transition bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border border-white/30"
                    >
                    <i className="fas fa-times mr-2"></i>Сбросить
                    </button>
                )}
            </div>
          </div>

          {/* Active Filters Display */}
          {(dateFilter || priceFilter || seatsFilter) && (
            <div className="mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 inline-block">
                <div className="text-sm text-white/80 mb-1 font-medium">Активные фильтры:</div>
                <div className="flex flex-wrap gap-2">
                {dateFilter && (
                    <span className="px-3 py-1 bg-white/20 rounded-full text-white text-sm flex items-center">
                    <i className="fas fa-calendar-alt mr-1"></i> {getDateFilterText()}
                    <button onClick={() => setDateFilter(null)} className="ml-2 text-white/70 hover:text-white"><i className="fas fa-times text-xs"></i></button>
                    </span>
                )}
                {priceFilter && (
                    <span className="px-3 py-1 bg-white/20 rounded-full text-white text-sm flex items-center">
                    <i className="fas fa-money-bill-wave mr-1"></i> {getPriceFilterText()}
                    <button onClick={() => setPriceFilter(null)} className="ml-2 text-white/70 hover:text-white"><i className="fas fa-times text-xs"></i></button>
                    </span>
                )}
                {seatsFilter && (
                    <span className="px-3 py-1 bg-white/20 rounded-full text-white text-sm flex items-center">
                    <i className="fas fa-user-friends mr-1"></i> {getSeatsFilterText()}
                    <button onClick={() => setSeatsFilter(null)} className="ml-2 text-white/70 hover:text-white"><i className="fas fa-times text-xs"></i></button>
                    </span>
                )}
                </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Доступные поездки</h2>
            <button 
                onClick={() => setPage('create-trip')}
                className="text-[#002f6c] font-bold text-sm hover:underline flex items-center"
            >
                <i className="fas fa-plus-circle mr-2"></i> Создать поездку
            </button>
        </div>

        {filteredTrips.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 text-3xl">
                    <i className="fas fa-car-side"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Поездки не найдены</h3>
                <p className="text-gray-500 mb-6">Мы не нашли поездок, соответствующих вашему запросу.</p>
                <button onClick={() => { setFilter(''); setDateFilter(null); setPriceFilter(null); setSeatsFilter(null); }} className="text-[#002f6c] font-bold hover:underline">Сбросить фильтры</button>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map(trip => (
                <TripCard 
                key={trip.id} 
                trip={trip} 
                onViewDetails={() => { setSelectedTripId(trip.id); setPage('trip-detail'); }} 
                />
            ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default TripList;