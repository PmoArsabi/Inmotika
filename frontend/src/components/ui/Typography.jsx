export const H1 = ({ children, className = "" }) => (
  <h1 className={`text-3xl font-bold tracking-tight text-ink ${className}`}>
    {children}
  </h1>
);

export const H2 = ({ children, className = "" }) => (
  <h2 className={`text-xl font-bold tracking-tight text-ink ${className}`}>
    {children}
  </h2>
);

export const H3 = ({ children, className = "" }) => (
  <h3 className={`text-lg font-semibold tracking-tight text-ink ${className}`}>
    {children}
  </h3>
);

export const Subtitle = ({ children, className = "" }) => (
  <p className={`text-xs font-bold text-ink-muted uppercase tracking-widest ${className}`}>
    {children}
  </p>
);

export const Label = ({ children, className = "" }) => (
  <span className={`text-xs font-semibold text-ink-secondary uppercase tracking-wide ${className}`}>
    {children}
  </span>
);

export const TextSmall = ({ children, className = "" }) => (
  <p className={`text-xs font-medium ${className}`}>
    {children}
  </p>
);

export const TextTiny = ({ children, className = "" }) => (
  <p className={`text-xs font-medium uppercase tracking-wide ${className}`}>
    {children}
  </p>
);

export const Metric = ({ children, className = "" }) => (
  <span className={`text-2xl font-bold tracking-tight ${className}`}>
    {children}
  </span>
);
