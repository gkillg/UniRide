# University Carpooling - Backend Setup Guide

Since this is a frontend-only preview environment, you cannot run the Python backend here. 
Follow these instructions to set up the backend on your local machine using SQLite as per your assignment requirements.

## 1. Project Structure

Create a folder `backend` and set up the structure:

```
backend/
├── manage.py
├── requirements.txt
├── backend/
│   ├── settings.py
│   ├── urls.py
│   └── ...
└── api/
    ├── models.py
    ├── serializers.py
    ├── views.py
    └── urls.py
```

## 2. Requirements (`requirements.txt`)

```txt
Django>=4.2
djangorestframework>=3.14
djangorestframework-simplejwt>=5.3
django-cors-headers>=4.3
```

## 3. Database Setup (SQLite)

In `backend/settings.py`, ensure the DATABASES setting is configured for SQLite (this is usually the default in Django):

```python
# backend/settings.py

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

## 4. Core Files

### `api/models.py`

Updated to include phone and email fields for user profiles.

```python
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator

class User(AbstractUser):
    faculty = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(unique=True, blank=True)
    rating = models.FloatField(default=0.0)
    review_count = models.IntegerField(default=0)

    # Resolve conflict with built-in auth groups
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to.',
        related_name="custom_user_set",
        related_query_name="user",
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name="custom_user_set",
        related_query_name="user",
    )

class Trip(models.Model):
    driver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trips_offered')
    origin = models.CharField(max_length=255)
    destination = models.CharField(max_length=255)
    date = models.DateTimeField()
    seats = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.origin} -> {self.destination} ({self.date})"

class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('rejected', 'Rejected'),
    ]
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='bookings')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('trip', 'user')

class Review(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_given')
    reviewed_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_received')
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update user rating
        reviews = Review.objects.filter(reviewed_user=self.reviewed_user)
        total = sum(r.rating for r in reviews)
        self.reviewed_user.rating = total / reviews.count()
        self.reviewed_user.review_count = reviews.count()
        self.reviewed_user.save()
```

### `api/serializers.py`

```python
from rest_framework import serializers
from .models import User, Trip, Booking, Review

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone', 'first_name', 'last_name', 'faculty', 'rating', 'review_count']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'first_name', 'faculty', 'email', 'phone']

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class BookingSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.first_name', read_only=True)
    
    class Meta:
        model = Booking
        fields = ['id', 'trip', 'user', 'user_name', 'status', 'created_at']
        read_only_fields = ['user', 'status']

class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source='reviewer.first_name', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'trip', 'reviewer', 'reviewer_name', 'rating', 'comment', 'created_at']
        read_only_fields = ['reviewer', 'trip']

class TripSerializer(serializers.ModelSerializer):
    driver = UserSerializer(read_only=True)
    bookings = BookingSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)

    class Meta:
        model = Trip
        fields = ['id', 'driver', 'origin', 'destination', 'date', 'seats', 'price', 'description', 'bookings', 'reviews']
```

## 5. Running Locally

1. **Install dependencies:** `pip install -r requirements.txt`
2. **Migrate:** `python manage.py migrate` (This creates the `db.sqlite3` file)
3. **Run Server:** `python manage.py runserver`
4. **Update Frontend:** 
   In `index.tsx`, verify the API calls point to `http://localhost:8000/api/` instead of the `LocalStorageDB` class.
