import { useState } from 'react';
import { Sun, Mail, Lock, User, ArrowRight, Eye, EyeOff, Zap, BarChart2, Leaf, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

type Mode = 'signin' | 'signup';

export default function AuthPage() {
    const [mode, setMode] = useState<Mode>('signin');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signIn } = useAuthStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!email.trim() || !password.trim()) {
            setError('Please fill in all fields.');
            setLoading(false);
            return;
        }
        if (mode === 'signup' && !name.trim()) {
            setError('Please enter your name.');
            setLoading(false);
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            setLoading(false);
            return;
        }

        try {
            if (mode === 'signup') {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { name } }
                });
                if (error) throw error;
                if (data.session) {
                    signIn(data.session.access_token, data.session.user);
                } else {
                    setError('Please check your email to verify your account.');
                }
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                if (data.session) {
                    signIn(data.session.access_token, data.session.user);
                }
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || 'Google sign in failed');
        }
    };

    const toggleMode = () => {
        setMode(mode === 'signin' ? 'signup' : 'signin');
        setError('');
    };

    return (
        <div className="min-h-screen bg-midnight flex overflow-hidden">
            {/* Left Panel — Branding */}
            <div className="hidden lg:flex flex-col justify-between w-[480px] bg-surface border-r border-divider p-10 z-20 shadow-[20px_0_50px_rgba(0,0,0,0.5)] animate-slide-over-reveal">
                <div>
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-16">
                        <div className="w-10 h-10 bg-gradient-to-br from-solar-orange to-solar-orange-lt rounded-xl flex items-center justify-center shadow-glow">
                            <Sun size={22} className="text-white" />
                        </div>
                        <div>
                            <span className="text-solar-orange font-extrabold text-xl tracking-tight">Solar</span>
                            <span className="text-text-primary font-extrabold text-xl tracking-tight">Scope</span>
                        </div>
                    </div>

                    {/* Tagline */}
                    <h1 className="text-h1 font-extrabold text-text-primary leading-tight mb-4">
                        Unlock your rooftop's <span className="text-gradient-solar">solar potential</span>
                    </h1>
                    <p className="text-text-secondary text-body-lg leading-relaxed mb-10">
                        AI + GIS platform that estimates rooftop solar energy using OpenStreetMap data, NASA POWER irradiance, and precision PV simulation.
                    </p>

                    {/* Feature pills */}
                    <div className="space-y-4">
                        {[
                            { icon: Zap, text: 'Instant solar analysis in under 3 seconds', color: 'text-solar-orange' },
                            { icon: BarChart2, text: 'Monthly generation forecasts with financial ROI', color: 'text-electric-blue' },
                            { icon: Leaf, text: 'CO₂ impact tracking and environmental reports', color: 'text-success' },
                        ].map((feat) => (
                            <div key={feat.text} className="flex items-center gap-3 bg-midnight/40 rounded-lg px-4 py-3 border border-divider">
                                <feat.icon size={18} className={feat.color} />
                                <span className="text-text-secondary text-sm">{feat.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <p className="text-text-muted text-xs font-data">
                    SOLARSCOPE V1.0 · © 2025
                </p>
            </div>

            {/* Right Panel — Auth Form */}
            <div className="flex-1 flex items-center justify-center px-6 relative z-10">
                {/* Background decorative elements */}
                <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-solar-orange/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-electric-blue/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="w-full max-w-md relative z-10 bg-surface/80 backdrop-blur-xl p-8 rounded-2xl border border-divider shadow-deep">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center gap-2.5 mb-10 justify-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-solar-orange to-solar-orange-lt rounded-xl flex items-center justify-center shadow-glow">
                            <Sun size={22} className="text-white" />
                        </div>
                        <span className="text-solar-orange font-extrabold text-xl">Solar</span>
                        <span className="text-text-primary font-extrabold text-xl">Scope</span>
                    </div>

                    {/* Header */}
                    <div className="mb-8 text-center sm:text-left">
                        <h2 className="text-h2 font-bold text-text-primary">
                            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
                        </h2>
                        <p className="text-text-secondary text-sm mt-1.5">
                            {mode === 'signin'
                                ? 'Sign in to access your solar workspace'
                                : 'Get started with free rooftop analysis'}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name (Sign Up only) */}
                        {mode === 'signup' && (
                            <div className="animate-slide-up">
                                <label htmlFor="name" className="block text-text-secondary text-xs uppercase tracking-wider mb-2 font-semibold">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                                    <input
                                        id="name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Arnav Sharma"
                                        className="w-full bg-midnight border border-divider rounded-lg pl-11 pr-4 py-3 text-sm text-text-primary placeholder-text-muted
                               focus:outline-none focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/25 transition-all duration-fast"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-text-secondary text-xs uppercase tracking-wider mb-2 font-semibold">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full bg-midnight border border-divider rounded-lg pl-11 pr-4 py-3 text-sm text-text-primary placeholder-text-muted
                             focus:outline-none focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/25 transition-all duration-fast"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-text-secondary text-xs uppercase tracking-wider mb-2 font-semibold">
                                Password
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Min. 6 characters"
                                    className="w-full bg-midnight border border-divider rounded-lg pl-11 pr-12 py-3 text-sm text-text-primary placeholder-text-muted
                             focus:outline-none focus:border-electric-blue focus:ring-2 focus:ring-electric-blue/25 transition-all duration-fast"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-start gap-2 bg-error/10 border border-error/30 text-error text-sm px-4 py-3 rounded-lg animate-fade-in">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2.5
                         bg-solar-orange hover:bg-solar-orange-lt disabled:opacity-60
                         text-white font-bold py-3.5 rounded-cta
                         transition-all duration-fast btn-press shadow-glow text-sm"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Toggle Mode */}
                    <div className="mt-6 text-center">
                        <p className="text-text-secondary text-sm">
                            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                            <button
                                type="button"
                                onClick={toggleMode}
                                className="text-solar-orange font-semibold hover:text-solar-orange-lt transition-colors"
                            >
                                {mode === 'signin' ? 'Sign up' : 'Sign in'}
                            </button>
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-divider" />
                        <span className="text-text-muted text-xs uppercase tracking-wider">or</span>
                        <div className="flex-1 h-px bg-divider" />
                    </div>

                    {/* Google OAuth Button */}
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        className="w-full flex items-center justify-center gap-2 bg-midnight border border-divider hover:border-slate-blue/50 rounded-lg py-3.5 text-sm text-text-primary transition-all duration-fast btn-press"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </button>

                    <p className="text-center text-text-muted text-xs mt-4">
                        * Make sure to enable the Google Provider in Supabase first.
                    </p>
                </div>
            </div>
        </div>
    );
}
