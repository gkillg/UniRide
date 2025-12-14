import { User, Trip, Booking, Review } from '../types';

const DB_NAME = "uni_carpool_sql_v1";

const initialSqlDump = {
  users: [
    { id: 1, username: "admin", password: "password", name: "Admin User", faculty: "IT & Engineering", email: "admin@atu.edu.kz", phone: "+7 (701) 123-4567", rating: 5.0, reviewCount: 1, isStaff: true, email_confirmed: true },
    { id: 2, username: "driver1", password: "password", name: "Arman Aliev", faculty: "Food Technology", email: "arman@atu.edu.kz", phone: "+7 (777) 987-6543", rating: 4.8, reviewCount: 5, isStaff: false, email_confirmed: true },
    { id: 3, username: "passenger1", password: "password", name: "Dina S.", faculty: "Design", email: "dina@atu.edu.kz", phone: "+7 (702) 555-0011", rating: 4.5, reviewCount: 2, isStaff: false, email_confirmed: false },
  ],
  trips: [
    { id: 1, driver_id: 2, origin: "ATU Main Campus (Tole Bi 100)", destination: "Samal-2 District", date: "2023-11-25T18:00", seats: 3, price: 200, description: "Going home after evening lectures. Listening to Jazz." },
    { id: 2, driver_id: 1, origin: "ATU Dormitory #1", destination: "Almaty-1 Railway Station", date: "2024-12-26T09:00", seats: 4, price: 0, description: "Free ride for students going to the station." },
  ],
  bookings: [],
  reviews: [],
};

export class LocalStorageDB {
  constructor() {
    if (!localStorage.getItem(DB_NAME)) {
      localStorage.setItem(DB_NAME, JSON.stringify(initialSqlDump));
    }
  }

  get table() {
    return JSON.parse(localStorage.getItem(DB_NAME) || "{}");
  }

  commit(data: any) {
    localStorage.setItem(DB_NAME, JSON.stringify(data));
  }

  // --- Auth Methods ---

  login(username: string, password: string) {
    const user = this.table.users.find((u: User) => u.username === username && u.password === password);
    if (!user) throw new Error("Invalid credentials");
    
    return { 
        token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.simulated_access_token_${user.id}`, 
        user 
    };
  }

  register(userData: Partial<User>) {
    const db = this.table;
    if (db.users.find((u: User) => u.username === userData.username)) {
      throw new Error("User already exists");
    }
    
    const newUser = { 
        ...userData, 
        id: Date.now(), 
        rating: 0, 
        reviewCount: 0, 
        isStaff: false,
        email_confirmed: false
    } as User;
    
    db.users.push(newUser);
    this.commit(db);
    
    return { 
        token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.simulated_access_token_${newUser.id}`, 
        user: newUser 
    };
  }

  getUser(id: number): User | undefined {
    return this.table.users.find((u: User) => u.id === id);
  }

  getUsers(): User[] {
      return this.table.users;
  }

  verifyUser(userId: number) {
      const db = this.table;
      const user = db.users.find((u: User) => u.id === userId);
      if (user) {
          user.email_confirmed = !user.email_confirmed;
          this.commit(db);
          return user;
      }
      return null;
  }

  // --- Trip Methods ---

