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
import ProyectosList from './components/ProyectosList';
import ProyectoFormModal from './components/ProyectoFormModal';
import FacturasList from './components/FacturasList';
import FacturaFormModal from './components/FacturaFormModal';
import MarcarPagadaModal from './components/MarcarPagadaModal';
import EliminarFacturaModal from './components/EliminarFacturaModal';
import GastosList from './components/GastosList';
import GastoFormModal from './components/GastoFormModal';
import EliminarGastoModal from './components/EliminarGastoModal';
import ProviderPaymentsList from './components/ProviderPaymentsList';
import ProviderPaymentFormModal from './components/ProviderPaymentFormModal';
import ThirdPartyPaymentsList from './components/ThirdPartyPaymentsList';
import ThirdPartyPaymentFormModal from './components/ThirdPartyPaymentFormModal';
import RepartoUtilidadesList from './components/RepartoUtilidadesList';
import PorImpactarList from './components/PorImpactarList';
import PorImpactarFormModal from './components/PorImpactarFormModal';
import PorImpactarResolverModal from './components/PorImpactarResolverModal';
import RentabilidadList from './components/RentabilidadList';
import IvaPanel from './components/IvaPanel';
import ReportesPanel from './components/ReportesPanel';
import { Client, Project, Invoice, Expense, ExpenseCategory, ModuleId, ProviderPayment, ThirdPartyPayment, ProfitDistribution, PorImpactar } from './types';
import { getMexicoCityDate, getMexicoCityDateTimeString, calculateProjectBillingStatus } from './utils';
import { calculateProfitDistribution, calculateProfitDistributionForAmount } from './utils/profitDistribution';

