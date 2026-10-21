import { useState } from 'react';
import { Trash2, Check, Undo2, Pencil, CalendarCheck, X } from 'lucide-react';
import { AbonoProveedor } from '../types';
import { getMexicoCityDate, formatCurrency } from '../utils';

type ActionResult = Promise<{ success: boolean; error?: string }>;
type RowMode = 'idle' | 'confirmDelete' | 'marcarPagado' | 'confirmRevertir' | 'editarNota';

interface AbonoProveedorRowProps {
  abono: AbonoProveedor;
  readOnly: boolean;
  busy: boolean;
  tieneFactura: boolean;
  run: (abonoId: string, action: () => ActionResult) => Promise<boolean>;
  onDelete: (abonoId: string) => ActionResult;
  onToggleComplemento: (abonoId: string) => ActionResult;
  onMarcarPagado: (abonoId: string, fechaPago: string) => ActionResult;
  onRevertirPendiente: (abonoId: string) => ActionResult;
  onEditarNota: (abonoId: string, nota: string | null) => ActionResult;
}

const TIPO_STYLES: Record<AbonoProveedor['tipo'], string> = {
  Anticipo: 'bg-elevated-gold/15 text-[#8C7853] dark:text-elevated-gold border-elevated-gold/30',
  Parcialidad: 'bg-enchanted-green/10 text-enchanted-green dark:bg-white/10 dark:text-light-ivory border-enchanted-green/20 dark:border-white/15',
  Finiquito: 'bg-[#0B3D2E] text-light-ivory border-[#0B3D2E] dark:bg-elevated-gold dark:text-[#070D0C] dark:border-elevated-gold',
};

const ESTATUS_STYLES: Record<AbonoProveedor['estatus'], string> = {
  Pendiente: 'bg-elevated-gold/15 text-[#8C7853] dark:text-elevated-gold border-elevated-gold/40',
  Pagado: 'bg-enchanted-green/10 text-enchanted-green dark:bg-emerald-400/10 dark:text-emerald-300 border-enchanted-green/25 dark:border-emerald-300/30',
};

const smallBtn = 'px-2 py-0.5 rounded text-[10px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const ghostBtn = `${smallBtn} border border-rocky-gray/40 hover:bg-black/5 dark:hover:bg-white/5`;
const iconBtn = 'p-1 rounded transition-colors disabled:opacity-50';

