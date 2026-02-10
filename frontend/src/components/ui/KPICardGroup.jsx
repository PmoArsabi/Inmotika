import Card from './Card';

const KPICardGroup = ({ title, items, colorTheme }) => (
  <div className="flex flex-col gap-4">
    <div className={`flex items-center gap-3 pb-2 border-b border-gray-100 ${colorTheme}`}>
      <h4 className="text-[10px] font-black uppercase tracking-[0.25em]">{title}</h4>
    </div>
    <div className="grid grid-cols-1 gap-4">
      {items.map((item, idx) => (
        <Card key={idx} className={`p-6 ${item.alert ? 'border-l-4 border-l-red-500 bg-red-50/10' : ''}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
              <h3 className={`text-2xl font-black ${item.alert ? 'text-red-600' : 'text-gray-900'} tracking-tighter`}>{item.value}</h3>
              <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">{item.sub}</p>
            </div>
            <div className={`p-3 rounded-xl ${item.alert ? 'bg-red-100 text-red-600' : 'bg-gray-50 text-gray-400'}`}>
              <item.icon size={20} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

export default KPICardGroup;
