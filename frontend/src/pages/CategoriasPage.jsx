import { useState, useMemo } from 'react';
import { Tag, ClipboardList } from 'lucide-react';
import { TextSmall, Subtitle } from '../components/ui/Typography';
import CategoriaForm from '../modules/devices/CategoriaForm';
import GenericListView from '../components/shared/GenericListView';
import FilterBar from '../components/shared/FilterBar';
import ActionResultModal from '../components/ui/ActionResultModal';
import { useMasterData } from '../context/MasterDataContext';
import { useConfirm } from '../context/ConfirmContext';
import { useNotify } from '../context/NotificationContext';
import { deleteCategoria } from '../api/categoriaApi';

const CategoriasPage = () => {
  const { data, refreshData } = useMasterData();
  const confirm = useConfirm();
  const notify = useNotify();
  const [selected, setSelected] = useState(null); // { categoria, mode }
  const [savedResult, setSavedResult] = useState(null); // { categoria, isNew }

  const allCategorias = useMemo(() => data?.categorias || [], [data?.categorias]);
  const [filters, setFilters] = useState({ fechaDesde: '', fechaHasta: '' });

  const filterDefs = [
    { key: 'fechaDesde', label: 'Fecha desde', type: 'date', dateRole: 'desde', linkedTo: 'fechaHasta' },
    { key: 'fechaHasta', label: 'Fecha hasta', type: 'date', dateRole: 'hasta', linkedTo: 'fechaDesde' },
  ];

  const categorias = useMemo(() => {
    let list = allCategorias;
    if (filters.fechaDesde)
      list = list.filter(c => c.created_at && c.created_at >= filters.fechaDesde);
    if (filters.fechaHasta)
      list = list.filter(c => c.created_at && c.created_at <= filters.fechaHasta + 'T23:59:59');
    return list;
  }, [allCategorias, filters]);

  // ─── Delete category ─────────────────────────────────────────────────────
  const handleDelete = async (cat) => {
    const confirmed = await confirm({
      title: '¿Eliminar categoría?',
      message: `¿Estás seguro de eliminar "${cat.nombre}"? Los dispositivos que ya tienen esta categoría asignada la conservarán, pero no podrá usarse en nuevos registros.`,
      confirmText: 'Eliminar',
      type: 'danger',
    });
    if (!confirmed) return;

    try {
      await deleteCategoria(cat.id);
      refreshData();
      notify('success', `Categoría "${cat.nombre}" eliminada correctamente`);
    } catch (err) {
      console.error('Error deleting category:', err);
      notify('error', 'Error al eliminar la categoría');
    }
  };

  // ─── After save ──────────────────────────────────────────────────────────
  const handleSaved = (savedCategoria, isNew) => {
    refreshData();
    setSavedResult({ categoria: savedCategoria, isNew });
  };

  const resultModal = (
    <ActionResultModal
      open={!!savedResult}
      title={savedResult?.isNew ? '¡Categoría creada!' : '¡Categoría actualizada!'}
      subtitle={`"${savedResult?.categoria?.nombre}" guardada correctamente.`}
      onBackdropClick={() => { setSavedResult(null); setSelected(null); }}
      actions={[
        {
          label: 'Ver Categoría',
          variant: 'success',
          onClick: () => {
            const cat = savedResult.categoria;
            setSavedResult(null);
            setSelected({ categoria: cat, mode: 'view' });
          },
        },
        {
          label: 'Volver a Categorías',
          variant: 'outline',
          onClick: () => { setSavedResult(null); setSelected(null); },
        },
      ]}
    />
  );

  // ─── Detail view ─────────────────────────────────────────────────────────
  if (selected) {
    return (
      <>
        <CategoriaForm
          mode={selected.mode}
          categoria={selected.categoria}
          onSave={(cat) => handleSaved(cat, selected.mode === 'create')}
          onCancel={() => setSelected(null)}
          onModeChange={(newMode) => setSelected(prev => ({ ...prev, mode: newMode }))}
        />
        {resultModal}
      </>
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
    <>
    {resultModal}
    <div className="space-y-6 animate-in fade-in duration-500">
      <GenericListView
        title="Categorías de Dispositivos"
        icon={Tag}
        items={categorias}
        columns={columns}
        onNew={() => setSelected({ categoria: null, mode: 'create' })}
        onView={(cat) => setSelected({ categoria: cat, mode: 'view' })}
        onEdit={(cat) => setSelected({ categoria: cat, mode: 'edit' })}
        onDelete={handleDelete}
        newButtonLabel="Nueva Categoría"
        searchPlaceholder="Buscar por nombre o descripción..."
        filterFunction={filterFunction}
        emptyText="Sin categorías registradas"
        activeFiltersCount={(filters.fechaDesde ? 1 : 0) + (filters.fechaHasta ? 1 : 0)}
        onClearFilters={() => setFilters({ fechaDesde: '', fechaHasta: '' })}
        filteredCount={categorias.length}
        totalItems={allCategorias.length}
        extraFilters={
          <FilterBar filters={filterDefs} values={filters} onChange={setFilters} />
        }
      />
    </div>
    </>
  );
};

export default CategoriasPage;
