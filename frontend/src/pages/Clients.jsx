import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Edit2, Trash2,
  User, Phone, MapPin,
  Mail, AlertTriangle, CheckCircle, Wallet, Hash, Users, X, Save, Loader2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axiosConfig';
import ConfirmModal from '../components/Modals/ConfirmModal';
import { useToast } from '../hooks/useToast';
import { fetchClients, QK } from '../api/queries';

const Clients = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const addToast = useToast();

  // --- CACHÉ: clientes ---
  const { data: clients = [], isLoading: loading } = useQuery({
    queryKey: QK.clients,
    queryFn: fetchClients,
  });

  // --- ESTADOS DE UI ---
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // --- ESTADO DEL FORMULARIO ---
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    phone_number: '',
  });

  // --- COMPONENTE AUXILIAR PARA CAMPOS OBLIGATORIOS ---
  const Required = () => <span className="text-orange-500 ml-1 font-bold" title="Obligatorio">*</span>;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleOpenAddModal = () => {
    setFormData({ name: '', email: '', address: '', phone_number: '' });
    setSelectedId(null);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (client) => {
    setFormData({
      name: client.name || '',
      email: client.email || '',
      address: client.address || '',
      phone_number: client.phone_number || '',
    });
    setSelectedId(client.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.name.trim()) errors.name = 'El nombre es obligatorio';
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    setIsSubmitting(true);
    try {
      const cleanData = Object.fromEntries(
        Object.entries(formData).map(([k, v]) => [k, v?.trim() || null])
      );
      if (isEditing) {
        await api.patch(`clients/${selectedId}/`, cleanData);
        addToast('Cliente actualizado con éxito.', 'success');
      } else {
        await api.post('clients/', cleanData);
        addToast('Cliente registrado con éxito.', 'success');
      }
      queryClient.invalidateQueries({ queryKey: QK.clients });
      setIsModalOpen(false);
    } catch (err) {
      addToast('Error al procesar la solicitud.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`clients/${selectedId}/`);
      queryClient.invalidateQueries({ queryKey: QK.clients });
      setShowDeleteModal(false);
      addToast('Cliente eliminado correctamente.', 'success');
    } catch {
      addToast('Error al eliminar el cliente.', 'error');
    }
  };

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const name = client.name || "";
      const doc = client.id?.toString() || "";
      const phone = client.phone_number || "";
      return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.includes(searchTerm) ||
        phone.includes(searchTerm);
    });
  }, [searchTerm, clients]);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 p-4 sm:p-12">
      <main className="max-w-7xl mx-auto">

        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-[#1a202c] tracking-tight">Directorio de Clientes <span className="text-[#f58d2f]">.</span> </h1>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#f58d2f] to-[#e87a1c] px-8 py-4 text-sm font-bold text-white shadow-xl shadow-orange-200 transition-all hover:-translate-y-1 active:scale-95 border-none"
          >
            <Plus className="h-5 w-5" />
            Registrar Cliente
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-5 mb-8">
          <div className="relative w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#f58d2f] transition-colors" />
            <input
              type="text"
              placeholder="Buscar por nombre, ID o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-[#f58d2f]/20 focus:bg-white transition-all text-sm font-medium shadow-inner"
            />
          </div>
        </div>

        {/* Tabla — solo desktop */}
        <div className="hidden md:block bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Cliente</th>
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Identificador</th>
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Contacto</th>
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Dirección</th>
                  <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [1, 2, 3, 4].map((i) => (
                    <tr key={i} className="animate-pulse border-b border-slate-50">
                      <td className="px-8 py-5"><div className="flex items-center gap-3"><div className="h-10 w-10 bg-slate-100 rounded-2xl flex-shrink-0" /><div className="h-4 bg-slate-100 rounded-lg w-36" /></div></td>
                      <td className="px-8 py-5"><div className="h-4 bg-slate-100 rounded-lg w-20" /></td>
                      <td className="px-8 py-5"><div className="h-4 bg-slate-100 rounded-lg w-28" /></td>
                      <td className="px-8 py-5"><div className="h-4 bg-slate-100 rounded-lg w-32" /></td>
                      <td className="px-8 py-5"><div className="h-6 bg-slate-100 rounded-xl w-20 mx-auto" /></td>
                    </tr>
                  ))
                ) : filteredClients.length > 0 ? (
                  filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center text-[#f58d2f] font-bold text-lg group-hover:scale-110 transition-transform shadow-sm">
                            {(client.name || "U").charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-[#1a202c] text-sm group-hover:text-[#f58d2f] transition-colors">{client.name}</p>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cliente Registrado</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-slate-600 font-bold text-sm bg-slate-100 w-fit px-3 py-1.5 rounded-lg">
                          <Hash size={14} className="text-slate-400" />
                          {client.id}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                            <Phone size={14} className="text-[#f58d2f]" />
                            {client.phone_number || 'N/A'}
                          </div>
                          <div className="flex items-center gap-2 text-slate-400 text-[11px] font-medium">
                            <Mail size={12} />
                            {client.email || 'Sin correo'}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm text-slate-500 italic">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="flex-shrink-0 text-slate-300" />
                          <span className="truncate max-w-[200px]">{client.address || 'Sin dirección'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="flex justify-center items-center gap-1">
                          <button
                            onClick={() => navigate(`/clientes/${client.id}/cuentas`)}
                            title="Ver Cuentas"
                            className="p-2.5 text-slate-400 hover:text-green-500 hover:bg-green-50 rounded-xl transition-all"
                          >
                            <Wallet size={18} />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(client)}
                            title="Editar"
                            className="p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedId(client.id);
                              setShowDeleteModal(true);
                            }}
                            title="Eliminar"
                            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center text-slate-400">
                      <Users size={48} className="mx-auto mb-4 opacity-20" />
                      <p className="font-bold">No se encontraron clientes</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cards — solo móvil */}
        <div className="md:hidden space-y-3">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-[2rem] border border-slate-100 p-5 animate-pulse space-y-3">
                <div className="flex items-center gap-3"><div className="h-10 w-10 bg-slate-100 rounded-2xl" /><div className="h-4 bg-slate-100 rounded-lg w-40" /></div>
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            ))
          ) : filteredClients.length > 0 ? filteredClients.map(client => (
            <div key={client.id} className="bg-white rounded-[2rem] border border-slate-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-orange-50 flex items-center justify-center text-[#f58d2f] font-bold text-lg shadow-sm flex-shrink-0">
                    {(client.name || 'U').charAt(0)}
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-sm">{client.name}</p>
                    <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold mt-0.5">
                      <Hash size={10} />{client.id}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => navigate(`/clientes/${client.id}/cuentas`)} className="p-2 text-slate-400 hover:text-green-500 hover:bg-green-50 rounded-xl transition-all"><Wallet size={16} /></button>
                  <button onClick={() => handleOpenEditModal(client)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={16} /></button>
                  <button onClick={() => { setSelectedId(client.id); setShowDeleteModal(true); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="space-y-1.5 pl-14">
                {(client.phone_number || client.email) && (
                  <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <Phone size={11} className="text-[#f58d2f] flex-shrink-0" />
                    <span className="font-bold">{client.phone_number || 'Sin teléfono'}</span>
                    {client.email && <><span className="text-slate-300">·</span><Mail size={11} className="flex-shrink-0" /><span className="truncate max-w-[140px]">{client.email}</span></>}
                  </div>
                )}
                {client.address && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <MapPin size={11} className="flex-shrink-0" />
                    <span className="truncate">{client.address}</span>
                  </div>
                )}
              </div>
            </div>
          )) : (
            <div className="bg-white rounded-[2rem] border border-slate-100 p-12 text-center">
              <Users size={40} className="mx-auto mb-3 text-slate-200" />
              <p className="text-slate-400 font-bold text-sm">No se encontraron clientes</p>
            </div>
          )}
        </div>
      </main>

      {/* MODAL PARA AGREGAR / EDITAR CLIENTE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
                    {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
                  </h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  {/* AGREGADO: Required aquí */}
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center">
                    Razón Social / Nombre <Required />
                  </label>
                  <div className="relative group">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#f58d2f] transition-colors" />
                    <input
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full bg-slate-50 border-2 rounded-2xl pl-12 pr-4 py-4 outline-none transition-all text-sm font-bold text-slate-700 shadow-inner ${fieldErrors.name ? 'border-red-300 focus:border-red-400' : 'border-transparent focus:border-[#f58d2f]/30 focus:bg-white'
                        }`}
                      placeholder="Ej. Juan Pérez o Empresa S.A."
                    />
                    {fieldErrors.name && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.name}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
                    <div className="relative group">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#f58d2f] transition-colors" />
                      <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-[#f58d2f]/30 focus:bg-white transition-all text-sm font-bold text-slate-700 shadow-inner"
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                    <div className="relative group">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#f58d2f] transition-colors" />
                      <input
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-[#f58d2f]/30 focus:bg-white transition-all text-sm font-bold text-slate-700 shadow-inner"
                        placeholder="+57 300..."
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Dirección de Oficina</label>
                  <div className="relative group">
                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#f58d2f] transition-colors" />
                    <input
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-[#f58d2f]/30 focus:bg-white transition-all text-sm font-bold text-slate-700 shadow-inner"
                      placeholder="Calle 123 #45-67..."
                    />
                  </div>
                </div>

                <div className="mt-10 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-4 border-2 border-slate-100 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all text-[11px] uppercase tracking-[0.2em]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.name.trim()}
                    className="flex-1 px-6 py-4 bg-gradient-to-br from-[#f58d2f] to-[#e87a1c] rounded-2xl font-black text-white shadow-xl shadow-orange-100 hover:brightness-110 transition-all text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 border-none disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Registrar')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar cliente?"
        message="Esta acción no se puede deshacer y eliminará permanentemente al cliente de la base de datos."
      />
    </div>
  );
};

export default Clients;