import { Sun, Settings, Zap, LogOut, User, PlusCircle, Map, Target, Home } from 'lucide-react';
import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import SearchBar from './SearchBar';
import AuthModal from './AuthModal';
import { Dock, DockItem, DockSeparator } from './Docker';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { setSettingsOpen, isCalculating, setActiveFlow, activeFlow, reset } = useAppStore();
  const { user, isAuthenticated, signOut, setAuthModalOpen } = useAuthStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      {/* Search Bar - Absolutely positioned at the top when needed, replacing the inline navbar search */}
      <AnimatePresence>
        {activeFlow === 'map' && isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-md z-sticky px-4"
          >
            <SearchBar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Status Indicator for Calculations */}
      <AnimatePresence>
        {isCalculating && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="absolute top-6 left-1/2 z-sticky bg-midnight/80 backdrop-blur-md border border-solar-orange/30 px-4 py-2 rounded-full flex items-center gap-2 text-solar-orange text-sm shadow-glow"
          >
            <Zap size={14} className="animate-pulse" />
            <span className="font-medium">Analyzing rooftop...</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal />

      {/* Bottom Floating Dock — always visible */}
      <div className="fixed left-0 right-0 z-[9999] flex justify-center pointer-events-none" style={{ bottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}>
        <div className="pointer-events-auto max-w-[95vw] overflow-x-auto">
          <Dock>
            {/* Logo / Brand */}
            <DockItem
              icon={(props: any) => (
                <div className="w-full h-full bg-gradient-to-br from-solar-orange to-solar-orange-lt rounded-[min(100%,1rem)] flex items-center justify-center text-white">
                  <Sun size={props.className?.includes('w-') ? '50%' : 20} className={props.className} />
                </div>
              )}
              label="SolarScope"
              onClick={() => {
                setActiveFlow('landing');
                reset();
              }}
              isActive={false}
            />

            {/* Separator */}
            <DockSeparator />

            {/* Core Navigation */}
            <DockItem
              icon={Home}
              label="Home"
              onClick={() => setActiveFlow('choice')}
              isActive={activeFlow === 'choice'}
            />
            <DockItem
              icon={Map}
              label="Map View"
              onClick={() => {
                setActiveFlow('map');
                reset();
              }}
              isActive={activeFlow === 'map' && !isSearchOpen}
            />



            <DockItem
              icon={PlusCircle}
              label="Manual Entry"
              onClick={() => setActiveFlow('manual')}
              isActive={activeFlow === 'manual'}
            />

            {/* Separator */}
            <DockSeparator />

            {/* User & Settings */}
            <DockItem
              icon={Settings}
              label="Settings"
              onClick={() => setSettingsOpen(true)}
            />

            {isAuthenticated ? (
              <DockItem
                icon={LogOut}
                label={`Sign Out (${user?.email?.split('@')[0]})`}
                onClick={signOut}
              />
            ) : (
              <DockItem
                icon={User}
                label="Sign In"
                onClick={() => setAuthModalOpen(true)}
              />
            )}
          </Dock>
        </div>
      </div>
    </>
  );
}

