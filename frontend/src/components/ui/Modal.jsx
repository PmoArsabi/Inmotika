import { X } from 'lucide-react';
import { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-4xl" }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`bg-[#F8F9FA] w-full ${maxWidth} max-h-[90vh] overflow-hidden rounded-md shadow-2xl flex flex-col animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-gray-100 bg-white">
          <div>
            <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tight">{title}</h3>
            <div className="h-1 w-8 bg-[#D32F2F] mt-1 rounded-full"></div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-red-50 text-gray-400 hover:text-[#D32F2F] rounded-md transition-all group"
          >
            <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
