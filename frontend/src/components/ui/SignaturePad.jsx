import { useState, useEffect, useRef } from 'react';
import { PenTool } from 'lucide-react';

const SignaturePad = ({ label }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1A1A1A';
  }, []);

  const startDrawing = (e) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    canvasRef.current.getContext('2d').beginPath();
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches ? e.touches[0].clientX : 0)) - rect.left;
    const y = (e.clientY || (e.touches ? e.touches[0].clientY : 0)) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
          {label || 'Firma del Responsable'}
        </label>
      </div>
      <div className="relative border-2 border-gray-100 rounded-[1.5rem] bg-gray-50 h-32 overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          width={600}
          height={128}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
          className="absolute inset-0 w-full h-full cursor-crosshair"
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
          <PenTool size={48} />
        </div>
      </div>
    </div>
  );
};

export default SignaturePad;
