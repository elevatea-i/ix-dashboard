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
import PagosTercerosModule from './components/PagosTercerosModule';
import ConceptoTerceroFormModal from './components/ConceptoTerceroFormModal';
import DepositoTerceroFormModal from './components/DepositoTerceroFormModal';
import EliminarConceptoTerceroModal from './components/EliminarConceptoTerceroModal';
import EliminarDepositoTerceroModal from './components/EliminarDepositoTerceroModal';
import AgregarTerceroModal from './components/AgregarTerceroModal';
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
import CerrarProyectoModal from './components/CerrarProyectoModal';
import { Client, Project, RepartoCierre, Invoice, Expense, ExpenseCategory, ModuleId, ProviderPayment, ThirdPartyPayment, Tercero, DepositoTercero, SaldoTercero, ProfitDistribution, PorImpactar, IvaWithdrawal } from './types';
import { useToast } from './components/Toast';
import { useAuth } from './lib/auth';
import { supabase } from './lib/supabase';
import { clientFromDb, clientToDb, expenseFromDb, expenseToDb, invoiceFromDb, invoiceToDb, ivaWithdrawalFromDb, ivaWithdrawalToDb, porImpactarFromDb, porImpactarToDb, profitDistributionFromDb, projectFromDb, projectToDb, providerPaymentFromDb, providerPaymentToDb, thirdPartyPaymentFromDb, thirdPartyPaymentToDb, terceroFromDb, terceroToDb, depositoTerceroFromDb, depositoTerceroToDb, saldoTerceroFromDb, repartoCierreFromDb } from './lib/mappers';

