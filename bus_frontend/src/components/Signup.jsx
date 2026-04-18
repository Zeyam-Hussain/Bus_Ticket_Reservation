import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const SignUp = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        confirm_password: '',
    });

    const [showPwd, setShowPwd] = useState(false);
    const [showConfirmPwd, setShowConfirmPwd] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const validate = () => {
        const { full_name, email, phone, password, confirm_password } = formData;

        if (!full_name.trim() || !email.trim() || !phone.trim() || !password || !confirm_password) {
            return 'All fields are required.';
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return 'Please enter a valid email address.';
        }
        if (password !== confirm_password) {
            return 'Passwords do not match.';
        }
        if (
            password.length < 8 ||
            !/[A-Z]/.test(password) ||
            !/[a-z]/.test(password) ||
            !/[0-9]/.test(password) ||
            !/[\W_]/.test(password)
        ) {
            return 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.';
        }
        return null;
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');

        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/user/register.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed. Please try again.');
            }

            if (data.status === 'success') {
                navigate('/verify-otp', { state: { email: formData.email } });
            } else {
                throw new Error(data.message || 'Registration failed.');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const features = [
        'Join thousands of travellers who ride smarter every day.',
        'Secure seats in seconds — no queues, no hassle.',
        'Your journey, your schedule. Comfort starts here.',
    ];

    return (
        <div className="min-h-screen flex flex-col md:flex-row font-sans">

            {/* ── LEFT PANEL — Deep Blue Background (matches Login right panel palette) ── */}
            <aside className="hidden md:flex md:w-5/12 lg:w-[45%] flex-col bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-8 lg:p-12 relative overflow-hidden">

                {/* Subtle radial overlay */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />

                {/* Brand */}
                <div className="flex flex-shrink-0 items-center gap-3 z-10 mb-10">
                    <div className="bg-white text-blue-700 font-black text-base px-2.5 py-1.5 rounded-lg shadow-md">
                        ar.
                    </div>
                    <span className="text-2xl font-black tracking-tight text-white">AllRide</span>
                </div>

                {/* Hero Text */}
                <div className="z-10 flex-1 flex flex-col justify-center">
                    <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
                        Start your<br />
                        <span className="text-blue-300">journey today.</span>
                    </h2>
                    <p className="text-blue-200 text-base font-medium mb-12 max-w-xs leading-relaxed">
                        Create a free account and experience bus travel the way it should be — simple, reliable, and on your terms.
                    </p>

                    {/* Feature list */}
                    <ul className="space-y-4">
                        {features.map((feat, i) => (
                            <li
                                key={i}
                                className="flex items-start gap-4 p-4 rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm hover:bg-white/15 transition-all duration-300"
                            >
                                <div className="p-1 rounded-full bg-blue-400/20 shrink-0">
                                    <CheckCircle2 className="w-5 h-5 text-blue-300" />
                                </div>
                                <span className="text-sm font-semibold text-white/90 leading-relaxed">
                                    {feat}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Bottom tagline */}
                <div className="z-10 mt-8">
                    <p className="text-blue-300/70 text-xs font-medium">
                        Trusted by commuters across Pakistan since 2000.
                    </p>
                </div>
            </aside>

            {/* ── RIGHT PANEL — White background with form ────────────────────────── */}
            <main className="flex flex-col flex-1 min-h-screen bg-gray-50 md:bg-white relative">

                {/* Mobile-only top brand bar */}
                <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-200 bg-white md:hidden sticky top-0 z-20 shadow-sm">
                    <div className="bg-blue-600 text-white font-black text-xs px-2 py-1 rounded shadow-sm relative z-10">
                        ar.
                    </div>
                    <span className="text-lg font-black tracking-tight text-gray-900 relative z-10">AllRide</span>
                </div>

                {/* Centered card */}
                <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-8 md:px-10 z-10">
                    <div className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-xl md:shadow-none border border-gray-100 md:border-none p-6 sm:p-10">

                        {/* Heading */}
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">
                            Create Account
                        </h1>
                        <p className="text-sm font-medium text-gray-500 mb-7">
                            Fill in your details to get started — it only takes a minute.
                        </p>

                        {/* Error banner */}
                        {error && (
                            <div className="flex items-start gap-3 mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 animate-shake">
                                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                                <span className="font-medium">{error}</span>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSignUp} className="space-y-4" noValidate>

                            {/* Full Name */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="full_name" className="text-[13px] font-bold uppercase tracking-wider text-gray-600">
                                    Full Name <span className="text-red-500 normal-case">*</span>
                                </label>
                                <input
                                    id="full_name"
                                    name="full_name"
                                    type="text"
                                    required
                                    autoComplete="name"
                                    placeholder="Zeyam Hussaind3"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 font-medium
                             placeholder-gray-400 outline-none
                             focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10
                             transition-all duration-200"
                                />
                            </div>

                            {/* Email */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="email" className="text-[13px] font-bold uppercase tracking-wider text-gray-600">
                                    Email <span className="text-red-500 normal-case">*</span>
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    placeholder="you@email.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 font-medium
                             placeholder-gray-400 outline-none
                             focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10
                             transition-all duration-200"
                                />
                            </div>

                            {/* Phone */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="phone" className="text-[13px] font-bold uppercase tracking-wider text-gray-600">
                                    Phone <span className="text-red-500 normal-case">*</span>
                                </label>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    required
                                    autoComplete="tel"
                                    placeholder="+92 300 1234567"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 font-medium
                             placeholder-gray-400 outline-none
                             focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10
                             transition-all duration-200"
                                />
                            </div>

                            {/* Password */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="password" className="text-[13px] font-bold uppercase tracking-wider text-gray-600">
                                    Password <span className="text-red-500 normal-case">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPwd ? 'text' : 'password'}
                                        required
                                        autoComplete="new-password"
                                        placeholder="Min 8 chars, upper, lower, number, symbol"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3.5 pr-12 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 font-medium
                               placeholder-gray-400 outline-none
                               focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10
                               transition-all duration-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPwd((v) => !v)}
                                        aria-label={showPwd ? 'Hide password' : 'Show password'}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                                    >
                                        {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="confirm_password" className="text-[13px] font-bold uppercase tracking-wider text-gray-600">
                                    Confirm Password <span className="text-red-500 normal-case">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        id="confirm_password"
                                        name="confirm_password"
                                        type={showConfirmPwd ? 'text' : 'password'}
                                        required
                                        autoComplete="new-password"
                                        placeholder="Re-enter your password"
                                        value={formData.confirm_password}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3.5 pr-12 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-900 font-medium
                               placeholder-gray-400 outline-none
                               focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10
                               transition-all duration-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPwd((v) => !v)}
                                        aria-label={showConfirmPwd ? 'Hide confirm password' : 'Show confirm password'}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                                    >
                                        {showConfirmPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Password match indicator */}
                            {formData.confirm_password && (
                                <div className={`flex items-center gap-2 text-xs font-semibold ${formData.password === formData.confirm_password ? 'text-green-600' : 'text-red-500'
                                    }`}>
                                    {formData.password === formData.confirm_password ? (
                                        <><CheckCircle2 className="w-4 h-4" /> Passwords match</>
                                    ) : (
                                        <><AlertCircle className="w-4 h-4" /> Passwords do not match</>
                                    )}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 mt-2
                           bg-blue-600 hover:bg-blue-700
                           active:scale-[0.98]
                           text-white font-bold text-[15px] py-3.5 rounded-xl
                           shadow-[0_4px_14px_0_theme(colors.blue.300)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)]
                           transition-all duration-200
                           disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                            >
                                {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                                {isLoading ? 'Creating account…' : 'Create Account'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer */}
                <footer className="py-6 text-center text-sm font-medium text-gray-500 border-t border-gray-100">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-600 font-bold hover:underline transition-colors">
                        Sign in here
                    </Link>
                </footer>
            </main>
        </div>
    );
};

export default SignUp;