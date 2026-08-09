'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { FileQuestion, Search, ChevronLeft, ChevronRight, Check, X, RefreshCw } from 'lucide-react';
import { useAuth } from '@/app/_providers/AuthProvider';

interface Doctor { id: string; user: { id: string; fullName: string | null; email: string } }

interface Questionnaire {
  id: string;
  title: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  doctor: Doctor;
  _count: { questions: number; responses: number };
}

interface QuestionnairesResponse {
  questionnaires: Questionnaire[];
  total: number; page: number; limit: number; pages: number;
}

const WRITE_ROLES = ['ADMIN', 'ADMIN_WRITE'];

export default function QuestionnairesPage() {
  const { user: me } = useAuth();
  const canWrite = WRITE_ROLES.includes(me?.role ?? '');

  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [toggling, setToggling] = useState<string | null>(null);

  const limit = 20;

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    if (filter === 'active')   params.set('isActive', 'true');
    if (filter === 'inactive') params.set('isActive', 'false');
    apiFetch<QuestionnairesResponse>(`/admin/questionnaires?${params}`)
      .then(r => { setQuestionnaires(r.questionnaires); setTotal(r.total); setPages(r.pages); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, search, filter]);

  useEffect(() => { load(); }, [load]);

  async function toggle(q: Questionnaire) {
    setToggling(q.id);
    try {
      await apiFetch(`/admin/questionnaires/${q.id}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !q.isActive }),
      });
      setQuestionnaires(prev => prev.map(x => x.id === q.id ? { ...x, isActive: !q.isActive } : x));
    } catch (e: any) { setError(e.message); }
    finally { setToggling(null); }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileQuestion className="h-6 w-6 text-amber-600" />
          Questionnaires pré-RDV
        </h1>
        <p className="text-sm text-muted-foreground">{total} questionnaire(s) au total</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher par titre ou médecin…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map(f => {
            const labels = { all: 'Tous', active: 'Actifs', inactive: 'Inactifs' };
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
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/60 disabled:opacity-40">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Questionnaire</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Médecin</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Questions</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Réponses</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Créé le</th>
              {canWrite && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Chargement…</td></tr>
            ) : questionnaires.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Aucun questionnaire</td></tr>
            ) : questionnaires.map(q => (
              <tr key={q.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3">
                  <div className="font-medium">{q.title}</div>
                  {q.description && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{q.description}</div>}
                </td>
                <td className="px-4 py-3">
                  <div>{q.doctor?.user?.fullName ?? '—'}</div>
                  <div className="text-xs text-muted-foreground">{q.doctor?.user?.email}</div>
                </td>
                <td className="px-4 py-3 font-medium text-center">{q._count.questions}</td>
                <td className="px-4 py-3 font-medium text-center">{q._count.responses}</td>
                <td className="px-4 py-3">
                  {q.isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Actif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Inactif
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(q.createdAt).toLocaleDateString('fr-FR')}
                </td>
                {canWrite && (
                  <td className="px-4 py-3">
                    <button
                      disabled={toggling === q.id}
                      onClick={() => toggle(q)}
                      title={q.isActive ? 'Désactiver' : 'Activer'}
                      className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                        q.isActive
                          ? 'text-muted-foreground hover:text-amber-600 hover:bg-amber-50'
                          : 'text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {q.isActive ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                    </button>
                  </td>
                )}
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
