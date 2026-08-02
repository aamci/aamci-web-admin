'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Search, UserCheck, UserX, ChevronLeft, ChevronRight, Star, ShieldCheck, ShieldX, Clock } from 'lucide-react';
import { useAuth } from '@/app/_providers/AuthProvider';

const WRITE_ROLES = ['ADMIN', 'ADMIN_WRITE'];

interface Doctor {
  id: string;
  email: string;
  fullName: string | null;
  isActive: boolean;
  createdAt: string;
  doctorProfile: { id: string; specialty: string | null; city: string | null; averageRating: number | null; totalReviews: number; isVerified?: boolean } | null;
  _count: { appointments: number };
}

interface DoctorsResponse {
  doctors: Doctor[];
  total: number;
  page: number;
  limit: number;
}

type TabType = 'all' | 'pending';

export default function DoctorsPage() {
  const { user: me } = useAuth();
  const canWrite = WRITE_ROLES.includes(me?.role ?? '');

  const [tab, setTab]           = useState<TabType>('all');
  const [doctors, setDoctors]   = useState<Doctor[]>([]);
  const [pending, setPending]   = useState<Doctor[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [error, setError]       = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  const limit = 20;

  const fetchDoctors = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit), ...(search ? { search } : {}) });
    apiFetch<DoctorsResponse>(`/admin/doctors?${params}`)
      .then(res => { setDoctors(res.doctors); setTotal(res.total); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, search]);

  const fetchPending = useCallback(() => {
    setPendingLoading(true);
    apiFetch<Doctor[]>('/admin/doctors/pending-verification')
      .then(setPending)
      .catch(() => {})
      .finally(() => setPendingLoading(false));
  }, []);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);
  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await apiFetch(`/admin/users/${id}/${isActive ? 'suspend' : 'activate'}`, { method: 'POST' });
      fetchDoctors();
    } catch (e) { alert('Erreur : ' + (e as Error).message); }
  };

  const handleVerify = async (userId: string) => {
    setActionId(userId);
    try {
      await apiFetch(`/admin/doctors/${userId}/verify`, { method: 'POST' });
      setPending(p => p.filter(d => d.id !== userId));
      fetchDoctors();
    } catch (e) { alert('Erreur : ' + (e as Error).message); }
    finally { setActionId(null); }
  };

  const handleReject = async (userId: string) => {
    const reason = prompt('Raison du rejet (optionnel) :') ?? '';
    setActionId(userId);
    try {
      await apiFetch(`/admin/doctors/${userId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
      setPending(p => p.filter(d => d.id !== userId));
      fetchDoctors();
    } catch (e) { alert('Erreur : ' + (e as Error).message); }
    finally { setActionId(null); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Médecins</h1>
          <p className="text-sm text-muted-foreground">{total} médecins · {pending.length} en attente de vérification</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {([
          { key: 'all', label: 'Tous les médecins' },
          { key: 'pending', label: `En attente de vérification${pending.length ? ` (${pending.length})` : ''}` },
        ] as { key: TabType; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {/* Pending verification tab */}
      {tab === 'pending' && (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          {pendingLoading ? (
            <div className="py-16 text-center text-muted-foreground">Chargement…</div>
          ) : pending.length === 0 ? (
            <div className="py-16 text-center">
              <ShieldCheck className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
              <p className="font-medium">Aucun médecin en attente de vérification</p>
              <p className="text-sm text-muted-foreground mt-1">Tous les médecins ont été traités.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Médecin</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Spécialité</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ville</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Inscrit le</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {pending.map(d => (
                  <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="font-medium">{d.fullName ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">{d.email}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{d.doctorProfile?.specialty ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.doctorProfile?.city ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(d.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {canWrite && (
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            disabled={actionId === d.id}
                            onClick={() => handleVerify(d.id)}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" /> Vérifier
                          </button>
                          <button
                            disabled={actionId === d.id}
                            onClick={() => handleReject(d.id)}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                          >
                            <ShieldX className="h-3.5 w-3.5" /> Rejeter
                          </button>
                          <Link href={`/doctors/${d.id}`} className="text-xs text-primary hover:underline px-2">Profil</Link>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* All doctors tab */}
      {tab === 'all' && (
        <>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="input pl-9"
              placeholder="Rechercher…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Médecin</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Spécialité</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ville</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Note</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">RDV</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Chargement…</td></tr>
                ) : doctors.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Aucun médecin trouvé</td></tr>
                ) : doctors.map(d => (
                  <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <Link href={`/doctors/${d.id}`} className="font-medium hover:text-primary hover:underline">
                        {d.fullName ?? '—'}
                      </Link>
                      <p className="text-xs text-muted-foreground">{d.email}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{d.doctorProfile?.specialty ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.doctorProfile?.city ?? '—'}</td>
                    <td className="px-4 py-3">
                      {d.doctorProfile?.averageRating ? (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          {d.doctorProfile.averageRating.toFixed(1)}
                          <span className="text-muted-foreground font-normal">({d.doctorProfile.totalReviews})</span>
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 font-medium">{d._count.appointments}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {d.isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Suspendu
                          </span>
                        )}
                        {d.doctorProfile?.isVerified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                            <ShieldCheck className="h-3 w-3" /> Vérifié
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                            <Clock className="h-3 w-3" /> Non vérifié
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        {canWrite && (d.isActive ? (
                          <button onClick={() => handleToggle(d.id, true)} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                            <UserX className="h-3.5 w-3.5" /> Suspendre
                          </button>
                        ) : (
                          <button onClick={() => handleToggle(d.id, false)} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50">
                            <UserCheck className="h-3.5 w-3.5" /> Activer
                          </button>
                        ))}
                        <Link href={`/doctors/${d.id}`} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10">Détail</Link>
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
        </>
      )}
    </div>
  );
}
