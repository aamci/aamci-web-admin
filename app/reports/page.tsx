'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import {
  Flag, ChevronLeft, ChevronRight, Check, X,
  Clock, AlertTriangle, CheckCircle, XCircle, User, Eye,
} from 'lucide-react';

const STATUSES = ['PENDING', 'REVIEWED', 'DISMISSED', 'ACTION_TAKEN'] as const;

const statusLabel: Record<string, string> = {
  PENDING:      'En attente',
  REVIEWED:     'Examiné',
  DISMISSED:    'Classé sans suite',
  ACTION_TAKEN: 'Mesure prise',
};
const statusColor: Record<string, string> = {
  PENDING:      'bg-amber-100 text-amber-700',
  REVIEWED:     'bg-blue-100 text-blue-700',
  DISMISSED:    'bg-gray-100 text-gray-600',
  ACTION_TAKEN: 'bg-emerald-100 text-emerald-700',
};

const reasonLabel: Record<string, string> = {
  INAPPROPRIATE_CONTENT:   'Contenu inapproprié',
  HARASSMENT:              'Harcèlement',
  SPAM:                    'Spam',
  FAKE_PROFILE:            'Faux profil',
  UNPROFESSIONAL_CONDUCT:  'Comportement non professionnel',
  OTHER:                   'Autre',
};

const typeLabel: Record<string, string> = {
  USER:         'Utilisateur',
  CONVERSATION: 'Conversation',
  MESSAGE:      'Message',
};

interface Report {
  id: string;
  type: string;
  reason: string;
  details?: string;
  status: string;
  conversationId?: string;
  createdAt: string;
  resolvedAt?: string;
  reporter: { id: string; fullName: string; email: string; role: string };
  target:   { id: string; fullName: string; email: string; role: string };
}

export default function ReportsPage() {
  const [reports, setReports]       = useState<Report[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('');
  const [page, setPage]             = useState(1);
  const [total, setTotal]           = useState(0);
  const [pages, setPages]           = useState(1);
  const [selected, setSelected]     = useState<Report | null>(null);
  const [updating, setUpdating]     = useState<string | null>(null);
  const LIMIT = 20;

  async function load(p = page, s = filter) {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
      if (s) q.set('status', s);
      const data = await apiFetch<{ reports: Report[]; total: number; pages: number }>(`/admin/reports?${q}`);
      setReports(data.reports || []);
      setTotal(data.total  || 0);
      setPages(data.pages  || 1);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function applyFilter(s: string) { setFilter(s); setPage(1); load(1, s); }
  function goPage(p: number)       { setPage(p);  load(p, filter); }

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    try {
      await apiFetch(`/admin/reports/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setReports(prev => prev.map(r => r.id === id ? { ...r, status, resolvedAt: new Date().toISOString() } : r));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
    } finally {
      setUpdating(null);
    }
  }

  const pending = reports.filter(r => r.status === 'PENDING').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
            <Flag className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Signalements</h1>
            <p className="text-sm text-gray-500">{total} signalement{total > 1 ? 's' : ''} au total{pending > 0 ? ` — ${pending} en attente` : ''}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button
          onClick={() => applyFilter('')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!filter ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Tous
        </button>
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => applyFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {statusLabel[s]}
          </button>
        ))}
      </div>

      <div className="flex gap-5">
        {/* Table */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Chargement…</div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Flag className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Aucun signalement</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Signaleur</th>
                  <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cible</th>
                  <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Motif</th>
                  <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                  <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.map(r => (
                  <tr
                    key={r.id}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${selected?.id === r.id ? 'bg-orange-50' : ''}`}
                    onClick={() => setSelected(r)}
                  >
                    <td className="p-3">
                      <p className="font-medium text-gray-900 truncate max-w-[140px]">{r.reporter.fullName || r.reporter.email}</p>
                      <p className="text-xs text-gray-400">{r.reporter.role}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-medium text-gray-900 truncate max-w-[140px]">{r.target.fullName || r.target.email}</p>
                      <p className="text-xs text-gray-400">{r.target.role}</p>
                    </td>
                    <td className="p-3 text-gray-600">{reasonLabel[r.reason] || r.reason}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">{typeLabel[r.type] || r.type}</span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[r.status]}`}>
                        {r.status === 'PENDING' && <Clock className="w-3 h-3" />}
                        {r.status === 'ACTION_TAKEN' && <CheckCircle className="w-3 h-3" />}
                        {statusLabel[r.status] || r.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="p-3">
                      <Eye className="w-4 h-4 text-gray-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between p-3 border-t border-gray-100 bg-gray-50">
              <span className="text-xs text-gray-500">{total} résultats — page {page}/{pages}</span>
              <div className="flex gap-1">
                <button onClick={() => goPage(page - 1)} disabled={page <= 1}
                  className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <button onClick={() => goPage(page + 1)} disabled={page >= pages}
                  className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40">
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-80 bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-4 self-start sticky top-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Détail</h2>
              <button onClick={() => setSelected(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Signaleur</p>
                <p className="font-medium text-gray-900">{selected.reporter.fullName}</p>
                <p className="text-gray-400 text-xs">{selected.reporter.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Utilisateur signalé</p>
                <p className="font-medium text-gray-900">{selected.target.fullName}</p>
                <p className="text-gray-400 text-xs">{selected.target.email} · {selected.target.role}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Motif</p>
                <p className="text-gray-700">{reasonLabel[selected.reason] || selected.reason}</p>
              </div>
              {selected.details && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Détails</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{selected.details}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Type · Date</p>
                <p className="text-gray-600">{typeLabel[selected.type]} · {new Date(selected.createdAt).toLocaleString('fr-FR')}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs font-medium text-gray-500 mb-2">Changer le statut</p>
              <div className="flex flex-col gap-1.5">
                {STATUSES.filter(s => s !== selected.status).map(s => (
                  <button
                    key={s}
                    onClick={() => updateStatus(selected.id, s)}
                    disabled={updating === selected.id}
                    className={`px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors ${statusColor[s]} hover:opacity-80 disabled:opacity-50`}
                  >
                    {updating === selected.id ? 'Mise à jour…' : `→ ${statusLabel[s]}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
