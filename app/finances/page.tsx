'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import {
  Wallet, TrendingUp, ArrowDownLeft, Search, ChevronLeft, ChevronRight,
  Plus, CheckCircle2, XCircle, Clock, ArrowUpRight,
} from 'lucide-react';

interface DoctorWallet {
  id: string;
  fullName: string | null;
  email: string;
  isActive: boolean;
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
}

interface WalletResponse {
  wallets: DoctorWallet[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  grandTotal: { balance: number; totalEarned: number; totalWithdrawn: number };
}

interface Transaction {
  id: string;
  amount: string | number;
  type: string;
  status: string;
  provider: string;
  providerRef: string | null;
  description: string | null;
  createdAt: string;
}

interface DoctorWalletDetail {
  doctor: { id: string; fullName: string | null; email: string };
  summary: { balance: number; totalEarned: number; totalWithdrawn: number; pendingAmount: number };
  transactions: Transaction[];
}

const fmt = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' });

const typeColor: Record<string, string> = {
  PAYMENT: 'bg-emerald-100 text-emerald-700',
  PAYOUT: 'bg-violet-100 text-violet-700',
  REFUND: 'bg-orange-100 text-orange-700',
};
const statusColor: Record<string, string> = {
  SUCCESS: 'bg-emerald-50 text-emerald-700',
  PENDING: 'bg-amber-50 text-amber-700',
  FAILED: 'bg-red-50 text-red-700',
};
const statusIcon: Record<string, React.ReactNode> = {
  SUCCESS: <CheckCircle2 className="h-3 w-3" />,
  PENDING: <Clock className="h-3 w-3" />,
  FAILED: <XCircle className="h-3 w-3" />,
};

export default function FinancesPage() {
  const [data, setData] = useState<WalletResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Doctor detail drawer
  const [detail, setDetail] = useState<DoctorWalletDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorWallet | null>(null);

  // Transaction edit
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [txStatus, setTxStatus] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [savingTx, setSavingTx] = useState(false);

  // Manual transaction modal
  const [showAddTx, setShowAddTx] = useState(false);
  const [addTx, setAddTx] = useState({ type: 'PAYMENT', amount: '', description: '' });
  const [addingTx, setAddingTx] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) q.set('search', search);
    apiFetch<WalletResponse>(`/admin/finances/wallets?${q}`)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const openDoctor = async (doc: DoctorWallet) => {
    setSelectedDoctor(doc);
    setDetailLoading(true);
    setDetail(null);
    try {
      const d = await apiFetch<DoctorWalletDetail>(`/admin/finances/wallets/${doc.id}`);
      setDetail(d);
    } catch (e: any) { setError(e.message); }
    finally { setDetailLoading(false); }
  };

