import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axiosConfig';
import ConfirmModal from '../components/Modals/ConfirmModal';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { fetchMaterials, QK } from '../api/queries';
import {
  Plus,
  Edit2,
  Trash2,
  Box,
  X,
  Check,
  DollarSign,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Search
} from 'lucide-react';

const Materials = () => {
  const queryClient = useQueryClient();
  const addToast = useToast();
  const navigate = useNavigate();

  // --- CACHÉ: materiales ---
  const { data: materials = [], isLoading: loading } = useQuery({
    queryKey: QK.materials,
    queryFn: fetchMaterials,
  });

  // --- ESTADOS DE UI ---
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // --- FORMULARIO ---
  const [formData, setFormData] = useState({ name: '', price: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  const Required = () => <span className="text-orange-500 ml-1 font-bold" title="Obligatorio">*</span>;

  // --- HANDLERS ---
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

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    const errors = {};
    if (!formData.name.trim()) errors.name = 'El nombre del material es obligatorio';
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    setSaving(true);
    try {
      if (editingMaterial) {
        await api.patch(`/materials/${editingMaterial.id}/`, formData);
        addToast('Material actualizado.', 'success');
      } else {
        await api.post('/materials/', formData);
        addToast('Material registrado.', 'success');
      }
      await queryClient.invalidateQueries({ queryKey: QK.materials });
      setIsModalOpen(false);
    } catch (err) {
      addToast('Error al procesar la solicitud', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/materials/${selectedId}/`);
      await queryClient.invalidateQueries({ queryKey: QK.materials });
      setConfirmOpen(false);
      addToast('Material eliminado.', 'success');
    } catch (err) {
      addToast('No se pudo eliminar el material.', 'error');
    }
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val);

  // Filtrado simple para la UI
  const filteredMaterials = materials.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#f58d2f] to-[#e87a1c] px-8 py-4 text-sm font-bold text-white shadow-xl shadow-orange-200 transition-all hover:-translate-y-1 active:scale-95 border-none"
          >
            <Plus className="h-5 w-5" />
            Registrar Material
          </button>
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

        {/* Catálogo de Materiales - Premium Grid Layer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-[2rem] border border-slate-100 p-8 animate-pulse space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-slate-50 mx-auto" />
                <div className="h-5 bg-slate-50 rounded-lg w-1/2 mx-auto" />
                <div className="h-4 bg-slate-50 rounded-lg w-1/3 mx-auto" />
              </div>
            ))
          ) : filteredMaterials.length > 0 ? (
            filteredMaterials.map((m) => (
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
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Material Suministrado</p>
                </div>

                {/* Price Hero Section */}
                <div className="w-full bg-slate-50 rounded-3xl p-5 border border-slate-100/50 group-hover:bg-orange-50/50 transition-colors">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Precio Base por Viaje</span>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    {formatCurrency(m.price)}
                  </div>
                </div>

                {/* Action Floating Buttons */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                  <button 
                    onClick={() => handleOpenModal(m)} 
                    className="p-3 bg-white shadow-xl hover:text-blue-500 rounded-2xl border border-slate-100 transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => { setSelectedId(m.id); setConfirmOpen(true); }} 
                    className="p-3 bg-white shadow-xl hover:text-red-500 rounded-2xl border border-slate-100 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Bottom Glow Line */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#f58d2f]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 bg-white rounded-[3rem] border border-slate-100 text-center shadow-sm">
              <div className="flex flex-col items-center gap-6">
                <div className="h-24 w-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-200">
                  <Box size={48} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-900">Catálogo Vacío</h3>
                  <p className="text-slate-400 text-sm max-w-xs mx-auto">Agrega materiales con sus precios base para poder registrarlos en los viajes de servicios.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <form onSubmit={handleSave} className="p-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black text-[#1a202c]">
                    {editingMaterial ? 'Editar Material' : 'Nuevo Material'}
                  </h2>
                </div>
                <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-2xl transition-colors text-slate-300">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center">Nombre del Material <Required /></label>
                  <div className="relative">
                    <Box className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => { setFormData({ ...formData, name: e.target.value }); if (fieldErrors.name) setFieldErrors({}); }}
                      placeholder="Ej: Arena"
                      required
                      className={`w-full bg-slate-50 border-2 rounded-2xl pl-12 pr-5 py-4 outline-none transition-all text-sm font-bold text-slate-700 ${fieldErrors.name ? 'border-red-300 focus:border-red-400' : 'border-transparent focus:border-[#f58d2f]/30 focus:bg-white'
                        }`}
                    />
                    {fieldErrors.name && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.name}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Precio Base (COP)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    <input
                      type="number"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-12 pr-5 py-4 outline-none focus:border-[#f58d2f]/30 focus:bg-white transition-all text-sm font-bold text-slate-700"
                    />
                  </div>
                </div>


              </div>

              <div className="mt-12 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 border-2 border-slate-100 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all text-[11px] uppercase tracking-[0.2em]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !formData.name.trim()}
                  className={`flex-1 px-6 py-4 bg-gradient-to-br from-[#f58d2f] to-[#e87a1c] rounded-2xl font-black text-white shadow-xl shadow-orange-100 hover:brightness-110 disabled:opacity-50 transition-all text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 border-none ${!formData.name.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {saving ? <Loader2 className="animate-spin" size={18} /> : (editingMaterial ? <Check size={18} /> : <Plus size={18} />)}
                  {saving ? 'Procesando...' : (editingMaterial ? 'Actualizar' : 'Crear Material')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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