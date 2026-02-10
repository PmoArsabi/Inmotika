const Card = ({ children, className = "", onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:border-[#D32F2F]/30 active:scale-[0.99]' : ''} ${className}`}
  >
    {children}
  </div>
);

export default Card;
