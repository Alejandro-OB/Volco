import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axiosConfig';
import ConfirmModal from '../components/Modals/ConfirmModal';
import { useToast } from '../hooks/useToast';
import MaterialFormModal from '../components/Modals/MaterialFormModal';
import EmptyState from '../components/UI/EmptyState';
import SkeletonList from '../components/UI/SkeletonList';
import Pagination from '../components/UI/Pagination';
import QueryError from '../components/UI/QueryError';
import { extractError } from '../utils/extractError';
import { fetchMaterials, QK } from '../api/queries';
import { Plus, Edit2, Trash2, Box, Search } from 'lucide-react';

const Materials = () => {
  const queryClient = useQueryClient();
  const addToast = useToast();

  // --- CACHÉ: materiales ---
  const { data: materials = [], isLoading: loading, isError, error, refetch } = useQuery({
    queryKey: QK.materials,
    queryFn: fetchMaterials,
  });

  // --- PAGINACIÓN ---
  const [page, setPage] = useState(1);
  const perPage = 9;

  // --- MUTACIONES OPTIMISTAS ---
  const createMutation = useMutation({
    mutationFn: (data) => api.post('/materials/', data).then(r => r.data),
    onSuccess: () => { addToast('Material registrado.', 'success'); setIsModalOpen(false); },
    onError: (err) => addToast(extractError(err), 'error'),
    onSettled: () => { queryClient.invalidateQueries({ queryKey: QK.materials }); setPage(1); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/materials/${id}/`, data).then(r => r.data),
    onMutate: async ({ id, ...data }) => {
      await queryClient.cancelQueries({ queryKey: QK.materials });
      const prev = queryClient.getQueryData(QK.materials);
      queryClient.setQueryData(QK.materials, old => old?.map(m => m.id === id ? { ...m, ...data } : m));
      return { prev };
    },
    onSuccess: () => { addToast('Material actualizado.', 'success'); setIsModalOpen(false); },
    onError: (err, vars, ctx) => { queryClient.setQueryData(QK.materials, ctx?.prev); addToast(extractError(err), 'error'); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QK.materials }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/materials/${id}/`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QK.materials });
      const prev = queryClient.getQueryData(QK.materials);
      queryClient.setQueryData(QK.materials, old => old?.filter(m => m.id !== id));
      return { prev };
    },
    onSuccess: () => { addToast('Material eliminado.', 'success'); setConfirmOpen(false); },
    onError: (err, id, ctx) => { queryClient.setQueryData(QK.materials, ctx?.prev); addToast(extractError(err), 'error'); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QK.materials }),
  });

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  // --- ESTADOS DE UI ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // --- FORMULARIO ---
  const [formData, setFormData] = useState({ name: '', price: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleOpenModal = (material = null) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({ name: material.name, price: material.price });
    } else {
      setEditingMaterial(null);
      setFormData({ name: '', price: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (isMutating) return;
    const errors = {};
    if (!formData.name.trim()) errors.name = 'El nombre del material es obligatorio';
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    if (editingMaterial) {
      updateMutation.mutate({ id: editingMaterial.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate(selectedId);
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val);

  const filteredMaterials = materials.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pageCount = Math.max(1, Math.ceil(filteredMaterials.length / perPage));
  const paginatedMaterials = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredMaterials.slice(start, start + perPage);
  }, [filteredMaterials, page, perPage]);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 p-4 sm:p-12 page-enter">
      <div className="max-w-3xl mx-auto">

        {/* ENCABEZADO */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4">
            <div>
              <h1 className="text-5xl font-black text-[#1a202c] tracking-tight">Materiales <span className="text-[#f58d2f]">.</span></h1>
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => handleOpenModal()}
          >
            Registrar Material
          </Button>
        </div>

        {/* BUSCADOR RÁPIDO */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input
            type="text"
            placeholder="Buscar material..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-sm input-fancy"
          />
        </div>

        {isError ? (
          <QueryError message={extractError(error)} onRetry={() => { setPage(1); refetch(); }} />
        ) : (
        <>
        {/* Catálogo de Materiales - Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <SkeletonList desktop count={6} />
          ) : paginatedMaterials.length > 0 ? (
            paginatedMaterials.map((m) => (
              <div 
                key={m.id} 
                className="group relative bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white hover:border-[#f58d2f]/20 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] transition-all duration-500 overflow-hidden flex flex-col items-center text-center p-8 animate-in zoom-in-95 duration-500"
              >
                {/* Visual Icon Section */}
                <div className="relative mb-6">
                  <div className="h-20 w-20 rounded-[2.25rem] bg-gradient-to-br from-orange-50 to-white border border-orange-100 flex items-center justify-center text-[#f58d2f] shadow-sm group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
                    <Box size={32} />
                  </div>
                  <div className="absolute -top-2 -right-2 px-3 py-1 bg-white border border-slate-100 rounded-full shadow-sm text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    #{m.id}
                  </div>
                </div>

                {/* Info Section */}
                <div className="flex-1 space-y-1 mb-6">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-[#f58d2f] transition-colors uppercase">
                    {m.name}
                  </h3>
                  <p className="text-body-sm font-black text-slate-400 uppercase tracking-[0.2em]">Material Suministrado</p>
                </div>

                {/* Price Hero Section */}
                <div className="w-full bg-slate-50 rounded-3xl p-5 border border-slate-100/50 group-hover:bg-orange-50/50 transition-colors">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Precio Base por Viaje</span>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    {formatCurrency(m.price)}
                  </div>
                </div>

                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    icon={Edit2}
                    aria-label="Editar material"
                    className="!p-3 border-transparent shadow-xl"
                    onClick={() => handleOpenModal(m)} 
                  />
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    icon={Trash2}
                    aria-label="Eliminar material"
                    className="!p-3 border-transparent shadow-xl hover:text-red-500"
                    onClick={() => { setSelectedId(m.id); setConfirmOpen(true); }} 
                  />
                </div>

                {/* Bottom Glow Line */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#f58d2f]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))
          ) : null}
        </div>
        {!loading && !isError && <Pagination page={page} totalPages={pageCount} onChange={setPage} />}

        {/* Catálogo de Materiales — Mobile List */}
        <div className="md:hidden space-y-3">
          {loading ? (
            <SkeletonList rows={3} />
          ) : paginatedMaterials.length > 0 ? (
            paginatedMaterials.map((m) => (
              <div key={m.id} className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white p-4 shadow-sm flex items-center justify-between group">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#f58d2f] flex-shrink-0 shadow-sm">
                    <Box size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-tight truncate">{m.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] font-black text-[#f58d2f] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">{formatCurrency(m.price)}</span>
                      <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">ID-{m.id}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    icon={Edit2}
                    aria-label="Editar material"
                    className="hover:text-blue-500"
                    onClick={() => handleOpenModal(m)} 
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    icon={Trash2}
                    aria-label="Eliminar material"
                    className="hover:text-red-500"
                    onClick={() => { setSelectedId(m.id); setConfirmOpen(true); }} 
                  />
                </div>
              </div>
            ))
          ) : (
            <EmptyState icon={Box} title="Sin resultados" description="No se encontraron materiales" />
          )}
        </div>
        </>
        )}
      </div>

      <MaterialFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isEditing={!!editingMaterial}
        formData={formData}
        fieldErrors={fieldErrors}
        isSubmitting={isMutating}
        onFieldChange={handleFieldChange}
        onSubmit={handleSave}
      />

      {/* MODAL DE CONFIRMACIÓN PARA ELIMINAR */}
      <ConfirmModal
        show={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="¿Eliminar material?"
        message="Esta acción no se puede deshacer y el material se quitará del catálogo activo."
      />
    </div>
  );
};

export default Materials;