import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const Toast = ({ type = 'info', message, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Failsafe para asegurar que se limpie si algo falla
    const timer = setTimeout(() => {
      handleClose();
    }, 5500);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300); // Dar tiempo a la animación de salida
  };

  const getStyle = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-white border-green-100',
          icon: <CheckCircle className="text-green-500" size={20} />,
          bar: 'bg-green-500',
          text: 'text-green-800'
        };
      case 'error':
        return {
          bg: 'bg-white border-red-100',
          icon: <AlertCircle className="text-red-500" size={20} />,
          bar: 'bg-red-500',
          text: 'text-red-800'
        };
      case 'warning':
        return {
          bg: 'bg-white border-amber-100',
          icon: <AlertTriangle className="text-amber-500" size={20} />,
          bar: 'bg-amber-500',
          text: 'text-amber-800'
        };
      default:
        return {
          bg: 'bg-white border-blue-100',
          icon: <Info className="text-blue-500" size={20} />,
          bar: 'bg-blue-500',
          text: 'text-blue-800'
        };
    }
  };

  const styles = getStyle();

  return (
    <div 
      className={`
        pointer-events-auto
        group relative min-w-[320px] max-w-md p-4 rounded-xl border shadow-2xl transition-all duration-300 transform
        ${styles.bg} 
        ${isExiting ? 'translate-x-full opacity-0 scale-95' : 'translate-x-0 opacity-100 scale-100 animate-in slide-in-from-right-10'}
      `}
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0 mt-0.5">
          {styles.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-relaxed ${styles.text}`}>
            {message}
          </p>
        </div>

        <button 
          onClick={handleClose}
          className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
        >
          <X size={16} />
        </button>
      </div>

      {/* Progress bar animation */}
      <div className="absolute bottom-0 left-0 h-1 overflow-hidden rounded-b-xl w-full bg-gray-100/50">
        <div 
          className={`h-full ${styles.bar} animate-[progress_5s_linear_forwards]`}
        />
      </div>

      <style>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default Toast;
