import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface LoginProps {
  setPage: (page: string) => void;
}

const Login: React.FC<LoginProps> = ({ setPage }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const success = await login(username, password);
      if (success) setPage('home');
  };

  return (
      <div className="flex items-center justify-center flex-grow px-4">
          <div className="bg-white p-10 rounded-lg shadow-2xl w-full max-w-sm border-t-8 border-[#002f6c]">
              <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-[#002f6c]">UniRide Login</h2>
                  <p className="text-gray-400 text-sm mt-1">University Carpooling System</p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
                      <input type="text" className="w-full border border-gray-300 p-3 rounded focus:ring-1 focus:ring-[#002f6c] focus:outline-none" value={username} onChange={e => setUsername(e.target.value)} />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                      <input type="password" className="w-full border border-gray-300 p-3 rounded focus:ring-1 focus:ring-[#002f6c] focus:outline-none" value={password} onChange={e => setPassword(e.target.value)} />
                  </div>
                  <button type="submit" className="w-full bg-[#002f6c] text-white font-bold py-3 rounded hover:bg-blue-900 transition shadow-md uppercase text-sm tracking-wider">Sign In</button>
              </form>
              <div className="mt-8 text-center text-xs text-gray-500">
                  New Student? <span className="text-[#bda06d] font-bold cursor-pointer hover:underline" onClick={() => setPage('register')}>Create Account</span>
              </div>
          </div>
      </div>
  );
};

export default Login;
