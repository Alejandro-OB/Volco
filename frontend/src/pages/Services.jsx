import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus, Edit2, Trash2, Calendar, ChevronDown, ChevronRight, X, Check,
  Hash, Wallet, Mountain, Package, AlertTriangle, CheckCircle,
  DollarSign, Briefcase
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axiosConfig';
import ConfirmModal from '../components/Modals/ConfirmModal';
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

  const Required = () => <span className="text-orange-500 ml-1 font-bold" title="Obligatorio">*</span>;

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

  const handleOpenModal = (service = null) => {
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
        service_account_id: accountId || '', // Si venimos de una cuenta, la pre-seleccionamos
        material_id: '', custom_material: '', quantity: '', price: '',
        service_date: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
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
      queryClient.invalidateQueries({ queryKey: QK.services(accountId) });
    } catch (err) {
      addToast('Error al guardar.', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`services/${targetId}/`);
      queryClient.invalidateQueries({ queryKey: QK.services(accountId) });
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
          <button onClick={() => handleOpenModal()} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#f58d2f] to-[#e87a1c] px-8 py-4 text-sm font-bold text-white shadow-xl shadow-orange-200 transition-all hover:-translate-y-1 active:scale-95 border-none">
            <Plus size={20} /> Registrar Servicio
          </button>
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
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  <th className="px-8 py-6">Material</th>
                  <th className="px-8 py-6 text-center">Fecha</th>
                  <th className="px-8 py-6 text-center">Cantidad</th>
                  <th className="px-8 py-6 text-right">Total</th>
                  <th className="px-8 py-6 text-center">Acciones</th>
                </tr>
              </thead>
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
                    {/* ENCABEZADO CLIENTE */}
                    <tr className="bg-slate-100/90 sticky top-0 z-20 backdrop-blur-sm shadow-sm border-b border-slate-200">
                      <td colSpan="5" className="px-8 py-5">
                        <button onClick={() => toggleClient(clientName)} className="flex items-center gap-4 w-full group">
                          <div className={`p-1 rounded-lg transition-all ${!openClients[clientName] ? 'bg-orange-100 text-[#f58d2f]' : 'bg-slate-300 text-slate-600'}`}>
                            {openClients[clientName] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </div>
                          <Briefcase size={20} className="text-[#f58d2f]" />
                          <span className="text-base font-black text-slate-900 uppercase tracking-tighter">{clientName}</span>
                          <div className="h-[2px] flex-1 bg-slate-300 group-hover:bg-orange-300 transition-colors"></div>
                          <span className="text-[11px] font-black text-slate-500 uppercase bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">{Object.keys(clientAccounts).length} Cuentas</span>
                        </button>
                      </td>
                    </tr>

                    {/* ACORDEON DE CUENTAS POR CLIENTE */}
                    {openClients[clientName] && Object.entries(clientAccounts).map(([accountName, accountServices]) => (
                      <React.Fragment key={accountName}>
                        <tr className="bg-slate-50/80 sticky top-[72px] z-10 backdrop-blur-sm border-b border-slate-100">
                          <td colSpan="5" className="px-8 py-4 pl-14">
                            <button onClick={() => toggleAccount(accountName)} className="flex items-center gap-4 w-full group">
                              <div className={`p-1 rounded-lg transition-all ${!openAccounts[accountName] ? 'bg-orange-50 text-[#f58d2f]' : 'bg-slate-200 text-slate-400'}`}>
                                {openAccounts[accountName] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </div>
                              <Wallet size={16} className="text-[#f58d2f]" />
                              <span className="text-sm font-black text-slate-700 uppercase tracking-tighter">{accountName}</span>
                              <div className="h-[1px] flex-1 bg-slate-200 group-hover:bg-orange-200 transition-colors"></div>
                              <span className="text-[10px] font-black text-slate-400 uppercase bg-white px-3 py-1 rounded-full border border-slate-100">{accountServices.length} vjs</span>
                            </button>
                          </td>
                        </tr>
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
                                <span className="text-[10px] text-slate-400 font-bold italic">@{formatCurrency(s.price)}</span>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <span className="px-4 py-2 bg-emerald-50 text-emerald-600 font-black rounded-xl border border-emerald-100 text-sm">{formatCurrency(s.total_amount)}</span>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex justify-center gap-2">
                                <div className="tooltip-wrapper">
                                  <button onClick={() => handleOpenModal(s)} className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={16} /></button>
                                  <span className="tooltip-text">Editar</span>
                                </div>
                                <div className="tooltip-wrapper">
                                  <button onClick={() => { setTargetId(s.id); setShowDeleteModal(true); }} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                                  <span className="tooltip-text">Eliminar</span>
                                </div>
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
                    <span className="text-[9px] font-black text-slate-400">{accountServices.length} vjs</span>
                  </button>
                  {openAccounts[accountName] && accountServices.map(s => (
                    <div key={s.id} className="flex items-center justify-between px-5 py-3 pl-12 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-7 w-7 rounded-lg bg-orange-50 flex items-center justify-center text-[#f58d2f] flex-shrink-0">
                          <Mountain size={13} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-800 text-xs uppercase truncate">{getMaterialName(s)}</p>
                          <p className="text-[10px] text-slate-400">{s.service_date} · {s.quantity} vjs · {formatCurrency(s.price)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">{formatCurrency(s.total_amount)}</span>
                        <button onClick={() => handleOpenModal(s)} className="p-1.5 text-slate-300 hover:text-blue-500 transition-colors"><Edit2 size={13} /></button>
                        <button onClick={() => { setTargetId(s.id); setShowDeleteModal(true); }} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">{formData.id ? 'Editar' : 'Nuevo'} Viaje</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-2xl text-slate-300 transition-colors"><X size={24} /></button>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cuenta <Required /></label>
                  <select name="service_account_id" value={formData.service_account_id} onChange={handleInputChange} className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-[#f58d2f]/30 text-sm font-bold text-slate-700 appearance-none">
                    <option value="">Seleccionar cuenta...</option>
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.description}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Material <Required /></label>
                  <select name="material_id" value={showCustomMaterial ? 'otro' : formData.material_id} onChange={handleInputChange} className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-[#f58d2f]/30 text-sm font-bold text-slate-700 appearance-none">
                    <option value="">Seleccionar material...</option>
                    {materials.map(mat => <option key={mat.id} value={mat.id}>{mat.name.toUpperCase()}</option>)}
                    <option value="otro">+ ESPECIFICAR OTRO</option>
                  </select>
                </div>

                {showCustomMaterial && (
                  <input type="text" name="custom_material" value={formData.custom_material} onChange={handleInputChange} className="w-full px-5 py-4 bg-slate-50 border-2 border-orange-100 rounded-2xl text-sm font-bold" placeholder="Nombre del material..." />
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cantidad <Required /></label>
                    <div className="relative">
                      <input type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        placeholder="0"
                        required
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Precio Unitario <Required /></label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                      <input type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        required
                        className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-12 pr-5 py-4 outline-none focus:border-[#f58d2f]/30 focus:bg-white transition-all text-sm font-bold text-slate-700"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 items-center">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fecha <Required /></label>
                    <input type="date" name="service_date" value={formData.service_date} onChange={handleInputChange} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold" />
                  </div>
                  {formData.quantity > 0 && formData.price > 0 && (
                    <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                      <p className="text-[9px] font-black text-[#f58d2f] uppercase">Subtotal</p>
                      <p className="text-lg font-black text-slate-800">{formatCurrency(formData.quantity * formData.price)}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 border-2 border-slate-100 rounded-2xl font-black text-slate-400 uppercase text-[11px] tracking-widest">Cerrar</button>
                <button onClick={handleSave}
                  disabled={!canSubmit}
                  className={`flex-[1.5] py-4 bg-gradient-to-br from-[#f58d2f] to-[#e87a1c] rounded-2xl font-black text-white shadow-xl shadow-orange-100 uppercase text-[11px] tracking-widest ${!canSubmit ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {formData.id ? 'Guardar Cambios' : 'Confirmar Registro'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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