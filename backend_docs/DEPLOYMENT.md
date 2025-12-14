```markdown
# Развертывание проекта

## Локальная разработка

### Фронтенд
```bash
cd frontend
npm install
npm run dev

Бэкенд


# Активация Python окружения
python -m venv venv
source venv/bin/activate  # На Windows: venv\Scripts\activate

# Установка зависимостей
pip install -r requirements.txt

# Запуск сервера
python manage.py runserver

Публикация через Ngrok
Установка ngrok

    Зарегистрируйтесь на ngrok.com

    Скачайте и установите ngrok

    Авторизуйтесь: ngrok authtoken <ВАШ_ТОКЕН>

Запуск туннеля


# Запустите ваш бэкенд-сервер (например, на порту 8000)
python manage.py runserver 8000

# В другом терминале запустите ngrok
ngrok http 8000

Настройка фронтенда

Обновите базовый URL API в файле конфигурации фронтенда:


// В файле конфигурации API
const API_BASE_URL = 'https://[ваш-ngrok-id].ngrok.io';

Переменные окружения

Создайте файл .env в корне бэкенда:
env

SECRET_KEY=ваш_секретный_ключ
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1,[ваш-ngrok-id].ngrok.io

Миграции базы данных

# Создание миграций
python manage.py makemigrations

# Применение миграций
python manage.py migrate

# Создание суперпользователя (для админки)
python manage.py createsuperuser