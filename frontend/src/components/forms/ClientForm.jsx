import { Building2, Map, MapPin, Navigation2 } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import FileUploader from '../ui/FileUploader';
import Switch from '../ui/Switch';
import NitInput from '../ui/NitInput';
import SearchableSelect from '../ui/SearchableSelect';
import { useState } from 'react';
import { useLocationData } from '../../hooks/useLocationData';
import { Country as CscCountry, State as CscState } from 'country-state-city';

// Module-level — built once
const ALL_COUNTRIES = CscCountry.getAllCountries().map(c => ({
  value: c.isoCode,
  label: c.name,
  isoCode: c.isoCode,
}));

const FlagImg = ({ iso }) => iso ? (
  <img
    src={`https://flagcdn.com/w20/${iso.toLowerCase()}.png`}
    width="20" height="15" alt="" loading="lazy"
    className="rounded-sm object-cover"
  />
) : null;

const formatCountryOption = ({ label, isoCode }) => (
  <div className="flex items-center gap-2">
    <FlagImg iso={isoCode} />
    <span>{label}</span>
  </div>
);

const ClienteForm = ({ editingItem, isViewMode }) => {
  const [personType, setPersonType] = useState(editingItem?.tipoPersona || 'juridica');
  const [rutFile, setRutFile]       = useState(null);
  const [isActive, setIsActive]     = useState(editingItem ? editingItem.estado === 'activo' : true);
  const [nit, setNit]               = useState(editingItem?.nit?.split('-')[0] || '');
  const [dv, setDv]                 = useState(editingItem?.nit?.split('-')[1] || '');
  const [location, setLocation]     = useState({
    country: editingItem?.pais || 'CO',
    state:   editingItem?.estado_depto || '',
    city:    editingItem?.ciudad || '',
  });
  const [direccion, setDireccion]   = useState(editingItem?.direccion || '');

  const { states, cities, handleCountryChange, handleStateChange, handleCityChange } =
    useLocationData({ countryValue: location.country, stateValue: location.state, onLocationChange: setLocation });

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-5">

      {/* Row 1: Tipo de Persona | Razón Social */}
      <Select
        label="Tipo de Persona"
        name="tipoPersona"
        options={[
          { value: 'natural',  label: 'Persona Natural' },
          { value: 'juridica', label: 'Persona Jurídica' },
        ]}
        value={personType}
        onChange={(e) => setPersonType(e.target.value)}
        viewMode={isViewMode}
        icon={Building2}
      />

      <Input
        name="nombre"
        label={personType === 'juridica' ? 'Razón Social' : 'Nombre Completo'}
        icon={Building2}
        defaultValue={editingItem?.nombre}
        viewMode={isViewMode}
        required
        placeholder={personType === 'juridica' ? 'Ej: Empresa S.A.S' : 'Ej: Juan Pérez'}
      />

      {/* Row 2: NIT / RUT | Estado del Cliente */}
      <NitInput
        nitValue={nit}
        dvValue={dv}
        onNitChange={setNit}
        onDvChange={setDv}
        viewMode={isViewMode}
        required
      />
      <input type="hidden" name="nit_numero" value={nit} />
      <input type="hidden" name="dv" value={dv} />

      <Switch
        label="Estado del Cliente"
        checked={isActive}
        onChange={setIsActive}
        viewMode={isViewMode}
      />
      <input type="hidden" name="estado" value={isActive ? 'activo' : 'inactivo'} />

      {/* Row 3: País | Estado / Depto */}
      <SearchableSelect
        label="País"
        options={ALL_COUNTRIES}
        value={location.country}
        onChange={handleCountryChange}
        placeholder="Buscar país..."
        formatOptionLabel={formatCountryOption}
      />

      <SearchableSelect
        label="Estado / Depto"
        icon={Map}
        options={states}
        value={location.state}
        onChange={handleStateChange}
        isDisabled={!location.country}
        placeholder={location.country ? 'Buscar estado...' : 'Primero elige un país'}
      />
      <input type="hidden" name="pais" value={location.country} />
      <input type="hidden" name="estado_depto" value={location.state} />

      {/* Row 4: Ciudad | Dirección Física */}
      <SearchableSelect
        label="Ciudad"
        icon={MapPin}
        options={cities}
        value={location.city}
        onChange={handleCityChange}
        isDisabled={!location.state}
        placeholder={location.state ? 'Buscar ciudad...' : 'Primero elige un estado'}
      />
      <input type="hidden" name="ciudad" value={location.city} />

      <Input
        name="direccion"
        label="Dirección Física"
        icon={Navigation2}
        value={direccion}
        onChange={(e) => setDireccion(e.target.value)}
        viewMode={isViewMode}
        required
      />

      {/* Row 5: Soporte Legal — full width */}
      <div className="col-span-2">
        <FileUploader
          label="Soporte Legal (RUT)"
          type="rut"
          isLoaded={!!editingItem?.rutUrl || rutFile}
          viewMode={isViewMode}
          onLoad={() => setRutFile(true)}
        />
      </div>

    </div>
  );
};

export default ClienteForm;
