export interface User {
  id: number;
  username: string;
  password?: string;
  name: string;
  faculty: string;
  email: string;
  phone: string;
  rating: number;
  reviewCount: number;
  isStaff?: boolean;
  email_confirmed?: boolean;
}

export interface Trip {
  id: number;
  driver_id: number;
  origin: string;
  destination: string;
  // New coordinate fields
  originCoords?: [number, number];
  destCoords?: [number, number];
  date: string;
  seats: number;
  price: number;
  description: string;
  created_at?: string;
  driverName?: string;
  driverRating?: number;
  driver?: User;
  bookings?: Booking[];
  reviews?: Review[];
}

export interface Booking {
  id: number;
  trip_id: number;
  userId: number;
  status: 'pending' | 'confirmed' | 'rejected';
  created_at?: string;
  user_name?: string;
  trip?: Trip;
}

export interface Review {
  id: number;
  trip_id: number;
  fromUserId: number;
  toUserId: number;
  rating: number;
  comment: string;
  date?: string;
  authorName?: string;
}

export interface PopularLocation {
  name: string;
  coords: [number, number];
}

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (formData: Partial<User>) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}
