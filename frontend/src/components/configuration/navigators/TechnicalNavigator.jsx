import React, { useState } from 'react';
import TechnicianForm from '../../../modules/users/components/TechnicianForm';
import { useConfigurationContext } from '../../../context/ConfigurationContext';
import { useMasterData } from '../../../context/MasterDataContext';
import { emptyTecnicoDraft, applyTecnicoUpsert } from '../../../utils/entityMappers';
import { validateTecnico } from '../../../utils/validators';
import { useNotify } from '../../../context/NotificationContext';
import { supabase } from '../../../utils/supabase';
import { uploadAndSyncFile } from '../../../utils/storageUtils';

const TechnicalNavigator = () => {
  const { route, drafts, updateDraft, setStack } = useConfigurationContext();
  const { data, setData } = useMasterData();
  const notify = useNotify();
  const [showErrors, setShowErrors] = useState(false);
  const [saveState, setSaveState] = useState({ isSaving: false, savedAt: null });

  const compareIds = (a, b) => String(a) === String(b);

  const entityKey = (type, id) => `${type}:${id}`;
  const key = entityKey('tecnico', route.clientId); // using clientId as ID prop for now as in original
  
  const draft = drafts[key] || emptyTecnicoDraft();
  const errors = validateTecnico(draft);
  const hasErrors = Object.keys(errors).length > 0;
  const isEditing = route.mode === 'edit';

  const handleSave = async () => {
    setShowErrors(true);
    if (hasErrors) return;

    // Validate certificates have names
    for (const cert of (draft.certificados || [])) {
      if (!cert.nombre?.trim()) {
        notify('error', `El certificado con ID ${cert.id} no tiene nombre.`);
        return;
      }
    }

    setSaveState({ isSaving: true, savedAt: null });
    
    // For technicians, route.clientId might be the User ID or the Technician ID.
    // We should rely on the techId we found or the one in the draft.
    let { id: techId, usuarioId } = draft;
    
    try {
      // 1. Update perfil_usuario (mandatory for técnico FK)
      if (usuarioId) {
        const { error: perfilErr } = await supabase
          .from('perfil_usuario')
          .update({
            nombres: draft.nombres,
            apellidos: draft.apellidos,
            telefono: draft.telefono,
            avatar_url: draft.avatarUrl,
            estado_id: draft.estadoId,
            tipo_documento: draft.tipoDocumento,
            identificacion: draft.identificacion
          })
          .eq('id', usuarioId);
        if (perfilErr) throw perfilErr;
      }

      // 2. Ensure tecnico record exists
      // If we don't have a techId yet, it's a new technician for an existing user.
      if (!techId) {
        // Try to find it by usuarioId first
        const { data: existingTech } = await supabase.from('tecnico').select('id').eq('usuario_id', usuarioId).maybeSingle();
        techId = existingTech?.id;
      }

      if (!techId) {
        // Create it
        const { data: nT, error: insErr } = await supabase
          .from('tecnico')
          .insert({ usuario_id: usuarioId })
          .select('id')
          .single();
        if (insErr) throw insErr;
        techId = nT?.id;
      } else {
        // Just update the user association to be sure
        await supabase.from('tecnico').update({ usuario_id: usuarioId }).eq('id', techId);
      }

      // 3. Upload & Sync Files using reusable utility
      const finalCedulaUrl = await uploadAndSyncFile({
        file: draft.documentoCedulaUrl,
        fileName: 'cedula.pdf',
        storageFolder: `tecnicos/${techId}`,
        dbTarget: { table: 'tecnico', id: techId, column: 'documento_cedula_url' }
      });

      const finalPlanillaUrl = await uploadAndSyncFile({
        file: draft.planillaSegSocialUrl,
        fileName: 'planilla_seg_social.pdf',
        storageFolder: `tecnicos/${techId}`,
        dbTarget: { table: 'tecnico', id: techId, column: 'planilla_seg_social_url' }
      });

      // 4. Sync tecnico_certificado
      const updatedCertificados = [];
      for (const cert of (draft.certificados || [])) {
        // First upsert the record (ensure it exists)
        const isNewId = String(cert.id).length < 20;
        const { data: certRec, error: certErr } = await supabase
          .from('tecnico_certificado')
          .upsert({
            id: isNewId ? undefined : cert.id,
            tecnico_id: techId,
            nombre: cert.nombre,
            activo: true
          })
          .select()
          .single();
        
        if (certErr) throw certErr;

        // Then upload & sync the file to that specific record
        const finalCertUrl = await uploadAndSyncFile({
          file: cert.url,
          fileName: `${certRec.id}.pdf`,
          storageFolder: `tecnicos/${techId}/certificados`,
          dbTarget: { table: 'tecnico_certificado', id: certRec.id, column: 'url' }
        });

        updatedCertificados.push({ ...cert, id: certRec.id, url: finalCertUrl });
      }

      // Deactivate certs not in the new list
      const currentCertIds = updatedCertificados.map(c => c.id);
      if (currentCertIds.length > 0) {
        await supabase
          .from('tecnico_certificado')
          .update({ activo: false })
          .eq('tecnico_id', techId)
          .not('id', 'in', `(${currentCertIds.map(id => `'${id}'`).join(',')})`);
      } else {
        // If no certificates are present, deactivate all for this tecnico
        await supabase
          .from('tecnico_certificado')
          .update({ activo: false })
          .eq('tecnico_id', techId);
      }

      // Update local state and finalize
      const finalDraft = { 
        ...draft, 
        id: techId,
        documentoCedulaUrl: finalCedulaUrl, 
        planillaSegSocialUrl: finalPlanillaUrl,
        certificados: updatedCertificados 
      };

      setData(prev => applyTecnicoUpsert(prev, techId, finalDraft));
      setSaveState({ isSaving: false, savedAt: Date.now() });
      setStack(prev => prev.map((s, idx) => idx === prev.length - 1 ? { ...s, mode: 'view' } : s));
      notify('success', 'Técnico guardado con éxito');
    } catch (err) {
      console.error('Error saving tecnico:', err);
      notify('error', 'Error al guardar el técnico');
      setSaveState({ isSaving: false, savedAt: null });
    }
  };

  return (
    <TechnicianForm
      draft={draft}
      updateDraft={(patch) => updateDraft(key, patch)}
      errors={errors}
      showErrors={showErrors}
      isEditing={isEditing}
      onSave={handleSave}
      isSaving={saveState.isSaving}
    />
  );
};

export default TechnicalNavigator;
