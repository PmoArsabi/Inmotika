import { Filter } from 'lucide-react';
import Button from './Button';
import { H3 } from './Typography';

const ModuleHeader = ({
  title,
  icon: Icon,
  onNewClick,
  newButtonLabel = "Nuevo",
  showFilter = true,
  onFilterClick,
  rightContent
}) => {
  return (
    <div className="bg-gradient-to-r from-[#D32F2F] via-[#B71C1C] to-[#8B0000] rounded-lg p-5 border-0 shadow-xl relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-2xl"></div>
      </div>
      
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm border border-white/30">
              <Icon size={20} className="text-white" />
            </div>
          )}
          <H3 className="text-white font-semibold normal-case text-lg drop-shadow-sm">
            {title}
          </H3>
        </div>
        <div className="flex items-center gap-3">
          {onNewClick && (
            <Button 
              onClick={onNewClick}
              variant="outline"
              className="bg-gray-100/90 backdrop-blur-sm border-gray-300 text-gray-900 hover:bg-gray-200 hover:border-gray-400 shadow-md font-semibold"
            >
              {newButtonLabel}
            </Button>
          )}
          {showFilter && onFilterClick && (
            <Button 
              variant="outline" 
              className="bg-gray-100/90 backdrop-blur-sm border-gray-300 text-gray-900 hover:bg-gray-200 hover:border-gray-400 shadow-md"
              onClick={onFilterClick}
            >
              <Filter size={16} className="mr-2" />
              Filtro
            </Button>
          )}
          {rightContent}
        </div>
      </div>
    </div>
  );
};

export default ModuleHeader;
