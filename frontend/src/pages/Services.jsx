import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Search, Plus, Filter, MoreHorizontal, FileText, ChevronRight,
  MapPin, Calendar, Clock, Edit2, Trash2, CheckCircle, Save,
  X, Check, DollarSign, ExternalLink, RefreshCw, Layers, Inbox, Loader2, ChevronDown, Briefcase, Wallet, Mountain
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axiosConfig';
import ConfirmModal from '../components/Modals/ConfirmModal';
import ServiceFormModal from '../components/Modals/ServiceFormModal';
import Button from '../components/UI/Button';
import { useToast } from '../hooks/useToast';
import { fetchClients, fetchAccounts, fetchMaterials, fetchServices, QK } from '../api/queries';

function Services() {
  const navigate = useNavigate();
  const { accountId } = useParams();
  const queryClient = useQueryClient();
  const addToast = useToast();

  // --- CACHÉ: catálogos compartidos ---
  const { data: accounts = [] } = useQuery({ queryKey: QK.accounts, queryFn: fetchAccounts });
  const { data: materials = [] } = useQuery({ queryKey: QK.materials, queryFn: fetchMaterials });
  const { data: clients = [] } = useQuery({ queryKey: QK.clients, queryFn: fetchClients });

  // --- CACHÉ: servicios (cambia con accountId) ---
  const { data: services = [], isLoading: loading } = useQuery({
    queryKey: QK.services(accountId),
    queryFn: () => fetchServices(accountId),
  });

  // --- ESTADOS DE UI ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [targetId, setTargetId] = useState(null);
  const [showCustomMaterial, setShowCustomMaterial] = useState(false);
  const [openAccounts, setOpenAccounts] = useState({});
  const [openClients, setOpenClients] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // --- FUNCIONES AUXILIARES ---
  const formatCurrency = (v) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

  const getAccountName = (id) =>
    accounts.find(a => a.id === id)?.description || 'Cuenta General';

  const getMaterialName = (s) =>
    s.custom_material || materials.find(m => m.id === s.material_id)?.name || 'Sin material';

  const [formData, setFormData] = useState({
    id: null, service_account_id: '', material_id: '',
    custom_material: '', quantity: '', price: '',
    service_date: new Date().toISOString().split('T')[0]
  });

  // Expandir acordeón automáticamente si venimos con accountId en la URL
  useEffect(() => {
    if (accountId && accounts.length > 0 && clients.length > 0) {
      const activeAccount = accounts.find(a => a.id === Number(accountId));
      if (activeAccount) {
        setOpenAccounts(prev => ({ ...prev, [activeAccount.description]: true }));
        const activeClient = clients.find(c => c.id === activeAccount.client_id);
        if (activeClient) {
          setOpenClients(prev => ({ ...prev, [activeClient.name]: true }));
        }
      }
    }
  }, [accountId, accounts, clients]);

  const groupedData = useMemo(() => {
    if (!services.length) return {};
    const sorted = [...services].sort((a, b) => new Date(b.service_date) - new Date(a.service_date));
    const term = searchTerm.toLowerCase().trim();

    return sorted.reduce((acc, service) => {
      const account = accounts.find(a => a.id === service.service_account_id);
      const accountName = account?.description || 'Cuenta General';
      const client = clients.find(c => c.id === account?.client_id);
      const clientName = client?.name || 'Cliente Particular';

      // Filter by search term against client name or account name
      if (term && !clientName.toLowerCase().includes(term) && !accountName.toLowerCase().includes(term)) {
        return acc;
      }

      if (!acc[clientName]) acc[clientName] = {};
      if (!acc[clientName][accountName]) acc[clientName][accountName] = [];
      acc[clientName][accountName].push(service);
      return acc;
    }, {});
  }, [services, accounts, clients, searchTerm]);

  const toggleClient = (name) => {
    setOpenClients(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const toggleAccount = (name) => {
    setOpenAccounts(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'material_id') {
      if (value === 'otro') {
        setShowCustomMaterial(true);
        setFormData(prev => ({ ...prev, material_id: '', custom_material: '', price: '' }));
      } else {
        setShowCustomMaterial(false);
        const selectedMat = materials.find(m => m.id === Number(value));
        setFormData(prev => ({ ...prev, material_id: value, custom_material: '', price: selectedMat?.price || '' }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleOpenModal = (data = null) => {
    // Si 'data' es un evento (onClick={handleOpenModal}), lo ignoramos
    const service = (data && data.id && !data.nativeEvent) ? data : null;
    const preAccountId = (typeof data === 'number' || typeof data === 'string') ? data : null;

    if (service) {
      const isCustom = !!service.custom_material;
      setShowCustomMaterial(isCustom);
      setFormData({
        id: service.id, service_account_id: service.service_account_id,
        material_id: isCustom ? 'otro' : service.material_id,
        custom_material: service.custom_material || '',
        quantity: service.quantity, price: service.price,
        service_date: service.service_date
      });
    } else {
      setShowCustomMaterial(false);
      setFormData({
        id: null,
        service_account_id: preAccountId || accountId || '', // Pre-selección inteligente
        material_id: '', custom_material: '', quantity: '', price: '',
        service_date: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const payload = {
      ...formData,
      service_account_id: Number(formData.service_account_id),
      quantity: Number(formData.quantity),
      price: parseFloat(formData.price),
      material_id: showCustomMaterial ? null : Number(formData.material_id),
      custom_material: showCustomMaterial ? formData.custom_material : null
    };

    try {
      if (formData.id) {
        await api.patch(`services/${formData.id}/`, payload);
        addToast('Registro actualizado.', 'success');
        setIsModalOpen(false);
      } else {
        await api.post('services/', payload);
        addToast('Registro exitoso.', 'success');
        setFormData(prev => ({
          ...prev,
          material_id: '', custom_material: '', quantity: '', price: '',
        }));
        setShowCustomMaterial(false);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['services'] }),
        queryClient.invalidateQueries({ queryKey: QK.accounts })
      ]);
    } catch (err) {
      addToast('Error al guardar.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`services/${targetId}/`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['services'] }),
        queryClient.invalidateQueries({ queryKey: QK.accounts })
      ]);
      setShowDeleteModal(false);
      addToast('Eliminado con éxito.', 'success');
    } catch (err) { addToast('Error al eliminar.', 'error'); }
  };

  const validateForm = () => {
    const {
      service_account_id,
      material_id,
      custom_material,
      quantity,
      price,
      service_date
    } = formData;

    if (!service_account_id) return false;

    if (showCustomMaterial) {
      if (!custom_material || !custom_material.trim()) return false;
    } else {
      if (!material_id) return false;
    }

    if (!quantity || Number(quantity) <= 0) return false;

    if (!price || Number(price) <= 0) return false;

    if (!service_date) return false;

    return true;
  };

  const canSubmit = validateForm();

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-12 font-sans page-enter">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Servicios <span className="text-[#f58d2f]">.</span></h1>
            <p className="text-slate-500 font-medium">
              {accountId ? `Filtrado por: ${getAccountName(Number(accountId))}` : ''}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => handleOpenModal()}
              className="flex-1 lg:flex-none"
            >
              Registrar Viaje
            </Button>
          </div>
        </div>

        {/* SEARCH BAR */}
        {!accountId && (
          <div className="relative mb-6 max-w-md">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            <input
              type="text"
              placeholder="Buscar por cliente o cuenta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm input-fancy"
            />
          </div>
        )}

        {/* Tabla — solo desktop */}
        <div className="hidden md:block bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [1, 2, 3].map(i => (
                    <tr key={i}>
                      <td className="px-8 py-5"><div className="skeleton h-5 w-2/3" /></td>
                      <td className="px-8 py-5"><div className="skeleton h-5 w-20 mx-auto" /></td>
                      <td className="px-8 py-5"><div className="skeleton h-5 w-12 mx-auto" /></td>
                      <td className="px-8 py-5"><div className="skeleton h-5 w-24 ml-auto" /></td>
                      <td className="px-8 py-5"><div className="skeleton h-5 w-16 mx-auto" /></td>
                    </tr>
                  ))
                ) : Object.keys(groupedData).length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-20 w-20 rounded-3xl bg-slate-50 flex items-center justify-center mb-1">
                          <Briefcase size={36} className="text-slate-200" />
                        </div>
                        <p className="text-slate-700 font-bold text-base">Sin movimientos registrados</p>
                        <p className="text-slate-400 text-sm">Registra el primer servicio usando el botón superior</p>
                      </div>
                    </td>
                  </tr>
                ) : Object.entries(groupedData).map(([clientName, clientAccounts]) => (
                  <React.Fragment key={clientName}>
                    {/* ENCABEZADO CLIENTE - PREMIUM CARD */}
                    <tr className="bg-transparent sticky top-0 z-20">
                      <td colSpan="5" className="px-4 py-6">
                        {(() => {
                          const clientTotal = Object.values(clientAccounts).reduce((sum, accSvcs) => 
                            sum + accSvcs.reduce((sSum, s) => sSum + (Number(s.price) * Number(s.quantity)), 0), 0);

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

                                <div className="flex justify-start md:justify-center">
                                  <div className="px-6 py-2.5 bg-slate-50 rounded-2xl border border-slate-100/50 flex flex-col items-center min-w-[120px]">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cuentas</span>
                                    <span className="text-base font-black text-slate-700">{Object.keys(clientAccounts).length}</span>
                                  </div>
                                </div>

                                <div className="flex justify-start md:justify-center">
                                  <div className="px-6 py-2.5 bg-[#1b4332]/5 rounded-2xl border border-[#1b4332]/10 flex flex-col items-center min-w-[180px]">
                                    <span className="text-[10px] font-bold text-[#1b4332]/60 uppercase tracking-widest">Cartera Total</span>
                                    <span className="text-base font-black text-[#1b4332]">{formatCurrency(clientTotal)}</span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-end">
                                  <div className={`w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 group-hover:bg-orange-50 transition-all ${
                                    openClients[clientName] ? 'rotate-180 bg-orange-100 text-[#f58d2f]' : 'text-slate-400'
                                  }`}>
                                    <ChevronDown size={22} />
                                  </div>
                                </div>
                              </div>
                              {openClients[clientName] && (
                                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-[#f58d2f]/40 to-transparent" />
                              )}
                            </button>
                          );
                        })()}
                      </td>
                    </tr>

                    {/* ACORDEON DE CUENTAS POR CLIENTE */}
                    {openClients[clientName] && Object.entries(clientAccounts).map(([accountName, accountServices]) => (
                      <React.Fragment key={accountName}>
                        <tr className="bg-white/50 sticky top-[95px] z-10 backdrop-blur-sm border-b border-slate-100">
                          <td colSpan="5" className="px-8 py-4 pl-12">
                            <button 
                              onClick={() => toggleAccount(accountName)} 
                              className={`flex items-center gap-4 w-full p-3 rounded-2xl transition-all group ${openAccounts[accountName] ? 'bg-white shadow-sm ring-1 ring-slate-100' : 'hover:bg-white'}`}
                            >
                              <div className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${openAccounts[accountName] ? 'bg-orange-100 text-[#f58d2f]' : 'bg-slate-100 text-slate-400'}`}>
                                {openAccounts[accountName] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              </div>
                              <div className="flex flex-col items-start translate-y-[-1px]">
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">Cuenta de Servicio</span>
                                <span className="text-sm font-black text-slate-700 tracking-tight">{accountName}</span>
                              </div>
                              <div className="flex-1 h-[1px] bg-slate-100/50 group-hover:bg-orange-100 transition-colors"></div>
                              <div className="flex items-center gap-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  icon={Plus}
                                  onClick={(e) => { e.stopPropagation(); handleOpenModal(accountServices[0]?.service_account_id); }}
                                >
                                  Registrar
                                </Button>
                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{accountServices.length} viajes</span>
                                  <Mountain size={16} className="text-orange-200" />
                                </div>
                              </div>
                            </button>
                          </td>
                        </tr>
                        {openAccounts[accountName] && (
                          <tr className="bg-slate-50/30">
                            <th className="px-8 py-3 pl-20 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Material</th>
                            <th className="px-8 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Fecha</th>
                            <th className="px-8 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Cantidad / Precio</th>
                            <th className="px-8 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Total</th>
                            <th className="px-8 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Acciones</th>
                          </tr>
                        )}
                        {openAccounts[accountName] && accountServices.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50/30 transition-all group animate-in slide-in-from-top-1 duration-200">
                            <td className="px-8 py-6 pl-20">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#f58d2f] group-hover:bg-[#f58d2f] group-hover:text-white transition-colors">
                                  <Mountain size={18} />
                                </div>
                                <p className="font-black text-slate-800 text-sm uppercase">{getMaterialName(s)}</p>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg uppercase">{s.service_date}</span>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <div className="flex flex-col">
                                <span className="font-black text-slate-800 text-sm uppercase">{s.quantity} Viajes</span>
                                <span className="text-[10px] text-slate-400 font-bold italic">c/u {formatCurrency(s.price)}</span>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <span className="px-4 py-2 bg-emerald-50 text-emerald-600 font-black rounded-xl border border-emerald-100 text-sm">{formatCurrency(s.total_amount)}</span>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex justify-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  icon={Edit2}
                                  className="hover:text-blue-500"
                                  onClick={() => handleOpenModal(s)} 
                                />
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  icon={Trash2}
                                  className="hover:text-red-500"
                                  onClick={() => { setTargetId(s.id); setShowDeleteModal(true); }} 
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Acordeón móvil — solo mobile */}
        <div className="md:hidden space-y-3">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-[2rem] border border-slate-100 p-5 animate-pulse space-y-3">
                <div className="h-4 bg-slate-100 rounded-lg w-1/2" />
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            ))
          ) : Object.keys(groupedData).length === 0 ? (
            <div className="bg-white rounded-[2rem] border border-slate-100 p-12 text-center">
              <p className="text-slate-400 font-bold text-sm">Sin movimientos registrados</p>
            </div>
          ) : Object.entries(groupedData).map(([clientName, clientAccounts]) => (
            <div key={clientName} className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
              {/* Header cliente */}
              <button
                onClick={() => toggleClient(clientName)}
                className="w-full flex items-center gap-3 px-5 py-4 bg-slate-50 border-b border-slate-100"
              >
                <div className={`p-1 rounded-lg transition-all ${openClients[clientName] ? 'bg-orange-100 text-[#f58d2f]' : 'bg-slate-200 text-slate-500'}`}>
                  {openClients[clientName] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                <Briefcase size={15} className="text-[#f58d2f]" />
                <span className="font-black text-slate-800 text-sm uppercase tracking-tight flex-1 text-left">{clientName}</span>
                <span className="text-[10px] font-black text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  {Object.keys(clientAccounts).length} cuentas
                </span>
              </button>
              {openClients[clientName] && Object.entries(clientAccounts).map(([accountName, accountServices]) => (
                <div key={accountName}>
                  {/* Header cuenta */}
                  <button
                    onClick={() => toggleAccount(accountName)}
                    className="w-full flex items-center gap-3 px-5 py-3 bg-white border-b border-slate-50 pl-9"
                  >
                    <div className={`p-0.5 rounded-md transition-all ${openAccounts[accountName] ? 'bg-orange-50 text-[#f58d2f]' : 'bg-slate-100 text-slate-400'}`}>
                      {openAccounts[accountName] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </div>
                    <Wallet size={12} className="text-[#f58d2f]" />
                    <span className="font-black text-slate-600 text-xs uppercase tracking-tight flex-1 text-left">{accountName}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      icon={Plus}
                      className="!p-1.5 !rounded-lg"
                      onClick={(e) => { e.stopPropagation(); handleOpenModal(accountServices[0]?.service_account_id); }}
                    />
                    <span className="text-[9px] font-black text-slate-400">{accountServices.length} vjs</span>
                  </button>
                  {openAccounts[accountName] && accountServices.map(s => (
                    <div key={s.id} className="flex flex-col px-5 py-4 pl-9 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-8 w-8 rounded-xl bg-orange-50 flex items-center justify-center text-[#f58d2f] flex-shrink-0">
                            <Mountain size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-slate-800 text-[11px] uppercase tracking-tight truncate">{getMaterialName(s)}</p>
                            <span className="text-[9px] font-bold text-slate-400">{s.service_date}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             icon={Edit2}
                             className="!p-2 hover:text-blue-500"
                             onClick={() => handleOpenModal(s)} 
                           />
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             icon={Trash2}
                             className="!p-2 hover:text-red-500"
                             onClick={() => { setTargetId(s.id); setShowDeleteModal(true); }} 
                           />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pl-10">
                        <div className="flex flex-col">
                           <span className="text-[11px] font-black text-slate-700">{s.quantity} Viajes</span>
                           <span className="text-[9px] text-slate-400 font-bold italic">c/u {formatCurrency(s.price)}</span>
                        </div>
                        <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 shadow-sm">{formatCurrency(s.total_amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <ServiceFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isEditing={!!formData.id}
        formData={formData}
        isSubmitting={isSubmitting}
        materials={materials}
        accounts={accounts}
        accountIdUrlParam={accountId}
        showCustomMaterial={showCustomMaterial}
        onInputChange={handleInputChange}
        onSubmit={handleSave}
        canSubmit={canSubmit}
        formatCurrency={formatCurrency}
      />

      <ConfirmModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="¿Eliminar registro?"
        message="Se eliminará permanentemente este servicio de la cuenta."
      />
    </div>
  );
}

export default Services;