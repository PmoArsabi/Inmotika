import React, { useState } from 'react';
import { Hash, IdCard, ShieldCheck, FileText, Plus, Trash2 } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import FileUploader from '../../../components/ui/FileUploader';
import Card from '../../../components/ui/Card';
import { H2, Label, TextSmall, TextTiny, Subtitle } from '../../../components/ui/Typography';
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

  const [newCertNombre, setNewCertNombre] = useState('');
  const [showCertInput, setShowCertInput] = useState(false);

  const tecnicoId = draft.id || '';

  const addCertificado = () => {
    if (!newCertNombre.trim()) return;
    const newCert = { id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(), nombre: newCertNombre.trim().toUpperCase(), url: '' };
    updateDraft({ certificados: [...(draft.certificados || []), newCert] });
    setNewCertNombre('');
    setShowCertInput(false);
  };

  const removeCertificado = (id) => {
    updateDraft({ certificados: (draft.certificados || []).filter(c => c.id !== id) });
  };

  const updateCertUrl = (id, url) => {
    updateDraft({
      certificados: (draft.certificados || []).map(c => c.id === id ? { ...c, url } : c),
    });
  };

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

      {/* 4. Documentos Legales */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <FileText size={16} className="text-gray-500" />
          <Label className="text-[11px] text-gray-700 tracking-wide font-bold">4. DOCUMENTOS LEGALES</Label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FileUploader
            label="Cédula / Documento de Identidad"
            bucket="inmotika"
            storagePath={tecnicoId ? `tecnicos/${tecnicoId}/cedula.pdf` : undefined}
            value={draft.documentoCedulaUrl || ''}
            onChange={path => updateDraft({ documentoCedulaUrl: path })}
            accept="application/pdf,image/*"
            viewMode={!isEditing}
          />
          <FileUploader
            label="Planilla Seguridad Social"
            bucket="inmotika"
            storagePath={tecnicoId ? `tecnicos/${tecnicoId}/planilla_seg_social.pdf` : undefined}
            value={draft.planillaSegSocialUrl || ''}
            onChange={path => updateDraft({ planillaSegSocialUrl: path })}
            accept="application/pdf"
            viewMode={!isEditing}
          />
        </div>
      </Card>

      {/* 5. Certificados */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-gray-500" />
            <Label className="text-[11px] text-gray-700 tracking-wide font-bold">5. CERTIFICADOS</Label>
          </div>
          {isEditing && (
            <button
              type="button"
              onClick={() => setShowCertInput(true)}
              className="flex items-center gap-1 text-xs text-[#D32F2F] hover:text-[#B71C1C] font-semibold transition-colors"
            >
              <Plus size={14} />
              Agregar
            </button>
          )}
        </div>

        {/* Input nueva certificación */}
        {showCertInput && isEditing && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border border-gray-200">
            <Input
              placeholder="Nombre del certificado (ej: CERTIFICACIÓN TÉCNICA HIKVISION)"
              value={newCertNombre}
              onChange={e => setNewCertNombre(e.target.value.toUpperCase())}
              uppercase
              className="flex-1"
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); addCertificado(); }
                if (e.key === 'Escape') { setShowCertInput(false); setNewCertNombre(''); }
              }}
              autoFocus
            />
            <Button onClick={addCertificado} disabled={!newCertNombre.trim()} className="shrink-0 px-3">
              <Plus size={14} />
            </Button>
            <Button
              onClick={() => { setShowCertInput(false); setNewCertNombre(''); }}
              className="shrink-0 px-3 bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
            >
              Cancelar
            </Button>
          </div>
        )}

        {/* Lista de certificados */}
        {(draft.certificados || []).length === 0 && !showCertInput ? (
          <div className="p-6 border border-dashed border-gray-200 rounded-lg text-center">
            <TextSmall className="text-gray-400 italic">Sin certificados registrados</TextSmall>
          </div>
        ) : (
          <div className="space-y-3">
            {(draft.certificados || []).map((cert) => (
              <div key={cert.id} className="p-3 bg-white border border-gray-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Subtitle className="text-gray-800 normal-case text-sm font-semibold flex-1">{cert.nombre}</Subtitle>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => removeCertificado(cert.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <FileUploader
                  bucket="inmotika"
                  storagePath={tecnicoId ? `tecnicos/${tecnicoId}/certificados/${cert.id}.pdf` : undefined}
                  value={cert.url || ''}
                  onChange={path => updateCertUrl(cert.id, path)}
                  accept="application/pdf,image/*"
                  viewMode={!isEditing}
                />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default TechnicianForm;
