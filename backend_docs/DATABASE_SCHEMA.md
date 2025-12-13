```markdown
# UniRide Database Schema

## Таблица: users
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(150) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(30),
    last_name VARCHAR(150),
    faculty VARCHAR(100),
    phone VARCHAR(20),
    student_id VARCHAR(50) UNIQUE,
    rating DECIMAL(3,2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    is_staff BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    date_joined TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Таблица: trips
sql

CREATE TABLE trips (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    date_time TIMESTAMP NOT NULL,
    seats INTEGER NOT NULL CHECK (seats > 0),
    price DECIMAL(10,2) DEFAULT 0.00,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Таблица: bookings
sql

CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
    passenger_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(trip_id, passenger_id)
);

Индексы
sql

CREATE INDEX idx_trips_date ON trips(date_time);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_users_email ON users(email);

text


---