  getTrips(): Trip[] {
    const db = this.table;
    return db.trips
        .sort((a: Trip, b: Trip) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((trip: Trip) => {
            const driver = db.users.find((u: User) => u.id === trip.driver_id);
            return { ...trip, driverName: driver?.name, driverRating: driver?.rating, driverId: trip.driver_id };
        });
  }

  getTrip(id: number): Trip {
    const db = this.table;
    const trip = db.trips.find((t: Trip) => t.id === Number(id));
    if (!trip) throw new Error("Trip not found");
    
    // JOINs
    const driver = db.users.find((u: User) => u.id === trip.driver_id);
    const bookings = db.bookings.filter((b: Booking) => b.trip_id === trip.id);
    const tripReviews = db.reviews.filter((r: Review) => r.trip_id === trip.id);
    
    return { ...trip, driverId: trip.driver_id, driver, bookings, reviews: tripReviews };
  }

  createTrip(tripData: Partial<Trip>, driverId: number) {
    const db = this.table;
    const newTrip = { ...tripData, id: Date.now(), driver_id: driverId };
    db.trips.push(newTrip);
    this.commit(db);
    return newTrip;
  }

  updateTrip(tripId: number, tripData: Partial<Trip>, userId: number) {
    const db = this.table;
    const idx = db.trips.findIndex((t: Trip) => t.id === tripId);
    if (idx === -1) throw new Error("Trip not found");
    if (db.trips[idx].driver_id !== userId) throw new Error("Permission denied");
    
    db.trips[idx] = { ...db.trips[idx], ...tripData };
    this.commit(db);
    return db.trips[idx];
  }

  deleteTrip(tripId: number, userId: number) {
    const db = this.table;
    const tripIdx = db.trips.findIndex((t: Trip) => t.id === tripId);
    if (tripIdx === -1) throw new Error("Trip not found");
    
    const user = this.getUser(userId);
    if (db.trips[tripIdx].driver_id !== userId && !user?.isStaff) {
        throw new Error("Permission denied");
    }
    
    db.trips.splice(tripIdx, 1);
    this.commit(db);
  }

  // --- Booking Methods ---

  bookTrip(tripId: number, userId: number) {
    const db = this.table;
    const trip = db.trips.find((t: Trip) => t.id === tripId);
    if (!trip) throw new Error("Trip not found");
    if (trip.driver_id === userId) throw new Error("Cannot book your own trip");
    if (db.bookings.find((b: Booking) => b.trip_id === tripId && b.userId === userId)) throw new Error("Already booked");
    if (trip.seats <= 0) throw new Error("No seats available");

    const newBooking = { id: Date.now(), trip_id: tripId, userId, status: 'pending' };
    db.bookings.push(newBooking);
    this.commit(db);
    return newBooking;
  }

  updateBookingStatus(bookingId: number, status: 'confirmed' | 'rejected', userId: number) {
    const db = this.table;
    const booking = db.bookings.find((b: Booking) => b.id === bookingId);
    if (!booking) throw new Error("Booking not found");
    
    const trip = db.trips.find((t: Trip) => t.id === booking.trip_id);
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
  
  getUserBookings(userId: number) {
      const db = this.table;
      return db.bookings
        .filter((b: Booking) => b.userId === userId)
        .map((b: Booking) => {
            const trip = db.trips.find((t: Trip) => t.id === b.trip_id);
            const driver = db.users.find((u: User) => u.id === trip.driver_id);
            return { ...b, trip: { ...trip, driverName: driver?.name }, tripId: b.trip_id };
        });
  }
  
  getUserTrips(userId: number) {
      const db = this.table;
      return db.trips.filter((t: Trip) => t.driver_id === userId);
  }

  // --- Review Methods ---

  addReview(tripId: number, fromUserId: number, toUserId: number, rating: number, comment: string) {
    const db = this.table;
    const trip = db.trips.find((t: Trip) => t.id === tripId);
    if (!trip) throw new Error("Trip not found");

    if (db.reviews.find((r: Review) => r.trip_id === tripId && r.fromUserId === fromUserId)) {
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

    const targetUser = db.users.find((u: User) => u.id === toUserId);
    if (targetUser) {
        const totalRating = (targetUser.rating * targetUser.reviewCount) + Number(rating);
        targetUser.reviewCount += 1;
        targetUser.rating = parseFloat((totalRating / targetUser.reviewCount).toFixed(1));
    }

    this.commit(db);
    return newReview;
  }

  getReviewsForUser(userId: number) {
      const db = this.table;
      return db.reviews.filter((r: Review) => r.toUserId === userId).map((r: Review) => {
          const author = db.users.find((u: User) => u.id === r.fromUserId);
          return { ...r, authorName: author?.name };
      });
  }
}

export const api = new LocalStorageDB();
