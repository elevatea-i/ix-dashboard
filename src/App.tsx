/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, BookOpen, CircleAlert as AlertCircle } from 'lucide-react';
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
import { useAuth } from './lib/auth';
import { supabase } from './lib/supabase';
import { clientFromDb, clientToDb, expenseFromDb, expenseToDb, ivaWithdrawalFromDb, ivaWithdrawalToDb, porImpactarFromDb, porImpactarToDb, projectFromDb, projectToDb, providerPaymentFromDb, providerPaymentToDb } from './lib/mappers';

export default function App() {
  const { showToast } = useToast();
  const { session, profile, loading, signIn, signOut } = useAuth();
  const isAuthenticated = !!session;

  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Sidebar toggle for mobile responsive layouts
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Active module state
  const [activeModule, setActiveModule] = useState<ModuleId>('clientes');

  // Clientes CRUD State (Starts EMPTY as requested)
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);

  // Proyectos CRUD State (Starts EMPTY as requested)
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  // Facturas CRUD State (Starts EMPTY as requested)
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Gastos CRUD State (Starts EMPTY as requested)
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);

  // Pagos a Proveedores CRUD State (starts EMPTY as requested)
  const [providerPayments, setProviderPayments] = useState<ProviderPayment[]>([]);
  const [providerPaymentsLoading, setProviderPaymentsLoading] = useState(true);

  // Pagos a Terceros CRUD State (starts EMPTY as requested)
  const [thirdPartyPayments, setThirdPartyPayments] = useState<ThirdPartyPayment[]>([]);

  // Reparto de Utilidades State (starts EMPTY as requested)
  const [profitDistributions, setProfitDistributions] = useState<ProfitDistribution[]>([]);

  // Por Impactar CRUD State (starts EMPTY as requested)
  const [porImpactar, setPorImpactar] = useState<PorImpactar[]>([]);
  const [porImpactarLoading, setPorImpactarLoading] = useState(true);

  // Bóveda de IVA Withdrawals State (starts EMPTY as requested)
  const [ivaWithdrawals, setIvaWithdrawals] = useState<IvaWithdrawal[]>([]);
  const [ivaWithdrawalsLoading, setIvaWithdrawalsLoading] = useState(true);

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

  // Fetch clients from Supabase on mount
  useEffect(() => {
    supabase.from('clientes').select('*').then(({ data, error }) => {
      if (error) {
        showToast(error.message, 'error');
      } else if (data) {
        setClients(data.map(clientFromDb));
      }
      setClientsLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch IVA withdrawals from Supabase on mount
  useEffect(() => {
    supabase.from('retiros_iva').select('*').then(({ data, error }) => {
      if (error) {
        showToast(error.message, 'error');
      } else if (data) {
        setIvaWithdrawals(data.map(ivaWithdrawalFromDb));
      }
      setIvaWithdrawalsLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch provider payments from Supabase on mount
  useEffect(() => {
    supabase.from('pagos_proveedores').select('*').order('fecha', { ascending: false }).then(({ data, error }) => {
      if (error) {
        showToast(error.message, 'error');
      } else if (data) {
        setProviderPayments(data.map(providerPaymentFromDb));
      }
      setProviderPaymentsLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch projects from Supabase on mount
  useEffect(() => {
    supabase.from('proyectos').select('*').order('fecha_creacion', { ascending: false }).then(({ data, error }) => {
      if (error) {
        showToast(error.message, 'error');
      } else if (data) {
        setProjects(data.map(projectFromDb));
      }
      setProjectsLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch gastos from Supabase on mount
  useEffect(() => {
    supabase.from('gastos').select('*').order('fecha', { ascending: false }).then(({ data, error }) => {
      if (error) {
        showToast(error.message, 'error');
      } else if (data) {
        setExpenses(data.map(expenseFromDb));
      }
      setExpensesLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch por_impactar from Supabase on mount
  useEffect(() => {
    supabase.from('por_impactar').select('*').order('fecha', { ascending: false }).then(({ data, error }) => {
      if (error) {
        showToast(error.message, 'error');
      } else if (data) {
        setPorImpactar(data.map(porImpactarFromDb));
      }
      setPorImpactarLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle Auth via Supabase
  const handleLogin = async (email: string, password: string) => {
    await signIn(email, password);
  };

  const handleLogout = () => {
    signOut();
  };

  // CRUD actions for Clients (Supabase)
  const handleAddOrEditClientSubmit = async (formData: { 
    nombre: string; 
    razonSocial: string; 
    rfc: string; 
    contacto: string; 
  }) => {
    if (selectedClient) {
      // Edit mode
      const updates = clientToDb(formData);
      const { data, error } = await supabase
        .from('clientes')
        .update(updates)
        .eq('id', selectedClient.id)
        .select()
        .single();
      if (error) {
        showToast(error.message, 'error');
        return;
      }
      const updated = clientFromDb(data);
      setClients(prev => prev.map(c => c.id === selectedClient.id ? updated : c));
      showToast('Cambios guardados');
    } else {
      // Add mode — no id, Postgres generates it
      const insertData = clientToDb(formData);
      delete insertData.id;
      delete insertData.created_at;
      const { data, error } = await supabase
        .from('clientes')
        .insert(insertData)
        .select()
        .single();
      if (error) {
        showToast(error.message, 'error');
        return;
      }
      const newClient = clientFromDb(data);
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

  const handleConfirmDeleteClient = async (id: string) => {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === '23503') {
        showToast('Este cliente tiene proyectos asociados. Elimina o reasigna sus proyectos antes de borrarlo.', 'error');
      } else {
        showToast(error.message, 'error');
      }
      return;
    }

    setClients(prev => prev.filter(c => c.id !== id));

    // Close and reset states
    setIsDeleteClientModalOpen(false);
    setClientToDeleteId(null);
    setClientDeleteCounts(null);

    showToast('Cliente eliminado');
  };

  const handleOpenAddModal = () => {
    setSelectedClient(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (client: Client) => {
    setSelectedClient(client);
    setIsFormModalOpen(true);
  };

  // CRUD actions for Projects (Supabase)
  const handleAddOrEditProjectSubmit = async (formData: {
    nombre: string;
    codigo: string;
    clienteId: string;
    ejecutivoId: 'San' | 'Ale';
  }) => {
    if (selectedProject) {
      // Edit mode — only fields that changed, never estadoFacturacion
      const updates = projectToDb(formData);
      delete updates.id;
      delete updates.estado_facturacion;
      delete updates.fecha_creacion;
      const { data, error } = await supabase
        .from('proyectos')
        .update(updates)
        .eq('id', selectedProject.id)
        .select()
        .single();
      if (error) {
        showToast(error.message, 'error');
        return;
      }
      const updated = projectFromDb(data);
      setProjects(prev => prev.map(p => p.id === selectedProject.id ? updated : p));
      showToast('Cambios guardados');
    } else {
      // Add mode — Postgres generates id, fecha_creacion, estado_facturacion
      const insertData = projectToDb(formData);
      delete insertData.id;
      delete insertData.estado_facturacion;
      delete insertData.fecha_creacion;
      const { data, error } = await supabase
        .from('proyectos')
        .insert(insertData)
        .select()
        .single();
      if (error) {
        showToast(error.message, 'error');
        return;
      }
      const newProject = projectFromDb(data);
      setProjects(prev => [newProject, ...prev]);
      showToast('Guardado con éxito');
    }
    setIsProjectModalOpen(false);
    setSelectedProject(null);
  };

  const handleDeleteProject = async (id: string) => {
    setProjectToDeleteId(id);
    setProjectDeleteCounts(null);
    setIsDeleteProjectModalOpen(true);

    const tables = ['facturas', 'gastos', 'pagos_proveedores', 'pagos_terceros', 'repartos_utilidad'] as const;
    const keys = ['invoices', 'expenses', 'providerPayments', 'thirdPartyPayments', 'profitDistributions'] as const;

    const results = await Promise.all(
      tables.map(table =>
        supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .eq('proyecto_id', id)
      )
    );

    const counts: Record<string, number> = {};
    results.forEach((res, i) => {
      counts[keys[i]] = res.count ?? 0;
    });

    setProjectDeleteCounts({
      invoices: counts.invoices,
      expenses: counts.expenses,
      providerPayments: counts.providerPayments,
      thirdPartyPayments: counts.thirdPartyPayments,
      profitDistributions: counts.profitDistributions
    });
  };

  const handleConfirmDeleteProject = async (id: string) => {
    const { error } = await supabase
      .from('proyectos')
      .delete()
      .eq('id', id);

    if (error) {
      showToast(error.message, 'error');
      return;
    }

    setProjects(prev => prev.filter(p => p.id !== id));

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

  // CRUD actions for Expenses (Supabase)
  const handleAddOrEditExpenseSubmit = async (formData: {
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
      // Edit mode
      const updates = expenseToDb({ ...formData, total: calculatedTotal });
      delete updates.id;
      const { data, error } = await supabase
        .from('gastos')
        .update(updates)
        .eq('id', selectedExpense.id)
        .select()
        .single();
      if (error) {
        showToast(error.message, 'error');
        return;
      }
      const updated = expenseFromDb(data);
      setExpenses(prev => prev.map(exp => exp.id === selectedExpense.id ? updated : exp));
      showToast('Cambios guardados');
    } else {
      // Add mode — no id, Postgres generates it
      const insertData = expenseToDb({ ...formData, total: calculatedTotal });
      delete insertData.id;
      const { data, error } = await supabase
        .from('gastos')
        .insert(insertData)
        .select()
        .single();
      if (error) {
        showToast(error.message, 'error');
        return;
      }
      const newExpense = expenseFromDb(data);
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

  const handleConfirmDeleteExpense = async (expenseId: string, revertPorImpactarId: string | null) => {
    const { error } = await supabase
      .from('gastos')
      .delete()
      .eq('id', expenseId);
    if (error) {
      showToast(error.message, 'error');
      return;
    }

    setExpenses(prev => prev.filter(exp => exp.id !== expenseId));

    // The DB trigger reverted the Por Impactar record — refetch it
    if (revertPorImpactarId) {
      const { data: reverted } = await supabase
        .from('por_impactar')
        .select('*')
        .eq('id', revertPorImpactarId)
        .maybeSingle();
      if (reverted) {
        const mapped = porImpactarFromDb(reverted);
        setPorImpactar(prev => prev.map(rec => rec.id === revertPorImpactarId ? mapped : rec));
      }
    }

    setIsDeleteExpenseModalOpen(false);
    setExpenseToDelete(null);
    setPorImpactarToRevert(null);
  };

  // CRUD and Resolve actions for Por Impactar
  const handleAddOrEditPorImpactarSubmit = async (formData: {
    descripcion: string;
    monto: number;
    socioResponsable: 'San' | 'Ale' | 'Empresa';
    proyectoOrigenId: string | null;
    fecha: string;
  }) => {
    if (selectedPorImpactar) {
      // Edit mode
      const updates = porImpactarToDb(formData);
      delete updates.id;
      const { data, error } = await supabase
        .from('por_impactar')
        .update(updates)
        .eq('id', selectedPorImpactar.id)
        .select()
        .single();
      if (error) {
        showToast(error.message, 'error');
        return;
      }
      const updated = porImpactarFromDb(data);
      setPorImpactar(prev => prev.map(rec => rec.id === selectedPorImpactar.id ? updated : rec));
      showToast('Cambios guardados');
    } else {
      // Add mode — no id, Postgres generates it; estatus defaults to 'pendiente'
      const insertData = porImpactarToDb(formData);
      delete insertData.id;
      const { data, error } = await supabase
        .from('por_impactar')
        .insert(insertData)
        .select()
        .single();
      if (error) {
        showToast(error.message, 'error');
        return;
      }
      const newRecord = porImpactarFromDb(data);
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

  const handleConfirmDeletePorImpactar = async (id: string) => {
    const { error } = await supabase
      .from('por_impactar')
      .delete()
      .eq('id', id);
    if (error) {
      showToast(error.message, 'error');
      return;
    }
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
  const handleResolvePorImpactar = async (
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
    const calculatedTotal = Number(
      (expenseData.subtotal + expenseData.iva - expenseData.isrRetenido - expenseData.ivaRetenido).toFixed(2)
    );

    const insertData = expenseToDb({
      tipo: 'Proveedor por Proyecto',
      ...expenseData,
      total: calculatedTotal,
    });
    delete insertData.id;

    const { data, error } = await supabase
      .from('gastos')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      showToast(error.message, 'error');
      return;
    }

    const newExpense = expenseFromDb(data);
    setExpenses(prev => [newExpense, ...prev]);

    // Update Por Impactar record in Supabase
    const { data: updatedRec, error: updateError } = await supabase
      .from('por_impactar')
      .update({
        estatus: 'resuelto',
        proyecto_destino_id: expenseData.proyectoId,
        gasto_id_generado: newExpense.id
      })
      .eq('id', recordId)
      .select()
      .single();

    if (updateError) {
      showToast(updateError.message, 'error');
      return;
    }

    const mappedRec = porImpactarFromDb(updatedRec);
    setPorImpactar(prev => prev.map(rec => rec.id === recordId ? mappedRec : rec));

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
  const handleAddOrEditProviderPaymentSubmit = async (formData: {
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
      const updates = providerPaymentToDb(formData);
      delete updates.id;
      const { data, error } = await supabase
        .from('pagos_proveedores')
        .update(updates)
        .eq('id', selectedProviderPayment.id)
        .select()
        .single();
      if (error) {
        showToast(error.message, 'error');
        return;
      }
      const updated = providerPaymentFromDb(data);
      setProviderPayments(prev => prev.map(p => p.id === selectedProviderPayment.id ? updated : p));
      showToast('Cambios guardados');
    } else {
      // Add mode — no id, Postgres generates it
      const insertData = providerPaymentToDb(formData);
      delete insertData.id;
      const { data, error } = await supabase
        .from('pagos_proveedores')
        .insert(insertData)
        .select()
        .single();
      if (error) {
        showToast(error.message, 'error');
        return;
      }
      const newPayment = providerPaymentFromDb(data);
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

  const handleConfirmDeleteProviderPayment = async (id: string) => {
    const { error } = await supabase
      .from('pagos_proveedores')
      .delete()
      .eq('id', id);
    if (error) {
      showToast(error.message, 'error');
      return;
    }
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

  // Bóveda de IVA handlers (Supabase)
  const handleAddIvaWithdrawal = async (withdrawalData: { concepto: string; monto: number; fecha: string }) => {
    const insertData = ivaWithdrawalToDb(withdrawalData);
    delete insertData.id;
    const { data, error } = await supabase
      .from('retiros_iva')
      .insert(insertData)
      .select()
      .single();
    if (error) {
      showToast(error.message, 'error');
      return;
    }
    const newWithdrawal = ivaWithdrawalFromDb(data);
    setIvaWithdrawals(prev => [newWithdrawal, ...prev]);
    showToast('Retiro de IVA registrado');
  };

  const handleDeleteIvaWithdrawal = (id: string) => {
    const withdrawal = ivaWithdrawals.find(w => w.id === id);
    if (!withdrawal) return;
    setIvaWithdrawalToDelete(withdrawal);
    setIsDeleteIvaWithdrawalModalOpen(true);
  };

  const handleConfirmDeleteIvaWithdrawal = async (id: string) => {
    const { error } = await supabase
      .from('retiros_iva')
      .delete()
      .eq('id', id);
    if (error) {
      showToast(error.message, 'error');
      return;
    }
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
            loading={clientsLoading}
            onAddClick={handleOpenAddModal}
            onEditClick={handleOpenEditModal}
            onDeleteClick={handleDeleteClient}
          />
        );
      case 'proyectos':
        return (
          <ProyectosList
            projects={projects}
            loading={projectsLoading}
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
            loading={expensesLoading}
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
            loading={providerPaymentsLoading}
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
            loading={porImpactarLoading}
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
            loading={ivaWithdrawalsLoading}
            onAddWithdrawal={handleAddIvaWithdrawal}
            onDeleteWithdrawal={handleDeleteIvaWithdrawal}
          />
        );
      default:
        return null;
    }
  };

  // 1. Render Login page if not authenticated (show spinner while checking session)
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-light-ivory dark:bg-[#051A14]">
        <div className="animate-pulse text-enchanted-green dark:text-light-ivory text-sm tracking-wide">
          Cargando…
        </div>
      </div>
    );
  }

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
          profile={profile}
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
