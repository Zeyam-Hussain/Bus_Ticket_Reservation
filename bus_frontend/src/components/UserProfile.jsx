import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, Lock, Ticket, MapPin, Map } from 'lucide-react';

const UserProfile = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState(null);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Safe parse session
        const fetchUser = () => {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch {
                    console.error("Failed to parse user data from local storage.");
                }
            } else {
                setUser(null);
            }
        };

        fetchUser();

        // Listen for storage changes if managing state across tabs, though minimal impact here
        window.addEventListener('storage', fetchUser);

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            window.removeEventListener('storage', fetchUser);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setUser(null);
        setIsOpen(false);
        navigate('/');
        // Dispatch event in case other components depend on it (refreshing the page is an alternative)
        window.dispatchEvent(new Event('storage'));
    };

    // Calculate initials
    const initials = user && user.full_name 
        ? user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : 'G'; // 'G' for Guest

    return (
        <div className="relative" ref={dropdownRef} style={{ zIndex: 9999 }}>
            {/* The Round Icon */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-[#101b44] flex items-center justify-center text-white font-bold text-sm shadow-md hover:shadow-blue-500/40 transition-all border border-blue-400/50 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                aria-label="User Profile Menu"
            >
                {initials}
            </button>

            {/* The Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-[320px] bg-[#06102B] border border-blue-900/40 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl transform origin-top-right transition-all animate-in fade-in zoom-in duration-200">
                    
                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-blue-600 to-[#151F42] p-6 relative overflow-hidden shadow-sm">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center text-white font-bold text-xl backdrop-blur-md shadow-inner">
                                {initials}
                            </div>
                            <div className="overflow-hidden">
                                <h3 className="text-white font-bold text-lg leading-tight truncate">
                                    {user ? user.full_name : 'Guest Account'}
                                </h3>
                                <p className="text-blue-100 text-xs font-medium truncate mt-0.5">
                                    {user ? user.email : 'Not logged in'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Content Body */}
                    <div className="p-2 py-3">
                        {user ? (
                            <>
                                <div className="px-3">
                                    <Link to="/my-bookings" onClick={() => setIsOpen(false)} className="flex items-center justify-between bg-[#121A37] p-4 rounded-2xl mb-3 border border-blue-900/30 hover:border-blue-700/50 transition-colors cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-500/20 p-2.5 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                                                <Ticket className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-white text-sm font-bold">My Bookings</h4>
                                                <p className="text-gray-400 text-xs font-medium">History & details</p>
                                            </div>
                                        </div>
                                    </Link>
                                    
                                    <Link to="/account-settings" onClick={() => setIsOpen(false)} className="w-full flex items-center gap-3 p-3 text-gray-300 hover:text-white hover:bg-[#121A37] rounded-xl transition-all mb-1 text-left group">
                                        <Settings className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                                        <span className="font-semibold text-sm">Account Settings</span>
                                    </Link>
                                </div>
                                <div className="h-px bg-gradient-to-r from-transparent via-blue-900/50 to-transparent my-2"></div>
                                <div className="px-2">
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 p-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all text-left"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        <span className="font-bold text-sm">Log out securely</span>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="p-4">
                                <div className="text-center mb-6 mt-3">
                                    <div className="w-16 h-16 bg-[#121A37] rounded-2xl mx-auto flex items-center justify-center mb-4 border border-blue-900/30 shadow-lg relative overflow-hidden">
                                        <div className="absolute inset-0 bg-blue-500/10 animate-pulse"></div>
                                        <Lock className="w-7 h-7 text-blue-500 relative z-10" />
                                    </div>
                                    <h4 className="text-white font-bold text-base mb-1.5 tracking-tight">Track Your Journeys</h4>
                                    <p className="text-gray-400 text-[13px] px-2 leading-relaxed">Log in to manage your tickets, save routes, and unlock premium deals.</p>
                                </div>
                                
                                <div className="flex flex-col gap-2.5">
                                    <Link to="/login" onClick={() => setIsOpen(false)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_0_theme(colors.blue.500/40)] transition-all text-center text-[15px] active:scale-[0.98]">
                                        Sign In
                                    </Link>
                                    <Link to="/register" onClick={() => setIsOpen(false)} className="w-full bg-[#121A37] hover:bg-[#1C2545] border border-blue-900/50 text-gray-200 font-bold py-3.5 rounded-xl transition-all text-center text-[15px] active:scale-[0.98]">
                                        Create New Account
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
