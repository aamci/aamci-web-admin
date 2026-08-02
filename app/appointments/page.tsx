'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { ChevronLeft, ChevronRight, RefreshCcw, Ban, CheckCircle, UserX, RotateCcw } from 'lucide-react';
import { useAuth } from '@/app/_providers/AuthProvider';

interface Appointment {
  id: string;
  status: string;
  notes: string | null;
  createdAt: string;
  prepaidStatus?: string | null;
  patient?: { fullName: string | null; email: string } | null;
  slot?: { start: string; end: string; ownerId: string } | null;
  kind?: { name: string; durationMins: number } | null;
}

interface AppointmentsResponse {
  appointments: Appointment[];
  total: number;
  page: number;
  limit: number;
}

const FILTER_STATUSES = ['', 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'];
const ACTION_STATUSES  = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'];

const statusLabel: Record<string, string> = {
  PENDING: 'En attente', CONFIRMED: 'Confirmé', CANCELLED: 'Annulé',
  COMPLETED: 'Terminé', NO_SHOW: 'Absent',
};

const statusColor: Record<string, string> = {
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  PENDING:   'bg-amber-100 text-amber-700',
  CANCELLED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  NO_SHOW:   'bg-slate-100 text-slate-700',
};

const WRITE_ROLES = ['ADMIN', 'ADMIN_WRITE'];

export default function AppointmentsPage() {
  const { user: me } = useAuth();
  const canWrite = WRITE_ROLES.includes(me?.role ?? '');

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [status, setStatus]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const limit = 20;

  const fetchAppointments = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit), ...(status ? { status } : {}) });
    apiFetch<AppointmentsResponse>(`/admin/appointments?${params}`)
      .then(res => { setAppointments(res.appointments); setTotal(res.total); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, status]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  async function changeStatus(id: string, newStatus: string) {
    setActionId(id);
    setOpenMenu(null);
    try {
      await apiFetch(`/admin/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    } catch (e: any) { setError(e.message); }
    finally { setActionId(null); }
  }

  async function refund(id: string) {
    if (!confirm('Lancer le remboursement Stripe pour ce rendez-vous ?')) return;
    setActionId(id);
    try {
      await apiFetch(`/payments/prepay/${id}/refund`, { method: 'POST' });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, prepaidStatus: 'REFUNDED' } : a));
    } catch (e: any) { setError('Remboursement échoué : ' + e.message); }
    finally { setActionId(null); }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5" onClick={() => setOpenMenu(null)}>
      <div>
        <h1 className="text-2xl font-bold">Rendez-vous</h1>
        <p className="text-sm text-muted-foreground">{total} rendez-vous au total</p>
      </div>

      <div>
        <select className="input w-52" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          {FILTER_STATUSES.map(s => <option key={s} value={s}>{s ? statusLabel[s] : 'Tous les statuts'}</option>)}
        </select>
      </div>

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date / Heure</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Patient</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Paiement</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">Chargement…</td></tr>
            ) : appointments.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">Aucun rendez-vous trouvé</td></tr>
            ) : appointments.map(a => (
              <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3 font-medium">
                  {a.slot?.start
                    ? new Date(a.slot.start).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                    : new Date(a.createdAt).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{a.patient?.fullName ?? a.patient?.email ?? '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.kind?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[a.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {statusLabel[a.status] ?? a.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {a.prepaidStatus ? (
                    <span className={`text-xs font-medium ${a.prepaidStatus === 'PAID' ? 'text-emerald-600' : a.prepaidStatus === 'REFUNDED' ? 'text-slate-500' : 'text-amber-600'}`}>
                      {a.prepaidStatus}
                    </span>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <Link href={`/appointments/${a.id}`} className="text-xs text-primary hover:underline px-2">Détails</Link>

                    {canWrite && (
                      <div className="relative" onClick={e => e.stopPropagation()}>
                        <button
                          disabled={actionId === a.id}
                          onClick={() => setOpenMenu(openMenu === a.id ? null : a.id)}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-50"
                          title="Actions"
                        >
                          <RefreshCcw className="h-4 w-4" />
                        </button>

                        {openMenu === a.id && (
                          <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-xl border border-border bg-popover shadow-lg py-1">
                            <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Changer le statut</p>
                            {ACTION_STATUSES.filter(s => s !== a.status).map(s => {
                              const icons: Record<string, React.ReactNode> = {
                                CONFIRMED: <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />,
                                CANCELLED: <Ban className="h-3.5 w-3.5 text-red-600" />,
                                NO_SHOW:   <UserX className="h-3.5 w-3.5 text-slate-500" />,
                                PENDING:   <RotateCcw className="h-3.5 w-3.5 text-amber-600" />,
                                COMPLETED: <CheckCircle className="h-3.5 w-3.5 text-blue-600" />,
                              };
                              return (
                                <button
                                  key={s}
                                  onClick={() => changeStatus(a.id, s)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60 transition-colors"
                                >
                                  {icons[s]}
                                  {statusLabel[s]}
                                </button>
                              );
                            })}
                            {a.prepaidStatus === 'PAID' && (
                              <>
                                <div className="border-t border-border my-1" />
                                <button
                                  onClick={() => refund(a.id)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  Rembourser
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} sur {totalPages} — {total} résultats</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted/60 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" /> Précédent
            </button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted/60 disabled:opacity-40">
              Suivant <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
