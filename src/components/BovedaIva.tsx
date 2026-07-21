/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Invoice, Expense, ProviderPayment, IvaWithdrawal } from '../types';
import { calculateIvaMetrics } from '../utils/iva';
import { formatCurrency, getMexicoCityDate } from '../utils';
import { 
  Vault, 
  ArrowUpRight, 
  TrendingDown, 
  History, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  HelpCircle,
  CheckCircle2,
  Calendar,
  X
} from 'lucide-react';

interface BovedaIvaProps {
  invoices: Invoice[];
  expenses: Expense[];
  providerPayments: ProviderPayment[];
  ivaWithdrawals: IvaWithdrawal[];
  onAddWithdrawal: (withdrawal: { concepto: string; monto: number; fecha: string }) => void;
  onDeleteWithdrawal: (id: string) => void;
}

export default function BovedaIva({
  invoices,
  expenses,
  providerPayments,
  ivaWithdrawals,
  onAddWithdrawal,
  onDeleteWithdrawal
}: BovedaIvaProps) {
  // 1. Calculate live IVA metrics
  const metrics = calculateIvaMetrics(invoices, expenses, providerPayments);
  
  // saldo_a_favor_actual = if esAPagar is true, it is 0. Otherwise, it is the result.
  const saldoAFavorActual = metrics.esAPagar ? 0 : metrics.montoResultante;

  // 2. Calculate total withdrawals
  const totalRetiros = ivaWithdrawals.reduce((sum, w) => sum + w.monto, 0);

  // 3. Calculate disponible = max(0, saldo_a_favor_actual - total_retiros)
  const disponible = Math.max(0, saldoAFavorActual - totalRetiros);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [concepto, setConcepto] = useState('');
  const [montoInput, setMontoInput] = useState('');
  const [fecha, setFecha] = useState(getMexicoCityDate());
  const [error, setError] = useState('');

  // Search/Filter for history
  const [searchTerm, setSearchTerm] = useState('');

  // Handle opening modal
  const handleOpenModal = () => {
    if (disponible <= 0) return;
    setConcepto('');
    setMontoInput('');
    setFecha(getMexicoCityDate());
    setError('');
    setIsModalOpen(true);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!concepto.trim()) {
      setError('El concepto es requerido.');
      return;
    }

    const monto = parseFloat(montoInput.replace(/[^0-9.]/g, ''));
    if (isNaN(monto) || monto <= 0) {
      setError('Por favor ingresa un monto válido mayor a 0.');
      return;
    }

    if (monto > disponible) {
      setError(`El monto excede el saldo disponible (${formatCurrency(disponible)}).`);
      return;
    }

    if (!fecha) {
      setError('La fecha es requerida.');
      return;
    }

    onAddWithdrawal({
      concepto: concepto.trim(),
      monto,
      fecha
    });

    setIsModalOpen(false);
  };

  // Format dynamic raw input as money during typing if possible, or just keep a standard input
  const handleMontoChange = (val: string) => {
    setError('');
    // Allow digits and single decimal point
    const clean = val.replace(/[^0-9.]/g, '');
    setMontoInput(clean);
  };

  const filteredWithdrawals = ivaWithdrawals.filter(w => 
    w.concepto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="boveda-iva-module-container" className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-enchanted-green dark:text-light-ivory tracking-tight">
            Bóveda de IVA
          </h2>
          <p className="text-xs text-rocky-gray mt-1">
            Gestión y conciliación de retiros contra el saldo a favor de IVA calculado en tiempo real.
          </p>
        </div>
        
        <div>
          {disponible <= 0 ? (
            <div className="flex items-center gap-2 p-2.5 bg-cranberry/10 border border-cranberry/20 rounded text-xs text-cranberry font-medium">
              <AlertTriangle size={15} />
              <span>No hay saldo a favor disponible actualmente, no se pueden registrar retiros.</span>
            </div>
          ) : (
            <button
              onClick={handleOpenModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-enchanted-green dark:bg-elevated-gold text-white dark:text-enchanted-green font-bold text-xs hover:bg-enchanted-green/90 dark:hover:bg-elevated-gold/90 rounded transition-colors shadow"
            >
              <Plus size={15} />
              <span>Registrar Retiro</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Card Principal: Disponible para Retirar */}
        <div 
          id="vault-disponible-card" 
          className={`p-6 rounded-xl border shadow-md flex flex-col justify-between space-y-4 transition-all ${
            disponible > 0 
              ? 'bg-enchanted-green/[0.02] border-enchanted-green/20 dark:border-elevated-gold/30' 
              : 'bg-cranberry/[0.01] border-cranberry/15'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest font-bold text-rocky-gray">Disponible para Retirar</p>
              <h3 className={`text-3xl font-mono font-bold ${
                disponible > 0 
                  ? 'text-enchanted-green dark:text-light-ivory' 
                  : 'text-rocky-gray'
              }`}>
                {formatCurrency(disponible)}
              </h3>
            </div>
            <div className={`p-3 rounded-lg ${
              disponible > 0 
                ? 'bg-enchanted-green/5 dark:bg-elevated-gold/10 text-enchanted-green dark:text-elevated-gold' 
                : 'bg-rocky-gray/5 text-rocky-gray'
            }`}>
              <Vault size={24} />
            </div>
          </div>
          <div className="text-[11px] text-black dark:text-light-ivory/70 leading-relaxed">
            Monto máximo que se puede retirar de la bóveda, calculado en vivo como <span className="italic">Saldo a Favor Actual</span> menos el <span className="italic">Total Retirado Históricamente</span>.
          </div>
        </div>

        {/* Card: Saldo a Favor Actual (Panel de IVA) */}
        <div id="vault-saldo-favor-card" className="bg-white dark:bg-[#051A14]/60 p-6 rounded-xl border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest font-bold text-rocky-gray">Saldo a Favor Actual (Panel de IVA)</p>
              <h3 className="text-2xl font-mono font-bold text-enchanted-green dark:text-light-ivory">
                {formatCurrency(saldoAFavorActual)}
              </h3>
            </div>
            <div className="p-3 bg-enchanted-green/5 dark:bg-white/5 rounded-lg text-enchanted-green dark:text-elevated-gold">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div className="text-[11px] text-black dark:text-light-ivory/70 leading-relaxed">
            Diferencia neta entre IVA Acreditable e IVA Trasladado obtenida directamente del Panel de IVA. Si el balance es a pagar, este valor se asume como $0.00.
          </div>
        </div>

        {/* Card: Total Retirado Históricamente */}
        <div id="vault-total-retirado-card" className="bg-white dark:bg-[#051A14]/60 p-6 rounded-xl border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest font-bold text-rocky-gray">Total Retirado Históricamente</p>
              <h3 className="text-2xl font-mono font-bold text-cranberry">
                {formatCurrency(totalRetiros)}
              </h3>
            </div>
            <div className="p-3 bg-cranberry/5 dark:bg-white/5 rounded-lg text-cranberry">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="text-[11px] text-black dark:text-light-ivory/70 leading-relaxed">
            Acumulado histórico de todos los retiros que se han registrado formalmente dentro de esta bóveda. No influye ni altera el cálculo directo del Panel de IVA.
          </div>
        </div>

      </div>

      {/* Historial de Retiros */}
      <div className="bg-white dark:bg-[#051A14]/20 border border-enchanted-green/10 dark:border-light-ivory/10 rounded-xl overflow-hidden shadow-sm flex flex-col">
        
        <div className="p-5 border-b border-enchanted-green/10 dark:border-light-ivory/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-enchanted-green/[0.01] dark:bg-white/[0.01]">
          <div>
            <h4 className="font-serif text-base font-bold text-enchanted-green dark:text-light-ivory flex items-center gap-2">
              <History size={16} className="text-elevated-gold" />
              <span>Historial de Retiros Registrados</span>
            </h4>
            <p className="text-[11px] text-rocky-gray mt-0.5">
              Registro secuencial de los fondos de IVA retirados por la dirección.
            </p>
          </div>
          
          <div className="relative max-w-xs w-full">
            <span className="absolute left-2.5 top-2 text-rocky-gray">
              <X size={14} className="opacity-0" />
            </span>
            <input
              type="text"
              placeholder="Buscar por concepto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 bg-light-ivory/30 dark:bg-[#070D0C]/40 border border-enchanted-green/15 dark:border-light-ivory/15 rounded text-xs text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold transition-colors font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          {filteredWithdrawals.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-enchanted-green/5 dark:bg-white/5 flex items-center justify-center mx-auto text-rocky-gray">
                <Vault size={18} />
              </div>
              <h5 className="font-serif text-xs font-semibold text-enchanted-green dark:text-light-ivory">Sin retiros registrados</h5>
              <p className="text-[11px] text-rocky-gray max-w-md mx-auto">
                {searchTerm ? 'No se encontraron retiros con ese término de búsqueda.' : 'Aún no se han registrado retiros del saldo a favor de IVA.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-enchanted-green/10 dark:border-light-ivory/10 bg-enchanted-green/[0.02] dark:bg-white/[0.02]">
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-enchanted-green/70 dark:text-light-ivory/70">Fecha</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-enchanted-green/70 dark:text-light-ivory/70">Concepto de Retiro</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-enchanted-green/70 dark:text-light-ivory/70 text-right">Monto de Retiro</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider text-enchanted-green/70 dark:text-light-ivory/70 text-center w-24">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-enchanted-green/5 dark:divide-white/5">
                {filteredWithdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-enchanted-green/[0.01] dark:hover:bg-white/[0.01] transition-colors">
                    <td className="px-5 py-3.5 font-mono text-rocky-gray whitespace-nowrap">
                      {withdrawal.fecha}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-enchanted-green dark:text-light-ivory">
                      {withdrawal.concepto}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-cranberry whitespace-nowrap">
                      {formatCurrency(withdrawal.monto)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => onDeleteWithdrawal(withdrawal.id)}
                        title="Eliminar registro"
                        className="p-1 text-rocky-gray hover:text-cranberry rounded hover:bg-cranberry/5 transition-colors inline-flex items-center justify-center"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-4 bg-enchanted-green/[0.01] dark:bg-white/[0.01] border-t border-enchanted-green/10 dark:border-light-ivory/10 text-right text-xs">
          Total de Retiros en Lista: <strong className="font-mono text-cranberry">{formatCurrency(filteredWithdrawals.reduce((sum, w) => sum + w.monto, 0))}</strong>
        </div>
      </div>

      {/* Modal de Registro de Retiro */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-light-ivory dark:bg-[#051A14] w-full max-w-md rounded-xl border border-enchanted-green/15 dark:border-[#8C7853]/30 shadow-2xl overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="px-5 py-4 bg-enchanted-green dark:bg-[#071310] border-b border-enchanted-green/10 dark:border-[#8C7853]/15 flex items-center justify-between">
              <h3 className="font-serif text-sm font-bold text-white dark:text-light-ivory flex items-center gap-2">
                <Vault size={16} className="text-elevated-gold" />
                <span>Registrar Retiro de IVA</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white dark:text-light-ivory/80 dark:hover:text-light-ivory p-1 hover:bg-white/10 dark:hover:bg-white/5 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 flex-1">
              
              {/* Info Banner */}
              <div className="p-3 bg-enchanted-green/5 dark:bg-white/5 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 flex items-start gap-2">
                <CheckCircle2 size={14} className="text-enchanted-green dark:text-elevated-gold mt-0.5 shrink-0" />
                <div className="text-[10px] text-rocky-gray leading-relaxed">
                  Estás retirando saldo a favor. Tu disponible actual es de <strong className="font-mono text-enchanted-green dark:text-light-ivory">{formatCurrency(disponible)}</strong>.
                </div>
              </div>

              {/* Concepto */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-enchanted-green/70 dark:text-light-ivory/70 mb-1">
                  Concepto del Retiro <span className="text-cranberry">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Transferencia de remanente a cuenta corriente"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  className="w-full px-3 py-2 bg-light-ivory/40 dark:bg-[#070D0C]/40 border border-enchanted-green/20 dark:border-light-ivory/20 rounded text-xs text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold transition-colors font-medium"
                />
              </div>

              {/* Monto & Fecha Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Monto */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-semibold text-enchanted-green/70 dark:text-light-ivory/70 mb-1">
                    Monto ($) <span className="text-cranberry">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="0.00"
                    value={montoInput}
                    onChange={(e) => handleMontoChange(e.target.value)}
                    className="w-full px-3 py-2 bg-light-ivory/40 dark:bg-[#070D0C]/40 border border-enchanted-green/20 dark:border-light-ivory/20 rounded text-xs text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold transition-colors font-mono font-bold"
                  />
                </div>

                {/* Fecha */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-semibold text-enchanted-green/70 dark:text-light-ivory/70 mb-1">
                    Fecha <span className="text-cranberry">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full px-3 py-2 bg-light-ivory/40 dark:bg-[#070D0C]/40 border border-enchanted-green/20 dark:border-light-ivory/20 rounded text-xs text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Errors Container */}
              {error && (
                <div className="p-3 bg-cranberry/10 border border-cranberry/20 text-cranberry rounded text-xs font-semibold flex items-start gap-2 animate-shake">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Footer Actions */}
              <div className="pt-3 border-t border-enchanted-green/5 dark:border-white/5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 border border-enchanted-green/20 dark:border-light-ivory/20 text-enchanted-green dark:text-light-ivory hover:bg-enchanted-green/5 dark:hover:bg-white/5 text-xs font-bold rounded transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-enchanted-green dark:bg-elevated-gold text-white dark:text-enchanted-green hover:bg-enchanted-green/90 dark:hover:bg-elevated-gold/90 text-xs font-bold rounded transition-colors shadow"
                >
                  Confirmar Retiro
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
