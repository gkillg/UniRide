# UniRide Backend Documentation

## Архитектура
- **Фреймворк:** Django 4.2 + Django REST Framework
- **База данных:** PostgreSQL 15
- **Аутентификация:** JWT (JSON Web Tokens)
- **API:** RESTful

## Структура проекта

backend/
├── api/ # Основное приложение
│ ├── models.py # Модели данных
│ ├── serializers.py # Сериализаторы
│ ├── views.py # View-функции
│ ├── urls.py # Маршруты API
│ └── permissions.py # Права доступа
├── backend/ # Настройки проекта
│ ├── settings.py
│ └── urls.py
└── manage.py
text


## Запуск
```bash
# 1. Установка зависимостей
pip install -r requirements.txt

# 2. Миграции базы данных
python manage.py migrate

# 3. Запуск сервера
python manage.py runserver

API будет доступно по адресу: http://localhost:8000/api/
