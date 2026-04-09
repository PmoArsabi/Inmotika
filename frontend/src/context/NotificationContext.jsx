import { createContext, useContext, useState, useCallback, useRef } from 'react';
import Toast from '../components/ui/Toast';

const NotificationContext = createContext({});

/** Máximo de toasts visibles simultáneamente. Los más antiguos se descartan. */
const MAX_NOTIFICATIONS = 5;

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const idRef = useRef(0);

  const notify = useCallback((type, message, duration = 5000) => {
    const id = ++idRef.current;
    setNotifications(prev => {
      const next = [...prev, { id, type, message }];
      // Si hay más del límite, descarta los más antiguos
      return next.length > MAX_NOTIFICATIONS ? next.slice(next.length - MAX_NOTIFICATIONS) : next;
    });

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

// eslint-disable-next-line react-refresh/only-export-components
export const useNotify = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotify debe usarse dentro de un NotificationProvider');
  }
  return context.notify;
};
