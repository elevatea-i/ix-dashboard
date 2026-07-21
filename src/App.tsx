/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, BookOpen, AlertCircle } from 'lucide-react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ClientesList from './components/ClientesList';
import ClienteFormModal from './components/ClienteFormModal';
import EliminarClienteModal from './components/EliminarClienteModal';
import ProyectosList from './components/ProyectosList';
import ProyectoFormModal from './components/ProyectoFormModal';
import EliminarProyectoModal from './components/EliminarProyectoModal';
import FacturasList from './components/FacturasList';
import FacturaFormModal from './components/FacturaFormModal';
import MarcarPagadaModal from './components/MarcarPagadaModal';
import EliminarFacturaModal from './components/EliminarFacturaModal';
import GastosList from './components/GastosList';
import GastoFormModal from './components/GastoFormModal';
import EliminarGastoModal from './components/EliminarGastoModal';
import ProviderPaymentsList from './components/ProviderPaymentsList';
import ProviderPaymentFormModal from './components/ProviderPaymentFormModal';
import EliminarPagoProveedorModal from './components/EliminarPagoProveedorModal';
import ThirdPartyPaymentsList from './components/ThirdPartyPaymentsList';
import ThirdPartyPaymentFormModal from './components/ThirdPartyPaymentFormModal';
import EliminarPagoTerceroModal from './components/EliminarPagoTerceroModal';
import RecibirDineroModal from './components/RecibirDineroModal';
import RepartoUtilidadesList from './components/RepartoUtilidadesList';
import PorImpactarList from './components/PorImpactarList';
import PorImpactarFormModal from './components/PorImpactarFormModal';
import PorImpactarResolverModal from './components/PorImpactarResolverModal';
import EliminarPorImpactarModal from './components/EliminarPorImpactarModal';
import RentabilidadList from './components/RentabilidadList';
import IvaPanel from './components/IvaPanel';
import ReportesPanel from './components/ReportesPanel';
import CuentaJuanCarlos from './components/CuentaJuanCarlos';
import BovedaIva from './components/BovedaIva';
import EliminarRetiroIVAModal from './components/EliminarRetiroIVAModal';
import { Client, Project, Invoice, Expense, ExpenseCategory, ModuleId, ProviderPayment, ThirdPartyPayment, ProfitDistribution, PorImpactar, IvaWithdrawal } from './types';
import { getMexicoCityDate, getMexicoCityDateTimeString, calculateProjectBillingStatus } from './utils';
import { calculateProfitDistribution, calculateProfitDistributionForAmount } from './utils/profitDistribution';
import { useToast } from './components/Toast';

