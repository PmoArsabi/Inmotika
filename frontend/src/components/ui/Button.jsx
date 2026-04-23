const Button = ({ children, variant = "primary", className = "", type = "button", ...props }) => {
  const variants = {
    primary: `bg-canvas text-white hover:bg-black shadow-lg shadow-black/10`,
    danger: `bg-brand text-white hover:bg-brand-dark shadow-lg shadow-red-900/10`,
    success: `bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-900/10`,
    secondary: `bg-gray-100 text-gray-800 hover:bg-gray-200`,
    outline: `border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300`
  };
  return (
    <button type={type} className={`px-4 py-2 rounded-md font-bold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-2xs uppercase ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
