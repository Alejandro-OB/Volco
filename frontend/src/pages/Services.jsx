import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus, Edit2, Trash2,
  ChevronDown, ChevronRight, Briefcase, Wallet, Mountain
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axiosConfig';
import ConfirmModal from '../components/Modals/ConfirmModal';
import ServiceFormModal from '../components/Modals/ServiceFormModal';
import Button from '../components/UI/Button';
import EmptyState from '../components/UI/EmptyState';
import { useToast } from '../hooks/useToast';
import { extractError } from '../utils/extractError';
import Breadcrumb from '../components/Layout/Breadcrumb';
import { fetchClients, fetchAccounts, fetchMaterials, fetchServices, QK } from '../api/queries';
import { Table, TableHead, Th, TableBody, TableRow, Td } from '../components/UI/Table';
import { FilterBar, FilterRow, SearchInput, FilterSelect, DateRangeFilter, ClearButton } from '../components/UI/SearchFilterBar';

function Services() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('cuenta');
  const queryClient = useQueryClient();
  const addToast = useToast();

  // --- CACHÉ: catálogos compartidos ---
  const { data: accounts = [] } = useQuery({ queryKey: QK.accounts, queryFn: fetchAccounts });
  const { data: materials = [] } = useQuery({ queryKey: QK.materials, queryFn: fetchMaterials });
  const { data: clients = [] } = useQuery({ queryKey: QK.clients, queryFn: fetchClients });

  // --- CACHÉ: servicios (cambia con accountId) ---
  const { data: services = [], isLoading: loading } = useQuery({
    queryKey: QK.services(accountId),
    queryFn: () => fetchServices(accountId),
  });

  // --- ESTADOS DE UI ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [targetId, setTargetId] = useState(null);
  const [showCustomMaterial, setShowCustomMaterial] = useState(false);
  const [openAccounts, setOpenAccounts] = useState({});
  const [openClients, setOpenClients] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');

  // --- FUNCIONES AUXILIARES ---
  const formatCurrency = (v) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

  const getAccountName = (id) =>
    accounts.find(a => a.id === id)?.description || 'Cuenta General';

  const getMaterialName = (s) =>
    (s.custom_material || materials.find(m => m.id === s.material_id)?.name || 'Sin material').toUpperCase();

  const accountsForClient = useMemo(() => {
    if (!selectedClient) return accounts;
    return accounts.filter(a => a.client_id === Number(selectedClient));
  }, [accounts, selectedClient]);

  const [priceModified, setPriceModified] = useState(false);
  const [originalPrice, setOriginalPrice] = useState(null);

  const [formData, setFormData] = useState({
    id: null, service_account_id: '', material_id: '',
    custom_material: '', quantity: '', price: '',
    service_date: new Date().toISOString().split('T')[0],
    notes: '', is_transport_only: false,
  });

  // Expandir acordeón automáticamente si venimos con ?cuenta=ID
  useEffect(() => {
    if (accountId && accounts.length > 0 && clients.length > 0) {
      const activeAccount = accounts.find(a => a.id === Number(accountId));
      if (activeAccount) {
        setOpenAccounts(prev => ({ ...prev, [activeAccount.description]: true }));
        const activeClient = clients.find(c => c.id === activeAccount.client_id);
        if (activeClient) {
          setOpenClients(prev => ({ ...prev, [activeClient.name]: true }));
        }
      }
    }
  }, [accountId, accounts, clients]);

  // Auto-abrir modal si venimos con ?nuevo=1 (ej: desde Dashboard)
  useEffect(() => {
    if (searchParams.get('nuevo') === '1') {
      handleOpenModal();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const groupedData = useMemo(() => {
    if (!services.length) return {};
    const sorted = [...services].sort((a, b) => new Date(b.service_date) - new Date(a.service_date));
    const term = searchTerm.toLowerCase().trim();

    return sorted.reduce((acc, service) => {
      const account = accounts.find(a => a.id === service.service_account_id);
      const accountName = account?.description || 'Cuenta General';
      const client = clients.find(c => c.id === account?.client_id);
      const clientName = client?.name || 'Cliente Particular';

      // Filter by search term against client name or account name
      if (term && !clientName.toLowerCase().includes(term) && !accountName.toLowerCase().includes(term)) {
        return acc;
      }

      // Filter by date range
      if (dateFrom && service.service_date < dateFrom) return acc;
      if (dateTo && service.service_date > dateTo) return acc;

      if (!acc[clientName]) acc[clientName] = {};
      if (!acc[clientName][accountName]) acc[clientName][accountName] = [];
      acc[clientName][accountName].push(service);
      return acc;
    }, {});
  }, [services, accounts, clients, searchTerm, dateFrom, dateTo]);

  const filteredServices = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return [...services]
      .sort((a, b) => new Date(b.service_date) - new Date(a.service_date))
      .filter(s => {
        const account = accounts.find(a => a.id === s.service_account_id);
        const client = clients.find(c => c.id === account?.client_id);
        if (selectedClient && account?.client_id !== Number(selectedClient)) return false;
        if (selectedAccount && s.service_account_id !== Number(selectedAccount)) return false;
        const clientName = client?.name?.toLowerCase() || '';
        const accountName = account?.description?.toLowerCase() || '';
        if (term && !clientName.includes(term) && !accountName.includes(term)) return false;
        if (dateFrom && s.service_date < dateFrom) return false;
        if (dateTo && s.service_date > dateTo) return false;
        return true;
      });
  }, [services, accounts, clients, searchTerm, dateFrom, dateTo, selectedClient, selectedAccount]);

  const toggleClient = (name) => {
    setOpenClients(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const toggleAccount = (name) => {
    setOpenAccounts(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // Devuelve el precio a autocompletar según si el viaje es solo transporte o completo
  const basePriceFor = (material, transportMode) => {
    if (!material) return '';
    if (transportMode) return material.transport_price ?? '';
    return material.price ?? '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'material_id') {
      if (value === 'otro') {
        setShowCustomMaterial(true);
        setPriceModified(false);
        setOriginalPrice(null);
        setFormData(prev => ({ ...prev, material_id: '', custom_material: '', price: '', is_transport_only: false }));
      } else {
        setShowCustomMaterial(false);
        const selectedMat = materials.find(m => m.id === Number(value));
        const isTransport = formData.is_transport_only;
        const matPrice = basePriceFor(selectedMat, isTransport);
        setOriginalPrice(matPrice);
        setPriceModified(false);
        setFormData(prev => ({ ...prev, material_id: value, custom_material: '', price: matPrice }));
      }
    } else if (name === 'price' && originalPrice !== null && !showCustomMaterial) {
      setPriceModified(value !== '' && Number(value) !== Number(originalPrice));
      setFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleToggleTransport = (checked) => {
    const selectedMat = materials.find(m => m.id === Number(formData.material_id));
    const newPrice = basePriceFor(selectedMat, checked);
    setOriginalPrice(newPrice !== '' ? newPrice : null);
    setPriceModified(false);
    setFormData(prev => ({ ...prev, is_transport_only: checked, price: newPrice }));
  };

  const handleOpenModal = (data = null) => {
    const service = (data && data.id && !data.nativeEvent) ? data : null;
    const preAccountId = (typeof data === 'number' || typeof data === 'string') ? data : null;

    setPriceModified(false);
    setOriginalPrice(null);

    if (service) {
      const isCustom = !!service.custom_material;
      const isTransport = !!service.is_transport_only;
      setShowCustomMaterial(isCustom);
      if (!isCustom && service.material_id) {
        const mat = materials.find(m => m.id === service.material_id);
        const refPrice = isTransport ? (mat?.transport_price ?? service.price) : (mat?.price ?? service.price);
        setOriginalPrice(refPrice);
      }
      setFormData({
        id: service.id, service_account_id: service.service_account_id,
        material_id: isCustom ? 'otro' : service.material_id,
        custom_material: service.custom_material || '',
        quantity: service.quantity, price: service.price,
        service_date: service.service_date,
        notes: service.notes || '',
        is_transport_only: isTransport,
      });
    } else {
      setShowCustomMaterial(false);
      setFormData({
        id: null,
        service_account_id: preAccountId || accountId || '',
        material_id: '', custom_material: '', quantity: '', price: '',
        service_date: new Date().toISOString().split('T')[0],
        notes: '', is_transport_only: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleUpdateMaterialPrice = async () => {
    if (!formData.material_id || !formData.price) return;
    try {
      const field = formData.is_transport_only ? 'transport_price' : 'price';
      await api.patch(`materials/${formData.material_id}/`, { [field]: Number(formData.price) });
      queryClient.invalidateQueries({ queryKey: QK.materials });
      setOriginalPrice(Number(formData.price));
      setPriceModified(false);
      addToast(formData.is_transport_only ? 'Precio de transporte actualizado.' : 'Precio del material actualizado.', 'success');
    } catch (err) { addToast(extractError(err), 'error'); }
  };

  const handleDiscardPriceChange = () => {
    setPriceModified(false);
    setFormData(prev => ({ ...prev, price: originalPrice }));
  };

  const handleSaveNewMaterial = async () => {
    if (!formData.custom_material?.trim()) return;
    try {
      const res = await api.post('materials/', {
        name: formData.custom_material.trim().toUpperCase(),
        price: formData.price ? Number(formData.price) : 0,
      });
      await queryClient.invalidateQueries({ queryKey: QK.materials });
      const newMat = res.data?.data || res.data;
      setShowCustomMaterial(false);
      setOriginalPrice(newMat.price);
      setPriceModified(false);
      setFormData(prev => ({ ...prev, material_id: newMat.id, custom_material: '' }));
      addToast(`Material "${newMat.name}" guardado.`, 'success');
    } catch (err) { addToast(extractError(err), 'error'); }
  };

  const handleSave = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const payload = {
      ...formData,
      service_account_id: Number(formData.service_account_id),
      quantity: Number(formData.quantity),
      price: parseFloat(formData.price),
      material_id: showCustomMaterial ? null : Number(formData.material_id),
      custom_material: showCustomMaterial ? formData.custom_material?.trim().toUpperCase() || null : null,
      notes: formData.notes?.trim() || null,
      is_transport_only: !!formData.is_transport_only,
    };

    try {
      if (formData.id) {
        await api.patch(`services/${formData.id}/`, payload);
        addToast('Registro actualizado.', 'success');
        setIsModalOpen(false);
      } else {
        await api.post('services/', payload);
        addToast('Registro exitoso.', 'success');
        setFormData(prev => ({
          ...prev,
          material_id: '', custom_material: '', quantity: '', price: '', notes: '', is_transport_only: false,
        }));
        setShowCustomMaterial(false);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['services'] }),
        queryClient.invalidateQueries({ queryKey: QK.accounts })
      ]);
    } catch (err) {
      addToast(extractError(err), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`services/${targetId}/`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['services'] }),
        queryClient.invalidateQueries({ queryKey: QK.accounts })
      ]);
      setShowDeleteModal(false);
      addToast('Eliminado con éxito.', 'success');
    } catch (err) { addToast(extractError(err), 'error'); }
  };

  const validateForm = () => {
    const {
      service_account_id,
      material_id,
      custom_material,
      quantity,
      price,
      service_date
    } = formData;

    if (!service_account_id) return false;

    if (showCustomMaterial) {
      if (!custom_material || !custom_material.trim()) return false;
    } else {
      if (!material_id) return false;
    }

    if (!quantity || Number(quantity) <= 0) return false;

    if (!price || Number(price) <= 0) return false;

    if (!service_date) return false;

    return true;
  };

  const canSubmit = validateForm();

  return (
    <div className="min-h-screen p-4 sm:p-12 font-sans page-enter">
      <div className="max-w-7xl mx-auto">

        {accountId && <Breadcrumb />}

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Viajes <span className="text-[#f58d2f]">.</span></h1>
            <p className="text-slate-500 font-medium">
              {accountId ? `Filtrado por: ${getAccountName(Number(accountId))}` : ''}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => handleOpenModal()}
              className="flex-1 lg:flex-none"
            >
              Registrar Viaje
            </Button>
          </div>
        </div>

        {/* FILTROS */}
        {!accountId && (
          <FilterBar className="mb-6">
            <FilterRow>
              <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por cliente o cuenta..."
              />
              <FilterSelect
                value={selectedClient}
                onChange={(e) => { setSelectedClient(e.target.value); setSelectedAccount(''); }}
              >
                <option value="">Todos los clientes</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </FilterSelect>
              <FilterSelect
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                disabled={accountsForClient.length === 0}
              >
                <option value="">Todas las cuentas</option>
                {accountsForClient.map(a => <option key={a.id} value={a.id}>{a.description}</option>)}
              </FilterSelect>
              {(selectedClient || selectedAccount || searchTerm) && (
                <ClearButton onClick={() => { setSelectedClient(''); setSelectedAccount(''); setSearchTerm(''); }} />
              )}
            </FilterRow>
            <DateRangeFilter
              from={dateFrom}
              to={dateTo}
              onFromChange={(e) => setDateFrom(e.target.value)}
              onToChange={(e) => setDateTo(e.target.value)}
              onClear={() => { setDateFrom(''); setDateTo(''); }}
            />
          </FilterBar>
        )}

        {/* Tabla flat — solo desktop */}
        <div className="hidden md:block bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="divide-y divide-slate-100">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                  <div className="h-3 bg-slate-100 rounded w-20" />
                  <div className="h-3 bg-slate-100 rounded w-36 ml-2" />
                  <div className="h-3 bg-slate-100 rounded w-28 ml-2" />
                  <div className="h-3 bg-slate-100 rounded w-16 ml-auto" />
                  <div className="h-3 bg-slate-100 rounded w-24" />
                  <div className="h-6 bg-slate-100 rounded-xl w-14" />
                </div>
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <EmptyState icon={Briefcase} title="Sin movimientos registrados" description="Registra el primer viaje usando el botón superior" />
          ) : (
            <Table>
              <TableHead>
                <tr>
                  <Th>Fecha</Th>
                  <Th>Material</Th>
                  {!accountId && <Th>Cliente / Cuenta</Th>}
                  <Th align="center">Cantidad</Th>
                  <Th align="right">Total</Th>
                  <Th align="right">Acciones</Th>
                </tr>
              </TableHead>
              <TableBody>
                {filteredServices.map(s => {
                  const account = accounts.find(a => a.id === s.service_account_id);
                  const client = clients.find(c => c.id === account?.client_id);
                  return (
                    <TableRow key={s.id}>
                      <Td className="text-sm text-slate-600 whitespace-nowrap">{s.service_date}</Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-slate-800">{getMaterialName(s)}</p>
                          {s.is_transport_only && (
                            <span className="text-[10px] font-bold text-[#f58d2f] bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full whitespace-nowrap">Transporte</span>
                          )}
                        </div>
                        {s.notes && <p className="text-xs text-slate-400 mt-0.5">({s.notes})</p>}
                      </Td>
                      {!accountId && (
                        <Td>
                          <p className="text-sm text-slate-800">{client?.name || '—'}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{account?.description || '—'}</p>
                        </Td>
                      )}
                      <Td align="center">
                        <span className="text-sm text-slate-700">{s.quantity}</span>
                        <p className="text-xs text-slate-400 mt-0.5">{formatCurrency(s.price)} c/u</p>
                      </Td>
                      <Td align="right">
                        <span className="text-sm text-slate-700 tabular-nums">{formatCurrency(s.total_amount)}</span>
                      </Td>
                      <Td>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" icon={Edit2} aria-label="Editar" className="hover:text-blue-500" onClick={() => handleOpenModal(s)} />
                          <Button variant="ghost" size="icon" icon={Trash2} aria-label="Eliminar" className="hover:text-red-500" onClick={() => { setTargetId(s.id); setShowDeleteModal(true); }} />
                        </div>
                      </Td>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Acordeón móvil — solo mobile (versión aplanada) */}
        <div className="md:hidden space-y-3">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-[2rem] border border-slate-100 p-5 animate-pulse space-y-3">
                <div className="h-4 bg-slate-100 rounded-lg w-1/2" />
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            ))
          ) : Object.keys(groupedData).length === 0 ? (
            <EmptyState icon={Briefcase} title="Sin resultados" description="Sin movimientos registrados" />
          ) : Object.entries(groupedData).map(([clientName, clientAccounts]) => (
            <div key={clientName} className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
              {/* Header cliente */}
              <button
                onClick={() => toggleClient(clientName)}
                className="w-full flex items-center gap-3 px-5 py-4 bg-slate-50 border-b border-slate-100"
              >
                <div className={`p-1 rounded-lg transition-all ${openClients[clientName] ? 'bg-orange-100 text-[#f58d2f]' : 'bg-slate-200 text-slate-500'}`}>
                  {openClients[clientName] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                <Briefcase size={15} className="text-[#f58d2f]" />
                <span className="font-black text-slate-800 text-sm flex-1 text-left">{clientName}</span>
                <span className="text-[10px] font-black text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  {Object.values(clientAccounts).reduce((sum, arr) => sum + arr.length, 0)} viajes
                </span>
              </button>

              {/* Servicios planos por cliente: todas las cuentas se muestran inline */}
              {openClients[clientName] && Object.entries(clientAccounts).map(([accountName, accountServices]) => (
                <React.Fragment key={accountName}>
                  {/* Badge de cuenta como separador */}
                  <div className="flex items-center gap-2 px-5 py-2 bg-slate-50/50 border-b border-slate-50">
                    <Wallet size={11} className="text-[#f58d2f] flex-shrink-0" />
                    <span className="text-[9px] font-bold text-slate-500 truncate">{accountName}</span>
                    <span className="text-[8px] font-black text-slate-400 ml-auto">{accountServices.length} viajes</span>
                    <Button
                      variant="outline"
                      size="icon"
                      icon={Plus}
                      className="!p-1 !rounded-lg !h-6 !w-6"
                      onClick={(e) => { e.stopPropagation(); handleOpenModal(accountServices[0]?.service_account_id); }}
                    />
                  </div>
                  {accountServices.map(s => (
                    <div key={s.id} className="flex flex-col px-5 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-7 w-7 rounded-lg bg-orange-50 flex items-center justify-center text-[#f58d2f] flex-shrink-0">
                            <Mountain size={12} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-black text-slate-800 text-[11px] truncate">{getMaterialName(s)}</p>
                              {s.is_transport_only && (
                                <span className="text-[8px] font-bold text-[#f58d2f] bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded-full flex-shrink-0">Transporte</span>
                              )}
                            </div>
                            {s.notes
                              ? <span className="text-[8px] font-medium text-slate-400 italic truncate">({s.notes})</span>
                              : <span className="text-[8px] font-bold text-slate-400">{s.service_date}</span>
                            }
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <Button variant="ghost" size="icon" icon={Edit2} aria-label="Editar servicio" className="!p-1.5 hover:text-blue-500" onClick={() => handleOpenModal(s)} />
                          <Button variant="ghost" size="icon" icon={Trash2} aria-label="Eliminar servicio" className="!p-1.5 hover:text-red-500" onClick={() => { setTargetId(s.id); setShowDeleteModal(true); }} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between pl-9">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black text-slate-700">{s.quantity} viajes</span>
                          <span className="text-[8px] text-slate-400 font-bold italic">c/u {formatCurrency(s.price)}</span>
                        </div>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">{formatCurrency(s.total_amount)}</span>
                      </div>
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
      </div>

      <ServiceFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isEditing={!!formData.id}
        formData={formData}
        isSubmitting={isSubmitting}
        materials={materials}
        accounts={accounts}
        clients={clients}
        accountIdUrlParam={accountId}
        showCustomMaterial={showCustomMaterial}
        onInputChange={handleInputChange}
        onToggleTransport={handleToggleTransport}
        onSubmit={handleSave}
        canSubmit={canSubmit}
        formatCurrency={formatCurrency}
        priceModified={priceModified}
        selectedMaterialName={materials.find(m => m.id === Number(formData.material_id))?.name || ''}
        onUpdateMaterialPrice={handleUpdateMaterialPrice}
        onDiscardPriceChange={handleDiscardPriceChange}
        onSaveNewMaterial={handleSaveNewMaterial}
      />

      <ConfirmModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="¿Eliminar registro?"
        message="Se eliminará permanentemente este servicio de la cuenta."
      />
    </div>
  );
}

export default Services;