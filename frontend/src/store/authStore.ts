import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isCheckingAuth: boolean;
    isAuthModalOpen: boolean;

    signIn: (token: string, user: User) => void;
    signOut: () => Promise<void>;
    setAuthModalOpen: (open: boolean) => void;
    restoreSession: () => Promise<void>;
    setCheckingAuth: (checking: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isCheckingAuth: true,
            isAuthModalOpen: false,

            signIn: (token: string, user: User) => {
                set({ 
                    user, 
                    token, 
                    isAuthenticated: true, 
                    isAuthModalOpen: false, 
                    isCheckingAuth: false 
                });
            },

            setCheckingAuth: (checking: boolean) => {
                set({ isCheckingAuth: checking });
            },

            signOut: async () => {
                await supabase.auth.signOut();
                set({ user: null, token: null, isAuthenticated: false, isCheckingAuth: false });
            },

            setAuthModalOpen: (open: boolean) => {
                set({ isAuthModalOpen: open });
            },

            restoreSession: async () => {
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) {
                        set({
                            user: session.user,
                            token: session.access_token,
                            isAuthenticated: true,
                            isCheckingAuth: false
                        });
                    } else {
                        set({ isCheckingAuth: false });
                    }
                } catch (error) {
                    console.error('Session restoration failed:', error);
                    set({ isCheckingAuth: false });
                }
            }
        }),
        {
            name: 'solarscope-auth',
            partialize: (state) => ({ token: state.token }), // Only persist token
        }
    )
);
