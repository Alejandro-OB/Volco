import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchClients, fetchAccounts, QK } from '../../api/queries';

export default function Breadcrumb() {
  const [searchParams] = useSearchParams();
  const clienteParam = searchParams.get('cliente');
  const cuentaParam = searchParams.get('cuenta');

  const { data: clients = [] } = useQuery({ queryKey: QK.clients, queryFn: fetchClients, enabled: !!clienteParam });
  const { data: accounts = [] } = useQuery({ queryKey: QK.accounts, queryFn: fetchAccounts, enabled: !!cuentaParam });

  const segments = [];

  if (clienteParam) {
    const client = clients.find(c => c.id === Number(clienteParam));
    segments.push(
      { label: 'Clientes', href: '/clientes' },
      { label: client?.name || '...', isLast: true },
    );
  }

  if (cuentaParam) {
    const account = accounts.find(a => a.id === Number(cuentaParam));
    segments.push(
      { label: 'Cuentas', href: '/cuentas' },
      { label: account?.description || '...', isLast: true },
    );
  }

  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 mb-6">
      {segments.map((seg, i) => (
        <React.Fragment key={i}>
          {seg.isLast ? (
            <span className="text-slate-900 font-bold text-[13px] truncate max-w-[200px]">{seg.label}</span>
          ) : (
            <Link to={seg.href} className="text-slate-400 hover:text-[#f58d2f] font-bold text-[13px] transition-colors truncate max-w-[200px]">
              {seg.label}
            </Link>
          )}
          {i < segments.length - 1 && <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />}
        </React.Fragment>
      ))}
    </nav>
  );
}
