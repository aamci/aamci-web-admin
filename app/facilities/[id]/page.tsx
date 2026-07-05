'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import {
  ArrowLeft, Building2, MapPin, Phone, Mail, Globe, Users, UserCog,
  Star, FileText, CheckCircle2, Clock, XCircle, AlertCircle, Pencil, X, Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/app/_providers/AuthProvider';

const WRITE_ROLES = ['ADMIN', 'ADMIN_WRITE'];
const FACILITY_TYPES = ['CHU', 'CLINIC', 'POLYCLINIC', 'CENTER'] as const;

interface DoctorEntry {
  userId: string;
  specialty: string | null;
  averageRating: number | null;
  totalReviews: number;
  user: {
    id: string;
    fullName: string | null;
    email: string;
    phone: string | null;
    isActive: boolean;
    avatarUrl: string | null;
  };
}

interface ManagerEntry {
  id: string;
  user: {
    id: string;
    fullName: string | null;
    email: string;
    phone: string | null;
  };
}

interface Contract {
  id: string;
  title: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string | null;
  value: number | null;
  currency: string;
  signedAt: string | null;
}

interface FacilityDetail {
  id: string;
  name: string;
  type: string;
  description: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  createdAt: string;
  doctors: DoctorEntry[];
  managers: ManagerEntry[];
  contracts: Contract[];
  _count: { doctors: number; managers: number };
}

const typeColor: Record<string, string> = {
  CLINIC: 'bg-blue-50 text-blue-700',
  CHU: 'bg-violet-50 text-violet-700',
  POLYCLINIC: 'bg-indigo-50 text-indigo-700',
  CENTER: 'bg-teal-50 text-teal-700',
};

const contractStatusIcon: Record<string, React.ReactNode> = {
  ACTIVE: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  DRAFT: <Clock className="h-4 w-4 text-amber-500" />,
  EXPIRED: <XCircle className="h-4 w-4 text-slate-400" />,
  TERMINATED: <XCircle className="h-4 w-4 text-red-500" />,
  SUSPENDED: <AlertCircle className="h-4 w-4 text-orange-500" />,
};

const contractStatusColor: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  DRAFT: 'bg-amber-50 text-amber-700',
  EXPIRED: 'bg-slate-100 text-slate-600',
  TERMINATED: 'bg-red-50 text-red-700',
  SUSPENDED: 'bg-orange-50 text-orange-700',
};

const contractStatusLabel: Record<string, string> = {
  ACTIVE: 'Actif', DRAFT: 'Brouillon', EXPIRED: 'Expiré', TERMINATED: 'Résilié', SUSPENDED: 'Suspendu',
};

