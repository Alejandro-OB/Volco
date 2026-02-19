import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus, Edit2, Trash2, Calendar, ChevronDown, ChevronRight, X, Check, 
  Hash, Wallet, Mountain, Package, AlertTriangle, CheckCircle, 
  DollarSign
} from 'lucide-react';
import api from '../api/axiosConfig';
import ConfirmModal from './Modals/ConfirmModal';

function Services() {
  const [services, setServices] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [targetId, setTargetId] = useState(null);
  const [showCustomMaterial, setShowCustomMaterial] = useState(false);
  const [collapsedAccounts, setCollapsedAccounts] = useState({});
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');

  const navigate = useNavigate();
  // Capturamos el accountId de la URL (si existe)
  const { accountId } = useParams();

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

  // Carga de catálogos (Cuentas y Materiales)
  useEffect(() => {
    const fetchAux = async () => {
      try {
        const [accRes, matRes] = await Promise.all([
          api.get('service-accounts/'),
          api.get('materials/')
        ]);
        setAccounts(accRes.data);
        setMaterials(matRes.data);
      } catch (err) { console.error(err); }
    };
    fetchAux();
  }, []);

  // --- FETCH DE SERVICIOS FILTRADO ---
  const fetchServices = async () => {
    setLoading(true);
    try {
      // Si hay accountId en la URL, usamos el endpoint filtrado, si no, traemos todos
      const url = accountId ? `account-services/${accountId}/services/` : 'services/';
      const res = await api.get(url);
      setServices(res.data);
      
      // Inicializar colapsado:
      // Si es una sola cuenta (por URL), la dejamos expandida por comodidad, 
      // si son todas, las colapsamos.
      const uniqueAccounts = [...new Set(res.data.map(s => getAccountName(s.service_account_id)))];
      const initialCollapsed = {};
      uniqueAccounts.forEach(name => {
        initialCollapsed[name] = accountId ? false : true; 
      });
      setCollapsedAccounts(initialCollapsed);

    } catch (err) { 
      setServices([]); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchServices();
  }, [accountId]); // Se vuelve a ejecutar si la URL cambia

  const groupedData = useMemo(() => {
    if (!services.length) return {};
    const sorted = [...services].sort((a, b) => new Date(b.service_date) - new Date(a.service_date));

    return sorted.reduce((acc, service) => {
      const accountName = getAccountName(service.service_account_id);
      if (!acc[accountName]) acc[accountName] = [];
      acc[accountName].push(service);
      return acc;
    }, {});
  }, [services, accounts]);

  const toggleAccount = (name) => {
    setCollapsedAccounts(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const showStatus = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(null), 4000);
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
        // --- MODO EDICIÓN ---
        await api.patch(`services/${formData.id}/`, payload);
        showStatus('Registro actualizado');
        setIsModalOpen(false); // Se cierra al editar
      } else {
        // --- MODO REGISTRO NUEVO ---
        await api.post('services/', payload);
        showStatus('Registro exitoso');
        
        // NO cerramos el modal, pero reseteamos campos para el siguiente registro
        setFormData(prev => ({
          ...prev,
          material_id: '',
          custom_material: '',
          quantity: '',
          price: '',
          // Mantenemos service_account_id y service_date para agilizar carga masiva
        }));
        setShowCustomMaterial(false);
      }
      
      fetchServices(); // Refrescar la lista al fondo
    } catch (err) { 
      showStatus('Error al guardar', 'error'); 
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`services/${targetId}/`);
      setServices(prev => prev.filter(s => s.id !== targetId));
      setShowDeleteModal(false);
      showStatus('Eliminado con éxito');
    } catch (err) { showStatus('Error al eliminar', 'error'); }
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
    <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-12 font-sans">
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

        {/* MENSAJES */}
        {message && (
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl border-2 mb-8 animate-in fade-in slide-in-from-top-2 ${
            messageType === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
          }`}>
            <CheckCircle size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">{message}</span>
          </div>
        )}

        {/* TABLA */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
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
                  <tr><td colSpan="5" className="py-20 text-center text-slate-400 font-black uppercase text-[10px] animate-pulse">Cargando datos...</td></tr>
                ) : Object.keys(groupedData).length === 0 ? (
                  <tr><td colSpan="5" className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Sin movimientos registrados</td></tr>
                ) : Object.entries(groupedData).map(([accountName, accountServices]) => (
                  <React.Fragment key={accountName}>
                    <tr className="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-sm">
                      <td colSpan="5" className="px-8 py-4">
                        <button onClick={() => toggleAccount(accountName)} className="flex items-center gap-4 w-full group">
                          <div className={`p-1 rounded-lg transition-all ${collapsedAccounts[accountName] ? 'bg-slate-200 text-slate-500' : 'bg-orange-100 text-[#f58d2f]'}`}>
                            {collapsedAccounts[accountName] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                          </div>
                          <Wallet size={18} className="text-[#f58d2f]" />
                          <span className="text-sm font-black text-slate-800 uppercase tracking-tighter">{accountName}</span>
                          <div className="h-[1px] flex-1 bg-slate-200 group-hover:bg-orange-200 transition-colors"></div>
                          <span className="text-[10px] font-black text-slate-400 uppercase bg-white px-3 py-1 rounded-full border border-slate-100">{accountServices.length} vjs</span>
                        </button>
                      </td>
                    </tr>
                    {!collapsedAccounts[accountName] && accountServices.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/30 transition-all group animate-in slide-in-from-top-1 duration-200">
                        <td className="px-8 py-6">
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
                            <button onClick={() => handleOpenModal(s)} className="p-2 text-slate-300 hover:text-blue-500 transition-colors"><Edit2 size={16} /></button>
                            <button onClick={() => { setTargetId(s.id); setShowDeleteModal(true); }} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
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