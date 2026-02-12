import Card from './Card';
import { Label, Metric, TextTiny } from './Typography';

const KPICardGroup = ({ title, items, colorTheme }) => (
  <div className="flex flex-col gap-4">
    <div className={`flex items-center gap-3 pb-2 border-b border-gray-100 ${colorTheme}`}>
      <Label>{title}</Label>
    </div>
    <div className="grid grid-cols-1 gap-4">
      {items.map((item, idx) => (
        <Card key={idx} className={`p-6 ${item.alert ? 'border-l-4 border-l-red-500 bg-red-50/10' : ''}`}>
          <div className="flex justify-between items-start">
            <div>
              <TextTiny className="text-gray-400 mb-1">{item.label}</TextTiny>
              <Metric className={item.alert ? 'text-red-600' : 'text-gray-900'}>{item.value}</Metric>
              <TextTiny className="text-gray-500 mt-1">{item.sub}</TextTiny>
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
