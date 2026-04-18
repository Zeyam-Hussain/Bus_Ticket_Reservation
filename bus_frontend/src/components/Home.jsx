import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Navigation Bar */}
      <nav className="w-full bg-white shadow-sm px-6 py-4 flex justify-between items-center z-10 relative">
        <div className="flex items-center space-x-2">
          <div className="bg-black text-white font-bold p-1 rounded">ar.</div>
          <span className="text-xl font-bold tracking-wide text-gray-800">AllRide</span>
        </div>
        
        {/* Top Right Login Button */}
        <Link 
          to="/login"
          className="bg-[#1A56DB] text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700 transition shadow-sm"
        >
          Login
        </Link>
      </nav>
      
      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center text-center p-6 relative">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 drop-shadow-sm">
          Welcome by Zeyam hussain
        </h1>
      </main>
    </div>
  );
};

export default Home;
