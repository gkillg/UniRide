import React, { useState, useEffect, useMemo } from 'react';
import { Trip } from '../../types';
import { api } from '../../utils/localStorageDB';
import TripCard from './TripCard';
import { useAuth } from '../../context/AuthContext';

interface TripListProps {
  setPage: (page: string) => void;
  setSelectedTripId: (id: number | null) => void;
}

const TripList: React.FC<TripListProps> = ({ setPage, setSelectedTripId }) => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  
  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState(""); // Immediate input
  const [filter, setFilter] = useState(""); // Debounced value for filtering
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [priceFilter, setPriceFilter] = useState<string | null>(null);
  const [seatsFilter, setSeatsFilter] = useState<string | null>(null);
  
  // UX States
  const [isLoading, setIsLoading] = useState(true);
  const [visibleTrips, setVisibleTrips] = useState(6);
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'seats'>('date');

  // Initial Load
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setIsLoading(true);
        // Simulate network delay for skeleton demonstration
        await new Promise(resolve => setTimeout(resolve, 800));
        const loadedTrips = api.getTrips();
        if (Array.isArray(loadedTrips)) {
          setTrips(loadedTrips);
        } else {
          setTrips([]);
        }
      } catch (e) {
        console.error("Failed to load trips", e);
        setTrips([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrips();
  }, []);

  // Debounce Logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilter(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Optimized Filtering & Sorting
  const sortedAndFilteredTrips = useMemo(() => {
    // 1. Filtering
    const filtered = trips.filter(trip => {
      const tripDate = new Date(trip.date);
      const today = new Date();

      // ALWAYS Filter out past trips from the main list
      // This fixes the issue where "Available" trips were actually completed
      if (tripDate < today) return false;

      // Text Filter
      const matchesText = filter === "" || 
        trip.destination.toLowerCase().includes(filter.toLowerCase()) || 
        trip.origin.toLowerCase().includes(filter.toLowerCase()) ||
        trip.description?.toLowerCase().includes(filter.toLowerCase());
      
      if (!matchesText) return false;
      
      // Date Filter
      if (dateFilter === 'today') {
        const isToday = tripDate.toDateString() === today.toDateString();
        if (!isToday) return false;
      }
      
      if (dateFilter === 'tomorrow') {
        const tomorrowDate = new Date(today);
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        const isTomorrow = tripDate.toDateString() === tomorrowDate.toDateString();
        if (!isTomorrow) return false;
      }
      
      if (dateFilter === 'week') {
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        if (tripDate < today || tripDate > nextWeek) return false;
      }
      
      // Price Filter
      if (priceFilter === 'free' && trip.price > 0) return false;
      if (priceFilter === '500' && trip.price > 500) return false;
      
      // Seats Filter
      if (seatsFilter === '2plus' && trip.seats < 2) return false;
      
      return true;
    });

    // 2. Sorting
    return filtered.sort((a, b) => {
      switch(sortBy) {
        case 'date': return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'price': return a.price - b.price;
        case 'seats': return b.seats - a.seats; // Most seats first
        default: return 0;
      }
    });
  }, [trips, filter, dateFilter, priceFilter, seatsFilter, sortBy]);

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
            <div className="flex-1 relative w-full group">
              <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#002f6c] transition-colors"></i>
              <input 
                type="text" 
                placeholder="Куда направляетесь? (например: 'MEGA' или 'Общежитие')" 
                className="w-full pl-12 pr-4 py-4 text-gray-900 bg-white/95 backdrop-blur-sm border-none rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-[#bda06d] focus:bg-white placeholder-gray-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Поиск поездок"
              />
            </div>
            <button 
                onClick={() => {
                    setFilter(searchTerm); // Force immediate search
                    console.log('Search clicked');
                }}
                className="bg-[#bda06d] hover:bg-[#a38855] text-white font-bold px-8 py-4 rounded-xl transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap flex items-center justify-center min-w-[140px]"
                aria-label="Найти поездки"
            >
              <i className="fas fa-search mr-2"></i>
              Найти
            </button>
          </div>
          
          {/* Quick Filters */}
          <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => setDateFilter('today')} 
                  className={`px-4 py-2 rounded-full transition flex items-center ${dateFilter === 'today' ? 'bg-white text-[#002f6c]' : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'}`}
                  title="Показать поездки на сегодня"
                >
                    <i className="fas fa-calendar-day mr-2"></i>Сегодня
                </button>
                <button 
                  onClick={() => setDateFilter('tomorrow')} 
                  className={`px-4 py-2 rounded-full transition flex items-center ${dateFilter === 'tomorrow' ? 'bg-white text-[#002f6c]' : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'}`}
                  title="Показать поездки на завтра"
                >
                    <i className="fas fa-calendar-alt mr-2"></i>Завтра
                </button>
                <button 
                  onClick={() => setDateFilter('week')} 
                  className={`px-4 py-2 rounded-full transition flex items-center ${dateFilter === 'week' ? 'bg-white text-[#002f6c]' : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'}`}
                  title="Показать поездки на этой неделе"
                >
                    <i className="fas fa-calendar-week mr-2"></i>Эта неделя
                </button>

                <button onClick={() => setPriceFilter('free')} className={`px-4 py-2 rounded-full transition flex items-center ${priceFilter === 'free' ? 'bg-white text-[#002f6c]' : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'}`}>
                    <i className="fas fa-gift mr-2"></i>Бесплатно
                </button>
                <button onClick={() => setPriceFilter('500')} className={`px-4 py-2 rounded-full transition flex items-center ${priceFilter === '500' ? 'bg-white text-[#002f6c]' : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'}`}>
                    <i className="fas fa-money-bill-wave mr-2"></i>До 500 ₸
                </button>

                <button onClick={() => setSeatsFilter('2plus')} className={`px-4 py-2 rounded-full transition flex items-center ${seatsFilter === '2plus' ? 'bg-white text-[#002f6c]' : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'}`}>
                    <i className="fas fa-user-friends mr-2"></i>2+ места
                </button>

                {(dateFilter || priceFilter || seatsFilter || filter) && (
                    <button 
                    onClick={() => {
                        setDateFilter(null);
                        setPriceFilter(null);
                        setSeatsFilter(null);
                        setFilter('');
                        setSearchTerm('');
                    }}
                    className="px-4 py-2 rounded-full transition bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border border-white/30"
                    >
                    <i className="fas fa-times mr-2"></i>Сбросить
                    </button>
                )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/20">
                <span className="text-sm text-blue-200">Сортировать:</span>
                <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent text-white font-bold text-sm focus:outline-none cursor-pointer"
                >
                    <option value="date" className="text-gray-900">По дате</option>
                    <option value="price" className="text-gray-900">По цене</option>
                    <option value="seats" className="text-gray-900">По местам</option>
                </select>
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
            <h2 className="text-2xl font-bold text-gray-800">
                {isLoading ? 'Загрузка поездок...' : `Доступные поездки (${sortedAndFilteredTrips.length})`}
            </h2>
            {user && (
                <button 
                    onClick={() => setPage('create-trip')}
                    className="text-[#002f6c] font-bold text-sm hover:underline flex items-center"
                >
                    <i className="fas fa-plus-circle mr-2"></i> Создать поездку
                </button>
            )}
        </div>

        {isLoading ? (
            // Skeleton Loading State
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 animate-pulse h-full min-h-[300px] flex flex-col">
                    <div className="h-6 bg-gray-200 rounded mb-4 w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-6 w-1/2"></div>
                    <div className="h-2 bg-gray-200 rounded-full mb-8"></div>
                    <div className="grid grid-cols-2 gap-3 mt-auto">
                        <div className="h-16 bg-gray-100 rounded-xl"></div>
                        <div className="h-16 bg-gray-100 rounded-xl"></div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-200 rounded-full mr-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                        <div className="h-6 bg-gray-200 rounded w-12"></div>
                    </div>
                </div>
                ))}
            </div>
        ) : sortedAndFilteredTrips.length === 0 ? (
            // Empty State
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300 shadow-sm">
                <div className="animate-bounce w-20 h-20 bg-gradient-to-r from-[#002f6c] to-[#bda06d] rounded-full flex items-center justify-center mx-auto mb-4 text-white text-3xl">
                    <i className="fas fa-car"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Ничего не найдено</h3>
                <div className="max-w-md mx-auto">
                    <p className="text-gray-500 mb-6">
                        {filter 
                            ? 'Мы не нашли поездок, соответствующих вашему запросу.' 
                            : 'На данный момент нет активных будущих поездок, соответствующих критериям.'}
                    </p>
                    <ul className="text-left text-gray-500 space-y-2 mb-6 max-w-xs mx-auto">
                        <li className="flex items-center">
                        <i className="fas fa-check text-green-500 mr-2"></i>
                        Использовать другие ключевые слова
                        </li>
                        <li className="flex items-center">
                        <i className="fas fa-check text-green-500 mr-2"></i>
                        Сбросить все фильтры
                        </li>
                        <li className="flex items-center">
                        <i className="fas fa-check text-green-500 mr-2"></i>
                        Создать свою поездку
                        </li>
                    </ul>
                    <button 
                        onClick={() => { setFilter(''); setSearchTerm(''); setDateFilter(null); setPriceFilter(null); setSeatsFilter(null); }} 
                        className="text-[#002f6c] font-bold hover:underline bg-blue-50 px-6 py-2 rounded-full"
                    >
                        Сбросить все фильтры
                    </button>
                </div>
            </div>
        ) : (
            // Results Grid
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedAndFilteredTrips.slice(0, visibleTrips).map(trip => (
                    <TripCard 
                    key={trip.id} 
                    trip={trip} 
                    onViewDetails={() => { setSelectedTripId(trip.id); setPage('trip-detail'); }} 
                    />
                ))}
                </div>

                {/* Pagination / Load More */}
                {sortedAndFilteredTrips.length > visibleTrips && (
                    <div className="col-span-full text-center mt-10">
                        <button 
                        onClick={() => setVisibleTrips(prev => prev + 6)}
                        className="px-8 py-3 bg-white border border-[#002f6c] text-[#002f6c] font-bold rounded-xl hover:bg-[#002f6c] hover:text-white transition-colors shadow-sm"
                        >
                        Показать еще
                        </button>
                        <p className="text-gray-400 text-xs mt-2">
                            Показано {visibleTrips} из {sortedAndFilteredTrips.length}
                        </p>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};

export default TripList;