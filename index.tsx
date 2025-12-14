import React, { useState, useEffect, createContext, useContext, useRef } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";
import * as L from "leaflet";

// --- CONSTANTS & POPULAR PLACES ---

const POPULAR_LOCATIONS = [
  { name: "ATU Main Campus (Tole Bi 100)", coords: [43.2565, 76.9284] },
  { name: "ATU Dormitory #1", coords: [43.2389, 76.8897] },
  { name: "Almaty-2 Railway Station", coords: [43.2775, 76.9427] },
  { name: "Sayran Bus Station", coords: [43.2435, 76.8576] },
  { name: "Mega Alma-Ata", coords: [43.2033, 76.8920] },
  { name: "Dostyk Plaza", coords: [43.2335, 76.9567] },
];

// --- MOCK SQL DATABASE & BACKEND SIMULATION ---

const DB_NAME = "uniride_sql_v1";

// Initial SQL-like Dump
const initialSqlDump = {
  // TABLE: users
  users: [
    { id: 1, username: "admin", password: "password", name: "Admin User", faculty: "IT & Engineering", email: "admin@atu.edu.kz", phone: "+7 (701) 123-4567", rating: 5.0, reviewCount: 1, isStaff: true, email_confirmed: true },
    { id: 2, username: "driver1", password: "password", name: "Arman Aliev", faculty: "Food Technology", email: "arman@atu.edu.kz", phone: "+7 (777) 987-6543", rating: 4.8, reviewCount: 5, isStaff: false, email_confirmed: true },
    { id: 3, username: "passenger1", password: "password", name: "Dina S.", faculty: "Design", email: "dina@atu.edu.kz", phone: "+7 (702) 555-0011", rating: 4.5, reviewCount: 2, isStaff: false, email_confirmed: false },
  ],
  // TABLE: trips
  trips: [
    {
      id: 1,
      driver_id: 2, // FK -> users.id
      origin: "ATU Main Campus (Tole Bi 100)",
      destination: "Samal-2 District",
      date: "2023-11-25T18:00",
      seats: 3,
      price: 200,
      description: "Going home after evening lectures. Listening to Jazz.",
    },
    {
      id: 2,
      driver_id: 1, // FK -> users.id
      origin: "ATU Dormitory #1",
      destination: "Almaty-1 Railway Station",
      date: "2024-12-26T09:00",
      seats: 4,
      price: 0,
      description: "Free ride for students going to the station.",
    },
  ],
  // TABLE: bookings
  bookings: [], 
  // TABLE: reviews
  reviews: [], 
};

class LocalStorageDB {
  constructor() {
    if (!localStorage.getItem(DB_NAME)) {
      localStorage.setItem(DB_NAME, JSON.stringify(initialSqlDump));
    }
  }

  // Helper to simulate SQL SELECT *
  get table() {
    return JSON.parse(localStorage.getItem(DB_NAME) || "{}");
  }

  // Helper to simulate SQL UPDATE/INSERT
  commit(data) {
    localStorage.setItem(DB_NAME, JSON.stringify(data));
  }

  // Auth (SELECT * FROM users WHERE...)
  login(username, password) {
    const user = this.table.users.find((u) => u.username === username && u.password === password);
    if (!user) throw new Error("Invalid credentials");
    
    // Simulate JWT Structure
    const tokenResponse = {
        access: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.simulated_access_token_${user.id}`,
        refresh: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.simulated_refresh_token_${user.id}`
    };
    return { ...tokenResponse, user };
  }

  register(userData) {
    const db = this.table;
    if (db.users.find((u) => u.username === userData.username)) {
      throw new Error("User already exists");
    }
    const newUser = { 
        ...userData, 
        id: Date.now(), 
        rating: 0, 
        reviewCount: 0, 
        isStaff: false,
        email_confirmed: false
    };
    db.users.push(newUser);
    this.commit(db);
    
    const tokenResponse = {
        access: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.simulated_access_token_${newUser.id}`,
        refresh: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.simulated_refresh_token_${newUser.id}`
    };

    return { ...tokenResponse, user: newUser };
  }

  getUser(id) {
    return this.table.users.find(u => u.id === id);
  }

  getUsers() {
      return this.table.users;
  }

  verifyUser(userId) {
      const db = this.table;
      const user = db.users.find(u => u.id === userId);
      if (user) {
          user.email_confirmed = !user.email_confirmed;
          this.commit(db);
          return user;
      }
      return null;
  }

  // SELECT trips JOIN users ON trips.driver_id = users.id
  getTrips() {
    const db = this.table;
    return db.trips
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(trip => {
            const driver = db.users.find(u => u.id === trip.driver_id);
            return { ...trip, driverName: driver?.name, driverRating: driver?.rating, driverId: trip.driver_id };
        });
  }

