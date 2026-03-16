import React, { useState, useEffect, useCallback } from 'react';
import { Tag, ClipboardList } from 'lucide-react';
import Card from '../components/ui/Card';
import { TextSmall, Subtitle } from '../components/ui/Typography';
import CategoriaForm from '../modules/devices/CategoriaForm';
import GenericListView from '../components/shared/GenericListView';

// ─────────────────────────────────────────────────────────────────────────────
// CategoriasPage
// Shows a list of all device categories. Allows viewing, editing, and creating.
// ─────────────────────────────────────────────────────────────────────────────
const CategoriasPage = () => {
  const [categorias, setCategorias]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(null);   // { categoria, mode }
  const [refreshKey, setRefreshKey]   = useState(0);

  // ─── Load categories (Preparado para Supabase) ───────────────────────────
  const loadData = useCallback(() => {
    setLoading(true);
    // TODO: Connect to Supabase to fetch categories
    setCategorias([]);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData, refreshKey]);

  const refresh = () => setRefreshKey(k => k + 1);

  // ─── After save ──────────────────────────────────────────────────────────
  const handleSaved = (savedCat) => {
    refresh();
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

  // ─── List Configuration ──────────────────────────────────────────────────
  const columns = [
    {
      header: 'Nombre',
      render: (cat) => <Subtitle className="text-gray-900">{cat.nombre}</Subtitle>
    },
    {
      header: 'Descripción',
      render: (cat) => (
        <TextSmall className="text-gray-500">
          {cat.descripcion || <span className="italic text-gray-300">Sin descripción</span>}
        </TextSmall>
      )
    },
    {
      header: 'Protocolo',
      render: (cat) => (
        <div className="flex items-center gap-1.5">
          <ClipboardList size={13} className={cat.numPasos > 0 ? 'text-green-500' : 'text-gray-300'} />
          <TextSmall className={cat.numPasos > 0 ? 'text-green-700 font-semibold' : 'text-gray-400'}>
            {cat.numPasos > 0 ? `${cat.numPasos} paso${cat.numPasos !== 1 ? 's' : ''}` : 'Sin protocolo'}
          </TextSmall>
        </div>
      )
    }
  ];

  const filterFunction = (cat, q) => (
    cat.nombre?.toLowerCase().includes(q) ||
    cat.descripcion?.toLowerCase().includes(q)
  );

  // ─── List view ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <GenericListView
        title="Categorías de Dispositivos"
        icon={Tag}
        items={categorias}
        columns={columns}
        onNew={() => setSelected({ categoria: null, mode: 'create' })}
        onView={(cat) => setSelected({ categoria: cat, mode: 'view' })}
        onEdit={(cat) => setSelected({ categoria: cat, mode: 'edit' })}
        newButtonLabel="Nueva Categoría"
        searchPlaceholder="Buscar por nombre o descripción..."
        filterFunction={filterFunction}
        emptyText="Sin categorías registradas"
      />
    </div>
  );
};

export default CategoriasPage;
