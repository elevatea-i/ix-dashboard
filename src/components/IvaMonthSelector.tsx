import React from 'react';
import { formatPeriodo } from '../utils/iva';

interface IvaMonthSelectorProps {
  mesesDisponibles: string[];
  periodoSeleccionado: string;
  onChange: (periodo: string) => void;
}

export default function IvaMonthSelector({
  mesesDisponibles,
  periodoSeleccionado,
  onChange,
}: IvaMonthSelectorProps) {
  if (mesesDisponibles.length === 0) {
    return (
      <p className="text-xs text-rocky-gray italic">
        No hay meses con registros de pago disponibles.
      </p>
    );
  }

  return (
    <select
      value={periodoSeleccionado}
      onChange={(e) => onChange(e.target.value)}
      className="pl-3 pr-2 py-1.5 bg-white dark:bg-[#051A14]/60 border border-enchanted-green/20 dark:border-light-ivory/15 rounded text-xs font-semibold text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold transition-colors cursor-pointer"
    >
      {mesesDisponibles.map((m) => (
        <option key={m} value={m}>
          {formatPeriodo(m)}
        </option>
      ))}
    </select>
  );
}
