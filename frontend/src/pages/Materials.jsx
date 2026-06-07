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
import { Plus, Edit2, Trash2, Box } from 'lucide-react';
import Button from '../components/UI/Button';
import { Table, TableHead, Th, TableBody, TableRow, Td } from '../components/UI/Table';
import { SearchInput } from '../components/UI/SearchFilterBar';

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
  const [formData, setFormData] = useState({ name: '', price: '', transport_price: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleOpenModal = (material = null) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({ name: material.name, price: material.price ?? '', transport_price: material.transport_price ?? '' });
    } else {
      setEditingMaterial(null);
      setFormData({ name: '', price: '', transport_price: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (isMutating) return;
    const errors = {};
    if (!formData.name.trim()) errors.name = 'El nombre del material es obligatorio';
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    const data = {
      ...formData,
      name: formData.name.trim().toUpperCase(),
      transport_price: formData.transport_price !== '' ? Number(formData.transport_price) : null,
    };
    if (editingMaterial) {
      updateMutation.mutate({ id: editingMaterial.id, ...data });
    } else {
      createMutation.mutate(data);
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
    <div className="min-h-screen font-sans text-slate-900 p-4 sm:p-12 page-enter">
      <div className="max-w-3xl mx-auto">

        {/* ENCABEZADO */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4">
            <div>
              <h1 className="text-4xl font-black text-[#1a202c] tracking-tight">Materiales <span className="text-[#f58d2f]">.</span></h1>
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
        <div className="mb-6">
          <SearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar material..."
          />
        </div>

        {isError ? (
          <QueryError message={extractError(error)} onRetry={() => { setPage(1); refetch(); }} />
        ) : (
        <>
        {/* Catálogo de Materiales - Tabla */}
        <div className="hidden md:block bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="divide-y divide-slate-100">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                  <div className="h-8 w-8 bg-slate-100 rounded-xl flex-shrink-0" />
                  <div className="h-3 bg-slate-100 rounded w-40" />
                  <div className="h-3 bg-slate-100 rounded w-28 ml-auto" />
                  <div className="h-6 bg-slate-100 rounded-xl w-16" />
                </div>
              ))}
            </div>
          ) : paginatedMaterials.length > 0 ? (
            <Table>
              <TableHead>
                <tr>
                  <Th className="w-10" />
                  <Th>Material</Th>
                  <Th align="right">Precio base por viaje</Th>
                  <Th align="right">Acciones</Th>
                </tr>
              </TableHead>
              <TableBody>
                {paginatedMaterials.map((m) => (
                  <TableRow key={m.id}>
                    <Td>
                      <div className="h-9 w-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#f58d2f]">
                        <Box size={16} />
                      </div>
                    </Td>
                    <Td>
                      <p className="text-sm text-slate-800 group-hover:text-[#f58d2f] transition-colors">{m.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">ID-{m.id}</p>
                    </Td>
                    <Td align="right">
                      <span className="text-sm text-slate-700 tabular-nums">{formatCurrency(m.price)}</span>
                      {m.transport_price != null && (
                        <p className="text-xs text-slate-400 mt-0.5 tabular-nums">Transporte: {formatCurrency(m.transport_price)}</p>
                      )}
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" icon={Edit2} aria-label="Editar material" onClick={() => handleOpenModal(m)} />
                        <Button variant="ghost" size="icon" icon={Trash2} aria-label="Eliminar material" className="hover:text-red-500" onClick={() => { setSelectedId(m.id); setConfirmOpen(true); }} />
                      </div>
                    </Td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState icon={Box} title="Sin resultados" description="No se encontraron materiales" />
          )}
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
                    <h3 className="text-sm font-black text-slate-900 leading-tight truncate">{m.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] font-black text-[#f58d2f] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">{formatCurrency(m.price)}</span>
                      <span className="text-[9px] font-bold text-slate-300">ID-{m.id}</span>
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