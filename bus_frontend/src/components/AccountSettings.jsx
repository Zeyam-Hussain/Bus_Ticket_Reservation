import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, Lock, Shield, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Save, Trash2, X } from 'lucide-react';

const AccountSettings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Delete Account Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setFullName(parsedUser.full_name || '');
      setEmail(parsedUser.email || '');
      setPhone(parsedUser.phone || '');
    } catch {
      navigate('/login');
    }
  }, [navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (newPassword && newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setIsLoading(true);

    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    const payload = {
      full_name: fullName,
      phone: phone,
    };

    if (newPassword) {
      if (!currentPassword) {
        setError('Current password is required to set a new password.');
        setIsLoading(false);
        return;
      }
      payload.new_password = newPassword;
      payload.current_password = currentPassword;
    }

    try {
      const response = await fetch('/api/user/update_profile.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile.');
      }

      if (data.status === 'success') {
        setSuccess('Profile details saved successfully!');
        
        const updatedUser = { ...user, full_name: fullName, phone: phone };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        window.dispatchEvent(new Event('storage'));
        
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        throw new Error(data.message || 'Error updating profile.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteError('');
    
    if (!deletePassword) {
      setDeleteError("Password is required to delete your account.");
      return;
    }

    setIsDeleting(true);

    const token = localStorage.getItem('access_token');
    
    try {
      const response = await fetch('/api/user/delete_account.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: deletePassword })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Failed to delete account");

      if (data.status === 'success') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('storage'));
        navigate('/');
      }
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0A0F1C] font-sans flex flex-col relative text-gray-200">
      
      {/* Autofill Reset Style Fix */}
      <style>{`
        input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px #121A2F inset !important;
          -webkit-text-fill-color: #f3f4f6 !important;
          caret-color: white;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
      
      {/* Background Soft Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-900/20 blur-[120px]" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-900/20 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full border-b border-gray-800 bg-[#0A0F1C]/80 backdrop-blur-xl">
        <div className="max-w-[1000px] mx-auto px-6 h-[72px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold text-sm tracking-wide">Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-blue-500/30">
               {fullName.substring(0, 2).toUpperCase()}
             </div>
          </div>
        </div>
      </header>

      {/* Main Single Page Settings Layout */}
      <main className="max-w-[1000px] w-full mx-auto relative z-10 flex-1 px-6 py-10">
        
        {/* Page Title Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Account Details</h1>
            <p className="text-gray-400 mt-1.5 text-sm font-medium">Review and update your personal information and security.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-[#121A2F] px-4 py-2 rounded-xl border border-gray-800">
             <Shield className="w-4 h-4 text-blue-500" />
             <span className="text-xs font-bold text-gray-300">Secured Setup</span>
          </div>
        </div>

        {/* Global Error/Success Alerts */}
        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold">{success}</span>
          </div>
        )}

        {/* The Card */}
        <div className="bg-[#121A2F]/90 backdrop-blur-2xl border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Cover/Avatar Section */}
          <div className="px-8 py-8 border-b border-gray-800 flex items-center gap-6">
             <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-4 ring-[#0A0F1C]">
               {fullName.substring(0, 2).toUpperCase()}
             </div>
             <div>
                <h3 className="text-xl font-bold text-white">{fullName}</h3>
                <p className="text-sm text-gray-400">{user.role === 'admin' ? 'Administrator' : 'Passenger'}</p>
             </div>
          </div>

          {/* Form Body */}
          <div className="p-8">
            <form onSubmit={handleUpdate} noValidate>
              
              {/* Row 1: Name & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-[13px] font-bold text-gray-400 tracking-wide uppercase">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full pl-11 pr-4 py-3.5 bg-[#0A0F1C] border border-gray-700/60 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="text-[13px] font-bold text-gray-400 tracking-wide uppercase">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full pl-11 pr-4 py-3.5 bg-[#0A0F1C] border border-gray-700/60 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Email (Full Width, disabled) */}
              <div className="mb-8">
                <div className="space-y-2">
                  <label htmlFor="email" className="flex items-center justify-between text-[13px] font-bold text-gray-400 tracking-wide uppercase">
                    <span>Email Address</span>
                    <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded uppercase tracking-wider">Read Only</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      className="w-full pl-11 pr-4 py-3.5 bg-[#0A0F1C]/50 border border-gray-800 rounded-xl text-sm font-medium text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="w-full border-t border-gray-800 my-8"></div>

              {/* Row 3: Security & Passwords */}
              <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-500" /> Security Updates
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="space-y-2">
                  <label htmlFor="currentPassword" className="text-[13px] font-bold text-gray-400 tracking-wide uppercase">Current Password</label>
                  <input
                    id="currentPassword"
                    type="password"
                    placeholder="Enter current"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3.5 bg-[#0A0F1C] border border-gray-700/60 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="newPassword" className="text-[13px] font-bold text-gray-400 tracking-wide uppercase">New Password</label>
                  <input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3.5 bg-[#0A0F1C] border border-gray-700/60 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-[13px] font-bold text-gray-400 tracking-wide uppercase">Confirm New</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3.5 bg-[#0A0F1C] border border-gray-700/60 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Form Action Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-gray-800 gap-4">
                 
                 {/* Left side actions */}
                 <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                   <button
                     type="submit"
                     disabled={isLoading || (!fullName && !phone && !currentPassword)}
                     className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-sm rounded-xl shadow-[0_4px_14px_0_theme(colors.blue.500/30)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                     Save Changes
                   </button>
                   <button
                     type="button"
                     onClick={() => navigate('/')}
                     className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm text-gray-400 hover:text-white hover:bg-[#1A2338] transition-all"
                   >
                     Cancel
                   </button>
                 </div>

                 {/* Right side delete */}
                 <button
                   type="button"
                   onClick={() => setShowDeleteModal(true)}
                   className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white active:scale-[0.98] font-bold text-sm rounded-xl border border-red-500/20 transition-all"
                 >
                   <Trash2 className="w-4 h-4" />
                   Delete Account
                 </button>
                 
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* DELETE ACCOUNT MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           {/* Backdrop */}
           <div 
             className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" 
             onClick={() => !isDeleting && setShowDeleteModal(false)}
           />
           
           {/* Modal Body */}
           <div className="relative w-full max-w-md bg-[#121A2F] border border-gray-800 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] p-6 sm:p-8 animate-in zoom-in-95 duration-200">
              
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-xl font-black text-white">Delete Account</h3>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                  Are you absolutely sure? This action cannot be undone. All your details and active bookings will be permanently removed.
                </p>
              </div>

              {deleteError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <form onSubmit={handleDeleteAccount} className="space-y-5">
                <div>
                  <label htmlFor="deletePassword" className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                    Enter Password to Confirm
                  </label>
                  <input
                    id="deletePassword"
                    type="password"
                    required
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0A0F1C] border border-gray-700/60 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                  />
                </div>
                
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={isDeleting}
                    className="px-5 py-2.5 text-sm font-bold text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isDeleting || !deletePassword}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50"
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {isDeleting ? 'Deleting...' : 'Yes, Delete My Account'}
                  </button>
                </div>
              </form>

           </div>
        </div>
      )}

    </div>
  );
};

export default AccountSettings;
