'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { ShieldCheck, ShieldAlert, Key, CheckCircle2 } from 'lucide-react';

interface EncryptionStatus {
  keyPresent: boolean;
  coverage: Record<string, { string: string[]; json: string[] }>;
}

export default function EncryptionPage() {
  const [status, setStatus] = useState<EncryptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<EncryptionStatus>('/admin/encryption/status')
      .then(setStatus)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div>
    );
  }

  const totalModels = Object.keys(status?.coverage ?? {}).length;
  const totalFields = Object.values(status?.coverage ?? {}).reduce(
    (acc, { string, json }) => acc + string.length + json.length,
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Chiffrement</h1>
        <p className="text-sm text-muted-foreground">
          Statut du chiffrement AES-256-GCM des données sensibles
        </p>
      </div>

      {/* Status card */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${status?.keyPresent ? 'bg-emerald-50' : 'bg-red-50'}`}>
            {status?.keyPresent ? (
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-red-600" />
            )}
          </div>
          <p className={`text-lg font-bold ${status?.keyPresent ? 'text-emerald-700' : 'text-red-700'}`}>
            {status?.keyPresent ? 'Clé présente' : 'Clé absente'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {status?.keyPresent
              ? 'ENCRYPTION_KEY définie — chiffrement actif'
              : 'ENCRYPTION_KEY manquante — données non chiffrées'}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
            <Key className="h-5 w-5 text-violet-600" />
          </div>
          <p className="text-2xl font-bold">{totalModels}</p>
          <p className="text-sm text-muted-foreground">Modèles protégés</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold">{totalFields}</p>
          <p className="text-sm text-muted-foreground">Champs chiffrés</p>
        </div>
      </div>

      {/* Algorithm info */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-3 font-semibold">Algorithme</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Algorithme', value: 'AES-256-GCM' },
            { label: 'IV', value: '16 bytes' },
            { label: 'Tag', value: '128 bits' },
            { label: 'Format', value: 'iv:tag:data (base64)' },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-muted/40 px-3 py-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-0.5 text-sm font-medium font-mono">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Coverage by model */}
      <div className="space-y-3">
        <h2 className="font-semibold">Couverture par modèle</h2>
        {Object.entries(status?.coverage ?? {}).map(([model, { string: strFields, json: jsonFields }]) => (
          <div key={model} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h3 className="font-medium capitalize">{model}</h3>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {strFields.length + jsonFields.length} champs
              </span>
            </div>

            {strFields.length > 0 && (
              <div className="mb-2">
                <p className="mb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Champs texte
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {strFields.map((f) => (
                    <span key={f} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-700">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {jsonFields.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Champs JSON
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {jsonFields.map((f) => (
                    <span key={f} className="rounded-md bg-violet-50 px-2 py-0.5 text-xs font-mono text-violet-700">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Migration instructions */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="mb-2 font-semibold text-amber-900">Migration des données existantes</h2>
        <p className="mb-3 text-sm text-amber-800">
          Pour chiffrer les données déjà présentes en base, exécutez le script de migration :
        </p>
        <pre className="overflow-x-auto rounded-lg bg-amber-100 p-3 text-xs font-mono text-amber-900">
          {`ENCRYPTION_KEY=<votre_clé_base64> \\\n  npx ts-node -r tsconfig-paths/register \\\n  prisma/migrate-encrypt.ts`}
        </pre>
        <p className="mt-2 text-xs text-amber-700">
          Le script est idempotent — il ignore les champs déjà chiffrés.
        </p>
      </div>
    </div>
  );
}
