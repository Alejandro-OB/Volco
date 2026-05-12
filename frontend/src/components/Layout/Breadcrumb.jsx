import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchClients, fetchAccounts, QK } from '../../api/queries';

function BreadcrumbSegment({ label, href, isLast }) {
  const content = isLast ? (
    <span className="text-slate-900 font-bold text-[13px] truncate max-w-[200px]">{label}</span>
  ) : (
    <Link to={href} className="text-slate-400 hover:text-[#f58d2f] font-bold text-[13px] transition-colors truncate max-w-[200px]">
      {label}
    </Link>
  );
  return <>{content}</>;
}

export default function Breadcrumb() {
  const { clientId, accountId } = useParams();
  const { data: clients = [] } = useQuery({ queryKey: QK.clients, queryFn: fetchClients, enabled: !!clientId });
  const { data: accounts = [] } = useQuery({ queryKey: QK.accounts, queryFn: fetchAccounts, enabled: !!accountId });

  const path = window.location.pathname;

  const segments = [];

  if (path.startsWith('/clientes') && clientId) {
    const client = clients.find(c => c.id === Number(clientId));
    segments.push(
      { label: 'Clientes', href: '/clientes' },
      { label: client?.name || '...', href: `/clientes/${clientId}/cuentas`, isLast: !accountId && !path.includes('cuentas') },
    );
    if (path.includes('cuentas')) {
      segments.push({ label: 'Cuentas', href: `/clientes/${clientId}/cuentas`, isLast: true });
    }
  }

  if (path.startsWith('/cuentas') && accountId) {
    const account = accounts.find(a => a.id === Number(accountId));
    segments.push(
      { label: 'Cuentas', href: '/cuentas' },
      { label: account?.description || '...', href: `/cuentas/${accountId}/servicios`, isLast: true },
    );
  }

  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 mb-6">
      {segments.map((seg, i) => (
        <React.Fragment key={seg.href}>
          <BreadcrumbSegment {...seg} isLast={seg.isLast ?? (i === segments.length - 1)} />
          {i < segments.length - 1 && <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />}
        </React.Fragment>
      ))}
    </nav>
  );
}
