import React, { useState, useMemo } from 'react';
import { Plus, Eye, Edit2, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { Table, THead, TBody, Tr, Th, Td } from '../ui/Table';
import { Subtitle, TextSmall, TextTiny } from '../ui/Typography';
import ModuleHeader from '../ui/ModuleHeader';

/**
 * @param {string}   title             - Título de la página
 * @param {React.ReactNode} icon       - Ícono Lucide del módulo
 * @param {Array}    items             - Array de datos
 * @param {Array}    columns           - Definición de columnas: [{ header, render, narrow, align, mobileLabel }]
 * @param {function} onNew             - Handler del botón "Nuevo"
 * @param {function} onView            - Handler del botón "Ver"
 * @param {function} onEdit            - Handler del botón "Editar"
 * @param {function} onDelete          - Handler del botón "Eliminar"
 * @param {string}   newButtonLabel    - Texto del botón "Nuevo"
 * @param {string}   searchPlaceholder - Placeholder del buscador
 * @param {function} filterFunction    - Función de filtrado (item, query) => bool
 * @param {React.ReactNode} emptyIcon  - Ícono del estado vacío
 * @param {string}   emptyText         - Texto del estado vacío
 * @param {boolean}  loading           - Muestra estado de carga
 * @param {string}   loadingText       - Texto mientras carga
 * @param {function} renderMobileCard  - (item) => JSX — card mobile personalizada.
 *                                       Si se omite, se auto-genera desde `columns`.
 */
const GenericListView = ({
  title,
  icon: Icon,
  items = [],
  columns = [],
  onNew,
  onView,
  onEdit,
  onDelete,
  rowActions,
  newButtonLabel = "Nuevo Registro",
  searchPlaceholder = "Buscar...",
  filterFunction,
  emptyIcon: EmptyIcon = Icon,
  emptyText = "No se encontraron registros",
  extraFilters,
  loading = false,
  loadingText = "Cargando...",
  renderMobileCard,
  filteredCount,
  totalItems,
  activeFiltersCount = 0,
  onClearFilters,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(100);

  const filteredItems = useMemo(() => {
    let result = [...items];
    if (searchQuery && filterFunction) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => filterFunction(item, q));
    }
    return result;
  }, [items, searchQuery, filterFunction]);

  const totalPages = Math.ceil(filteredItems.length / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  const hasActions = rowActions || onView || onEdit || onDelete;

  return (
    <div className="space-y-4 -mt-2">
      <ModuleHeader
        title={title}
        icon={Icon}
        onNewClick={onNew}
        newButtonLabel={newButtonLabel}
        filterContent={
          <div className="space-y-2">
            {/* Grid unificado: buscador (leadingSlot) + todos los filtros extra en un solo contenedor */}
            {extraFilters
              ? React.cloneElement(extraFilters, {
                  leadingSlot: (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-2xs font-semibold uppercase tracking-wider text-gray-500 leading-none px-0.5">
                        Buscar
                      </span>
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                          type="text"
                          placeholder={searchPlaceholder}
                          value={searchQuery}
                          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                          className="w-full h-10 pl-9 pr-3 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-gray-700 placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                  ),
                })
              : (
                <div className="grid gap-x-2 gap-y-3 items-end" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-2xs font-semibold uppercase tracking-wider text-gray-500 leading-none px-0.5">
                      Buscar
                    </span>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="w-full h-10 pl-9 pr-3 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-gray-700 placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                </div>
              )
            }
            {/* Footer: contador + limpiar — solo cuando hay filtros activos */}
            {activeFiltersCount > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  {filteredCount ?? '?'} de {totalItems ?? '?'} registros
                </span>
                {onClearFilters && (
                  <button
                    type="button"
                    onClick={onClearFilters}
                    className="text-xs text-brand underline underline-offset-2 hover:text-brand-dark transition-colors"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            )}
          </div>
        }
      />

      {/* Pagination Controls */}
      {filteredItems.length > 0 && (
        <div className="flex items-center justify-between pt-2 pb-2 border-t border-gray-200">
          <div className="flex items-center gap-1.5">
            <TextSmall className="text-gray-600 text-2xs">Mostrar</TextSmall>
            <Select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              options={[
                { value: 5,   label: '5 Entradas'   },
                { value: 10,  label: '10 Entradas'  },
                { value: 25,  label: '25 Entradas'  },
                { value: 50,  label: '50 Entradas'  },
                { value: 100, label: '100 Entradas' },
              ]}
              className="w-24 h-8 text-xs"
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
            >
              <ChevronLeft size={14} />
            </button>
            <TextSmall className="px-2 text-gray-600 font-medium">
              Página {currentPage} de {totalPages}
            </TextSmall>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <Card className="p-12 text-center">
          <TextSmall className="text-gray-400">{loadingText}</TextSmall>
        </Card>

      /* Empty state */
      ) : filteredItems.length === 0 ? (
        <Card className="p-12 text-center">
          {EmptyIcon && <EmptyIcon size={48} className="mx-auto mb-4 text-gray-300" />}
          <Subtitle className="text-gray-500 mb-2">{emptyText}</Subtitle>
          <TextSmall className="text-gray-400">
            {searchQuery ? 'Intenta con otros términos de búsqueda' : 'No hay registros para mostrar'}
          </TextSmall>
        </Card>

      ) : (
        <>
          {/* ── Desktop: tabla (oculta en mobile) ── */}
          <Card className="hidden md:block p-0 overflow-hidden rounded-md border border-gray-200 shadow-sm">
            <Table>
              <THead variant="light">
                <tr>
                  {columns.map((col, i) => (
                    <Th key={i} narrow={col.narrow} className={col.align === 'right' ? 'text-right' : ''}>
                      {col.header}
                    </Th>
                  ))}
                  {hasActions && <Th narrow className="text-right">Acciones</Th>}
                </tr>
              </THead>
              <TBody>
                {paginatedItems.map((item, rowIdx) => (
                  <Tr key={item.id || rowIdx} className="hover:bg-gray-50">
                    {columns.map((col, colIdx) => (
                      <Td key={colIdx} align={col.align}>
                        {col.render(item)}
                      </Td>
                    ))}
                    {hasActions && (
                      <Td align="right">
                        <div className="flex items-center justify-end gap-2">
                          {rowActions ? rowActions(item) : (
                            <>
                              {onView && (
                                <button onClick={() => onView(item)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors" title="Ver detalles">
                                  <Eye size={16} />
                                </button>
                              )}
                              {onEdit && (
                                <button onClick={() => onEdit(item)} className="p-1.5 rounded hover:bg-green-50 text-green-600 hover:text-green-700 transition-colors" title="Editar">
                                  <Edit2 size={16} />
                                </button>
                              )}
                              {onDelete && (
                                <button onClick={() => onDelete(item)} className="p-1.5 rounded hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors" title="Eliminar">
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </Td>
                    )}
                  </Tr>
                ))}
              </TBody>
            </Table>
          </Card>

          {/* ── Mobile: cards (oculto en md+) ── */}
          <div className="flex flex-col gap-4 md:hidden">
            {paginatedItems.map((item, rowIdx) => (
              // Si el caller provee renderMobileCard, se usa; si no, auto-generamos desde columns
              renderMobileCard ? (
                <React.Fragment key={item.id || rowIdx}>
                  {renderMobileCard(item)}
                </React.Fragment>
              ) : (
                <Card key={item.id || rowIdx} className="p-5 border border-gray-200 shadow-sm rounded-2xl">
                  <div className="divide-y divide-gray-50">
                    {columns.map((col, colIdx) => (
                      <div key={colIdx} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                        {col.mobileLabel !== false && (
                          <TextTiny className="text-gray-400 shrink-0 pt-0.5 w-28 font-bold uppercase tracking-wide leading-tight">
                            {col.mobileLabel || col.header}
                          </TextTiny>
                        )}
                        <div className="flex-1 min-w-0">{col.render(item)}</div>
                      </div>
                    ))}
                  </div>
                  {hasActions && (
                    <div className="flex items-center gap-2 pt-4 mt-3 border-t border-gray-100">
                      {onView && (
                        <button onClick={() => onView(item)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-xs font-semibold">
                          <Eye size={14} /> Ver
                        </button>
                      )}
                      {onEdit && (
                        <button onClick={() => onEdit(item)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-xs font-semibold">
                          <Edit2 size={14} /> Editar
                        </button>
                      )}
                      {onDelete && (
                        <button onClick={() => onDelete(item)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors text-xs font-semibold">
                          <Trash2 size={14} /> Eliminar
                        </button>
                      )}
                    </div>
                  )}
                </Card>
              )
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default GenericListView;
