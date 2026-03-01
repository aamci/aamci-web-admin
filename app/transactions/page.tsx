'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Transaction {
  id: string;
  amount: string | number;
  type: string;
  status: string;
  provider: string;
  providerRef: string | null;
  description: string | null;
  createdAt: string;
  doctor: { id: string; fullName: string | null; email: string } | null;
  patient: { id: string; fullName: string | null; email: string } | null;
  appointmentId: string | null;
}

interface TxResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalAmount: string | number;
}

const TYPES = ['', 'PAYMENT', 'PAYOUT', 'REFUND'];
const STATUSES = ['', 'PENDING', 'SUCCESS', 'FAILED'];

const typeColor: Record<string, string> = {
  PAYMENT: 'bg-blue-100 text-blue-700',
  PAYOUT: 'bg-violet-100 text-violet-700',
  REFUND: 'bg-orange-100 text-orange-700',
};

const statusColor: Record<string, string> = {
  SUCCESS: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  FAILED: 'bg-red-100 text-red-700',
};

function formatAmount(amount: string | number) {
  return Number(amount).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' });
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState<string | number>(0);
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const limit = 20;

  const fetchTx = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
    });

    apiFetch<TxResponse>(`/admin/transactions?${params}`)
      .then((res) => {
        setTransactions(res.transactions);
        setTotal(res.total);
        setTotalAmount(res.totalAmount);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, type, status]);

  useEffect(() => { fetchTx(); }, [fetchTx]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          {total} transactions · Total succès : <span className="font-semibold text-foreground">{formatAmount(totalAmount)}</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select className="input w-40" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
          {TYPES.map((t) => <option key={t} value={t}>{t || 'Tous les types'}</option>)}
        </select>
        <select className="input w-40" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          {STATUSES.map((s) => <option key={s} value={s}>{s || 'Tous les statuts'}</option>)}
        </select>
      </div>

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Montant</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Médecin</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Patient</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Provider</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Chargement…</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">Aucune transaction trouvée</td></tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(t.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColor[t.type] ?? 'bg-gray-100 text-gray-700'}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatAmount(t.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[t.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{t.doctor?.fullName ?? t.doctor?.email ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.patient?.fullName ?? t.patient?.email ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.provider}</td>
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