export default function AbonoProveedorRow({
  abono,
  readOnly,
  busy,
  tieneFactura,
  run,
  onDelete,
  onToggleComplemento,
  onMarcarPagado,
  onRevertirPendiente,
  onEditarNota,
}: AbonoProveedorRowProps) {
  const [mode, setMode] = useState<RowMode>('idle');
  const [fecha, setFecha] = useState('');
  const [notaDraft, setNotaDraft] = useState('');
  const pagado = abono.estatus === 'Pagado';

  const act = async (action: () => ActionResult) => {
    if (await run(abono.id, action)) setMode('idle');
  };

  const openMarcarPagado = () => {
    setFecha(getMexicoCityDate());
    setMode('marcarPagado');
  };

  const openEditarNota = () => {
    setNotaDraft(abono.nota ?? '');
    setMode('editarNota');
  };

  const renderActions = () => {
    if (mode === 'confirmDelete') {
      return (
        <span className="inline-flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-cranberry">¿Borrar?</span>
          <button type="button" disabled={busy} onClick={() => act(() => onDelete(abono.id))} className={`${smallBtn} bg-cranberry text-white hover:bg-cranberry/90`}>
            {busy ? '…' : 'Sí'}
          </button>
          <button type="button" disabled={busy} onClick={() => setMode('idle')} className={ghostBtn}>No</button>
        </span>
      );
    }
    if (mode === 'confirmRevertir') {
      return (
        <span className="inline-flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-[#8C7853] dark:text-elevated-gold">¿Revertir a Pendiente?</span>
          <button type="button" disabled={busy} onClick={() => act(() => onRevertirPendiente(abono.id))} className={`${smallBtn} bg-elevated-gold text-[#070D0C] hover:bg-elevated-gold/90`}>
            {busy ? '…' : 'Sí'}
          </button>
          <button type="button" disabled={busy} onClick={() => setMode('idle')} className={ghostBtn}>No</button>
        </span>
      );
    }
    if (mode === 'marcarPagado') {
      return (
        <span className="inline-flex items-center gap-1.5">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            aria-label="Fecha de pago"
            className="px-2 py-0.5 bg-white dark:bg-[#070D0C] border border-enchanted-green/40 dark:border-light-ivory/30 rounded text-[11px] font-mono text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold [color-scheme:light] dark:[color-scheme:dark]"
          />
          <button
            type="button"
            disabled={busy || !fecha}
            onClick={() => act(() => onMarcarPagado(abono.id, fecha))}
            className={`${smallBtn} bg-enchanted-green text-light-ivory hover:bg-[#0B3D2E] dark:bg-elevated-gold dark:text-[#070D0C] dark:hover:bg-elevated-gold/90`}
          >
            {busy ? '…' : 'Confirmar'}
          </button>
          <button type="button" disabled={busy} onClick={() => setMode('idle')} className={ghostBtn}>Cancelar</button>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1">
        {pagado ? (
          <button
            type="button"
            onClick={() => setMode('confirmRevertir')}
            title="Revertir a Pendiente"
            className={`${iconBtn} text-[#8C7853] dark:text-elevated-gold hover:bg-elevated-gold/15`}
          >
            <Undo2 size={14} />
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={openMarcarPagado}
              className={`${smallBtn} inline-flex items-center gap-1 bg-enchanted-green/10 text-enchanted-green hover:bg-enchanted-green/20 dark:bg-elevated-gold/15 dark:text-elevated-gold dark:hover:bg-elevated-gold/25`}
            >
              <CalendarCheck size={12} />
              Marcar pagado
            </button>
            <button
              type="button"
              onClick={() => setMode('confirmDelete')}
              title="Borrar abono"
              className={`${iconBtn} text-cranberry/80 hover:text-cranberry hover:bg-cranberry/10`}
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </span>
    );
  };

  return (
    <tr className="text-enchanted-green dark:text-light-ivory align-top">
      <td className="px-3 py-2">
        <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-bold ${TIPO_STYLES[abono.tipo]}`}>
          {abono.tipo}
        </span>
      </td>
      <td className="px-3 py-2">
        <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-bold ${ESTATUS_STYLES[abono.estatus]}`}>
          {abono.estatus}
        </span>
      </td>
      <td className="px-3 py-2 font-mono whitespace-nowrap">
        {abono.fechaPago ?? <span className="text-rocky-gray dark:text-light-ivory/50">—</span>}
      </td>
      <td className="px-3 py-2 font-mono text-right whitespace-nowrap font-bold">{formatCurrency(abono.monto)}</td>
      <td className="px-3 py-2 font-mono text-right whitespace-nowrap">{formatCurrency(abono.iva)}</td>
      <td className="px-3 py-2">
        {pagado ? (
          <>
            <button
              type="button"
              role="switch"
              aria-checked={abono.complementoEmitido}
              disabled={readOnly || busy}
              onClick={() => act(() => onToggleComplemento(abono.id))}
              className="flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className={`relative inline-flex h-4 w-7 rounded-full transition-colors ${abono.complementoEmitido ? 'bg-enchanted-green dark:bg-elevated-gold' : 'bg-rocky-gray/40'}`}>
                <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${abono.complementoEmitido ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
              </span>
              <span className="text-[10px] font-bold">{abono.complementoEmitido ? 'Sí' : 'No'}</span>
            </button>
            {tieneFactura && !abono.complementoEmitido && (
              <p className="mt-1 text-[9px] leading-snug text-rocky-gray dark:text-light-ivory/70 max-w-[140px]">
                Su IVA cuenta hasta marcar el complemento.
              </p>
            )}
          </>
        ) : (
          <span className="text-[10px] text-rocky-gray dark:text-light-ivory/60">Hasta que se pague</span>
        )}
      </td>
      <td className="px-3 py-2 max-w-[200px]">
        {mode === 'editarNota' ? (
          <span className="flex items-center gap-1">
            <input
              type="text"
              value={notaDraft}
              onChange={(e) => setNotaDraft(e.target.value)}
              autoFocus
              aria-label="Nota del abono"
              className="w-full min-w-[110px] px-2 py-0.5 bg-white dark:bg-[#070D0C] border border-enchanted-green/40 dark:border-light-ivory/30 rounded text-[11px] text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => act(() => onEditarNota(abono.id, notaDraft.trim() || null))}
              title="Guardar nota"
              className={`${iconBtn} text-enchanted-green dark:text-elevated-gold hover:bg-enchanted-green/10 dark:hover:bg-elevated-gold/15`}
            >
              <Check size={14} />
            </button>
            <button type="button" disabled={busy} onClick={() => setMode('idle')} title="Cancelar" className={`${iconBtn} text-rocky-gray hover:bg-black/5 dark:text-light-ivory/60 dark:hover:bg-white/5`}><X size={14} /></button>
          </span>
        ) : (
          <span className="group flex items-start gap-1">
            <span className="truncate text-rocky-gray dark:text-light-ivory/70" title={abono.nota ?? ''}>
              {abono.nota || '—'}
            </span>
            {!readOnly && (
              <button
                type="button"
                onClick={openEditarNota}
                title="Editar nota"
                className={`${iconBtn} shrink-0 text-rocky-gray/70 hover:text-enchanted-green dark:text-light-ivory/50 dark:hover:text-elevated-gold opacity-60 group-hover:opacity-100`}
              >
                <Pencil size={12} />
              </button>
            )}
          </span>
        )}
      </td>
      {!readOnly && <td className="px-3 py-2 text-right whitespace-nowrap">{renderActions()}</td>}
    </tr>
  );
}
