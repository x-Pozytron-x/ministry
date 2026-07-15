import { useState, useMemo } from 'react';
import StartScreen from './components/StartScreen';
import MainApp from './components/MainApp';
import type { CongregationData } from './domain';
import { ApplicationService } from './application';
import { cryptoService } from './crypto';
import { BrowserStorageAdapter, SimpleVersionManager } from './storage';
import './App.css';

function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [currentData, setCurrentData] = useState<CongregationData | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');

  const applicationService = useMemo(() => {
    return new ApplicationService(
      cryptoService,
      new BrowserStorageAdapter(),
      new SimpleVersionManager()
    );
  }, []);

  const handleUnlock = (data: CongregationData, password: string) => {
    setCurrentData(data);
    setCurrentPassword(password);
    setIsUnlocked(true);
  };

  const handleLogout = () => {
    // Clear all data from memory
    setCurrentData(null);
    setCurrentPassword('');
    setIsUnlocked(false);
  };

  return (
    <div className="app">
      {!isUnlocked ? (
        <StartScreen applicationService={applicationService} onUnlock={handleUnlock} />
      ) : (
        currentData && (
          <MainApp
            initialData={currentData}
            currentPassword={currentPassword}
            applicationService={applicationService}
            onLogout={handleLogout}
          />
        )
      )}
    </div>
  );
}

export default App;
 