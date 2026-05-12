import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Filter, ArrowUpDown, MoreHorizontal,
  MapPin, Phone, Mail, FileText, ChevronRight, Settings, Trash2, Edit2, ShieldAlert, Check, X, User, Save, Loader2, Hash, Wallet, Users
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axiosConfig';
import Button from '../components/UI/Button';
import EmptyState from '../components/UI/EmptyState';
import SkeletonList from '../components/UI/SkeletonList';
import Pagination from '../components/UI/Pagination';
import QueryError from '../components/UI/QueryError';
import ConfirmModal from '../components/Modals/ConfirmModal';
import ClientFormModal from '../components/Modals/ClientFormModal';
import { useToast } from '../hooks/useToast';
import { extractError } from '../utils/extractError';
import { fetchClients, QK } from '../api/queries';

const Clients = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const addToast = useToast();

  // --- CACHÉ: clientes ---
  const { data: clients = [], isLoading: loading, isError, error, refetch } = useQuery({
    queryKey: QK.clients,
    queryFn: fetchClients,
  });

  // --- PAGINACIÓN ---
  const [page, setPage] = useState(1);
  const perPage = 9;

  // --- MUTACIONES OPTIMISTAS ---
  const createMutation = useMutation({
    mutationFn: (data) => api.post('clients/', data).then(r => r.data),
    onSuccess: () => { addToast('Cliente registrado con éxito.', 'success'); setIsModalOpen(false); },
    onError: (err) => addToast(extractError(err), 'error'),
    onSettled: () => { queryClient.invalidateQueries({ queryKey: QK.clients }); setPage(1); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`clients/${id}/`, data).then(r => r.data),
    onMutate: async ({ id, ...data }) => {
      await queryClient.cancelQueries({ queryKey: QK.clients });
      const prev = queryClient.getQueryData(QK.clients);
      queryClient.setQueryData(QK.clients, old => old?.map(c => c.id === id ? { ...c, ...data } : c));
      return { prev };
    },
    onSuccess: () => { addToast('Cliente actualizado con éxito.', 'success'); setIsModalOpen(false); },
    onError: (err, vars, ctx) => { queryClient.setQueryData(QK.clients, ctx?.prev); addToast(extractError(err), 'error'); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QK.clients }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`clients/${id}/`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QK.clients });
      const prev = queryClient.getQueryData(QK.clients);
      queryClient.setQueryData(QK.clients, old => old?.filter(c => c.id !== id));
      return { prev };
    },
    onSuccess: () => addToast('Cliente eliminado correctamente.', 'success'),
    onError: (err, id, ctx) => { queryClient.setQueryData(QK.clients, ctx?.prev); addToast(extractError(err), 'error'); },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: QK.clients }); setShowDeleteModal(false); },
  });

  // --- ESTADOS DE UI ---
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isMutating) return;
    const errors = {};
    if (!formData.name.trim()) errors.name = 'El nombre es obligatorio';
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    const cleanData = Object.fromEntries(
      Object.entries(formData).map(([k, v]) => [k, v?.trim() || null])
    );
    if (isEditing) {
      updateMutation.mutate({ id: selectedId, ...cleanData });
    } else {
      createMutation.mutate(cleanData);
    }
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate(selectedId);
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

  const pageCount = Math.max(1, Math.ceil(filteredClients.length / perPage));
  const paginatedClients = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredClients.slice(start, start + perPage);
  }, [filteredClients, page, perPage]);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 p-4 sm:p-12 page-enter">
      <main className="max-w-7xl mx-auto">

        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-[#1a202c] tracking-tight">Directorio de Clientes <span className="text-[#f58d2f]">.</span> </h1>
          </div>
          <div className="flex gap-3 ml-auto w-full md:w-auto">
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={handleAddNew}
              className="flex-1 md:flex-none"
            >
              Nuevo Cliente
            </Button>
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

        {isError ? (
          <QueryError message={extractError(error)} onRetry={() => { setPage(1); refetch(); }} />
        ) : (
        <>
        {/* Directorio de Clientes - Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <SkeletonList desktop count={6} />
          ) : paginatedClients.length > 0 ? (
            paginatedClients.map((client) => (
              <div 
                key={client.id} 
                className="group relative bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white hover:border-[#f58d2f]/20 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] transition-all duration-500 overflow-hidden flex flex-col p-6 animate-in zoom-in-95 duration-500"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative flex-shrink-0">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-50 to-white border border-orange-100 flex items-center justify-center text-[#f58d2f] font-black text-2xl shadow-sm group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                      {(client.name || "U").charAt(0)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID-{client.id}</span>
                      <span className="h-1 w-1 rounded-full bg-emerald-400" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight group-hover:text-[#f58d2f] transition-colors truncate">
                      {client.name}
                    </h3>
                  </div>
                </div>

                <div className="space-y-3 mb-6 flex-1">
                  <div className="flex items-center gap-3 text-slate-500">
                    <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-orange-50 group-hover:text-[#f58d2f] transition-colors">
                      <Phone size={14} />
                    </div>
                    <span className="text-xs font-bold">{client.phone_number || 'No asignado'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-orange-50 group-hover:text-[#f58d2f] transition-colors">
                      <Mail size={14} />
                    </div>
                    <span className="text-xs font-bold truncate max-w-[180px]">{client.email || 'Sin correo'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 italic mt-1 pl-1">
                    <MapPin size={12} className="flex-shrink-0" />
                    <span className="text-body-sm font-medium truncate">{client.address || 'Sin dirección registrada'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-slate-50/50">
                  <Button variant="success" size="sm" icon={Wallet} onClick={() => navigate(`/clientes/${client.id}/cuentas`)} className="flex-1"><span>Cuentas</span></Button>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" icon={Edit2} aria-label="Editar cliente" onClick={() => handleOpenEditModal(client)} />
                    <Button variant="ghost" size="icon" icon={Trash2} aria-label="Eliminar cliente" className="hover:text-red-500 hover:bg-red-50" onClick={() => { setSelectedId(client.id); setShowDeleteModal(true); }} />
                  </div>
                </div>

                <Users size={80} className="absolute -bottom-4 -right-4 text-slate-900/[0.02] -rotate-12 pointer-events-none" />
              </div>
            ))
          ) : (
            <EmptyState icon={Users} title="Sin resultados" description="No se encontraron clientes" />
          )}
        </div>
        {!loading && !isError && <Pagination page={page} totalPages={pageCount} onChange={setPage} />}

        {/* Cards — solo móvil */}
        <div className="md:hidden space-y-3">
          {loading ? (
            <SkeletonList rows={3} />
          ) : paginatedClients.length > 0 ? paginatedClients.map(client => (
            <div key={client.id} className="bg-white/80 backdrop-blur-xl rounded-[1.75rem] border border-white p-4 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#f58d2f] font-bold text-base shadow-sm flex-shrink-0">
                    {(client.name || 'U').charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-slate-900 text-[13px] tracking-tight leading-tight truncate">{client.name}</p>
                    <div className="flex items-center gap-1 text-slate-400 text-[9px] font-bold tracking-widest uppercase">ID-{client.id}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" icon={Wallet} aria-label="Ver cuentas" className="hover:text-green-500 hover:bg-green-50" onClick={() => navigate(`/clientes/${client.id}/cuentas`)} title="Ver Cuentas" />
                  <Button variant="ghost" size="icon" icon={Edit2} aria-label="Editar cliente" className="hover:text-blue-500 hover:bg-blue-50" onClick={() => handleOpenEditModal(client)} />
                  <Button variant="ghost" size="icon" icon={Trash2} aria-label="Eliminar cliente" className="hover:text-red-500 hover:bg-red-50" onClick={() => { setSelectedId(client.id); setShowDeleteModal(true); }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pl-1">
                {client.phone_number && (
                  <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold">
                    <div className="h-6 w-6 rounded-lg bg-orange-50/50 flex items-center justify-center text-[#f58d2f]"><Phone size={10} /></div>
                    <span className="truncate">{client.phone_number}</span>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-2 text-slate-500 text-body-sm font-bold">
                    <div className="h-6 w-6 rounded-lg bg-orange-50/50 flex items-center justify-center text-[#f58d2f]">
                       <Phone size={10} />
                    </div>
                    <span className="truncate">{client.phone_number}</span>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-2 text-slate-500 text-body-sm font-bold">
                    <div className="h-6 w-6 rounded-lg bg-orange-50/50 flex items-center justify-center text-[#f58d2f]">
                       <Mail size={10} />
                    </div>
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.address && (
                  <div className="col-span-2 flex items-center gap-2 text-slate-400 text-[10px] font-medium italic">
                    <MapPin size={9} className="flex-shrink-0" />
                    <span className="truncate">{client.address}</span>
                  </div>
                )}
                {client.address && (
                  <div className="col-span-2 flex items-center gap-2 text-slate-400 text-[9px] font-medium italic">
                    <MapPin size={9} className="flex-shrink-0" />
                    <span className="truncate">{client.address}</span>
                  </div>
                )}
              </div>
            </div>
          )) : (
            <EmptyState icon={Users} title="Sin resultados" description="No se encontraron clientes" />
          )}
        </div>
        </>
        )}
      </main>

      <ClientFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isEditing={isEditing}
        formData={formData}
        fieldErrors={fieldErrors}
        isSubmitting={isMutating}
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