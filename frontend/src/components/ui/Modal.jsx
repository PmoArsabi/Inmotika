import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import IconButton from './IconButton';
import { H2 } from './Typography';

const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-4xl", durationMs = 300 }) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const openTimer = setTimeout(() => {
      if (isOpen) {
        setShouldRender(true);
        setIsClosing(false);
        if (closeTimerRef.current) {
          clearTimeout(closeTimerRef.current);
          closeTimerRef.current = null;
        }
      } else if (shouldRender && !isClosing) {
        setIsClosing(true);
        closeTimerRef.current = setTimeout(() => {
          setShouldRender(false);
          setIsClosing(false);
          closeTimerRef.current = null;
        }, durationMs);
      }
    }, 0);

    return () => clearTimeout(openTimer);
  }, [durationMs, isOpen, isClosing, shouldRender]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (shouldRender) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [onClose, shouldRender]);

  if (!shouldRender) return null;

  const isVisible = isOpen && !isClosing;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity ${isVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDuration: `${durationMs}ms` }}>
      <div 
        className={`bg-white rounded-lg shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col overflow-hidden relative transition-[opacity,transform] ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.98]'}`}
        style={{ transitionDuration: `${durationMs}ms` }}
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
