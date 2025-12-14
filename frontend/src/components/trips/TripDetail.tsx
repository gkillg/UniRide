import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Trip } from '../../types';
import { api } from '../../utils/localStorageDB';

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

  return (
    <div className="max-w-4xl mx-auto mt-10 px-4 flex-grow">
        <button onClick={() => setPage('home')} className="mb-6 flex items-center text-[#002f6c] hover:underline font-medium text-sm uppercase tracking-wide">
            <i className="fas fa-chevron-left mr-2"></i> Back to search
        </button>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
            <div className="bg-[#002f6c] text-white p-8 relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#bda06d] opacity-10 rounded-bl-full"></div>
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 text-[#bda06d]">{trip.destination}</h1>
                        <p className="text-blue-100 text-lg flex items-center">
                             <i className="fas fa-map-marker-alt mr-2"></i> From: {trip.origin}
                        </p>
                    </div>
                    <div className="text-right bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                        <span className="block text-2xl font-bold">{trip.price === 0 ? "Free" : `${trip.price} ₸`}</span>
                        <span className="text-blue-200 text-xs uppercase">per seat</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                <div className="col-span-2 p-8 border-r border-gray-100">
                     <div className="mb-8">
                        <h3 className="font-bold text-[#002f6c] uppercase text-xs tracking-wider mb-4 border-b pb-2">Trip Details</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-gray-500 text-xs uppercase">Date</p>
                                <p className="font-medium text-gray-900 text-lg">{new Date(trip.date).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs uppercase">Time</p>
                                <p className="font-medium text-gray-900 text-lg">{new Date(trip.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            </div>
                        </div>
                        <div className="mt-6">
                             <p className="text-gray-500 text-xs uppercase mb-2">Description</p>
                             <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border-l-4 border-[#bda06d]">
                                {trip.description || "No description provided."}
                            </p>
                        </div>
                     </div>

                     {/* Reviews */}
                     {trip.reviews && trip.reviews.length > 0 && (
                        <div>
                            <h3 className="font-bold text-[#002f6c] uppercase text-xs tracking-wider mb-4 border-b pb-2">Student Reviews</h3>
                            <div className="space-y-4">
                                {trip.reviews.map(r => (
                                    <div key={r.id} className="bg-gray-50 p-4 rounded">
                                        <div className="flex items-center mb-1">
                                            <span className="text-yellow-500 text-sm mr-2">
                                                {"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}
                                            </span>
                                            <span className="text-gray-400 text-xs">{r.date ? new Date(r.date).toLocaleDateString() : ''}</span>
                                        </div>
                                        <p className="text-gray-600 text-sm italic">"{r.comment}"</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="col-span-1 bg-gray-50 p-8">
                    <div className="text-center mb-6">
                        <div className="w-20 h-20 bg-[#002f6c] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-3 shadow-lg border-4 border-white">
                            {trip.driver?.name.charAt(0)}
                        </div>
                        <p className="font-bold text-gray-900">{trip.driver?.name}</p>
                        <p className="text-xs text-gray-500 uppercase">{trip.driver?.faculty}</p>
                        <div className="mt-2 text-yellow-500 text-sm">★ {trip.driver?.rating}</div>
                    </div>

                    <div className="space-y-4">
                        {isDriver ? (
                            <>
                                <button 
                                    onClick={() => setPage('edit-trip')} 
                                    className="w-full bg-blue-100 text-[#002f6c] py-3 rounded font-bold hover:bg-blue-200 transition text-sm uppercase"
                                >
                                    Edit Trip
                                </button>
                                <button 
                                    onClick={handleDelete} 
                                    className="w-full bg-red-100 text-red-700 py-3 rounded font-bold hover:bg-red-200 transition text-sm uppercase"
                                >
                                    Cancel Trip
                                </button>
                            </>
                        ) : (
                            <button 
                                onClick={handleBook}
                                disabled={trip.seats === 0 || isPast}
                                className={`w-full py-4 rounded font-bold text-sm uppercase shadow-md transition
                                    ${trip.seats === 0 || isPast 
                                        ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                                        : "bg-[#bda06d] text-white hover:bg-[#a38855]"
                                    }`}
                            >
                                {isPast ? "Trip Completed" : trip.seats === 0 ? "Fully Booked" : "Book Seat"}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* DRIVER MANAGEMENT SECTION */}
            {isDriver && (
                <div className="border-t border-gray-200 p-8 bg-gray-50">
                    <h3 className="font-bold text-[#002f6c] uppercase text-xs tracking-wider mb-4">Requests ({trip.bookings?.length || 0})</h3>
                    {!trip.bookings || trip.bookings.length === 0 ? (
                        <p className="text-gray-400 text-sm italic">No active requests.</p>
                    ) : (
                        <div className="space-y-2">
                            {trip.bookings.map(booking => (
                                <div key={booking.id} className="flex justify-between items-center bg-white border border-gray-200 p-3 rounded shadow-sm">
                                    <span className="text-sm font-medium text-gray-700">Passenger #{booking.userId}</span>
                                    {booking.status === 'pending' ? (
                                        <div className="space-x-2">
                                            <button onClick={() => { api.updateBookingStatus(booking.id, 'confirmed', user!.id); setTrip(api.getTrip(trip.id)); }} className="text-green-600 hover:text-green-800 text-xs font-bold uppercase">Accept</button>
                                            <button onClick={() => { api.updateBookingStatus(booking.id, 'rejected', user!.id); setTrip(api.getTrip(trip.id)); }} className="text-red-600 hover:text-red-800 text-xs font-bold uppercase">Reject</button>
                                        </div>
                                    ) : (
                                        <span className={`text-xs font-bold uppercase ${
                                            booking.status === 'confirmed' ? 'text-green-600' : 'text-red-600'
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

            {/* REVIEW FORM FOR PASSENGER */}
            {isPassenger && isPast && !hasReviewed && (
                <div className="p-8 border-t border-yellow-200 bg-yellow-50">
                    <h3 className="text-sm font-bold text-[#002f6c] uppercase mb-4">Leave Feedback</h3>
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                        <select 
                            value={rating} onChange={(e) => setRating(Number(e.target.value))}
                            className="block w-full border border-yellow-300 rounded p-2 bg-white text-sm"
                        >
                            <option value="5">5 - Excellent</option>
                            <option value="4">4 - Good</option>
                            <option value="3">3 - Average</option>
                            <option value="2">2 - Poor</option>
                            <option value="1">1 - Terrible</option>
                        </select>
                        <textarea 
                            required 
                            className="w-full p-3 border border-yellow-300 rounded bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#bda06d]" 
                            rows={2}
                            placeholder="How was the ride?"
                            value={comment} onChange={e => setComment(e.target.value)}
                        ></textarea>
                        <button type="submit" className="bg-[#002f6c] text-white px-6 py-2 rounded text-xs font-bold uppercase hover:bg-blue-900">Submit</button>
                    </form>
                </div>
            )}
        </div>
    </div>
  );
};

export default TripDetail;
