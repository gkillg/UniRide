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
  // Simple filter state kept for potential future expansion, though main UI uses text search
  const [filters] = useState({
      dateFrom: '',
      dateTo: '',
      maxPrice: '',
      minSeats: '1'
  });

  useEffect(() => {
    setTrips(api.getTrips());
  }, []);

  const filteredTrips = trips.filter(trip => {
      // Text Search
      if (filter && !trip.destination.toLowerCase().includes(filter.toLowerCase()) && 
          !trip.origin.toLowerCase().includes(filter.toLowerCase())) return false;
      
      return true;
  });

  return (
    <div className="max-w-7xl mx-auto mt-6 px-4 pb-12 flex-grow">
      
      {/* New Hero Header */}
      <div className="bg-gradient-atu rounded-3xl p-8 mb-10 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#bda06d]/20 rounded-full translate-y-24 -translate-x-16 blur-2xl"></div>
        
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-3 tracking-tight">Find your perfect ride</h1>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl font-light">
            Connect with fellow ATU students and staff. Save money, reduce your carbon footprint, and make new friends on the way to campus.
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 max-w-3xl">
            <div className="flex-1 relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="fas fa-search text-gray-400 group-focus-within:text-[#002f6c] transition-colors"></i>
              </div>
              <input 
                type="text" 
                placeholder="Where are you heading? (e.g. Tole Bi, Sayran)" 
                className="w-full pl-12 pr-4 py-4 text-gray-900 border-none rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-[#bda06d] placeholder-gray-400"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <button className="bg-[#bda06d] text-white font-bold px-8 py-4 rounded-xl hover:bg-[#a38855] transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap flex items-center justify-center">
              <i className="fas fa-search mr-2"></i>
              Search
            </button>
          </div>
          
          {/* Quick Filters (Visual Only for now) */}
          <div className="mt-6 flex flex-wrap gap-2 text-sm font-medium text-blue-100">
            <span className="bg-white/10 px-3 py-1 rounded-full hover:bg-white/20 cursor-pointer transition">Today</span>
            <span className="bg-white/10 px-3 py-1 rounded-full hover:bg-white/20 cursor-pointer transition">Tomorrow</span>
            <span className="bg-white/10 px-3 py-1 rounded-full hover:bg-white/20 cursor-pointer transition">Cheapest</span>
            <span className="bg-white/10 px-3 py-1 rounded-full hover:bg-white/20 cursor-pointer transition">To Campus</span>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Available Trips</h2>
            <button 
                onClick={() => setPage('create-trip')}
                className="text-[#002f6c] font-bold text-sm hover:underline flex items-center"
            >
                <i className="fas fa-plus-circle mr-2"></i> Offer a Ride
            </button>
        </div>

        {filteredTrips.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 text-3xl">
                    <i className="fas fa-car-side"></i>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No trips found</h3>
                <p className="text-gray-500 mb-6">We couldn't find any trips matching your search.</p>
                <button onClick={() => setFilter('')} className="text-[#002f6c] font-bold hover:underline">Clear Search</button>
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