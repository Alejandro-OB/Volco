import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Search, Plus, ChevronDown, Calendar, Trash2, Edit2,
  Receipt, Truck, X, Check, Filter, ArrowLeft,
  Loader2, AlertTriangle, CheckCircle, Type, FileText,
  DollarSign, Info
} from 'lucide-react';
import api from '../api/axiosConfig';
import ConfirmModal from './Modals/ConfirmModal';
import PdfModal from './Modals/PdfModal';

const Accounts = () => {
  const navigate = useNavigate();
  const { clientId } = useParams();

  // --- ESTADOS DE DATOS ---
  const [allAccounts, setAllAccounts] = useState([]);
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [services, setServices] = useState([]);
  
  // --- ESTADOS DE UI Y FILTROS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(clientId || '');
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [loadingId, setLoadingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');

  // --- ESTADOS DEL MODAL DE FORMULARIO ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    client_id: '',
    description: '',
    start_date: '',
    end_date: '',
  });

  // --- MODALES DE APOYO ---
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  const Required = () => <span className="text-orange-500 ml-1 font-bold" title="Obligatorio">*</span>;

  // --- CARGA INICIAL ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [clientsRes, invoicesRes, servicesRes, accountsRes] = await Promise.all([
          api.get('clients/'),
          api.get('invoices/'),
          api.get('services/'),
          api.get('service-accounts/')
        ]);
        
        setClients(clientsRes.data);
        setInvoices(invoicesRes.data);
        setServices(servicesRes.data);
        setAllAccounts(accountsRes.data);
        if (clientId) setSelectedClient(clientId.toString());
      } catch (err) {
        showMessage('Error al sincronizar datos.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
      return matchesCliente && matchesSearch;
    });
  }, [allAccounts, selectedClient, searchTerm, clients]);

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

  const handleSaveAccount = async () => {
    if (formData.end_date < formData.start_date) {
        return showMessage('La fecha de fin es anterior al inicio.', 'error');
    }

    setLoadingAction(true);
    try {
      if (editingAccount) {
        const res = await api.patch(`service-accounts/${editingAccount.id}/`, formData);
        setAllAccounts(prev => prev.map(a => a.id === editingAccount.id ? res.data : a));
        showMessage('Cuenta actualizada correctamente.');
      } else {
        const res = await api.post('service-accounts/', formData);
        setAllAccounts(prev => [res.data, ...prev]);
        showMessage('Cuenta aperturada con éxito.');
      }
      setIsModalOpen(false);
    } catch (err) {
      showMessage('Error al guardar la cuenta.', 'error');
    } finally {
      setLoadingAction(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(null), 4000);
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`service-accounts/${deleteId}/`);
      setAllAccounts(prev => prev.filter(a => a.id !== deleteId));
      setShowConfirmModal(false);
      showMessage('Cuenta eliminada.');
    } catch {
      showMessage('Error al eliminar.', 'error');
    }
  };

  const handleInvoiceAction = async (account) => {
    setLoadingId(account.id);
    try {
      const existingInvoice = invoices.find(i => i.service_account_id === account.id);
      
      if (existingInvoice) {
        const pdfRes = await api.get(`invoices/${existingInvoice.id}/pdf/`, { responseType: 'blob' });
        setPdfUrl(URL.createObjectURL(pdfRes.data));
        setShowPdfModal(true);
      } else {
        const hasServices = services.some(s => s.service_account_id === account.id);

        if (!hasServices) {
          showMessage('No se puede facturar una cuenta sin servicios registrados.', 'error');
          setLoadingId(null);
          return;
        }

        const res = await api.post('invoices/', { service_account_id: account.id });
        setInvoices(prev => [...prev, res.data]);
        showMessage('Factura generada con éxito.');
      }
    } catch (err) {
      showMessage('Error al procesar la factura.', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 p-4 sm:p-12">
      <div className="max-w-7xl mx-auto space-y-10">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div>
              <h1 className="text-4xl font-black text-[#1a202c] tracking-tight">
                Control de Cuentas <span className="text-[#f58d2f]">.</span>
              </h1>
            </div>
          </div>
          
          <button 
            onClick={() => handleOpenModal()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#f58d2f] to-[#e87a1c] px-8 py-4 text-sm font-bold text-white shadow-xl shadow-orange-100 hover:-translate-y-1 transition-all border-none active:scale-95"
          >
            <Plus className="h-5 w-5" />
            Registrar Cuenta
          </button>
        </header>

        {/* Filtros */}
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

        {message && (
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl border-2 animate-in fade-in slide-in-from-top-2 ${
            messageType === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
          }`}>
            {messageType === 'error' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
            <span className="text-xs font-black uppercase tracking-widest">{message}</span>
          </div>
        )}

        {/* Tabla */}
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificación de Cuenta</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Periodo</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor Total</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [1, 2, 3].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan="5" className="px-8 py-8"><div className="h-8 bg-slate-100 rounded-xl w-full"></div></td>
                    </tr>
                  ))
                ) : filteredAccounts.length > 0 ? (
                  filteredAccounts.map((account) => {
                    const client = clients.find(c => c.id === account.client_id);
                    const hasInvoice = invoices.find(i => i.service_account_id === account.id);
                    
                    // Cálculo de total acumulado
                    const accountServices = services.filter(s => s.service_account_id === account.id);
                    const hasServices = accountServices.length > 0;
                    const totalValue = accountServices.reduce((sum, s) => sum + (Number(s.price) * Number(s.quantity)), 0);

                    return (
                      <tr key={account.id} className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-8 py-6">
                          <div className="space-y-1">
                            <p className="font-black text-[#1a202c] text-sm group-hover:text-[#f58d2f] transition-colors">
                                {account.description}
                            </p>
                            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-tighter">
                                {client?.name || 'Cliente Particular'}
                            </div>
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
                             <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${hasInvoice ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                {hasInvoice && <CheckCircle size={10} />} {hasInvoice ? 'Facturado' : 'Pendiente'}
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
                            <button onClick={() => navigate(`/cuentas/${account.id}/servicios`)} className="flex flex-col items-center p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all">
                              <Truck size={18} />
                              <span className="text-[8px] font-bold uppercase mt-1">Viajes</span>
                            </button>
                            
                            <button 
                              onClick={() => handleInvoiceAction(account)} 
                              disabled={loadingId === account.id || (!hasServices && !hasInvoice)}
                              className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                                hasInvoice 
                                  ? 'text-emerald-500 hover:bg-emerald-50' 
                                  : !hasServices 
                                    ? 'text-slate-200 cursor-not-allowed' 
                                    : 'text-slate-400 hover:text-orange-500 hover:bg-orange-50'
                              }`}
                              title={!hasServices && !hasInvoice ? "Debe registrar viajes para facturar" : ""}
                            >
                              {loadingId === account.id ? <Loader2 size={18} className="animate-spin" /> : hasInvoice ? <Receipt size={18} /> : <FileText size={18} />}
                              <span className="text-[8px] font-bold uppercase mt-1">{hasInvoice ? 'Ver' : 'Factura'}</span>
                            </button>

                            <div className="w-px h-6 bg-slate-100 mx-1"></div>
                            <button onClick={() => handleOpenModal(account)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all"><Edit2 size={16} /></button>
                            <button onClick={() => { setDeleteId(account.id); setShowConfirmModal(true); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="5" className="px-8 py-20 text-center text-slate-400 font-bold">No se encontraron cuentas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- MODAL DE CREACIÓN / EDICIÓN --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black text-[#1a202c]">
                    {editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}
                  </h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-2xl transition-colors text-slate-300">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre de la Cuenta <Required /></label>
                    <div className="relative">
                      <Type className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                      <input 
                        type="text" 
                        placeholder="Ej: Obra Norte Fase 1"
                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-[#f58d2f]/30 focus:bg-white transition-all text-sm font-bold text-slate-700"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cliente Titular <Required /></label>
                    <div className="relative">
                      <select 
                        className="w-full pl-5 pr-10 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-[#f58d2f]/30 focus:bg-white transition-all text-sm font-bold text-slate-700 appearance-none cursor-pointer"
                        value={formData.client_id}
                        onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                        disabled={!!clientId && !editingAccount}
                      >
                        <option value="">Seleccione...</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fecha de Inicio <Required /></label>
                    <input 
                      type="date" 
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-[#f58d2f]/30 focus:bg-white transition-all text-sm font-bold text-slate-700"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fecha de Fin <Required /></label>
                    <input 
                      type="date" 
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-[#f58d2f]/30 focus:bg-white transition-all text-sm font-bold text-slate-700"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-4 border-2 border-slate-100 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all text-[11px] uppercase tracking-widest">
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveAccount}
                  disabled={loadingAction || !formData.client_id || !formData.description}
                  className="flex-1 px-6 py-4 bg-gradient-to-br from-[#f58d2f] to-[#e87a1c] rounded-2xl font-black text-white shadow-xl shadow-orange-100 hover:brightness-110 disabled:opacity-50 transition-all text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 border-none"
                >
                  {loadingAction ? <Loader2 className="animate-spin" size={18} /> : (editingAccount ? <Check size={18} /> : <Plus size={18} />)}
                  {editingAccount ? 'Guardar Cambios' : 'Abrir Cuenta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal show={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={handleConfirmDelete} title="¿Eliminar cuenta?" message="Esta acción eliminará todos los registros asociados." />
      <PdfModal show={showPdfModal} onClose={() => setShowPdfModal(false)} pdfUrl={pdfUrl} />
    </div>
  );
};

export default Accounts;