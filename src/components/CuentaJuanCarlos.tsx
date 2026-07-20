/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Invoice, Expense, Project } from '../types';
import { formatCurrency } from '../utils';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ArrowRightLeft,
  Search,
  Receipt,
  FileCheck2,
  CalendarCheck2,
  AlertCircle,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';

interface CuentaJuanCarlosProps {
  invoices: Invoice[];
  expenses: Expense[];
  projects: Project[];
}

export default function CuentaJuanCarlos({
  invoices,
  expenses,
  projects
}: CuentaJuanCarlosProps) {
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [expenseSearch, setExpenseSearch] = useState('');

  // Helper to find project name
  const getProjectName = (projId: string | null) => {
    if (!projId) return 'N/A / Operativo';
    const proj = projects.find(p => p.id === projId);
    return proj ? proj.nombre : 'Proyecto desconocido';
  };

  // 1. Juan Carlos te debe: Sum of Invoices where facturado_por === 'Juan Carlos' and estado === 'facturada'
  const pendingInvoices = invoices.filter(
    (inv) => inv.facturado_por === 'Juan Carlos' && inv.estado === 'facturada'
  );
  const totalJuanCarlosDebe = pendingInvoices.reduce((sum, inv) => sum + inv.total, 0);

  // 2. Le debes a Juan Carlos: Sum of Expenses where cuentaOrigen === 'Juan Carlos' and estatusPago === 'pendiente'
  const pendingExpenses = expenses.filter(
    (exp) => exp.cuentaOrigen === 'Juan Carlos' && exp.estatusPago === 'Pendiente'
  );
  const totalLeDebemosAJuanCarlos = pendingExpenses.reduce((sum, exp) => sum + exp.total, 0);

  // 3. Saldo Neto: Juan Carlos te debe - Le debes a Juan Carlos
  const saldoNeto = totalJuanCarlosDebe - totalLeDebemosAJuanCarlos;

  // Filter lists for search
  const filteredInvoices = pendingInvoices.filter((inv) => {
    const projName = getProjectName(inv.proyectoId).toLowerCase();
    return (
      inv.folio.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      projName.includes(invoiceSearch.toLowerCase())
    );
  });

  const filteredExpenses = pendingExpenses.filter((exp) => {
    const projName = getProjectName(exp.proyectoId).toLowerCase();
    return (
      exp.concepto.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      projName.includes(expenseSearch.toLowerCase()) ||
      exp.categoriaId.toLowerCase().includes(expenseSearch.toLowerCase())
    );
  });

  return (
    <div id="juan-carlos-module-container" className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div>
        <h2 className="font-serif text-2xl font-bold text-enchanted-green dark:text-light-ivory tracking-tight">
          Cuenta Juan Carlos
        </h2>
        <p className="text-xs text-rocky-gray mt-1">
          Módulo de conciliación exclusivo para operaciones facturadas o financiadas a nombre de Juan Carlos.
        </p>
      </div>

      {/* Summary Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Card: Juan Carlos te debe */}
        <div id="jc-te-debe" className="bg-white dark:bg-[#051A14]/60 p-6 rounded-xl border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest font-bold text-rocky-gray">Juan Carlos te debe</p>
              <h3 className="text-2xl font-mono font-bold text-enchanted-green dark:text-light-ivory">
                {formatCurrency(totalJuanCarlosDebe)}
              </h3>
            </div>
            <div className="p-3 bg-enchanted-green/5 dark:bg-white/5 rounded-lg text-enchanted-green dark:text-elevated-gold">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="text-[11px] text-rocky-gray leading-relaxed">
            Suma de facturas emitidas bajo su razón social con estado <span className="font-bold text-cranberry">Pendiente</span>. Representa dinero cobrado por él que debe transferir a la empresa.
          </div>
        </div>

        {/* Card: Le debes a Juan Carlos */}
        <div id="le-debes-a-jc" className="bg-white dark:bg-[#051A14]/60 p-6 rounded-xl border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest font-bold text-rocky-gray">Le debes a Juan Carlos</p>
              <h3 className="text-2xl font-mono font-bold text-cranberry">
                {formatCurrency(totalLeDebemosAJuanCarlos)}
              </h3>
            </div>
            <div className="p-3 bg-cranberry/5 dark:bg-white/5 rounded-lg text-cranberry">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="text-[11px] text-rocky-gray leading-relaxed">
            Suma de gastos de la empresa pagados con su cuenta personal/tarjeta con estatus <span className="font-bold text-cranberry">Pendiente</span> de reembolso.
          </div>
        </div>

        {/* Card: Saldo Neto */}
        <div id="saldo-neto-jc" className={`p-6 rounded-xl border shadow-md flex flex-col justify-between space-y-4 ${
          saldoNeto > 0 
            ? 'bg-enchanted-green/[0.02] border-enchanted-green/25 dark:border-elevated-gold/30' 
            : saldoNeto < 0 
              ? 'bg-cranberry/[0.01] border-cranberry/25' 
              : 'bg-white dark:bg-[#051A14]/60 border-enchanted-green/10 dark:border-light-ivory/10'
        }`}>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest font-bold text-rocky-gray">Saldo Neto Conciliado</p>
              <h3 className={`text-2xl font-mono font-bold ${
                saldoNeto > 0 
                  ? 'text-enchanted-green dark:text-elevated-gold' 
                  : saldoNeto < 0 
                    ? 'text-cranberry' 
                    : 'text-rocky-gray'
              }`}>
                {saldoNeto > 0 ? '+' : ''}{formatCurrency(saldoNeto)}
              </h3>
            </div>
            <div className={`p-3 rounded-lg ${
              saldoNeto > 0 
                ? 'bg-enchanted-green/5 dark:bg-elevated-gold/10 text-enchanted-green dark:text-elevated-gold' 
                : saldoNeto < 0 
                  ? 'bg-cranberry/5 text-cranberry' 
                  : 'bg-rocky-gray/5 text-rocky-gray'
            }`}>
              <ArrowRightLeft size={20} />
            </div>
          </div>
          
          <div className="text-xs">
            {saldoNeto > 0 ? (
              <div className="p-2.5 bg-enchanted-green/5 dark:bg-white/5 border border-enchanted-green/10 dark:border-elevated-gold/20 rounded font-medium text-enchanted-green dark:text-light-ivory">
                <strong>A favor de la empresa:</strong> Juan Carlos debe transferir <span className="font-mono font-bold text-elevated-gold">{formatCurrency(saldoNeto)}</span> a la cuenta de IX.
              </div>
            ) : saldoNeto < 0 ? (
              <div className="p-2.5 bg-cranberry/5 border border-cranberry/10 rounded font-medium text-cranberry">
                <strong>A favor de Juan Carlos:</strong> La empresa debe reembolsar <span className="font-mono font-bold">{formatCurrency(Math.abs(saldoNeto))}</span> a Juan Carlos.
              </div>
            ) : (
              <div className="p-2.5 bg-rocky-gray/5 border border-rocky-gray/10 rounded font-medium text-rocky-gray text-center flex items-center justify-center gap-1.5">
                <CheckCircle2 size={14} className="text-enchanted-green dark:text-elevated-gold" />
                <span>Saldos perfectamente conciliados. No hay cobros ni adeudos pendientes.</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Lists & Tables Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Left Column: Pending Invoices */}
        <div className="bg-white dark:bg-[#051A14]/20 border border-enchanted-green/10 dark:border-light-ivory/10 rounded-xl overflow-hidden shadow-sm flex flex-col">
          
          <div className="p-5 border-b border-enchanted-green/10 dark:border-light-ivory/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-enchanted-green/[0.01] dark:bg-white/[0.01]">
            <div>
              <h4 className="font-serif text-base font-bold text-enchanted-green dark:text-light-ivory flex items-center gap-2">
                <Receipt size={16} className="text-elevated-gold" />
                <span>Cobros Pendientes por Transferir</span>
              </h4>
              <p className="text-[11px] text-rocky-gray mt-0.5">
                Facturado por Juan Carlos pendiente de transferir a la empresa.
              </p>
            </div>
            
            <div className="relative max-w-xs w-full">
              <span className="absolute left-2.5 top-2 text-rocky-gray">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Buscar folio o proyecto..."
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-light-ivory/30 dark:bg-[#070D0C]/40 border border-enchanted-green/15 dark:border-light-ivory/15 rounded text-xs text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            {filteredInvoices.length === 0 ? (
              <div className="p-8 text-center text-rocky-gray text-xs">
                {invoiceSearch ? 'Sin resultados para la búsqueda' : 'No hay cobros pendientes de Juan Carlos'}
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-enchanted-green/10 dark:border-light-ivory/10 bg-enchanted-green/[0.02] dark:bg-white/[0.02]">
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-enchanted-green/70 dark:text-light-ivory/70">Folio</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-enchanted-green/70 dark:text-light-ivory/70">Proyecto</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-enchanted-green/70 dark:text-light-ivory/70 text-right">Monto</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-enchanted-green/70 dark:text-light-ivory/70 text-center">Método</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-enchanted-green/70 dark:text-light-ivory/70">Emisión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-enchanted-green/5 dark:divide-white/5">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-enchanted-green/[0.01] dark:hover:bg-white/[0.01] transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-enchanted-green dark:text-light-ivory">
                        {inv.folio}
                      </td>
                      <td className="px-4 py-3 max-w-[150px] truncate font-medium text-enchanted-green dark:text-light-ivory">
                        {getProjectName(inv.proyectoId)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-enchanted-green dark:text-light-ivory">
                        {formatCurrency(inv.total)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-enchanted-green/5 dark:bg-white/5 text-enchanted-green dark:text-light-ivory">
                          {inv.metodoPago}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-rocky-gray">
                        {inv.fechaEmision}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          <div className="p-3 bg-enchanted-green/[0.01] dark:bg-white/[0.01] border-t border-enchanted-green/10 dark:border-light-ivory/10 text-right text-xs">
            Total en Cobros: <strong className="font-mono text-enchanted-green dark:text-elevated-gold">{formatCurrency(totalJuanCarlosDebe)}</strong>
          </div>
        </div>

        {/* Right Column: Pending Expenses */}
        <div className="bg-white dark:bg-[#051A14]/20 border border-enchanted-green/10 dark:border-light-ivory/10 rounded-xl overflow-hidden shadow-sm flex flex-col">
          
          <div className="p-5 border-b border-enchanted-green/10 dark:border-light-ivory/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-enchanted-green/[0.01] dark:bg-white/[0.01]">
            <div>
              <h4 className="font-serif text-base font-bold text-cranberry flex items-center gap-2">
                <TrendingDown size={16} className="text-cranberry" />
                <span>Gastos por Reembolsar</span>
              </h4>
              <p className="text-[11px] text-rocky-gray mt-0.5">
                Gastos financiados por Juan Carlos pendientes de reembolso.
              </p>
            </div>
            
            <div className="relative max-w-xs w-full">
              <span className="absolute left-2.5 top-2 text-rocky-gray">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Buscar concepto o categoría..."
                value={expenseSearch}
                onChange={(e) => setExpenseSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-light-ivory/30 dark:bg-[#070D0C]/40 border border-enchanted-green/15 dark:border-light-ivory/15 rounded text-xs text-enchanted-green dark:text-light-ivory focus:outline-none focus:border-elevated-gold transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            {filteredExpenses.length === 0 ? (
              <div className="p-8 text-center text-rocky-gray text-xs">
                {expenseSearch ? 'Sin resultados para la búsqueda' : 'No hay gastos pendientes por reembolsar'}
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-enchanted-green/10 dark:border-light-ivory/10 bg-enchanted-green/[0.02] dark:bg-white/[0.02]">
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-enchanted-green/70 dark:text-light-ivory/70">Fecha</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-enchanted-green/70 dark:text-light-ivory/70">Concepto</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-enchanted-green/70 dark:text-light-ivory/70">Categoría</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-enchanted-green/70 dark:text-light-ivory/70 text-right">Monto</th>
                    <th className="px-4 py-3 font-bold uppercase tracking-wider text-enchanted-green/70 dark:text-light-ivory/70">Vínculo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-enchanted-green/5 dark:divide-white/5">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-enchanted-green/[0.01] dark:hover:bg-white/[0.01] transition-colors">
                      <td className="px-4 py-3 font-mono text-[10px] text-rocky-gray whitespace-nowrap">
                        {exp.fecha}
                      </td>
                      <td className="px-4 py-3 max-w-[150px] truncate font-medium text-enchanted-green dark:text-light-ivory">
                        {exp.concepto}
                      </td>
                      <td className="px-4 py-3 text-rocky-gray font-sans truncate max-w-[120px]">
                        {exp.categoriaId}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-cranberry whitespace-nowrap">
                        {formatCurrency(exp.total)}
                      </td>
                      <td className="px-4 py-3 text-rocky-gray truncate max-w-[100px]">
                        {exp.proyectoId ? getProjectName(exp.proyectoId) : 'Operativo'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          <div className="p-3 bg-enchanted-green/[0.01] dark:bg-white/[0.01] border-t border-enchanted-green/10 dark:border-light-ivory/10 text-right text-xs">
            Total en Gastos: <strong className="font-mono text-cranberry">{formatCurrency(totalLeDebemosAJuanCarlos)}</strong>
          </div>
        </div>

      </div>

    </div>
  );
}
