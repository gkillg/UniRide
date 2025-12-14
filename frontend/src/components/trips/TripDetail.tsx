import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Trip } from '../../types';
import { api } from '../../utils/localStorageDB';
import * as L from 'leaflet';

// Mock coordinates for existing demo data (fallback if trip has no coords)
const LOCATION_MOCK: Record<string, [number, number]> = {
    "ATU Main Campus (Tole Bi 100)": [43.2565, 76.9284],
    "ATU Main Campus": [43.2565, 76.9284],
    "Главный корпус ATU": [43.2565, 76.9284],
    "ATU Dormitory #1": [43.2389, 76.8897],
    "ATU Dormitory #1 (Toraigyrov 1)": [43.2389, 76.8897],
    "Dormitory #5": [43.2435, 76.8576], // Near Sayran
    "Almaty-1 Railway Station": [43.3413, 76.9497],
    "Almaty-2 Railway Station": [43.2775, 76.9427],
    "Sayran Bus Station": [43.2435, 76.8576],
    "Mega Alma-Ata": [43.2033, 76.8920],
    "ТРЦ 'MEGA'": [43.2033, 76.8920],
    "Dostyk Plaza": [43.2335, 76.9567],
    "Samal-2 District": [43.2309, 76.9458],
    "Samal-2": [43.2309, 76.9458],
    "Astana Residential Complex": [43.2309, 76.9458],
    "ЖК Астана": [43.2309, 76.9458],
};

interface TripDetailProps {
  tripId: number | null;
  setPage: (page: string) => void;
}

