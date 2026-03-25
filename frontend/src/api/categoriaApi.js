import { supabase } from '../utils/supabase';

/**
 * Fetch all device categories with the count of their protocol steps.
 */
export const getCategorias = async () => {
  // Una sola query: incluye pasos activos embebidos para contar client-side.
  // Supabase no soporta filtrar el count embebido directamente, pero sí
  // traer los ids y contar en JS, evitando una segunda round-trip.
  const { data, error } = await supabase
    .from('categoria_dispositivo')
    .select('*, pasos:paso_protocolo(id)')
    .or('activo.eq.true,activo.is.null')
    .eq('paso_protocolo.activo', true)
    .order('nombre');

  if (error) throw error;

  return (data || []).map(cat => ({
    ...cat,
    numPasos: (cat.pasos || []).length,
    pasos: undefined, // limpiar el array embebido del objeto final
  }));
};

/**
 * Fetch the full protocol (steps and activities) for a specific category.
 */
export const getProtocoloByCategory = async (categoriaId) => {
  const { data, error } = await supabase
    .from('paso_protocolo')
    .select(`
      *,
      actividades:actividad_protocolo(*)
    `)
    .eq('categoria_id', categoriaId)
    .or('activo.eq.true,activo.is.null')
    .order('orden');

  if (error) throw error;
  
  // Sort and filter active activities within each step
  return data.map(paso => ({
    ...paso,
    actividades: (paso.actividades || [])
      .filter(a => a.activo !== false)
      .sort((a, b) => a.orden - b.orden)
      .map(a => ({
        ...a,
        esObligatorio: !!a.es_obligatorio // Map snake_case to camelCase for UI
      }))
  }));
};

/**
 * Transactional save for a category and its protocol.
 */
export const saveCategoria = async ({ categoriaId, draft, steps }) => {
  const isNew = !categoriaId || categoriaId.startsWith('cat-mock-');
  
  // 1. Save Category
  const catData = {
    nombre: draft.nombre,
    descripcion: draft.descripcion,
    activo: true,
    updated_at: new Date().toISOString()
  };

  let finalCatId = categoriaId;

  if (isNew) {
    const { data: newCat, error: catError } = await supabase
      .from('categoria_dispositivo')
      .insert([catData])
      .select()
      .single();
    if (catError) throw catError;
    finalCatId = newCat.id;
  } else {
    const { error: catError } = await supabase
      .from('categoria_dispositivo')
      .update(catData)
      .eq('id', categoriaId);
    if (catError) throw catError;
  }

  // 2. Process Protocol Steps
  for (const step of steps) {
    if (step.deleted && step.id) {
       // Soft delete activities and steps
       await supabase.from('actividad_protocolo').update({ activo: false }).eq('paso_id', step.id);
       await supabase.from('paso_protocolo').update({ activo: false }).eq('id', step.id);
       continue;
    }
    
    if (step.deleted) continue;

    const stepPayload = {
      categoria_id: finalCatId,
      descripcion: step.descripcion,
      orden: step.orden
      // es_obligatorio removed per user request
    };

    let stepId = step.id;

    if (!stepId || step.isNew) {
      const { data: newStep, error: stepErr } = await supabase
        .from('paso_protocolo')
        .insert([stepPayload])
        .select()
        .single();
      if (stepErr) throw stepErr;
      stepId = newStep.id;
    } else {
      const { error: stepErr } = await supabase
        .from('paso_protocolo')
        .update(stepPayload)
        .eq('id', stepId);
      if (stepErr) throw stepErr;
    }

    // 3. Process Activities for this Step
    for (const activity of (step.actividades || [])) {
      if (activity.deleted && activity.id) {
        // Soft delete activity
        await supabase.from('actividad_protocolo').update({ activo: false }).eq('id', activity.id);
        continue;
      }
      
      if (activity.deleted) continue;

      const actPayload = {
        paso_id: stepId,
        descripcion: activity.descripcion,
        orden: activity.orden,
        es_obligatorio: activity.esObligatorio // Fix: Mapping camelCase to snake_case
      };

      if (!activity.id || activity.isNew) {
        const { error: actErr } = await supabase
          .from('actividad_protocolo')
          .insert([actPayload]);
        if (actErr) throw actErr;
      } else {
        const { error: actErr } = await supabase
          .from('actividad_protocolo')
          .update(actPayload)
          .eq('id', activity.id);
        if (actErr) throw actErr;
      }
    }
  }

  return { categoriaId: finalCatId };
};

/**
 * Soft delete a category.
 */
export const deleteCategoria = async (id) => {
  const { error } = await supabase
    .from('categoria_dispositivo')
    .update({ activo: false })
    .eq('id', id);
  if (error) throw error;
};
