'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Users, Stethoscope, Calendar, CheckCircle, Clock, XCircle, AlertTriangle, ShieldAlert, Ticket, CreditCard } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

interface AdminStats {
  users: { total: number; doctors: number; patients: number };
  appointments: { total: number; pending: number; completed: number; cancelled: number };
}

interface Alerts {
  urgentTickets: number;
  lockedAccounts: number;
  pendingDoctors: number;
  failedTransactions: number;
}

interface DailyPoint {
  date: string;
  appointments: number;
  users: number;
  completed: number;
  cancelled: number;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [daily, setDaily] = useState<DailyPoint[]>([]);
  const [alerts, setAlerts] = useState<Alerts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch<AdminStats>('/admin/stats/overview'),
      apiFetch<DailyPoint[]>('/admin/stats/daily?days=30'),
      apiFetch<Alerts>('/admin/alerts').catch(() => null),
    ])
      .then(([overview, dailyData, alertsData]) => {
        setStats(overview);
        setDaily(dailyData.map((d) => ({ ...d, date: formatDate(d.date) })));
        if (alertsData) setAlerts(alertsData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return <div className="rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div>;
  }

  const kpis = [
    { label: 'Utilisateurs', value: stats?.users.total ?? 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Médecins', value: stats?.users.doctors ?? 0, icon: Stethoscope, color: 'text-violet-500', bg: 'bg-violet-50' },
    { label: 'Patients', value: stats?.users.patients ?? 0, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'RDV total', value: stats?.appointments.total ?? 0, icon: Calendar, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  const apptStatuses = [
    { label: 'En attente', value: stats?.appointments.pending ?? 0, icon: Clock, color: 'text-amber-600' },
    { label: 'Terminés', value: stats?.appointments.completed ?? 0, icon: CheckCircle, color: 'text-blue-600' },
    { label: 'Annulés', value: stats?.appointments.cancelled ?? 0, icon: XCircle, color: 'text-red-600' },
  ];

  // Only show every ~5th label to avoid crowding
  const tickInterval = Math.floor(daily.length / 6);

  const alertItems = alerts ? [
    { key: 'urgentTickets',      count: alerts.urgentTickets,      label: 'ticket(s) urgent(s)',            href: '/tickets',      icon: Ticket,       color: 'text-red-600',    bg: 'bg-red-50 border-red-200' },
    { key: 'pendingDoctors',     count: alerts.pendingDoctors,     label: 'médecin(s) à vérifier',          href: '/doctors',      icon: ShieldAlert,  color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200' },
    { key: 'failedTransactions', count: alerts.failedTransactions, label: 'transaction(s) échouée(s) (24h)', href: '/transactions', icon: CreditCard,   color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
    { key: 'lockedAccounts',     count: alerts.lockedAccounts,     label: 'compte(s) 2FA verrouillé(s)',    href: '/security',     icon: ShieldAlert,  color: 'text-slate-700',  bg: 'bg-slate-50 border-slate-200' },
  ].filter(a => a.count > 0) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">Vue globale de la plateforme — 30 derniers jours</p>
      </div>

      {/* Alerts banner */}
      {alertItems.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-semibold text-amber-800">{alertItems.length} point(s) nécessitant une attention</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {alertItems.map(({ key, count, label, href, icon: Icon, color, bg }) => (
              <Link
                key={key}
                href={href}
                className={`flex items-center gap-3 rounded-xl border p-3 ${bg} hover:opacity-90 transition-opacity`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${color}`} />
                <div>
                  <p className={`text-lg font-bold ${color}`}>{count}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{label}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Appointments trend chart */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 font-semibold">Rendez-vous — 30 derniers jours</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={daily} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradAppt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(263 70% 50%)" stopOpacity={0.18} />
                <stop offset="95%" stopColor="hsl(263 70% 50%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradComp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(213 93% 55%)" stopOpacity={0.18} />
                <stop offset="95%" stopColor="hsl(213 93% 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={tickInterval} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(220 13% 91%)' }}
              formatter={(value, name) => [value, name === 'appointments' ? 'Total RDV' : name === 'completed' ? 'Terminés' : name]}
            />
            <Legend formatter={(v) => v === 'appointments' ? 'Total RDV' : v === 'completed' ? 'Terminés' : 'Annulés'} wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="appointments" stroke="hsl(263 70% 50%)" fill="url(#gradAppt)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="completed" stroke="hsl(213 93% 55%)" fill="url(#gradComp)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* New user registrations chart */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">Nouvelles inscriptions</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={daily} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={tickInterval} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [v, 'Inscriptions']} />
              <Bar dataKey="users" fill="hsl(142 70% 45%)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Appointment statuses */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">Statuts des rendez-vous</h2>
          <div className="grid grid-cols-3 gap-3 mt-6">
            {apptStatuses.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 text-center">
                <Icon className={`h-6 w-6 ${color}`} />
                <p className="text-2xl font-bold">{value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