const TripDetail: React.FC<TripDetailProps> = ({ tripId, setPage }) => {
  const { user } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Map Refs
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!tripId) return;
    try {
        const data = api.getTrip(tripId);
        setTrip(data);
    } catch(e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  }, [tripId, submittingReview]);

  // --- MAP EFFECT ---
  useEffect(() => {
      if (!trip || !mapRef.current) return;

      // Determine coordinates (use Trip data OR fallback to mock)
      const startCoords = trip.originCoords || LOCATION_MOCK[trip.origin];
      const endCoords = trip.destCoords || LOCATION_MOCK[trip.destination];

      // Cleanup existing map
      if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
      }

      // If we have at least start coords, show map
      if (startCoords) {
          const map = L.map(mapRef.current).setView(startCoords, 13);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);

          // Custom Icons using FontAwesome
          const createIcon = (iconClass: string, color: string) => L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                        <i class="${iconClass}" style="color: white; font-size: 14px;"></i>
                     </div>`,
              iconSize: [30, 30],
              iconAnchor: [15, 15]
          });

          // Start Marker
          L.marker(startCoords, { icon: createIcon('fas fa-car', '#002f6c') })
            .addTo(map)
            .bindPopup(`<b>Start:</b> ${trip.origin}`);

          // End Marker & Route
          if (endCoords) {
              L.marker(endCoords, { icon: createIcon('fas fa-flag-checkered', '#bda06d') })
                .addTo(map)
                .bindPopup(`<b>End:</b> ${trip.destination}`);

              // Draw Line
              const polyline = L.polyline([startCoords, endCoords], {
                  color: '#002f6c',
                  weight: 4,
                  opacity: 0.7,
                  dashArray: '10, 10',
                  lineCap: 'round'
              }).addTo(map);

              // Fit bounds to show whole route
              map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
          }

          mapInstanceRef.current = map;
      }

      return () => {
          if (mapInstanceRef.current) {
              mapInstanceRef.current.remove();
              mapInstanceRef.current = null;
          }
      };
  }, [trip]);


  const handleBook = () => {
      if(!user) {
          setPage('login');
          return;
      }
      if (!trip) return;

      try {
          api.bookTrip(trip.id, user.id);
          alert("Request sent successfully.");
          setPage('profile');
      } catch(e) {
          alert((e as Error).message);
      }
  };

  const handleDelete = () => {
      if (!trip || !user) return;
      if(confirm("Confirm deletion?")) {
          try {
              api.deleteTrip(trip.id, user.id);
              setPage('home');
          } catch(e) {
              alert((e as Error).message);
          }
      }
  }

  const handleSubmitReview = (e: React.FormEvent) => {
      e.preventDefault();
      if (!trip || !user) return;
      try {
          api.addReview(trip.id, user.id, trip.driver_id, rating, comment);
          setSubmittingReview(!submittingReview);
          setComment("");
          alert("Review added.");
      } catch(e) {
          alert((e as Error).message);
      }
  }

  if(loading) return <div className="flex justify-center mt-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002f6c]"></div></div>;
  if(!trip) return <div className="text-center mt-10 text-red-500 font-bold">Trip not found</div>;

  const isDriver = user && user.id === trip.driver_id;
  const isPast = new Date(trip.date) < new Date();
  const isPassenger = user && trip.bookings?.find(b => b.userId === user.id && b.status === 'confirmed');
  const hasReviewed = user && trip.reviews?.some(r => r.fromUserId === user.id);

  // Check if we have valid coordinates to decide whether to show map or "unavailable" message
  const hasMapData = (trip.originCoords) || (LOCATION_MOCK[trip.origin]);

  return (
    <div className="max-w-6xl mx-auto mt-8 px-4 flex-grow pb-10">
        <button onClick={() => setPage('home')} className="mb-6 flex items-center text-[#002f6c] hover:underline font-medium text-sm uppercase tracking-wide">
            <i className="fas fa-chevron-left mr-2"></i> Back to search
        </button>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN: Map & Trip Details */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Trip Header Card */}
                <div className="bg-white rounded-2xl shadow-soft overflow-hidden border border-gray-100">
                    <div className="bg-gradient-atu text-white p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-10 translate-x-10 blur-xl"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <div className="flex items-center space-x-2 text-[#bda06d] mb-2">
                                    <span className="bg-white/10 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Trip Details</span>
                                </div>
                                <h1 className="text-3xl font-bold mb-2 leading-tight">{trip.destination}</h1>
                                <p className="text-blue-100 text-lg flex items-center">
                                    <i className="fas fa-map-marker-alt mr-2"></i> From: {trip.origin}
                                </p>
                            </div>
                            <div className="text-right bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/10">
                                <span className="block text-3xl font-bold">{trip.price === 0 ? "Free" : `${trip.price} ₸`}</span>
                                <span className="text-blue-200 text-xs uppercase font-medium">per seat</span>
                            </div>
                        </div>
                    </div>

                    {/* Info Bar */}
                    <div className="p-6 border-b border-gray-100 flex flex-wrap gap-6 text-gray-600">
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#002f6c] mr-3">
                                <i className="far fa-calendar-alt"></i>
                            </div>
                            <div>
                                <span className="block text-xs text-gray-400 uppercase font-bold">Date</span>
                                <span className="font-semibold text-gray-800">{new Date(trip.date).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#002f6c] mr-3">
                                <i className="far fa-clock"></i>
                            </div>
                            <div>
                                <span className="block text-xs text-gray-400 uppercase font-bold">Time</span>
                                <span className="font-semibold text-gray-800">{new Date(trip.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#002f6c] mr-3">
                                <i className="fas fa-chair"></i>
                            </div>
                            <div>
                                <span className="block text-xs text-gray-400 uppercase font-bold">Seats</span>
                                <span className="font-semibold text-gray-800">{trip.seats} Available</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        <h3 className="font-bold text-gray-900 mb-3">Description</h3>
                        <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                            {trip.description || "No description provided by the driver."}
                        </p>
                    </div>
                </div>

                {/* Map Section */}
                <div className="bg-white rounded-2xl shadow-soft overflow-hidden border border-gray-100 p-1">
                    <div className="h-80 bg-gray-100 rounded-xl overflow-hidden relative">
                        <div ref={mapRef} className="absolute inset-0 z-0"></div>
                        {!hasMapData && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100/90 z-10 text-gray-400">
                                <span className="text-sm"><i className="fas fa-map-slash mr-2"></i> Map preview not available</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Reviews Section */}
                {trip.reviews && trip.reviews.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-soft p-8 border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-6 flex items-center">
                            <i className="fas fa-star text-amber-400 mr-2"></i>
                            Passenger Reviews
                        </h3>
                        <div className="space-y-4">
                            {trip.reviews.map(r => (
                                <div key={r.id} className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold text-xs mr-2">
                                                {r.authorName ? r.authorName.charAt(0) : '?'}
                                            </div>
                                            <span className="text-sm font-bold text-gray-800">{r.authorName || 'Student'}</span>
                                        </div>
                                        <span className="text-gray-400 text-xs">{r.date ? new Date(r.date).toLocaleDateString() : ''}</span>
                                    </div>
                                    <div className="flex text-amber-400 text-xs mb-2">
                                        {"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}
                                    </div>
                                    <p className="text-gray-600 text-sm italic">"{r.comment}"</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT COLUMN: Sidebar (Driver & Actions) */}
            <div className="space-y-6">
                
                {/* New Driver Info Card */}
                <div className="bg-white rounded-2xl shadow-soft p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <i className="fas fa-user-circle text-[#002f6c] mr-2"></i>
                    Информация о водителе
                  </h3>
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#002f6c] to-[#bda06d] rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4">
                      {trip.driver?.name?.charAt(0) || 'В'}
                    </div>
                    <div>
                      <h4 className="font-bold text-xl text-gray-900">{trip.driver?.name}</h4>
                      <div className="flex items-center mt-1">
                        <div className="flex text-amber-400 mr-2">
                          {'★'.repeat(5)}
                        </div>
                        <span className="text-gray-600">({trip.driver?.reviewCount || 0} отзывов)</span>
                      </div>
                      <div className="mt-2 flex items-center text-gray-500">
                        <i className="fas fa-graduation-cap mr-2"></i>
                        <span>{trip.driver?.faculty || 'ATU Student'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Driver Management (Requests) */}
                {isDriver && (
                    <div className="bg-white rounded-2xl shadow-soft p-6 border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center justify-between">
                            <span>Booking Requests</span>
                            <span className="bg-blue-100 text-[#002f6c] text-xs px-2 py-1 rounded-full">{trip.bookings?.length || 0}</span>
                        </h3>
                        {!trip.bookings || trip.bookings.length === 0 ? (
                            <p className="text-gray-400 text-sm italic text-center py-4">No active requests yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {trip.bookings.map(booking => (
                                    <div key={booking.id} className="flex justify-between items-center bg-gray-50 border border-gray-200 p-3 rounded-xl">
                                        <span className="text-sm font-bold text-gray-700">Passenger #{booking.userId}</span>
                                        {booking.status === 'pending' ? (
                                            <div className="flex gap-2">
                                                <button onClick={() => { api.updateBookingStatus(booking.id, 'confirmed', user!.id); setTrip(api.getTrip(trip.id)); }} className="w-8 h-8 rounded-full bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center"><i className="fas fa-check"></i></button>
                                                <button onClick={() => { api.updateBookingStatus(booking.id, 'rejected', user!.id); setTrip(api.getTrip(trip.id)); }} className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center"><i className="fas fa-times"></i></button>
                                            </div>
                                        ) : (
                                            <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                                                booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {booking.status}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Review Form */}
                {isPassenger && isPast && !hasReviewed && (
                    <div className="bg-yellow-50 rounded-2xl shadow-sm p-6 border border-yellow-200">
                        <h3 className="text-sm font-bold text-[#002f6c] uppercase mb-4">Rate your ride</h3>
                        <form onSubmit={handleSubmitReview} className="space-y-4">
                            <select 
                                value={rating} onChange={(e) => setRating(Number(e.target.value))}
                                className="block w-full border border-yellow-300 rounded-xl p-3 bg-white text-sm focus:ring-2 focus:ring-[#bda06d] outline-none"
                            >
                                <option value="5">5 - Excellent</option>
                                <option value="4">4 - Good</option>
                                <option value="3">3 - Average</option>
                                <option value="2">2 - Poor</option>
                                <option value="1">1 - Terrible</option>
                            </select>
                            <textarea 
                                required 
                                className="w-full p-3 border border-yellow-300 rounded-xl bg-white text-sm focus:ring-2 focus:ring-[#bda06d] outline-none" 
                                rows={3}
                                placeholder="How was the ride?"
                                value={comment} onChange={e => setComment(e.target.value)}
                            ></textarea>
                            <button type="submit" className="w-full bg-[#002f6c] text-white py-3 rounded-xl text-sm font-bold uppercase hover:bg-blue-900 transition">Submit Review</button>
                        </form>
                    </div>
                )}
                
                {/* Actions */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                    {isDriver ? (
                        <>
                            <button 
                                onClick={() => setPage('edit-trip')} 
                                className="w-full bg-blue-50 text-[#002f6c] py-3 rounded-xl font-bold hover:bg-blue-100 transition text-sm flex items-center justify-center"
                            >
                                <i className="fas fa-edit mr-2"></i> Edit Trip
                            </button>
                            <button 
                                onClick={handleDelete} 
                                className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-bold hover:bg-red-100 transition text-sm flex items-center justify-center"
                            >
                                <i className="fas fa-trash-alt mr-2"></i> Cancel Trip
                            </button>
                        </>
                    ) : (
                        <button 
                            onClick={handleBook}
                            disabled={trip.seats === 0 || isPast}
                            className={`w-full py-4 rounded-xl font-bold text-sm shadow-md transition transform active:scale-95 flex items-center justify-center
                                ${trip.seats === 0 || isPast 
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                                    : "bg-[#bda06d] text-white hover:bg-[#a38855] hover:shadow-lg"
                                }`}
                        >
                            {isPast ? "Trip Completed" : trip.seats === 0 ? "Fully Booked" : 
                                <><i className="fas fa-check-circle mr-2"></i> Book Seat</>
                            }
                        </button>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default TripDetail;