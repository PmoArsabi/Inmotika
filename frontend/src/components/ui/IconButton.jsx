import { createElement } from 'react';

const IconButton = ({ icon, onClick, className = "", size = 18, color = "text-gray-400", hoverColor = "hover:text-[#D32F2F]", ...props }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-1.5 rounded-lg transition-all duration-200 flex items-center justify-center ${color} ${hoverColor} hover:bg-gray-100 ${className}`}
      {...props}
    >
      {icon ? createElement(icon, { size }) : null}
    </button>
  );
};

export default IconButton;
