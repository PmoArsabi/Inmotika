import React from 'react';
import { Hash, IdCard, ShieldCheck, FileText } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Card from '../../../components/ui/Card';
import DocumentUploadManager from '../../../components/ui/DocumentUploadManager';
import { H2, Label, TextTiny } from '../../../components/ui/Typography';
import PersonalInfoSection from '../../../components/shared/PersonalInfoSection';
import { useCatalog, useEstados } from '../../../hooks/useCatalog';

const TechnicianForm = ({
  draft,
  updateDraft,
  errors = {},
  showErrors = false,
  isEditing = false,
  onSave,
  isSaving = false,
}) => {
  const { options: tipoDocOptions, loading: loadingTipoDoc } = useCatalog('TIPO_DOCUMENTO');
  const { options: estadoOptions, loading: loadingEstados } = useEstados();

  const tecnicoId = draft.id || '';

  const tipoDocSelectOptions = loadingTipoDoc
    ? [{ value: '', label: 'Cargando...' }]
    : [{ value: '', label: 'Seleccionar tipo...' }, ...tipoDocOptions];

  const estadoSelectOptions = loadingEstados
    ? [{ value: '', label: 'Cargando...' }]
    : [{ value: '', label: 'Seleccionar estado...' }, ...estadoOptions];

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <H2 className="text-gray-900 normal-case">
          {isEditing ? 'EDITAR TÉCNICO' : `VER TÉCNICO — ${(draft.nombres || '') + ' ' + (draft.apellidos || '') || 'NUEVO'}`}
        </H2>
        {isEditing && (
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="bg-linear-to-r from-[#D32F2F] to-[#8B0000] hover:from-[#B71C1C] hover:to-[#8B0000] text-white border-0"
          >
            {isSaving ? 'Guardando...' : 'Guardar Técnico'}
          </Button>
        )}
      </div>

      {/* 1. Información Personal */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <Label className="text-[11px] text-gray-700 tracking-wide font-bold">1. INFORMACIÓN PERSONAL</Label>
          <TextTiny className="text-gray-400">Datos básicos del usuario</TextTiny>
        </div>
        <PersonalInfoSection
          draft={draft}
          updateDraft={updateDraft}
          errors={errors}
          showErrors={showErrors}
          isEditing={isEditing}
          emailReadOnly={true}
          avatarBucket="inmotika"
          avatarPath={tecnicoId ? `usuarios/${tecnicoId}/avatar.jpg` : undefined}
        />
      </Card>

      {/* 2. Identificación */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <IdCard size={16} className="text-gray-500" />
          <Label className="text-[11px] text-gray-700 tracking-wide font-bold">2. IDENTIFICACIÓN</Label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Tipo de Documento"
            value={draft.tipoDocumento || ''}
            onChange={e => updateDraft({ tipoDocumento: e.target.value })}
            options={tipoDocSelectOptions}
            viewMode={!isEditing}
            icon={IdCard}
            error={showErrors ? errors.tipoDocumento : null}
          />
          <Input
            label="Número de Documento"
            value={draft.identificacion || ''}
            onChange={e => updateDraft({ identificacion: e.target.value.toUpperCase() })}
            error={showErrors ? errors.identificacion : null}
            viewMode={!isEditing}
            icon={Hash}
            uppercase
            required
          />
        </div>
      </Card>

      {/* 3. Estado */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <ShieldCheck size={16} className="text-gray-500" />
          <Label className="text-[11px] text-gray-700 tracking-wide font-bold">3. ESTADO</Label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Estado del Técnico"
            value={draft.estadoId || ''}
            onChange={e => updateDraft({ estadoId: e.target.value })}
            options={estadoSelectOptions}
            viewMode={!isEditing}
            required
            error={showErrors ? errors.estadoId : null}
          />
        </div>
      </Card>

      {/* 4. Documentos */}
      {tecnicoId && draft.usuarioId && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <FileText size={16} className="text-gray-500" />
            <Label className="text-[11px] text-gray-700 tracking-wide font-bold">4. DOCUMENTOS</Label>
          </div>
          <DocumentUploadManager
            usuarioId={draft.usuarioId}
            canManage={isEditing}
          />
        </Card>
      )}
    </div>
  );
};

export default TechnicianForm;
