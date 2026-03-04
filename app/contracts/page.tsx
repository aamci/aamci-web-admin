'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import {
  FileText, Plus, Search, ChevronLeft, ChevronRight,
  X, Check, AlertTriangle, Clock, Ban,
} from 'lucide-react';

const CONTRACT_TYPES = ['DOCTOR', 'HOSPITAL', 'CHU', 'CLINIC', 'PHARMACY', 'PARTNER'];
const CONTRACT_STATUSES = ['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'SUSPENDED'];

const typeLabel: Record<string, string> = {
  DOCTOR: 'Médecin', HOSPITAL: 'Hôpital', CHU: 'CHU',
  CLINIC: 'Clinique', PHARMACY: 'Pharmacie', PARTNER: 'Partenaire',
};
const typeColor: Record<string, string> = {
  DOCTOR: 'bg-blue-100 text-blue-700', HOSPITAL: 'bg-purple-100 text-purple-700',
  CHU: 'bg-indigo-100 text-indigo-700', CLINIC: 'bg-teal-100 text-teal-700',
  PHARMACY: 'bg-green-100 text-green-700', PARTNER: 'bg-orange-100 text-orange-700',
};
const statusLabel: Record<string, string> = {
  DRAFT: 'Brouillon', ACTIVE: 'Actif', EXPIRED: 'Expiré',
  TERMINATED: 'Résilié', SUSPENDED: 'Suspendu',
};
const statusColor: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600', ACTIVE: 'bg-emerald-100 text-emerald-700',
  EXPIRED: 'bg-yellow-100 text-yellow-700', TERMINATED: 'bg-red-100 text-red-700',
  SUSPENDED: 'bg-orange-100 text-orange-700',
};
const statusIcon: Record<string, React.ReactNode> = {
  DRAFT: <Clock className="h-3 w-3" />,
  ACTIVE: <Check className="h-3 w-3" />,
  EXPIRED: <AlertTriangle className="h-3 w-3" />,
  TERMINATED: <Ban className="h-3 w-3" />,
  SUSPENDED: <AlertTriangle className="h-3 w-3" />,
};

interface Contract {
  id: string;
  title: string;
  type: string;
  status: string;
  entityName: string;
  startDate: string;
  endDate?: string;
  value?: number;
  currency: string;
  signedAt?: string;
  createdAt: string;
  user?: { id: string; fullName?: string; email: string; role: string };
  facility?: { id: string; name: string; type: string };
}

const fmt = (n?: number) =>
  n !== undefined ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(n) : '—';

const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Contract | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '', type: 'DOCTOR', entityName: '', startDate: '',
    endDate: '', value: '', currency: 'XAF', terms: '', notes: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      const data = await apiFetch<any>(`/admin/contracts?${params}`);
      setContracts(data.contracts);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, typeFilter, statusFilter]);
  useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t); }, [search]);

  const handleCreate = async () => {
    if (!form.title || !form.type || !form.entityName || !form.startDate) {
      setError('Titre, type, entité et date de début sont requis');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiFetch('/admin/contracts', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          value: form.value ? Number(form.value) : undefined,
          endDate: form.endDate || undefined,
        }),
      });
      setShowCreate(false);
      setForm({ title: '', type: 'DOCTOR', entityName: '', startDate: '', endDate: '', value: '', currency: 'XAF', terms: '', notes: '' });
      load();
    } catch (e: any) {
      setError(e.message ?? 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await apiFetch(`/admin/contracts/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setSelected(null);
      load();
    } catch (e: any) {
      setError(e.message ?? 'Erreur');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Contrats</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{total} contrat{total !== 1 ? 's' : ''} au total</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Nouveau contrat
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="input pl-9"
            placeholder="Rechercher par nom d'entité..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-44" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
          <option value="">Tous les types</option>
          {CONTRACT_TYPES.map((t) => <option key={t} value={t}>{typeLabel[t]}</option>)}
        </select>
        <select className="input w-44" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">Tous les statuts</option>
          {CONTRACT_STATUSES.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Titre / Entité</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Valeur</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Début</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fin</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Chargement…</td></tr>
            ) : contracts.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Aucun contrat trouvé</td></tr>
            ) : contracts.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3">
                  <p className="font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.entityName}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColor[c.type] ?? 'bg-gray-100 text-gray-600'}`}>
                    {typeLabel[c.type] ?? c.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[c.status] ?? ''}`}>
                    {statusIcon[c.status]}
                    {statusLabel[c.status] ?? c.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">{fmt(c.value)}</td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDate(c.startDate)}</td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDate(c.endDate)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setSelected(c)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted/60"
                  >
                    Gérer
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
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted/60 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Précédent
              </button>
              <button
                disabled={page >= pages}
                onClick={() => setPage(p => p + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted/60 disabled:opacity-40"
              >
                Suivant <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Nouveau contrat</h2>
              <button onClick={() => setShowCreate(false)} className="rounded-lg p-1.5 hover:bg-muted/60"><X className="h-4 w-4" /></button>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Titre *</label>
                <input className="input" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Titre du contrat" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Type *</label>
                <select className="input" value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}>
                  {CONTRACT_TYPES.map((t) => <option key={t} value={t}>{typeLabel[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Nom de l&apos;entité *</label>
                <input className="input" value={form.entityName} onChange={(e) => setForm(f => ({ ...f, entityName: e.target.value }))} placeholder="Dr. Dupont / Hôpital Central" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Date de début *</label>
                <input type="date" className="input" value={form.startDate} onChange={(e) => setForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Date de fin</label>
                <input type="date" className="input" value={form.endDate} onChange={(e) => setForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Valeur (XAF)</label>
                <input type="number" className="input" value={form.value} onChange={(e) => setForm(f => ({ ...f, value: e.target.value }))} placeholder="0" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Devise</label>
                <select className="input" value={form.currency} onChange={(e) => setForm(f => ({ ...f, currency: e.target.value }))}>
                  <option value="XAF">XAF</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Conditions</label>
                <textarea className="input min-h-[80px] resize-none" value={form.terms} onChange={(e) => setForm(f => ({ ...f, terms: e.target.value }))} placeholder="Termes et conditions du contrat..." />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes internes</label>
                <textarea className="input min-h-[60px] resize-none" value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes internes..." />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowCreate(false)} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted/60">Annuler</button>
              <button onClick={handleCreate} disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                {saving ? 'Création…' : 'Créer le contrat'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Gérer le contrat</h2>
              <button onClick={() => setSelected(null)} className="rounded-lg p-1.5 hover:bg-muted/60"><X className="h-4 w-4" /></button>
            </div>

            <div className="rounded-xl bg-muted/30 p-4 space-y-2 text-sm">
              <p><span className="text-muted-foreground">Titre :</span> <strong>{selected.title}</strong></p>
              <p><span className="text-muted-foreground">Entité :</span> {selected.entityName}</p>
              <p><span className="text-muted-foreground">Type :</span> {typeLabel[selected.type]}</p>
              <p><span className="text-muted-foreground">Valeur :</span> {fmt(selected.value)}</p>
              <p><span className="text-muted-foreground">Période :</span> {fmtDate(selected.startDate)} → {fmtDate(selected.endDate)}</p>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">Changer le statut</p>
              <div className="flex flex-wrap gap-2">
                {CONTRACT_STATUSES.map((s) => (
                  <button
                    key={s}
                    disabled={selected.status === s}
                    onClick={() => handleStatusChange(selected.id, s)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors
                      ${selected.status === s
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:bg-muted/60'
                      }`}
                  >
                    {statusLabel[s]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={() => setSelected(null)} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted/60">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
