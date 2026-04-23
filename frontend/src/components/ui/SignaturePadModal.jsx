import { useRef, useState, useCallback, useImperativeHandle, forwardRef, useEffect } from 'react';
import { RotateCcw, Check, X } from 'lucide-react';

/**
 * Panel inline de dibujo de firma con canvas nativo.
 * NO es un overlay — se renderiza dentro del flujo del DOM.
 *
 * @param {{
 *   onConfirm: (file: File) => void,
 *   onCancel: () => void,
 *   title?: string,
 *   showActions?: boolean,
 * }} props
 * @param ref - expone { buildFile(): File|null, isEmpty(): boolean }
 */
const CANVAS_H = 160;

const MIN_W = 0.6;
const MAX_W = 2.8;

/** Interpola grosor según velocidad del trazo (px/ms). Rápido=fino, lento=grueso. */
const velToWidth = (p1, p2, lastW) => {
  const vel = Math.hypot(p2.x - p1.x, p2.y - p1.y) / Math.max(p2.t - p1.t, 1);
  const target = Math.max(MIN_W, Math.min(MAX_W, MAX_W - vel * 10));
  // Suavizado exponencial: evita saltos bruscos de grosor
  return lastW * 0.85 + target * 0.15;
};

/**
 * Dibuja un segmento con grosor variable entre w1 y w2 usando un trazo
 * de Bézier cuadrática. Al usar un único path continuo no hay gaps.
 */
const drawSegment = (ctx, p1, p2, w1, w2) => {
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.quadraticCurveTo(
    (p1.x + p2.x) / 2,
    (p1.y + p2.y) / 2,
    p2.x,
    p2.y,
  );
  // Gradiente de grosor: dibujamos el path dos veces solapado con lineWidth
  // interpolado para simular transición continua
  const steps = 6;
  for (let i = 0; i <= steps; i++) {
    const t  = i / steps;
    const lw = w1 + (w2 - w1) * t;
    const x  = p1.x + (p2.x - p1.x) * t;
    const y  = p1.y + (p2.y - p1.y) * t;
    ctx.beginPath();
    ctx.arc(x, y, lw / 2, 0, Math.PI * 2);
    ctx.fill();
  }
};

const SignaturePadModal = forwardRef(({ onConfirm, onCancel, title = 'Dibujar Firma', showActions = true }, ref) => {
  const canvasRef = useRef(null);
  const drawing   = useRef(false);
  const pts       = useRef([]); // { x, y, t, w }
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr  = window.devicePixelRatio || 1;
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#111827';
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const src  = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top, t: Date.now() };
  };

  const startDraw = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getPos(e, canvas);
    drawing.current = true;
    pts.current = [{ ...pos, w: MAX_W }];
    // Punto de inicio
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, MAX_W / 2, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const draw = useCallback((e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx   = canvas.getContext('2d');
    const pos   = getPos(e, canvas);
    const last  = pts.current[pts.current.length - 1];
    const w     = velToWidth(last, pos, last.w);
    const point = { ...pos, w };
    pts.current.push(point);

    drawSegment(ctx, last, point, last.w, w);

    if (pts.current.length > 30) pts.current = pts.current.slice(-15);
    if (!hasDrawn) setHasDrawn(true);
  }, [hasDrawn]);

  const endDraw = useCallback((e) => {
    e.preventDefault();
    drawing.current = false;
  }, []);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }, []);

  const buildFile = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return null;
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) { resolve(null); return; }
        resolve(new File([blob], 'firma.png', { type: 'image/png' }));
      }, 'image/png');
    });
  }, [hasDrawn]);

  useImperativeHandle(ref, () => ({
    buildFile,
    isEmpty: () => !hasDrawn,
  }), [buildFile, hasDrawn]);

  const handleConfirm = useCallback(async () => {
    const file = await buildFile();
    if (file) onConfirm(file);
  }, [buildFile, onConfirm]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
        <span className="text-xs font-semibold text-gray-700">{title}</span>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <X size={13} />
        </button>
      </div>

      {/* Canvas */}
      <div className="px-3 pt-3 pb-1">
        <p className="text-2xs text-gray-400 mb-1.5">Firma con el mouse o dedo dentro del recuadro</p>
        <div className="relative border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
          <canvas
            ref={canvasRef}
            className="block w-full cursor-crosshair"
            style={{ height: `${CANVAS_H}px`, touchAction: 'none' }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
          {!hasDrawn && (
            <p className="absolute inset-0 flex items-center justify-center text-xs text-gray-300 pointer-events-none select-none">
              Firma aquí
            </p>
          )}
        </div>
        <div className="relative mt-1 mx-1">
          <div className="border-t border-gray-300" />
          <span className="absolute -top-2 left-0 text-2xs text-gray-400 bg-white px-1">línea de firma</span>
        </div>
      </div>

      {/* Modo reemplazar: botones propios */}
      {showActions && (
        <div className="flex items-center justify-between px-3 py-2.5">
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RotateCcw size={11} /> Limpiar
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 rounded transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!hasDrawn}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-brand hover:bg-brand-dark rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check size={11} /> Guardar firma
            </button>
          </div>
        </div>
      )}

      {/* Modo creación: solo limpiar + estado */}
      {!showActions && (
        <div className="flex items-center justify-between px-3 py-2">
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RotateCcw size={11} /> Limpiar
          </button>
          {hasDrawn && (
            <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
              <Check size={11} /> Lista para guardar
            </span>
          )}
        </div>
      )}
    </div>
  );
});

SignaturePadModal.displayName = 'SignaturePadModal';

export default SignaturePadModal;
