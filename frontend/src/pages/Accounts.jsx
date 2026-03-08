import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Search, Plus, ChevronDown, Calendar, Trash2, Edit2,
  Receipt, Truck, X, Check, Filter, ArrowLeft,
  Loader2, AlertTriangle, CheckCircle, Type, FileText,
  DollarSign, Info, ChevronRight, Briefcase, Palette, Wallet
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axiosConfig';
import ConfirmModal from '../components/Modals/ConfirmModal';
import PdfModal from '../components/Modals/PdfModal';
import AccountFormModal from '../components/Modals/AccountFormModal';
import Button from '../components/UI/Button';
import { useToast } from '../hooks/useToast';
import { fetchClients, fetchAccounts, fetchInvoices, fetchServices, fetchMaterials, QK } from '../api/queries';

const Accounts = () => {
  const navigate = useNavigate();
  const { clientId } = useParams();
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
      addToast('Error al guardar la cuenta.', 'error');
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
    } catch {
      addToast('Error al eliminar.', 'error');
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
      addToast('Error al visualizar u obtener la factura.', 'error');
    } finally {
      setLoadingId(null);
    }
  };


  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 p-4 sm:p-12 page-enter">
      <div className="max-w-7xl mx-auto space-y-10">

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-[#1a202c] tracking-tight">
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
          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full max-w-3xl overflow-x-auto">
            {['Todas', 'Pendientes', 'Facturadas', 'Sin Movimientos'].map(tab => (
              <Button
                key={tab}
                variant={activeTab === tab ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[140px] !rounded-xl ${activeTab === tab ? '' : 'text-slate-400'}`}
              >
                {tab}
              </Button>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative w-full lg:flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por cliente o descripción..."
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-[#f58d2f]/20 transition-all text-sm font-bold shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="relative w-full lg:w-72">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <select
                className="w-full pl-12 pr-10 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-[#f58d2f]/20 appearance-none text-sm font-bold cursor-pointer shadow-sm"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
              >
                <option value="">Todos los clientes</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Tabla — solo desktop */}
        <div className="hidden md:block bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [1, 2, 3, 4, 5].map(i => (
                    <tr key={i} className="animate-pulse border-b border-slate-50">
                      <td className="px-8 py-4"><div className="h-5 bg-slate-100 rounded-xl w-3/4" /></td>
                      <td className="px-8 py-4"><div className="h-5 bg-slate-100 rounded-xl w-28" /></td>
                      <td className="px-8 py-4"><div className="h-5 bg-slate-100 rounded-xl w-20 ml-auto" /></td>
                      <td className="px-8 py-4"><div className="h-5 bg-slate-100 rounded-xl w-20 mx-auto" /></td>
                      <td className="px-8 py-4"><div className="h-5 bg-slate-100 rounded-xl w-24 mx-auto" /></td>
                    </tr>
                  ))
                ) : Object.keys(groupedAccounts).length > 0 ? (
                  Object.entries(groupedAccounts).map(([clientName, clientAccounts]) => (
                    <React.Fragment key={clientName}>
                      <tr className="bg-transparent sticky top-0 z-10">
                        <td colSpan="5" className="px-4 py-6">
                          {(() => {
                            const clientTotal = clientAccounts.reduce((sum, acc) => {
                              const accServices = services.filter(s => s.service_account_id === acc.id);
                              return sum + accServices.reduce((sSum, s) => sSum + (Number(s.price) * Number(s.quantity)), 0);
                            }, 0);

                            return (
                              <button 
                                onClick={() => toggleClient(clientName)} 
                                className={`group w-full relative overflow-hidden transition-all duration-500 rounded-[2rem] border ${
                                  openClients[clientName] 
                                    ? 'bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] border-[#f58d2f]/20 scale-[1.01]' 
                                    : 'bg-white/80 backdrop-blur-xl border-white hover:bg-white hover:shadow-xl'
                                }`}
                              >
                                <div className="p-6 md:grid md:grid-cols-[40%_1fr_1fr_auto] items-center gap-6 text-left">
                                  {/* Icon & Label */}
                                  <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-2xl shadow-lg transition-all duration-300 ${
                                      openClients[clientName] 
                                        ? 'bg-gradient-to-br from-[#f58d2f] to-[#e87a1c] text-white rotate-3 translate-x-1' 
                                        : 'bg-slate-50 text-slate-400 group-hover:bg-orange-50 group-hover:text-[#f58d2f]'
                                    }`}>
                                      <Briefcase size={26} />
                                    </div>
                                    <div className="min-w-0 pr-4">
                                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors whitespace-nowrap ${
                                        openClients[clientName] ? 'text-[#f58d2f]' : 'text-slate-400'
                                      }`}>
                                        Cliente Asociado
                                      </span>
                                      <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight group-hover:text-[#f58d2f] transition-all truncate">
                                        {clientName}
                                      </h3>
                                    </div>
                                  </div>

                                  {/* Summary Stats - Aligned */}
                                  <div className="flex justify-start md:justify-center">
                                    <div className="px-6 py-2.5 bg-slate-50 rounded-2xl border border-slate-100/50 flex flex-col items-center min-w-[120px]">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cuentas</span>
                                      <span className="text-base font-black text-slate-700">{clientAccounts.length}</span>
                                    </div>
                                  </div>

                                  <div className="flex justify-start md:justify-center">
                                    <div className="px-6 py-2.5 bg-[#1b4332]/5 rounded-2xl border border-[#1b4332]/10 flex flex-col items-center min-w-[180px]">
                                      <span className="text-[10px] font-bold text-[#1b4332]/60 uppercase tracking-widest">Cartera Total</span>
                                      <span className="text-base font-black text-[#1b4332]">{formatCurrency(clientTotal)}</span>
                                    </div>
                                  </div>

                                  {/* Action Indicator */}
                                  <div className="flex items-center justify-end">
                                    <div className={`w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 group-hover:bg-orange-50 transition-all ${
                                      openClients[clientName] ? 'rotate-180 bg-orange-100 text-[#f58d2f]' : 'text-slate-400'
                                    }`}>
                                      <ChevronDown size={22} />
                                    </div>
                                  </div>
                                </div>

                                {/* Bottom Glow Line */}
                                {openClients[clientName] && (
                                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-[#f58d2f]/40 to-transparent" />
                                )}
                              </button>
                            );
                          })()}
                        </td>
                      </tr>
                      {openClients[clientName] && (
                        <tr className="bg-slate-50/50">
                          <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Identificación de Cuenta</th>
                          <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Periodo</th>
                          <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right border-b border-slate-100">Valor Total</th>
                          <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-100">Estado</th>
                          <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-100">Acciones</th>
                        </tr>
                      )}
                      {openClients[clientName] && clientAccounts.map((account, index) => {
                        const hasInvoice = invoices.some(i => i.service_account_id === account.id);

                        // Cálculo de total acumulado
                        const accountServices = services.filter(s => s.service_account_id === account.id);
                        const hasServices = accountServices.length > 0;
                        const totalValue = accountServices.reduce((sum, s) => sum + (Number(s.price) * Number(s.quantity)), 0);

                        return (
                          <tr 
                            key={account.id} 
                            className={`transition-all group animate-in slide-in-from-top-1 duration-200 ${index % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'}`}
                          >
                            <td className="px-8 py-6">
                              <div className="space-y-1">
                                <p className="font-black text-[#1a202c] text-sm group-hover:text-[#f58d2f] transition-colors">
                                  {account.description}
                                </p>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold bg-slate-100/50 px-3 py-2 rounded-xl border border-slate-100 w-fit">
                                <Calendar size={14} className="text-[#f58d2f]" />
                                {account.start_date} — {account.end_date}
                              </div>
                            </td>
                            <td className="px-8 py-6 text-right font-black text-[#1a202c] text-sm">
                              {formatCurrency(totalValue)}
                            </td>
                            <td className="px-8 py-6 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border shadow-sm ${hasInvoice ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-100/50 text-[#f58d2f] border-orange-200'}`}>
                                  {hasInvoice
                                    ? <CheckCircle size={10} />
                                    : <div className="w-1.5 h-1.5 rounded-full bg-[#f58d2f] animate-pulse" />}
                                  {hasInvoice ? 'Facturado' : 'Abono Pendiente'}
                                </span>
                                {!hasInvoice && !hasServices && (
                                  <div className="flex items-center gap-1 text-[9px] text-orange-500 font-bold animate-pulse">
                                    <AlertTriangle size={10} /> Sin viajes
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex justify-center items-center gap-1.5">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  icon={Truck}
                                  className="hover:text-blue-500"
                                  onClick={() => navigate(`/cuentas/${account.id}/servicios`)} 
                                />

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  icon={hasInvoice ? Receipt : FileText}
                                  isLoading={loadingId === account.id}
                                  isDisabled={!hasServices && !hasInvoice}
                                  className={hasInvoice ? 'text-emerald-500 hover:bg-emerald-50' : 'hover:text-orange-500'}
                                  onClick={() => handleInvoiceAction(account)}
                                  title={!hasServices && !hasInvoice ? "Debe registrar viajes para facturar" : hasInvoice ? "Ver PDF" : "Generar factura"}
                                />

                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  icon={Palette}
                                  className="hover:text-[#f58d2f]"
                                  onClick={() => navigate(`/factura/personalizar?accountId=${account.id}`)} 
                                />

                                <div className="w-px h-6 bg-slate-100 mx-1"></div>
                                
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  icon={Edit2}
                                  className="hover:text-amber-500"
                                  onClick={() => handleOpenModal(account)} 
                                />
                                
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  icon={Trash2}
                                  className="hover:text-red-500"
                                  onClick={() => { setDeleteId(account.id); setShowConfirmModal(true); }} 
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-20 w-20 rounded-3xl bg-slate-50 flex items-center justify-center mb-1">
                          <Briefcase size={36} className="text-slate-200" />
                        </div>
                        <p className="text-slate-700 font-bold text-base">No se encontraron cuentas</p>
                        <p className="text-slate-400 text-sm">Registra una nueva cuenta para empezar</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cards — solo móvil */}
      <div className="md:hidden space-y-4 mt-2">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse ml-4 space-y-3">
              <div className="h-4 bg-slate-100 rounded-lg w-1/2" />
              <div className="h-3 bg-slate-100 rounded w-full" />
            </div>
          ))
        ) : Object.keys(groupedAccounts).length > 0 ? (
          Object.entries(groupedAccounts).map(([clientName, accounts]) => (
            <div key={clientName} className="space-y-2">
              {/* Header cliente — Flat modern style */}
              <button
                onClick={() => toggleClient(clientName)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-300 ${
                  openClients[clientName] 
                    ? 'bg-white border-[#f58d2f]/20 shadow-sm' 
                    : 'bg-slate-50/50 border-transparent hover:bg-slate-50'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${openClients[clientName] ? 'bg-orange-100 text-[#f58d2f] rotate-90' : 'bg-slate-200 text-slate-400'}`}>
                  <ChevronRight size={14} />
                </div>
                <div className="flex-1 text-left min-w-0">
                   <span className="text-[13px] font-black text-slate-800 tracking-tight block truncate uppercase">{clientName}</span>
                </div>
                <span className="text-[9px] font-black text-slate-400 bg-white px-2.5 py-1 rounded-lg border border-slate-100 uppercase tracking-tighter">
                  {accounts.length}
                </span>
              </button>

              {/* Cuentas — solo cuando está abierto */}
              {openClients[clientName] && (
                <div className="pl-4 space-y-3 animate-in fade-in slide-in-from-left-2 duration-300">
                  {accounts.map(account => {
                    const hasInvoice = invoices.some(i => i.service_account_id === account.id);
                    const hasServices = services.some(s => s.service_account_id === account.id);
                    const accountServices = services.filter(s => s.service_account_id === account.id);
                    const totalValue = accountServices.reduce((sum, s) => sum + (parseFloat(s.price) * s.quantity || 0), 0);
                    return (
                      <div key={account.id} className="bg-white/80 backdrop-blur-xl rounded-[1.5rem] border border-white p-4 shadow-sm group">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0">
                            <p className="font-black text-slate-900 text-[13px] leading-tight group-hover:text-[#f58d2f] transition-colors">{account.description}</p>
                            <div className="flex items-center gap-1.5 text-slate-400 text-[9px] font-bold mt-1 uppercase tracking-tighter">
                               <Calendar size={10} className="text-[#f58d2f]" />
                               {account.start_date} — {account.end_date}
                            </div>
                          </div>
                          <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-black uppercase border shadow-sm ${hasInvoice ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-[#f58d2f] border-orange-100'}`}>
                            {hasInvoice ? <CheckCircle size={9} /> : <div className="h-1.5 w-1.5 rounded-full bg-[#f58d2f] animate-pulse" />}
                            {hasInvoice ? 'Facturado' : 'Pendiente'}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                          <div className="flex flex-col">
                             <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Cartera Actual</span>
                             <span className="text-sm font-black text-slate-800">{formatCurrency(totalValue)}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              icon={Truck}
                              className="!p-2 hover:text-blue-500"
                              onClick={() => navigate(`/cuentas/${account.id}/servicios`)} 
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              icon={hasInvoice ? Receipt : FileText}
                              isLoading={loadingId === account.id}
                              isDisabled={!hasServices && !hasInvoice}
                              className={`!p-2 ${hasInvoice ? 'text-emerald-500' : 'hover:text-orange-500'}`}
                              onClick={() => handleInvoiceAction(account)}
                            />
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              icon={Palette}
                              className="!p-2 hover:text-[#f58d2f]"
                              onClick={() => navigate(`/factura/personalizar?accountId=${account.id}`)} 
                            />
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              icon={Edit2}
                              className="!p-2 hover:text-amber-500"
                              onClick={() => handleOpenModal(account)} 
                            />
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              icon={Trash2}
                              className="!p-2 hover:text-red-500"
                              onClick={() => { setDeleteId(account.id); setShowConfirmModal(true); }} 
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-[2rem] border border-slate-100 p-12 text-center">
            <Wallet size={32} className="mx-auto mb-3 text-slate-100" />
            <p className="text-slate-400 font-bold text-xs">No se encontraron cuentas.</p>
          </div>
        )}
      </div>


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