const LoginBackground = () => {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-[#D32F2F] via-[#B71C1C] to-[#7B1FA2] opacity-90">
      <div className="absolute top-20 right-20 w-64 h-64 bg-red-600/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-20 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-red-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
    </div>
  );
};

export default LoginBackground;
