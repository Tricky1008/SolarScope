import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Component, type ReactNode, useEffect } from 'react';
import MapView from './components/MapView';
import Navbar from './components/Navbar';
import AnalysisPanel from './components/AnalysisPanel';
import SettingsModal from './components/SettingsModal';
import FlowSelectionScreen from './components/FlowSelectionScreen';
import ManualInput from './components/ManualInput';
import ReportGenerator from './components/ReportGenerator';
import AuthPage from './components/AuthPage';
import SolarScopeLanding from './components/solarscope-landing';
import { OfflineBanner } from './components/OfflineBanner';

import { useAppStore } from './store/appStore';
import { useAuthStore } from './store/authStore';
import { supabase } from './lib/supabase';
import { AnimatePresence, motion } from 'framer-motion';

/* ── Error Boundary ── */
interface ErrorBoundaryState { hasError: boolean; error: Error | null }

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-midnight p-8">
          <div className="bg-surface border border-divider rounded-2xl p-8 max-w-md text-center">
            <div className="w-14 h-14 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-error text-2xl font-bold">!</span>
            </div>
            <h2 className="text-xl font-display font-bold text-text-primary mb-2">Something went wrong</h2>
            <p className="text-text-secondary text-sm mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-solar-orange hover:bg-solar-orange-lt text-white font-semibold px-6 py-2.5 rounded-cta transition-colors cursor-pointer"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient();

export default function App() {
  const { isPanelOpen, isSettingsOpen, isReportOpen, setReportOpen, analysis, activeFlow, setActiveFlow } = useAppStore();
  const { isAuthenticated, isCheckingAuth, signIn } = useAuthStore();

  useEffect(() => {
    // Initial session check should be silent and wait for the event listener
    // but we fire it once to ensure we don't wait forever if events don't fire.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        signIn(session.access_token, session.user);
      } else {
        // If no session is found via getSession, we still wait a bit 
        // to see if an OAuth redirect is being processed.
        setTimeout(() => {
          if (!useAuthStore.getState().isAuthenticated) {
            useAuthStore.setState({ isCheckingAuth: false });
          }
        }, 1500);
      }
    });

    // Listen for auth events - this is the source of truth for OAuth redirects
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth Event:', event);
      if (session) {
        signIn(session.access_token, session.user);
      } else if (event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
        useAuthStore.setState({ user: null, token: null, isAuthenticated: false, isCheckingAuth: false });
      }
    });

    return () => subscription.unsubscribe();
  }, [signIn]);

  // Prevent flicker/loop by waiting for auth check to complete
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0b1423]">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-solar-orange/20 border-t-solar-orange rounded-full animate-spin"></div>
          <div className="mt-4 text-solar-orange font-medium animate-pulse text-sm tracking-widest uppercase">Initializing...</div>
        </div>
      </div>
    );
  }

  // Hard Gate: Require authentication
  if (!isAuthenticated) return <AuthPage />;

  // Show landing page when sun button is clicked
  if (activeFlow === 'landing') {
    return (
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <SolarScopeLanding onGetStarted={() => setActiveFlow('choice')} />
        </QueryClientProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0b1423]">
          <OfflineBanner />
          <Navbar />
          <AnimatePresence mode="wait">
            {activeFlow === 'choice' ? (
              <FlowSelectionScreen key="choice" />
            ) : activeFlow === 'manual' ? (
              <motion.div
                key="manual-input"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <ManualInput
                  onBack={() => setActiveFlow('choice')}
                  onSuccess={() => setActiveFlow('map')}
                />
              </motion.div>
            ) : (
              <motion.div
                key="main-app"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="flex-1 flex h-full w-full relative overflow-hidden"
              >
                <MapView />
                <AnimatePresence>
                  {isPanelOpen && (
                    <div className="absolute inset-0 z-[1000] pointer-events-none flex flex-col justify-end sm:flex-row sm:justify-start">
                      <AnalysisPanel />
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isSettingsOpen && <SettingsModal />}
          </AnimatePresence>

          <AnimatePresence>
            {isReportOpen && analysis && (
              <ReportGenerator analysis={analysis} onClose={() => setReportOpen(false)} />
            )}
          </AnimatePresence>
        </div>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
