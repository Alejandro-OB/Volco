import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, Users, Briefcase, Truck, DollarSign, Calendar,
  ArrowUpRight, Activity, Loader2
} from 'lucide-react';
import api from '../api/axiosConfig';
import { fetchClients, fetchAccounts, fetchServices, QK } from '../api/queries';

const Dashboard = () => {
  // Query all data
  const { data: clients, isLoading: loadingClients } = useQuery({ queryKey: QK.clients, queryFn: fetchClients });
  const { data: accounts, isLoading: loadingAccounts } = useQuery({ queryKey: QK.accounts, queryFn: fetchAccounts });
  const { data: services, isLoading: loadingServices } = useQuery({ queryKey: QK.services(), queryFn: () => fetchServices() });

  const isLoading = loadingClients || loadingAccounts || loadingServices;

  // Derive Metrics
  const metrics = useMemo(() => {
    if (!clients || !accounts || !services) return null;

    const totalRevenue = services.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0);
    const totalClients = clients.length;
    const activeAccounts = accounts.length;
    const totalTrips = services.length;

    // Last 6 months revenue data for chart
    const monthlyDataMap = {};
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    
    // Initialize last 6 months
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = d.toLocaleString('es-ES', { month: 'short', year: 'numeric' });
      monthlyDataMap[monthKey] = { name: monthKey, ingresos: 0, viajes: 0 };
    }

    // Populate data
    services.forEach(service => {
      const date = new Date(service.service_date);
      if (date >= sixMonthsAgo) {
        const monthKey = date.toLocaleString('es-ES', { month: 'short', year: 'numeric' });
        if (monthlyDataMap[monthKey]) {
          monthlyDataMap[monthKey].ingresos += (service.quantity * service.price);
          monthlyDataMap[monthKey].viajes += 1;
        }
      }
    });

    const monthlyChartData = Object.values(monthlyDataMap).reverse();

    return { totalRevenue, totalClients, activeAccounts, totalTrips, monthlyChartData };
  }, [clients, accounts, services]);

  const formatCurrency = (value) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

  if (isLoading || !metrics) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="skeleton h-8 w-32 rounded-2xl"></div>
            <div className="skeleton h-10 w-72 rounded-xl"></div>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-40">
              <div className="flex justify-between items-start mb-4">
                <div className="skeleton h-14 w-14 rounded-2xl"></div>
                <div className="skeleton h-6 w-16 rounded-full"></div>
              </div>
              <div>
                <div className="skeleton h-3 w-24 mb-2 rounded-md"></div>
                <div className="skeleton h-8 w-32 rounded-md"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-[400px] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <div className="skeleton h-6 w-48 mb-2 rounded-md"></div>
                  <div className="skeleton h-3 w-32 rounded-md"></div>
                </div>
                <div className="skeleton h-10 w-10 rounded-xl"></div>
              </div>
              <div className="skeleton flex-1 w-full rounded-2xl opacity-30"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-4 rounded-2xl ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-widest">
            <ArrowUpRight size={12} /> {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 mb-3 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
            <Activity className="w-4 h-4 text-[#f58d2f]" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Resumen General</span>
          </div>
          <h1 className="text-4xl font-black text-[#1a202c] tracking-tight">
            Panel de Control <span className="text-[#f58d2f]">.</span>
          </h1>
        </div>
      </header>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          title="Ingresos Totales" 
          value={formatCurrency(metrics.totalRevenue)} 
          icon={DollarSign} 
          color="bg-emerald-50 text-emerald-500"
          trend="+12%"
        />
        <StatCard 
          title="Viajes Realizados" 
          value={metrics.totalTrips.toLocaleString()} 
          icon={Truck} 
          color="bg-orange-50 text-[#f58d2f]"
          trend="+5%"
        />
        <StatCard 
          title="Cuentas Activas" 
          value={metrics.activeAccounts} 
          icon={Briefcase} 
          color="bg-blue-50 text-blue-500"
        />
        <StatCard 
          title="Clientes Registrados" 
          value={metrics.totalClients} 
          icon={Users} 
          color="bg-purple-50 text-purple-500"
        />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        
        {/* CHART 1: Ingresos Históricos */}
        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-black text-slate-800">Evolución de Ingresos</h3>
              <p className="text-xs font-bold text-slate-400">Últimos 6 meses</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl"><TrendingUp size={20} className="text-slate-400" /></div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.monthlyChartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8', fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${(val/1000000).toFixed(1)}M`} tick={{fontSize: 12, fill: '#94a3b8', fontWeight: 700}} dx={-10} />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), 'Ingresos']}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                />
                <Area type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorIngresos)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Volumen de Viajes */}
        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-black text-slate-800">Volumen Operativo</h3>
              <p className="text-xs font-bold text-slate-400">Viajes completados por mes</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl"><Calendar size={20} className="text-slate-400" /></div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.monthlyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8', fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8', fontWeight: 700}} dx={-10} />
                <Tooltip 
                  formatter={(value) => [value, 'Viajes Registrados']}
                  cursor={{fill: '#fff1f2'}}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                />
                <Bar dataKey="viajes" fill="#f58d2f" radius={[6, 6, 6, 6]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
