```markdown
# Схема базы данных

## Таблицы

### Пользователи (users)
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    student_id VARCHAR(50) UNIQUE,
    phone VARCHAR(20),
    faculty VARCHAR(100),
    rating DECIMAL(3,2) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Поездки (trips)
sql

CREATE TABLE trips (
    id SERIAL PRIMARY KEY,
    driver_id INTEGER REFERENCES users(id),
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    origin_lat DECIMAL(9,6),
    origin_lng DECIMAL(9,6),
    destination_lat DECIMAL(9,6),
    destination_lng DECIMAL(9,6),
    date_time TIMESTAMP NOT NULL,
    seats INTEGER NOT NULL,
    price DECIMAL(10,2),
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Бронирования (bookings)
sql

CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER REFERENCES trips(id),
    passenger_id INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(trip_id, passenger_id)
);

Отзывы (reviews)
sql

CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER REFERENCES trips(id),
    author_id INTEGER REFERENCES users(id),
    target_id INTEGER REFERENCES users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Взаимосвязи
text

users (1) → (many) trips (driver)
trips (1) → (many) bookings
users (1) → (many) bookings (passenger)
trips (1) → (many) reviews
users (1) → (many) reviews (author/target)

Индексы
sql

-- Для быстрого поиска поездок
CREATE INDEX idx_trips_date ON trips(date_time);
CREATE INDEX idx_trips_route ON trips(origin, destination);

-- Для поиска пользователей
CREATE INDEX idx_users_email ON users(email);

-- Для управления бронированиями
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_trip ON bookings(trip_id);

Примеры запросов
Активные поездки с водителями
sql

SELECT t.*, u.name as driver_name, u.rating as driver_rating
FROM trips t
JOIN users u ON t.driver_id = u.id
WHERE t.status = 'active'
  AND t.date_time > NOW()
  AND t.seats > 0
ORDER BY t.date_time ASC;

Статистика пользователя
sql

SELECT 
    u.name,
    COUNT(DISTINCT t.id) as trips_as_driver,
    COUNT(DISTINCT b.id) as trips_as_passenger,
    AVG(r.rating) as avg_rating
FROM users u
LEFT JOIN trips t ON u.id = t.driver_id
LEFT JOIN bookings b ON u.id = b.passenger_id
LEFT JOIN reviews r ON u.id = r.target_id
WHERE u.id = :user_id
GROUP BY u.id;