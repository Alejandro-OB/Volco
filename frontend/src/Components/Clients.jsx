import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Edit2, Trash2, 
  User, Phone, MapPin, 
  Mail, AlertTriangle, CheckCircle, Wallet, Hash, Users, X, Save, Loader2
} from 'lucide-react';
import api from '../api/axiosConfig';
import ConfirmModal from './Modals/ConfirmModal';

const Clients = () => {
  const navigate = useNavigate();
  
  // --- ESTADOS LÓGICOS ---
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');
  
  // --- ESTADOS DE UI ---
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // --- ESTADO DEL FORMULARIO ---
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    phone_number: '',
  });

  // --- COMPONENTE AUXILIAR PARA CAMPOS OBLIGATORIOS ---
  const Required = () => <span className="text-orange-500 ml-1 font-bold" title="Obligatorio">*</span>;

  // --- CARGA DE DATOS ---
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await api.get('clients/');
      setClients(res.data);
      setLoading(false);
    } catch (err) {
      setError('No se pudieron cargar los clientes.');
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => { setMessage(null); setMessageType(''); }, 4000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    setIsSubmitting(true);
    try {
      const cleanData = Object.fromEntries(
        Object.entries(formData).map(([k, v]) => [k, v?.trim() || null])
      );
      if (isEditing) {
        const res = await api.patch(`clients/${selectedId}/`, cleanData);
        setClients(prev => prev.map(c => c.id === selectedId ? res.data : c));
        showMessage('Cliente actualizado con éxito.', 'success');
      } else {
        const res = await api.post('clients/', cleanData);
        setClients(prev => [res.data, ...prev]);
        showMessage('Cliente registrado con éxito.', 'success');
      }
      setIsModalOpen(false);
    } catch (err) {
      showMessage('Error al procesar la solicitud. Revise los campos.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`clients/${selectedId}/`);
      setClients(prev => prev.filter(c => c.id !== selectedId));
      setShowDeleteModal(false);
      showMessage('Cliente eliminado correctamente.');
    } catch {
      showMessage('Error al eliminar el cliente.', 'error');
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

        {/* Alertas Flash */}
        {(message || error) && (
          <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${
            messageType === 'error' || error ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'
          }`}>
            {messageType === 'error' || error ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
            <span className="font-bold text-xs uppercase tracking-[0.15em]">{message || error}</span>
          </div>
        )}

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

        {/* Tabla */}
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
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
                  [1, 2, 3].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan="5" className="px-8 py-6"><div className="h-12 bg-slate-100 rounded-2xl w-full"></div></td>
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
                       className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-[#f58d2f]/30 focus:bg-white transition-all text-sm font-bold text-slate-700 shadow-inner" 
                       placeholder="Ej. Juan Pérez o Empresa S.A." 
                     />
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