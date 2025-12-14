# API Reference

Базовый URL: `https://ac72f9fdb835.ngrok-free.app`

## Аутентификация

### Регистрация пользователя
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@atu.edu.kz",
  "password": "secure_password",
  "name": "Иван Иванов",
  "student_id": "АТУ123456"
}

Вход в систему


POST /api/auth/login
Content-Type: application/json

{
  "email": "student@atu.edu.kz",
  "password": "secure_password"
}

Ответ включает JWT-токен для последующих запросов.
Поездки (Trips)
Получить список поездок


GET /api/trips
Query Parameters:
  - origin (опционально): пункт отправления
  - destination (опционально): пункт назначения
  - date (опционально): дата поездки
  - seats (опционально): минимальное количество мест

Создать поездку

POST /api/trips
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "origin": "ATU Main Campus",
  "destination": "MEGA Silk Way",
  "date": "2024-12-20T18:00:00Z",
  "seats": 3,
  "price": 500,
  "description": "Поездка в торговый центр"
}

Получить детали поездки

GET /api/trips/{id}

Бронирования (Bookings)
Забронировать место

POST /api/trips/{id}/book
Authorization: Bearer <JWT_TOKEN>

Отменить бронирование

DELETE /api/bookings/{id}
Authorization: Bearer <JWT_TOKEN>

Коды ответов

    200 OK: Успешный запрос

    201 Created: Ресурс создан

    400 Bad Request: Ошибка валидации

    401 Unauthorized: Требуется аутентификация

    403 Forbidden: Нет прав доступа

    404 Not Found: Ресурс не найден