@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

/* Основные стили */
body {
  margin: 0;
  font-family: 'Inter', 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Custom Utilities */
.shadow-soft {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

/* ATU Brand Gradient */
.bg-gradient-atu {
  background: linear-gradient(135deg, #002f6c 0%, #1e4a8a 100%);
}

/* Animations */
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

/* Scrollbar */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: #f1f1f1; }
::-webkit-scrollbar-thumb { background: #002f6c; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #bda06d; }

/* Map Fix */
.leaflet-container {
    width: 100%;
    height: 100%;
    z-index: 10;
}

.custom-div-icon {
    background: transparent;
    border: none;
}