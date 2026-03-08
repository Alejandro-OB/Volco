import * as xlsx from 'xlsx';

export const exportToExcel = (data, filename) => {
  const ws = xlsx.utils.json_to_sheet(data);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Datos');
  
  // Guardar archivo
  xlsx.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const formatClientsForExport = (clients) => {
  if (!clients) return [];
  return clients.map(client => ({
    'Razón Social': client.name,
    'Email': client.email || 'N/A',
    'Teléfono': client.phone_number || 'N/A',
    'Dirección': client.address || 'N/A',
    'Creado': new Date(client.created_at).toLocaleDateString()
  }));
};

export const formatAccountsForExport = (accounts) => {
  if (!accounts) return [];
  return accounts.map(account => ({
    'Nombre de la Cuenta': account.description,
    'Cliente Titular': account.client?.name || 'Desconocido',
    'ID Cuenta': account.id,
    'Fecha de Inicio': account.start_date ? new Date(account.start_date).toLocaleDateString() : 'N/A',
    'Fecha de Fin': account.end_date ? new Date(account.end_date).toLocaleDateString() : 'N/A',
    'Creado': account.created_at ? new Date(account.created_at).toLocaleDateString() : 'N/A'
  }));
};

export const formatServicesForExport = (services) => {
  if (!services) return [];
  return services.map(service => ({
    'ID Viaje': service.id,
    'Cuenta': service.account?.description || 'Desconocido',
    'Material ID': service.material_id,
    'Cantidad': service.quantity,
    'Precio Unitario': service.price,
    'Total': service.quantity * service.price,
    'Fecha del Viaje': service.service_date ? new Date(service.service_date).toLocaleDateString() : 'N/A',
    'Registrado el': service.created_at ? new Date(service.created_at).toLocaleDateString() : 'N/A'
  }));
};
