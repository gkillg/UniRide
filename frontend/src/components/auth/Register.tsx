import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';

interface RegisterProps {
  setPage: (page: string) => void;
}

const Register: React.FC<RegisterProps> = ({ setPage }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState<Partial<User>>({ username: '', password: '', name: '', faculty: '', email: '', phone: '' });

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const success = await register(formData);
      if (success) setPage('home');
  };

  return (
      <div className="flex items-center justify-center flex-grow px-4">
          <div className="bg-white p-10 rounded-lg shadow-2xl w-full max-w-sm border-t-8 border-[#bda06d]">
              <div className="text-center mb-8">
                   <h2 className="text-2xl font-bold text-[#002f6c]">Register</h2>
                   <p className="text-gray-400 text-sm mt-1">Join the UniRide Community</p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                  <input required type="text" placeholder="Full Name" className="w-full border p-3 rounded text-sm focus:outline-none focus:border-[#002f6c]" onChange={e => setFormData({...formData, name: e.target.value})} />
                  <input required type="text" placeholder="Faculty/Department" className="w-full border p-3 rounded text-sm focus:outline-none focus:border-[#002f6c]" onChange={e => setFormData({...formData, faculty: e.target.value})} />
                  <input required type="email" placeholder="Email (e.g. student@atu.edu.kz)" className="w-full border p-3 rounded text-sm focus:outline-none focus:border-[#002f6c]" onChange={e => setFormData({...formData, email: e.target.value})} />
                  <input required type="tel" placeholder="Phone Number" className="w-full border p-3 rounded text-sm focus:outline-none focus:border-[#002f6c]" onChange={e => setFormData({...formData, phone: e.target.value})} />
                  <input required type="text" placeholder="Username" className="w-full border p-3 rounded text-sm focus:outline-none focus:border-[#002f6c]" onChange={e => setFormData({...formData, username: e.target.value})} />
                  <input required type="password" placeholder="Password" className="w-full border p-3 rounded text-sm focus:outline-none focus:border-[#002f6c]" onChange={e => setFormData({...formData, password: e.target.value})} />
                  <button type="submit" className="w-full bg-[#bda06d] text-white font-bold py-3 rounded hover:bg-[#a38855] transition shadow-md mt-2 uppercase text-sm">Register</button>
              </form>
              <div className="mt-6 text-center text-xs text-gray-500">
                  Already registered? <span className="text-[#002f6c] font-bold cursor-pointer hover:underline" onClick={() => setPage('login')}>Sign In</span>
              </div>
          </div>
      </div>
  );
};

export default Register;
