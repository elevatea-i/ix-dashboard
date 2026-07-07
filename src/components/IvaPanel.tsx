/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Invoice, Expense, ProviderPayment } from '../types';
import { calculateIvaMetrics } from '../utils/iva';
import { 
  Receipt, 
  TrendingUp, 
  TrendingDown, 
  ArrowRightLeft,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { formatCurrency } from '../utils';

interface IvaPanelProps {
  invoices: Invoice[];
  expenses: Expense[];
  providerPayments: ProviderPayment[];
}

/**
 * Panel de IVA (Fase 9).
 * Vista agregada y resumida de solo lectura del balance tributario del IVA.
 */
export default function IvaPanel({
  invoices = [],
  expenses = [],
  providerPayments = []
}: IvaPanelProps) {
  // Compute IVA metrics via pure utility function
  const metrics = calculateIvaMetrics(invoices, expenses, providerPayments);

  // Check if there is absolutely no activity to show empty state helper
  const hasNoActivity = 
    invoices.length === 0 && 
    expenses.length === 0 && 
    providerPayments.length === 0;

  return (
    <div id="iva-panel-container" className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-enchanted-green dark:text-light-ivory tracking-tight">
            Panel de IVA
          </h2>
          <p className="text-xs text-rocky-gray mt-1">
            Resumen de IVA Trasladado vs. IVA Acreditable, basado en tus facturas, gastos y pagos a proveedores.
          </p>
        </div>
      </div>

      {hasNoActivity && (
        <div className="bg-white dark:bg-[#051A14]/40 border border-enchanted-green/10 dark:border-light-ivory/10 rounded-lg p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-enchanted-green/5 dark:bg-white/5 flex items-center justify-center mx-auto text-rocky-gray">
            <Receipt size={24} />
          </div>
          <h3 className="font-serif text-sm font-semibold text-enchanted-green dark:text-light-ivory">Sin Datos Registrados</h3>
          <p className="text-xs text-rocky-gray max-w-md mx-auto">
            Registra facturas de clientes, gastos con factura y pagos a proveedores con factura para calcular el balance de IVA.
          </p>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: IVA Trasladado */}
        <div id="kpi-iva-trasladado" className="bg-white dark:bg-[#051A14]/60 p-5 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-wider font-bold text-rocky-gray">IVA Trasladado</p>
              <div className="text-[#8C7853] dark:text-elevated-gold bg-[#8C7853]/10 px-2 py-0.5 rounded text-[8px] font-semibold uppercase tracking-tight">
                Clientes
              </div>
            </div>
            <p className="text-2xl font-mono font-bold text-enchanted-green dark:text-light-ivory mt-2">
              {formatCurrency(metrics.ivaTrasladado)}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-rocky-gray/5 flex items-center justify-between text-[10px] text-rocky-gray">
            <span className="flex items-center gap-1">
              <TrendingUp size={12} className="text-enchanted-green" />
              Suma de IVA de facturas emitidas
            </span>
          </div>
        </div>

        {/* Card 2: IVA Acreditable */}
        <div id="kpi-iva-acreditable" className="bg-white dark:bg-[#051A14]/60 p-5 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-wider font-bold text-rocky-gray">IVA Acreditable Total</p>
              <div className="text-enchanted-green dark:text-light-ivory bg-enchanted-green/10 px-2 py-0.5 rounded text-[8px] font-semibold uppercase tracking-tight">
                Pagos y Gastos
              </div>
            </div>
            <p className="text-2xl font-mono font-bold text-[#0B3D2E] dark:text-[#EAE3D2] mt-2">
              {formatCurrency(metrics.ivaAcreditableTotal)}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-rocky-gray/5 flex items-center justify-between text-[10px] text-rocky-gray">
            <span className="flex items-center gap-1">
              <TrendingDown size={12} className="text-rocky-gray" />
              Suma de IVA con factura fiscal
            </span>
          </div>
        </div>

        {/* Card 3: Diferencia (Dynamic Label & Color based on esAPagar) */}
        <div 
          id="kpi-iva-diferencia" 
          className={`p-5 rounded-lg border shadow-sm flex flex-col justify-between transition-all ${
            metrics.esAPagar
              ? 'bg-cranberry/[0.03] dark:bg-cranberry/[0.08] border-cranberry/20 dark:border-cranberry/30'
              : 'bg-enchanted-green/[0.03] dark:bg-[#051A14]/90 border-enchanted-green/20 dark:border-[#8C7853]/20'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-wider font-bold text-rocky-gray">Balance de IVA</p>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                metrics.esAPagar 
                  ? 'bg-cranberry/10 text-cranberry' 
                  : 'bg-enchanted-green/15 text-enchanted-green dark:text-[#EAE3D2]'
              }`}>
                {metrics.esAPagar ? 'Obligación' : 'A favor'}
              </span>
            </div>
            
            <p className="text-xs font-semibold text-rocky-gray dark:text-light-ivory/80 mt-2">
              {metrics.esAPagar ? 'Monto Estimado A Pagar al SAT' : 'Saldo a Favor Estimado'}
            </p>
            <p className={`text-2xl font-mono font-bold mt-1 ${
              metrics.esAPagar 
                ? 'text-cranberry' 
                : 'text-enchanted-green dark:text-light-ivory'
            }`}>
              {formatCurrency(metrics.montoResultante)}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-rocky-gray/5 flex items-center justify-between text-[10px] text-rocky-gray">
            <span className="flex items-center gap-1.5">
              <ArrowRightLeft size={12} className={metrics.esAPagar ? 'text-cranberry' : 'text-enchanted-green'} />
              Diferencia neta (Trasladado - Acreditable)
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown Section */}
      <div className="bg-white dark:bg-[#051A14]/40 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm p-6 space-y-6">
        <div>
          <h3 className="font-serif text-sm font-semibold text-enchanted-green dark:text-light-ivory">
            Origen de IVA Acreditable
          </h3>
          <p className="text-[11px] text-rocky-gray mt-1">
            Solo los gastos y pagos a proveedores que cuentan con su factura (CFDI) correspondiente suman al IVA acreditable.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Expenses Portion */}
          <div className="bg-enchanted-green/[0.02] dark:bg-white/[0.02] rounded-lg border border-enchanted-green/5 dark:border-white/5 p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-rocky-gray uppercase tracking-wider block">IVA Acreditable de Gastos</span>
              <span className="text-xs text-rocky-gray/80 dark:text-light-ivory/60 block">Gastos operativos y vinculados</span>
            </div>
            <div className="text-right">
              <p className="text-base font-mono font-bold text-[#0B3D2E] dark:text-[#EAE3D2]">
                {formatCurrency(metrics.ivaAcreditableGastos)}
              </p>
              <span className="text-[9px] text-rocky-gray bg-rocky-gray/10 px-1.5 py-0.5 rounded font-medium">
                Deducible
              </span>
            </div>
          </div>

          {/* Provider Payments Portion */}
          <div className="bg-enchanted-green/[0.02] dark:bg-white/[0.02] rounded-lg border border-enchanted-green/5 dark:border-white/5 p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-rocky-gray uppercase tracking-wider block">IVA Acreditable de Proveedores</span>
              <span className="text-xs text-rocky-gray/80 dark:text-light-ivory/60 block">Pagos directos a proveedores</span>
            </div>
            <div className="text-right">
              <p className="text-base font-mono font-bold text-[#0B3D2E] dark:text-[#EAE3D2]">
                {formatCurrency(metrics.ivaAcreditableProveedores)}
              </p>
              <span className="text-[9px] text-rocky-gray bg-rocky-gray/10 px-1.5 py-0.5 rounded font-medium">
                Deducible
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Helpful Tax Note Card */}
        <div className="bg-[#8C7853]/5 border border-[#8C7853]/15 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={16} className="text-[#8C7853] dark:text-elevated-gold mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="text-[11px] font-bold text-[#8C7853] dark:text-elevated-gold uppercase tracking-wider">Lineamiento Fiscal (SAT)</h4>
            <p className="text-[11px] text-rocky-gray leading-relaxed">
              El IVA Trasladado se calcula sobre el 100% de lo facturado. El IVA Acreditable solo incluye gastos y pagos que ya tienen su factura (CFDI) registrada. Por ahora, este balance no considera retenciones de ISR o IVA.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
