'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { ArrowLeft, UserCheck, UserX, Save } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/app/_providers/AuthProvider';

const WRITE_ROLES = ['ADMIN', 'ADMIN_WRITE'];

interface UserDetail {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  isActive: boolean;
  phone: string | null;
  city: string | null;
  sex: string | null;
  birthdate: string | null;
  createdAt: string;
  doctorProfile?: {
    specialty: string | null;
    city: string | null;
    presentation: string | null;
  } | null;
  _count?: {
    appointments: number;
  };
}

const ROLES = ['PATIENT', 'DOCTOR', 'PHARMACY', 'HOSPITAL', 'ADMIN', 'FACILITY_MANAGER', 'ADMIN_READ', 'ADMIN_WRITE', 'GUEST'];

export default function UserDetailPage() {
  const { user: me } = useAuth();
  const canWrite = WRITE_ROLES.includes(me?.role ?? '');
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    apiFetch<UserDetail>(`/admin/users/${id}`)
      .then((u) => {
        setUser(u);
        setFullName(u.fullName ?? '');
        setRole(u.role);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await apiFetch(`/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ fullName: fullName || null, role }),
      });
      setSuccess('Modifications enregistrées.');
      setUser((prev) => prev ? { ...prev, fullName: fullName || null, role } : prev);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!user) return;
    const action = user.isActive ? 'suspend' : 'activate';
    try {
      await apiFetch(`/admin/users/${id}/${action}`, { method: 'POST' });
      setUser((prev) => prev ? { ...prev, isActive: !prev.isActive } : prev);
      setSuccess(`Utilisateur ${action === 'suspend' ? 'suspendu' : 'activé'}.`);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
        {error || 'Utilisateur introuvable'}
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/users"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted/60"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{user.fullName ?? user.email}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>
      )}

      {/* Info card */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
        <h2 className="font-semibold">Informations</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Inscrit le</p>
            <p className="text-sm font-medium">
              {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Téléphone</p>
            <p className="text-sm font-medium">{user.phone ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Ville</p>
            <p className="text-sm font-medium">{user.city ?? '—'}</p>
          </div>
          {user.doctorProfile && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Spécialité</p>
              <p className="text-sm font-medium">{user.doctorProfile.specialty ?? '—'}</p>
            </div>
          )}
          {user._count !== undefined && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Rendez-vous</p>
              <p className="text-sm font-medium">{user._count.appointments}</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit card */}
      {canWrite && <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
        <h2 className="font-semibold">Modifier</h2>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nom complet</label>
            <input
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nom complet"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Rôle</label>
            <select
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>

          <button
            onClick={handleToggleActive}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              user.isActive
                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            {user.isActive ? (
              <><UserX className="h-4 w-4" />Suspendre</>
            ) : (
              <><UserCheck className="h-4 w-4" />Activer</>
            )}
          </button>
        </div>
      </div>}
    </div>
  );
}
