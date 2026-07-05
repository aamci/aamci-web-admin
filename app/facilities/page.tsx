'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { Search, ChevronLeft, ChevronRight, Building2, MapPin, Phone, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/app/_providers/AuthProvider';

const WRITE_ROLES = ['ADMIN', 'ADMIN_WRITE'];
const FACILITY_TYPES = ['CHU', 'CLINIC', 'POLYCLINIC', 'CENTER'] as const;

interface FacilityForm {
  name: string; type: string; city: string; address: string;
  phone: string; email: string; website: string; description: string;
}

interface Facility {
  id: string;
  name: string;
  type: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
  _count: { doctors: number; managers: number };
}

interface FacilitiesResponse {
  facilities: Facility[];
  total: number;
  page: number;
  limit: number;
}

const typeColor: Record<string, string> = {
  CLINIC: 'bg-blue-50 text-blue-700',
  CHU: 'bg-violet-50 text-violet-700',
  POLYCLINIC: 'bg-indigo-50 text-indigo-700',
  CENTER: 'bg-teal-50 text-teal-700',
};

const EMPTY_FORM: FacilityForm = { name: '', type: 'CLINIC', city: '', address: '', phone: '', email: '', website: '', description: '' };

export default function FacilitiesPage() {
  const { user: me } = useAuth();
  const canWrite = WRITE_ROLES.includes(me?.role ?? '');

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const limit = 20;

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<FacilityForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchFacilities = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit), ...(search ? { search } : {}) });
    apiFetch<FacilitiesResponse>(`/admin/facilities?${params}`)
      .then((res) => { setFacilities(res.facilities); setTotal(res.total); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { fetchFacilities(); }, [fetchFacilities]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Le nom est requis'); return; }
    setSaving(true); setFormError('');
    try {
      await apiFetch('/admin/facilities', { method: 'POST', body: JSON.stringify(form) });
      setShowCreate(false);
      setForm(EMPTY_FORM);
      fetchFacilities();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Établissements</h1>
          <p className="text-sm text-muted-foreground">{total} établissements au total</p>
        </div>
        {canWrite && (
          <button onClick={() => { setShowCreate(true); setForm(EMPTY_FORM); setFormError(''); }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Nouvel établissement
          </button>
        )}
      </div>

      {/* Modal création */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-semibold text-lg">Nouvel établissement</h2>
              <button onClick={() => setShowCreate(false)} className="rounded-lg p-1 hover:bg-muted/60"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              {formError && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{formError}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Nom *</label>
                  <input className="input w-full" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="CHU de Libreville" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type *</label>
                  <select className="input w-full" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {FACILITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ville</label>
                  <input className="input w-full" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Libreville" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Adresse</label>
                  <input className="input w-full" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Boulevard Triomphal" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Téléphone</label>
                  <input className="input w-full" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+241 01 XX XX XX" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input className="input w-full" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="contact@..." />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Site web</label>
                  <input className="input w-full" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://..." />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea className="input w-full min-h-[80px] resize-none" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description de l'établissement…" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted/60">Annuler</button>
                <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  {saving ? 'Création…' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input className="input pl-9" placeholder="Nom ou ville…" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Chargement…</div>
      ) : facilities.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
          Aucun établissement trouvé
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {facilities.map((f) => (
            <Link key={f.id} href={`/facilities/${f.id}`} className="block rounded-2xl border border-border bg-card p-5 space-y-3 hover:shadow-md hover:border-primary/40 transition-all cursor-pointer">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary shrink-0" />
                  <h3 className="font-semibold text-sm leading-snug">{f.name}</h3>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${typeColor[f.type] ?? 'bg-gray-100 text-gray-700'}`}>
                  {f.type}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground">
                {(f.city || f.address) && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>{[f.address, f.city].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                {f.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span>{f.phone}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-1 border-t border-border text-sm">
                <div>
                  <p className="text-2xl font-bold">{f._count.doctors}</p>
                  <p className="text-xs text-muted-foreground">Médecins</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{f._count.managers}</p>
                  <p className="text-xs text-muted-foreground">Gestionnaires</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} sur {totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted/60 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" /> Précédent
            </button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted/60 disabled:opacity-40">
              Suivant <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
