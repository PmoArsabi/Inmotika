import React from 'react';
import Card from './Card';
import { Subtitle, Metric } from './Typography';

const StatCard = ({ label, value, icon: Icon, color = "blue", className = "" }) => {
  const colorMap = {
    blue: { text: 'text-blue-600', bg: 'bg-blue-50', icon: 'text-blue-500', border: 'border-blue-500' },
    green: { text: 'text-green-600', bg: 'bg-green-50', icon: 'text-green-500', border: 'border-green-500' },
    red: { text: 'text-[#D32F2F]', bg: 'bg-red-50', icon: 'text-[#D32F2F]', border: 'border-[#D32F2F]' },
    yellow: { text: 'text-yellow-600', bg: 'bg-yellow-50', icon: 'text-yellow-500', border: 'border-yellow-500' },
    gray: { text: 'text-gray-600', bg: 'bg-gray-50', icon: 'text-gray-500', border: 'border-gray-500' }
  };

  const theme = colorMap[color] || colorMap.blue;

  return (
    <Card className={`p-4 border-l-4 ${theme.border} ${className}`}>
      <div className="flex justify-between items-center">
        <div>
          <Subtitle className="mb-1">{label}</Subtitle>
          <Metric className={theme.text}>{value}</Metric>
        </div>
        {Icon && (
          <div className={`p-3 ${theme.bg} rounded-md ${theme.icon}`}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
