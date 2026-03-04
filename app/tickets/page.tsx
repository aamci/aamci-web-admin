'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import {
  MessageSquare, ChevronLeft, ChevronRight, X,
  AlertTriangle, Clock, CheckCircle, XCircle, Stethoscope, Users,
} from 'lucide-react';

const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const statusLabel: Record<string, string> = {
  OPEN: 'Ouvert', IN_PROGRESS: 'En cours', RESOLVED: 'Résolu', CLOSED: 'Fermé',
};
const statusColor: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700', IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700', CLOSED: 'bg-gray-100 text-gray-600',
};
const statusIcon: Record<string, React.ReactNode> = {
  OPEN: <Clock className="h-3 w-3" />, IN_PROGRESS: <AlertTriangle className="h-3 w-3" />,
  RESOLVED: <CheckCircle className="h-3 w-3" />, CLOSED: <XCircle className="h-3 w-3" />,
};
const priorityLabel: Record<string, string> = {
  LOW: 'Faible', MEDIUM: 'Normale', HIGH: 'Haute', URGENT: 'Urgente',
};
const priorityColor: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600', MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700', URGENT: 'bg-red-100 text-red-700',
};

type AuthorType = 'DOCTOR' | 'PATIENT';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category?: string;
  authorType: string;
  response?: string;
  resolvedAt?: string;
  createdAt: string;
  author?: { id: string; fullName?: string; email: string; role: string };
}

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function TicketList({ authorType }: { authorType: AuthorType }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [response, setResponse] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ authorType, page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      if (priorityFilter) params.set('priority', priorityFilter);
      const data = await apiFetch<any>(`/admin/tickets?${params}`);
      setTickets(data.tickets);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, statusFilter, priorityFilter, authorType]);

  const openTicket = (t: Ticket) => {
    setSelected(t);
    setResponse(t.response ?? '');
    setError('');
  };

  const handleUpdate = async (updates: { status?: string; response?: string; priority?: string }) => {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/admin/tickets/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      setSelected(null);
      load();
    } catch (e: any) {
      setError(e.message ?? 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const openCount = tickets.filter((t) => t.status === 'OPEN').length;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select className="input w-44" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">Tous les statuts</option>
          {STATUSES.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
        </select>
        <select className="input w-44" value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}>
          <option value="">Toutes les priorités</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{priorityLabel[p]}</option>)}
        </select>
        <div className="ml-auto text-sm text-muted-foreground self-center">
          {total} ticket{total !== 1 ? 's' : ''}
          {openCount > 0 && <span className="ml-2 rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-medium">{openCount} ouvert{openCount > 1 ? 's' : ''}</span>}
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sujet</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Auteur</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Priorité</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">Chargement…</td></tr>
            ) : tickets.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">Aucun ticket trouvé</td></tr>
            ) : tickets.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3">
                  <p className="font-medium">{t.title}</p>
                  {t.category && <p className="text-xs text-muted-foreground capitalize">{t.category}</p>}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{t.author?.fullName ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">{t.author?.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityColor[t.priority]}`}>
                    {priorityLabel[t.priority]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[t.status]}`}>
                    {statusIcon[t.status]}
                    {statusLabel[t.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{fmtDate(t.createdAt)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => openTicket(t)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted/60"
                  >
                    Traiter
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">Page {page} sur {pages}</p>
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

      {/* Ticket detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{selected.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[selected.status]}`}>
                    {statusIcon[selected.status]} {statusLabel[selected.status]}
                  </span>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityColor[selected.priority]}`}>
                    {priorityLabel[selected.priority]}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-1.5 hover:bg-muted/60 shrink-0"><X className="h-4 w-4" /></button>
            </div>

            {/* Author info */}
            <div className="rounded-xl bg-muted/30 p-4 text-sm space-y-1">
              <p><span className="text-muted-foreground">Auteur :</span> <strong>{selected.author?.fullName ?? '—'}</strong> ({selected.author?.email})</p>
              <p><span className="text-muted-foreground">Rôle :</span> {selected.author?.role}</p>
              <p><span className="text-muted-foreground">Envoyé le :</span> {fmtDate(selected.createdAt)}</p>
              {selected.category && <p><span className="text-muted-foreground">Catégorie :</span> {selected.category}</p>}
            </div>

            {/* Description */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
              <p className="text-sm whitespace-pre-wrap bg-muted/20 rounded-lg p-3">{selected.description}</p>
            </div>

            {/* Response */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Réponse admin</label>
              <textarea
                className="input min-h-[100px] resize-none"
                placeholder="Rédigez votre réponse..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {/* Status change */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Changer le statut</p>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    disabled={selected.status === s}
                    onClick={() => handleUpdate({ status: s, response: response || undefined })}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors
                      ${selected.status === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted/60'}`}
                  >
                    {statusLabel[s]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button onClick={() => setSelected(null)} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted/60">Annuler</button>
              <button
                onClick={() => handleUpdate({ response: response || undefined })}
                disabled={saving || !response}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? 'Enregistrement…' : 'Enregistrer la réponse'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TicketsPage() {
  const [tab, setTab] = useState<AuthorType>('DOCTOR');

  const tabs = [
    { key: 'DOCTOR' as AuthorType, label: 'Médecins', icon: <Stethoscope className="h-4 w-4" /> },
    { key: 'PATIENT' as AuthorType, label: 'Patients', icon: <Users className="h-4 w-4" /> },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquare className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold">Tickets support</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gestion des demandes d&apos;assistance</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-muted/50 p-1 w-fit border border-border">
        {tabs.map(({ key, label, icon }) => (
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

      <TicketList key={tab} authorType={tab} />
    </div>
  );
}
