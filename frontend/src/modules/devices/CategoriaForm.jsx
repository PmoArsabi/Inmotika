import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, ClipboardList, CheckCircle2, Plus, Trash2,
  Loader2, ChevronUp, ChevronDown, Pencil, Tag, List, X,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { H2, Label, TextSmall } from '../../components/ui/Typography';
import { getProtocoloByCategory, saveCategoria } from '../../api/categoriaApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const emptyActividad = (orden) => ({
  id: null,
  tempId: `temp-act-${Date.now()}-${Math.random()}`,
  descripcion: '',
  orden,
  isNew: true,
  deleted: false,
});

// ─── Actividades sub-list for a paso ─────────────────────────────────────────
const ActividadesList = ({ actividades, isEditing, onChange }) => {
  const [showInput, setShowInput] = useState(false);
  const [inputText, setInputText] = useState('');

  const visible = actividades.filter(a => !a.deleted);

  const addActividad = () => {
    if (!inputText.trim()) return;
    const newA = { ...emptyActividad(visible.length + 1), descripcion: inputText.trim() };
    onChange([...actividades, newA]);
    setInputText(''); setShowInput(false);
  };

  const remove = (idx) => {
    const realIdx = actividades.indexOf(visible[idx]);
    const updated = [...actividades];
    if (updated[realIdx].isNew) updated.splice(realIdx, 1);
    else updated[realIdx] = { ...updated[realIdx], deleted: true };
    let ord = 1;
    onChange(updated.map(a => a.deleted ? a : { ...a, orden: ord++ }));
  };

  const updateDesc = (idx, val) => {
    const realIdx = actividades.indexOf(visible[idx]);
    onChange(actividades.map((a, i) => i === realIdx ? { ...a, descripcion: val } : a));
  };

  return (
    <div className="ml-8 mt-1.5 space-y-1">
      {visible.map((act, i) => (
        <div key={act.id || act.tempId} className="flex items-center gap-2 h-9 px-3 bg-gray-50 rounded border border-gray-100">
          <span className="text-[10px] font-bold text-gray-400 w-4 shrink-0 text-center">{i + 1}</span>
          {isEditing ? (
            <input
              className="flex-1 min-w-0 bg-transparent text-xs text-gray-700 outline-none"
              value={act.descripcion}
              onChange={e => updateDesc(i, e.target.value)}
              placeholder="Descripción de la actividad..."
            />
          ) : (
            <span className="flex-1 min-w-0 text-xs text-gray-700">{act.descripcion}</span>
          )}
          <div className="w-6 flex justify-center shrink-0">
            {isEditing && (
              <button type="button" onClick={() => remove(i)}
                className="p-0.5 text-gray-300 hover:text-red-500 transition-colors">
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      ))}

      {isEditing && showInput && (
        <div className="flex items-center gap-2 h-9 px-3 bg-blue-50 rounded border border-blue-100">
          <input
            autoFocus
            className="flex-1 min-w-0 bg-transparent text-xs text-gray-700 outline-none placeholder:text-gray-400"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Descripción de la actividad..."
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); addActividad(); }
              if (e.key === 'Escape') { setShowInput(false); setInputText(''); }
            }}
          />
          <div className="w-6 flex justify-center shrink-0">
            <button type="button" onClick={addActividad} disabled={!inputText.trim()}
              className="w-5 h-5 flex items-center justify-center rounded bg-[#D32F2F] text-white text-sm font-bold disabled:opacity-40 hover:bg-[#B71C1C] transition-colors">
              +
            </button>
          </div>
          <div className="w-6 flex justify-center shrink-0">
            <button type="button" onClick={() => { setShowInput(false); setInputText(''); }}
              className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {isEditing && !showInput && (
        <div className="flex justify-end pr-1 pt-0.5">
          <button type="button" onClick={() => setShowInput(true)}
            className="flex items-center gap-1 text-[10px] text-[#D32F2F] hover:text-[#B71C1C] font-semibold transition-colors">
            <Plus size={11} /> Agregar actividad
          </button>
        </div>
      )}

      {!isEditing && visible.length === 0 && (
        <p className="text-[10px] text-gray-400 italic ml-1">Sin actividades definidas</p>
      )}
    </div>
  );
};

