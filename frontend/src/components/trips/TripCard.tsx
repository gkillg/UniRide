import React from 'react';
import { Trip } from '../../types';

interface TripCardProps {
  trip: Trip;
  onViewDetails: () => void;
}

const TripCard: React.FC<TripCardProps> = ({ trip, onViewDetails }) => {
  // Safety check
  if (!trip) return null;

  // Расчет времени до поездки
  const getTimeInfo = () => {
    try {
      const now = new Date();
      const tripDate = new Date(trip.date);
      if (isNaN(tripDate.getTime())) throw new Error("Invalid date");

      const diff = tripDate.getTime() - now.getTime();
      
      if (diff <= 0) return { 
        text: "Завершено", 
        color: "text-gray-600", 
        bg: "bg-gray-100",
        border: "border-gray-300"
      };
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);
      
      if (days > 0) return { 
        text: `${days}д ${hours % 24}ч`, 
        color: "text-green-700", 
        bg: "bg-green-50",
        border: "border-green-200"
      };
      if (hours > 0) return { 
        text: `${hours} часов`, 
        color: "text-amber-700", 
        bg: "bg-amber-50",
        border: "border-amber-200"
      };
      return { 
        text: "Скоро", 
        color: "text-red-700", 
        bg: "bg-red-50",
        border: "border-red-200"
      };
    } catch (e) {
      return { text: "N/A", color: "text-gray-500", bg: "bg-gray-100", border: "border-gray-200" };
    }
  };

  // Расчет заполненности (макс 5 мест)
  const getSeatInfo = () => {
    const maxSeats = 5;
    const takenSeats = Math.max(0, maxSeats - trip.seats);
    const percentage = Math.min(100, (takenSeats / maxSeats) * 100);
    
    let color = "bg-green-500";
    if (percentage >= 80) color = "bg-red-500";
    else if (percentage >= 50) color = "bg-amber-500";
    
    return { takenSeats, maxSeats, percentage, color };
  };

  const timeInfo = getTimeInfo();
  const seatInfo = getSeatInfo();

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col">
      {/* Верхняя полоса статуса */}
      <div className={`h-1 ${timeInfo.bg}`}></div>
      
      <div className="p-6 flex-grow flex flex-col">
        {/* Заголовок и время */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 mr-2">
            <h3 className="text-xl font-bold text-gray-900 line-clamp-1" title={trip.destination}>{trip.destination}</h3>
            <div className="flex items-center mt-1 text-gray-500">
              <i className="fas fa-map-marker-alt text-sm mr-2 text-[#bda06d]"></i>
              <span className="text-sm line-clamp-1" title={trip.origin}>{trip.origin}</span>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full whitespace-nowrap ${timeInfo.bg} ${timeInfo.border}`}>
            <span className={`text-xs font-semibold ${timeInfo.color}`}>
              {timeInfo.text}
            </span>
          </div>
        </div>

        {/* Маршрут визуализация */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-xs font-medium text-gray-500 uppercase">Отправление</span>
            </div>
            <div className="flex items-center">
              <span className="text-xs font-medium text-gray-500 uppercase">Назначение</span>
              <div className="w-3 h-3 rounded-full bg-[#002f6c] ml-2"></div>
            </div>
          </div>
          <div className="relative h-1 bg-gray-200 rounded-full">
            <div className={`h-1 rounded-full ${seatInfo.color}`} style={{ width: '70%' }}></div>
          </div>
        </div>

        {/* Детали поездки */}
        <div className="grid grid-cols-2 gap-4 mb-6 mt-auto">
          <div className="bg-gray-50 p-3 rounded-xl">
            <div className="text-xs text-gray-500 mb-1">Дата и время</div>
            <div className="font-semibold text-gray-900 text-sm">
              {new Date(trip.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
              <span className="block text-xs text-gray-500 font-normal">
                {new Date(trip.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-xl">
            <div className="text-xs text-gray-500 mb-1">Свободные места</div>
            <div className="flex items-center">
              <div className="font-semibold text-gray-900 mr-2 text-sm">{trip.seats}</div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${seatInfo.color}`}
                    style={{ width: `${seatInfo.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Водитель и цена */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-[#002f6c] rounded-full flex items-center justify-center text-white font-bold mr-3 shadow-sm">
              {trip.driverName?.charAt(0) || 'В'}
            </div>
            <div>
              <div className="font-medium text-gray-900 text-sm max-w-[100px] truncate" title={trip.driverName}>{trip.driverName || 'Водитель'}</div>
              <div className="flex items-center text-xs text-gray-500">
                <i className="fas fa-star text-amber-400 mr-1"></i>
                <span>{trip.driverRating?.toFixed(1) || '5.0'}</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xl font-bold text-[#002f6c]">
              {trip.price === 0 ? "Бесплатно" : `${trip.price} ₸`}
            </div>
            <div className="text-[10px] text-gray-500">за место</div>
          </div>
        </div>
      </div>

      {/* Кнопка действий */}
      <div className="px-6 pb-6 pt-0">
        <button 
          onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
          className="w-full bg-[#002f6c] text-white font-semibold py-3 rounded-xl hover:bg-blue-900 transition-colors flex items-center justify-center text-sm"
        >
          <i className="fas fa-eye mr-2"></i>
          Посмотреть детали
        </button>
      </div>
    </div>
  );
};

export default TripCard;