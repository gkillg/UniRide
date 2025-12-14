import React from 'react';
import { Trip } from '../../types';

interface TripCardProps {
  trip: Trip;
  onViewDetails: () => void;
}

const TripCard: React.FC<TripCardProps> = ({ trip, onViewDetails }) => {
  // Time calculation logic
  const getTimeInfo = () => {
    const now = new Date();
    const tripDate = new Date(trip.date);
    const diff = tripDate.getTime() - now.getTime();
    
    if (diff <= 0) return { 
      text: "Completed", 
      color: "text-gray-600", 
      bg: "bg-gray-100",
      border: "border-gray-300"
    };
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return { 
      text: `${days}d ${hours % 24}h`, 
      color: "text-green-700", 
      bg: "bg-green-50",
      border: "border-green-200"
    };
    if (hours > 0) return { 
      text: `${hours} hours`, 
      color: "text-amber-700", 
      bg: "bg-amber-50",
      border: "border-amber-200"
    };
    return { 
      text: "Soon", 
      color: "text-red-700", 
      bg: "bg-red-50",
      border: "border-red-200"
    };
  };

  // Seat calculation logic (assuming max 4-5 seats for visual bar)
  const getSeatInfo = () => {
    const maxSeats = trip.seats + (trip.bookings?.filter(b => b.status === 'confirmed').length || 0);
    // Fallback if maxSeats is 0 or weird
    const safeMax = maxSeats || 4; 
    const takenSeats = safeMax - trip.seats;
    const percentage = (takenSeats / safeMax) * 100;
    
    let color = "bg-green-500";
    if (percentage >= 100) color = "bg-red-500";
    else if (percentage >= 80) color = "bg-amber-500";
    
    return { takenSeats, maxSeats: safeMax, percentage, color };
  };

  const timeInfo = getTimeInfo();
  const seatInfo = getSeatInfo();

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col">
      {/* Top Status Bar */}
      <div className={`h-1 ${timeInfo.bg}`}></div>
      
      <div className="p-6 flex-grow flex flex-col">
        {/* Header */}
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

        {/* Route Visualization */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-[#bda06d] mr-2"></div>
              <span className="text-xs font-medium text-gray-500 uppercase">From</span>
            </div>
            <div className="flex items-center">
              <span className="text-xs font-medium text-gray-500 uppercase">To</span>
              <div className="w-2.5 h-2.5 rounded-full bg-[#002f6c] ml-2"></div>
            </div>
          </div>
          <div className="relative h-1.5 bg-gray-100 rounded-full w-full">
             {/* Progress bar representing seats taken */}
            <div className={`h-1.5 rounded-full ${seatInfo.color} transition-all duration-500`} style={{ width: `${seatInfo.percentage}%` }}></div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6 mt-auto">
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
            <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Date & Time</div>
            <div className="font-semibold text-gray-900 text-sm">
              {new Date(trip.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
              <span className="block text-xs text-gray-500 font-normal">
                {new Date(trip.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
            <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Availability</div>
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-900 text-sm">{trip.seats} left</div>
              <i className="fas fa-users text-gray-300 text-sm"></i>
            </div>
          </div>
        </div>

        {/* Driver & Price Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-[#002f6c] to-[#1e4a8a] rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 shadow-sm">
              {trip.driverName?.charAt(0) || 'D'}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xs text-gray-900 max-w-[80px] truncate">{trip.driverName || 'Driver'}</span>
              <div className="flex items-center text-[10px] text-gray-500">
                <i className="fas fa-star text-amber-400 mr-0.5"></i>
                <span>{trip.driverRating?.toFixed(1) || '5.0'}</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-bold text-[#002f6c]">
              {trip.price === 0 ? "Free" : `${trip.price} ₸`}
            </div>
          </div>
        </div>
      </div>

      {/* Hover Action Overlay (Desktop) / Bottom Button (Mobile) */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
        <button 
          onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
          className="w-full bg-white border border-[#002f6c] text-[#002f6c] hover:bg-[#002f6c] hover:text-white font-semibold py-2 rounded-lg transition-colors text-sm flex items-center justify-center group"
        >
          <span>View Details</span>
          <i className="fas fa-arrow-right ml-2 transform group-hover:translate-x-1 transition-transform"></i>
        </button>
      </div>
    </div>
  );
};

export default TripCard;