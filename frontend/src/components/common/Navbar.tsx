import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  setPage: (page: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ setPage }) => {
  const { user, logout } = useAuth();
  
  return (
    <nav className="bg-[#002f6c] text-white shadow-lg sticky top-0 z-50 border-b-4 border-[#bda06d]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setPage('home')}>
             <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#002f6c] font-bold border-2 border-[#bda06d]">
                UR
             </div>
             <div>
                <h1 className="font-bold text-lg leading-tight uppercase tracking-wider">Uni<span className="text-[#bda06d]">Ride</span></h1>
             </div>
          </div>
          <div className="flex items-center space-x-6 text-sm">
            <button onClick={() => setPage('home')} className="hover:text-[#bda06d] font-medium transition uppercase">Find a Ride</button>
            {user ? (
              <>
                <button onClick={() => setPage('create-trip')} className="hover:text-[#bda06d] font-medium transition uppercase">Offer a Ride</button>
                <button onClick={() => setPage('profile')} className="hover:text-[#bda06d] font-medium transition uppercase">My Profile</button>
                {user.isStaff && (
                    <button onClick={() => setPage('admin')} className="text-[#bda06d] hover:text-white font-bold uppercase tracking-wider">Admin Panel</button>
                )}
                <div className="flex items-center space-x-3 bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
                    <span className="text-white font-semibold">{user.name}</span>
                    <button onClick={logout} className="text-xs text-[#bda06d] hover:text-white uppercase tracking-wide font-bold ml-2">Log out</button>
                </div>
              </>
            ) : (
              <div className="space-x-4">
                <button onClick={() => setPage('login')} className="hover:text-[#bda06d] font-medium transition uppercase">Login</button>
                <button onClick={() => setPage('register')} className="bg-[#bda06d] text-white px-5 py-2 rounded font-bold hover:bg-[#a38855] transition shadow-sm uppercase text-xs tracking-wider">Join Us</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;