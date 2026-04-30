import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ticket, Calendar, MapPin, Clock, CreditCard, User, Tag, Eye } from 'lucide-react';
import TicketView from './TicketView';

export default function MyBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch('/api/user/my_bookings.php', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                // Token might be expired, TokenGuardian usually handles this but just in case
                localStorage.removeItem('access_token');
                navigate('/login');
                return;
            }

            const data = await response.json();
            
            if (data.status === 'success') {
                setBookings(data.data || []);
            } else {
                setError(data.message || 'Failed to load bookings');
            }
        } catch (err) {
            setError('An error occurred while fetching your bookings.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
            return;
        }

        setIsCancelling(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('/api/user/cancel_booking.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ booking_id: bookingId })
            });
            const data = await response.json();
            if (data.status === 'success') {
                // Update local state to reflect cancellation
                setBookings(bookings.map(b => b.booking_id === bookingId ? { ...b, booking_status: 'cancelled', transaction_status: 'refunded' } : b));
            } else {
                alert(data.message || 'Failed to cancel booking.');
            }
        } catch (error) {
            console.error('Error cancelling booking:', error);
            alert('An error occurred while cancelling the booking.');
        } finally {
            setIsCancelling(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'confirmed': return 'text-green-400 bg-green-400/10 border-green-400/20';
            case 'pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'cancelled': return 'text-red-400 bg-red-400/10 border-red-400/20';
            default: return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                            <Ticket className="text-blue-500 w-8 h-8" />
                            My Bookings
                        </h1>
                        <p className="text-gray-400">Manage and view your travel history</p>
                    </div>
                    <Link to="/" className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium">
                        &larr; Back to Home
                    </Link>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-400">Loading your bookings...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
                        <p className="text-red-400 mb-4">{error}</p>
                        <button 
                            onClick={fetchBookings}
                            className="px-6 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="bg-[#0f172a] border border-blue-900/30 rounded-3xl p-12 text-center shadow-xl">
                        <div className="w-20 h-20 bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Ticket className="w-10 h-10 text-blue-500/50" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No Bookings Found</h3>
                        <p className="text-gray-400 mb-8 max-w-md mx-auto">You haven't made any bus reservations yet. Ready for your next adventure?</p>
                        <Link to="/book" className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                            Book a Ticket Now
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {bookings.map((booking) => (
                            <div key={booking.booking_id} className="bg-[#0f172a] border border-blue-900/30 rounded-2xl overflow-hidden hover:border-blue-700/50 transition-all shadow-lg group">
                                <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-center">
                                    
                                    {/* Date & Route Container */}
                                    <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                <Calendar className="w-4 h-4 text-blue-400" />
                                                <span>Booking #{booking.booking_id}</span>
                                                <span className="mx-2">•</span>
                                                <span>{new Date(booking.booking_date).toLocaleDateString()}</span>
                                            </div>
                                            
                                            <div className="relative pl-8 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-900/50">
                                                <div className="relative">
                                                    <div className="absolute -left-8 top-1 w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30">
                                                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                                    </div>
                                                    <h4 className="text-lg font-bold text-white">{booking.source_city}</h4>
                                                    <p className="text-sm text-gray-400">{booking.departure_time || 'TBD'}</p>
                                                </div>
                                                <div className="relative">
                                                    <div className="absolute -left-8 top-1 w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center border border-purple-500/30">
                                                        <MapPin className="w-3 h-3 text-purple-400" />
                                                    </div>
                                                    <h4 className="text-lg font-bold text-white">{booking.destination_city}</h4>
                                                    <p className="text-sm text-gray-400">{booking.arrival_time || 'TBD'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 flex flex-col justify-center">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5"/> Seat</p>
                                                    <p className="text-white font-bold">{booking.seat_number || 'Unassigned'}</p>
                                                </div>
                                                <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                                                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5"/> Total</p>
                                                    <p className="text-white font-bold font-mono">Rs {booking.total_amount}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5">
                                                <span className="text-sm text-gray-400">Status</span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusColor(booking.booking_status)}`}>
                                                    {booking.booking_status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="w-full md:w-auto flex md:flex-col gap-3 justify-center border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8">
                                        <button 
                                            onClick={() => setSelectedTicket(booking)}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-xl font-bold transition-all border border-blue-500/30 hover:border-blue-500 group-hover:shadow-[0_0_15px_rgba(37,99,235,0.2)]"
                                        >
                                            <Eye className="w-5 h-5" />
                                            <span>View Ticket</span>
                                        </button>
                                        
                                        {booking.booking_status?.toLowerCase() === 'confirmed' && (
                                            <button 
                                                onClick={() => handleCancelBooking(booking.booking_id)}
                                                disabled={isCancelling}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-red-600/10 text-red-400 hover:bg-red-600/20 hover:text-red-300 rounded-xl font-bold transition-all border border-red-500/20 hover:border-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <span>Cancel</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Ticket Modal */}
            {selectedTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" style={{ zIndex: 9999 }}>
                    <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <button 
                            onClick={() => setSelectedTicket(null)}
                            className="absolute -top-12 right-0 md:-right-12 text-white/70 hover:text-white transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        
                        <button 
                            onClick={() => window.print()}
                            className="absolute -top-12 left-0 text-white/70 hover:text-white transition-colors flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>Download Ticket</span>
                        </button>

                        <div className="animate-in fade-in zoom-in duration-300">
                            <TicketView ticket={selectedTicket} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
