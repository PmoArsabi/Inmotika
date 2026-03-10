import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, Eye, Pencil, ClipboardList, RefreshCw, Loader2 } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '../components/ui/Table';
import { H2, TextSmall } from '../components/ui/Typography';
import CategoriaForm from '../components/Device/CategoriaForm';
import { supabase } from '../utils/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// CategoriasPage
// Shows a list of all device categories. Allows viewing, editing, and creating.
// ─────────────────────────────────────────────────────────────────────────────
const CategoriasPage = () => {
  const [categorias, setCategorias]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(null);   // { categoria, mode }
  const [refreshKey, setRefreshKey]   = useState(0);

  // ─── Load categories with step counts ────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: cats } = await supabase
      .from('categoria_dispositivo')
      .select('id, nombre, descripcion')
      .order('nombre');

    const { data: pasos } = await supabase
      .from('paso_protocolo')
      .select('categoria_id');

    const countMap = {};
    (pasos || []).forEach(p => { countMap[p.categoria_id] = (countMap[p.categoria_id] || 0) + 1; });

    setCategorias((cats || []).map(c => ({ ...c, numPasos: countMap[c.id] || 0 })));
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData, refreshKey]);

  const refresh = () => setRefreshKey(k => k + 1);

  // ─── After save ──────────────────────────────────────────────────────────
  const handleSaved = (savedCat) => {
    refresh();
    // Return to list after short delay (success overlay handles the timing)
    setSelected(null);
  };

  // ─── Detail view ─────────────────────────────────────────────────────────
  if (selected) {
    return (
      <CategoriaForm
        mode={selected.mode}
        categoria={selected.categoria}
        onSave={handleSaved}
        onCancel={() => setSelected(null)}
        onModeChange={(newMode) => setSelected(prev => ({ ...prev, mode: newMode }))}
      />
    );
  }

  // ─── List view ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#D32F2F] to-[#8B0000] rounded-lg flex items-center justify-center shadow">
            <Tag size={18} className="text-white" />
          </div>
          <div>
            <H2>Categorías de Dispositivos</H2>
            <TextSmall className="text-gray-500">
              {loading ? 'Cargando...' : `${categorias.length} categoría${categorias.length !== 1 ? 's' : ''} registrada${categorias.length !== 1 ? 's' : ''}`}
            </TextSmall>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-all"
            title="Actualizar">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <Button onClick={() => setSelected({ categoria: null, mode: 'create' })}
            className="flex items-center gap-2 bg-gradient-to-r from-[#D32F2F] to-[#8B0000] text-white border-0">
            <Plus size={14} /> Nueva Categoría
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <TextSmall>Cargando categorías...</TextSmall>
          </div>
        ) : categorias.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Tag size={28} className="text-gray-300" />
            </div>
            <div className="text-center">
              <TextSmall className="font-semibold text-gray-500">Sin categorías registradas</TextSmall>
              <p className="text-xs text-gray-400 mt-1">Crea la primera categoría para empezar a clasificar dispositivos</p>
            </div>
            <Button onClick={() => setSelected({ categoria: null, mode: 'create' })}
              className="flex items-center gap-2 mt-2">
              <Plus size={14} /> Nueva Categoría
            </Button>
          </div>
        ) : (
          <Table>
            <THead variant="dark">
              <tr>
                <Th>Nombre</Th>
                <Th>Descripción</Th>
                <Th>Protocolo</Th>
                <Th>Acciones</Th>
              </tr>
            </THead>
            <TBody>
              {categorias.map(cat => (
                <Tr key={cat.id}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-[#D32F2F]/10 rounded-md flex items-center justify-center shrink-0">
                        <Tag size={13} className="text-[#D32F2F]" />
                      </div>
                      <span className="font-bold text-gray-900 text-sm">{cat.nombre}</span>
                    </div>
                  </Td>
                  <Td>
                    <TextSmall className="text-gray-500 truncate max-w-xs">
                      {cat.descripcion || <span className="italic text-gray-300">Sin descripción</span>}
                    </TextSmall>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <ClipboardList size={13} className={cat.numPasos > 0 ? 'text-green-500' : 'text-gray-300'} />
                      <TextSmall className={cat.numPasos > 0 ? 'text-green-700 font-semibold' : 'text-gray-400'}>
                        {cat.numPasos > 0 ? `${cat.numPasos} paso${cat.numPasos !== 1 ? 's' : ''}` : 'Sin protocolo'}
                      </TextSmall>
                    </div>
                  </Td>
                  <Td narrow>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelected({ categoria: cat, mode: 'view' })}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors"
                        title="Ver detalle">
                        <Eye size={13} /> Ver
                      </button>
                      <button
                        onClick={() => setSelected({ categoria: cat, mode: 'edit' })}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#D32F2F] bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
                        title="Editar">
                        <Pencil size={13} /> Editar
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default CategoriasPage;
