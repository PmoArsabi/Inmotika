import DynamicDocumentList from '../../../components/ui/DynamicDocumentList';

const CertificadosList = ({ userId, items = [], viewMode = false, onChange }) => {
  return (
    <DynamicDocumentList
      title="Certificados Adicionales"
      addButtonLabel="Agregar"
      items={items}
      onChange={onChange}
      viewMode={viewMode}
      storagePathPrefix={userId ? `tecnicos/${userId}/certificados` : null}
      itemPlaceholder="Nombre (ej: Alturas)"
    />
  );
};

export default CertificadosList;
