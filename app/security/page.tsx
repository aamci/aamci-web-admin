'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { KeyRound, Search, ShieldCheck, ShieldOff, ShieldAlert, Unlock, Ban, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TwoFactorAuth {
  isEnabled: boolean;
  lastUsedAt?: string | null;
  failedAttempts: number;
  lockedUntil?: string | null;
  createdAt: string;
}

interface UserWith2FA {
  id: string;
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  twoFactorAuth?: TwoFactorAuth | null;
}

interface Stats {
  total: number;
  enabled: number;
  locked: number;
  totalUsers: number;
  adoptionRate: number;
}

interface PaginatedResult {
  items: UserWith2FA[];
  total: number;
  page: number;
  totalPages: number;
}

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function isLocked(tfa?: TwoFactorAuth | null) {
  return !!tfa?.lockedUntil && new Date(tfa.lockedUntil) > new Date();
}

function StatusBadge({ tfa }: { tfa?: TwoFactorAuth | null }) {
  if (!tfa) return <Badge variant="secondary">Non configuré</Badge>;
  if (isLocked(tfa)) return <Badge className="bg-red-100 text-red-700">Verrouillé</Badge>;
  if (tfa.isEnabled) return <Badge className="bg-emerald-100 text-emerald-700">Actif</Badge>;
  return <Badge variant="secondary">Désactivé</Badge>;
}

export default function SecurityPage() {
  const [stats, setStats]       = useState<Stats | null>(null);
  const [data, setData]         = useState<PaginatedResult | null>(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState('all');
  const [page, setPage]         = useState(1);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    const res = await apiFetch<Stats>('/admin/2fa/stats');
    setStats(res);
  }, []);

  const loadUsers = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' });
      if (search)           params.set('search', search);
      if (status !== 'all') params.set('status', status);
      const res = await apiFetch<PaginatedResult>(`/admin/2fa/users?${params}`);
      setData(res);
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { setPage(1); loadUsers(1); }, [search, status]);
  useEffect(() => { loadUsers(page); }, [page]);

  const handleDisable = async (userId: string) => {
    if (!confirm('Désactiver la 2FA pour cet utilisateur ? Il devra la reconfigurer.')) return;
    setActionId(userId);
    try {
      await apiFetch(`/admin/users/${userId}/2fa/disable`, { method: 'POST' });
      await Promise.all([loadStats(), loadUsers(page)]);
    } finally {
      setActionId(null);
    }
  };

  const handleUnlock = async (userId: string) => {
    setActionId(userId);
    try {
      await apiFetch(`/admin/users/${userId}/2fa/unlock`, { method: 'POST' });
      await Promise.all([loadStats(), loadUsers(page)]);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Sécurité — Gestion 2FA</h1>
        <p className="text-muted-foreground text-sm mt-1">Gérez l'authentification à deux facteurs des utilisateurs</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">2FA configuré</p>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground mt-0.5">sur {stats.totalUsers} utilisateurs</p>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <p className="text-sm text-muted-foreground">Actifs</p>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{stats.enabled}</p>
            <p className="text-xs text-muted-foreground mt-0.5">2FA activée</p>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="h-4 w-4 text-red-500" />
              <p className="text-sm text-muted-foreground">Verrouillés</p>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.locked}</p>
            <p className="text-xs text-muted-foreground mt-0.5">trop de tentatives</p>
          </div>
          <div className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
              <p className="text-sm text-muted-foreground">Taux d'adoption</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.adoptionRate}%</p>
            <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${stats.adoptionRate}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher utilisateur..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Statut 2FA" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="enabled">Actifs</SelectItem>
            <SelectItem value="disabled">Désactivés</SelectItem>
            <SelectItem value="locked">Verrouillés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Utilisateur</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rôle</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Statut 2FA</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Dernière utilisation</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tentatives échouées</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Verrouillé jusqu'au</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">Chargement...</td></tr>
            ) : !data?.items.length ? (
              <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">Aucun utilisateur trouvé</td></tr>
            ) : data.items.map(u => (
              <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium">{u.fullName}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-xs">{u.role}</Badge>
                </td>
                <td className="px-4 py-3"><StatusBadge tfa={u.twoFactorAuth} /></td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(u.twoFactorAuth?.lastUsedAt)}</td>
                <td className="px-4 py-3">
                  {(u.twoFactorAuth?.failedAttempts ?? 0) > 0 ? (
                    <span className="text-red-600 font-medium">{u.twoFactorAuth?.failedAttempts}</span>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {isLocked(u.twoFactorAuth) ? (
                    <span className="text-red-600 font-medium">{formatDate(u.twoFactorAuth?.lockedUntil)}</span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 justify-end">
                    {isLocked(u.twoFactorAuth) && (
                      <Button
                        size="sm" variant="outline"
                        className="text-xs gap-1.5"
                        disabled={actionId === u.id}
                        onClick={() => handleUnlock(u.id)}
                      >
                        <Unlock className="h-3 w-3" /> Déverrouiller
                      </Button>
                    )}
                    {u.twoFactorAuth?.isEnabled && (
                      <Button
                        size="sm" variant="outline"
                        className="text-xs gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        disabled={actionId === u.id}
                        onClick={() => handleDisable(u.id)}
                      >
                        <Ban className="h-3 w-3" /> Désactiver
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>Page {data.page} / {data.totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
