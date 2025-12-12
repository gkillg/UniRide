<div align="center">

# 🚗 UniRide - University Carpooling Platform

![React](https://img.shields.io/badge/React-19.0.0-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-blue?logo=typescript)
![Django](https://img.shields.io/badge/Django-4.2-green?logo=django)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)
![Vite](https://img.shields.io/badge/Vite-6.2.0-purple?logo=vite)

**Web application for finding carpooling partners among university students**

[![Demo](https://img.shields.io/badge/Live_Demo-FF6B6B?style=for-the-badge)](https://your-demo-link.here)
[![Documentation](https://img.shields.io/badge/Documentation-4ECDC4?style=for-the-badge)](docs/)
[![API](https://img.shields.io/badge/API_Spec-FED766?style=for-the-badge)](api/)

</div>

## 📋 Overview

**UniRide** is a full-stack web application designed to solve transportation challenges for university students. The platform connects drivers and passengers within the same university community, making commuting more economical, social, and environmentally friendly.

### ✨ Key Features

- **🔐 University Verification** - Only students with verified university emails can register
- **🗺️ Interactive Maps** - Built-in map interface for route selection using Leaflet
- **⭐ Rating System** - Trust-based community with driver/passenger reviews
- **💬 Real-time Chat** - Secure messaging between trip participants
- **📱 Mobile-Friendly** - Responsive design that works on all devices
- **🛡️ Security Focus** - JWT authentication, HTTPS, and data encryption

## 🏗️ Architecture

```mermaid
graph TB
    A[Frontend - React/TypeScript] -->|REST API| B[Backend - Django/DRF]
    B -->|SQL| C[Database - PostgreSQL]
    D[Admin Panel] --> B
    E[Mobile App - Future] --> B
    
    style A fill:#61dafb
    style B fill:#092e20
    style C fill:#336791
    style D fill:#f0ad4e
    style E fill:#34a853
