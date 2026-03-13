import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, Eye, Edit, ClipboardList, RefreshCw, Loader2 } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ModuleHeader from '../components/ui/ModuleHeader';
import { Table, THead, TBody, Tr, Th, Td } from '../components/ui/Table';
import { TextSmall, Subtitle } from '../components/ui/Typography';
import CategoriaForm from '../modules/devices/CategoriaForm';
import { INITIAL_DATA } from '../utils/mockData';

// ─────────────────────────────────────────────────────────────────────────────
// CategoriasPage
// Shows a list of all device categories. Allows viewing, editing, and creating.
// ─────────────────────────────────────────────────────────────────────────────
const CategoriasPage = () => {
  const [categorias, setCategorias]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(null);   // { categoria, mode }
  const [refreshKey, setRefreshKey]   = useState(0);

  // ─── Load categories with step counts (Desde Mocks) ──────────────────────
  const loadData = useCallback(() => {
    setLoading(true);
    
    // Simular ligera latencia de red para la UI
    setTimeout(() => {
      const catsMock = INITIAL_DATA.categorias || [];
      const countMap = {
        'cat-1': 3,
        'cat-2': 4,
        'cat-3': 2,
        'cat-4': 5
      };

      setCategorias(catsMock.map(c => ({ 
        ...c, 
        numPasos: countMap[c.id] || 0 
      })));
      setLoading(false);
    }, 400);
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

      <ModuleHeader
        icon={Tag}
        title="Categorías de Dispositivos"
        subtitle={loading ? 'Cargando...' : `${categorias.length} categoría${categorias.length !== 1 ? 's' : ''} registrada${categorias.length !== 1 ? 's' : ''}`}
        onNewClick={() => setSelected({ categoria: null, mode: 'create' })}
        newButtonLabel="Nueva Categoría"
        extraActions={
          <button onClick={refresh}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/20 rounded-md transition-all"
            title="Actualizar">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        }
      />

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
                    <Subtitle className="text-gray-900">{cat.nombre}</Subtitle>
                  </Td>
                  <Td>
                    <TextSmall className="text-gray-500">
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
                  <Td align="right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelected({ categoria: cat, mode: 'view' })}
                        className="p-2 hover:bg-blue-50 rounded-md transition-colors"
                        title="Ver detalle">
                        <Eye size={16} className="text-blue-600" />
                      </button>
                      <button
                        onClick={() => setSelected({ categoria: cat, mode: 'edit' })}
                        className="p-2 hover:bg-green-50 rounded-md transition-colors"
                        title="Editar">
                        <Edit size={16} className="text-green-600" />
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
