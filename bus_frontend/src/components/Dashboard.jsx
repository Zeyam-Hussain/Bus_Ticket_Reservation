import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { LayoutDashboard, Route as RouteIcon, Ticket, LogOut, Plus, Trash2, Edit, AlertTriangle, Bus } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Overview Data
  const [dashboardData, setDashboardData] = useState(null);
  
  // Old Data Cleanup
  const [oldData, setOldData] = useState(null);
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
  const [selectedCleanupItems, setSelectedCleanupItems] = useState({ routes: [], bookings: [], buses: [] });

  // Routes Data
  const [routes, setRoutes] = useState([]);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [routeFormData, setRouteFormData] = useState({ 
    route_id: '', 
    bus_id: '', 
    source_city: '', 
    destination_city: '', 
    departure_time: '', 
    arrival_time: '', 
    base_fare: '' 
  });
  
  // Bookings Data
  const [bookings, setBookings] = useState([]);

  // Buses Data
  const [buses, setBuses] = useState([]);
  const [isBusModalOpen, setIsBusModalOpen] = useState(false);
  const [busFormData, setBusFormData] = useState({ 
    bus_id: '', 
    bus_type: '', 
    registration_number: '', 
    total_capacity: '' 
  });



  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (!storedUser || storedUser.role !== 'admin') {
      navigate('/admin-auth');
    } else {
      setUser(storedUser);
      fetchDashboardData();
      fetchRoutes();
      fetchBookings();
      fetchBuses();
      fetchOldData();
    }
  }, [navigate]);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  });

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/admin/dashboard.php', { headers: getHeaders() });
      const data = await res.json();
      if (data.status === 'success') {
        setDashboardData(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const res = await fetch('/api/admin/get_all_routes.php', { headers: getHeaders() });
      const data = await res.json();
      if (data.status === 'success') {
        setRoutes(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/admin/get_all_bookings.php', { headers: getHeaders() });
      const data = await res.json();
      if (data.status === 'success') {
        setBookings(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBuses = async () => {
    try {
      const res = await fetch('/api/buses/getBuses.php', { headers: getHeaders() });
      const data = await res.json();
      if (data.status === 'success') {
        setBuses(data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBuses = async () => {
    try {
      const res = await fetch('/api/buses/getBuses.php', { headers: getHeaders() });
      const data = await res.json();
      if (data.status === 'success') {
        setBuses(data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOldData = async () => {
    try {
      const res = await fetch('/api/admin/get_old_data.php', { headers: getHeaders() });
      const data = await res.json();
      if (data.status === 'success') {
        setOldData(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteOldData = async (deleteAll = false) => {
    if (!window.confirm('Are you sure you want to delete this data? This cannot be undone.')) return;
    
    try {
      const payload = deleteAll ? { delete_all: true } : {
        route_ids: selectedCleanupItems.routes,
        booking_ids: selectedCleanupItems.bookings,
        bus_ids: selectedCleanupItems.buses
      };

      const res = await fetch('/api/admin/delete_old_data.php', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert(data.message);
        setIsCleanupModalOpen(false);
        fetchOldData();
        fetchDashboardData();
        fetchRoutes();
        fetchBookings();
        fetchBuses();
      } else {
        alert(data.message);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to delete old data');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleRouteSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!routeFormData.route_id;
    const url = isEdit ? '/api/admin/update_route.php' : '/api/admin/create_route.php';
    const method = isEdit ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method: method,
        headers: getHeaders(),
        body: JSON.stringify(routeFormData)
      });
      const data = await res.json();
      if (data.status === 'success') {
        fetchRoutes();
        setIsRouteModalOpen(false);
        setRouteFormData({ route_id: '', bus_id: '', source_city: '', destination_city: '', departure_time: '', arrival_time: '', base_fare: '' });
      } else {
        alert(data.message);
      }
    } catch (e) {
      console.error(e);
      alert('Error saving route');
    }
  };

  const handleDeleteRoute = async (routeId) => {
    if (!window.confirm('Are you sure you want to delete this route?')) return;
    try {
      const res = await fetch('/api/admin/delete_route.php', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ route_id: routeId })
      });
      const data = await res.json();
      if (data.status === 'success') {
        fetchRoutes();
      } else {
        alert(data.message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBusSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!busFormData.bus_id;
    const url = isEdit ? '/api/buses/update_bus.php' : '/api/buses/create_bus.php';
    const method = isEdit ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method: method,
        headers: getHeaders(),
        body: JSON.stringify(busFormData)
      });
      const data = await res.json();
      if (data.status === 'success') {
        fetchBuses();
        setIsBusModalOpen(false);
        setBusFormData({ bus_id: '', bus_type: '', registration_number: '', total_capacity: '' });
      } else {
        alert(data.message);
      }
    } catch (e) {
      console.error(e);
      alert('Error saving bus');
    }
  };

  const handleDeleteBus = async (busId) => {
    if (!window.confirm('Are you sure you want to delete this bus?')) return;
    try {
      const res = await fetch('/api/buses/delete_bus.php', {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({ bus_id: busId })
      });
      const data = await res.json();
      if (data.status === 'success') {
        fetchBuses();
      } else {
        alert(data.message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBusSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!busFormData.bus_id;
    const url = isEdit ? '/api/buses/update_bus.php' : '/api/buses/create_bus.php';
    const method = isEdit ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method: method,
        headers: getHeaders(),
        body: JSON.stringify(busFormData)
      });
      const data = await res.json();
      if (data.status === 'success') {
        fetchBuses();
        setIsBusModalOpen(false);
        setBusFormData({ bus_id: '', bus_type: '', registration_number: '', total_capacity: '' });
      } else {
        alert(data.message);
      }
    } catch (e) {
      console.error(e);
      alert('Error saving bus');
    }
  };

  const handleDeleteBus = async (busId) => {
    if (!window.confirm('Are you sure you want to delete this bus?')) return;
    try {
      const res = await fetch('/api/buses/delete_bus.php', {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({ bus_id: busId })
      });
      const data = await res.json();
      if (data.status === 'success') {
        fetchBuses();
      } else {
        alert(data.message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const res = await fetch('/api/admin/cancel_booking.php', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ booking_id: bookingId })
      });
      const data = await res.json();
      if (data.status === 'success') {
        fetchBookings();
      } else {
        alert(data.message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 flex flex-col p-6">
        <div className="flex items-center gap-2 mb-10">
          <div className="bg-black text-white font-bold p-1 rounded text-sm">ar.</div>
          <span className="text-xl font-bold tracking-tight">Admin Panel</span>
        </div>
        
        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-gray-100 text-black' : 'text-gray-500 hover:text-black hover:bg-gray-50'}`}
          >
            <LayoutDashboard className="w-5 h-5" /> Overview
          </button>
          <button 
            onClick={() => setActiveTab('routes')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'routes' ? 'bg-gray-100 text-black' : 'text-gray-500 hover:text-black hover:bg-gray-50'}`}
          >
            <RouteIcon className="w-5 h-5" /> Routes
          </button>
          <button 
            onClick={() => setActiveTab('bookings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'bookings' ? 'bg-gray-100 text-black' : 'text-gray-500 hover:text-black hover:bg-gray-50'}`}
          >
            <Ticket className="w-5 h-5" /> Bookings
          </button>
          <button 
            onClick={() => setActiveTab('buses')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'buses' ? 'bg-gray-100 text-black' : 'text-gray-500 hover:text-black hover:bg-gray-50'}`}
          >
            <Bus className="w-5 h-5" /> Buses
          </button>

        </nav>

        <button 
          onClick={handleLogout}
          className="mt-auto flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-auto">
        {activeTab === 'overview' && dashboardData && (
          <div className="space-y-8 animate-in fade-in">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-1">Dashboard Overview</h2>
              <p className="text-gray-500">Welcome back, {user?.full_name}. Here's what's happening today.</p>
            </div>

            {/* Old Data Warning Banner */}
            {oldData && (oldData.counts.routes > 0 || oldData.counts.bookings > 0 || oldData.counts.buses > 0) && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="text-amber-800 font-bold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Data Cleanup Recommended
                  </h3>
                  <p className="text-amber-700 text-sm mt-1">
                    There are {oldData.counts.routes} routes, {oldData.counts.bookings} bookings, and {oldData.counts.buses} buses older than 10 days taking up space.
                  </p>
                </div>
                <button 
                  onClick={() => setIsCleanupModalOpen(true)}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
                >
                  Review & Clean Up
                </button>
              </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { title: 'Total Revenue', value: `Rs. ${dashboardData.kpis.total_revenue}` },
                { title: 'Total Bookings', value: dashboardData.kpis.total_bookings },
                { title: 'Total Buses', value: dashboardData.kpis.total_buses },
                { title: 'Total Customers', value: dashboardData.kpis.total_customers }
              ].map((kpi, i) => (
                <div key={i} className="p-6 border border-gray-200 rounded-xl">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">{kpi.title}</h3>
                  <p className="text-3xl font-bold">{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border border-gray-200 p-6 rounded-xl">
                <h3 className="text-lg font-bold mb-6">Revenue Over Time</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dashboardData.chart_data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="month_name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} padding={{ left: 30, right: 30 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dx={-10} />
                      <RechartsTooltip cursor={{ stroke: '#e5e7eb', strokeWidth: 2 }} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Line type="monotone" dataKey="monthly_revenue" stroke="#000" strokeWidth={3} dot={{ r: 4, fill: '#000' }} activeDot={{ r: 6 }} name="Revenue (Rs.)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="border border-gray-200 p-6 rounded-xl">
                <h3 className="text-lg font-bold mb-6">Tickets Sold</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData.chart_data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="month_name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} padding={{ left: 30, right: 30 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dx={-10} allowDecimals={false} />
                      <RechartsTooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="tickets_sold" fill="#000" maxBarSize={50} radius={[4, 4, 0, 0]} name="Tickets" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'routes' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight mb-1">Routes Management</h2>
                <p className="text-gray-500">Manage all bus routes in the system.</p>
              </div>
              <button 
                onClick={() => {
                  setRouteFormData({ route_id: '', bus_id: '', source_city: '', destination_city: '', departure_time: '', arrival_time: '', base_fare: '' });
                  setIsRouteModalOpen(true);
                }}
                className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Route
              </button>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 font-medium text-gray-500">ID</th>
                    <th className="px-6 py-4 font-medium text-gray-500">Bus ID</th>
                    <th className="px-6 py-4 font-medium text-gray-500">Source</th>
                    <th className="px-6 py-4 font-medium text-gray-500">Destination</th>
                    <th className="px-6 py-4 font-medium text-gray-500">Departure</th>
                    <th className="px-6 py-4 font-medium text-gray-500">Arrival</th>
                    <th className="px-6 py-4 font-medium text-gray-500">Fare</th>
                    <th className="px-6 py-4 font-medium text-gray-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {routes.map(route => (
                    <tr key={route.route_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{route.route_id}</td>
                      <td className="px-6 py-4">{route.bus_id}</td>
                      <td className="px-6 py-4">{route.source_city}</td>
                      <td className="px-6 py-4">{route.destination_city}</td>
                      <td className="px-6 py-4">{route.departure_time}</td>
                      <td className="px-6 py-4">{route.arrival_time}</td>
                      <td className="px-6 py-4">Rs. {route.base_fare}</td>
                      <td className="px-6 py-4 flex items-center justify-end gap-3">
                        <button 
                          onClick={() => {
                            setRouteFormData({
                              route_id: route.route_id,
                              bus_id: route.bus_id,
                              source_city: route.source_city,
                              destination_city: route.destination_city,
                              departure_time: route.departure_time,
                              arrival_time: route.arrival_time,
                              base_fare: route.base_fare
                            });
                            setIsRouteModalOpen(true);
                          }}
                          className="text-gray-400 hover:text-black transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteRoute(route.route_id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {routes.length === 0 && (
                    <tr>
                      <td colSpan="8" className="px-6 py-8 text-center text-gray-500">No routes found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-1">Bookings Management</h2>
              <p className="text-gray-500">View and manage all customer bookings.</p>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 font-medium text-gray-500">ID</th>
                    <th className="px-6 py-4 font-medium text-gray-500">Customer</th>
                    <th className="px-6 py-4 font-medium text-gray-500">Route</th>
                    <th className="px-6 py-4 font-medium text-gray-500">Date</th>
                    <th className="px-6 py-4 font-medium text-gray-500">Status</th>
                    <th className="px-6 py-4 font-medium text-gray-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bookings.map(booking => (
                    <tr key={booking.booking_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{booking.booking_id}</td>
                      <td className="px-6 py-4">{booking.passenger_name || `User #${booking.user_id}`}</td>
                      <td className="px-6 py-4">Route #{booking.route_id}</td>
                      <td className="px-6 py-4">{new Date(booking.booking_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          booking.booking_status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                          booking.booking_status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.booking_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex items-center justify-end">
                        {booking.booking_status !== 'cancelled' && (
                          <button 
                            onClick={() => handleCancelBooking(booking.booking_id)}
                            className="text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No bookings found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'buses' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight mb-1">Fleet Management</h2>
                <p className="text-gray-500">Manage your buses and fleet capacity.</p>
              </div>
              <button 
                onClick={() => {
                  setBusFormData({ bus_id: '', bus_type: '', registration_number: '', total_capacity: '' });
                  setIsBusModalOpen(true);
                }}
                className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Bus
              </button>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 font-medium text-gray-500">Bus ID</th>
                    <th className="px-6 py-4 font-medium text-gray-500">Registration Number</th>
                    <th className="px-6 py-4 font-medium text-gray-500">Bus Type</th>
                    <th className="px-6 py-4 font-medium text-gray-500">Total Capacity</th>
                    <th className="px-6 py-4 font-medium text-gray-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {buses.map(bus => (
                    <tr key={bus.bus_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{bus.bus_id}</td>
                      <td className="px-6 py-4">{bus.registration_number}</td>
                      <td className="px-6 py-4 capitalize">{bus.bus_type}</td>
                      <td className="px-6 py-4">{bus.total_capacity}</td>
                      <td className="px-6 py-4 flex items-center justify-end gap-3">
                        <button 
                          onClick={() => {
                            setBusFormData({
                              bus_id: bus.bus_id,
                              bus_type: bus.bus_type,
                              registration_number: bus.registration_number,
                              total_capacity: bus.total_capacity
                            });
                            setIsBusModalOpen(true);
                          }}
                          className="text-gray-400 hover:text-black transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteBus(bus.bus_id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {buses.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No buses found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Route Modal */}
      {isRouteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-6">{routeFormData.route_id ? 'Edit Route' : 'Add New Route'}</h3>
            <form onSubmit={handleRouteSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bus ID</label>
                  <input type="text" required value={routeFormData.bus_id} onChange={e => setRouteFormData({...routeFormData, bus_id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <input type="text" required value={routeFormData.source_city} onChange={e => setRouteFormData({...routeFormData, source_city: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                  <input type="text" required value={routeFormData.destination_city} onChange={e => setRouteFormData({...routeFormData, destination_city: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departure (YYYY-MM-DD HH:MM:SS)</label>
                  <input type="text" placeholder="2024-05-20 10:00:00" required value={routeFormData.departure_time} onChange={e => setRouteFormData({...routeFormData, departure_time: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Arrival (YYYY-MM-DD HH:MM:SS)</label>
                  <input type="text" placeholder="2024-05-20 14:00:00" required value={routeFormData.arrival_time} onChange={e => setRouteFormData({...routeFormData, arrival_time: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Fare (Rs.)</label>
                  <input type="number" required value={routeFormData.base_fare} onChange={e => setRouteFormData({...routeFormData, base_fare: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsRouteModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">Save Route</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Bus Modal */}
      {isBusModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-6">{busFormData.bus_id ? 'Edit Bus' : 'Add New Bus'}</h3>
            <form onSubmit={handleBusSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                  <input type="text" placeholder="e.g., LHR-1234" required value={busFormData.registration_number} onChange={e => setBusFormData({...busFormData, registration_number: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bus Type</label>
                  <select required value={busFormData.bus_type} onChange={e => setBusFormData({...busFormData, bus_type: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white">
                    <option value="" disabled>Select a type</option>
                    <option value="standard">Standard</option>
                    <option value="luxury">Luxury</option>
                    <option value="sleeper">Sleeper</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Capacity</label>
                  <input type="number" min="1" max="100" required value={busFormData.total_capacity} onChange={e => setBusFormData({...busFormData, total_capacity: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsBusModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">Save Bus</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Data Cleanup Modal */}
      {isCleanupModalOpen && oldData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              Delete Old Data
            </h3>
            <p className="text-gray-600 mb-6 text-sm">
              The following records are older than 10 days. You can delete them all at once to free up database space. This action cannot be undone.
            </p>

            <div className="space-y-4 mb-8">
              <div className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-gray-900">Old Routes</h4>
                  <p className="text-sm text-gray-500">Departure dates older than 10 days</p>
                </div>
                <div className="text-xl font-black">{oldData.counts.routes}</div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-gray-900">Old Bookings</h4>
                  <p className="text-sm text-gray-500">Booking dates older than 10 days</p>
                </div>
                <div className="text-xl font-black">{oldData.counts.bookings}</div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-gray-900">Old Buses</h4>
                  <p className="text-sm text-gray-500">Buses created more than 10 days ago</p>
                </div>
                <div className="text-xl font-black">{oldData.counts.buses}</div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => handleDeleteOldData(true)}
                className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Delete All {oldData.counts.routes + oldData.counts.bookings + oldData.counts.buses} Old Records
              </button>
              <button 
                onClick={() => setIsCleanupModalOpen(false)} 
                className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel & Keep Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
