import React, { useState } from 'react';
import { useConfigurationContext } from '../../../context/ConfigurationContext';
import { useMasterData } from '../../../context/MasterDataContext';
import { useNotify } from '../../../context/NotificationContext';
import CategoriaForm from '../../../modules/devices/CategoriaForm';
import { supabase } from '../../../utils/supabase';

// Generic Navigator for Catalog Entities (Category, Brand, Provider)
const CatalogNavigator = () => {
  const { route, goBack, updateDraft } = useConfigurationContext();
  const { setData } = useMasterData();
  const notify = useNotify();
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');

  // Brand/Provider specific save
  const handleSimpleSave = async (table, val, extra = {}) => {
    if (!val.trim()) return;
    setIsSaving(true);
    try {
      const { data: row, error } = await supabase
        .from(table)
        .insert({ nombre: val.trim().toUpperCase(), ...extra })
        .select()
        .single();
      
      if (error) throw error;

      // Update Master Data
      if (table === 'proveedor') {
        setData(prev => ({ 
          ...prev, 
          proveedores: [...(prev.proveedores || []), row].sort((a,b) => a.nombre.localeCompare(b.nombre)) 
        }));
      } else if (table === 'marca') {
        setData(prev => ({ 
          ...prev, 
          marcas: [...(prev.marcas || []), row].sort((a,b) => a.nombre.localeCompare(b.nombre)) 
        }));
      }

      // Update Parent Draft
      if (route.originKey && route.originField) {
        updateDraft(route.originKey, { [route.originField]: row.id });
      }

      notify('success', 'Guardado correctamente');
      goBack();
    } catch (err) {
      console.error(`Error saving ${table}:`, err);
      notify('error', 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  if (route.type === 'categoria') {
    return (
      <CategoriaForm
        mode={route.mode || 'create'}
        onCancel={goBack}
        onSave={(saved) => {
          if (route.originKey && route.originField) {
            updateDraft(route.originKey, { [route.originField]: saved.id });
          }
          goBack();
        }}
      />
    );
  }

  // Simple Inline Forms for Brand and Provider
  if (route.type === 'marca' || route.type === 'proveedor') {
    const isMarca = route.type === 'marca';
    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
        <header className="flex items-center gap-4 bg-white p-4 rounded-md border border-gray-100 shadow-sm">
          <button onClick={goBack} className="p-2 bg-gray-50 hover:bg-[#D32F2F] hover:text-white rounded-md transition-all text-sm font-bold">
            ←
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">
              {isMarca ? 'Nueva Marca' : 'Nuevo Proveedor'}
            </h2>
            <p className="text-xs text-gray-500">Completa los datos básicos</p>
          </div>
        </header>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nombre</label>
            <input 
              autoFocus
              className="w-full h-11 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-[#D32F2F]/5 focus:border-[#D32F2F] text-sm font-semibold uppercase transition-all"
              placeholder={`Ej: ${isMarca ? 'GALAXY S24' : 'SAMSUNG'}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSimpleSave(isMarca ? 'marca' : 'proveedor', name, isMarca ? { proveedor_id: route.proveedorId } : {});
                }
              }}
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button 
              onClick={goBack}
              className="flex-1 h-11 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
              disabled={isSaving || !name.trim()}
              onClick={() => handleSimpleSave(isMarca ? 'marca' : 'proveedor', name, isMarca ? { proveedor_id: route.proveedorId } : {})}
              className="flex-1 h-11 rounded-lg bg-[#D32F2F] text-white text-sm font-bold hover:bg-[#B71C1C] disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
            >
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default CatalogNavigator;
