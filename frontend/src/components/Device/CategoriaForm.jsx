import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, ClipboardList, CheckCircle2, Plus, Trash2,
  Loader2, ChevronUp, ChevronDown, Pencil, Tag,
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import { H2, Label, TextSmall } from '../ui/Typography';
import { supabase } from '../../utils/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// CategoriaForm
// Props:
//   mode       'create' | 'view' | 'edit'
//   categoria  { id, nombre, descripcion } | null  (null only in 'create')
//   onSave(savedData)  — called after successful save
//   onCancel()         — called when user clicks back/cancel
//   onModeChange(mode) — optional, lets parent switch between view ↔ edit
// ─────────────────────────────────────────────────────────────────────────────
const CategoriaForm = ({ mode = 'create', categoria = null, onSave, onCancel, onModeChange }) => {
  const isCreating = mode === 'create';
  const isEditing  = mode === 'create' || mode === 'edit';
  const isViewing  = mode === 'view';

  // ─── Form state ─────────────────────────────────────────────────────────
  const [nombre, setNombre]     = useState(categoria?.nombre || '');
  const [desc, setDesc]         = useState(categoria?.descripcion || '');
  const [pasos, setPasos]       = useState([]);
  const [loadingPasos, setLoadingPasos] = useState(!isCreating);

  // ─── Step input state ────────────────────────────────────────────────────
  const [showPasoInput, setShowPasoInput] = useState(false);
  const [pasoText, setPasoText]           = useState('');
  const [pasoOblig, setPasoOblig]         = useState(true);

  // ─── Async state ─────────────────────────────────────────────────────────
  const [saving, setSaving]       = useState(false);
  const [success, setSuccess]     = useState('');
  const [error, setError]         = useState('');

  // ─── Load pasos when editing/viewing existing category ───────────────────
  useEffect(() => {
    if (!categoria?.id) { setLoadingPasos(false); return; }
    setLoadingPasos(true);
    supabase
      .from('paso_protocolo')
      .select('*')
      .eq('categoria_id', categoria.id)
      .order('orden')
      .then(({ data }) => {
        setPasos((data || []).map(p => ({
          id: p.id,
          tempId: null,
          descripcion: p.descripcion,
          esObligatorio: p.es_obligatorio ?? true,
          orden: p.orden,
          isNew: false,
          deleted: false,
        })));
        setLoadingPasos(false);
      });
  }, [categoria?.id]);

  // ─── Sync form fields when switching to edit mode ────────────────────────
  useEffect(() => {
    if (categoria) {
      setNombre(categoria.nombre || '');
      setDesc(categoria.descripcion || '');
    }
  }, [categoria]);

  // ─── Step management ─────────────────────────────────────────────────────
  const addPaso = () => {
    if (!pasoText.trim()) return;
    const newPaso = {
      id: null,
      tempId: `temp-${Date.now()}`,
      descripcion: pasoText.trim(),
      esObligatorio: pasoOblig,
      orden: pasos.filter(p => !p.deleted).length + 1,
      isNew: true,
      deleted: false,
    };
    setPasos(prev => [...prev, newPaso]);
    setPasoText(''); setPasoOblig(true); setShowPasoInput(false);
  };

  const removePaso = (idx) => {
    setPasos(prev => {
      const updated = [...prev];
      if (updated[idx].isNew) {
        updated.splice(idx, 1);
      } else {
        updated[idx] = { ...updated[idx], deleted: true };
      }
      return updated.filter(p => !p.deleted || !p.isNew).map((p, i) => ({ ...p, orden: i + 1 }));
    });
  };

  const movePaso = (idx, dir) => {
    const visible = pasos.filter(p => !p.deleted);
    const visIdx = visible.indexOf(pasos[idx]);
    if (dir === 'up'   && visIdx === 0) return;
    if (dir === 'down' && visIdx === visible.length - 1) return;
    const allIdxs = pasos.map((_, i) => i).filter(i => !pasos[i].deleted);
    const a = allIdxs[visIdx + (dir === 'up' ? -1 : 1)];
    const b = allIdxs[visIdx];
    setPasos(prev => {
      const next = [...prev];
      [next[a], next[b]] = [next[b], next[a]];
      return next.map((p, i) => ({ ...p, orden: i + 1 }));
    });
  };

  const toggleOblig = (idx) =>
    setPasos(prev => prev.map((p, i) => i === idx ? { ...p, esObligatorio: !p.esObligatorio } : p));

  // ─── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!nombre.trim()) { setError('El nombre es requerido'); return; }
    setError('');
    setSaving(true);
    try {
      let savedCat;
      if (isCreating) {
        const { data, error: err } = await supabase
          .from('categoria_dispositivo')
          .insert({ nombre: nombre.trim(), descripcion: desc.trim() || null })
          .select().single();
        if (err) throw err;
        savedCat = data;

        const newPasos = pasos.filter(p => !p.deleted);
        if (newPasos.length > 0) {
          await supabase.from('paso_protocolo').insert(
            newPasos.map(p => ({
              categoria_id: savedCat.id,
              descripcion: p.descripcion,
              es_obligatorio: p.esObligatorio,
              orden: p.orden,
            }))
          );
        }
      } else {
        const { data, error: err } = await supabase
          .from('categoria_dispositivo')
          .update({ nombre: nombre.trim(), descripcion: desc.trim() || null })
          .eq('id', categoria.id)
          .select().single();
        if (err) throw err;
        savedCat = data;

        // Handle deleted pasos
        const toDelete = pasos.filter(p => p.deleted && p.id);
        if (toDelete.length > 0) {
          await supabase.from('paso_protocolo').delete()
            .in('id', toDelete.map(p => p.id));
        }
        // Handle new pasos
        const toInsert = pasos.filter(p => p.isNew && !p.deleted);
        if (toInsert.length > 0) {
          await supabase.from('paso_protocolo').insert(
            toInsert.map(p => ({
              categoria_id: categoria.id,
              descripcion: p.descripcion,
              es_obligatorio: p.esObligatorio,
              orden: p.orden,
            }))
          );
        }
        // Handle updated existing pasos (orden or esObligatorio changed)
        const toUpdate = pasos.filter(p => !p.isNew && !p.deleted && p.id);
        for (const p of toUpdate) {
          await supabase.from('paso_protocolo').update({
            descripcion: p.descripcion,
            es_obligatorio: p.esObligatorio,
            orden: p.orden,
          }).eq('id', p.id);
        }
      }

      setSuccess(savedCat.nombre);
      setTimeout(() => {
        setSuccess('');
        onSave?.(savedCat);
      }, 1800);
    } catch (err) {
      console.error('Error guardando categoría:', err);
      setError('Ocurrió un error al guardar. Intente nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Visible pasos (excluding soft-deleted) ───────────────────────────────
  const visiblePasos = pasos.filter(p => !p.deleted);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">

      {/* Success overlay */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-8 flex flex-col items-center text-center gap-4 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 size={40} className="text-green-600" />
            </div>
            <div>
              <H2 className="text-gray-900 mb-2">
                {isCreating ? '¡Categoría creada!' : '¡Categoría actualizada!'}
              </H2>
              <TextSmall className="text-gray-500">"{success}" guardada correctamente.</TextSmall>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center gap-4 bg-white p-4 rounded-md border border-gray-100 shadow-sm">
        <button onClick={onCancel}
          className="p-2 bg-gray-50 hover:bg-[#D32F2F] hover:text-white rounded-md transition-all">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <H2 className="truncate">
            {isCreating ? 'Nueva Categoría' : (isEditing ? 'Editar Categoría' : nombre || 'Ver Categoría')}
          </H2>
          <TextSmall className="text-gray-500">
            {isCreating ? 'Nombre, descripción y protocolo de mantenimiento'
              : isEditing ? 'Modifica los datos y el protocolo'
              : 'Detalle de la categoría y su protocolo'}
          </TextSmall>
        </div>
        {isViewing && onModeChange && (
          <Button onClick={() => onModeChange('edit')}
            className="flex items-center gap-2 shrink-0">
            <Pencil size={13} /> Editar
          </Button>
        )}
      </header>

      {/* Datos básicos */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
          <Tag size={14} className="text-gray-500" />
          <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Datos de la Categoría</span>
        </div>

        {isEditing ? (
          <>
            <Input
              label="Nombre"
              value={nombre}
              onChange={e => setNombre(e.target.value.toUpperCase())}
              placeholder="Ej: TORNIQUETES, CÁMARA IP, SWITCH..."
              uppercase
              autoFocus={isCreating}
              required
              error={error && !nombre.trim() ? error : null}
            />
            <div className="flex flex-col gap-1.5">
              <Label>Descripción</Label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-4 focus:ring-[#D32F2F]/5 focus:border-[#D32F2F] transition-all resize-none"
                rows={2}
                placeholder="Descripción opcional de la categoría"
                value={desc}
                onChange={e => setDesc(e.target.value)}
              />
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div>
              <Label className="text-gray-500">Nombre</Label>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{nombre}</p>
            </div>
            {desc && (
              <div>
                <Label className="text-gray-500">Descripción</Label>
                <p className="text-sm text-gray-700 mt-0.5">{desc}</p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Protocolo de mantenimiento */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList size={15} className="text-[#D32F2F]" />
            <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Protocolo de Mantenimiento</span>
          </div>
          {isEditing && (
            <button type="button" onClick={() => setShowPasoInput(true)}
              className="flex items-center gap-1 text-xs text-[#D32F2F] hover:text-[#B71C1C] font-semibold transition-colors">
              <Plus size={14} /> Agregar paso
            </button>
          )}
        </div>

        {/* Step input */}
        {showPasoInput && (
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
            <Input
              placeholder="Descripción del paso..."
              value={pasoText}
              onChange={e => setPasoText(e.target.value)}
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); addPaso(); }
                if (e.key === 'Escape') { setShowPasoInput(false); setPasoText(''); }
              }}
            />
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={pasoOblig} onChange={e => setPasoOblig(e.target.checked)} className="w-4 h-4 accent-[#D32F2F]" />
                <span className="text-xs font-semibold text-gray-700">Paso obligatorio</span>
              </label>
              <div className="flex gap-2">
                <Button onClick={addPaso} disabled={!pasoText.trim()} className="px-3 py-1 text-xs flex items-center gap-1">
                  <Plus size={13} /> Agregar
                </Button>
                <Button onClick={() => { setShowPasoInput(false); setPasoText(''); }}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 border border-gray-400 hover:bg-gray-200">
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Steps list */}
        {loadingPasos ? (
          <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
            <Loader2 size={16} className="animate-spin" />
            <TextSmall>Cargando protocolo...</TextSmall>
          </div>
        ) : visiblePasos.length === 0 && !showPasoInput ? (
          <div className="p-6 border border-dashed border-gray-200 rounded-lg text-center">
            <TextSmall className="text-gray-400 italic">
              {isEditing ? 'Sin pasos — presiona "Agregar paso" para comenzar' : 'Esta categoría no tiene protocolo definido'}
            </TextSmall>
          </div>
        ) : (
          <div className="space-y-2">
            {visiblePasos.map((paso, visIdx) => {
              const realIdx = pasos.indexOf(paso);
              return (
                <div key={paso.id || paso.tempId}
                  className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                  {/* Order controls */}
                  {isEditing && (
                    <div className="flex flex-col gap-0.5 shrink-0 pt-0.5">
                      <button onClick={() => movePaso(realIdx, 'up')} disabled={visIdx === 0}
                        className="text-gray-300 hover:text-[#D32F2F] disabled:opacity-20 transition-colors">
                        <ChevronUp size={13} />
                      </button>
                      <span className="font-bold text-gray-400 text-[10px] text-center leading-none">{visIdx + 1}</span>
                      <button onClick={() => movePaso(realIdx, 'down')} disabled={visIdx === visiblePasos.length - 1}
                        className="text-gray-300 hover:text-[#D32F2F] disabled:opacity-20 transition-colors">
                        <ChevronDown size={13} />
                      </button>
                    </div>
                  )}
                  {!isEditing && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#D32F2F] to-[#8B0000] flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {visIdx + 1}
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    {isEditing ? (
                      <input
                        className="w-full bg-transparent text-sm text-gray-700 outline-none font-medium"
                        value={paso.descripcion}
                        onChange={e => setPasos(prev => prev.map((p, i) => i === realIdx ? { ...p, descripcion: e.target.value } : p))}
                        placeholder="Descripción del paso..."
                      />
                    ) : (
                      <TextSmall className="font-medium text-gray-800">{paso.descripcion}</TextSmall>
                    )}
                    {isEditing ? (
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={!!paso.esObligatorio}
                          onChange={() => toggleOblig(realIdx)}
                          className="w-3 h-3 accent-[#D32F2F]" />
                        <span className="text-[10px] font-semibold text-gray-500">Obligatorio</span>
                      </label>
                    ) : paso.esObligatorio ? (
                      <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wide">Obligatorio</span>
                    ) : null}
                  </div>

                  {/* Delete */}
                  {isEditing && (
                    <button type="button" onClick={() => removePaso(realIdx)}
                      className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors shrink-0">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Footer actions */}
      {isEditing && (
        <div className="flex items-center justify-end gap-3">
          {error && <TextSmall className="text-red-500 mr-auto">{error}</TextSmall>}
          <Button onClick={onCancel}
            className="bg-gray-100 text-gray-700 border border-gray-400 hover:bg-gray-200">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!nombre.trim() || saving}
            className="flex items-center gap-2 bg-gradient-to-r from-[#D32F2F] to-[#8B0000] text-white border-0">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {saving ? 'Guardando...' : (isCreating ? 'Crear Categoría' : 'Guardar Cambios')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CategoriaForm;
