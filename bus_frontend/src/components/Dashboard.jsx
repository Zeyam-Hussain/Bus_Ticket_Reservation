import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  // Safe parsing to avoid crashes if localStorage is empty
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="flex justify-between items-center mb-8 border-b pb-6">
          <div className="flex items-center space-x-2">
             <div className="bg-black text-white font-bold p-1 rounded">ar.</div>
             <h1 className="text-2xl font-bold text-gray-800 tracking-wide">AllRide Dashboard</h1>
          </div>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded hover:bg-red-50 transition"
          >
            Logout
          </button>
        </div>
        
        <div className="bg-blue-50 border-l-4 border-[#1A56DB] p-6 rounded-r-md">
          <h2 className="text-2xl font-semibold mb-2 text-gray-800">Welcome back, {user.full_name}!</h2>
          <p className="text-gray-600">You are currently logged in as a <span className="font-bold text-[#1A56DB] uppercase">{user.role}</span>.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
