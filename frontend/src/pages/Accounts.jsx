import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus, Calendar, Trash2, Edit2,
  Receipt, Truck, X, Check,
  Loader2, AlertTriangle, CheckCircle, FileText,
  ChevronRight, ChevronDown, Briefcase, Palette, Wallet
} from 'lucide-react';
import Select from '../components/UI/Select';
import { Table, TableHead, Th, TableBody, TableRow, Td } from '../components/UI/Table';
import { FilterBar, FilterRow, SearchInput, FilterSelect } from '../components/UI/SearchFilterBar';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axiosConfig';
import ConfirmModal from '../components/Modals/ConfirmModal';
import PdfModal from '../components/Modals/PdfModal';
import AccountFormModal from '../components/Modals/AccountFormModal';
import Button from '../components/UI/Button';
import EmptyState from '../components/UI/EmptyState';
import { useToast } from '../hooks/useToast';
import { extractError } from '../utils/extractError';
import Breadcrumb from '../components/Layout/Breadcrumb';
import { fetchClients, fetchAccounts, fetchInvoices, fetchServices, fetchMaterials, QK } from '../api/queries';

const Accounts = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('cliente');
  const queryClient = useQueryClient();
  const addToast = useToast();

  // --- CAchÉ: 5 queries en paralelo ---
  const { data: clients = [] } = useQuery({ queryKey: QK.clients, queryFn: fetchClients });
  const { data: allAccounts = [], isLoading: loadingAccounts } = useQuery({ queryKey: QK.accounts, queryFn: fetchAccounts });
  const { data: invoices = [] } = useQuery({ queryKey: QK.invoices, queryFn: fetchInvoices });
  const { data: services = [] } = useQuery({ queryKey: QK.services(), queryFn: () => fetchServices(null) });
  const { data: materials = [] } = useQuery({ queryKey: QK.materials, queryFn: fetchMaterials });
  const loading = loadingAccounts;

  // --- ESTADOS DE UI Y FILTROS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(clientId || '');
  const [activeTab, setActiveTab] = useState('Todas');
  const [openClients, setOpenClients] = useState({});
  const [loadingAction, setLoadingAction] = useState(false);
  const [loadingId, setLoadingId] = useState(null);

  // --- ESTADOS DEL MODAL DE FORMULARIO ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    client_id: '',
    description: '',
    start_date: '',
    end_date: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});

  // --- MODALES DE APOYO ---
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  // --- DROPDOWN FACTURA ---
  const [openInvoiceMenu, setOpenInvoiceMenu] = useState(null);
  const [invoiceMenuPos, setInvoiceMenuPos] = useState({ top: 0, right: 0 });

  const openInvoiceDropdown = (e, accountId) => {
    e.stopPropagation();
    if (openInvoiceMenu === accountId) { setOpenInvoiceMenu(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setInvoiceMenuPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    setOpenInvoiceMenu(accountId);
  };

  useEffect(() => {
    if (!openInvoiceMenu) return;
    const close = () => setOpenInvoiceMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openInvoiceMenu]);

  // sync clientId URL param
  useEffect(() => {
    if (clientId) setSelectedClient(clientId.toString());
  }, [clientId]);


  // --- UTILIDAD: FORMATEAR MONEDA ---
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  // --- UTILIDAD: FECHA CORTA (mobile) ---
  const formatShortDate = (dateStr) => {
    const [, month, day] = dateStr.split('-');
    const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return `${parseInt(day)} ${months[parseInt(month) - 1]}`;
  };

  // --- FILTRADO LOCAL ---
  const filteredAccounts = useMemo(() => {
    return allAccounts.filter(account => {
      const cliente = clients.find(c => c.id === account.client_id);
      const matchesCliente = !selectedClient || account.client_id.toString() === selectedClient;
      const matchesSearch = !searchTerm ||
        (cliente?.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (account.description?.toLowerCase().includes(searchTerm.toLowerCase()));

      const hasInvoice = invoices.some(i => i.service_account_id === account.id);
      const hasServices = services.some(s => s.service_account_id === account.id);

      let matchesTab = true;
      if (activeTab === 'Pendientes') matchesTab = !hasInvoice && hasServices;
      else if (activeTab === 'Facturadas') matchesTab = hasInvoice;
      else if (activeTab === 'Sin Movimientos') matchesTab = !hasInvoice && !hasServices;

      return matchesCliente && matchesSearch && matchesTab;
    });
  }, [allAccounts, selectedClient, searchTerm, clients, invoices, services, activeTab]);

  // --- AGRUPAMIENTO POR CLIENTE ---
  const groupedAccounts = useMemo(() => {
    const groups = {};
    filteredAccounts.forEach(account => {
      const client = clients.find(c => c.id === account.client_id);
      const clientName = client?.name || 'Cliente Particular';
      if (!groups[clientName]) groups[clientName] = [];
      groups[clientName].push(account);
    });
    return groups;
  }, [filteredAccounts, clients]);

  const toggleClient = (clientName) => {
    setOpenClients(prev => ({ ...prev, [clientName]: !prev[clientName] }));
  };

  // --- MANEJO DE FORMULARIO ---
  const handleOpenModal = (account = null) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        client_id: account.client_id,
        description: account.description,
        start_date: account.start_date,
        end_date: account.end_date,
      });
    } else {
      setEditingAccount(null);
      setFormData({
        client_id: clientId || '',
        description: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
      });
    }
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSaveAccount = async () => {
    if (loadingAction) return;
    const errors = {};
    if (!formData.description?.trim()) errors.description = 'La descripción de la cuenta es obligatoria';
    if (!formData.client_id) errors.client_id = 'Selecciona un cliente';
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    if (formData.end_date < formData.start_date) {
      return addToast('La fecha de fin es anterior al inicio.', 'error');
    }
    setFieldErrors({});
    setLoadingAction(true);
    try {
      if (editingAccount) {
        await api.patch(`service-accounts/${editingAccount.id}/`, formData);
        addToast('Cuenta actualizada correctamente.', 'success');
      } else {
        await api.post('service-accounts/', formData);
        addToast('Cuenta aperturada con éxito.', 'success');
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QK.accounts }),
        queryClient.invalidateQueries({ queryKey: QK.clients }),
        queryClient.invalidateQueries({ queryKey: ['services'] })
      ]);
      setIsModalOpen(false);
    } catch (err) {
      addToast(extractError(err), 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`service-accounts/${deleteId}/`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QK.accounts }),
        queryClient.invalidateQueries({ queryKey: QK.clients }),
        queryClient.invalidateQueries({ queryKey: ['services'] })
      ]);
      setShowConfirmModal(false);
      addToast('Cuenta eliminada.', 'success');
    } catch (err) {
      addToast(extractError(err), 'error');
    }
  };

  const handleInvoiceAction = async (account) => {
    setLoadingId(account.id);
    try {
      let currentInvoice = invoices.find(i => i.service_account_id === account.id);

      // Si no existe, intetamos crearla
      if (!currentInvoice) {
        const hasServices = services.some(s => s.service_account_id === account.id);
        if (!hasServices) {
          addToast('No se puede facturar una cuenta sin servicios registrados.', 'error');
          setLoadingId(null);
          return;
        }

        const res = await api.post('invoices/', { service_account_id: account.id });
        currentInvoice = res.data;
        await queryClient.invalidateQueries({ queryKey: QK.invoices });
        addToast('Factura generada con éxito.', 'success');
      }

      // Descargamos el blob binario de backend
      const resBlob = await api.get(`invoices/${currentInvoice.id}/pdf/`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([resBlob.data], { type: 'application/pdf' }));
      setPdfUrl(url);
      setSelectedInvoiceId(currentInvoice.id);
      setShowPdfModal(true);

    } catch (err) {
      addToast(extractError(err), 'error');
    } finally {
      setLoadingId(null);
    }
  };


  return (
    <div className="min-h-screen font-sans text-slate-900 p-4 sm:p-12 page-enter">
      <div className="max-w-7xl mx-auto space-y-10">

        {clientId && <Breadcrumb />}

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-black text-[#1a202c] tracking-tight">
              Control de Cuentas <span className="text-[#f58d2f]">.</span>
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 ml-auto w-full lg:w-auto">
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => handleOpenModal()}
              className="flex-1 lg:flex-none"
            >
              Nueva Cuenta
            </Button>
          </div>
        </header>

        {/* Filtros */}
        <div className="flex flex-col gap-6">
          <div className="flex bg-slate-100/80 p-px md:p-1 rounded-lg md:rounded-2xl w-fit md:w-full md:max-w-2xl gap-px overflow-x-auto">
            {['Todas', 'Pendientes', 'Facturadas', 'Sin Movimientos'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`md:flex-1 px-3 py-0.5 md:py-2.5 rounded-md md:rounded-xl text-[11px] md:text-[13px] font-medium whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-[#1a202c] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <FilterBar>
            <FilterRow>
              <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por cliente o descripción..."
              />
              <FilterSelect
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="lg:w-72"
              >
                <option value="">Todos los clientes</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </FilterSelect>
            </FilterRow>
          </FilterBar>
        </div>

        {/* Tabla flat — solo desktop */}
        <div className="hidden md:block bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="divide-y divide-slate-100">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                  <div className="h-8 w-8 bg-slate-100 rounded-xl flex-shrink-0" />
                  <div className="h-3 bg-slate-100 rounded w-28" />
                  <div className="h-3 bg-slate-100 rounded w-40 ml-4" />
                  <div className="h-3 bg-slate-100 rounded w-32 ml-auto" />
                  <div className="h-3 bg-slate-100 rounded w-20" />
                  <div className="h-6 bg-slate-100 rounded-xl w-20" />
                  <div className="h-6 bg-slate-100 rounded-xl w-28" />
                </div>
              ))}
            </div>
          ) : filteredAccounts.length > 0 ? (
            <Table>
              <TableHead>
                <tr>
                  <Th>Cliente</Th>
                  <Th>Cuenta / Obra</Th>
                  <Th>Periodo</Th>
                  <Th align="right">Total</Th>
                  <Th align="center">Estado</Th>
                  <Th align="right">Acciones</Th>
                </tr>
              </TableHead>
              <TableBody>
                {filteredAccounts.map(account => {
                  const client = clients.find(c => c.id === account.client_id);
                  const accountServices = services.filter(s => s.service_account_id === account.id);
                  const hasInvoice = invoices.some(i => i.service_account_id === account.id);
                  const hasServices = accountServices.length > 0;
                  const totalValue = accountServices.reduce((sum, s) => sum + (Number(s.price) * Number(s.quantity)), 0);

                  return (
                    <TableRow key={account.id}>
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-[#f58d2f] font-medium text-xs flex-shrink-0">
                            {(client?.name || 'C').charAt(0)}
                          </div>
                          <span className="text-sm text-slate-700 truncate max-w-[130px]">{client?.name || '—'}</span>
                        </div>
                      </Td>
                      <Td>
                        <div>
                          <p className="text-sm text-slate-800">{account.description}</p>
                        </div>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Calendar size={11} className="text-slate-300 flex-shrink-0" />
                          {account.start_date} — {account.end_date}
                        </div>
                      </Td>
                      <Td align="right">
                        <span className="text-sm text-slate-700 tabular-nums">{formatCurrency(totalValue)}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5 tabular-nums">{accountServices.length} viajes</p>
                      </Td>
                      <Td align="center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium border ${
                          hasInvoice
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : hasServices
                              ? 'bg-orange-50 text-[#f58d2f] border-orange-100'
                              : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}>
                          {hasInvoice
                            ? <CheckCircle size={9} />
                            : hasServices
                              ? <div className="w-1.5 h-1.5 rounded-full bg-[#f58d2f]" />
                              : <AlertTriangle size={9} />}
                          {hasInvoice ? 'Facturado' : hasServices ? 'Pendiente' : 'Sin viajes'}
                        </span>
                      </Td>
                      <Td>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/servicios?cuenta=${account.id}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all duration-150"
                          >
                            <Truck size={12} />
                            Viajes
                          </button>

                          <div className="w-[90px] flex justify-center">
                            {hasInvoice ? (
                              <button
                                onClick={(e) => openInvoiceDropdown(e, account.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all duration-150"
                              >
                                {loadingId === account.id
                                  ? <Loader2 size={12} className="animate-spin" />
                                  : <Receipt size={12} />}
                                Factura
                                <ChevronDown size={10} className={`transition-transform ${openInvoiceMenu === account.id ? 'rotate-180' : ''}`} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleInvoiceAction(account)}
                                disabled={!hasServices || loadingId === account.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {loadingId === account.id
                                  ? <Loader2 size={12} className="animate-spin" />
                                  : <FileText size={12} />}
                                Facturar
                              </button>
                            )}
                          </div>

                          <div className="w-px h-4 bg-slate-100 mx-0.5" />
                          <button
                            onClick={() => handleOpenModal(account)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-150"
                            aria-label="Editar cuenta"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => { setDeleteId(account.id); setShowConfirmModal(true); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150"
                            aria-label="Eliminar cuenta"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </Td>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState icon={Briefcase} title="No se encontraron cuentas" description="Registra una nueva cuenta para empezar" />
          )}
        </div>
      </div>

      {/* Acordeón móvil — solo mobile */}
      <div className="md:hidden space-y-3">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse space-y-3">
              <div className="h-4 bg-slate-100 rounded-lg w-1/2" />
              <div className="h-3 bg-slate-100 rounded w-full" />
            </div>
          ))
        ) : Object.keys(groupedAccounts).length === 0 ? (
          <EmptyState icon={Wallet} title="Sin resultados" description="No se encontraron cuentas." />
        ) : Object.entries(groupedAccounts).map(([clientName, clientAccounts]) => (
          <div key={clientName} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            {/* Header cliente */}
            <button
              onClick={() => toggleClient(clientName)}
              className="w-full flex items-center gap-3 px-4 py-3 border-b border-slate-100"
            >
              <ChevronRight size={13} className={`text-slate-400 transition-transform duration-200 ${openClients[clientName] ? 'rotate-90' : ''}`} />
              <span className="font-medium text-slate-700 text-[13px] flex-1 text-left truncate">{clientName}</span>
              <span className="text-[11px] text-slate-400 tabular-nums">{clientAccounts.length}</span>
            </button>

            {openClients[clientName] && clientAccounts.map(account => {
              const hasInvoice = invoices.some(i => i.service_account_id === account.id);
              const hasServices = services.some(s => s.service_account_id === account.id);
              const accountServices = services.filter(s => s.service_account_id === account.id);
              const totalValue = accountServices.reduce((sum, s) => sum + (parseFloat(s.price) * s.quantity || 0), 0);
              return (
                <div key={account.id} className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-[12px] truncate">{account.description}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {formatShortDate(account.start_date)} — {formatShortDate(account.end_date)} · {accountServices.length} viajes
                    </p>
                  </div>
                  <span className="text-[12px] font-semibold text-slate-700 tabular-nums flex-shrink-0">{formatCurrency(totalValue)}</span>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => navigate(`/servicios?cuenta=${account.id}`)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-150"
                      aria-label="Ver viajes"
                    >
                      <Truck size={13} />
                    </button>
                    {hasInvoice ? (
                      <button
                        onClick={(e) => openInvoiceDropdown(e, account.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-150"
                        aria-label="Ver factura"
                      >
                        {loadingId === account.id ? <Loader2 size={13} className="animate-spin" /> : <Receipt size={13} />}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleInvoiceAction(account)}
                        disabled={!hasServices || loadingId === account.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Facturar"
                      >
                        {loadingId === account.id ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenModal(account)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-150"
                      aria-label="Editar cuenta"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => { setDeleteId(account.id); setShowConfirmModal(true); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150"
                      aria-label="Eliminar cuenta"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>


      {/* Portal: dropdown factura — se renderiza fuera del overflow-hidden */}
      {openInvoiceMenu && createPortal(
        <div
          style={{ position: 'fixed', top: invoiceMenuPos.top, right: invoiceMenuPos.right, zIndex: 9999 }}
          className="w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { handleInvoiceAction(allAccounts.find(a => a.id === openInvoiceMenu)); setOpenInvoiceMenu(null); }}
            disabled={loadingId === openInvoiceMenu}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors disabled:opacity-50"
          >
            {loadingId === openInvoiceMenu ? <Loader2 size={14} className="animate-spin" /> : <Receipt size={14} />}
            Ver factura
          </button>
          <button
            onClick={() => { navigate(`/factura/personalizar?accountId=${openInvoiceMenu}`); setOpenInvoiceMenu(null); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-orange-50 hover:text-[#f58d2f] transition-colors"
          >
            <Palette size={14} />
            Personalizar
          </button>
        </div>,
        document.body
      )}

      <AccountFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isEditing={editingAccount !== null}
        formData={formData}
        fieldErrors={fieldErrors}
        isSubmitting={loadingAction}
        clients={clients}
        clientIdUrlParam={clientId}
        onInputChange={handleInputChange}
        onSubmit={handleSaveAccount}
      />
      <ConfirmModal show={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={handleConfirmDelete} title="¿Eliminar cuenta?" message="Esta acción eliminará todos los registros asociados." />
      <PdfModal show={showPdfModal} onClose={() => setShowPdfModal(false)} pdfUrl={pdfUrl} invoiceId={selectedInvoiceId} />
    </div>
  );
};

export default Accounts;