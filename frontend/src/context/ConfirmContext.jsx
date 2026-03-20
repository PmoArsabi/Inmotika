import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from '../components/ui/Button';

const ConfirmContext = createContext(null);

export const ConfirmProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    title: '¿Confirmar acción?',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    type: 'danger'
  });

  const resolveRef = useRef(null);

  const confirm = useCallback((options) => {
    if (typeof options === 'string') {
      options = { message: options };
    }

    setConfig({
      title: options.title || '¿Confirmar acción?',
      message: options.message || '',
      confirmText: options.confirmText || 'Confirmar',
      cancelText: options.cancelText || 'Cancelar',
      type: options.type || 'danger'
    });

    setIsOpen(true);

    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleCancel = () => {
    setIsOpen(false);
    if (resolveRef.current) resolveRef.current(false);
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolveRef.current) resolveRef.current(true);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-10000 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
            {/* Header / Icon */}
            <div className={`p-6 pb-2 flex flex-col items-center text-center`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                config.type === 'danger' ? 'bg-red-50 text-red-500' : 
                config.type === 'success' ? 'bg-emerald-50 text-emerald-500' :
                'bg-blue-50 text-blue-500'
              }`}>
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{config.title}</h3>
            </div>

            {/* Content */}
            <div className="px-6 py-2 text-center">
              <p className="text-gray-600 text-sm leading-relaxed">
                {config.message}
              </p>
            </div>

            {/* Actions */}
            <div className="p-6 pt-8 flex flex-col sm:flex-row-reverse gap-3">
              <Button 
                onClick={handleConfirm}
                variant={config.type === 'danger' ? 'danger' : config.type === 'success' ? 'success' : 'primary'}
                className="w-full sm:w-auto px-8"
              >
                {config.confirmText}
              </Button>
              <button 
                onClick={handleCancel}
                className="w-full sm:w-auto px-8 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors border border-transparent"
              >
                {config.cancelText}
              </button>
            </div>

            {/* Close button top-right */}
            <button 
              onClick={handleCancel}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};
