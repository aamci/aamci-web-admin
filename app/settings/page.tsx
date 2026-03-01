'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Save } from 'lucide-react';
import { useAuth } from '@/app/_providers/AuthProvider';

const WRITE_ROLES = ['ADMIN', 'ADMIN_WRITE'];

interface Setting {
  key: string;
  value: string;
  label: string | null;
  updatedAt: string;
}

export default function SettingsPage() {
  const { user: me } = useAuth();
  const canWrite = WRITE_ROLES.includes(me?.role ?? '');

  const [settings, setSettings] = useState<Setting[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<Setting[]>('/admin/settings')
      .then((res) => {
        setSettings(res);
        const map: Record<string, string> = {};
        res.forEach((s) => { map[s.key] = s.value; });
        setEdits(map);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (key: string) => {
    setSaving((p) => ({ ...p, [key]: true }));
    try {
      await apiFetch(`/admin/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value: edits[key] }) });
      setSaved((p) => ({ ...p, [key]: true }));
      setTimeout(() => setSaved((p) => ({ ...p, [key]: false })), 2000);
    } catch (e) {
      alert('Erreur : ' + (e as Error).message);
    } finally {
      setSaving((p) => ({ ...p, [key]: false }));
    }
  };

  if (loading) return <div className="py-12 text-center text-muted-foreground">Chargement…</div>;
  if (error) return <div className="rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-sm text-muted-foreground">Configuration de la plateforme</p>
      </div>

      <div className="rounded-2xl border border-border bg-card divide-y divide-border">
        {settings.map((s) => {
          const isBool = s.value === 'true' || s.value === 'false';
          const isDirty = edits[s.key] !== s.value;
          return (
            <div key={s.key} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{s.label ?? s.key}</p>
                <p className="text-xs text-muted-foreground font-mono">{s.key}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mis à jour : {new Date(s.updatedAt).toLocaleString('fr-FR')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isBool ? (
                  <select
                    disabled={!canWrite}
                    className="input w-28"
                    value={edits[s.key] ?? s.value}
                    onChange={(e) => setEdits((p) => ({ ...p, [s.key]: e.target.value }))}
                  >
                    <option value="true">Activé</option>
                    <option value="false">Désactivé</option>
                  </select>
                ) : (
                  <input
                    disabled={!canWrite}
                    className="input w-52"
                    value={edits[s.key] ?? s.value}
                    onChange={(e) => setEdits((p) => ({ ...p, [s.key]: e.target.value }))}
                  />
                )}
                {canWrite && (
                  <button
                    onClick={() => handleSave(s.key)}
                    disabled={saving[s.key] || !isDirty}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                      ${saved[s.key]
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40'
                      }`}
                  >
                    <Save className="h-3.5 w-3.5" />
                    {saved[s.key] ? 'Enregistré ✓' : saving[s.key] ? '…' : 'Sauvegarder'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!canWrite && (
        <p className="text-sm text-muted-foreground italic">
          Lecture seule — droits ADMIN_WRITE requis pour modifier les paramètres.
        </p>
      )}
    </div>
  );
}
