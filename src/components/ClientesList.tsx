import { useState } from 'react';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { Client } from '../types';
import PageHeader from './ui/PageHeader';
import Button from './ui/Button';
import IconButton from './ui/IconButton';
import SearchInput from './ui/SearchInput';
import DataCard from './ui/DataCard';

interface ClientesListProps {
  clients: Client[];
  loading?: boolean;
  onAddClick: () => void;
  onEditClick: (client: Client) => void;
  onDeleteClick: (id: string) => void;
}

const GRID_COLUMNS = 'grid gap-4 px-6';
const GRID_TEMPLATE = 'minmax(220px,2fr) minmax(220px,1.5fr) 180px minmax(180px,1.2fr) 140px';

export default function ClientesList({
  clients,
  loading,
  onAddClick,
  onEditClick,
  onDeleteClick
}: ClientesListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clients.filter(client =>
    client.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalClients = clients.length;
  const clientsWithRFC = clients.filter(c => !!c.rfc).length;
  const clientsWithContact = clients.filter(c => !!c.contacto).length;

  const subtitle = `${totalClients} ${totalClients === 1 ? 'cliente registrado' : 'clientes registrados'}. ${clientsWithRFC} con RFC vinculado${clientsWithContact > 0 ? ` · ${clientsWithContact} con contacto de enlace` : ''}.`;

  if (loading) {
    return (
      <div id="clientes-module-container" className="space-y-6">
        <PageHeader
          title="Clientes"
          subtitle={subtitle}
          action={
            <Button id="add-client-top-btn" variant="primary" icon={<Plus size={16} />} onClick={onAddClick}>
              Agregar cliente
            </Button>
          }
        />
        <DataCard id="clientes-table-wrapper">
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gold border-t-transparent" />
          </div>
        </DataCard>
      </div>
    );
  }

  return (
    <div id="clientes-module-container" className="space-y-6">
      <PageHeader
        title="Clientes"
        subtitle={subtitle}
        action={
          <Button id="add-client-top-btn" variant="primary" icon={<Plus size={16} />} onClick={onAddClick}>
            Agregar cliente
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar por nombre"
          ariaLabel="Buscar por nombre"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="h-11 px-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
          >
            Limpiar búsqueda
          </button>
        )}
      </div>

      <DataCard id="clientes-table-wrapper">
        {filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-ink/5 flex items-center justify-center text-ink-muted mb-4">
              <Users size={22} />
            </div>
            <h3 className="text-base font-semibold text-ink">
              {totalClients === 0 ? 'No hay clientes registrados' : 'No se encontraron clientes'}
            </h3>
            <p className="text-sm text-ink-muted mt-1 max-w-md">
              {totalClients === 0
                ? 'Presiona "Agregar cliente" para comenzar a construir tu catálogo.'
                : 'Prueba cambiando el término de búsqueda para ver más clientes.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div role="table" aria-label="Clientes" className="min-w-0" style={{ minWidth: '980px' }}>
                <div role="row" className={`${GRID_COLUMNS} border-b border-line py-3`} style={{ gridTemplateColumns: GRID_TEMPLATE }}>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Nombre comercial</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Razón social</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">RFC</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted">Contacto</div>
                  <div role="columnheader" className="text-[13px] font-medium text-ink-muted text-center">Acciones</div>
                </div>

                {filteredClients.map(client => (
                  <div
                    key={client.id}
                    role="row"
                    className={`${GRID_COLUMNS} items-start border-b border-line py-4 text-sm text-ink transition-colors hover:bg-ink/[0.03]`}
                    style={{ gridTemplateColumns: GRID_TEMPLATE }}
                  >
                    <div role="cell" className="min-w-0">
                      <p className="font-semibold text-ink truncate" title={client.nombre}>{client.nombre}</p>
                    </div>

                    <div role="cell" className="min-w-0">
                      <p className="text-ink truncate" title={client.razonSocial || ''}>
                        {client.razonSocial || <span className="text-ink-muted">No registrada</span>}
                      </p>
                    </div>

                    <div role="cell">
                      <p className="tabular-nums text-ink">{client.rfc || <span className="text-ink-muted">No registrado</span>}</p>
                    </div>

                    <div role="cell" className="min-w-0">
                      <p className="text-ink truncate" title={client.contacto || ''}>
                        {client.contacto || <span className="text-ink-muted">Sin contacto</span>}
                      </p>
                    </div>

                    <div role="cell" className="flex items-center justify-center gap-1 -my-2">
                      <IconButton
                        label="Editar cliente"
                        icon={<Pencil size={16} />}
                        onClick={() => onEditClick(client)}
                      />
                      <IconButton
                        label="Eliminar cliente"
                        tone="danger"
                        icon={<Trash2 size={16} />}
                        onClick={() => onDeleteClick(client.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="px-6 py-3 text-[13px] text-ink-muted">
              Mostrando {filteredClients.length} de {totalClients} clientes
            </p>
          </>
        )}
      </DataCard>
    </div>
  );
}