  getTrip(id) {
    const db = this.table;
    const trip = db.trips.find((t) => t.id === Number(id));
    if (!trip) throw new Error("Trip not found");
    
    // JOINs
    const driver = db.users.find(u => u.id === trip.driver_id);
    const bookings = db.bookings.filter(b => b.trip_id === trip.id);
    const tripReviews = db.reviews.filter(r => r.trip_id === trip.id);
    
    // Normalize FK for frontend usage
    return { ...trip, driverId: trip.driver_id, driver, bookings, reviews: tripReviews };
  }

  createTrip(tripData, driverId) {
    const db = this.table;
    // INSERT INTO trips ...
    const newTrip = { ...tripData, id: Date.now(), driver_id: driverId };
    db.trips.push(newTrip);
    this.commit(db);
    return newTrip;
  }

  updateTrip(tripId, tripData, userId) {
    const db = this.table;
    const idx = db.trips.findIndex(t => t.id === tripId);
    if (idx === -1) throw new Error("Trip not found");
    if (db.trips[idx].driver_id !== userId) throw new Error("Permission denied");
    
    db.trips[idx] = { ...db.trips[idx], ...tripData };
    this.commit(db);
    return db.trips[idx];
  }

  deleteTrip(tripId, userId) {
    const db = this.table;
    const tripIdx = db.trips.findIndex(t => t.id === tripId);
    if (tripIdx === -1) throw new Error("Trip not found");
    if (db.trips[tripIdx].driver_id !== userId && !this.getUser(userId).isStaff) throw new Error("Permission denied");
    
    db.trips.splice(tripIdx, 1);
    this.commit(db);
  }

  bookTrip(tripId, userId) {
    const db = this.table;
    const trip = db.trips.find(t => t.id === tripId);
    if (!trip) throw new Error("Trip not found");
    if (trip.driver_id === userId) throw new Error("Cannot book your own trip");
    if (db.bookings.find(b => b.trip_id === tripId && b.userId === userId)) throw new Error("Already booked");
    if (trip.seats <= 0) throw new Error("No seats available");

    const newBooking = { id: Date.now(), trip_id: tripId, userId, status: 'pending' };
    db.bookings.push(newBooking);
    this.commit(db);
    return newBooking;
  }

  updateBookingStatus(bookingId, status, userId) {
    const db = this.table;
    const booking = db.bookings.find(b => b.id === bookingId);
    if (!booking) throw new Error("Booking not found");
    
    const trip = db.trips.find(t => t.id === booking.trip_id);
    if (trip.driver_id !== userId) throw new Error("Permission denied");

    if (status === 'confirmed' && booking.status !== 'confirmed') {
        if (trip.seats <= 0) throw new Error("No seats left to confirm");
        trip.seats -= 1;
    } else if (status === 'rejected' && booking.status === 'confirmed') {
        trip.seats += 1;
    }

    booking.status = status;
    this.commit(db);
    return booking;
  }
  
  getUserBookings(userId) {
      const db = this.table;
      return db.bookings
        .filter(b => b.userId === userId)
        .map(b => {
            const trip = db.trips.find(t => t.id === b.trip_id);
            const driver = db.users.find(u => u.id === trip.driver_id);
            return { ...b, trip: { ...trip, driverName: driver?.name }, tripId: b.trip_id };
        });
  }
  
  getUserTrips(userId) {
      const db = this.table;
      return db.trips.filter(t => t.driver_id === userId);
  }

  addReview(tripId, fromUserId, toUserId, rating, comment) {
    const db = this.table;
    const trip = db.trips.find(t => t.id === tripId);
    if (!trip) throw new Error("Trip not found");

    if (db.reviews.find(r => r.trip_id === tripId && r.fromUserId === fromUserId)) {
        throw new Error("You have already reviewed this trip.");
    }

    const newReview = {
        id: Date.now(),
        trip_id: tripId,
        fromUserId,
        toUserId,
        rating: Number(rating),
        comment,
        date: new Date().toISOString()
    };
    db.reviews.push(newReview);

    const targetUser = db.users.find(u => u.id === toUserId);
    if (targetUser) {
        const totalRating = (targetUser.rating * targetUser.reviewCount) + Number(rating);
        targetUser.reviewCount += 1;
        targetUser.rating = parseFloat((totalRating / targetUser.reviewCount).toFixed(1));
    }

    this.commit(db);
    return newReview;
  }

  getReviewsForUser(userId) {
      const db = this.table;
      return db.reviews.filter(r => r.toUserId === userId).map(r => {
          const author = db.users.find(u => u.id === r.fromUserId);
          return { ...r, authorName: author?.name };
      });
  }
}

const api = new LocalStorageDB();

// --- AUTH CONTEXT ---

