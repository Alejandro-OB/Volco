import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Filter, ArrowUpDown, MoreHorizontal,
  MapPin, Phone, Mail, FileText, ChevronRight, Settings, Trash2, Edit2, ShieldAlert, Check, X, User, Save, Loader2, DownloadCloud, Hash, Wallet, Users
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axiosConfig';
import ConfirmModal from '../components/Modals/ConfirmModal';
import ClientFormModal from '../components/Modals/ClientFormModal';
import { useToast } from '../hooks/useToast';
import { fetchClients, QK } from '../api/queries';
import { exportToExcel, formatClientsForExport } from '../utils/exportUtils';

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

  const handleExport = () => {
    if (!clients?.length) return;
    const formatted = formatClientsForExport(filteredClients);
    exportToExcel(formatted, 'Clientes');
    addToast('Archivo Excel descargado', 'success');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleAddNew = () => {
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
    if (isSubmitting) return;
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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QK.clients }),
        queryClient.invalidateQueries({ queryKey: QK.accounts }),
        queryClient.invalidateQueries({ queryKey: ['services'] })
      ]);
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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QK.clients }),
        queryClient.invalidateQueries({ queryKey: QK.accounts }),
        queryClient.invalidateQueries({ queryKey: ['services'] })
      ]);
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
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 p-4 sm:p-12 page-enter">
      <main className="max-w-7xl mx-auto">

        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-[#1a202c] tracking-tight">Directorio de Clientes <span className="text-[#f58d2f]">.</span> </h1>
          </div>
          <div className="flex gap-3 ml-auto w-full md:w-auto">
            <button
              onClick={handleExport}
              disabled={!clients?.length}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-white text-slate-500 hover:text-[#f58d2f] hover:bg-orange-50 border-2 border-slate-100 rounded-2xl font-bold transition-all text-xs"
              title="Exportar a Excel"
            >
              <DownloadCloud size={18} />
              <span className="hidden sm:inline">Exportar</span>
            </button>
            <button
              onClick={handleAddNew}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-[#f58d2f] text-white rounded-2xl font-bold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5 transition-all text-xs"
            >
              <Plus size={18} />
              Nuevo Cliente
            </button>
          </div>
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
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-medium shadow-inner input-fancy"
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
                    <tr key={i} className="border-b border-slate-50">
                      <td className="px-8 py-5"><div className="flex items-center gap-3"><div className="skeleton h-10 w-10 rounded-2xl flex-shrink-0" /><div className="skeleton h-4 w-36" /></div></td>
                      <td className="px-8 py-5"><div className="skeleton h-4 w-20" /></td>
                      <td className="px-8 py-5"><div className="skeleton h-4 w-28" /></td>
                      <td className="px-8 py-5"><div className="skeleton h-4 w-32" /></td>
                      <td className="px-8 py-5"><div className="skeleton h-6 w-20 mx-auto" /></td>
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
                          <div className="tooltip-wrapper">
                            <button onClick={() => navigate(`/clientes/${client.id}/cuentas`)} className="p-2.5 text-slate-400 hover:text-green-500 hover:bg-green-50 rounded-xl transition-all"><Wallet size={18} /></button>
                            <span className="tooltip-text">Ver Cuentas</span>
                          </div>
                          <div className="tooltip-wrapper">
                            <button onClick={() => handleOpenEditModal(client)} className="p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={18} /></button>
                            <span className="tooltip-text">Editar</span>
                          </div>
                          <div className="tooltip-wrapper">
                            <button onClick={() => { setSelectedId(client.id); setShowDeleteModal(true); }} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                            <span className="tooltip-text">Eliminar</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-20 w-20 rounded-3xl bg-slate-50 flex items-center justify-center mb-1">
                          <Users size={36} className="text-slate-200" />
                        </div>
                        <p className="text-slate-700 font-bold text-base">No se encontraron clientes</p>
                        <p className="text-slate-400 text-sm">Crea el primer cliente usando el botón superior</p>
                      </div>
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
              <div key={i} className="bg-white rounded-[2rem] border border-slate-100 p-5 space-y-3">
                <div className="flex items-center gap-3"><div className="skeleton h-10 w-10 rounded-2xl" /><div className="skeleton h-4 w-40" /></div>
                <div className="skeleton h-3 w-full" />
                <div className="skeleton h-3 w-2/3" />
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

      <ClientFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isEditing={isEditing}
        formData={formData}
        fieldErrors={fieldErrors}
        isSubmitting={isSubmitting}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
      />

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