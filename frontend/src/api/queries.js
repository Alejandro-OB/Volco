import api from './axiosConfig';

// ── Fetch functions (pure, no state) ─────────────────────────────────────────

export const fetchClients = () => api.get('clients/').then(r => r.data);
export const fetchMaterials = () => api.get('/materials/').then(r => r.data);
export const fetchAccounts = () => api.get('service-accounts/').then(r => r.data);
export const fetchInvoices = () => api.get('invoices/').then(r => r.data);
export const fetchServices = (accountId) =>
    api.get(accountId ? `account-services/${accountId}/services/` : 'services/').then(r => r.data);

// ── Query keys (centralised so pages import the same reference) ───────────────

export const QK = {
    clients: ['clients'],
    materials: ['materials'],
    accounts: ['accounts'],
    invoices: ['invoices'],
    services: (accountId) => ['services', accountId ?? null],
};
