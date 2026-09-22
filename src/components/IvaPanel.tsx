import React, { useState, useMemo } from 'react';
import { Invoice, Expense, ProviderPayment } from '../types';
import { calculateIvaMetrics, getMesesDisponibles, formatPeriodo } from '../utils/iva';
import IvaMonthSelector from './IvaMonthSelector';
import {
  Receipt,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  AlertCircle,
  TriangleAlert,
} from 'lucide-react';
import { formatCurrency } from '../utils';

interface IvaPanelProps {
  invoices: Invoice[];
  expenses: Expense[];
  providerPayments: ProviderPayment[];
}

function getMesCDMX(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const cdmxOffset = -360;
  const cdmxTime = new Date(now.getTime() + (offset - cdmxOffset) * 60000);
  const y = cdmxTime.getFullYear();
  const m = String(cdmxTime.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export default function IvaPanel({
  invoices = [],
  expenses = [],
  providerPayments = [],
}: IvaPanelProps) {
  const [vista, setVista] = useState<'global' | 'mensual'>('global');

  const mesesDisponibles = useMemo(
    () => getMesesDisponibles(invoices, expenses, providerPayments),
    [invoices, expenses, providerPayments]
  );

  const mesCDMX = getMesCDMX();
  const mesInicial = mesesDisponibles.includes(mesCDMX)
    ? mesCDMX
    : mesesDisponibles[0] ?? mesCDMX;

  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(mesInicial);

  const periodo = vista === 'mensual' ? periodoSeleccionado : undefined;
  const metrics = useMemo(
    () => calculateIvaMetrics(invoices, expenses, providerPayments, periodo),
    [invoices, expenses, providerPayments, periodo]
  );

  const hasNoActivity =
    invoices.length === 0 &&
    expenses.length === 0 &&
    providerPayments.length === 0;

  const showSinFechaPago =
    vista === 'mensual' && metrics.sinFechaPago.registros > 0;

  return (
    <div id="iva-panel-container" className="space-y-6 animate-fade-in">
      {/* Encabezado + Interruptor */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-enchanted-green dark:text-light-ivory tracking-tight">
            Panel de IVA
          </h2>
          <p className="text-xs text-[#051a14] dark:text-light-ivory mt-1">
            {vista === 'global'
              ? 'Resumen acumulado de IVA Trasladado vs. IVA Acreditable, basado en flujo de efectivo.'
              : `IVA del mes de ${formatPeriodo(periodoSeleccionado)}, basado en flujo de efectivo (fecha de pago).`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {vista === 'mensual' && (
            <IvaMonthSelector
              mesesDisponibles={mesesDisponibles}
              periodoSeleccionado={periodoSeleccionado}
              onChange={setPeriodoSeleccionado}
            />
          )}

          {/* Toggle Global / Mensual */}
          <div className="inline-flex rounded border border-enchanted-green/15 dark:border-light-ivory/15 overflow-hidden text-[10px] font-bold uppercase tracking-wider">
            <button
              type="button"
              onClick={() => setVista('global')}
              className={`flex items-center gap-1 px-3 py-1.5 transition-colors ${
                vista === 'global'
                  ? 'bg-enchanted-green text-white dark:bg-elevated-gold dark:text-enchanted-green'
                  : 'bg-white dark:bg-[#051A14]/40 text-rocky-gray hover:bg-enchanted-green/5 dark:hover:bg-white/5'
              }`}
            >
              Global
            </button>
            <button
              type="button"
              onClick={() => setVista('mensual')}
              className={`flex items-center gap-1 px-3 py-1.5 transition-colors ${
                vista === 'mensual'
                  ? 'bg-enchanted-green text-white dark:bg-elevated-gold dark:text-enchanted-green'
                  : 'bg-white dark:bg-[#051A14]/40 text-rocky-gray hover:bg-enchanted-green/5 dark:hover:bg-white/5'
              }`}
            >
              Mensual
            </button>
          </div>
        </div>
      </div>

      {/* Aviso de registros sin fecha de pago (solo en vista mensual) */}
      {showSinFechaPago && (
        <div className="bg-cranberry/5 border border-cranberry/20 rounded-lg p-4 flex items-start gap-3">
          <TriangleAlert size={16} className="text-cranberry mt-0.5 shrink-0" />
          <p className="text-[11px] text-cranberry font-medium leading-relaxed">
            Hay <strong>{metrics.sinFechaPago.registros}</strong> registros pagados sin fecha de pago capturada.
            Su IVA (<strong>{formatCurrency(metrics.sinFechaPago.iva)}</strong>) cuenta en la vista global,
            pero no aparece en ningun mes.
          </p>
        </div>
      )}

      {hasNoActivity && (
        <div className="bg-white dark:bg-[#051A14]/40 border border-enchanted-green/10 dark:border-light-ivory/10 rounded-lg p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-enchanted-green/5 dark:bg-white/5 flex items-center justify-center mx-auto text-rocky-gray">
            <Receipt size={24} />
          </div>
          <h3 className="font-serif text-sm font-semibold text-enchanted-green dark:text-light-ivory">
            Sin Datos Registrados
          </h3>
          <p className="text-xs text-rocky-gray max-w-md mx-auto">
            Registra facturas de clientes, gastos con factura y pagos a proveedores con factura
            para calcular el balance de IVA.
          </p>
        </div>
      )}

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* IVA Trasladado */}
        <div
          id="kpi-iva-trasladado"
          className="bg-white dark:bg-[#051A14]/60 p-5 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm flex flex-col justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-wider font-bold text-rocky-gray">
                IVA Trasladado
              </p>
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
              Suma de IVA de facturas cobradas
            </span>
          </div>
        </div>

        {/* IVA Acreditable */}
        <div
          id="kpi-iva-acreditable"
          className="bg-white dark:bg-[#051A14]/60 p-5 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm flex flex-col justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-wider font-bold text-rocky-gray">
                IVA Acreditable Total
              </p>
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
              Suma de IVA con factura.
            </span>
          </div>
        </div>

        {/* Balance de IVA */}
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
              <p className="text-[10px] uppercase tracking-wider font-bold text-rocky-gray">
                Balance de IVA
              </p>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  metrics.esAPagar
                    ? 'bg-cranberry/10 text-cranberry'
                    : 'bg-enchanted-green/15 text-enchanted-green dark:text-[#EAE3D2]'
                }`}
              >
                {metrics.esAPagar ? 'A pagar al SAT' : 'Saldo a favor'}
              </span>
            </div>

            <p className="text-xs font-semibold text-rocky-gray dark:text-light-ivory/80 mt-2">
              {metrics.esAPagar ? 'Monto Estimado A Pagar al SAT' : 'Saldo a Favor Estimado'}
            </p>
            <p
              className={`text-2xl font-mono font-bold mt-1 ${
                metrics.esAPagar
                  ? 'text-cranberry'
                  : 'text-enchanted-green dark:text-light-ivory'
              }`}
            >
              {formatCurrency(metrics.montoResultante)}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-rocky-gray/5 flex items-center justify-between text-[10px] text-rocky-gray">
            <span className="flex items-center gap-1.5">
              <ArrowRightLeft
                size={12}
                className={metrics.esAPagar ? 'text-cranberry' : 'text-enchanted-green'}
              />
              Trasladado - Acreditable - Retenciones
            </span>
          </div>
        </div>
      </div>

      {/* Desglose */}
      <div className="bg-white dark:bg-[#051A14]/40 rounded-lg border border-enchanted-green/10 dark:border-light-ivory/10 shadow-sm p-6 space-y-6">
        <div>
          <h3 className="font-serif text-sm font-semibold text-enchanted-green dark:text-light-ivory">
            Origen de IVA "Acreditable"
          </h3>
          <p className="text-[11px] text-[#070d0c] dark:text-light-ivory mt-1">
            Solo los gastos y pagos a proveedores ya pagados y con su factura (CFDI) suman al IVA acreditable.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Gastos */}
          <div className="bg-enchanted-green/[0.02] dark:bg-white/[0.02] rounded-lg border border-enchanted-green/5 dark:border-white/5 p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-rocky-gray uppercase tracking-wider block">
                IVA Acreditable de Gastos
              </span>
              <span className="text-xs text-rocky-gray/80 dark:text-light-ivory/60 block">
                Gastos operativos y vinculados
              </span>
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

          {/* Proveedores */}
          <div className="bg-enchanted-green/[0.02] dark:bg-white/[0.02] rounded-lg border border-enchanted-green/5 dark:border-white/5 p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-rocky-gray uppercase tracking-wider block">
                IVA Acreditable de Proveedores
              </span>
              <span className="text-xs text-rocky-gray/80 dark:text-light-ivory/60 block">
                Pagos directos a proveedores
              </span>
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

          {/* Retenciones de IVA de Clientes */}
          <div className="bg-enchanted-green/[0.02] dark:bg-white/[0.02] rounded-lg border border-enchanted-green/5 dark:border-white/5 p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-rocky-gray uppercase tracking-wider block">
                Retenciones de IVA de Clientes
              </span>
              <span className="text-xs text-rocky-gray/80 dark:text-light-ivory/60 block">
                Retenido por clientes en facturas cobradas
              </span>
            </div>
            <div className="text-right">
              <p className="text-base font-mono font-bold text-[#0B3D2E] dark:text-[#EAE3D2]">
                {formatCurrency(metrics.retencionesClientes)}
              </p>
              <span className="text-[9px] text-rocky-gray bg-rocky-gray/10 px-1.5 py-0.5 rounded font-medium">
                Resta al balance
              </span>
            </div>
          </div>
        </div>

        {/* Nota fiscal */}
        <div className="bg-[#8C7853]/5 border border-[#8C7853]/15 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle
            size={16}
            className="text-[#8C7853] dark:text-elevated-gold mt-0.5 shrink-0"
          />
          <div className="space-y-1">
            <h4 className="text-[11px] font-bold text-[#8C7853] dark:text-elevated-gold uppercase tracking-wider">
              Lineamiento Fiscal (SAT)
            </h4>
            <p className="text-[11px] text-[#051a14] dark:text-light-ivory leading-relaxed">
              El IVA se calcula con base en flujo de efectivo: Solo se consideran facturas efectivamente
              cobradas, gastos efectivamente pagados y pagos a proveedores efectivamente liquidados,
              todos con su CFDI registrado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
