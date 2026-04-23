import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import IconButton from './IconButton';
import { H2 } from './Typography';

/**
 * Modal — diálogo glass-layered del Design System Inmotika.
 * Backdrop blur-md · rounded-3xl · shadow-modal · transition-spring.
 */
const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-4xl', durationMs = 300 }) => {
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
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
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
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-opacity duration-(--transition-smooth) ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ backgroundColor: 'rgb(17 24 39 / 0.50)' }}
    >
      <div
        className={[
          'bg-white/92 backdrop-blur-2xl rounded-3xl shadow-(--shadow-modal)',
          'border border-white/60',
          'w-full max-h-[90vh] flex flex-col overflow-hidden relative',
          'transition-[opacity,transform] duration-(--transition-spring)',
          maxWidth,
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.96]',
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-8 py-5 bg-gray-50/60 sticky top-0 z-10 border-b border-gray-100/60">
          <div className="flex flex-col gap-1.5">
            <H2>{title}</H2>
            <div className="h-0.5 w-10 bg-linear-to-r from-brand to-brand-dark rounded-full" />
          </div>
          <IconButton
            icon={X}
            onClick={onClose}
            className="text-ink-muted hover:text-brand hover:bg-red-50 transition-colors"
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
