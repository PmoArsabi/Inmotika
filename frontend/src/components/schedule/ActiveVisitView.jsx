import DeviceReportCard from './DeviceReportCard';
import VisitInfoPanel from './VisitInfoPanel';

const ActiveVisitView = ({ activeVisit, data, onBack, onFinish, setActiveVisit, setData }) => {
  // Delegates to sub-components for readability
  return (
    <VisitInfoPanel
      activeVisit={activeVisit}
      data={data}
      setData={setData}
      onBack={onBack}
      onFinish={onFinish}
      setActiveVisit={setActiveVisit}
      DeviceReportCard={DeviceReportCard}
    />
  );
};

export default ActiveVisitView;