export default function App() {
  const { showToast } = useToast();

  // Authentication state (in memory for static phase)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Sidebar toggle for mobile responsive layouts
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Active module state
  const [activeModule, setActiveModule] = useState<ModuleId>('clientes');

  // Clientes CRUD State (Starts EMPTY as requested)
  const [clients, setClients] = useState<Client[]>([]);

  // Proyectos CRUD State (Starts EMPTY as requested)
  const [projects, setProjects] = useState<Project[]>([]);

  // Facturas CRUD State (Starts EMPTY as requested)
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Gastos CRUD State (Starts EMPTY as requested)
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Pagos a Proveedores CRUD State (starts EMPTY as requested)
  const [providerPayments, setProviderPayments] = useState<ProviderPayment[]>([]);

  // Pagos a Terceros CRUD State (starts EMPTY as requested)
  const [thirdPartyPayments, setThirdPartyPayments] = useState<ThirdPartyPayment[]>([]);

  // Reparto de Utilidades State (starts EMPTY as requested)
  const [profitDistributions, setProfitDistributions] = useState<ProfitDistribution[]>([]);

  // Por Impactar CRUD State (starts EMPTY as requested)
  const [porImpactar, setPorImpactar] = useState<PorImpactar[]>([]);

  // Bóveda de IVA Withdrawals State (starts EMPTY as requested)
  const [ivaWithdrawals, setIvaWithdrawals] = useState<IvaWithdrawal[]>([]);

  // Modal controls
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDeleteClientModalOpen, setIsDeleteClientModalOpen] = useState(false);
  const [clientToDeleteId, setClientToDeleteId] = useState<string | null>(null);
  const [clientDeleteCounts, setClientDeleteCounts] = useState<{
    projects: number;
    invoices: number;
    expenses: number;
    providerPayments: number;
    thirdPartyPayments: number;
    profitDistributions: number;
  } | null>(null);

  // Por Impactar Modal controls
  const [isPorImpactarFormOpen, setIsPorImpactarFormOpen] = useState(false);
  const [selectedPorImpactar, setSelectedPorImpactar] = useState<PorImpactar | null>(null);
  const [isPorImpactarResolverOpen, setIsPorImpactarResolverOpen] = useState(false);
  const [porImpactarToResolve, setPorImpactarToResolve] = useState<PorImpactar | null>(null);

  // Proyectos Modal controls
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDeleteProjectModalOpen, setIsDeleteProjectModalOpen] = useState(false);
  const [projectToDeleteId, setProjectToDeleteId] = useState<string | null>(null);
  const [projectDeleteCounts, setProjectDeleteCounts] = useState<{
    invoices: number;
    expenses: number;
    providerPayments: number;
    thirdPartyPayments: number;
    profitDistributions: number;
  } | null>(null);

  // Facturas Modal controls
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Gastos Modal controls
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDeleteExpenseModalOpen, setIsDeleteExpenseModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [porImpactarToRevert, setPorImpactarToRevert] = useState<PorImpactar | null>(null);

  // Pagos a Proveedores Modal controls
  const [isProviderPaymentModalOpen, setIsProviderPaymentModalOpen] = useState(false);
  const [selectedProviderPayment, setSelectedProviderPayment] = useState<ProviderPayment | null>(null);

  // Pagos a Terceros Modal controls
  const [isThirdPartyPaymentModalOpen, setIsThirdPartyPaymentModalOpen] = useState(false);
  const [selectedThirdPartyPayment, setSelectedThirdPartyPayment] = useState<ThirdPartyPayment | null>(null);

  // Marcar como Pagada Modal controls
  const [isMarkAsPaidOpen, setIsMarkAsPaidOpen] = useState(false);
  const [invoiceToMarkAsPaid, setInvoiceToMarkAsPaid] = useState<Invoice | null>(null);

  // Eliminar Factura Modal controls
  const [isDeleteInvoiceModalOpen, setIsDeleteInvoiceModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  // Marcar como Recibido (Dinero Recibido) Modal controls
  const [isRecibirDineroOpen, setIsRecibirDineroOpen] = useState(false);
  const [paymentToMarkAsReceived, setPaymentToMarkAsReceived] = useState<ThirdPartyPayment | null>(null);

  // New Delete Confirmation Modals state variables
  const [isDeleteProviderPaymentModalOpen, setIsDeleteProviderPaymentModalOpen] = useState(false);
  const [providerPaymentToDelete, setProviderPaymentToDelete] = useState<ProviderPayment | null>(null);

  const [isDeleteThirdPartyPaymentModalOpen, setIsDeleteThirdPartyPaymentModalOpen] = useState(false);
  const [thirdPartyPaymentToDelete, setThirdPartyPaymentToDelete] = useState<ThirdPartyPayment | null>(null);

  const [isDeletePorImpactarModalOpen, setIsDeletePorImpactarModalOpen] = useState(false);
  const [porImpactarToDelete, setPorImpactarToDelete] = useState<PorImpactar | null>(null);

  const [isDeleteIvaWithdrawalModalOpen, setIsDeleteIvaWithdrawalModalOpen] = useState(false);
  const [ivaWithdrawalToDelete, setIvaWithdrawalToDelete] = useState<IvaWithdrawal | null>(null);

  // Apply dark mode theme class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handle local Auth persistence
  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  // CRUD actions for Clients
  const handleAddOrEditClientSubmit = (formData: { 
    nombre: string; 
    razonSocial: string; 
    rfc: string; 
    contacto: string; 
  }) => {
    if (selectedClient) {
      // Edit mode
      setClients(prev => prev.map(c => 
        c.id === selectedClient.id 
          ? { ...c, ...formData } 
          : c
      ));
      showToast('Cambios guardados');
    } else {
      // Add mode
      const newClient: Client = {
        id: `cli_${Math.random().toString(36).substr(2, 9)}`,
        nombre: formData.nombre,
        razonSocial: formData.razonSocial,
        rfc: formData.rfc,
        contacto: formData.contacto,
        createdAt: getMexicoCityDateTimeString()
      };
      setClients(prev => [newClient, ...prev]);
      showToast('Guardado con éxito');
    }
    setIsFormModalOpen(false);
    setSelectedClient(null);
  };

  const handleDeleteClient = (id: string) => {
    // Find all project ids for this client
    const clientProjects = projects.filter(p => p.clienteId === id);
    const clientProjectIds = clientProjects.map(p => p.id);

    const countProjects = clientProjects.length;
    const countInvoices = invoices.filter(inv => clientProjectIds.includes(inv.proyectoId)).length;
    const countExpenses = expenses.filter(exp => exp.proyectoId && clientProjectIds.includes(exp.proyectoId)).length;
    const countProviderPayments = providerPayments.filter(pp => clientProjectIds.includes(pp.proyectoId)).length;
    const countThirdPartyPayments = thirdPartyPayments.filter(tp => tp.proyectoId && clientProjectIds.includes(tp.proyectoId)).length;
    const countProfitDistributions = profitDistributions.filter(pd => clientProjectIds.includes(pd.proyectoId)).length;

    setClientToDeleteId(id);
    setClientDeleteCounts({
      projects: countProjects,
      invoices: countInvoices,
      expenses: countExpenses,
      providerPayments: countProviderPayments,
      thirdPartyPayments: countThirdPartyPayments,
      profitDistributions: countProfitDistributions
    });
    setIsDeleteClientModalOpen(true);
  };

  const handleConfirmDeleteClient = (id: string) => {
    // Find all project ids for this client
    const clientProjects = projects.filter(p => p.clienteId === id);
    const clientProjectIds = clientProjects.map(p => p.id);

    // 1. Delete all profit distributions of these projects
    setProfitDistributions(prev => prev.filter(pd => !clientProjectIds.includes(pd.proyectoId)));

    // 2. Delete all third party payments of these projects
    setThirdPartyPayments(prev => prev.filter(tp => !tp.proyectoId || !clientProjectIds.includes(tp.proyectoId)));

    // 3. Delete all provider payments of these projects
    setProviderPayments(prev => prev.filter(pp => !clientProjectIds.includes(pp.proyectoId)));

    // 4. Revert any porImpactar records generated by expenses of these projects
    const clientExpenses = expenses.filter(exp => exp.proyectoId && clientProjectIds.includes(exp.proyectoId));
    const clientExpenseIds = clientExpenses.map(exp => exp.id);

    setPorImpactar(prev => prev.map(rec => {
      if (rec.gastoIdGenerado && clientExpenseIds.includes(rec.gastoIdGenerado)) {
        return {
          ...rec,
          estatus: 'pendiente',
          proyectoDestinoId: null,
          gastoIdGenerado: null
        };
      }
      return rec;
    }));

    // 5. Delete all expenses of these projects
    setExpenses(prev => prev.filter(exp => !exp.proyectoId || !clientProjectIds.includes(exp.proyectoId)));

    // 6. Delete all invoices of these projects
    setInvoices(prev => prev.filter(inv => !clientProjectIds.includes(inv.proyectoId)));

    // 7. Delete all projects of this client
    setProjects(prev => prev.filter(p => p.clienteId !== id));

    // 8. Delete the client itself
    setClients(prev => prev.filter(c => c.id !== id));

    // Close and reset states
    setIsDeleteClientModalOpen(false);
    setClientToDeleteId(null);
    setClientDeleteCounts(null);

    showToast('Cliente y toda su documentación eliminados');
  };

  const handleOpenAddModal = () => {
    setSelectedClient(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (client: Client) => {
    setSelectedClient(client);
    setIsFormModalOpen(true);
  };

  // CRUD actions for Projects
  const handleAddOrEditProjectSubmit = (formData: {
    nombre: string;
    codigo: string;
    clienteId: string;
    ejecutivoId: 'San' | 'Ale';
  }) => {
    if (selectedProject) {
      // Edit mode
      setProjects(prev => prev.map(p => 
        p.id === selectedProject.id 
          ? { ...p, ...formData } 
          : p
      ));
      showToast('Cambios guardados');
    } else {
      // Add mode
      const newProject: Project = {
        id: `proy_${Math.random().toString(36).substr(2, 9)}`,
        nombre: formData.nombre,
        codigo: formData.codigo,
        clienteId: formData.clienteId,
        ejecutivoId: formData.ejecutivoId,
        estadoFacturacion: 'Sin facturar',
        fechaCreacion: getMexicoCityDate()
      };
      setProjects(prev => [newProject, ...prev]);
      showToast('Guardado con éxito');
    }
    setIsProjectModalOpen(false);
    setSelectedProject(null);
  };

  const handleDeleteProject = (id: string) => {
    const countInvoices = invoices.filter(inv => inv.proyectoId === id).length;
    const countExpenses = expenses.filter(exp => exp.proyectoId === id).length;
    const countProviderPayments = providerPayments.filter(pp => pp.proyectoId === id).length;
    const countThirdPartyPayments = thirdPartyPayments.filter(tp => tp.proyectoId === id).length;
    const countProfitDistributions = profitDistributions.filter(pd => pd.proyectoId === id).length;

    setProjectToDeleteId(id);
    setProjectDeleteCounts({
      invoices: countInvoices,
      expenses: countExpenses,
      providerPayments: countProviderPayments,
      thirdPartyPayments: countThirdPartyPayments,
      profitDistributions: countProfitDistributions
    });
    setIsDeleteProjectModalOpen(true);
  };

  const handleConfirmDeleteProject = (id: string) => {
    // 1. Elimina todos los Repartos de Utilidades de ese proyecto.
    setProfitDistributions(prev => prev.filter(pd => pd.proyectoId !== id));

    // 2. Elimina todos los Pagos a Terceros vinculados a ese proyecto (proyecto_id = este proyecto).
    setThirdPartyPayments(prev => prev.filter(tp => tp.proyectoId !== id));

    // 3. Elimina todos los Pagos a Proveedores de ese proyecto.
    setProviderPayments(prev => prev.filter(pp => pp.proyectoId !== id));

    // 4. Para cada Gasto de ese proyecto: si ese Gasto tiene un registro de Por Impactar que lo generó,
    // revierte ese PorImpactar a estatus "Pendiente" y limpia su proyectoDestinoId y gastoIdGenerado.
    const projectExpenses = expenses.filter(exp => exp.proyectoId === id);
    const projectExpenseIds = projectExpenses.map(exp => exp.id);

    setPorImpactar(prev => prev.map(rec => {
      if (rec.gastoIdGenerado && projectExpenseIds.includes(rec.gastoIdGenerado)) {
        return {
          ...rec,
          estatus: 'pendiente',
          proyectoDestinoId: null,
          gastoIdGenerado: null
        };
      }
      return rec;
    }));

    // 5. Elimina todos los Gastos de ese proyecto.
    setExpenses(prev => prev.filter(exp => exp.proyectoId !== id));

    // 6. Elimina todas las Facturas de ese proyecto.
    setInvoices(prev => prev.filter(inv => inv.proyectoId !== id));

    // 7. Elimina el Proyecto.
    setProjects(prev => prev.filter(p => p.id !== id));

    // Close and reset states
    setIsDeleteProjectModalOpen(false);
    setProjectToDeleteId(null);
    setProjectDeleteCounts(null);

    showToast('Eliminado con éxito');
  };

  const handleOpenAddProjectModal = () => {
    setSelectedProject(null);
    setIsProjectModalOpen(true);
  };

  const handleOpenEditProjectModal = (project: Project) => {
    setSelectedProject(project);
    setIsProjectModalOpen(true);
  };

  // CRUD actions for Invoices
  const handleAddOrEditInvoiceSubmit = (formData: {
    folio: string;
    proyectoId: string;
    subtotal: number;
    iva: number;
    retencionIsr: number;
    retencionIva: number;
    metodoPago: 'PUE' | 'PPD';
    complementoEmitido?: boolean;
    fechaEmision: string;
    facturado_por?: 'IX' | 'Juan Carlos';
  }) => {
    const calculatedTotal = Number(
      (formData.subtotal + formData.iva - formData.retencionIsr - formData.retencionIva).toFixed(2)
    );

    if (selectedInvoice) {
      // Edit mode
      setInvoices(prev => prev.map(inv => 
        inv.id === selectedInvoice.id 
          ? { 
              ...inv, 
              ...formData, 
              total: calculatedTotal,
              complementoEmitido: formData.metodoPago === 'PPD' ? formData.complementoEmitido : undefined
            } 
          : inv
      ));
      showToast('Cambios guardados');
    } else {
      // Add mode - Starts as "facturada" (Unpaid)
      const newInvoice: Invoice = {
        id: `fact_${Math.random().toString(36).substr(2, 9)}`,
        folio: formData.folio,
        proyectoId: formData.proyectoId,
        subtotal: formData.subtotal,
        iva: formData.iva,
        retencionIsr: formData.retencionIsr,
        retencionIva: formData.retencionIva,
        total: calculatedTotal,
        metodoPago: formData.metodoPago,
        complementoEmitido: formData.metodoPago === 'PPD' ? formData.complementoEmitido : undefined,
        estado: 'facturada',
        fechaEmision: formData.fechaEmision,
        facturado_por: formData.facturado_por || 'IX'
      };
      setInvoices(prev => [newInvoice, ...prev]);
      showToast('Guardado con éxito');
    }
    setIsInvoiceModalOpen(false);
    setSelectedInvoice(null);
  };

  const handleDeleteInvoice = (id: string) => {
    const inv = invoices.find(i => i.id === id);
    if (!inv) return;
    
    setInvoiceToDelete(inv);
    setIsDeleteInvoiceModalOpen(true);
  };

  const handleConfirmDeleteInvoice = (invoiceId: string, distributionIdsToDelete?: string[]) => {
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) return;
    const projId = inv.proyectoId;

    // 1. Delete the invoice from state
    const updatedInvoices = invoices.filter(i => i.id !== invoiceId);
    setInvoices(updatedInvoices);

    // 2. Cascade delete specified profit distributions
    if (distributionIdsToDelete && distributionIdsToDelete.length > 0) {
      setProfitDistributions(prev => prev.filter(pd => !distributionIdsToDelete.includes(pd.id)));
    }

    // 3. Always recalculate billing status of the project after this change
    const newStatus = calculateProjectBillingStatus(projId, updatedInvoices);
    setProjects(prevProjects => prevProjects.map(p => 
      p.id === projId ? { ...p, estadoFacturacion: newStatus } : p
    ));

    // 4. Close the modal
    setIsDeleteInvoiceModalOpen(false);
    setInvoiceToDelete(null);
  };

  const handleOpenAddInvoiceModal = () => {
    setSelectedInvoice(null);
    setIsInvoiceModalOpen(true);
  };

  const handleOpenEditInvoiceModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsInvoiceModalOpen(true);
  };

  const handleOpenMarkAsPaidModal = (invoice: Invoice) => {
    setInvoiceToMarkAsPaid(invoice);
    setIsMarkAsPaidOpen(true);
  };

  const handleConfirmMarkAsPaid = (fechaPago: string) => {
    if (!invoiceToMarkAsPaid) return;
    
    const projId = invoiceToMarkAsPaid.proyectoId;
    
    // 1. Calculate billing status of the project before this change
    const oldStatus = calculateProjectBillingStatus(projId, invoices);
    
    // 2. Prepare the new list of invoices
    const newInvoices = invoices.map(inv => 
      inv.id === invoiceToMarkAsPaid.id 
        ? ({ ...inv, estado: 'pagada', fechaPago } as Invoice)
        : inv
    );
    
    // 3. Set the new list of invoices
    setInvoices(newInvoices);
    
    // 4. Calculate billing status of the project after this change
    const newStatus = calculateProjectBillingStatus(projId, newInvoices);
    
    // 5. Perform incremental profit distribution calculation for this invoice
    const projectDistributions = profitDistributions.filter(pd => pd.proyectoId === projId);
    const lastDistribution = projectDistributions[projectDistributions.length - 1];

    const projectInvoices = newInvoices.filter(inv => inv.proyectoId === projId);
    const total_facturas_actual = projectInvoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0);

    const projectProviderPayments = providerPayments.filter(pay => pay.proyectoId === projId);
    const total_proveedor_actual = projectProviderPayments.reduce((sum, pay) => sum + (pay.subtotal || 0), 0);

    const prev_proveedor_acumulado = lastDistribution && lastDistribution.proveedor_subtotal_acumulado !== undefined
      ? lastDistribution.proveedor_subtotal_acumulado
      : 0;

    const delta_proveedor = total_proveedor_actual - prev_proveedor_acumulado;
    const ganancia_total_delta = Number(((invoiceToMarkAsPaid.subtotal || 0) - delta_proveedor).toFixed(2));

    if (ganancia_total_delta > 0) {
      // Calculate live accumulated Diploma before this operation
      const currentDiplomaAccumulated = profitDistributions.reduce(
        (sum, pd) => sum + (pd.gananciaDiploma || 0),
        0
      );

      const calculation = calculateProfitDistributionForAmount(
        ganancia_total_delta,
        currentDiplomaAccumulated
      );

      const newDistribution: ProfitDistribution = {
        id: `pd_${Math.random().toString(36).substring(2, 9)}`,
        proyectoId: projId,
        gananciaTotal: calculation.gananciaTotal,
        gananciaDueno: calculation.gananciaDueno,
        gananciaEjecutivo: calculation.gananciaEjecutivo,
        gananciaDiploma: calculation.gananciaDiploma,
        fechaCreacion: getMexicoCityDate(),
        facturas_subtotal_acumulado: total_facturas_actual,
        proveedor_subtotal_acumulado: total_proveedor_actual,
        facturaIdsNuevas: [invoiceToMarkAsPaid.id]
      };

      setProfitDistributions(prev => [...prev, newDistribution]);
    }

    // Always update project status in state
    setProjects(prevProjects => prevProjects.map(p => {
      if (p.id === projId) {
        return { ...p, estadoFacturacion: newStatus };
      }
      return p;
    }));
    
    setIsMarkAsPaidOpen(false);
    setInvoiceToMarkAsPaid(null);
    showToast('Factura marcada como pagada');
  };

  // CRUD actions for Expenses
  const handleAddOrEditExpenseSubmit = (formData: {
    tipo: 'Operativo' | 'Proveedor por Proyecto';
    proyectoId: string | null;
    categoriaId: ExpenseCategory;
    concepto: string;
    subtotal: number;
    iva: number;
    isrRetenido: number;
    ivaRetenido: number;
    cuentaOrigen: 'San' | 'Ale' | 'Empresa';
    esReembolsable: boolean;
    tieneFactura: boolean;
    metodoPago: 'Transferencia' | 'Tarjeta de Débito' | 'Efectivo';
    estatusPago: 'Pagado' | 'Pendiente';
    fecha: string;
  }) => {
    const calculatedTotal = Number(
      (formData.subtotal + formData.iva - formData.isrRetenido - formData.ivaRetenido).toFixed(2)
    );

    if (selectedExpense) {
      // Edit Mode
      setExpenses(prev => prev.map(exp => 
        exp.id === selectedExpense.id 
          ? { ...exp, ...formData, total: calculatedTotal } 
          : exp
      ));
      showToast('Cambios guardados');
    } else {
      // Add Mode
      const newExpense: Expense = {
        id: `gasto_${Math.random().toString(36).substr(2, 9)}`,
        ...formData,
        total: calculatedTotal
      };
      setExpenses(prev => [newExpense, ...prev]);
      showToast('Guardado con éxito');
    }
    setIsExpenseModalOpen(false);
    setSelectedExpense(null);
  };

  const handleDeleteExpense = (id: string) => {
    const expense = expenses.find(exp => exp.id === id);
    if (!expense) return;

    // Check if there is a linked Por Impactar record
    const linkedRecord = (porImpactar || []).find(rec => rec.gastoIdGenerado === id);

    setExpenseToDelete(expense);
    setPorImpactarToRevert(linkedRecord || null);
    setIsDeleteExpenseModalOpen(true);
  };

  const handleConfirmDeleteExpense = (expenseId: string, revertPorImpactarId: string | null) => {
    setExpenses(prev => prev.filter(exp => exp.id !== expenseId));

    if (revertPorImpactarId) {
      setPorImpactar(prev => prev.map(rec => 
        rec.id === revertPorImpactarId
          ? {
              ...rec,
              estatus: 'pendiente',
              proyectoDestinoId: null,
              gastoIdGenerado: null
            }
          : rec
      ));
    }

    setIsDeleteExpenseModalOpen(false);
    setExpenseToDelete(null);
    setPorImpactarToRevert(null);
  };

  // CRUD and Resolve actions for Por Impactar
  const handleAddOrEditPorImpactarSubmit = (formData: {
    descripcion: string;
    monto: number;
    socioResponsable: 'San' | 'Ale' | 'Empresa';
    proyectoOrigenId: string | null;
    fecha: string;
  }) => {
    if (selectedPorImpactar) {
      // Edit mode
      setPorImpactar(prev => prev.map(rec => 
        rec.id === selectedPorImpactar.id 
          ? { ...rec, ...formData } 
          : rec
      ));
      showToast('Cambios guardados');
    } else {
      // Add mode
      const newRecord: PorImpactar = {
        id: `imp_${Math.random().toString(36).substr(2, 9)}`,
        descripcion: formData.descripcion,
        monto: formData.monto,
        socioResponsable: formData.socioResponsable,
        proyectoOrigenId: formData.proyectoOrigenId,
        fecha: formData.fecha,
        estatus: 'pendiente',
        proyectoDestinoId: null,
        gastoIdGenerado: null
      };
      setPorImpactar(prev => [newRecord, ...prev]);
      showToast('Guardado con éxito');
    }
    setIsPorImpactarFormOpen(false);
    setSelectedPorImpactar(null);
  };

  const handleDeletePorImpactar = (id: string) => {
    const record = porImpactar.find(rec => rec.id === id);
    if (!record) return;
    setPorImpactarToDelete(record);
    setIsDeletePorImpactarModalOpen(true);
  };

  const handleConfirmDeletePorImpactar = (id: string) => {
    setPorImpactar(prev => prev.filter(rec => rec.id !== id));
    setIsDeletePorImpactarModalOpen(false);
    setPorImpactarToDelete(null);
    showToast('Eliminado con éxito');
  };

  const handleOpenAddPorImpactarModal = () => {
    setSelectedPorImpactar(null);
    setIsPorImpactarFormOpen(true);
  };

  const handleOpenEditPorImpactarModal = (record: PorImpactar) => {
    setSelectedPorImpactar(record);
    setIsPorImpactarFormOpen(true);
  };

  const handleOpenResolvePorImpactarModal = (record: PorImpactar) => {
    setPorImpactarToResolve(record);
    setIsPorImpactarResolverOpen(true);
  };

  /**
   * Resolves a pending Por Impactar record by converting it to a real Expense
   * and updating the original record status to 'resuelto'.
   */
  const handleResolvePorImpactar = (
    recordId: string,
    expenseData: {
      proyectoId: string;
      categoriaId: ExpenseCategory;
      concepto: string;
      subtotal: number;
      iva: number;
      isrRetenido: number;
      ivaRetenido: number;
      cuentaOrigen: 'San' | 'Ale' | 'Empresa';
      esReembolsable: boolean;
      tieneFactura: boolean;
      metodoPago: 'Transferencia' | 'Tarjeta de Débito' | 'Efectivo';
      estatusPago: 'Pagado' | 'Pendiente';
      fecha: string;
    }
  ) => {
    const newExpenseId = `gasto_${Math.random().toString(36).substr(2, 9)}`;
    const calculatedTotal = Number(
      (expenseData.subtotal + expenseData.iva - expenseData.isrRetenido - expenseData.ivaRetenido).toFixed(2)
    );

    const newExpense: Expense = {
      id: newExpenseId,
      tipo: 'Proveedor por Proyecto',
      proyectoId: expenseData.proyectoId,
      categoriaId: expenseData.categoriaId,
      concepto: expenseData.concepto,
      subtotal: expenseData.subtotal,
      iva: expenseData.iva,
      isrRetenido: expenseData.isrRetenido,
      ivaRetenido: expenseData.ivaRetenido,
      total: calculatedTotal,
      cuentaOrigen: expenseData.cuentaOrigen,
      esReembolsable: expenseData.esReembolsable,
      tieneFactura: expenseData.tieneFactura,
      metodoPago: expenseData.metodoPago,
      estatusPago: expenseData.estatusPago,
      fecha: expenseData.fecha
    };

    // Add as a real Expense
    setExpenses(prev => [newExpense, ...prev]);

    // Set Por Impactar record as resolved
    setPorImpactar(prev => prev.map(rec => 
      rec.id === recordId 
        ? {
            ...rec,
            estatus: 'resuelto',
            proyectoDestinoId: expenseData.proyectoId,
            gastoIdGenerado: newExpenseId
          }
        : rec
    ));

    setIsPorImpactarResolverOpen(false);
    setPorImpactarToResolve(null);
    showToast('Gasto registrado correctamente');
  };

  const handleOpenAddExpenseModal = () => {
    setSelectedExpense(null);
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpenseModal = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsExpenseModalOpen(true);
  };

  // CRUD actions for Provider Payments
  const handleAddOrEditProviderPaymentSubmit = (formData: {
    proyectoId: string;
    proveedor: string;
    subtotal: number;
    iva: number;
    isrRetenido: number;
    ivaRetenido: number;
    total: number;
    tieneFactura: boolean;
    estatus: 'Pagado' | 'Pendiente';
    fecha: string;
    fecha_vencimiento?: string;
  }) => {
    if (selectedProviderPayment) {
      // Edit mode
      setProviderPayments(prev => prev.map(p => 
        p.id === selectedProviderPayment.id 
          ? { ...p, ...formData } 
          : p
      ));
      showToast('Cambios guardados');
    } else {
      // Add mode
      const newPayment: ProviderPayment = {
        id: `ppay_${Math.random().toString(36).substr(2, 9)}`,
        ...formData
      };
      setProviderPayments(prev => [newPayment, ...prev]);
      showToast('Guardado con éxito');
    }
    setIsProviderPaymentModalOpen(false);
    setSelectedProviderPayment(null);
  };

  const handleDeleteProviderPayment = (id: string) => {
    const payment = providerPayments.find(p => p.id === id);
    if (!payment) return;
    setProviderPaymentToDelete(payment);
    setIsDeleteProviderPaymentModalOpen(true);
  };

  const handleConfirmDeleteProviderPayment = (id: string) => {
    setProviderPayments(prev => prev.filter(p => p.id !== id));
    setIsDeleteProviderPaymentModalOpen(false);
    setProviderPaymentToDelete(null);
    showToast('Eliminado con éxito');
  };

  const handleOpenAddProviderPaymentModal = () => {
    setSelectedProviderPayment(null);
    setIsProviderPaymentModalOpen(true);
  };

  const handleOpenEditProviderPaymentModal = (payment: ProviderPayment) => {
    setSelectedProviderPayment(payment);
    setIsProviderPaymentModalOpen(true);
  };

  // CRUD actions for Third Party Payments
  const handleAddOrEditThirdPartyPaymentSubmit = (formData: {
    proyectoId: string | null;
    concepto: string;
    saldoOriginal: number;
    comisionIntermediario: number;
    gananciaIxAdicional: number;
    montoADepositar: number;
    estatusPago: 'Pagado' | 'Pendiente';
    fecha: string;
  }) => {
    if (selectedThirdPartyPayment) {
      // Edit mode
      setThirdPartyPayments(prev => prev.map(p => 
        p.id === selectedThirdPartyPayment.id 
          ? { ...p, ...formData } 
          : p
      ));
      showToast('Cambios guardados');
    } else {
      // Add mode
      const newPayment: ThirdPartyPayment = {
        id: `tpay_${Math.random().toString(36).substr(2, 9)}`,
        ...formData,
        dinero_recibido: false,
        fecha_recibido: null
      };
      setThirdPartyPayments(prev => [newPayment, ...prev]);
      showToast('Guardado con éxito');
    }
    setIsThirdPartyPaymentModalOpen(false);
    setSelectedThirdPartyPayment(null);
  };

  const handleDeleteThirdPartyPayment = (id: string) => {
    const payment = thirdPartyPayments.find(p => p.id === id);
    if (!payment) return;
    setThirdPartyPaymentToDelete(payment);
    setIsDeleteThirdPartyPaymentModalOpen(true);
  };

  const handleConfirmDeleteThirdPartyPayment = (id: string) => {
    setThirdPartyPayments(prev => prev.filter(p => p.id !== id));
    setIsDeleteThirdPartyPaymentModalOpen(false);
    setThirdPartyPaymentToDelete(null);
    showToast('Eliminado con éxito');
  };

  const handleMarkThirdPartyPaymentAsPaid = (id: string) => {
    const payment = thirdPartyPayments.find(p => p.id === id);
    if (!payment) return;

    if (!payment.proyectoId) {
      // Rule 1: No project
      if (!payment.dinero_recibido) {
        showToast("No puedes dispersar este pago — el solicitante todavía no te ha entregado el dinero. Márcalo como 'Recibido' primero.");
        return;
      }
    } else {
      // Rule 2: Has project
      const proj = projects.find(p => p.id === payment.proyectoId);
      const projName = proj ? proj.nombre : '';
      const billingStatus = calculateProjectBillingStatus(payment.proyectoId, invoices);
      if (billingStatus !== 'Pagado') {
        showToast(`No puedes dispersar este pago — el cliente del proyecto '${projName}' todavía no ha pagado todas sus facturas.`);
        return;
      }
    }

    setThirdPartyPayments(prev => prev.map(p => 
      p.id === id 
        ? { ...p, estatusPago: 'Pagado' } 
        : p
    ));
    showToast('Cambios guardados');
  };

  const handleConfirmMarkAsReceived = (fechaRecibido: string) => {
    if (!paymentToMarkAsReceived) return;
    setThirdPartyPayments(prev => prev.map(p => 
      p.id === paymentToMarkAsReceived.id 
        ? { ...p, dinero_recibido: true, fecha_recibido: fechaRecibido } 
        : p
    ));
    setIsRecibirDineroOpen(false);
    setPaymentToMarkAsReceived(null);
    showToast('Dinero marcado como recibido');
  };

  const handleOpenAddThirdPartyPaymentModal = () => {
    setSelectedThirdPartyPayment(null);
    setIsThirdPartyPaymentModalOpen(true);
  };

  const handleOpenEditThirdPartyPaymentModal = (payment: ThirdPartyPayment) => {
    setSelectedThirdPartyPayment(payment);
    setIsThirdPartyPaymentModalOpen(true);
  };

  // Bóveda de IVA handlers
  const handleAddIvaWithdrawal = (withdrawalData: { concepto: string; monto: number; fecha: string }) => {
    const newWithdrawal: IvaWithdrawal = {
      id: `wit_${Math.random().toString(36).substr(2, 9)}`,
      ...withdrawalData
    };
    setIvaWithdrawals(prev => [newWithdrawal, ...prev]);
    showToast('Retiro de IVA registrado');
  };

  const handleDeleteIvaWithdrawal = (id: string) => {
    const withdrawal = ivaWithdrawals.find(w => w.id === id);
    if (!withdrawal) return;
    setIvaWithdrawalToDelete(withdrawal);
    setIsDeleteIvaWithdrawalModalOpen(true);
  };

  const handleConfirmDeleteIvaWithdrawal = (id: string) => {
    setIvaWithdrawals(prev => prev.filter(w => w.id !== id));
    setIsDeleteIvaWithdrawalModalOpen(false);
    setIvaWithdrawalToDelete(null);
    showToast('Retiro de IVA eliminado');
  };

  // Render placeholder module view (strictly following user constraints)
  const renderPlaceholderModule = (moduleName: string) => {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-white/40 dark:bg-[#0E1A16]/40 backdrop-blur-md border border-rocky-gray/30 dark:border-white/10 rounded-lg shadow-sm">
        <div className="w-12 h-12 rounded-full bg-elevated-gold/10 flex items-center justify-center text-elevated-gold mb-4">
          <Sparkles size={24} />
        </div>
        <h2 className="text-2xl font-serif font-light text-enchanted-green dark:text-light-ivory mb-2">
          Módulo de {moduleName}
        </h2>
        <p className="text-xs uppercase tracking-widest text-rose-linen dark:text-elevated-gold font-bold mb-4">
          Fase 2 · Próximamente
        </p>
        <p className="text-sm text-rocky-gray max-w-sm">
          Este módulo está reservado para la siguiente fase de desarrollo de IX Dashboard. El catálogo de clientes de la Fase 1 servirá de base para alimentar esta funcionalidad.
        </p>
      </div>
    );
  };

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'clientes':
        return (
          <ClientesList 
            clients={clients}
            onAddClick={handleOpenAddModal}
            onEditClick={handleOpenEditModal}
            onDeleteClick={handleDeleteClient}
          />
        );
      case 'proyectos':
        return (
          <ProyectosList
            projects={projects}
            clients={clients}
            invoices={invoices}
            expenses={expenses}
            providerPayments={providerPayments}
            profitDistributions={profitDistributions}
            porImpactar={porImpactar}
            thirdPartyPayments={thirdPartyPayments}
            onAddClick={handleOpenAddProjectModal}
            onEditClick={handleOpenEditProjectModal}
            onDeleteClick={handleDeleteProject}
          />
        );
      case 'facturacion':
        return (
          <FacturasList
            invoices={invoices}
            projects={projects}
            onAddClick={handleOpenAddInvoiceModal}
            onEditClick={handleOpenEditInvoiceModal}
            onDeleteClick={handleDeleteInvoice}
            onMarkAsPaidClick={handleOpenMarkAsPaidModal}
          />
        );
      case 'gastos':
        return (
          <GastosList
            expenses={expenses}
            projects={projects}
            onAddClick={handleOpenAddExpenseModal}
            onEditClick={handleOpenEditExpenseModal}
            onDeleteClick={handleDeleteExpense}
          />
        );
      case 'cuenta_juan_carlos':
        return (
          <CuentaJuanCarlos
            invoices={invoices}
            expenses={expenses}
            projects={projects}
          />
        );
      case 'pagos_proveedores':
        return (
          <ProviderPaymentsList
            payments={providerPayments}
            projects={projects}
            onAddClick={handleOpenAddProviderPaymentModal}
            onEditClick={handleOpenEditProviderPaymentModal}
            onDeleteClick={handleDeleteProviderPayment}
          />
        );
      case 'pagos_terceros':
        return (
          <ThirdPartyPaymentsList
            payments={thirdPartyPayments}
            projects={projects}
            onAddClick={handleOpenAddThirdPartyPaymentModal}
            onEditClick={handleOpenEditThirdPartyPaymentModal}
            onDeleteClick={handleDeleteThirdPartyPayment}
            onMarkAsPaidClick={handleMarkThirdPartyPaymentAsPaid}
            onMarkAsReceivedClick={(pay) => {
              setPaymentToMarkAsReceived(pay);
              setIsRecibirDineroOpen(true);
            }}
          />
        );
      case 'reparto_utilidades':
        return (
          <RepartoUtilidadesList
            distributions={profitDistributions}
            projects={projects}
            clients={clients}
          />
        );
      case 'por_impactar':
        return (
          <PorImpactarList
            records={porImpactar}
            projects={projects}
            onAddClick={handleOpenAddPorImpactarModal}
            onEditClick={handleOpenEditPorImpactarModal}
            onDeleteClick={handleDeletePorImpactar}
            onResolveClick={handleOpenResolvePorImpactarModal}
          />
        );
      case 'rentabilidad':
        return (
          <RentabilidadList
            projects={projects}
            clients={clients}
            invoices={invoices}
            providerPayments={providerPayments}
            expenses={expenses}
          />
        );
      case 'iva':
        return (
          <IvaPanel
            invoices={invoices}
            expenses={expenses}
            providerPayments={providerPayments}
          />
        );
      case 'reportes':
        return (
          <ReportesPanel
            projects={projects}
            clients={clients}
            invoices={invoices}
            expenses={expenses}
            providerPayments={providerPayments}
          />
        );
      case 'boveda_iva':
        return (
          <BovedaIva
            invoices={invoices}
            expenses={expenses}
            providerPayments={providerPayments}
            ivaWithdrawals={ivaWithdrawals}
            onAddWithdrawal={handleAddIvaWithdrawal}
            onDeleteWithdrawal={handleDeleteIvaWithdrawal}
          />
        );
      default:
        return null;
    }
  };

  // 1. Render Login page if not authenticated
  if (!isAuthenticated) {
    return (
      <Login 
        onLogin={handleLogin} 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
      />
    );
  }

  // 2. Render Main Application Dashboard
  return (
    <div className="h-screen w-screen overflow-hidden flex bg-light-ivory dark:bg-[#051A14] text-enchanted-green dark:text-light-ivory transition-colors duration-300 font-sans">
      {/* Sidebar navigation */}
      <Sidebar 
        activeModule={activeModule} 
        setActiveModule={setActiveModule}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <Header 
          onLogout={handleLogout}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onQuickGastoClick={handleOpenAddExpenseModal}
          onQuickFacturaClick={handleOpenAddInvoiceModal}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Active module dynamic loader */}
            {renderModuleContent()}
          </div>
        </main>
      </div>

      {/* Shared Client Form Modal (Add / Edit) */}
      <ClienteFormModal 
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleAddOrEditClientSubmit}
        initialData={selectedClient}
      />

      {/* Eliminar Cliente Modal */}
      <EliminarClienteModal
        isOpen={isDeleteClientModalOpen}
        onClose={() => {
          setIsDeleteClientModalOpen(false);
          setClientToDeleteId(null);
          setClientDeleteCounts(null);
        }}
        client={clients.find(c => c.id === clientToDeleteId) || null}
        counts={clientDeleteCounts}
        onConfirmDelete={handleConfirmDeleteClient}
      />

      {/* Shared Project Form Modal (Add / Edit) */}
      <ProyectoFormModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSubmit={handleAddOrEditProjectSubmit}
        initialData={selectedProject}
        clients={clients}
      />

      {/* Eliminar Proyecto Modal */}
      <EliminarProyectoModal
        isOpen={isDeleteProjectModalOpen}
        onClose={() => {
          setIsDeleteProjectModalOpen(false);
          setProjectToDeleteId(null);
          setProjectDeleteCounts(null);
        }}
        project={projects.find(p => p.id === projectToDeleteId) || null}
        counts={projectDeleteCounts}
        onConfirmDelete={handleConfirmDeleteProject}
      />

      {/* Shared Invoice Form Modal (Add / Edit) */}
      <FacturaFormModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onSubmit={handleAddOrEditInvoiceSubmit}
        initialData={selectedInvoice}
        projects={projects}
      />

      {/* Shared Expense Form Modal (Add / Edit) */}
      <GastoFormModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSubmit={handleAddOrEditExpenseSubmit}
        initialData={selectedExpense}
        projects={projects}
      />

      {/* Marcar como Pagada Date Picker Modal */}
      <MarcarPagadaModal
        isOpen={isMarkAsPaidOpen}
        onClose={() => setIsMarkAsPaidOpen(false)}
        onConfirm={handleConfirmMarkAsPaid}
        folio={invoiceToMarkAsPaid?.folio || ''}
        facturadoPor={invoiceToMarkAsPaid?.facturado_por}
      />

      {/* Eliminar Factura Modal (Con control de cascada y bloqueo) */}
      <EliminarFacturaModal
        isOpen={isDeleteInvoiceModalOpen}
        onClose={() => {
          setIsDeleteInvoiceModalOpen(false);
          setInvoiceToDelete(null);
        }}
        invoice={invoiceToDelete}
        invoices={invoices}
        profitDistributions={profitDistributions}
        onConfirmDelete={handleConfirmDeleteInvoice}
      />

      {/* Eliminar Gasto Modal */}
      <EliminarGastoModal
        isOpen={isDeleteExpenseModalOpen}
        onClose={() => {
          setIsDeleteExpenseModalOpen(false);
          setExpenseToDelete(null);
          setPorImpactarToRevert(null);
        }}
        expense={expenseToDelete}
        linkedPorImpactar={porImpactarToRevert}
        onConfirmDelete={handleConfirmDeleteExpense}
      />

      {/* Provider Payment Form Modal (Add / Edit) */}
      <ProviderPaymentFormModal
        isOpen={isProviderPaymentModalOpen}
        onClose={() => setIsProviderPaymentModalOpen(false)}
        onSubmit={handleAddOrEditProviderPaymentSubmit}
        initialData={selectedProviderPayment}
        projects={projects}
      />

      {/* Third Party Payment Form Modal (Add / Edit) */}
      <ThirdPartyPaymentFormModal
        isOpen={isThirdPartyPaymentModalOpen}
        onClose={() => setIsThirdPartyPaymentModalOpen(false)}
        onSubmit={handleAddOrEditThirdPartyPaymentSubmit}
        initialData={selectedThirdPartyPayment}
        projects={projects}
        invoices={invoices}
      />

      {/* Recibir Dinero Modal */}
      <RecibirDineroModal
        isOpen={isRecibirDineroOpen}
        onClose={() => {
          setIsRecibirDineroOpen(false);
          setPaymentToMarkAsReceived(null);
        }}
        onConfirm={handleConfirmMarkAsReceived}
        concepto={paymentToMarkAsReceived?.concepto || ''}
      />

      {/* Por Impactar Form Modal (Add / Edit) */}
      <PorImpactarFormModal
        isOpen={isPorImpactarFormOpen}
        onClose={() => {
          setIsPorImpactarFormOpen(false);
          setSelectedPorImpactar(null);
        }}
        onSubmit={handleAddOrEditPorImpactarSubmit}
        initialData={selectedPorImpactar}
        projects={projects}
      />

      {/* Por Impactar Resolver Modal */}
      <PorImpactarResolverModal
        isOpen={isPorImpactarResolverOpen}
        onClose={() => {
          setIsPorImpactarResolverOpen(false);
          setPorImpactarToResolve(null);
        }}
        onResolve={handleResolvePorImpactar}
        recordToResolve={porImpactarToResolve}
        projects={projects}
      />

      {/* Eliminar Pago a Proveedor Modal */}
      <EliminarPagoProveedorModal
        isOpen={isDeleteProviderPaymentModalOpen}
        onClose={() => {
          setIsDeleteProviderPaymentModalOpen(false);
          setProviderPaymentToDelete(null);
        }}
        payment={providerPaymentToDelete}
        onConfirmDelete={handleConfirmDeleteProviderPayment}
      />

      {/* Eliminar Pago a Tercero Modal */}
      <EliminarPagoTerceroModal
        isOpen={isDeleteThirdPartyPaymentModalOpen}
        onClose={() => {
          setIsDeleteThirdPartyPaymentModalOpen(false);
          setThirdPartyPaymentToDelete(null);
        }}
        payment={thirdPartyPaymentToDelete}
        onConfirmDelete={handleConfirmDeleteThirdPartyPayment}
      />

      {/* Eliminar Por Impactar Modal */}
      <EliminarPorImpactarModal
        isOpen={isDeletePorImpactarModalOpen}
        onClose={() => {
          setIsDeletePorImpactarModalOpen(false);
          setPorImpactarToDelete(null);
        }}
        record={porImpactarToDelete}
        onConfirmDelete={handleConfirmDeletePorImpactar}
      />

      {/* Eliminar Retiro de IVA Modal */}
      <EliminarRetiroIVAModal
        isOpen={isDeleteIvaWithdrawalModalOpen}
        onClose={() => {
          setIsDeleteIvaWithdrawalModalOpen(false);
          setIvaWithdrawalToDelete(null);
        }}
        withdrawal={ivaWithdrawalToDelete}
        onConfirmDelete={handleConfirmDeleteIvaWithdrawal}
      />
    </div>
  );
}