// ─── Main form ────────────────────────────────────────────────────────────────
const CategoriaForm = ({ mode = 'create', categoria = null, onSave, onCancel, onModeChange }) => {
  const isCreating = mode === 'create';
  const isEditing  = mode === 'create' || mode === 'edit';
  const isViewing  = mode === 'view';

  const [nombre,     setNombre]     = useState(categoria?.nombre || '');
  const [desc,       setDesc]       = useState(categoria?.descripcion || '');
  const [pasos,      setPasos]      = useState([]);
  const [loadingPasos, setLoadingPasos] = useState(!isCreating);

  const [showPasoInput, setShowPasoInput] = useState(false);
  const [pasoText,      setPasoText]      = useState('');

  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState('');
  const [error,   setError]   = useState('');

  // ── Load pasos + actividades (Supabase) ──────────────────────────────────
  useEffect(() => {
    if (!categoria?.id || isCreating) { setLoadingPasos(false); return; }
    
    const fetchProt = async () => {
      setLoadingPasos(true);
      try {
        const data = await getProtocoloByCategory(categoria.id);
        setPasos(data || []);
      } catch (err) {
        console.error('Error loading protocol:', err);
      } finally {
        setLoadingPasos(false);
      }
    };
    
    fetchProt();
  }, [categoria?.id, isCreating]);

  useEffect(() => {
    if (categoria) { setNombre(categoria.nombre || ''); setDesc(categoria.descripcion || ''); }
  }, [categoria?.id, categoria?.nombre, categoria?.descripcion]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Paso management ───────────────────────────────────────────────────────
  const addPaso = () => {
    if (!pasoText.trim()) return;
    const newPaso = {
      id: null,
      tempId: `temp-paso-${Date.now()}`,
      descripcion: pasoText.trim(),
      orden: pasos.filter(p => !p.deleted).length + 1,
      isNew: true,
      deleted: false,
      actividades: [],
    };
    setPasos(prev => [...prev, newPaso]);
    setPasoText(''); setShowPasoInput(false);
  };

  const removePaso = (idx) => {
    setPasos(prev => {
      const updated = [...prev];
      if (updated[idx].isNew) updated.splice(idx, 1);
      else updated[idx] = { ...updated[idx], deleted: true };
      let ord = 1;
      return updated.map(p => p.deleted ? p : { ...p, orden: ord++ });
    });
  };

  const movePaso = (idx, dir) => {
    const visible = pasos.filter(p => !p.deleted);
    const visIdx  = visible.indexOf(pasos[idx]);
    if (dir === 'up' && visIdx === 0) return;
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

  const updatePasoDesc   = (idx, val)  => setPasos(prev => prev.map((p, i) => i === idx ? { ...p, descripcion: val } : p));
  const updateActividades = (idx, acts) => setPasos(prev => prev.map((p, i) => i === idx ? { ...p, actividades: acts } : p));

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!nombre.trim()) { setError('El nombre es requerido'); return; }

    // Cada paso activo debe tener al menos una actividad
    const activePasos = pasos.filter(p => !p.deleted);
    const pasoVacio = activePasos.find(p => (p.actividades || []).filter(a => !a.deleted).length === 0);
    if (pasoVacio) {
      setError(`El paso "${pasoVacio.descripcion || 'sin nombre'}" necesita al menos una actividad.`);
      return;
    }

    setError(''); setSaving(true);
    try {
      const result = await saveCategoria({
        categoriaId: isCreating ? null : categoria?.id,
        draft: {
          nombre: nombre.trim().toUpperCase(),
          descripcion: desc.trim() || null
        },
        steps: pasos
      });

      setSuccess(nombre.trim().toUpperCase());
      setTimeout(() => { 
        setSuccess(''); 
        onSave?.({ ...categoria, id: result.categoriaId, nombre: nombre.trim().toUpperCase() }); 
      }, 1800);
    } catch (err) {
      console.error('Error guardando categoría:', err);
      setError('Ocurrió un error al guardar: ' + (err.message || 'Intente nuevamente.'));
    } finally {
      setSaving(false);
    }
  };

  const visiblePasos = pasos.filter(p => !p.deleted);

  // ── Render ────────────────────────────────────────────────────────────────
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
          <Button onClick={() => onModeChange('edit')} className="flex items-center gap-2 shrink-0">
            <Pencil size={13} /> Editar
          </Button>
        )}
        {isEditing && (
          <div className="flex items-center gap-3 shrink-0">
            {error && <TextSmall className="text-red-500">{error}</TextSmall>}
            <Button onClick={handleSave} disabled={!nombre.trim() || saving}
              className="flex items-center gap-2 bg-linear-to-r from-[#D32F2F] to-[#8B0000] text-white border-0">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {saving ? 'Guardando...' : (isCreating ? 'Crear Categoría' : 'Guardar Cambios')}
            </Button>
          </div>
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
              uppercase autoFocus={isCreating} required
              error={error && !nombre.trim() ? error : null}
            />
            <div className="flex flex-col gap-1.5">
              <Label>Descripción</Label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-4 focus:ring-[#D32F2F]/5 focus:border-[#D32F2F] transition-all resize-none"
                rows={2} placeholder="Descripción opcional de la categoría"
                value={desc} onChange={e => setDesc(e.target.value)}
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

      {/* Protocolo */}
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

        {/* New paso input */}
        {showPasoInput && (
          <div className="flex items-center gap-2 h-9 px-3 bg-gray-50 rounded-lg border border-gray-200">
            <input
              autoFocus
              className="flex-1 min-w-0 bg-white border border-gray-300 rounded-md px-3 h-7 text-sm font-semibold text-gray-700 outline-none focus:border-[#D32F2F] transition-colors"
              placeholder="Nombre / sección del paso..."
              value={pasoText}
              onChange={e => setPasoText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); addPaso(); }
                if (e.key === 'Escape') { setShowPasoInput(false); setPasoText(''); }
              }}
            />
            <div className="w-6 flex justify-center shrink-0">
              <button type="button" onClick={addPaso} disabled={!pasoText.trim()}
                className="w-5 h-5 flex items-center justify-center rounded bg-[#D32F2F] text-white text-sm font-bold disabled:opacity-40 hover:bg-[#B71C1C] transition-colors">
                +
              </button>
            </div>
            <div className="w-6 flex justify-center shrink-0">
              <button type="button" onClick={() => { setShowPasoInput(false); setPasoText(''); }}
                className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Pasos list */}
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
          <div className="space-y-3">
            {visiblePasos.map((paso, visIdx) => {
              const realIdx = pasos.indexOf(paso);
              const actVisible = (paso.actividades || []).filter(a => !a.deleted);
              return (
                <div key={paso.id || paso.tempId} className="border border-gray-100 rounded-lg bg-white shadow-sm overflow-hidden">
                  {/* Paso header row */}
                  <div className="flex items-center gap-2 px-3 min-h-9 py-2">
                    {/* Order controls */}
                    {isEditing ? (
                      <div className="flex flex-col items-center gap-0 shrink-0 w-5">
                        <button onClick={() => movePaso(realIdx, 'up')} disabled={visIdx === 0}
                          className="text-gray-300 hover:text-[#D32F2F] disabled:opacity-20 transition-colors leading-none">
                          <ChevronUp size={12} />
                        </button>
                        <span className="font-bold text-gray-400 text-[10px] text-center leading-none">{visIdx + 1}</span>
                        <button onClick={() => movePaso(realIdx, 'down')} disabled={visIdx === visiblePasos.length - 1}
                          className="text-gray-300 hover:text-[#D32F2F] disabled:opacity-20 transition-colors leading-none">
                          <ChevronDown size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-linear-to-br from-[#D32F2F] to-[#8B0000] flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                        {visIdx + 1}
                      </div>
                    )}

                    {/* Description */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <input
                          className="w-full bg-transparent text-sm font-semibold text-gray-700 outline-none"
                          value={paso.descripcion}
                          onChange={e => updatePasoDesc(realIdx, e.target.value)}
                          placeholder="Nombre / sección del paso..."
                        />
                      ) : (
                        <TextSmall className="font-semibold text-gray-800">{paso.descripcion}</TextSmall>
                      )}
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                        <List size={9} /> {actVisible.length} actividad{actVisible.length !== 1 ? 'es' : ''}
                      </span>
                    </div>

                    {/* Empty space to align with actividad rows */}
                    <div className="w-6 shrink-0" />

                    {/* Fixed-width trash column — matches actividad rows */}
                    <div className="w-6 flex justify-center shrink-0">
                      {isEditing && (
                        <button type="button" onClick={() => removePaso(realIdx)}
                          className="p-0.5 text-gray-300 hover:text-red-500 rounded transition-colors">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actividades sub-list */}
                  <div className="border-t border-gray-50 pb-2">
                    <ActividadesList
                      actividades={paso.actividades || []}
                      isEditing={isEditing}
                      onChange={acts => updateActividades(realIdx, acts)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

    </div>
  );
};

export default CategoriaForm;
