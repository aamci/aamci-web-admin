'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { Search, ChevronLeft, ChevronRight, Building2, MapPin, Phone } from 'lucide-react';

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

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const limit = 20;

  const fetchFacilities = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit), ...(search ? { search } : {}) });
    apiFetch<FacilitiesResponse>(`/admin/facilities?${params}`)
      .then((res) => { setFacilities(res.facilities); setTotal(res.total); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { fetchFacilities(); }, [fetchFacilities]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Établissements</h1>
        <p className="text-sm text-muted-foreground">{total} établissements au total</p>
      </div>

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
            <div key={f.id} className="rounded-2xl border border-border bg-card p-5 space-y-3 hover:shadow-md transition-shadow">
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
            </div>
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
