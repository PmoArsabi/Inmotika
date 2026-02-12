import { Menu, Bell } from 'lucide-react';
import { TextSmall, Subtitle } from '../ui/Typography';

const Header = ({ user, onToggleMobileMenu }) => (
  <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 lg:px-10 py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button onClick={onToggleMobileMenu} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
          <Menu size={24} />
        </button>
      </div>
      <div className="flex items-center gap-6">
        <button className="relative p-3 rounded-xl hover:bg-gray-50 transition-colors">
          <Bell size={20} className="text-gray-400" />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#D32F2F] rounded-full animate-pulse border-2 border-white"></span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#D32F2F] text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-lg shadow-red-900/20">
            {user.name?.charAt(0)}
          </div>
          <div className="hidden sm:block">
            <Subtitle className="text-gray-900 leading-none text-xs">{user.name}</Subtitle>
            <TextSmall className="text-gray-400 uppercase mt-0.5">{user.role}</TextSmall>
          </div>
        </div>
      </div>
    </div>
  </header>
);

export default Header;
