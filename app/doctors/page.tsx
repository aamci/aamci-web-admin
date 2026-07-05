'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Search, UserCheck, UserX, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useAuth } from '@/app/_providers/AuthProvider';

const WRITE_ROLES = ['ADMIN', 'ADMIN_WRITE'];

interface Doctor {
  id: string;
  email: string;
  fullName: string | null;
  isActive: boolean;
  createdAt: string;
  doctorProfile: { specialty: string | null; city: string | null; averageRating: number | null; totalReviews: number } | null;
  _count: { appointments: number };
}

interface DoctorsResponse {
  doctors: Doctor[];
  total: number;
  page: number;
  limit: number;
}

export default function DoctorsPage() {
  const { user: me } = useAuth();
  const canWrite = WRITE_ROLES.includes(me?.role ?? '');

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const limit = 20;

  const fetchDoctors = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit), ...(search ? { search } : {}) });
    apiFetch<DoctorsResponse>(`/admin/doctors?${params}`)
      .then((res) => { setDoctors(res.doctors); setTotal(res.total); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await apiFetch(`/admin/users/${id}/${isActive ? 'suspend' : 'activate'}`, { method: 'POST' });
      fetchDoctors();
    } catch (e) {
      alert('Erreur : ' + (e as Error).message);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Médecins</h1>
        <p className="text-sm text-muted-foreground">{total} médecins au total</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className="input pl-9"
          placeholder="Rechercher…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

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
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Chargement…</td></tr>
            ) : doctors.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Aucun médecin trouvé</td></tr>
            ) : (
              doctors.map((d) => (
                <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div>
                      <Link href={`/doctors/${d.id}`} className="font-medium hover:text-primary hover:underline">
                        {d.fullName ?? '—'}
                      </Link>
                      <p className="text-xs text-muted-foreground">{d.email}</p>
                    </div>
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
                    {d.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Suspendu
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {canWrite && (
                        d.isActive ? (
                          <button onClick={() => handleToggle(d.id, true)}
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                            <UserX className="h-3.5 w-3.5" /> Suspendre
                          </button>
                        ) : (
                          <button onClick={() => handleToggle(d.id, false)}
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50">
                            <UserCheck className="h-3.5 w-3.5" /> Activer
                          </button>
                        )
                      )}
                      <Link href={`/doctors/${d.id}`} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10">
                        Détail
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} sur {totalPages} — {total} résultats</p>
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
