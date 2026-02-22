import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';
import MapView from './components/MapView';
import Navbar from './components/Navbar';
import AnalysisPanel from './components/AnalysisPanel';
import SettingsModal from './components/SettingsModal';
import InputChoice from './components/InputChoice';
import ManualInput from './components/ManualInput';
import ReportGenerator from './components/ReportGenerator';
import AuthPage from './components/AuthPage';
import { useAppStore } from './store/appStore';
import { useAuthStore } from './store/authStore';

const queryClient = new QueryClient();

export default function App() {
  const [activeFlow, setActiveFlow] = useState<'choice' | 'map' | 'manual'>('choice');
  const { isPanelOpen, isSettingsOpen, isReportOpen, setReportOpen, analysis } = useAppStore();
  const { isAuthenticated } = useAuthStore();

  // Hard Gate: Require authentication to see the rest of the application.
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Show Flow Choice on first visit after auth
  if (activeFlow === 'choice') {
    return <InputChoice onSelectFlow={(flow) => setActiveFlow(flow)} />;
  }

  // Show Manual Input Form
  if (activeFlow === 'manual') {
    return <ManualInput
      onBack={() => setActiveFlow('choice')}
      onSuccess={() => setActiveFlow('map')} // Still mounting map behind the scenes to show the AnalysisPanel cleanly
    />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-midnight">
        <Navbar />
        <div className="flex flex-1 overflow-hidden relative">
          <MapView />
          {isPanelOpen && <AnalysisPanel />}
        </div>
        {isSettingsOpen && <SettingsModal />}
        {isReportOpen && analysis && (
          <ReportGenerator analysis={analysis} onClose={() => setReportOpen(false)} />
        )}
      </div>
    </QueryClientProvider>
  );
}
