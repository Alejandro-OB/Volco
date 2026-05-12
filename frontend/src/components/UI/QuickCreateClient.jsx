import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axiosConfig';
import { QK } from '../../api/queries';
import { extractError } from '../../utils/extractError';

const QuickCreateClient = ({ onCreated, onCancel }) => {
  const [name, setName] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data) => api.post('clients/', data).then(r => r.data),
    onSuccess: (client) => {
      queryClient.invalidateQueries({ queryKey: QK.clients });
      onCreated(client);
    },
  });

  return (
    <div className="mt-2 p-3 bg-violet-50 border border-violet-200 rounded-2xl space-y-2">
      <p className="text-[10px] font-black text-violet-600">Nuevo cliente</p>
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && name.trim() && !mutation.isPending && mutation.mutate({ name: name.trim() })}
        placeholder="Nombre del cliente..."
        autoFocus
        className="w-full px-4 py-2.5 bg-white border border-violet-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-violet-400 transition-colors"
      />
      {mutation.isError && (
        <p className="text-red-500 text-xs font-medium">{extractError(mutation.error)}</p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl border border-violet-200 text-xs font-bold text-violet-500 hover:bg-violet-100 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={!name.trim() || mutation.isPending}
          onClick={() => mutation.mutate({ name: name.trim() })}
          className="flex-[2] py-2 rounded-xl bg-violet-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 hover:bg-violet-700 transition-colors"
        >
          {mutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          Crear cliente
        </button>
      </div>
    </div>
  );
};

export default QuickCreateClient;