export default function App() {
  // Authentication state (in memory for static phase)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('ix_auth') === 'true';
  });

  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('ix_theme') === 'dark';
  });

  // Sidebar toggle for mobile responsive layouts
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Active module state
  const [activeModule, setActiveModule] = useState<ModuleId>('clientes');

  // Clientes CRUD State (Persisted in localStorage for convenience, starts EMPTY as requested)
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('ix_clients');
    return saved ? JSON.parse(saved) : [];
  });

  // Proyectos CRUD State (Persisted in localStorage for convenience, starts EMPTY as requested)
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('ix_projects');
    return saved ? JSON.parse(saved) : [];
  });

  // Facturas CRUD State (Persisted in localStorage, starts EMPTY as requested)
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('ix_invoices');
    return saved ? JSON.parse(saved) : [];
  });

  // Gastos CRUD State (Persisted in localStorage, starts EMPTY as requested)
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('ix_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  // Pagos a Proveedores CRUD State (starts EMPTY as requested with auto-migration from legacy "monto")
  const [providerPayments, setProviderPayments] = useState<ProviderPayment[]>(() => {
    const saved = localStorage.getItem('ix_provider_payments');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => {
          if (item && typeof item === 'object' && !('subtotal' in item)) {
            const sub = item.monto || 0;
            const ivaVal = Number((sub * 0.16).toFixed(2));
            return {
              ...item,
              subtotal: sub,
              iva: ivaVal,
              isrRetenido: 0,
              ivaRetenido: 0,
              total: sub + ivaVal
            };
          }
          return item;
        });
      }
      return [];
    } catch (e) {
      return [];
    }
  });

  // Pagos a Terceros CRUD State (starts EMPTY as requested)
  const [thirdPartyPayments, setThirdPartyPayments] = useState<ThirdPartyPayment[]>(() => {
    const saved = localStorage.getItem('ix_third_party_payments');
    return saved ? JSON.parse(saved) : [];
  });

  // Reparto de Utilidades State (starts EMPTY as requested)
  const [profitDistributions, setProfitDistributions] = useState<ProfitDistribution[]>(() => {
    const saved = localStorage.getItem('ix_profit_distributions');
    return saved ? JSON.parse(saved) : [];
  });

  // Por Impactar CRUD State (starts EMPTY as requested, in memory & persisted)
  const [porImpactar, setPorImpactar] = useState<PorImpactar[]>(() => {
    const saved = localStorage.getItem('ix_por_impactar');
    return saved ? JSON.parse(saved) : [];
  });

  // Modal controls
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Por Impactar Modal controls
  const [isPorImpactarFormOpen, setIsPorImpactarFormOpen] = useState(false);
  const [selectedPorImpactar, setSelectedPorImpactar] = useState<PorImpactar | null>(null);
  const [isPorImpactarResolverOpen, setIsPorImpactarResolverOpen] = useState(false);
  const [porImpactarToResolve, setPorImpactarToResolve] = useState<PorImpactar | null>(null);

  // Proyectos Modal controls
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

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

  // Apply dark mode theme class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ix_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ix_theme', 'light');
    }
  }, [darkMode]);

  // Handle local Auth persistence
  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('ix_auth', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.setItem('ix_auth', 'false');
  };

  // Sync clients with localStorage
  useEffect(() => {
    localStorage.setItem('ix_clients', JSON.stringify(clients));
  }, [clients]);

  // Sync projects with localStorage
  useEffect(() => {
    localStorage.setItem('ix_projects', JSON.stringify(projects));
  }, [projects]);

  // Sync invoices with localStorage
  useEffect(() => {
    localStorage.setItem('ix_invoices', JSON.stringify(invoices));
  }, [invoices]);

  // Sync expenses with localStorage
  useEffect(() => {
    localStorage.setItem('ix_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // Sync providerPayments with localStorage
  useEffect(() => {
    localStorage.setItem('ix_provider_payments', JSON.stringify(providerPayments));
  }, [providerPayments]);

  // Sync thirdPartyPayments with localStorage
  useEffect(() => {
    localStorage.setItem('ix_third_party_payments', JSON.stringify(thirdPartyPayments));
  }, [thirdPartyPayments]);

  // Sync profitDistributions with localStorage
  useEffect(() => {
    localStorage.setItem('ix_profit_distributions', JSON.stringify(profitDistributions));
  }, [profitDistributions]);

  // Sync porImpactar with localStorage
  useEffect(() => {
    localStorage.setItem('ix_por_impactar', JSON.stringify(porImpactar));
  }, [porImpactar]);

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
    }
    setIsFormModalOpen(false);
    setSelectedClient(null);
  };

  const handleDeleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    // When deleting a client, we also delete projects of this client to keep data integrity
    setProjects(prev => prev.filter(p => p.clienteId !== id));
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
    }
    setIsProjectModalOpen(false);
    setSelectedProject(null);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    // Cascade delete invoices associated with this project
    setInvoices(prev => prev.filter(inv => inv.proyectoId !== id));
    // Cascade delete expenses associated with this project
    setExpenses(prev => prev.filter(exp => exp.proyectoId !== id));
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
        fechaEmision: formData.fechaEmision
      };
      setInvoices(prev => [newInvoice, ...prev]);
    }
    setIsInvoiceModalOpen(false);
    setSelectedInvoice(null);
  };

  const handleDeleteInvoice = (id: string) => {
    const inv = invoices.find(i => i.id === id);
    if (!inv) return;
    
    // Check if the project has any profit distributions at all
    const projId = inv.proyectoId;
    const projectDists = profitDistributions.filter(pd => pd.proyectoId === projId);

    if (projectDists.length === 0) {
      // 1. Delete directly from state, no modal
      const updatedInvoices = invoices.filter(i => i.id !== id);
      setInvoices(updatedInvoices);

      // 2. Always recalculate billing status of the project after this change
      const newStatus = calculateProjectBillingStatus(projId, updatedInvoices);
      setProjects(prevProjects => prevProjects.map(p => 
        p.id === projId ? { ...p, estadoFacturacion: newStatus } : p
      ));
      return;
    }

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
    
    // 5. If project is in state "Pagado", perform incremental calculation
    if (newStatus === 'Pagado') {
      const projectDistributions = profitDistributions.filter(pd => pd.proyectoId === projId);
      const lastDistribution = projectDistributions[projectDistributions.length - 1];

      const projectInvoices = newInvoices.filter(inv => inv.proyectoId === projId);
      const total_facturas_actual = projectInvoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0);

      const projectProviderPayments = providerPayments.filter(pay => pay.proyectoId === projId);
      const total_proveedor_actual = projectProviderPayments.reduce((sum, pay) => sum + (pay.subtotal || 0), 0);

      const facturaIdsYaContempladas = new Set(projectDistributions.flatMap(pd => pd.facturaIdsNuevas || []));
      const prev_facturas_acumulado = projectInvoices
        .filter(inv => facturaIdsYaContempladas.has(inv.id))
        .reduce((sum, inv) => sum + (inv.subtotal || 0), 0);

      const prev_proveedor_acumulado = lastDistribution && lastDistribution.proveedor_subtotal_acumulado !== undefined
        ? lastDistribution.proveedor_subtotal_acumulado
        : 0;

      const delta_facturas = total_facturas_actual - prev_facturas_acumulado;
      const delta_proveedor = total_proveedor_actual - prev_proveedor_acumulado;
      const ganancia_total_delta = Number((delta_facturas - delta_proveedor).toFixed(2));

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
    } else {
      // Add Mode
      const newExpense: Expense = {
        id: `gasto_${Math.random().toString(36).substr(2, 9)}`,
        ...formData,
        total: calculatedTotal
      };
      setExpenses(prev => [newExpense, ...prev]);
    }
    setIsExpenseModalOpen(false);
    setSelectedExpense(null);
  };

  const handleDeleteExpense = (id: string) => {
    const expense = expenses.find(exp => exp.id === id);
    if (!expense) return;

    // Check if there is a linked Por Impactar record
    const linkedRecord = (porImpactar || []).find(rec => rec.gastoIdGenerado === id);

    if (linkedRecord) {
      setExpenseToDelete(expense);
      setPorImpactarToRevert(linkedRecord);
      setIsDeleteExpenseModalOpen(true);
    } else {
      setExpenses(prev => prev.filter(exp => exp.id !== id));
    }
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
    }
    setIsPorImpactarFormOpen(false);
    setSelectedPorImpactar(null);
  };

  const handleDeletePorImpactar = (id: string) => {
    setPorImpactar(prev => prev.filter(rec => rec.id !== id));
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
  }) => {
    if (selectedProviderPayment) {
      // Edit mode
      setProviderPayments(prev => prev.map(p => 
        p.id === selectedProviderPayment.id 
          ? { ...p, ...formData } 
          : p
      ));
    } else {
      // Add mode
      const newPayment: ProviderPayment = {
        id: `ppay_${Math.random().toString(36).substr(2, 9)}`,
        ...formData
      };
      setProviderPayments(prev => [newPayment, ...prev]);
    }
    setIsProviderPaymentModalOpen(false);
    setSelectedProviderPayment(null);
  };

  const handleDeleteProviderPayment = (id: string) => {
    setProviderPayments(prev => prev.filter(p => p.id !== id));
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
    } else {
      // Add mode
      const newPayment: ThirdPartyPayment = {
        id: `tpay_${Math.random().toString(36).substr(2, 9)}`,
        ...formData
      };
      setThirdPartyPayments(prev => [newPayment, ...prev]);
    }
    setIsThirdPartyPaymentModalOpen(false);
    setSelectedThirdPartyPayment(null);
  };

  const handleDeleteThirdPartyPayment = (id: string) => {
    setThirdPartyPayments(prev => prev.filter(p => p.id !== id));
  };

  const handleMarkThirdPartyPaymentAsPaid = (id: string) => {
    setThirdPartyPayments(prev => prev.map(p => 
      p.id === id 
        ? { ...p, estatusPago: 'Pagado' } 
        : p
    ));
  };

  const handleOpenAddThirdPartyPaymentModal = () => {
    setSelectedThirdPartyPayment(null);
    setIsThirdPartyPaymentModalOpen(true);
  };

  const handleOpenEditThirdPartyPaymentModal = (payment: ThirdPartyPayment) => {
    setSelectedThirdPartyPayment(payment);
    setIsThirdPartyPaymentModalOpen(true);
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

      {/* Shared Project Form Modal (Add / Edit) */}
      <ProyectoFormModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSubmit={handleAddOrEditProjectSubmit}
        initialData={selectedProject}
        clients={clients}
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
    </div>
  );
}
