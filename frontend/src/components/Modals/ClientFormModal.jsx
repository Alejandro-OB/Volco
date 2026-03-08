import React from 'react';
import { User, Mail, Phone, MapPin, X, Save, Loader2 } from 'lucide-react';

const ClientFormModal = ({ 
  isOpen, 
  onClose, 
  isEditing, 
  formData, 
  fieldErrors, 
  isSubmitting, 
  onInputChange, 
  onSubmit 
}) => {
  if (!isOpen) return null;

  const Required = () => <span className="text-orange-500 ml-1 font-bold" title="Obligatorio">*</span>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
                {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
            </div>
            <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center">
                Razón Social / Nombre <Required />
              </label>
              <div className="relative group">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#f58d2f] transition-colors" />
                <input
                  name="name"
                  required
                  value={formData.name}
                  onChange={onInputChange}
                  className={`w-full bg-slate-50 border-2 rounded-2xl pl-12 pr-4 py-4 outline-none transition-all text-sm font-bold text-slate-700 shadow-inner ${fieldErrors.name ? 'border-red-300 focus:border-red-400' : 'border-transparent focus:border-[#f58d2f]/30 focus:bg-white'}`}
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
                    onChange={onInputChange}
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
                    onChange={onInputChange}
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
                  onChange={onInputChange}
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-[#f58d2f]/30 focus:bg-white transition-all text-sm font-bold text-slate-700 shadow-inner"
                  placeholder="Calle 123 #45-67..."
                />
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button
                type="button"
                onClick={onClose}
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
  );
};

export default ClientFormModal;
