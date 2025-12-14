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
  const [filters, setFilters] = useState({
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
      
      // Advanced Filters
      if (filters.dateFrom && new Date(trip.date) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(trip.date) > new Date(filters.dateTo)) return false;
      if (filters.maxPrice && trip.price > parseInt(filters.maxPrice)) return false;
      if (filters.minSeats && trip.seats < parseInt(filters.minSeats)) return false;
      
      return true;
  });

  return (
    <div className="max-w-6xl mx-auto mt-8 px-4 flex-grow">
      {/* Search header */}
      <div className="bg-[#002f6c] rounded-xl p-8 mb-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Find your way to campus</h2>
          <p className="text-blue-100 mb-6 max-w-xl">Connect with fellow students and staff. Save money and reduce your carbon footprint with UniRide.</p>
          
          <div className="relative w-full md:w-[500px] mb-4">
            <i className="fas fa-search absolute left-4 top-4 text-gray-400"></i>
            <input 
              type="text" 
              placeholder="Where are you going?" 
              className="w-full pl-12 pr-4 py-4 text-gray-900 border-none rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-[#bda06d]"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>

          {/* Advanced Filters */}
          <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                  <label className="block text-blue-200 text-xs uppercase mb-1">From Date</label>
                  <input type="datetime-local" className="w-full p-2 rounded text-gray-900 border-none" 
                      value={filters.dateFrom} onChange={e => setFilters({...filters, dateFrom: e.target.value})} />
              </div>
              <div>
                  <label className="block text-blue-200 text-xs uppercase mb-1">To Date</label>
                  <input type="datetime-local" className="w-full p-2 rounded text-gray-900 border-none" 
                      value={filters.dateTo} onChange={e => setFilters({...filters, dateTo: e.target.value})} />
              </div>
              <div>
                  <label className="block text-blue-200 text-xs uppercase mb-1">Max Price</label>
                  <input type="number" placeholder="Any" className="w-full p-2 rounded text-gray-900 border-none" 
                      value={filters.maxPrice} onChange={e => setFilters({...filters, maxPrice: e.target.value})} />
              </div>
              <div>
                  <label className="block text-blue-200 text-xs uppercase mb-1">Min Seats</label>
                  <input type="number" min="1" className="w-full p-2 rounded text-gray-900 border-none" 
                      value={filters.minSeats} onChange={e => setFilters({...filters, minSeats: e.target.value})} />
              </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 bg-[#bda06d]/10 transform skew-x-[-20deg]"></div>
      </div>

      {/* Trips grid */}
      <h3 className="text-xl font-bold text-gray-800 uppercase tracking-wide border-b-2 border-[#bda06d] pb-1 mb-6">Available Rides</h3>
      
      {filteredTrips.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
          <i className="fas fa-car text-5xl text-gray-300 mb-4"></i>
          <p className="text-gray-500 text-lg">No active trips found.</p>
          <button onClick={() => setPage('create-trip')} className="mt-4 text-[#002f6c] font-bold hover:underline">Be the first to offer a ride!</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map(trip => (
            <TripCard 
              key={trip.id} 
              trip={trip} 
              onSelect={(id) => { setSelectedTripId(id); setPage('trip-detail'); }} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TripList;