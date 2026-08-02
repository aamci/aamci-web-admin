'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { Star, Search, Check, X, Trash2, Flag, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

interface ReviewPatient { id: string; fullName: string | null; email: string; avatarUrl?: string | null }
interface ReviewDoctor  { id: string; user: { fullName: string | null; email: string } }

interface Review {
  id: string;
  overallRating: number;
  punctualityRating?: number | null;
  communicationRating?: number | null;
  professionalismRating?: number | null;
  title?: string | null;
  comment?: string | null;
  isApproved: boolean;
  isReported: boolean;
  isVerified: boolean;
  reportCount: number;
  createdAt: string;
  patient: ReviewPatient;
  doctor: ReviewDoctor;
}

interface ReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const WRITE_ROLES = ['ADMIN', 'ADMIN_WRITE'];

function Stars({ n, max = 5 }: { n: number; max?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < n ? 'fill-amber-400 text-amber-400' : 'text-border'}`} />
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews]       = useState<Review[]>([]);
  const [total, setTotal]           = useState(0);
  const [pages, setPages]           = useState(1);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState<'all' | 'pending' | 'reported'>('pending');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [actionId, setActionId]     = useState<string | null>(null);
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [canWrite]                  = useState(() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return WRITE_ROLES.includes(payload.role);
    } catch { return false; }
  });

  const limit = 20;

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    if (filter === 'pending')  params.set('isApproved', 'false');
    if (filter === 'reported') params.set('isReported', 'true');

    apiFetch<ReviewsResponse>(`/admin/reviews?${params}`)
      .then(r => { setReviews(r.reviews); setTotal(r.total); setPages(r.pages); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, search, filter]);

  useEffect(() => { load(); }, [load]);

  async function moderate(id: string, data: { isApproved?: boolean; isReported?: boolean }) {
    setActionId(id);
    try {
      await apiFetch(`/admin/reviews/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
      setReviews(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    } catch (e: any) { setError(e.message); }
    finally { setActionId(null); }
  }

  async function remove(id: string) {
    if (!confirm('Supprimer définitivement cet avis ?')) return;
    setActionId(id);
    try {
      await apiFetch(`/admin/reviews/${id}`, { method: 'DELETE' });
      setReviews(prev => prev.filter(r => r.id !== id));
      setTotal(t => t - 1);
    } catch (e: any) { setError(e.message); }
    finally { setActionId(null); }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Modération des avis</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{total} avis au total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher par patient, médecin ou commentaire…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'reported'] as const).map(f => {
            const labels = { all: 'Tous', pending: 'En attente', reported: 'Signalés' };
            return (
              <button
                key={f}
                onClick={() => { setFilter(f); setPage(1); }}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${filter === f ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted/60'}`}
              >
                {labels[f]}
              </button>
            );
          })}
        </div>
      </div>

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Patient</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Médecin</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Note</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={6} className="py-16 text-center text-muted-foreground">Chargement…</td></tr>
            ) : reviews.length === 0 ? (
              <tr><td colSpan={6} className="py-16 text-center text-muted-foreground">Aucun avis</td></tr>
            ) : reviews.map(r => (
              <>
                <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.patient.fullName || '—'}</div>
                    <div className="text-xs text-muted-foreground">{r.patient.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.doctor.user.fullName || '—'}</div>
                    <div className="text-xs text-muted-foreground">{r.doctor.user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Stars n={r.overallRating} />
                    {r.isVerified && <span className="ml-1 text-[10px] text-emerald-600 font-medium">vérifié</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.isApproved
                        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700"><Check className="h-3 w-3" />Approuvé</span>
                        : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-50 text-amber-700">En attente</span>
                      }
                      {r.isReported && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-700"><Flag className="h-3 w-3" />Signalé ({r.reportCount})</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        title="Voir le commentaire"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {canWrite && (
                        <>
                          {!r.isApproved && (
                            <button
                              disabled={actionId === r.id}
                              onClick={() => moderate(r.id, { isApproved: true })}
                              className="p-1.5 rounded-lg hover:bg-emerald-50 transition-colors text-muted-foreground hover:text-emerald-700"
                              title="Approuver"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          {r.isApproved && (
                            <button
                              disabled={actionId === r.id}
                              onClick={() => moderate(r.id, { isApproved: false })}
                              className="p-1.5 rounded-lg hover:bg-amber-50 transition-colors text-muted-foreground hover:text-amber-700"
                              title="Désapprouver"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            disabled={actionId === r.id}
                            onClick={() => remove(r.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-600"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                {expanded === r.id && (
                  <tr key={`${r.id}-expanded`} className="bg-muted/10">
                    <td colSpan={6} className="px-6 py-4">
                      {r.title && <p className="font-medium mb-1">{r.title}</p>}
                      <p className="text-sm text-muted-foreground">{r.comment || <em>Aucun commentaire</em>}</p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        {r.punctualityRating && <span>Ponctualité : {r.punctualityRating}/5</span>}
                        {r.communicationRating && <span>Communication : {r.communicationRating}/5</span>}
                        {r.professionalismRating && <span>Professionnalisme : {r.professionalismRating}/5</span>}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{(page - 1) * limit + 1}–{Math.min(page * limit, total)} sur {total}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= pages} className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
