const Button = ({ children, variant = "primary", className = "", type = "button", ...props }) => {
  const variants = {
    primary: `bg-[#1A1A1A] text-white hover:bg-black shadow-lg shadow-black/10`,
    danger: `bg-[#D32F2F] text-white hover:bg-[#B71C1C] shadow-lg shadow-red-900/10`,
    secondary: `bg-gray-100 text-gray-800 hover:bg-gray-200`,
    outline: `border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300`
  };
  return (
    <button type={type} className={`px-4 py-2 rounded-md font-bold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 text-[10px] uppercase ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
