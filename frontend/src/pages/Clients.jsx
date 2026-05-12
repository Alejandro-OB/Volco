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
        {/* Directorio de Clientes - Desktop Table */}
        <div className="hidden md:block bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="p-6">
              <SkeletonList desktop count={6} />
            </div>
          ) : paginatedClients.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-3 w-10" />
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Cliente</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Teléfono</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Email</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Dirección</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="h-9 w-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#f58d2f] font-black text-base flex-shrink-0">
                        {(client.name || 'U').charAt(0)}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-black text-slate-900 text-sm leading-tight">{client.name}</p>
                      <p className="text-[10px] font-bold text-slate-400  mt-0.5">ID-{client.id}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-medium text-slate-600">{client.phone_number || <span className="text-slate-300 italic text-xs">—</span>}</span>
                    </td>
                    <td className="px-5 py-3.5 max-w-[180px]">
                      <span className="text-sm font-medium text-slate-600 truncate block">{client.email || <span className="text-slate-300 italic text-xs">—</span>}</span>
                    </td>
                    <td className="px-5 py-3.5 max-w-[200px]">
                      <span className="text-sm font-medium text-slate-500 italic truncate block">{client.address || <span className="text-slate-300 italic text-xs">—</span>}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="success" size="sm" icon={Wallet} onClick={() => navigate(`/cuentas?cliente=${client.id}`)}>Cuentas</Button>
                        <Button variant="ghost" size="icon" icon={Edit2} aria-label="Editar cliente" onClick={() => handleOpenEditModal(client)} />
                        <Button variant="ghost" size="icon" icon={Trash2} aria-label="Eliminar cliente" className="hover:text-red-500 hover:bg-red-50" onClick={() => { setSelectedId(client.id); setShowDeleteModal(true); }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-16">
              <EmptyState icon={Users} title="Sin resultados" description="No se encontraron clientes" />
            </div>
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
                    <div className="flex items-center gap-1 text-slate-400 text-[9px] font-bold">ID-{client.id}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" icon={Wallet} aria-label="Ver cuentas" className="hover:text-green-500 hover:bg-green-50" onClick={() => navigate(`/cuentas?cliente=${client.id}`)} title="Ver Cuentas" />
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
                  <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold">
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