'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  CreditCard, Users, Stethoscope, TrendingUp, CheckCircle, XCircle, Clock, Star,
} from 'lucide-react';

type Tab = 'payments' | 'patients' | 'doctors';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'payments', label: 'Paiements', icon: <CreditCard className="h-4 w-4" /> },
  { key: 'patients', label: 'Patients', icon: <Users className="h-4 w-4" /> },
  { key: 'doctors', label: 'Médecins', icon: <Stethoscope className="h-4 w-4" /> },
];

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n);

const COLORS = ['hsl(263 70% 50%)', 'hsl(160 60% 45%)', 'hsl(210 70% 50%)', 'hsl(30 80% 55%)', 'hsl(340 75% 55%)'];

function KpiCard({ label, value, sub, icon, color }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex items-start gap-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color} shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-2xl font-semibold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Payments Tab ─────────────────────────────────────────────────────────────

function PaymentsTab() {
  const [data, setData] = useState<any>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch<any>(`/admin/stats/payments?days=${days}`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) return <div className="py-16 text-center text-muted-foreground">Chargement…</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex gap-2">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors ${days === d ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted/60'}`}
          >
            {d}j
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Revenus totaux" value={fmt(data.totalRevenue)} icon={<TrendingUp className="h-5 w-5 text-violet-600" />} color="bg-violet-50" />
        <KpiCard label="Transactions" value={data.totalTransactions} sub={`${data.successRate}% de succès`} icon={<CreditCard className="h-5 w-5 text-blue-600" />} color="bg-blue-50" />
        <KpiCard label="Réussies" value={data.successfulTransactions} icon={<CheckCircle className="h-5 w-5 text-emerald-600" />} color="bg-emerald-50" />
        <KpiCard label="Échouées" value={data.failedTransactions} sub={`${data.pendingTransactions} en attente`} icon={<XCircle className="h-5 w-5 text-red-600" />} color="bg-red-50" />
      </div>

      {/* Revenue timeline */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-4 font-medium">Revenus sur {days} jours</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data.timeline}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(263 70% 50%)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="hsl(263 70% 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: any) => fmt(v)} labelFormatter={(l) => new Date(l).toLocaleDateString('fr-FR')} />
            <Area type="monotone" dataKey="amount" stroke="hsl(263 70% 50%)" fill="url(#rev)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* By provider */}
      {data.byProvider?.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 font-medium">Revenus par prestataire</h3>
          <div className="flex items-center gap-8">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data.byProvider} dataKey="amount" nameKey="provider" cx="50%" cy="50%" outerRadius={80} label={({ provider, percent }) => `${provider} ${(percent * 100).toFixed(0)}%`}>
                  {data.byProvider.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="shrink-0 space-y-2">
              {data.byProvider.map((p: any, i: number) => (
                <div key={p.provider} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-muted-foreground">{p.provider}</span>
                  <span className="font-medium ml-auto">{fmt(p.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Patients Tab ─────────────────────────────────────────────────────────────

function PatientsTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<any>('/admin/stats/patients').then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-16 text-center text-muted-foreground">Chargement…</div>;
  if (!data) return null;

  const activeData = [
    { name: 'Actifs', value: data.activePatients },
    { name: 'Inactifs', value: data.inactivePatients },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total patients" value={data.totalPatients.toLocaleString('fr-FR')} icon={<Users className="h-5 w-5 text-blue-600" />} color="bg-blue-50" />
        <KpiCard label="Nouveaux (30j)" value={data.newPatientsThisMonth} icon={<TrendingUp className="h-5 w-5 text-violet-600" />} color="bg-violet-50" />
        <KpiCard label="Actifs" value={data.activePatients.toLocaleString('fr-FR')} icon={<CheckCircle className="h-5 w-5 text-emerald-600" />} color="bg-emerald-50" />
        <KpiCard label="RDV moy. / patient" value={data.avgAppointmentsPerPatient} icon={<Clock className="h-5 w-5 text-orange-600" />} color="bg-orange-50" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Active vs inactive */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 font-medium">Patients actifs vs inactifs</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={activeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                <Cell fill="hsl(160 60% 45%)" />
                <Cell fill="hsl(0 0% 80%)" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top cities */}
        {data.topCities?.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 font-medium">Top villes</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.topCities} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="city" tick={{ fontSize: 11 }} width={90} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(263 70% 50%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Doctors Tab ──────────────────────────────────────────────────────────────

function DoctorsTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<any>('/admin/stats/doctors-detail').then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-16 text-center text-muted-foreground">Chargement…</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard label="Total médecins" value={data.totalDoctors.toLocaleString('fr-FR')} icon={<Stethoscope className="h-5 w-5 text-blue-600" />} color="bg-blue-50" />
        <KpiCard label="Actifs" value={data.activeDoctors} icon={<CheckCircle className="h-5 w-5 text-emerald-600" />} color="bg-emerald-50" />
        <KpiCard label="Inactifs" value={data.inactiveDoctors} icon={<XCircle className="h-5 w-5 text-red-600" />} color="bg-red-50" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* By specialty */}
        {data.bySpecialty?.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 font-medium">Par spécialité</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.bySpecialty} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="specialty" tick={{ fontSize: 10 }} width={110} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(263 70% 50%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top doctors by appointments */}
        {data.topDoctors?.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 font-medium">Top médecins (RDV)</h3>
            <div className="space-y-3">
              {data.topDoctors.slice(0, 8).map((d: any, i: number) => (
                <div key={d.id} className="flex items-center gap-3 text-sm">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{d.fullName ?? d.email}</p>
                    <p className="text-xs text-muted-foreground">{d.doctorProfile?.specialty ?? 'Généraliste'}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-medium">{d._count?.appointments ?? 0} RDV</p>
                    {d.doctorProfile?.averageRating > 0 && (
                      <p className="text-xs text-muted-foreground flex items-center gap-0.5 justify-end">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        {Number(d.doctorProfile.averageRating).toFixed(1)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StatisticsPage() {
  const [tab, setTab] = useState<Tab>('payments');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Statistiques</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Analytiques de la plateforme</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-muted/50 p-1 w-fit border border-border">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors
              ${tab === key ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {tab === 'payments' && <PaymentsTab />}
      {tab === 'patients' && <PatientsTab />}
      {tab === 'doctors' && <DoctorsTab />}
    </div>
  );
}
