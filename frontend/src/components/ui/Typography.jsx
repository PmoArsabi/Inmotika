export const H1 = ({ children, className = "" }) => (
  <h1 className={`text-3xl font-bold text-gray-900 uppercase ${className}`}>
    {children}
  </h1>
);

export const H2 = ({ children, className = "" }) => (
  <h2 className={`text-xl font-bold uppercase tracking-tighter text-gray-900 ${className}`}>
    {children}
  </h2>
);

export const H3 = ({ children, className = "" }) => (
  <h3 className={`text-lg font-bold uppercase tracking-tighter text-gray-900 ${className}`}>
    {children}
  </h3>
);

export const Subtitle = ({ children, className = "" }) => (
  <p className={`text-[9px] font-bold text-gray-400 uppercase tracking-widest ${className}`}>
    {children}
  </p>
);

export const Label = ({ children, className = "" }) => (
  <span className={`text-[10px] font-bold text-gray-500 uppercase ${className}`}>
    {children}
  </span>
);

export const TextSmall = ({ children, className = "" }) => (
  <p className={`text-[9px] font-bold ${className}`}>
    {children}
  </p>
);

export const TextTiny = ({ children, className = "" }) => (
  <p className={`text-[8px] font-bold uppercase ${className}`}>
    {children}
  </p>
);

export const Metric = ({ children, className = "" }) => (
  <span className={`text-2xl font-bold ${className}`}>
    {children}
  </span>
);
