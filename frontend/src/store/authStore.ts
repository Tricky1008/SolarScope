import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isAuthModalOpen: boolean;

    signIn: (token: string, user: User) => void;
    signOut: () => Promise<void>;
    setAuthModalOpen: (open: boolean) => void;
    restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isAuthModalOpen: false,

            signIn: (token: string, user: User) => {
                set({ user, token, isAuthenticated: true, isAuthModalOpen: false });
            },

            signOut: async () => {
                await supabase.auth.signOut();
                set({ user: null, token: null, isAuthenticated: false });
            },

            setAuthModalOpen: (open: boolean) => {
                set({ isAuthModalOpen: open });
            },

            restoreSession: async () => {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    set({
                        user: session.user,
                        token: session.access_token,
                        isAuthenticated: true
                    });
                }
            }
        }),
        {
            name: 'solarscope-auth',
            partialize: (state) => ({ token: state.token }),
        }
    )
);

// Auto restore session on file load
useAuthStore.getState().restoreSession();
