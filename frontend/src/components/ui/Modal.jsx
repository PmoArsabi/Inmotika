import React, { useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import IconButton from './IconButton';
import { H2 } from './Typography';

const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-4xl" }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`bg-white rounded-lg shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 relative`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="flex flex-col gap-1">
            <H2>{title}</H2>
            <div className="h-1 w-12 bg-[#D32F2F] rounded-full"></div>
          </div>
          <IconButton 
            icon={X} 
            onClick={onClose} 
            className="text-gray-400 hover:text-[#D32F2F] hover:bg-red-50 transition-colors"
          />
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
