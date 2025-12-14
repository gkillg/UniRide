import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Trip, Booking, Review, User } from '../../types';
import { api } from '../../utils/localStorageDB';

interface ProfileProps {
  setPage: (page: string) => void;
  setSelectedTripId: (id: number) => void;
}

const Profile: React.FC<ProfileProps> = ({ setPage, setSelectedTripId }) => {
  const { user, updateProfile } = useAuth() as any;
  const [activeTab, setActiveTab] = useState<'trips' | 'bookings' | 'reviews'>('bookings');
  
  // Data
  const [myTrips, setMyTrips] = useState<Trip[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>({});

  useEffect(() => {
      if(user) {
          setMyTrips(api.getUserTrips(user.id));
          setMyBookings(api.getUserBookings(user.id));
          setReviews(api.getReviewsForUser(user.id));
          setEditForm({
              name: user.name,
              faculty: user.faculty,
              email: user.email,
              phone: user.phone
          });
      }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editForm.name || !editForm.email) return;
      
      const success = await updateProfile(editForm);
      if (success) {
          setIsEditing(false);
          alert("Профиль успешно обновлен!");
      }
  };

  if (!user) return null;

  // Validation Check
  const isAtuEmail = user.email.toLowerCase().endsWith('@atu.edu.kz');

  return (
      <div className="max-w-5xl mx-auto mt-8 px-4 flex-grow pb-12">
          
          {/* Domain Warning Banner */}
          {!isAtuEmail && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r shadow-sm animate-pulse">
                  <div className="flex">
                      <div className="flex-shrink-0">
                          <i className="fas fa-exclamation-triangle text-red-500 text-xl"></i>
                      </div>
                      <div className="ml-3">
                          <h3 className="text-sm font-bold text-red-800 uppercase tracking-wide">
                              Требуется действие: Неверный домен почты
                          </h3>
                          <div className="mt-2 text-sm text-red-700">
                              <p>
                                  Ваш аккаунт зарегистрирован на почту <strong>{user.email}</strong>. 
                                  Политика безопасности требует использования корпоративной почты домена 
                                  <span className="font-mono bg-red-100 px-1 rounded ml-1">@atu.edu.kz</span>.
                              </p>
                              <p className="mt-1 font-bold">
                                  Пожалуйста, измените почту в настройках профиля, иначе ваш аккаунт будет отключен в течение 24 часов.
                              </p>
                          </div>
                          <div className="mt-4">
                              <button 
                                onClick={() => setIsEditing(true)}
                                className="text-sm font-bold text-red-800 hover:text-red-900 underline"
                              >
                                  Изменить данные сейчас &rarr;
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* LEFT COLUMN: Profile Card */}
              <div className="lg:col-span-1">
                  <div className="bg-white rounded-3xl shadow-soft overflow-hidden border border-gray-100 relative">
                      {/* Cover */}
                      <div className="h-32 bg-[#002f6c] relative overflow-hidden">
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#bda06d] rounded-full blur-3xl opacity-30"></div>
                      </div>
                      
                      {/* Avatar */}
                      <div className="relative px-6 -mt-12 mb-4 flex justify-between items-end">
                          <div className="w-24 h-24 rounded-full bg-white p-1.5 shadow-lg">
                              <div className="w-full h-full bg-gradient-to-br from-[#002f6c] to-[#1e4a8a] rounded-full flex items-center justify-center text-white text-3xl font-bold uppercase shadow-inner">
                                  {user.name.charAt(0)}
                              </div>
                          </div>
                          {!isEditing && (
                              <button 
                                  onClick={() => setIsEditing(true)} 
                                  className="mb-2 text-gray-400 hover:text-[#002f6c] transition p-2 bg-gray-50 rounded-full hover:bg-blue-50"
                                  title="Редактировать профиль"
                              >
                                  <i className="fas fa-pen"></i>
                              </button>
                          )}
                      </div>

                      {/* Content */}
                      <div className="px-6 pb-8">
                          {isEditing ? (
                              <form onSubmit={handleSaveProfile} className="space-y-4">
                                  <div>
                                      <label className="text-xs font-bold text-gray-500 uppercase">Имя</label>
                                      <input 
                                          className="w-full border-b border-gray-300 py-1 text-sm focus:border-[#002f6c] outline-none font-bold text-gray-800"
                                          value={editForm.name}
                                          onChange={e => setEditForm({...editForm, name: e.target.value})}
                                      />
                                  </div>
                                  <div>
                                      <label className="text-xs font-bold text-gray-500 uppercase">Почта (обязательно @atu.edu.kz)</label>
                                      <input 
                                          type="email"
                                          className={`w-full border-b py-1 text-sm outline-none font-medium ${
                                              editForm.email?.toLowerCase().endsWith('@atu.edu.kz') 
                                              ? 'border-green-300 focus:border-green-500 text-gray-800' 
                                              : 'border-red-300 focus:border-red-500 text-red-600 bg-red-50'
                                          }`}
                                          value={editForm.email}
                                          onChange={e => setEditForm({...editForm, email: e.target.value})}
                                      />
                                      {!editForm.email?.toLowerCase().endsWith('@atu.edu.kz') && (
                                          <p className="text-[10px] text-red-500 mt-1">Должен быть @atu.edu.kz</p>
                                      )}
                                  </div>
                                  <div>
                                      <label className="text-xs font-bold text-gray-500 uppercase">Факультет</label>
                                      <input 
                                          className="w-full border-b border-gray-300 py-1 text-sm focus:border-[#002f6c] outline-none text-gray-700"
                                          value={editForm.faculty}
                                          onChange={e => setEditForm({...editForm, faculty: e.target.value})}
                                      />
                                  </div>
                                  <div>
                                      <label className="text-xs font-bold text-gray-500 uppercase">Телефон</label>
                                      <input 
                                          className="w-full border-b border-gray-300 py-1 text-sm focus:border-[#002f6c] outline-none text-gray-700"
                                          value={editForm.phone}
                                          onChange={e => setEditForm({...editForm, phone: e.target.value})}
                                      />
                                  </div>
                                  
                                  <div className="flex space-x-2 pt-2">
                                      <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200">Отмена</button>
                                      <button type="submit" className="flex-1 py-2 bg-[#002f6c] text-white rounded-lg text-xs font-bold hover:bg-[#1e4a8a] shadow-md">Сохранить</button>
                                  </div>
                              </form>
                          ) : (
                              <>
                                  <h2 className="text-2xl font-bold text-gray-800 leading-tight">{user.name}</h2>
                                  <p className="text-[#bda06d] font-bold text-xs uppercase tracking-wide mb-4">{user.faculty}</p>
                                  
                                  <div className="space-y-3">
                                      <div className="flex items-center text-sm text-gray-600">
                                          <div className="w-8 flex justify-center"><i className="fas fa-envelope text-[#002f6c]/70"></i></div>
                                          <span className={!isAtuEmail ? "text-red-600 font-medium" : ""}>{user.email}</span>
                                      </div>
                                      <div className="flex items-center text-sm text-gray-600">
                                          <div className="w-8 flex justify-center"><i className="fas fa-phone text-[#002f6c]/70"></i></div>
                                          <span>{user.phone || 'Не указан'}</span>
                                      </div>
                                      <div className="flex items-center text-sm">
                                          <div className="w-8 flex justify-center">
                                              {user.email_confirmed ? <i className="fas fa-check-circle text-green-500"></i> : <i className="fas fa-clock text-yellow-500"></i>}
                                          </div>
                                          <span className={user.email_confirmed ? "text-green-600 font-bold" : "text-yellow-600"}>
                                              {user.email_confirmed ? "Подтвержден" : "Ожидает подтверждения"}
                                          </span>
                                      </div>
                                  </div>

                                  <div className="mt-6 pt-6 border-t border-gray-100 flex justify-between items-center">
                                      <div className="text-center">
                                          <span className="block text-2xl font-bold text-[#002f6c]">{user.rating}</span>
                                          <span className="text-[10px] text-gray-400 uppercase font-bold">Рейтинг</span>
                                      </div>
                                      <div className="h-8 w-px bg-gray-200"></div>
                                      <div className="text-center">
                                          <span className="block text-2xl font-bold text-gray-800">{user.reviewCount}</span>
                                          <span className="text-[10px] text-gray-400 uppercase font-bold">Отзывов</span>
                                      </div>
                                      <div className="h-8 w-px bg-gray-200"></div>
                                      <div className="text-center">
                                          <span className="block text-2xl font-bold text-gray-800">{myTrips.length}</span>
                                          <span className="text-[10px] text-gray-400 uppercase font-bold">Поездок</span>
                                      </div>
                                  </div>
                              </>
                          )}
                      </div>
                  </div>
              </div>

              {/* RIGHT COLUMN: Activities */}
              <div className="lg:col-span-2">
                  {/* Tabs */}
                  <div className="flex space-x-6 border-b border-gray-200 mb-6 px-2">
                      <button 
                          className={`pb-3 text-sm font-bold uppercase tracking-wider transition ${activeTab === 'bookings' ? 'border-b-2 border-[#002f6c] text-[#002f6c]' : 'text-gray-400 hover:text-gray-600'}`}
                          onClick={() => setActiveTab('bookings')}
                      >
                          Бронирования
                      </button>
                      <button 
                          className={`pb-3 text-sm font-bold uppercase tracking-wider transition ${activeTab === 'trips' ? 'border-b-2 border-[#002f6c] text-[#002f6c]' : 'text-gray-400 hover:text-gray-600'}`}
                          onClick={() => setActiveTab('trips')}
                      >
                          Мои поездки
                      </button>
                      <button 
                          className={`pb-3 text-sm font-bold uppercase tracking-wider transition ${activeTab === 'reviews' ? 'border-b-2 border-[#002f6c] text-[#002f6c]' : 'text-gray-400 hover:text-gray-600'}`}
                          onClick={() => setActiveTab('reviews')}
                      >
                          Отзывы ({reviews.length})
                      </button>
                  </div>

                  <div className="space-y-4">
                      {activeTab === 'bookings' && (
                          myBookings.length === 0 ? (
                              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                                  <i className="fas fa-ticket-alt text-4xl text-gray-200 mb-3"></i>
                                  <p className="text-gray-500 font-medium">Нет активных бронирований</p>
                                  <button onClick={() => setPage('home')} className="mt-2 text-[#002f6c] text-sm hover:underline">Найти поездку</button>
                              </div>
                          ) : (
                              myBookings.map(b => (
                                  <div key={b.id} onClick={() => { if(b.trip) { setSelectedTripId(b.trip.id); setPage('trip-detail'); }}} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer flex justify-between items-center group">
                                      <div className="flex items-center">
                                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                                              b.status === 'confirmed' ? 'bg-green-100 text-green-600' : 
                                              b.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                                          }`}>
                                              <i className={`fas ${b.status === 'confirmed' ? 'fa-check' : b.status === 'rejected' ? 'fa-times' : 'fa-clock'}`}></i>
                                          </div>
                                          <div>
                                              <h4 className="font-bold text-gray-800 group-hover:text-[#002f6c] transition">{b.trip?.destination}</h4>
                                              <p className="text-xs text-gray-500">
                                                  {b.trip ? new Date(b.trip.date).toLocaleDateString() : 'Дата неизвестна'} • Водитель: {b.trip?.driverName}
                                              </p>
                                          </div>
                                      </div>
                                      <div className="text-right">
                                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                              b.status === 'confirmed' ? 'bg-green-50 text-green-700' : 
                                              b.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                                          }`}>
                                              {b.status === 'pending' ? 'Ожидание' : b.status === 'confirmed' ? 'Подтверждено' : 'Отклонено'}
                                          </span>
                                      </div>
                                  </div>
                              ))
                          )
                      )}

                      {activeTab === 'trips' && (
                          myTrips.length === 0 ? (
                              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                                  <i className="fas fa-car text-4xl text-gray-200 mb-3"></i>
                                  <p className="text-gray-500 font-medium">Вы еще не создавали поездок</p>
                                  <button onClick={() => setPage('create-trip')} className="mt-2 text-[#002f6c] text-sm hover:underline">Создать первую поездку</button>
                              </div>
                          ) : (
                              myTrips.map(t => (
                                  <div key={t.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition flex justify-between items-center group">
                                      <div>
                                          <div className="flex items-center mb-1">
                                              <span className="font-bold text-gray-800 text-lg group-hover:text-[#002f6c] transition">{t.destination}</span>
                                              <span className="mx-2 text-gray-300">|</span>
                                              <span className="text-sm text-gray-600">{new Date(t.date).toLocaleDateString()}</span>
                                          </div>
                                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                                              <span><i className="fas fa-chair mr-1"></i> {t.seats} мест</span>
                                              <span><i className="fas fa-tenge-sign mr-1"></i> {t.price}</span>
                                          </div>
                                      </div>
                                      <div className="flex space-x-2">
                                          <button 
                                              onClick={() => { setSelectedTripId(t.id); setPage('trip-detail'); }}
                                              className="w-8 h-8 rounded-full bg-gray-50 hover:bg-[#002f6c] hover:text-white transition flex items-center justify-center text-gray-500"
                                          >
                                              <i className="fas fa-eye"></i>
                                          </button>
                                          <button 
                                              onClick={() => { setSelectedTripId(t.id); setPage('edit-trip'); }}
                                              className="w-8 h-8 rounded-full bg-gray-50 hover:bg-[#bda06d] hover:text-white transition flex items-center justify-center text-gray-500"
                                          >
                                              <i className="fas fa-pen"></i>
                                          </button>
                                      </div>
                                  </div>
                              ))
                          )
                      )}

                      {activeTab === 'reviews' && (
                          reviews.length === 0 ? (
                              <div className="text-center py-12">
                                  <p className="text-gray-400">Отзывов пока нет.</p>
                              </div>
                          ) : (
                              reviews.map(r => (
                                  <div key={r.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                                      <div className="flex items-center justify-between mb-2">
                                          <span className="font-bold text-gray-800 text-sm">{r.authorName}</span>
                                          <div className="flex text-amber-400 text-xs">
                                              {"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}
                                          </div>
                                      </div>
                                      <p className="text-gray-600 text-sm italic">"{r.comment}"</p>
                                  </div>
                              ))
                          )
                      )}
                  </div>
              </div>
          </div>
      </div>
  );
};

export default Profile;