import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Trip, Booking, Review } from '../../types';
import { api } from '../../utils/localStorageDB';

interface ProfileProps {
  setPage: (page: string) => void;
  setSelectedTripId: (id: number) => void;
}

const Profile: React.FC<ProfileProps> = ({ setPage, setSelectedTripId }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'trips' | 'bookings'>('bookings');
  const [myTrips, setMyTrips] = useState<Trip[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
      if(user) {
          setMyTrips(api.getUserTrips(user.id));
          setMyBookings(api.getUserBookings(user.id));
          setReviews(api.getReviewsForUser(user.id));
      }
  }, [user]);

  if (!user) return null;

  return (
      <div className="max-w-4xl mx-auto mt-10 px-4 flex-grow">
          <div className="bg-white rounded-lg shadow-md mb-8 overflow-hidden border border-gray-200">
              <div className="bg-[#002f6c] h-24 relative">
                   <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
              </div>
              <div className="px-8 pb-8 flex flex-col md:flex-row items-center md:items-end -mt-12 relative z-10">
                  <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg border-4 border-white">
                      <div className="w-full h-full bg-[#002f6c] rounded-full flex items-center justify-center text-white text-3xl font-bold uppercase">
                          {user.name.charAt(0)}
                      </div>
                  </div>
                  <div className="mt-4 md:mt-0 md:ml-6 text-center md:text-left flex-grow">
                      <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
                      <p className="text-[#bda06d] font-bold text-sm uppercase mb-2">{user.faculty}</p>
                      <div className="flex flex-col md:flex-row items-center md:items-start gap-3 mt-3 text-sm text-gray-600">
                           <div className="flex items-center">
                               <i className="fas fa-envelope text-[#002f6c] mr-2"></i>
                               <span>{user.email || 'No email'}</span>
                           </div>
                           <div className="flex items-center">
                               <i className="fas fa-phone text-[#002f6c] mr-2"></i>
                               <span>{user.phone || 'No phone'}</span>
                           </div>
                           {user.email_confirmed && (
                               <div className="flex items-center text-green-600 font-bold">
                                   <i className="fas fa-check-circle mr-1"></i> Verified
                               </div>
                           )}
                      </div>
                  </div>
                  <div className="mt-4 md:mt-0">
                      <div className="bg-gray-100 px-4 py-2 rounded-full border border-gray-200">
                          <span className="text-yellow-600 font-bold mr-1">★ {user.rating}</span>
                          <span className="text-xs text-gray-500 uppercase">({user.reviewCount} reviews)</span>
                      </div>
                  </div>
              </div>
          </div>

          <div className="flex border-b border-gray-200 mb-6">
              <button 
                  className={`px-6 py-3 font-bold text-xs uppercase tracking-wider transition ${activeTab === 'bookings' ? 'border-b-2 border-[#002f6c] text-[#002f6c]' : 'text-gray-400 hover:text-gray-600'}`}
                  onClick={() => setActiveTab('bookings')}
              >
                  My Bookings
              </button>
              <button 
                  className={`px-6 py-3 font-bold text-xs uppercase tracking-wider transition ${activeTab === 'trips' ? 'border-b-2 border-[#002f6c] text-[#002f6c]' : 'text-gray-400 hover:text-gray-600'}`}
                  onClick={() => setActiveTab('trips')}
              >
                  My Trips
              </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm min-h-[300px] p-6">
              {activeTab === 'bookings' && (
                  <div className="space-y-4">
                      {myBookings.length === 0 ? (
                          <div className="text-center py-10 text-gray-400">No active bookings.</div>
                      ) : (
                          myBookings.map(b => (
                              <div key={b.id} className="border-l-4 border-[#002f6c] bg-gray-50 p-4 hover:bg-white hover:shadow-md transition flex justify-between items-center rounded-r">
                                  <div>
                                      <div className="font-bold text-gray-800">{b.trip?.destination}</div>
                                      <div className="text-xs text-gray-500 mt-1 uppercase">
                                          Driver: {b.trip?.driverName} • {b.trip ? new Date(b.trip.date).toLocaleDateString() : ''}
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase ${
                                          b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                                          b.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                      }`}>
                                          {b.status}
                                      </span>
                                      {b.status === 'confirmed' && b.trip && (
                                          <button 
                                              onClick={() => { setSelectedTripId(b.trip!.id); setPage('trip-detail'); }}
                                              className="block mt-2 text-[#002f6c] text-xs font-bold hover:underline uppercase"
                                          >
                                              Details
                                          </button>
                                      )}
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              )}

              {activeTab === 'trips' && (
                  <div className="space-y-4">
                      {myTrips.length === 0 ? (
                          <div className="text-center py-10 text-gray-400">No trips offered.</div>
                      ) : (
                          myTrips.map(t => (
                              <div key={t.id} className="border border-gray-200 rounded p-4 hover:border-[#bda06d] transition flex justify-between items-center">
                                  <div>
                                      <div className="font-bold text-[#002f6c]">{t.destination}</div>
                                      <div className="text-xs text-gray-500 mt-1">
                                          {new Date(t.date).toLocaleDateString()} • {t.seats} seats
                                      </div>
                                  </div>
                                  <div>
                                      <button 
                                          onClick={() => { setSelectedTripId(t.id); setPage('trip-detail'); }}
                                          className="mr-3 text-gray-500 hover:text-[#002f6c] font-medium text-sm"
                                      >
                                          <i className="fas fa-eye"></i>
                                      </button>
                                      <button 
                                          onClick={() => { setSelectedTripId(t.id); setPage('edit-trip'); }}
                                          className="text-[#002f6c] hover:text-[#bda06d] font-medium text-sm"
                                      >
                                          <i className="fas fa-edit"></i>
                                      </button>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              )}
          </div>
      </div>
  );
};

export default Profile;
