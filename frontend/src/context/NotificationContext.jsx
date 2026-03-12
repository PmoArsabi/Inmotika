import { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/ui/Toast';

const NotificationContext = createContext({});

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const notify = useCallback((type, message, duration = 5000) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    
    // Auto-remove after duration
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      
      {/* Container para los Toasts */}
      <div className="fixed bottom-6 right-6 z-9999 flex flex-col gap-3 pointer-events-none">
        {notifications.map((n) => (
          <Toast 
            key={n.id} 
            type={n.type} 
            message={n.message} 
            onClose={() => removeNotification(n.id)} 
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotify = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotify debe usarse dentro de un NotificationProvider');
  }
  return context.notify;
};
