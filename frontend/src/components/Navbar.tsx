import { Sun, Settings, Zap, LogOut, User } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import SearchBar from './SearchBar';
import AuthModal from './AuthModal';

export default function Navbar() {
  const { setSettingsOpen, isCalculating } = useAppStore();
  const { user, isAuthenticated, signOut, setAuthModalOpen } = useAuthStore();

  return (
    <>
      <nav
        role="banner"
        className="flex items-center gap-4 px-6 h-header bg-surface border-b border-divider z-sticky shrink-0"
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 bg-gradient-to-br from-solar-orange to-solar-orange-lt rounded-lg flex items-center justify-center shadow-glow">
            <Sun size={18} className="text-white" />
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-solar-orange font-extrabold text-lg tracking-tight">Solar</span>
            <span className="text-text-primary font-extrabold text-lg tracking-tight">Scope</span>
          </div>
          <span className="hidden sm:block font-data text-text-muted text-xs ml-1">v1.0</span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xl">
          <SearchBar />
        </div>

        {/* Status Indicator */}
        {isCalculating && (
          <div className="flex items-center gap-2 text-solar-orange text-sm shrink-0 animate-fade-in">
            <Zap size={14} className="animate-pulse" />
            <span className="hidden sm:block font-medium">Analyzing...</span>
          </div>
        )}

        {/* User + Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Settings */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2.5 rounded-full text-text-secondary hover:text-solar-orange hover:bg-solar-orange/10 transition-all duration-fast btn-press"
            title="Settings"
            aria-label="Open settings"
          >
            <Settings size={20} />
          </button>

          {isAuthenticated ? (
            <>
              <div className="hidden sm:flex items-center gap-2 bg-midnight/60 rounded-full pl-3 pr-1 py-1 border border-divider">
                <div className="w-6 h-6 rounded-full bg-solar-orange/20 flex items-center justify-center">
                  <User size={12} className="text-solar-orange" />
                </div>
                <span className="text-text-secondary text-xs font-medium max-w-[150px] truncate">
                  {user?.email}
                </span>
              </div>
              <button
                onClick={signOut}
                className="p-2.5 rounded-full text-text-secondary hover:text-error hover:bg-error/10 transition-all duration-fast btn-press"
                title="Sign Out"
                aria-label="Sign out"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-solar-orange hover:bg-solar-orange-lt text-white text-sm font-bold rounded-full shadow-glow transition-colors"
            >
              <User size={16} />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}
        </div>
      </nav>
      <AuthModal />
    </>
  );
}
