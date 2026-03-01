'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Search, UserCheck, UserX, ChevronLeft, ChevronRight, UserPlus, X } from 'lucide-react';
import { useAuth } from '@/app/_providers/AuthProvider';

interface User {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

const ALL_ROLES = ['PATIENT', 'DOCTOR', 'PHARMACY', 'HOSPITAL', 'ADMIN', 'FACILITY_MANAGER', 'ADMIN_READ', 'ADMIN_WRITE', 'GUEST'];
const FILTER_ROLES = ['', ...ALL_ROLES];

const WRITE_ROLES = ['ADMIN', 'ADMIN_WRITE'];

export default function UsersPage() {
  const { user: me } = useAuth();
  const canWrite = WRITE_ROLES.includes(me?.role ?? '');

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create user modal state
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState('ADMIN_READ');

  const limit = 20;

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(search ? { search } : {}),
      ...(role ? { role } : {}),
    });

    apiFetch<UsersResponse>(`/admin/users?${params}`)
      .then((res) => {
        setUsers(res.users);
        setTotal(res.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, search, role]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAction = async (id: string, action: 'suspend' | 'activate') => {
    try {
      await apiFetch(`/admin/users/${id}/${action}`, { method: 'POST' });
      fetchUsers();
    } catch (err) {
      alert('Erreur : ' + (err as Error).message);
    }
  };

  const handleCreate = async () => {
    if (!newEmail || !newPassword) {
      setCreateError('Email et mot de passe requis.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      await apiFetch('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          role: newRole,
          fullName: newFullName || undefined,
        }),
      });
      setShowCreate(false);
      setNewEmail('');
      setNewPassword('');
      setNewFullName('');
      setNewRole('ADMIN_READ');
      fetchUsers();
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const roleBadgeColor: Record<string, string> = {
    ADMIN: 'bg-violet-100 text-violet-700',
    ADMIN_WRITE: 'bg-violet-50 text-violet-600',
    ADMIN_READ: 'bg-indigo-50 text-indigo-600',
    GUEST: 'bg-gray-100 text-gray-600',
    DOCTOR: 'bg-blue-100 text-blue-700',
    PATIENT: 'bg-emerald-100 text-emerald-700',
    PHARMACY: 'bg-orange-100 text-orange-700',
    HOSPITAL: 'bg-pink-100 text-pink-700',
    FACILITY_MANAGER: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground">{total} utilisateurs au total</p>
        </div>
        {canWrite && (
          <button
            onClick={() => { setShowCreate(true); setCreateError(''); }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <UserPlus className="h-4 w-4" />
            Créer un utilisateur
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="input pl-9"
            placeholder="Rechercher par nom ou email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="input w-48"
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
        >
          {FILTER_ROLES.map((r) => (
            <option key={r} value={r}>{r || 'Tous les rôles'}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nom</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rôle</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Inscrit</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                  Chargement…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                  Aucun utilisateur trouvé
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/users/${u.id}`} className="hover:text-primary hover:underline">
                      {u.fullName ?? '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeColor[u.role] ?? 'bg-gray-100 text-gray-700'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        Suspendu
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {canWrite && (
                        u.isActive ? (
                          <button
                            onClick={() => handleAction(u.id, 'suspend')}
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                            title="Suspendre"
                          >
                            <UserX className="h-3.5 w-3.5" />
                            Suspendre
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAction(u.id, 'activate')}
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Activer"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            Activer
                          </button>
                        )
                      )}
                      <Link
                        href={`/users/${u.id}`}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                      >
                        Détails
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} sur {totalPages} — {total} résultats
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted/60 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted/60 disabled:opacity-40"
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Créer un utilisateur</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-lg p-1.5 hover:bg-muted/60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {createError && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{createError}</div>
            )}

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nom complet</label>
                <input
                  className="input"
                  placeholder="Optionnel"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email <span className="text-destructive">*</span></label>
                <input
                  className="input"
                  type="email"
                  placeholder="email@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Mot de passe <span className="text-destructive">*</span></label>
                <input
                  className="input"
                  type="password"
                  placeholder="Min. 6 caractères"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Rôle</label>
                <select
                  className="input"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  ADMIN_READ : lecture seule · ADMIN_WRITE : lecture + écriture · GUEST : tableau de bord uniquement
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted/60"
              >
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <UserPlus className="h-4 w-4" />
                {creating ? 'Création…' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