export default function App() {
  const { showToast } = useToast();
  const { session, profile, loading, signIn, signOut } = useAuth();
  const isAuthenticated = !!session;

  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleId>('clientes');

  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);

  const [providerPayments, setProviderPayments] = useState<ProviderPayment[]>([]);
  const [providerPaymentsLoading, setProviderPaymentsLoading] = useState(true);

  const [thirdPartyPayments, setThirdPartyPayments] = useState<ThirdPartyPayment[]>([]);
  const [thirdPartyPaymentsLoading, setThirdPartyPaymentsLoading] = useState(true);

  // Terceros (cuenta corriente)
  const [terceros, setTerceros] = useState<Tercero[]>([]);
  const [terceroActivo, setTerceroActivo] = useState<string | null>(null);
  const [depositosTerceros, setDepositosTerceros] = useState<DepositoTercero[]>([]);
  const [saldosTerceros, setSaldosTerceros] = useState<SaldoTercero[]>([]);

  const [profitDistributions, setProfitDistributions] = useState<ProfitDistribution[]>([]);

  const [porImpactar, setPorImpactar] = useState<PorImpactar[]>([]);
  const [porImpactarLoading, setPorImpactarLoading] = useState(true);

  const [ivaWithdrawals, setIvaWithdrawals] = useState<IvaWithdrawal[]>([]);
  const [ivaWithdrawalsLoading, setIvaWithdrawalsLoading] = useState(true);

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

  const [isPorImpactarFormOpen, setIsPorImpactarFormOpen] = useState(false);
  const [selectedPorImpactar, setSelectedPorImpactar] = useState<PorImpactar | null>(null);
  const [isPorImpactarResolverOpen, setIsPorImpactarResolverOpen] = useState(false);
  const [porImpactarToResolve, setPorImpactarToResolve] = useState<PorImpactar | null>(null);

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

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDeleteExpenseModalOpen, setIsDeleteExpenseModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [porImpactarToRevert, setPorImpactarToRevert] = useState<PorImpactar | null>(null);

  const [isProviderPaymentModalOpen, setIsProviderPaymentModalOpen] = useState(false);
  const [selectedProviderPayment, setSelectedProviderPayment] = useState<ProviderPayment | null>(null);

  const [isConceptoModalOpen, setIsConceptoModalOpen] = useState(false);
  const [selectedConcepto, setSelectedConcepto] = useState<ThirdPartyPayment | null>(null);
  const [isDepositoModalOpen, setIsDepositoModalOpen] = useState(false);
  const [selectedDeposito, setSelectedDeposito] = useState<DepositoTercero | null>(null);
  const [isAgregarTerceroModalOpen, setIsAgregarTerceroModalOpen] = useState(false);
  const [isDeleteConceptoModalOpen, setIsDeleteConceptoModalOpen] = useState(false);
  const [conceptoToDelete, setConceptoToDelete] = useState<ThirdPartyPayment | null>(null);
  const [isDeleteDepositoModalOpen, setIsDeleteDepositoModalOpen] = useState(false);
  const [depositoToDelete, setDepositoToDelete] = useState<DepositoTercero | null>(null);

  const [isMarkAsPaidOpen, setIsMarkAsPaidOpen] = useState(false);
  const [invoiceToMarkAsPaid, setInvoiceToMarkAsPaid] = useState<Invoice | null>(null);

  const [isDeleteInvoiceModalOpen, setIsDeleteInvoiceModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  const [isDeleteProviderPaymentModalOpen, setIsDeleteProviderPaymentModalOpen] = useState(false);
  const [providerPaymentToDelete, setProviderPaymentToDelete] = useState<ProviderPayment | null>(null);

  const [isDeletePorImpactarModalOpen, setIsDeletePorImpactarModalOpen] = useState(false);
  const [porImpactarToDelete, setPorImpactarToDelete] = useState<PorImpactar | null>(null);

  const [isDeleteIvaWithdrawalModalOpen, setIsDeleteIvaWithdrawalModalOpen] = useState(false);
  const [ivaWithdrawalToDelete, setIvaWithdrawalToDelete] = useState<IvaWithdrawal | null>(null);

  const [repartosCierre, setRepartosCierre] = useState<RepartoCierre[]>([]);
  const [isCerrarProyectoModalOpen, setIsCerrarProyectoModalOpen] = useState(false);
  const [proyectoToCerrar, setProyectoToCerrar] = useState<Project | null>(null);

  const isProjectClosed = (proyectoId: string | null | undefined): boolean => {
    if (!proyectoId) return false;
    return projects.find(p => p.id === proyectoId)?.cerrado === true;
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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

  useEffect(() => {
    supabase.from('proyectos').select('*').order('codigo', { ascending: false }).then(({ data, error }) => {
      if (error) {
        showToast(error.message, 'error');
      } else if (data) {
        setProjects(data.map(projectFromDb));
      }
      setProjectsLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  useEffect(() => {
    supabase.from('facturas').select('*').order('fecha_emision', { ascending: false }).then(({ data, error }) => {
      if (error) {
        showToast(error.message, 'error');
      } else if (data) {
        setInvoices(data.map(invoiceFromDb));
      }
      setInvoicesLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    supabase.from('repartos_utilidad').select('*').then(({ data, error }) => {
      if (error) {
        showToast(error.message, 'error');
      } else if (data) {
        setProfitDistributions(data.map(profitDistributionFromDb));
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    supabase.from('pagos_terceros').select('*').order('creado_en', { ascending: true }).then(({ data, error }) => {
      if (error) {
        showToast(error.message, 'error');
      } else if (data) {
        setThirdPartyPayments(data.map(thirdPartyPaymentFromDb));
      }
      setThirdPartyPaymentsLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    supabase.from('terceros').select('*').order('creado_en', { ascending: true }).then(({ data, error }) => {
      if (error) {
        showToast(error.message, 'error');
      } else if (data) {
        const mapped = data.map(terceroFromDb);
        setTerceros(mapped);
        if (mapped.length > 0 && !terceroActivo) {
          setTerceroActivo(mapped[0].id);
        }
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    supabase.from('depositos_terceros').select('*').order('fecha', { ascending: true }).then(({ data, error }) => {
      if (error) {
        showToast(error.message, 'error');
      } else if (data) {
        setDepositosTerceros(data.map(depositoTerceroFromDb));
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    supabase.from('saldos_terceros').select('*').then(({ data, error }) => {
      if (error) {
        showToast(error.message, 'error');
      } else if (data) {
        setSaldosTerceros(data.map(saldoTerceroFromDb));
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    supabase.from('repartos_cierre').select('*').then(({ data, error }) => {
      if (!error && data) {
        setRepartosCierre(data.map(repartoCierreFromDb));
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = async (email: string, password: string) => {
    await signIn(email, password);
  };

  const handleLogout = () => {
    signOut();
  };

  const handleAddOrEditClientSubmit = async (formData: { 
    nombre: string; 
    razonSocial: string; 
    rfc: string; 
    contacto: string; 
  }) => {
    if (selectedClient) {
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

  const handleAddOrEditProjectSubmit = async (formData: {
    nombre: string;
    codigo: string;
    clienteId: string;
    ejecutivoId: 'San' | 'Ale';
  }) => {
    if (selectedProject) {
      // Never update estadoFacturacion or fecha_creacion on edit
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

  const handleAddOrEditInvoiceSubmit = async (formData: {
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
    tieneFactura: boolean;
  }) => {
    const calculatedTotal = Number(
      (formData.subtotal + formData.iva - formData.retencionIsr - formData.retencionIva).toFixed(2)
    );

    const invoiceObj: Partial<Invoice> = {
      folio: formData.folio,
      proyectoId: formData.proyectoId,
      subtotal: formData.subtotal,
      iva: formData.iva,
      retencionIsr: formData.retencionIsr,
      retencionIva: formData.retencionIva,
      total: calculatedTotal,
      metodoPago: formData.metodoPago,
      complementoEmitido: formData.metodoPago === 'PPD' ? formData.complementoEmitido : undefined,
      fechaEmision: formData.fechaEmision,
      facturado_por: formData.facturado_por || 'IX',
      tieneFactura: formData.tieneFactura,
    };

    if (selectedInvoice) {
      const dbPayload = invoiceToDb(invoiceObj);
      const { data, error } = await supabase
        .from('facturas')
        .update(dbPayload)
        .eq('id', selectedInvoice.id)
        .select()
        .single();
      if (error) {
        showToast(error.message, 'error');
        return;
      }
      setInvoices(prev => prev.map(inv => inv.id === selectedInvoice.id ? invoiceFromDb(data) : inv));
      showToast('Cambios guardados');
    } else {
      const dbPayload = invoiceToDb(invoiceObj);
      const { data, error } = await supabase
        .from('facturas')
        .insert(dbPayload)
        .select()
        .single();
      if (error) {
        showToast(error.message, 'error');
        return;
      }
      setInvoices(prev => [invoiceFromDb(data), ...prev]);
      showToast('Guardado con éxito');
    }
    setIsInvoiceModalOpen(false);
    setSelectedInvoice(null);
  };

  const handleDeleteInvoice = (id: string) => {
    const inv = invoices.find(i => i.id === id);
    if (!inv) return;
    if (isProjectClosed(inv.proyectoId)) { showToast('Este proyecto está cerrado y no se puede modificar.', 'error'); return; }
    setInvoiceToDelete(inv);
    setIsDeleteInvoiceModalOpen(true);
  };

  const handleConfirmDeleteInvoice = async (invoiceId: string, _distributionIdsToDelete?: string[]) => {
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) return;
    const projId = inv.proyectoId;

    const { error } = await supabase.from('facturas').delete().eq('id', invoiceId);
    if (error) {
      showToast(error.message, 'error');
      return;
    }

    setInvoices(prev => prev.filter(i => i.id !== invoiceId));

    // Refresh project (trigger already recalculated estado_facturacion)
    const { data: freshProject } = await supabase
      .from('proyectos').select('*').eq('id', projId).single();
    if (freshProject) {
      setProjects(prev => prev.map(p => p.id === projId ? projectFromDb(freshProject) : p));
    }

    // Refresh repartos (trigger already deleted the one linked to this invoice)
    const { data: freshDists } = await supabase.from('repartos_utilidad').select('*');
    if (freshDists) {
      setProfitDistributions(freshDists.map(profitDistributionFromDb));
    }

    setIsDeleteInvoiceModalOpen(false);
    setInvoiceToDelete(null);
  };

  const handleOpenAddInvoiceModal = () => {
    setSelectedInvoice(null);
    setIsInvoiceModalOpen(true);
  };

  const handleOpenEditInvoiceModal = (invoice: Invoice) => {
    if (isProjectClosed(invoice.proyectoId)) { showToast('Este proyecto está cerrado y no se puede modificar.', 'error'); return; }
    setSelectedInvoice(invoice);
    setIsInvoiceModalOpen(true);
  };

  const handleOpenMarkAsPaidModal = (invoice: Invoice) => {
    if (isProjectClosed(invoice.proyectoId)) { showToast('Este proyecto está cerrado y no se puede modificar.', 'error'); return; }
    setInvoiceToMarkAsPaid(invoice);
    setIsMarkAsPaidOpen(true);
  };

  const handleConfirmMarkAsPaid = async (fechaPago: string) => {
    if (!invoiceToMarkAsPaid) return;
    const projId = invoiceToMarkAsPaid.proyectoId;

    const { data: updated, error } = await supabase
      .from('facturas')
      .update({ estado: 'pagada', fecha_pago: fechaPago })
      .eq('id', invoiceToMarkAsPaid.id)
      .select()
      .single();

    if (error) {
      showToast(error.message, 'error');
      return;
    }

    setInvoices(prev => prev.map(inv => inv.id === updated.id ? invoiceFromDb(updated) : inv));

    // Refresh project (trigger already recalculated estado_facturacion)
    const { data: freshProject } = await supabase
      .from('proyectos').select('*').eq('id', projId).single();
    if (freshProject) {
      setProjects(prev => prev.map(p => p.id === projId ? projectFromDb(freshProject) : p));
    }

    // Refresh repartos (trigger may have created a new one)
    const { data: freshDists } = await supabase.from('repartos_utilidad').select('*');
    if (freshDists) {
      setProfitDistributions(freshDists.map(profitDistributionFromDb));
    }

    setIsMarkAsPaidOpen(false);
    setInvoiceToMarkAsPaid(null);
    showToast('Factura marcada como pagada');
  };

  const handleRevertInvoiceToFacturada = async (invoiceId: string): Promise<boolean> => {
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) return false;
    if (isProjectClosed(inv.proyectoId)) { showToast('Este proyecto está cerrado y no se puede modificar.', 'error'); return false; }
    const projId = inv.proyectoId;

    const { data: updated, error } = await supabase
      .from('facturas')
      .update({ estado: 'facturada' })
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) {
      showToast(error.message, 'error');
      return false;
    }

    setInvoices(prev => prev.map(invItem => invItem.id === updated.id ? invoiceFromDb(updated) : invItem));

    // Refresh project (trigger already recalculated estado_facturacion)
    const { data: freshProject } = await supabase
      .from('proyectos').select('*').eq('id', projId).single();
    if (freshProject) {
      setProjects(prev => prev.map(p => p.id === projId ? projectFromDb(freshProject) : p));
    }

    // Refresh repartos (trigger already deleted the linked distribution)
    const { data: freshDists } = await supabase.from('repartos_utilidad').select('*');
    if (freshDists) {
      setProfitDistributions(freshDists.map(profitDistributionFromDb));
    }

    setIsInvoiceModalOpen(false);
    setSelectedInvoice(null);
    showToast('Factura revertida a Facturada');
    return true;
  };

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
    fechaPago: string;
  }) => {
    const calculatedTotal = Number(
      (formData.subtotal + formData.iva - formData.isrRetenido - formData.ivaRetenido).toFixed(2)
    );

    if (selectedExpense) {
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
    if (isProjectClosed(expense.proyectoId)) { showToast('Este proyecto está cerrado y no se puede modificar.', 'error'); return; }

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

  const handleAddOrEditPorImpactarSubmit = async (formData: {
    descripcion: string;
    monto: number;
    socioResponsable: 'San' | 'Ale' | 'Empresa';
    proyectoOrigenId: string | null;
    fecha: string;
  }) => {
    if (selectedPorImpactar) {
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
    if (isProjectClosed(expenseData.proyectoId)) { showToast('Este proyecto está cerrado y no se puede modificar.', 'error'); return; }
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
    if (isProjectClosed(expense.proyectoId)) { showToast('Este proyecto está cerrado y no se puede modificar.', 'error'); return; }
    setSelectedExpense(expense);
    setIsExpenseModalOpen(true);
  };

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
    fechaPago: string;
    fecha_vencimiento?: string;
    metodoPago?: 'PUE' | 'PPD';
    complementoEmitido?: boolean;
  }) => {
    if (selectedProviderPayment) {
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
    if (isProjectClosed(payment.proyectoId)) { showToast('Este proyecto está cerrado y no se puede modificar.', 'error'); return; }
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
    if (isProjectClosed(payment.proyectoId)) { showToast('Este proyecto está cerrado y no se puede modificar.', 'error'); return; }
    setSelectedProviderPayment(payment);
    setIsProviderPaymentModalOpen(true);
  };

  const refreshSaldosTerceros = async () => {
    const { data, error } = await supabase.from('saldos_terceros').select('*');
    if (!error && data) {
      setSaldosTerceros(data.map(saldoTerceroFromDb));
    }
  };

  const handleConceptoSubmit = async (
    formData: {
      concepto: string;
      facturaId: string | null;
      proyectoId: string | null;
      saldoOriginal: number;
      comisionIntermediario: number;
      gananciaIxAdicional: number;
      montoADepositar: number;
      statusFac: 'Disponible' | 'Por pagar';
      fecha: string | null;
    },
    editId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const payload = thirdPartyPaymentToDb({
      ...formData,
      terceroId: terceroActivo!,
    });
    delete payload.id;

    if (editId) {
      const { data, error } = await supabase
        .from('pagos_terceros')
        .update(payload)
        .eq('id', editId)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      setThirdPartyPayments(prev => prev.map(p => p.id === editId ? thirdPartyPaymentFromDb(data) : p));
      await refreshSaldosTerceros();
      showToast('Cambios guardados');
    } else {
      const { data, error } = await supabase
        .from('pagos_terceros')
        .insert(payload)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      setThirdPartyPayments(prev => [...prev, thirdPartyPaymentFromDb(data)]);
      await refreshSaldosTerceros();
      showToast('Concepto registrado');
    }
    setIsConceptoModalOpen(false);
    setSelectedConcepto(null);
    return { success: true };
  };

  const handleConfirmDeleteConcepto = async (id: string) => {
    const concepto = thirdPartyPayments.find(p => p.id === id);
    if (concepto && isProjectClosed(concepto.proyectoId)) {
      showToast('Este proyecto est\u00e1 cerrado y no se puede modificar.', 'error');
      setIsDeleteConceptoModalOpen(false);
      setConceptoToDelete(null);
      return;
    }
    const { error } = await supabase.from('pagos_terceros').delete().eq('id', id);
    if (error) {
      showToast(error.message, 'error');
      return;
    }
    setThirdPartyPayments(prev => prev.filter(p => p.id !== id));
    await refreshSaldosTerceros();
    setIsDeleteConceptoModalOpen(false);
    setConceptoToDelete(null);
    showToast('Concepto eliminado');
  };

  const handleDepositoSubmit = async (
    formData: { monto: number; fecha: string; nota: string | null },
    editId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const payload = depositoTerceroToDb({
      ...formData,
      terceroId: terceroActivo!,
    });
    delete payload.id;

    if (editId) {
      const { data, error } = await supabase
        .from('depositos_terceros')
        .update(payload)
        .eq('id', editId)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      setDepositosTerceros(prev => prev.map(d => d.id === editId ? depositoTerceroFromDb(data) : d));
      await refreshSaldosTerceros();
      showToast('Cambios guardados');
    } else {
      const { data, error } = await supabase
        .from('depositos_terceros')
        .insert(payload)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      setDepositosTerceros(prev => [...prev, depositoTerceroFromDb(data)]);
      await refreshSaldosTerceros();
      showToast('Depósito registrado');
    }
    setIsDepositoModalOpen(false);
    setSelectedDeposito(null);
    return { success: true };
  };

  const handleConfirmDeleteDeposito = async (id: string) => {
    const { error } = await supabase.from('depositos_terceros').delete().eq('id', id);
    if (error) {
      showToast(error.message, 'error');
      return;
    }
    setDepositosTerceros(prev => prev.filter(d => d.id !== id));
    await refreshSaldosTerceros();
    setIsDeleteDepositoModalOpen(false);
    setDepositoToDelete(null);
    showToast('Depósito eliminado');
  };

  const handleAddTercero = async (data: { nombre: string; intermediario: string | null }): Promise<{ success: boolean; error?: string }> => {
    const payload = terceroToDb(data);
    delete payload.id;
    const { data: row, error } = await supabase
      .from('terceros')
      .insert(payload)
      .select()
      .single();
    if (error) return { success: false, error: error.message };
    const newTercero = terceroFromDb(row);
    setTerceros(prev => [...prev, newTercero]);
    setTerceroActivo(newTercero.id);
    await refreshSaldosTerceros();
    setIsAgregarTerceroModalOpen(false);
    showToast('Tercero agregado');
    return { success: true };
  };

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
            repartosCierre={repartosCierre}
            onAddClick={handleOpenAddProjectModal}
            onEditClick={handleOpenEditProjectModal}
            onDeleteClick={handleDeleteProject}
            onCerrarClick={(project) => { setProyectoToCerrar(project); setIsCerrarProyectoModalOpen(true); }}
          />
        );
      case 'facturacion':
        return (
          <FacturasList
            invoices={invoices}
            projects={projects}
            clients={clients}
            loading={invoicesLoading}
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
          <PagosTercerosModule
            terceros={terceros}
            terceroActivo={terceroActivo}
            onTerceroChange={setTerceroActivo}
            saldos={saldosTerceros}
            conceptos={thirdPartyPayments.filter(c => terceroActivo ? c.terceroId === terceroActivo : false)}
            depositos={depositosTerceros.filter(d => terceroActivo ? d.terceroId === terceroActivo : false)}
            invoices={invoices}
            projects={projects}
            loading={thirdPartyPaymentsLoading}
            onAddConcepto={() => { setSelectedConcepto(null); setIsConceptoModalOpen(true); }}
            onEditConcepto={(c) => { if (isProjectClosed(c.proyectoId)) { showToast('Este proyecto está cerrado y no se puede modificar.', 'error'); return; } setSelectedConcepto(c); setIsConceptoModalOpen(true); }}
            onDeleteConcepto={(c) => { if (isProjectClosed(c.proyectoId)) { showToast('Este proyecto está cerrado y no se puede modificar.', 'error'); return; } setConceptoToDelete(c); setIsDeleteConceptoModalOpen(true); }}
            onAddDeposito={() => { setSelectedDeposito(null); setIsDepositoModalOpen(true); }}
            onEditDeposito={(d) => { setSelectedDeposito(d); setIsDepositoModalOpen(true); }}
            onDeleteDeposito={(d) => { setDepositoToDelete(d); setIsDeleteDepositoModalOpen(true); }}
            onAddTercero={() => setIsAgregarTerceroModalOpen(true)}
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
            thirdPartyPayments={thirdPartyPayments}
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
            thirdPartyPayments={thirdPartyPayments}
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

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-light-ivory dark:bg-[#051A14] text-enchanted-green dark:text-light-ivory transition-colors duration-300 font-sans">
      <Sidebar 
        activeModule={activeModule} 
        setActiveModule={setActiveModule}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isCollapsed={isSidebarCollapsed}
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header 
          onLogout={handleLogout}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onQuickGastoClick={handleOpenAddExpenseModal}
          onQuickFacturaClick={handleOpenAddInvoiceModal}
          profile={profile}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebarCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderModuleContent()}
          </div>
        </main>
      </div>

      <ClienteFormModal 
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleAddOrEditClientSubmit}
        initialData={selectedClient}
      />

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

      <ProyectoFormModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSubmit={handleAddOrEditProjectSubmit}
        initialData={selectedProject}
        clients={clients}
      />

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

      <FacturaFormModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onSubmit={handleAddOrEditInvoiceSubmit}
        onRevertToFacturada={handleRevertInvoiceToFacturada}
        initialData={selectedInvoice}
        projects={projects}
      />

      <GastoFormModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSubmit={handleAddOrEditExpenseSubmit}
        initialData={selectedExpense}
        projects={projects}
      />

      <MarcarPagadaModal
        isOpen={isMarkAsPaidOpen}
        onClose={() => setIsMarkAsPaidOpen(false)}
        onConfirm={handleConfirmMarkAsPaid}
        folio={invoiceToMarkAsPaid?.folio || ''}
        facturadoPor={invoiceToMarkAsPaid?.facturado_por}
      />

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

      <ProviderPaymentFormModal
        isOpen={isProviderPaymentModalOpen}
        onClose={() => setIsProviderPaymentModalOpen(false)}
        onSubmit={handleAddOrEditProviderPaymentSubmit}
        initialData={selectedProviderPayment}
        projects={projects}
      />

      <ConceptoTerceroFormModal
        isOpen={isConceptoModalOpen}
        onClose={() => { setIsConceptoModalOpen(false); setSelectedConcepto(null); }}
        onSubmit={handleConceptoSubmit}
        initialData={selectedConcepto}
        invoices={invoices}
        projects={projects}
        restanteActual={saldosTerceros.find(s => s.terceroId === terceroActivo)?.restante ?? 0}
        intermediarioNombre={terceros.find(t => t.id === terceroActivo)?.intermediario ?? null}
      />

      <DepositoTerceroFormModal
        isOpen={isDepositoModalOpen}
        onClose={() => { setIsDepositoModalOpen(false); setSelectedDeposito(null); }}
        onSubmit={handleDepositoSubmit}
        initialData={selectedDeposito}
        disponibleParaDepositar={saldosTerceros.find(s => s.terceroId === terceroActivo)?.restante ?? 0}
      />

      <AgregarTerceroModal
        isOpen={isAgregarTerceroModalOpen}
        onClose={() => setIsAgregarTerceroModalOpen(false)}
        onSubmit={handleAddTercero}
      />

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

      <EliminarPagoProveedorModal
        isOpen={isDeleteProviderPaymentModalOpen}
        onClose={() => {
          setIsDeleteProviderPaymentModalOpen(false);
          setProviderPaymentToDelete(null);
        }}
        payment={providerPaymentToDelete}
        onConfirmDelete={handleConfirmDeleteProviderPayment}
      />

      <EliminarConceptoTerceroModal
        isOpen={isDeleteConceptoModalOpen}
        onClose={() => { setIsDeleteConceptoModalOpen(false); setConceptoToDelete(null); }}
        concepto={conceptoToDelete}
        restanteActual={saldosTerceros.find(s => s.terceroId === terceroActivo)?.restante ?? 0}
        onConfirmDelete={handleConfirmDeleteConcepto}
      />

      <EliminarDepositoTerceroModal
        isOpen={isDeleteDepositoModalOpen}
        onClose={() => { setIsDeleteDepositoModalOpen(false); setDepositoToDelete(null); }}
        deposito={depositoToDelete}
        onConfirmDelete={handleConfirmDeleteDeposito}
      />

      <EliminarPorImpactarModal
        isOpen={isDeletePorImpactarModalOpen}
        onClose={() => {
          setIsDeletePorImpactarModalOpen(false);
          setPorImpactarToDelete(null);
        }}
        record={porImpactarToDelete}
        onConfirmDelete={handleConfirmDeletePorImpactar}
      />

      {proyectoToCerrar && (
        <CerrarProyectoModal
          isOpen={isCerrarProyectoModalOpen}
          onClose={() => { setIsCerrarProyectoModalOpen(false); setProyectoToCerrar(null); }}
          project={proyectoToCerrar}
          invoices={invoices}
          onSuccess={async () => {
            const { data: freshProj } = await supabase.from('proyectos').select('*').eq('id', proyectoToCerrar.id).single();
            if (freshProj) setProjects(prev => prev.map(p => p.id === proyectoToCerrar.id ? projectFromDb(freshProj) : p));
            const { data: freshDists } = await supabase.from('repartos_utilidad').select('*');
            if (freshDists) setProfitDistributions(freshDists.map(profitDistributionFromDb));
            const { data: freshCierre } = await supabase.from('repartos_cierre').select('*');
            if (freshCierre) setRepartosCierre(freshCierre.map(repartoCierreFromDb));
          }}
          showToast={showToast}
        />
      )}

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

