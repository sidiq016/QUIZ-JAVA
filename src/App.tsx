import { useState, useEffect } from 'react';
import Splash from './components/Splash';
import LoginModal from './components/LoginModal';
import DashboardAdminDosen from './components/DashboardAdminDosen';
import DashboardMahasiswa from './components/DashboardMahasiswa';
import QuizGame3D from './components/QuizGame3D';
import WhatsAppWidget from './components/WhatsAppWidget';
import { User, QuizModule } from './types';
import { saveUser, getUsers } from './lib/localDb';

export default function App() {
  const [splashFinished, setSplashFinished] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [activeModule, setActiveModule] = useState<QuizModule | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashFinished(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkSession = () => {
      const savedUser = localStorage.getItem('javas_user');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          const users = getUsers();
          const existingUser = users.find(u => u.id === parsedUser.id);
          if (existingUser) {
            setUser(existingUser);
          } else {
             // Just in case it's the very first time
            saveUser(parsedUser);
            setUser(parsedUser);
          }
        } catch (e) {
          console.error(e);
          setUser(null);
        }
      }
      setLoadingSession(false);
    };
    
    checkSession();
  }, []);

  const handleLogin = (loggedUser: User) => {
    saveUser(loggedUser);
    localStorage.setItem('javas_user', JSON.stringify(loggedUser));
    setUser(loggedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('javas_user');
    setUser(null);
    setActiveModule(null);
  };

  const renderContent = () => {
    if (!splashFinished || loadingSession) {
      return <Splash />;
    }
    
    if (!user) {
      return <LoginModal onLogin={handleLogin} />;
    }

    if (activeModule && user.role === 'mahasiswa') {
      return <QuizGame3D user={user} module={activeModule} onExit={() => setActiveModule(null)} />;
    }
    
    if (user.role === 'admin' || user.role === 'dosen') {
      return <DashboardAdminDosen user={user} onLogout={handleLogout} />;
    }

    return (
      <DashboardMahasiswa 
        user={user} 
        onLogout={handleLogout} 
        onStartGame={(mod) => setActiveModule(mod)} 
      />
    );
  };

  return (
    <>
      {renderContent()}
      {splashFinished && <WhatsAppWidget />}
    </>
  );
}
