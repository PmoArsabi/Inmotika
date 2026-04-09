/**
 * Modal (portal) para registrar un nuevo traslado de dispositivo entre sucursales.
 * Toda la lógica de estado y validación del formulario de traslado vive aquí.
 */
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRightLeft, MapPin, Building2, Calendar,
  ClipboardList, AlertTriangle, Loader2,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import SearchableSelect from '../../components/ui/SearchableSelect';
import { createTraslado, updateDeviceSucursal } from '../../api/deviceApi';

/**
 * @param {{
 *   deviceId: string,
 *   branchId: string,
 *   sucursalOrigenNombre: string,
 *   sucursalesDestino: Array<{value: string, label: string}>,
 *   userId: string,
 *   onClose: () => void,
 *   onSuccess: (nuevaSucursalId?: string) => void,
 * }} props
 */
const TrasladoModal = ({
  deviceId,
  branchId,
  sucursalOrigenNombre,
  sucursalesDestino,
  userId,
  onClose,
  onSuccess,
}) => {
  const [form, setForm] = useState({ sucursalDestinoId: '', motivo: '', fechaTraslado: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const errs = {};
    if (!form.sucursalDestinoId) errs.sucursalDestinoId = 'Selecciona la sucursal destino.';
    if (!form.motivo.trim())     errs.motivo            = 'El motivo es obligatorio.';
    if (!form.fechaTraslado)     errs.fechaTraslado     = 'La fecha es obligatoria.';
    if (form.sucursalDestinoId && form.sucursalDestinoId === branchId)
      errs.sucursalDestinoId = 'La sucursal destino debe ser distinta a la actual.';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    try {
      await createTraslado({
        dispositivoId:     deviceId,
        sucursalOrigenId:  branchId,
        sucursalDestinoId: form.sucursalDestinoId,
        fechaTraslado:     form.fechaTraslado,
        motivo:            form.motivo.trim(),
        usuarioId:         userId,
      });

      // Actualizar ubicación actual solo si el traslado ya ocurrió (no es futuro)
      const trasladoDate = new Date(form.fechaTraslado);
      if (trasladoDate <= new Date()) {
        await updateDeviceSucursal(deviceId, form.sucursalDestinoId);
        onSuccess(form.sucursalDestinoId);
      } else {
        onSuccess();
      }
    } catch (err) {
      console.error('[TrasladoModal] createTraslado:', err);
      setErrors({ general: 'No se pudo registrar el traslado. Intenta nuevamente.' });
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-9990 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => !saving && onClose()}
      />

      {/* Panel */}
      <div className="relative z-10 bg-white rounded-xl shadow-2xl flex flex-col w-full max-w-lg max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-linear-to-r from-[#D32F2F] via-[#B71C1C] to-[#8B0000] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg border border-white/30">
              <ArrowRightLeft size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm uppercase tracking-wide">Registrar Traslado</p>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={10} className="text-white/60" />
                <p className="text-white/70 text-xs">
                  Origen: <span className="text-white font-semibold">{sucursalOrigenNombre}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-5 space-y-4">
          {errors.general && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
              <AlertTriangle size={15} className="shrink-0" />
              {errors.general}
            </div>
          )}

          {/* Sucursal destino */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Building2 size={14} className="text-[#D32F2F]" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Sucursal Destino <span className="text-red-500">*</span>
              </span>
            </div>
            <SearchableSelect
              options={sucursalesDestino}
              value={sucursalesDestino.find(o => o.value === form.sucursalDestinoId) || null}
              onChange={opt => setForm(f => ({ ...f, sucursalDestinoId: opt?.value || '' }))}
              placeholder="Buscar sucursal destino..."
            />
            {errors.sucursalDestinoId && (
              <p className="text-xs text-red-500 font-semibold flex items-center gap-1 mt-1">
                <AlertTriangle size={11} /> {errors.sucursalDestinoId}
              </p>
            )}
          </div>

          {/* Fecha */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={14} className="text-[#D32F2F]" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Fecha de Traslado <span className="text-red-500">*</span>
              </span>
            </div>
            <Input
              type="datetime-local"
              value={form.fechaTraslado}
              onChange={e => setForm(f => ({ ...f, fechaTraslado: e.target.value }))}
              error={errors.fechaTraslado}
            />
            {form.fechaTraslado && new Date(form.fechaTraslado) > new Date() && (
              <p className="text-xs text-amber-600 font-semibold flex items-center gap-1 mt-2">
                <AlertTriangle size={11} />
                Traslado programado — la ubicación cambiará cuando llegue esa fecha.
              </p>
            )}
          </div>

          {/* Motivo */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList size={14} className="text-[#D32F2F]" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Motivo <span className="text-red-500">*</span>
              </span>
            </div>
            <textarea
              value={form.motivo}
              onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))}
              rows={3}
              placeholder="Describe el motivo del traslado..."
              className={`w-full px-3 py-2.5 border rounded-md text-sm font-semibold resize-none focus:outline-none focus:ring-4 focus:ring-[#D32F2F]/5 focus:border-[#D32F2F] hover:border-gray-400 transition-all bg-white ${errors.motivo ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.motivo && (
              <p className="text-xs text-red-500 font-semibold flex items-center gap-1 mt-1">
                <AlertTriangle size={11} /> {errors.motivo}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
            {saving
              ? <><Loader2 size={15} className="animate-spin" /> Registrando...</>
              : <><ArrowRightLeft size={15} /> Registrar Traslado</>
            }
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TrasladoModal;
