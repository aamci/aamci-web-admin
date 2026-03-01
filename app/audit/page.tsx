'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  targetId: string | null;
  targetType: string | null;
  metadata: any;
  createdAt: string;
  admin: { id: string; fullName: string | null; email: string; role: string };
}

interface AuditResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

const ACTIONS = [
  '', 'CREATE_USER', 'UPDATE_SETTING', 'SUSPEND_USER', 'ACTIVATE_USER',
  'CANCEL_APPOINTMENT', 'UPDATE_USER',
];

const actionColor: Record<string, string> = {
  CREATE_USER: 'bg-emerald-50 text-emerald-700',
  UPDATE_SETTING: 'bg-blue-50 text-blue-700',
  CANCEL_APPOINTMENT: 'bg-red-50 text-red-700',
  SUSPEND_USER: 'bg-orange-50 text-orange-700',
  ACTIVATE_USER: 'bg-teal-50 text-teal-700',
  UPDATE_USER: 'bg-indigo-50 text-indigo-700',
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const limit = 30;

  const fetchLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit), ...(action ? { action } : {}) });
    apiFetch<AuditResponse>(`/admin/audit?${params}`)
      .then((res) => { setLogs(res.logs); setTotal(res.total); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, action]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Journal d'audit</h1>
        <p className="text-sm text-muted-foreground">{total} actions enregistrées</p>
      </div>

      <div>
        <select className="input w-56" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
          {ACTIONS.map((a) => <option key={a} value={a}>{a || 'Toutes les actions'}</option>)}
        </select>
      </div>

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Administrateur</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cible</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Détails</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">Chargement…</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">Aucune action enregistrée</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{log.admin.fullName ?? log.admin.email}</p>
                      <p className="text-xs text-muted-foreground">{log.admin.role}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${actionColor[log.action] ?? 'bg-gray-100 text-gray-700'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    {log.targetType && <span className="mr-1 text-foreground font-medium">[{log.targetType}]</span>}
                    {log.targetId ? log.targetId.slice(0, 12) + '…' : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-xs">
                    {log.metadata ? (
                      <code className="block truncate">{JSON.stringify(log.metadata)}</code>
                    ) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} sur {totalPages} — {total} résultats</p>
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