const AuthContext = createContext<any>(null);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("uniride_user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      const freshUser = api.getUser(parsed.id);
      setUser(freshUser || parsed);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const { user, access, refresh } = api.login(username, password);
      // Simulate JWT storage
      localStorage.setItem("uniride_token", access);
      localStorage.setItem("uniride_refresh", refresh);
      localStorage.setItem("uniride_user", JSON.stringify(user));
      setUser(user);
      return true;
    } catch (e) {
      alert(e.message);
      return false;
    }
  };

  const register = async (formData) => {
      try {
          const { user, access, refresh } = api.register(formData);
          localStorage.setItem("uniride_token", access);
          localStorage.setItem("uniride_refresh", refresh);
          localStorage.setItem("uniride_user", JSON.stringify(user));
          setUser(user);
          return true;
      } catch(e) {
          alert(e.message);
          return false;
      }
  }

  const logout = () => {
    localStorage.removeItem("uniride_token");
    localStorage.removeItem("uniride_refresh");
    localStorage.removeItem("uniride_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// --- MAP COMPONENT ---

const MapPicker = ({ onSelect, onClose }) => {
    const mapContainerRef = useRef(null);

    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Initialize Leaflet Map centered on Almaty
        const map = L.map(mapContainerRef.current).setView([43.2389, 76.8897], 13);

        // Add OSM Tiles (Replace URL for 2GIS or others if key available)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Map Click Event
        map.on('click', async (e) => {
            const { lat, lng } = e.latlng;
            
            // Reverse Geocoding Simulation (for demo, we just use coords)
            // In production, fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
            const locationName = `Selected Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
            
            if(confirm(`Select this location?\n${locationName}`)) {
                onSelect(locationName);
                onClose();
            }
        });

        return () => {
            map.remove();
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white p-4 rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                     <h3 className="text-xl font-bold text-[#002f6c]">Select Location on Map</h3>
                     <button onClick={onClose} className="text-gray-500 hover:text-red-500"><i className="fas fa-times text-2xl"></i></button>
                </div>
                <div className="flex-grow bg-gray-100 rounded border border-gray-300 relative overflow-hidden">
                    <div ref={mapContainerRef} className="w-full h-full"></div>
                </div>
                <div className="mt-2 text-xs text-gray-500 text-center">
                    Click anywhere on the map to select a point.
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTS ---

const Navbar = ({ setPage }) => {
  const { user, logout } = useAuth();
  return (
    <nav className="bg-[#002f6c] text-white shadow-lg sticky top-0 z-50 border-b-4 border-[#bda06d]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setPage('home')}>
             <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#002f6c] font-bold border-2 border-[#bda06d]">
                UR
             </div>
             <div>
                <h1 className="font-bold text-lg leading-tight uppercase tracking-wider">Uni<span className="text-[#bda06d]">Ride</span></h1>
             </div>
          </div>
          <div className="flex items-center space-x-6 text-sm">
            <button onClick={() => setPage('home')} className="hover:text-[#bda06d] font-medium transition uppercase">Find a Ride</button>
            {user ? (
              <>
                <button onClick={() => setPage('create-trip')} className="hover:text-[#bda06d] font-medium transition uppercase">Offer a Ride</button>
                <button onClick={() => setPage('profile')} className="hover:text-[#bda06d] font-medium transition uppercase">My Profile</button>
                {user.isStaff && (
                    <button onClick={() => setPage('admin')} className="text-[#bda06d] hover:text-white font-bold uppercase tracking-wider">Admin Panel</button>
                )}
                <div className="flex items-center space-x-3 bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
                    <span className="text-white font-semibold">{user.name}</span>
                    <button onClick={logout} className="text-xs text-[#bda06d] hover:text-white uppercase tracking-wide font-bold ml-2">Log out</button>
                </div>
              </>
            ) : (
              <div className="space-x-4">
                <button onClick={() => setPage('login')} className="hover:text-[#bda06d] font-medium transition uppercase">Login</button>
                <button onClick={() => setPage('register')} className="bg-[#bda06d] text-white px-5 py-2 rounded font-bold hover:bg-[#a38855] transition shadow-sm uppercase text-xs tracking-wider">Join Us</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const Footer = () => (
    <footer className="bg-[#1a1a1a] text-gray-400 py-10 mt-auto border-t border-[#bda06d]">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
            <div>
                <h4 className="text-white font-bold uppercase mb-4 tracking-wider">UniRide</h4>
                <p>Official student and staff carpooling platform. Sustainable transportation for our community.</p>
            </div>
            <div>
                <h4 className="text-white font-bold uppercase mb-4 tracking-wider">Contact Us</h4>
                <p><i className="fas fa-map-marker-alt mr-2 text-[#bda06d]"></i> 100 Tole Bi Street, Almaty, Kazakhstan</p>
                <p className="mt-2"><i className="fas fa-phone mr-2 text-[#bda06d]"></i> +7 (727) 293-52-92</p>
                <p className="mt-2"><i className="fas fa-envelope mr-2 text-[#bda06d]"></i> info@atu.edu.kz</p>
            </div>
            <div>
                 <h4 className="text-white font-bold uppercase mb-4 tracking-wider">Quick Links</h4>
                 <ul className="space-y-2">
                     <li><a href="#" className="hover:text-[#bda06d] transition">University Website</a></li>
                     <li><a href="#" className="hover:text-[#bda06d] transition">Student Portal</a></li>
                     <li><a href="#" className="hover:text-[#bda06d] transition">Academic Calendar</a></li>
                 </ul>
            </div>
        </div>
        <div className="text-center mt-8 pt-8 border-t border-gray-800 text-xs text-gray-600">
            &copy; {new Date().getFullYear()} UniRide. All rights reserved.
        </div>
    </footer>
);

// 2. Trip List
const TripList = ({ setPage, setSelectedTripId }) => {
  const [trips, setTrips] = useState([]);
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
      <div className="bg-[#002f6c] rounded-xl p-8 mb-10 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2">Find your way to campus</h2>
            <p className="text-blue-100 mb-6 max-w-xl">Connect with fellow students and staff. Save money and reduce your carbon footprint with UniRide.</p>
            
            {/* Search Bar */}
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

      <div className="flex items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 uppercase tracking-wide border-b-2 border-[#bda06d] pb-1">Available Rides</h3>
      </div>

      {filteredTrips.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
              <i className="fas fa-car text-5xl text-gray-300 mb-4"></i>
              <p className="text-gray-500 text-lg">No active trips found.</p>
              <button onClick={() => setPage('create-trip')} className="mt-4 text-[#002f6c] font-bold hover:underline">Be the first to offer a ride!</button>
          </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map(trip => (
            <div key={trip.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition duration-300 flex flex-col group">
                <div className="h-2 bg-[#002f6c] group-hover:bg-[#bda06d] transition-colors"></div>
                <div className="p-6 flex-grow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-full">
                            <h3 className="text-lg font-bold text-[#002f6c] truncate" title={trip.destination}>{trip.destination}</h3>
                            <div className="flex items-center mt-2 text-sm text-gray-600">
                                <div className="flex flex-col items-center mr-3">
                                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                    <div className="w-0.5 h-6 bg-gray-200 my-0.5"></div>
                                    <div className="w-2 h-2 rounded-full bg-[#002f6c]"></div>
                                </div>
                                <div className="flex flex-col h-12 justify-between">
                                    <span className="truncate w-48" title={trip.origin}>{trip.origin}</span>
                                    <span className="font-semibold text-[#002f6c]">Destination</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-3 text-sm text-gray-600 mt-4 pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center">
                            <span className="flex items-center"><i className="far fa-calendar-alt w-5 text-gray-400"></i> {new Date(trip.date).toLocaleDateString()}</span>
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">{new Date(trip.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="flex justify-between items-center">
                             <span className="flex items-center"><i className="fas fa-user-circle w-5 text-gray-400"></i> {trip.driverName}</span>
                             <span className="text-yellow-500 text-xs">★ {trip.driverRating}</span>
                        </div>
                        <div className="flex justify-between items-center font-semibold">
                             <span className={trip.seats > 0 ? "text-green-600" : "text-red-500"}>{trip.seats} seats left</span>
                             <span className="text-lg text-[#002f6c]">{trip.price === 0 ? "Free" : `${trip.price} ₸`}</span>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={() => { setSelectedTripId(trip.id); setPage('trip-detail'); }}
                    className="w-full bg-gray-50 text-[#002f6c] py-3 font-bold text-sm uppercase tracking-wider hover:bg-[#002f6c] hover:text-white transition"
                >
                    View Details
                </button>
            </div>
            ))}
        </div>
      )}
    </div>
  );
};

// 3. Trip Detail
const TripDetail = ({ tripId, setPage }) => {
  const { user } = useAuth();
  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
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
      try {
          api.bookTrip(trip.id, user.id);
          alert("Request sent successfully.");
          setPage('profile');
      } catch(e) {
          alert(e.message);
      }
  };

  const handleDelete = () => {
      if(confirm("Confirm deletion?")) {
          try {
              api.deleteTrip(trip.id, user.id);
              setPage('home');
          } catch(e) {
              alert(e.message);
          }
      }
  }

  const handleSubmitReview = (e) => {
      e.preventDefault();
      try {
          api.addReview(trip.id, user.id, trip.driverId, rating, comment);
          setSubmittingReview(!submittingReview);
          setComment("");
          alert("Review added.");
      } catch(e) {
          alert(e.message);
      }
  }

  if(loading) return <div className="flex justify-center mt-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002f6c]"></div></div>;
  if(!trip) return <div className="text-center mt-10 text-red-500 font-bold">Trip not found</div>;

  const isDriver = user && user.id === trip.driverId;
  const isPast = new Date(trip.date) < new Date();
  const isPassenger = user && trip.bookings.find(b => b.userId === user.id && b.status === 'confirmed');
  const hasReviewed = user && trip.reviews.some(r => r.fromUserId === user.id);

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
                     {trip.reviews.length > 0 && (
                        <div>
                            <h3 className="font-bold text-[#002f6c] uppercase text-xs tracking-wider mb-4 border-b pb-2">Student Reviews</h3>
                            <div className="space-y-4">
                                {trip.reviews.map(r => (
                                    <div key={r.id} className="bg-gray-50 p-4 rounded">
                                        <div className="flex items-center mb-1">
                                            <span className="text-yellow-500 text-sm mr-2">
                                                {"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}
                                            </span>
                                            <span className="text-gray-400 text-xs">{new Date(r.date).toLocaleDateString()}</span>
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
                            {trip.driver.name.charAt(0)}
                        </div>
                        <p className="font-bold text-gray-900">{trip.driver.name}</p>
                        <p className="text-xs text-gray-500 uppercase">{trip.driver.faculty}</p>
                        <div className="mt-2 text-yellow-500 text-sm">★ {trip.driver.rating}</div>
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
                    <h3 className="font-bold text-[#002f6c] uppercase text-xs tracking-wider mb-4">Requests ({trip.bookings.length})</h3>
                    {trip.bookings.length === 0 ? (
                        <p className="text-gray-400 text-sm italic">No active requests.</p>
                    ) : (
                        <div className="space-y-2">
                            {trip.bookings.map(booking => (
                                <div key={booking.id} className="flex justify-between items-center bg-white border border-gray-200 p-3 rounded shadow-sm">
                                    <span className="text-sm font-medium text-gray-700">Passenger #{booking.userId}</span>
                                    {booking.status === 'pending' ? (
                                        <div className="space-x-2">
                                            <button onClick={() => { api.updateBookingStatus(booking.id, 'confirmed', user.id); setTrip(api.getTrip(trip.id)); }} className="text-green-600 hover:text-green-800 text-xs font-bold uppercase">Accept</button>
                                            <button onClick={() => { api.updateBookingStatus(booking.id, 'rejected', user.id); setTrip(api.getTrip(trip.id)); }} className="text-red-600 hover:text-red-800 text-xs font-bold uppercase">Reject</button>
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

// 4. Trip Form
const TripForm = ({ setPage, selectedTripId }) => {
    const { user } = useAuth();
    const isEditMode = Boolean(selectedTripId);
    
    const [formData, setFormData] = useState({
        origin: '', destination: '', date: '', seats: 1, price: 0, description: ''
    });
    const [showMap, setShowMap] = useState(false);
    const [activeField, setActiveField] = useState(null); // 'origin' or 'destination'

    useEffect(() => {
        if (isEditMode) {
            try {
                const trip = api.getTrip(selectedTripId);
                setFormData({
                    origin: trip.origin,
                    destination: trip.destination,
                    date: trip.date,
                    seats: trip.seats,
                    price: trip.price,
                    description: trip.description
                });
            } catch(e) {
                console.error(e);
            }
        }
    }, [isEditMode, selectedTripId]);

    const handleMapSelect = (location) => {
        if(activeField) {
            setFormData({ ...formData, [activeField]: location });
        }
    };

    const openMap = (field) => {
        setActiveField(field);
        setShowMap(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        try {
            if (isEditMode) {
                api.updateTrip(selectedTripId, formData, user.id);
            } else {
                api.createTrip(formData, user.id);
            }
            alert(isEditMode ? "Trip Updated" : "Trip Created");
            setPage('home');
        } catch(e) {
            alert(e.message);
        }
    };

    return (
        <div className="max-w-xl mx-auto mt-12 px-4 flex-grow relative">
            {showMap && <MapPicker onSelect={handleMapSelect} onClose={() => setShowMap(false)} />}
            
            <div className="bg-white p-10 rounded-lg shadow-xl border-t-4 border-[#002f6c]">
                <h2 className="text-2xl font-bold text-[#002f6c] mb-6 text-center uppercase tracking-wide">{isEditMode ? "Edit Trip Details" : "Create New Trip"}</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Popular Places Quick Select */}
                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Quick Select Popular Places:</p>
                        <div className="flex flex-wrap gap-2">
                            {POPULAR_LOCATIONS.map(loc => (
                                <button type="button" key={loc.name} 
                                    onClick={() => {
                                        if(!formData.origin) setFormData({...formData, origin: loc.name});
                                        else if(!formData.destination) setFormData({...formData, destination: loc.name});
                                    }}
                                    className="bg-white border border-[#bda06d] text-[#002f6c] px-2 py-1 text-xs rounded hover:bg-[#bda06d] hover:text-white transition"
                                >
                                    {loc.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-700 text-xs font-bold uppercase mb-2">From</label>
                            <div className="flex">
                                <input required type="text" className="w-full border-gray-300 border-l border-t border-b rounded-l p-3 focus:ring-1 focus:ring-[#bda06d] focus:outline-none transition text-sm" 
                                    value={formData.origin}
                                    onChange={e => setFormData({...formData, origin: e.target.value})} placeholder="e.g. ATU Campus" />
                                <button type="button" onClick={() => openMap('origin')} className="bg-[#002f6c] text-white px-3 rounded-r hover:bg-blue-800"><i className="fas fa-map-marker-alt"></i></button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-700 text-xs font-bold uppercase mb-2">To</label>
                            <div className="flex">
                                <input required type="text" className="w-full border-gray-300 border-l border-t border-b rounded-l p-3 focus:ring-1 focus:ring-[#bda06d] focus:outline-none transition text-sm" 
                                    value={formData.destination}
                                    onChange={e => setFormData({...formData, destination: e.target.value})} placeholder="e.g. Dostyk Plaza" />
                                <button type="button" onClick={() => openMap('destination')} className="bg-[#002f6c] text-white px-3 rounded-r hover:bg-blue-800"><i className="fas fa-map-marker-alt"></i></button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-700 text-xs font-bold uppercase mb-2">Date & Time</label>
                            <input required type="datetime-local" className="w-full border-gray-300 border rounded p-3 focus:ring-1 focus:ring-[#bda06d] focus:outline-none transition text-sm" 
                                value={formData.date}
                                onChange={e => setFormData({...formData, date: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-xs font-bold uppercase mb-2">Seats</label>
                            <input required type="number" min="1" className="w-full border-gray-300 border rounded p-3 focus:ring-1 focus:ring-[#bda06d] focus:outline-none transition" 
                                value={formData.seats}
                                onChange={e => setFormData({...formData, seats: parseInt(e.target.value)})} />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-gray-700 text-xs font-bold uppercase mb-2">Price (KZT)</label>
                        <input required type="number" min="0" className="w-full border-gray-300 border rounded p-3 focus:ring-1 focus:ring-[#bda06d] focus:outline-none transition" 
                                value={formData.price}
                                onChange={e => setFormData({...formData, price: parseInt(e.target.value)})} />
                    </div>
                    
                    <div>
                        <label className="block text-gray-700 text-xs font-bold uppercase mb-2">Description</label>
                        <textarea className="w-full border-gray-300 border rounded p-3 focus:ring-1 focus:ring-[#bda06d] focus:outline-none transition" rows={3}
                            placeholder="Add details (luggage, music, etc.)"
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                    </div>
                    
                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setPage('home')} className="w-1/3 border border-gray-300 text-gray-600 font-bold py-3 rounded hover:bg-gray-50 uppercase text-xs">Cancel</button>
                        <button type="submit" className="w-2/3 bg-[#002f6c] text-white font-bold py-3 rounded hover:bg-blue-900 transition shadow-lg uppercase text-xs tracking-wider">
                            {isEditMode ? "Save Changes" : "Publish Trip"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// 5. Auth Forms
const Login = ({ setPage }) => {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await login(username, password);
        if (success) setPage('home');
    };

    return (
        <div className="flex items-center justify-center flex-grow px-4">
            <div className="bg-white p-10 rounded-lg shadow-2xl w-full max-w-sm border-t-8 border-[#002f6c]">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-[#002f6c]">UniRide Login</h2>
                    <p className="text-gray-400 text-sm mt-1">University Carpooling System</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
                        <input type="text" className="w-full border border-gray-300 p-3 rounded focus:ring-1 focus:ring-[#002f6c] focus:outline-none" value={username} onChange={e => setUsername(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                        <input type="password" className="w-full border border-gray-300 p-3 rounded focus:ring-1 focus:ring-[#002f6c] focus:outline-none" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                    <button type="submit" className="w-full bg-[#002f6c] text-white font-bold py-3 rounded hover:bg-blue-900 transition shadow-md uppercase text-sm tracking-wider">Sign In</button>
                </form>
                <div className="mt-8 text-center text-xs text-gray-500">
                    New Student? <span className="text-[#bda06d] font-bold cursor-pointer hover:underline" onClick={() => setPage('register')}>Create Account</span>
                </div>
            </div>
        </div>
    );
};

const Register = ({ setPage }) => {
    const { register } = useAuth();
    const [formData, setFormData] = useState({ username: '', password: '', name: '', faculty: '', email: '', phone: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await register(formData);
        if (success) setPage('home');
    };

    return (
        <div className="flex items-center justify-center flex-grow px-4">
            <div className="bg-white p-10 rounded-lg shadow-2xl w-full max-w-sm border-t-8 border-[#bda06d]">
                <div className="text-center mb-8">
                     <h2 className="text-2xl font-bold text-[#002f6c]">Register</h2>
                     <p className="text-gray-400 text-sm mt-1">Join the UniRide Community</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input required type="text" placeholder="Full Name" className="w-full border p-3 rounded text-sm focus:outline-none focus:border-[#002f6c]" onChange={e => setFormData({...formData, name: e.target.value})} />
                    <input required type="text" placeholder="Faculty/Department" className="w-full border p-3 rounded text-sm focus:outline-none focus:border-[#002f6c]" onChange={e => setFormData({...formData, faculty: e.target.value})} />
                    <input required type="email" placeholder="Email (e.g. student@atu.edu.kz)" className="w-full border p-3 rounded text-sm focus:outline-none focus:border-[#002f6c]" onChange={e => setFormData({...formData, email: e.target.value})} />
                    <input required type="tel" placeholder="Phone Number" className="w-full border p-3 rounded text-sm focus:outline-none focus:border-[#002f6c]" onChange={e => setFormData({...formData, phone: e.target.value})} />
                    <input required type="text" placeholder="Username" className="w-full border p-3 rounded text-sm focus:outline-none focus:border-[#002f6c]" onChange={e => setFormData({...formData, username: e.target.value})} />
                    <input required type="password" placeholder="Password" className="w-full border p-3 rounded text-sm focus:outline-none focus:border-[#002f6c]" onChange={e => setFormData({...formData, password: e.target.value})} />
                    <button type="submit" className="w-full bg-[#bda06d] text-white font-bold py-3 rounded hover:bg-[#a38855] transition shadow-md mt-2 uppercase text-sm">Register</button>
                </form>
                <div className="mt-6 text-center text-xs text-gray-500">
                    Already registered? <span className="text-[#002f6c] font-bold cursor-pointer hover:underline" onClick={() => setPage('login')}>Sign In</span>
                </div>
            </div>
        </div>
    );
};

// 6. Profile
const Profile = ({ setPage, setSelectedTripId }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'trips' | 'bookings'>('bookings');
    const [myTrips, setMyTrips] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [reviews, setReviews] = useState([]);

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
                                        <div className="font-bold text-gray-800">{b.trip.destination}</div>
                                        <div className="text-xs text-gray-500 mt-1 uppercase">
                                            Driver: {b.trip.driverName} • {new Date(b.trip.date).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase ${
                                            b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                                            b.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {b.status}
                                        </span>
                                        {b.status === 'confirmed' && (
                                            <button 
                                                onClick={() => { setSelectedTripId(b.trip.id); setPage('trip-detail'); }}
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

// 7. Admin Panel
const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const { user } = useAuth();
  
  useEffect(() => {
      setUsers(api.getUsers());
  }, []);

  const handleVerify = (id) => {
      const updatedUser = api.verifyUser(id);
      if(updatedUser) {
          setUsers(api.getUsers().map(u => u.id === id ? updatedUser : u)); // Force re-render with new state
      }
  };

  if (!user?.isStaff) return <div className="p-10 text-center text-red-500 font-bold">Access Denied</div>;
  
  return (
    <div className="max-w-6xl mx-auto mt-10 px-4 flex-grow">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        <div className="bg-[#002f6c] text-white p-6 flex justify-between items-center">
             <h2 className="text-2xl font-bold">Admin Panel</h2>
             <span className="bg-[#bda06d] text-xs font-bold px-2 py-1 rounded">SUPERUSER</span>
        </div>
        
        <div className="p-6">
            <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">User Management</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="text-xs font-bold text-gray-500 uppercase border-b border-gray-200">
                        <th className="py-3 px-2">ID</th>
                        <th className="py-3 px-2">Name</th>
                        <th className="py-3 px-2">Email</th>
                        <th className="py-3 px-2">Faculty</th>
                        <th className="py-3 px-2 text-center">Status</th>
                        <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="text-sm">
                    {users.map(u => (
                        <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-2 font-mono text-gray-400">{u.id}</td>
                        <td className="py-3 px-2 font-medium">{u.name}</td>
                        <td className="py-3 px-2 text-gray-600">{u.email}</td>
                        <td className="py-3 px-2 text-gray-600">{u.faculty}</td>
                        <td className="py-3 px-2 text-center">
                            {u.email_confirmed ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Verified
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Pending
                                </span>
                            )}
                        </td>
                        <td className="py-3 px-2 text-right">
                            <button 
                                onClick={() => handleVerify(u.id)}
                                className={`text-xs font-bold uppercase px-3 py-1 rounded transition ${
                                    u.email_confirmed 
                                    ? 'bg-gray-200 text-gray-500 hover:bg-gray-300' 
                                    : 'bg-[#002f6c] text-white hover:bg-blue-900'
                                }`}
                            >
                                {u.email_confirmed ? 'Revoke' : 'Verify'}
                            </button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- CHAT WIDGET ---

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{role: 'user' | 'model', text: string, grounding?: any}[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<'chat' | 'thinking' | 'search' | 'maps'>('chat');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input;
        setInput("");
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // Prepare history
            const history = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));
            history.push({ role: 'user', parts: [{ text: userMsg }] });

            let modelName = 'gemini-3-pro-preview';
            let config: any = {};

            if (mode === 'thinking') {
                modelName = 'gemini-3-pro-preview';
                config = { thinkingConfig: { thinkingBudget: 32768 } };
            } else if (mode === 'search') {
                modelName = 'gemini-2.5-flash';
                config = { tools: [{ googleSearch: {} }] };
            } else if (mode === 'maps') {
                modelName = 'gemini-2.5-flash';
                config = { tools: [{ googleMaps: {} }] };
                
                // Try to get location
                try {
                   const pos: any = await new Promise((resolve, reject) => {
                     navigator.geolocation.getCurrentPosition(resolve, reject, {timeout: 5000});
                   });
                   if (pos) {
                       config.toolConfig = {
                           retrievalConfig: {
                               latLng: {
                                   latitude: pos.coords.latitude,
                                   longitude: pos.coords.longitude
                               }
                           }
                       };
                   }
                } catch (err) {
                    console.warn("Location access denied or failed", err);
                }
            } else {
                // Standard chat
                modelName = 'gemini-3-pro-preview';
            }

            const response = await ai.models.generateContent({
                model: modelName,
                contents: history,
                config: config
            });

            const text = response.text || "No text response";
            const grounding = response.candidates?.[0]?.groundingMetadata;

            setMessages(prev => [...prev, { role: 'model', text, grounding }]);

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'model', text: "Error: " + error.message }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
           {/* Button to toggle */}
           <button 
             onClick={() => setIsOpen(!isOpen)}
             className="fixed bottom-6 right-6 z-50 bg-[#bda06d] text-white p-4 rounded-full shadow-lg hover:bg-[#a38855] transition"
           >
             <i className={`fas ${isOpen ? 'fa-times' : 'fa-comment-alt'} text-xl`}></i>
           </button>

           {/* Chat Window */}
           {isOpen && (
             <div className="fixed bottom-24 right-6 z-50 w-96 h-[500px] bg-white rounded-lg shadow-2xl flex flex-col border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-[#002f6c] text-white p-4 flex justify-between items-center">
                    <h3 className="font-bold">UniRide AI Assistant</h3>
                    <select 
                        value={mode} 
                        onChange={(e: any) => setMode(e.target.value)}
                        className="text-gray-900 text-xs p-1 rounded"
                    >
                        <option value="chat">Chat (Pro)</option>
                        <option value="thinking">Thinking</option>
                        <option value="search">Web Search</option>
                        <option value="maps">Maps</option>
                    </select>
                </div>

                {/* Messages */}
                <div className="flex-grow overflow-y-auto p-4 bg-gray-50 space-y-4">
                    {messages.map((m, idx) => (
                        <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-lg text-sm ${
                                m.role === 'user' 
                                ? 'bg-[#002f6c] text-white rounded-br-none' 
                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                            }`}>
                                <div className="whitespace-pre-wrap">{m.text}</div>
                                
                                {/* Grounding Display */}
                                {m.grounding?.groundingChunks && (
                                    <div className="mt-2 pt-2 border-t border-gray-200 text-xs">
                                        <p className="font-bold text-gray-500 mb-1">Sources:</p>
                                        <ul className="list-disc pl-4 space-y-1">
                                            {m.grounding.groundingChunks.map((chunk, cIdx) => {
                                                if (chunk.web?.uri) {
                                                    return <li key={cIdx}><a href={chunk.web.uri} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{chunk.web.title || chunk.web.uri}</a></li>
                                                }
                                                if (chunk.maps?.uri) {
                                                    return (
                                                        <li key={cIdx}>
                                                            <span className="font-semibold">Map: </span>
                                                            <a href={chunk.maps.uri} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{chunk.maps.title || "Google Maps"}</a>
                                                        </li>
                                                    )
                                                }
                                                return null;
                                            })}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-gray-200 p-3 rounded-lg rounded-bl-none shadow-sm">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-200 flex gap-2">
                    <input 
                        type="text" 
                        className="flex-grow border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#002f6c]"
                        placeholder="Type a message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="bg-[#002f6c] text-white px-4 py-2 rounded hover:bg-blue-900 disabled:bg-gray-400 transition"
                    >
                        <i className="fas fa-paper-plane"></i>
                    </button>
                </form>
             </div>
           )}
        </>
    );
};

// --- APP ROOT ---

const App: React.FC = () => {
  const [page, setPage] = useState('home');
  const [selectedTripId, setSelectedTripId] = useState(null);

  const renderPage = () => {
      switch(page) {
          case 'home': return <TripList setPage={setPage} setSelectedTripId={setSelectedTripId} />;
          case 'trip-detail': return <TripDetail tripId={selectedTripId} setPage={setPage} />;
          case 'create-trip': return <TripForm setPage={setPage} selectedTripId={null} />;
          case 'edit-trip': return <TripForm setPage={setPage} selectedTripId={selectedTripId} />;
          case 'login': return <Login setPage={setPage} />;
          case 'register': return <Register setPage={setPage} />;
          case 'profile': return <Profile setPage={setPage} setSelectedTripId={setSelectedTripId} />;
          case 'admin': return <AdminPanel />;
          default: return <TripList setPage={setPage} setSelectedTripId={setSelectedTripId} />;
      }
  }

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-100 flex flex-col font-sans text-gray-900">
        <Navbar setPage={setPage} />
        {renderPage()}
        <Footer />
        <ChatWidget />
      </div>
    </AuthProvider>
  );
};

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(<App />);