import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/localStorageDB';
import { User } from '../../types';

const AdminPanel = () => {
  const [users, setUsers] = useState<User[]>([]);
  const { user } = useAuth();
  
  useEffect(() => {
      setUsers(api.getUsers());
  }, []);

  const handleVerify = (id: number) => {
      const updatedUser = api.verifyUser(id);
      if(updatedUser) {
          setUsers(api.getUsers().map(u => u.id === id ? updatedUser : u));
      }
  };

  if (!user?.isStaff) return <div className="p-10 text-center text-red-500 font-bold">Access Denied</div>;
  
  return (
    <div className="max-w-6xl mx-auto mt-10 px-4 flex-grow">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        <div className="bg-[#002f6c] text-white p-6 flex justify-between items-center">
             <h2 className="text-2xl font-bold">Admin Panel</h2>
             <span className="bg-[#bda06d] text-xs font-bold px-2 py-1 rounded">SUPERUSER</span>
        </div>
        
        <div className="p-6">
            <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">User Management</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="text-xs font-bold text-gray-500 uppercase border-b border-gray-200">
                        <th className="py-3 px-2">ID</th>
                        <th className="py-3 px-2">Name</th>
                        <th className="py-3 px-2">Email</th>
                        <th className="py-3 px-2">Faculty</th>
                        <th className="py-3 px-2 text-center">Status</th>
                        <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="text-sm">
                    {users.map(u => (
                        <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-2 font-mono text-gray-400">{u.id}</td>
                        <td className="py-3 px-2 font-medium">{u.name}</td>
                        <td className="py-3 px-2 text-gray-600">{u.email}</td>
                        <td className="py-3 px-2 text-gray-600">{u.faculty}</td>
                        <td className="py-3 px-2 text-center">
                            {u.email_confirmed ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Verified
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Pending
                                </span>
                            )}
                        </td>
                        <td className="py-3 px-2 text-right">
                            <button 
                                onClick={() => handleVerify(u.id)}
                                className={`text-xs font-bold uppercase px-3 py-1 rounded transition ${
                                    u.email_confirmed 
                                    ? 'bg-gray-200 text-gray-500 hover:bg-gray-300' 
                                    : 'bg-[#002f6c] text-white hover:bg-blue-900'
                                }`}
                            >
                                {u.email_confirmed ? 'Revoke' : 'Verify'}
                            </button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
