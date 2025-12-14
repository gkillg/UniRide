import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/localStorageDB';
import { User, Trip, Booking } from '../../types';

type Tab = 'dashboard' | 'users' | 'trips';

const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  
  // Data State
  const [users, setUsers] = useState<User[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  // UI State
  const [searchUser, setSearchUser] = useState("");
  const [searchTrip, setSearchTrip] = useState("");

  const refreshData = () => {
      setUsers(api.getUsers());
      setTrips(api.getTrips());
      setBookings(api.getAllBookings());
  };

  useEffect(() => {
      refreshData();
  }, []);

  const handleVerify = (id: number) => {
      const updatedUser = api.verifyUser(id);
      if(updatedUser) refreshData();
  };

  const handleDeleteUser = (id: number) => {
      if(confirm("Вы уверены, что хотите удалить этого пользователя? Это действие необратимо.")) {
          api.deleteUser(id);
          refreshData();
      }
  };

  const handleDeleteTrip = (id: number) => {
      if(confirm("Удалить эту поездку?")) {
          // As admin (using admin ID)
          api.deleteTrip(id, user!.id);
          refreshData();
      }
  };

  // --- STATS CALCULATION ---
  const activeTripsCount = trips.filter(t => new Date(t.date) > new Date()).length;
  const totalRevenue = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((acc, b) => {
        const trip = trips.find(t => t.id === b.trip_id);
        return acc + (trip ? trip.price : 0);
    }, 0);

  if (!user?.isStaff) return <div className="p-10 text-center text-red-500 font-bold">Access Denied</div>;
  
  // --- SUB-COMPONENTS ---

  const Dashboard = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-[#002f6c] flex items-center justify-center text-xl mr-4">
                  <i className="fas fa-users"></i>
              </div>
              <div>
                  <p className="text-gray-500 text-sm uppercase font-bold">Пользователи</p>
                  <p className="text-2xl font-bold text-gray-800">{users.length}</p>
              </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
              <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xl mr-4">
                  <i className="fas fa-car"></i>
              </div>
              <div>
                  <p className="text-gray-500 text-sm uppercase font-bold">Активные поездки</p>
                  <p className="text-2xl font-bold text-gray-800">{activeTripsCount}</p>
              </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xl mr-4">
                  <i className="fas fa-ticket-alt"></i>
              </div>
              <div>
                  <p className="text-gray-500 text-sm uppercase font-bold">Всего бронирований</p>
                  <p className="text-2xl font-bold text-gray-800">{bookings.length}</p>
              </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xl mr-4">
                  <i className="fas fa-tenge-sign"></i>
              </div>
              <div>
                  <p className="text-gray-500 text-sm uppercase font-bold">Общий оборот</p>
                  <p className="text-2xl font-bold text-gray-800">{totalRevenue.toLocaleString()} ₸</p>
              </div>
          </div>
      </div>
  );

  const UsersTable = () => {
      const filteredUsers = users.filter(u => 
          u.name.toLowerCase().includes(searchUser.toLowerCase()) || 
          u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
          u.username.toLowerCase().includes(searchUser.toLowerCase())
      );

      return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center flex-wrap gap-4">
                <h3 className="text-lg font-bold text-gray-800">Пользователи</h3>
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Поиск по имени/email..." 
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#002f6c]"
                        value={searchUser}
                        onChange={(e) => setSearchUser(e.target.value)}
                    />
                    <i className="fas fa-search absolute left-3 top-2.5 text-gray-400 text-xs"></i>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                        <th className="py-4 px-4">ID</th>
                        <th className="py-4 px-4">Имя</th>
                        <th className="py-4 px-4">Факультет</th>
                        <th className="py-4 px-4 text-center">Статус</th>
                        <th className="py-4 px-4 text-right">Действия</th>
                    </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-gray-100">
                    {filteredUsers.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50 transition">
                        <td className="py-4 px-4 font-mono text-gray-400">#{u.id}</td>
                        <td className="py-4 px-4">
                            <div className="font-bold text-gray-900">{u.name}</div>
                            <div className="text-xs text-gray-500">{u.email}</div>
                        </td>
                        <td className="py-4 px-4 text-gray-600">{u.faculty}</td>
                        <td className="py-4 px-4 text-center">
                            {u.email_confirmed ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                    <i className="fas fa-check mr-1"></i> Verified
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                                    Pending
                                </span>
                            )}
                            {u.isStaff && <span className="ml-2 bg-[#002f6c] text-white text-[10px] px-2 py-0.5 rounded uppercase">Admin</span>}
                        </td>
                        <td className="py-4 px-4 text-right space-x-2">
                            <button 
                                onClick={() => handleVerify(u.id)}
                                className={`w-8 h-8 rounded-full hover:bg-gray-200 transition text-gray-500`}
                                title={u.email_confirmed ? 'Отменить верификацию' : 'Верифицировать'}
                            >
                                <i className={`fas ${u.email_confirmed ? 'fa-times' : 'fa-check'}`}></i>
                            </button>
                            {!u.isStaff && (
                                <button 
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="w-8 h-8 rounded-full hover:bg-red-100 text-red-500 transition"
                                    title="Удалить пользователя"
                                >
                                    <i className="fas fa-trash"></i>
                                </button>
                            )}
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
      );
  };

  const TripsTable = () => {
      const filteredTrips = trips.filter(t => 
          t.origin.toLowerCase().includes(searchTrip.toLowerCase()) || 
          t.destination.toLowerCase().includes(searchTrip.toLowerCase()) ||
          t.driverName?.toLowerCase().includes(searchTrip.toLowerCase())
      );

      return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center flex-wrap gap-4">
                <h3 className="text-lg font-bold text-gray-800">Все поездки</h3>
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Поиск места или водителя..." 
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#002f6c]"
                        value={searchTrip}
                        onChange={(e) => setSearchTrip(e.target.value)}
                    />
                    <i className="fas fa-search absolute left-3 top-2.5 text-gray-400 text-xs"></i>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                        <th className="py-4 px-4">ID</th>
                        <th className="py-4 px-4">Маршрут</th>
                        <th className="py-4 px-4">Водитель</th>
                        <th className="py-4 px-4">Дата</th>
                        <th className="py-4 px-4 text-center">Цена</th>
                        <th className="py-4 px-4 text-right">Управление</th>
                    </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-gray-100">
                    {filteredTrips.map(t => {
                        const isPast = new Date(t.date) < new Date();
                        return (
                            <tr key={t.id} className="hover:bg-gray-50 transition">
                                <td className="py-4 px-4 font-mono text-gray-400">#{t.id}</td>
                                <td className="py-4 px-4">
                                    <div className="font-bold text-[#002f6c]">{t.destination}</div>
                                    <div className="text-xs text-gray-500">из {t.origin}</div>
                                </td>
                                <td className="py-4 px-4">
                                    <span className="font-medium text-gray-800">{t.driverName}</span>
                                </td>
                                <td className="py-4 px-4">
                                    <div className={isPast ? "text-gray-400" : "text-green-700 font-medium"}>
                                        {new Date(t.date).toLocaleDateString()}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {new Date(t.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                    </div>
                                </td>
                                <td className="py-4 px-4 text-center font-bold text-gray-700">
                                    {t.price} ₸
                                </td>
                                <td className="py-4 px-4 text-right">
                                    <button 
                                        onClick={() => handleDeleteTrip(t.id)}
                                        className="text-xs uppercase bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded font-bold transition"
                                    >
                                        Удалить
                                    </button>
                                </td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>
            </div>
        </div>
      );
  };

  return (
    <div className="max-w-7xl mx-auto mt-8 px-4 flex-grow pb-12">
      {/* Header */}
      <div className="bg-[#002f6c] text-white p-8 rounded-2xl shadow-xl flex justify-between items-center mb-8 relative overflow-hidden">
         <div className="relative z-10">
             <h2 className="text-3xl font-bold mb-1">Панель Администратора</h2>
             <p className="text-blue-200 text-sm opacity-80">Управление системой UniRide</p>
         </div>
         <div className="relative z-10 bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20">
             <span className="font-mono font-bold text-[#bda06d]">SUPERUSER</span>
         </div>
         {/* Decoration */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl"></div>
      </div>
      
      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-200/50 p-1 rounded-xl w-fit">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'dashboard' ? 'bg-white text-[#002f6c] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
              <i className="fas fa-chart-pie mr-2"></i> Обзор
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'users' ? 'bg-white text-[#002f6c] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
              <i className="fas fa-users mr-2"></i> Пользователи
          </button>
          <button 
            onClick={() => setActiveTab('trips')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'trips' ? 'bg-white text-[#002f6c] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
              <i className="fas fa-route mr-2"></i> Поездки
          </button>
      </div>

      {/* Content */}
      <div className="animate-fade-in">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'users' && <UsersTable />}
          {activeTab === 'trips' && <TripsTable />}
      </div>
    </div>
  );
};

export default AdminPanel;