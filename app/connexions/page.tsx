'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Search, Shield, Clock, Monitor } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface AuthLog {
  id: string;
  email: string;
  success: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  reason: string | null;
  createdAt: string;
  user: { id: string; fullName: string | null; role: string } | null;
}

interface AuthLogsResponse {
  logs: AuthLog[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const REASON_LABELS: Record<string, string> = {
  SUCCESS: 'Succès',
  '2FA_PENDING': '2FA requis',
  INVALID_PASSWORD: 'Mot de passe incorrect',
  USER_NOT_FOUND: 'Utilisateur inconnu',
  EMAIL_NOT_VERIFIED: 'Email non vérifié',
  ACCOUNT_SCHEDULED_DELETION: 'Compte en suppression',
  SOCIAL_LOGIN_ONLY: 'Compte OAuth',
};

const REASON_COLOR: Record<string, string> = {
  SUCCESS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '2FA_PENDING': 'bg-blue-50 text-blue-700 border-blue-200',
  INVALID_PASSWORD: 'bg-red-50 text-red-700 border-red-200',
  USER_NOT_FOUND: 'bg-orange-50 text-orange-700 border-orange-200',
  EMAIL_NOT_VERIFIED: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  ACCOUNT_SCHEDULED_DELETION: 'bg-red-50 text-red-800 border-red-200',
  SOCIAL_LOGIN_ONLY: 'bg-purple-50 text-purple-700 border-purple-200',
};

function parseUA(ua: string | null) {
  if (!ua) return '—';
  if (/mobile/i.test(ua)) return 'Mobile';
  if (/android/i.test(ua)) return 'Android';
  if (/iphone|ipad/i.test(ua)) return 'iOS';
  if (/chrome/i.test(ua)) return 'Chrome';
  if (/firefox/i.test(ua)) return 'Firefox';
  if (/safari/i.test(ua)) return 'Safari';
  return 'Navigateur';
}

export default function ConnexionsPage() {
  const [logs, setLogs] = useState<AuthLog[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'success' | 'failure'>('all');
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '50' });
      if (search) params.set('search', search);
      if (filter === 'success') params.set('success', 'true');
      if (filter === 'failure') params.set('success', 'false');
      const res = await apiFetch<AuthLogsResponse>(`/admin/auth-logs?${params}`);
      setLogs(res.logs);
      setTotal(res.total);
      setPages(res.pages);
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  useEffect(() => { setPage(1); fetchLogs(1); }, [search, filter]);
  useEffect(() => { fetchLogs(page); }, [page]);

  const successCount = logs.filter(l => l.success).length;
  const failCount = logs.filter(l => !l.success).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Historique des connexions</h1>
        <p className="text-sm text-muted-foreground mt-1">{total} tentatives enregistrées</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg"><Shield className="h-5 w-5 text-muted-foreground" /></div>
          <div>
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground">Tentatives totales</p>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg"><CheckCircle className="h-5 w-5 text-emerald-600" /></div>
          <div>
            <p className="text-2xl font-bold text-emerald-600">{successCount}</p>
            <p className="text-xs text-muted-foreground">Réussies (page courante)</p>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-red-50 rounded-lg"><XCircle className="h-5 w-5 text-red-600" /></div>
          <div>
            <p className="text-2xl font-bold text-red-600">{failCount}</p>
            <p className="text-xs text-muted-foreground">Échouées (page courante)</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par email..."
            className="pl-9"
            value={search}
            onChange={e => { setSearch(e.target.value); }}
          />
        </div>
        <div className="flex gap-1 border rounded-lg p-1 bg-muted/30">
          {(['all', 'success', 'failure'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === f ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f === 'all' ? 'Toutes' : f === 'success' ? 'Réussies' : 'Échouées'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground w-10"></th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Utilisateur</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Résultat</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">IP</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Client</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">Chargement…</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">Aucune connexion enregistrée</td></tr>
            ) : logs.map(log => (
              <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3">
                  {log.success
                    ? <CheckCircle className="h-4 w-4 text-emerald-500" />
                    : <XCircle className="h-4 w-4 text-red-500" />}
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    {new Date(log.createdAt).toLocaleString('fr-FR', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit',
                    })}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{log.user?.fullName ?? log.email}</p>
                  <p className="text-xs text-muted-foreground">{log.email}</p>
                  {log.user && <Badge variant="outline" className="text-xs mt-0.5">{log.user.role}</Badge>}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    REASON_COLOR[log.reason ?? ''] ?? 'bg-gray-100 text-gray-700 border-gray-200'
                  }`}>
                    {REASON_LABELS[log.reason ?? ''] ?? log.reason ?? '—'}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {log.ipAddress ?? '—'}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Monitor className="h-3 w-3" />
                    {parseUA(log.userAgent)}
                  </div>
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
  );
}