export default function FacilityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuth();
  const canWrite = WRITE_ROLES.includes(me?.role ?? '');

  const [facility, setFacility] = useState<FacilityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<Partial<FacilityDetail>>({});
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    apiFetch<FacilityDetail>(`/admin/facilities/${id}`)
      .then((f) => { setFacility(f); setEditForm(f); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setEditError('');
    try {
      const updated = await apiFetch<FacilityDetail>(`/admin/facilities/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editForm.name, type: editForm.type, city: editForm.city,
          address: editForm.address, phone: editForm.phone, email: editForm.email,
          website: editForm.website, description: editForm.description,
        }),
      });
      setFacility(updated);
      setShowEdit(false);
    } catch (err) {
      setEditError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
        {error || 'Établissement introuvable'}
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href="/facilities"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted/60 shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Building2 className="h-6 w-6 text-primary shrink-0" />
            <h1 className="text-2xl font-bold truncate">{facility.name}</h1>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColor[facility.type] ?? 'bg-gray-100 text-gray-700'}`}>
              {facility.type}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Créé le {new Date(facility.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {canWrite && (
          <button onClick={() => { setEditForm(facility); setEditError(''); setShowEdit(true); }}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted/60">
            <Pencil className="h-4 w-4" /> Modifier
          </button>
        )}
      </div>

      {/* Modal édition */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-semibold text-lg">Modifier l'établissement</h2>
              <button onClick={() => setShowEdit(false)} className="rounded-lg p-1 hover:bg-muted/60"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              {editError && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{editError}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Nom *</label>
                  <input className="input w-full" value={editForm.name ?? ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select className="input w-full" value={editForm.type ?? ''} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}>
                    {FACILITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ville</label>
                  <input className="input w-full" value={editForm.city ?? ''} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Adresse</label>
                  <input className="input w-full" value={editForm.address ?? ''} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Téléphone</label>
                  <input className="input w-full" value={editForm.phone ?? ''} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input className="input w-full" type="email" value={editForm.email ?? ''} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Site web</label>
                  <input className="input w-full" value={editForm.website ?? ''} onChange={e => setEditForm(f => ({ ...f, website: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea className="input w-full min-h-[80px] resize-none" value={editForm.description ?? ''} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-between gap-3 pt-1">
                <button type="button" onClick={async () => {
                  if (!confirm('Supprimer cet établissement ? Cette action est irréversible.')) return;
                  try {
                    await apiFetch(`/admin/facilities/${id}`, { method: 'DELETE' });
                    window.location.href = '/facilities';
                  } catch (err) { alert('Erreur : ' + (err as Error).message); }
                }} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" /> Supprimer
                </button>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowEdit(false)} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted/60">Annuler</button>
                  <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                    {saving ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Médecins', value: facility._count.doctors, icon: <Users className="h-5 w-5 text-blue-500" /> },
          { label: 'Gestionnaires', value: facility._count.managers, icon: <UserCog className="h-5 w-5 text-violet-500" /> },
          { label: 'Contrats', value: facility.contracts.length, icon: <FileText className="h-5 w-5 text-teal-500" /> },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
            {s.icon}
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
        <h2 className="font-semibold">Coordonnées</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {(facility.address || facility.city) && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <span>{[facility.address, facility.city].filter(Boolean).join(', ')}</span>
            </div>
          )}
          {facility.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{facility.phone}</span>
            </div>
          )}
          {facility.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{facility.email}</span>
            </div>
          )}
          {facility.website && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
              <a href={facility.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                {facility.website}
              </a>
            </div>
          )}
        </div>
        {facility.description && (
          <p className="text-sm text-muted-foreground pt-1">{facility.description}</p>
        )}
      </div>

      {/* Doctors */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          <h2 className="font-semibold">Médecins ({facility.doctors.length})</h2>
        </div>
        {facility.doctors.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun médecin rattaché.</p>
        ) : (
          <div className="divide-y divide-border">
            {facility.doctors.map((d) => (
              <div key={d.userId} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/users/${d.user.id}`}
                      className="text-sm font-medium hover:text-primary hover:underline truncate"
                    >
                      {d.user.fullName ?? d.user.email}
                    </Link>
                    {!d.user.isActive && (
                      <span className="shrink-0 rounded-full bg-red-50 px-1.5 py-0.5 text-xs text-red-600">Suspendu</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {d.specialty ?? 'Spécialité non renseignée'}
                    {d.user.phone && ` · ${d.user.phone}`}
                  </p>
                </div>
                {d.averageRating != null && (
                  <div className="shrink-0 flex items-center gap-1 text-xs text-amber-600">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {d.averageRating.toFixed(1)}
                    <span className="text-muted-foreground">({d.totalReviews})</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Managers */}
      {facility.managers.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-violet-500" />
            <h2 className="font-semibold">Gestionnaires ({facility.managers.length})</h2>
          </div>
          <div className="divide-y divide-border">
            {facility.managers.map((m) => (
              <div key={m.id} className="py-3 first:pt-0 last:pb-0">
                <Link
                  href={`/users/${m.user.id}`}
                  className="text-sm font-medium hover:text-primary hover:underline"
                >
                  {m.user.fullName ?? m.user.email}
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {m.user.email}
                  {m.user.phone && ` · ${m.user.phone}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contracts */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-teal-500" />
          <h2 className="font-semibold">Contrats ({facility.contracts.length})</h2>
        </div>
        {facility.contracts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun contrat associé.</p>
        ) : (
          <div className="divide-y divide-border">
            {facility.contracts.map((c) => (
              <div key={c.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.type}</p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${contractStatusColor[c.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {contractStatusIcon[c.status]}
                    {contractStatusLabel[c.status] ?? c.status}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>Début : {new Date(c.startDate).toLocaleDateString('fr-FR')}</span>
                  {c.endDate && <span>Fin : {new Date(c.endDate).toLocaleDateString('fr-FR')}</span>}
                  {c.value != null && <span>{c.value.toLocaleString('fr-FR')} {c.currency}</span>}
                  {c.signedAt && <span>Signé le {new Date(c.signedAt).toLocaleDateString('fr-FR')}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
