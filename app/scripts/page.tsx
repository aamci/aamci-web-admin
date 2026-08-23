'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Play, CheckCircle, XCircle, Loader2, AlertTriangle, Database, Trash2, ShieldOff, BarChart2, FileSearch } from 'lucide-react';

interface Script {
  name: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  danger: boolean;
  confirm: string;
}

const SCRIPTS: Script[] = [
  {
    name: 'db-health',
    label: 'Vérification base de données',
    description: 'Retourne les compteurs principaux (utilisateurs, rendez-vous, transactions) et vérifie la connexion à la base.',
    icon: <Database className="h-5 w-5" />,
    danger: false,
    confirm: '',
  },
  {
    name: 'count-auth-logs',
    label: 'Statistiques de connexions',
    description: 'Comptabilise les tentatives de connexion (total, échecs, dernières 24h).',
    icon: <BarChart2 className="h-5 w-5" />,
    danger: false,
    confirm: '',
  },
  {
    name: 'reset-failed-logins',
    label: 'Réinitialiser les tentatives 2FA échouées',
    description: 'Déverrouille tous les comptes bloqués par trop de tentatives 2FA et remet le compteur à zéro.',
    icon: <ShieldOff className="h-5 w-5" />,
    danger: false,
    confirm: '',
  },
  {
    name: 'purge-old-data',
    label: 'Purger les anciens logs',
    description: 'Supprime les logs de connexion et d\'audit antérieurs à 30 jours pour libérer de l\'espace.',
    icon: <Trash2 className="h-5 w-5" />,
    danger: true,
    confirm: 'Supprimer définitivement les logs de plus de 30 jours ?',
  },
  {
    name: 'clear-unverified-accounts',
    label: 'Supprimer les comptes non vérifiés',
    description: 'Supprime les comptes dont l\'email n\'a jamais été vérifié après 7 jours (inscriptions abandonnées).',
    icon: <FileSearch className="h-5 w-5" />,
    danger: true,
    confirm: 'Supprimer définitivement les comptes non vérifiés depuis plus de 7 jours ?',
  },
];

interface RunResult {
  success: boolean;
  result: any;
  error?: string;
}

export default function ScriptsPage() {
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, RunResult>>({});

  const run = async (script: Script) => {
    if (script.danger && script.confirm) {
      if (!confirm(script.confirm)) return;
    }

    setRunning(script.name);
    try {
      const res = await apiFetch<{ success: boolean; script: string; result: any }>(
        `/admin/scripts/${script.name}`,
        { method: 'POST' },
      );
      setResults(prev => ({ ...prev, [script.name]: { success: true, result: res.result } }));
    } catch (e: any) {
      setResults(prev => ({ ...prev, [script.name]: { success: false, result: null, error: e.message ?? 'Erreur inconnue' } }));
    } finally {
      setRunning(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Scripts de maintenance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Exécutez des opérations de maintenance prédéfinies sur la plateforme.
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 flex gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Ces opérations agissent directement sur la base de données.
          Les actions marquées en rouge sont irréversibles — une confirmation est demandée avant exécution.
        </p>
      </div>

      <div className="grid gap-4">
        {SCRIPTS.map(script => {
          const result = results[script.name];
          const isRunning = running === script.name;

          return (
            <div
              key={script.name}
              className={`rounded-xl border bg-card p-5 ${
                script.danger ? 'border-red-200 dark:border-red-900' : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    script.danger ? 'bg-red-50 text-red-600 dark:bg-red-950' : 'bg-muted text-muted-foreground'
                  }`}>
                    {script.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{script.label}</h3>
                      {script.danger && (
                        <span className="text-xs bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
                          Irréversible
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{script.description}</p>
                    <code className="text-xs text-muted-foreground font-mono mt-1 block">{script.name}</code>
                  </div>
                </div>

                <button
                  onClick={() => run(script)}
                  disabled={isRunning || running !== null}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 disabled:opacity-50 ${
                    script.danger
                      ? 'bg-red-600 hover:bg-red-700 text-white disabled:cursor-not-allowed'
                      : 'bg-primary hover:bg-primary/90 text-primary-foreground disabled:cursor-not-allowed'
                  }`}
                >
                  {isRunning ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Exécution…</>
                  ) : (
                    <><Play className="h-4 w-4" /> Exécuter</>
                  )}
                </button>
              </div>

              {result && (
                <div className={`mt-4 rounded-lg p-3 font-mono text-xs ${
                  result.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {result.success
                      ? <CheckCircle className="h-4 w-4 text-emerald-600" />
                      : <XCircle className="h-4 w-4 text-red-600" />}
                    <span className={`font-semibold ${result.success ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                      {result.success ? 'Succès' : 'Erreur'}
                    </span>
                  </div>
                  {result.error ? (
                    <p className="text-red-600 dark:text-red-400">{result.error}</p>
                  ) : (
                    <pre className="whitespace-pre-wrap text-foreground">
                      {JSON.stringify(result.result, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
