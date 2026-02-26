import React from 'react';
import { Loader2 } from 'lucide-react';
import { TextSmall } from '../ui/Typography';

const LoadingInline = ({ label = 'Cargando...' }) => (
  <div className="flex flex-col items-center justify-center p-8 space-y-3 opacity-60">
    <Loader2 className="w-6 h-6 text-primary animate-spin" />
    <TextSmall className="font-semibold text-gray-500">{label}</TextSmall>
  </div>
);

export default LoadingInline;
