const Card = ({ children, className = "", onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white/90 backdrop-blur-sm border border-gray-200 rounded-md shadow-sm overflow-hidden transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:border-[#D32F2F]/30 active:scale-[0.99]' : ''} ${className}`}
  >
    {children}
  </div>
);

export default Card;
