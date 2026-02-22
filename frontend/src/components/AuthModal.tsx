import React, { useState } from 'react';
import { X, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export default function AuthModal() {
    const { isAuthModalOpen, setAuthModalOpen, signIn } = useAuthStore();
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isAuthModalOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (mode === 'signup') {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                if (data.session) {
                    signIn(data.session.access_token, data.user!);
                } else {
                    setError('Check your email for the confirmation link.');
                }
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                if (data.session) {
                    signIn(data.session.access_token, data.user!);
                }
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || 'Google login failed');
        }
    };

    return (
        <div className="fixed inset-0 bg-midnight/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-surface border border-divider rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="flex justify-between items-center p-5 border-b border-divider bg-midnight/50">
                    <h2 className="text-h3 font-bold text-text-primary">
                        {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <button
                        onClick={() => setAuthModalOpen(false)}
                        className="text-text-muted hover:text-text-primary transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-lg flex gap-2 items-start text-error text-sm">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-text-secondary text-xs uppercase tracking-wider mb-1.5 font-semibold">
                                Email
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-midnight border border-divider rounded-lg pl-10 pr-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-solar-orange focus:ring-1 focus:ring-solar-orange transition-colors"
                                    placeholder="you@email.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-text-secondary text-xs uppercase tracking-wider mb-1.5 font-semibold">
                                Password
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-midnight border border-divider rounded-lg pl-10 pr-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-solar-orange focus:ring-1 focus:ring-solar-orange transition-colors"
                                    placeholder="••••••••"
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-solar-orange hover:bg-solar-orange-lt text-white font-bold py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2 mt-2"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : (mode === 'signin' ? 'Sign In' : 'Sign Up')}
                        </button>
                    </form>

                    <div className="flex items-center gap-4 my-5">
                        <div className="flex-1 h-px bg-divider"></div>
                        <span className="text-text-muted text-xs uppercase">OR</span>
                        <div className="flex-1 h-px bg-divider"></div>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        className="w-full bg-surface border border-divider hover:bg-divider/50 text-text-primary font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </button>

                    <p className="text-center text-sm text-text-secondary mt-5">
                        {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
                            className="text-solar-orange hover:text-solar-orange-lt font-medium transition-colors"
                        >
                            {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
