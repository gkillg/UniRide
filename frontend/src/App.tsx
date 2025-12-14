import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import TripList from './components/trips/TripList';
import TripDetail from './components/trips/TripDetail';
import TripForm from './components/trips/TripForm';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Profile from './components/profile/Profile';
import AdminPanel from './components/admin/AdminPanel';

const App: React.FC = () => {
  const [page, setPage] = useState('home');
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);

  const renderPage = () => {
    switch(page) {
      case 'home': return <TripList setPage={setPage} setSelectedTripId={setSelectedTripId} />;
      case 'trip-detail': return <TripDetail tripId={selectedTripId} setPage={setPage} />;
      case 'create-trip': return <TripForm setPage={setPage} selectedTripId={null} />;
      case 'edit-trip': return <TripForm setPage={setPage} selectedTripId={selectedTripId} />;
      case 'login': return <Login setPage={setPage} />;
      case 'register': return <Register setPage={setPage} />;
      case 'profile': return <Profile setPage={setPage} setSelectedTripId={setSelectedTripId} />;
      case 'admin': return <AdminPanel />;
      default: return <TripList setPage={setPage} setSelectedTripId={setSelectedTripId} />;
    }
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-100 flex flex-col font-sans text-gray-900">
        <Navbar setPage={setPage} />
        {renderPage()}
        <Footer />
      </div>
    </AuthProvider>
  );
};

export default App;
