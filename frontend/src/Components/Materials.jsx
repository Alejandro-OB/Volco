import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import ConfirmModal from './Modals/ConfirmModal';
import { useNavigate } from 'react-router-dom';
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
  // --- ESTADOS DE LÓGICA ---
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // --- ESTADOS DE UI ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // --- FORMULARIO ---
  const [formData, setFormData] = useState({ name: '', price: '' });

  const navigate = useNavigate();

  const Required = () => <span className="text-orange-500 ml-1 font-bold" title="Obligatorio">*</span>;

  // --- EFECTOS Y CARGA ---
  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await api.get('/materials/');
      setMaterials(res.data);
    } catch (err) {
      console.error("Error fetching materials", err);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---
  const handleOpenModal = (material = null) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({ name: material.name, price: material.price });
    } else {
      setEditingMaterial(null);
      setFormData({ name: '', price: '' });
    }
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    setSaving(true);
    try {
      if (editingMaterial) {
        await api.patch(`/materials/${editingMaterial.id}/`, formData);
      } else {
        await api.post('/materials/', formData);
      }
      setIsModalOpen(false);
      fetchMaterials();
    } catch (err) {
      setError('Error al procesar la solicitud');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/materials/${selectedId}/`);
      setMaterials(prev => prev.filter(m => m.id !== selectedId));
      setConfirmOpen(false);
    } catch (err) {
      alert("No se pudo eliminar el material");
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
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 p-4 sm:p-12">
      <div className="max-w-6xl mx-auto">
        
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
              className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-sm outline-none focus:ring-2 ring-orange-100 transition-all"
           />
        </div>

        {/* TABLA DE CONTENIDO */}
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-orange-400" size={40} />
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Sincronizando catálogo...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Material</th>
                    <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Precio Base</th>
                    <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredMaterials.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#f58d2f] group-hover:bg-[#f58d2f] group-hover:text-white transition-all shadow-sm">
                            <Box size={22} />
                          </div>
                          <div>
                            <p className="font-bold text-[#1a202c] text-base">{m.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono tracking-tighter">ID: MAT-{m.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="inline-flex flex-col items-end">
                          <span className="text-lg font-black text-[#1a202c]">{formatCurrency(m.price)}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Precio Sugerido</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-center items-center gap-2">
                          <button 
                            onClick={() => handleOpenModal(m)}
                            className="p-3 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-2xl transition-all"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => { setSelectedId(m.id); setConfirmOpen(true); }}
                            className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredMaterials.length === 0 && (
                <div className="px-8 py-20 text-center">
                   <p className="text-slate-400 font-medium italic">No se encontraron materiales registrados.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
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
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ej: Arena"
                      required
                      className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-12 pr-5 py-4 outline-none focus:border-[#f58d2f]/30 focus:bg-white transition-all text-sm font-bold text-slate-700" 
                    />
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

                {error && (
                  <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 text-red-500 text-xs font-bold uppercase tracking-wider">
                    <AlertTriangle size={16} /> {error}
                  </div>
                )}
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