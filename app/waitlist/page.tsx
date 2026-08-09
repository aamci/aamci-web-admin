'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { Clock, Search, Trash2, ChevronLeft, ChevronRight, RefreshCw, Phone, Mail } from 'lucide-react';
import { useAuth } from '@/app/_providers/AuthProvider';

interface WaitlistEntry {
  id: string;
  date: string;
  position: number;
  status: 'ACTIVE' | 'NOTIFIED' | 'BOOKED' | 'EXPIRED';
  notifiedAt?: string | null;
  createdAt: string;
  patient?: { id: string; fullName: string | null; email: string; phone?: string | null } | null;
  doctor?: { id: string; fullName: string | null; email: string } | null;
}

interface WaitlistResponse {
  entries: WaitlistEntry[];
  total: number; page: number; limit: number; pages: number;
}

const STATUSES = ['', 'ACTIVE', 'NOTIFIED', 'BOOKED', 'EXPIRED'];

const statusLabel: Record<string, string> = {
  ACTIVE: 'En attente', NOTIFIED: 'Notifié', BOOKED: 'Réservé', EXPIRED: 'Expiré',
};

const statusColor: Record<string, string> = {
  ACTIVE:   'bg-blue-100 text-blue-700',
  NOTIFIED: 'bg-emerald-100 text-emerald-700',
  BOOKED:   'bg-teal-100 text-teal-700',
  EXPIRED:  'bg-slate-100 text-slate-500',
};

const WRITE_ROLES = ['ADMIN', 'ADMIN_WRITE'];

export default function WaitlistPage() {
  const { user: me } = useAuth();
  const canWrite = WRITE_ROLES.includes(me?.role ?? '');

  const [entries, setEntries]     = useState<WaitlistEntry[]>([]);
  const [total, setTotal]         = useState(0);
  const [pages, setPages]         = useState(1);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [status, setStatus]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const limit = 20;

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    apiFetch<WaitlistResponse>(`/admin/waitlist?${params}`)
      .then(r => { setEntries(r.entries); setTotal(r.total); setPages(r.pages); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  async function remove(id: string) {
    if (!confirm('Retirer ce patient de la liste d\'attente ?')) return;
    setDeletingId(id);
    try {
      await apiFetch(`/admin/waitlist/${id}`, { method: 'DELETE' });
      setEntries(prev => prev.filter(e => e.id !== id));
      setTotal(t => t - 1);
    } catch (e: any) { setError(e.message); }
    finally { setDeletingId(null); }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6 text-teal-600" />
            Liste d&apos;attente
          </h1>
          <p className="text-sm text-muted-foreground">{total} entrée(s) au total</p>
        </div>
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/60 disabled:opacity-40">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher par patient ou médecin…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="input w-40"
        >
          {STATUSES.map(s => <option key={s} value={s}>{s ? statusLabel[s] : 'Tous les statuts'}</option>)}
        </select>
      </div>

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date / Pos.</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Patient</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Médecin</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Notifié</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">Chargement…</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">Aucune entrée</td></tr>
            ) : entries.map(e => (
              <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3">
                  <div className="font-medium text-xs">
                    {new Date(e.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">Pos. #{e.position}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{e.patient?.fullName ?? '—'}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {e.patient?.email && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />{e.patient.email}
                      </span>
                    )}
                    {e.patient?.phone && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />{e.patient.phone}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <div>{e.doctor?.fullName ?? '—'}</div>
                  <div className="text-xs">{e.doctor?.email}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[e.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {statusLabel[e.status] ?? e.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {e.notifiedAt ? new Date(e.notifiedAt).toLocaleDateString('fr-FR') : '—'}
                </td>
                <td className="px-4 py-3">
                  {canWrite && (
                    <button
                      disabled={deletingId === e.id}
                      onClick={() => remove(e.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                      title="Retirer de la liste"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} sur {pages} — {total} résultats</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted/60 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" /> Précédent
            </button>
            <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted/60 disabled:opacity-40">
              Suivant <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
