import React, { useState } from 'react';
import { Check, Loader2, Plus } from 'lucide-react';
import Select from './Select';
import DatePicker from './DatePicker';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '../../api/axiosConfig';
import { QK, fetchClients } from '../../api/queries';
import { extractError } from '../../utils/extractError';
import QuickCreateClient from './QuickCreateClient';

const today = new Date().toISOString().split('T')[0];

const QuickCreateAccount = ({ onCreated, onCancel }) => {
  const [form, setForm] = useState({ description: '', client_id: '', start_date: today, end_date: '' });
  const [showQuickClient, setShowQuickClient] = useState(false);
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({ queryKey: QK.clients, queryFn: fetchClients });

  const mutation = useMutation({
    mutationFn: (data) => api.post('service-accounts/', data).then(r => r.data),
    onSuccess: (account) => {
      queryClient.invalidateQueries({ queryKey: QK.accounts });
      onCreated(account);
    },
  });

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const canSubmit = form.description.trim() && form.client_id && form.start_date && form.end_date && !mutation.isPending;

  return (
    <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2.5">
      <p className="text-[10px] font-black text-emerald-700 ">Nueva cuenta / obra</p>

      <input
        type="text"
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="Ej: Obra Norte Fase 1..."
        autoFocus
        className="w-full px-4 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-emerald-400 transition-colors"
      />

      <div>
        <div className="flex gap-2">
          <Select
            name="client_id"
            value={form.client_id}
            onChange={handleChange}
            compact
          >
            <option value="">Seleccionar cliente...</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <button
            type="button"
            onClick={() => setShowQuickClient(v => !v)}
            title="Crear cliente rápido"
            className="px-2.5 py-2.5 rounded-xl bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-100 transition-colors flex items-center gap-1 text-xs font-bold"
          >
            <Plus size={13} />
          </button>
        </div>
        {showQuickClient && (
          <QuickCreateClient
            onCreated={(client) => {
              setForm(prev => ({ ...prev, client_id: String(client.id) }));
              setShowQuickClient(false);
            }}
            onCancel={() => setShowQuickClient(false)}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <p className="text-[9px] font-bold text-emerald-600  ml-1">Desde</p>
          <DatePicker
            name="start_date"
            value={form.start_date}
            onChange={handleChange}
            compact
          />
        </div>
        <div className="space-y-1">
          <p className="text-[9px] font-bold text-emerald-600  ml-1">Hasta</p>
          <DatePicker
            name="end_date"
            value={form.end_date}
            onChange={handleChange}
            compact
          />
        </div>
      </div>

      {mutation.isError && (
        <p className="text-red-500 text-xs font-medium">{extractError(mutation.error)}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-600 hover:bg-emerald-100 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => mutation.mutate({ ...form, client_id: Number(form.client_id) })}
          className="flex-[2] py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 hover:bg-emerald-700 transition-colors"
        >
          {mutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          Crear cuenta
        </button>
      </div>
    </div>
  );
};

export default QuickCreateAccount;