  const handleUpdateTx = async () => {
    if (!editingTx) return;
    setSavingTx(true); setError(''); setSuccess('');
    try {
      const updated = await apiFetch<Transaction>(`/admin/finances/transactions/${editingTx.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: txStatus, description: txDesc || undefined }),
      });
      setDetail((prev) => prev ? {
        ...prev,
        transactions: prev.transactions.map((t) => t.id === updated.id ? updated : t),
      } : prev);
      setEditingTx(null);
      setSuccess('Transaction mise à jour.');
    } catch (e: any) { setError(e.message); }
    finally { setSavingTx(false); }
  };

  const handleAddTx = async () => {
    if (!selectedDoctor || !addTx.amount || !addTx.description) return;
    setAddingTx(true); setError(''); setSuccess('');
    try {
      const created = await apiFetch<Transaction>(`/admin/finances/transactions`, {
        method: 'POST',
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          type: addTx.type,
          amount: Number(addTx.amount),
          description: addTx.description,
        }),
      });
      setDetail((prev) => prev ? {
        ...prev,
        transactions: [created, ...prev.transactions],
        summary: {
          ...prev.summary,
          totalEarned: addTx.type === 'PAYMENT' ? prev.summary.totalEarned + Number(addTx.amount) : prev.summary.totalEarned,
          totalWithdrawn: addTx.type === 'PAYOUT' ? prev.summary.totalWithdrawn + Number(addTx.amount) : prev.summary.totalWithdrawn,
          balance: addTx.type === 'PAYMENT'
            ? prev.summary.balance + Number(addTx.amount)
            : addTx.type === 'PAYOUT'
            ? prev.summary.balance - Number(addTx.amount)
            : prev.summary.balance,
        },
      } : prev);
      setShowAddTx(false);
      setAddTx({ type: 'PAYMENT', amount: '', description: '' });
      setSuccess('Transaction créée.');
    } catch (e: any) { setError(e.message); }
    finally { setAddingTx(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Finances</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gestion des portefeuilles médecins et transactions</p>
      </div>

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {success && <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>}

      {/* Grand total cards */}
      {data?.grandTotal && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Solde total', value: data.grandTotal.balance, icon: Wallet, color: 'text-violet-600', bg: 'bg-violet-50' },
            { label: 'CA total (encaissé)', value: data.grandTotal.totalEarned, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Total retiré', value: data.grandTotal.totalWithdrawn, icon: ArrowDownLeft, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className={`rounded-lg p-2 ${bg}`}><Icon className={`h-4 w-4 ${color}`} /></div>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
              <p className={`text-2xl font-bold ${color}`}>{fmt(value)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-4">
        {/* Wallets list */}
        <div className="flex-1 min-w-0">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              className="input pl-9 w-full"
              placeholder="Rechercher un médecin…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Médecin</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">CA encaissé</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Retiré</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Solde</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={5} className="py-12 text-center text-muted-foreground text-sm">Chargement…</td></tr>
                ) : (data?.wallets ?? []).length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-muted-foreground text-sm">Aucun résultat</td></tr>
                ) : (data?.wallets ?? []).map((w) => (
                  <tr
                    key={w.id}
                    className={`hover:bg-muted/30 cursor-pointer transition-colors ${selectedDoctor?.id === w.id ? 'bg-primary/5' : ''}`}
                    onClick={() => openDoctor(w)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{w.fullName ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{w.email}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-700 font-medium">{fmt(w.totalEarned)}</td>
                    <td className="px-4 py-3 text-right text-amber-700">{fmt(w.totalWithdrawn)}</td>
                    <td className={`px-4 py-3 text-right font-bold ${w.balance >= 0 ? 'text-violet-700' : 'text-red-700'}`}>{fmt(w.balance)}</td>
                    <td className="px-4 py-3 text-right">
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground inline" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {data && data.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground">{data.total} médecin(s)</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded p-1 hover:bg-muted disabled:opacity-40">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs px-2">{page} / {data.pages}</span>
                  <button onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page === data.pages} className="rounded p-1 hover:bg-muted disabled:opacity-40">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selectedDoctor && (
          <div className="w-[440px] shrink-0 space-y-4">
            <div className="rounded-2xl border border-border bg-card shadow-sm p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{selectedDoctor.fullName ?? selectedDoctor.email}</p>
                  <p className="text-xs text-muted-foreground">{selectedDoctor.email}</p>
                </div>
                <button
                  onClick={() => setShowAddTx(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-3.5 w-3.5" /> Ajustement
                </button>
              </div>

              {detailLoading ? (
                <div className="flex justify-center py-8"><div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
              ) : detail ? (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Solde', value: detail.summary.balance, color: 'text-violet-700' },
                      { label: 'CA encaissé', value: detail.summary.totalEarned, color: 'text-emerald-700' },
                      { label: 'Retiré', value: detail.summary.totalWithdrawn, color: 'text-amber-700' },
                      { label: 'En attente', value: detail.summary.pendingAmount, color: 'text-slate-600' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="rounded-xl border border-border p-3">
                        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                        <p className={`font-bold text-sm ${color}`}>{fmt(value)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Transactions */}
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Transactions récentes</p>
                    <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                      {detail.transactions.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-4 text-center">Aucune transaction</p>
                      ) : detail.transactions.map((tx) => (
                        <div key={tx.id} className="rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeColor[tx.type] ?? 'bg-gray-100 text-gray-700'}`}>
                                {tx.type}
                              </span>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[tx.status] ?? ''}`}>
                                {statusIcon[tx.status]}
                                {tx.status}
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-semibold text-sm">{fmt(Number(tx.amount))}</p>
                              <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString('fr-FR')}</p>
                            </div>
                          </div>
                          {tx.description && <p className="text-xs text-muted-foreground mt-1 truncate">{tx.description}</p>}
                          <button
                            onClick={() => { setEditingTx(tx); setTxStatus(tx.status); setTxDesc(tx.description ?? ''); }}
                            className="mt-1.5 text-xs text-primary hover:underline"
                          >
                            Modifier
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Edit transaction modal */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-card border border-border shadow-xl p-6 space-y-4">
            <h2 className="font-semibold">Modifier la transaction</h2>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Statut</label>
              <select className="input w-full" value={txStatus} onChange={(e) => setTxStatus(e.target.value)}>
                {['PENDING', 'SUCCESS', 'FAILED'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <input className="input w-full" value={txDesc} onChange={(e) => setTxDesc(e.target.value)} placeholder="Description…" />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={handleUpdateTx} disabled={savingTx} className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                {savingTx ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              <button onClick={() => setEditingTx(null)} className="flex-1 rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add transaction modal */}
      {showAddTx && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-card border border-border shadow-xl p-6 space-y-4">
            <h2 className="font-semibold">Ajustement manuel</h2>
            <p className="text-xs text-muted-foreground">Pour : <span className="font-medium">{selectedDoctor.fullName ?? selectedDoctor.email}</span></p>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <select className="input w-full" value={addTx.type} onChange={(e) => setAddTx((p) => ({ ...p, type: e.target.value }))}>
                {['PAYMENT', 'PAYOUT', 'REFUND'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Montant (XAF)</label>
              <input type="number" className="input w-full" value={addTx.amount} onChange={(e) => setAddTx((p) => ({ ...p, amount: e.target.value }))} placeholder="0" min="0" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Motif / Description</label>
              <input className="input w-full" value={addTx.description} onChange={(e) => setAddTx((p) => ({ ...p, description: e.target.value }))} placeholder="Motif de l'ajustement…" />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleAddTx}
                disabled={addingTx || !addTx.amount || !addTx.description}
                className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {addingTx ? 'Création…' : 'Créer'}
              </button>
              <button onClick={() => setShowAddTx(false)} className="flex-1 rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
