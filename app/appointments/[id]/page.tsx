'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { ArrowLeft, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/app/_providers/AuthProvider';

const WRITE_ROLES = ['ADMIN', 'ADMIN_WRITE'];

const statusColor: Record<string, string> = {
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  CANCELLED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  NO_SHOW: 'bg-slate-100 text-slate-700',
};

interface Appt {
  id: string;
  status: string;
  notes: string | null;
  type: string | null;
  createdAt: string;
  beneficiaryName: string | null;
  beneficiaryPhone: string | null;
  patient?: { id: string; fullName: string | null; email: string; phone: string | null } | null;
  slot?: { start: string; end: string; ownerId: string } | null;
  kind?: { name: string; durationMins: number; isTelemedicine: boolean } | null;
  history?: { id: string; action: string; description: string | null; createdAt: string; user?: { fullName: string | null; role: string } | null }[];
  transactions?: { id: string; amount: number | string; type: string; status: string; provider: string; createdAt: string }[];
}

export default function AppointmentDetailPage() {
  const { user: me } = useAuth();
  const canWrite = WRITE_ROLES.includes(me?.role ?? '');
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [appt, setAppt] = useState<Appt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    apiFetch<Appt>(`/admin/appointments/${id}`)
      .then(setAppt)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!confirm('Annuler ce rendez-vous ?')) return;
    setCancelling(true);
    try {
      await apiFetch(`/admin/appointments/${id}/cancel`, { method: 'POST' });
      setAppt((prev) => prev ? { ...prev, status: 'CANCELLED' } : prev);
    } catch (e) {
      alert('Erreur : ' + (e as Error).message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-24 text-muted-foreground">Chargement…</div>;
  if (error) return <div className="rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div>;
  if (!appt) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/appointments" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <div className="flex-1" />
        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusColor[appt.status] ?? 'bg-gray-100 text-gray-700'}`}>
          {appt.status}
        </span>
        {canWrite && appt.status !== 'CANCELLED' && appt.status !== 'COMPLETED' && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            {cancelling ? 'Annulation…' : 'Annuler le RDV'}
          </button>
        )}
      </div>

      <h1 className="text-2xl font-bold">Détail du rendez-vous</h1>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Slot info */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Créneau</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Début</dt>
              <dd className="font-medium">{appt.slot?.start ? new Date(appt.slot.start).toLocaleString('fr-FR') : '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Fin</dt>
              <dd>{appt.slot?.end ? new Date(appt.slot.end).toLocaleString('fr-FR') : '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Type</dt>
              <dd>{appt.kind?.name ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Durée</dt>
              <dd>{appt.kind?.durationMins ? `${appt.kind.durationMins} min` : '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Téléconsultation</dt>
              <dd>{appt.kind?.isTelemedicine ? 'Oui' : 'Non'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Créé le</dt>
              <dd>{new Date(appt.createdAt).toLocaleString('fr-FR')}</dd>
            </div>
          </dl>
        </div>

        {/* Patient info */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Patient</h2>
          {appt.patient ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Nom</dt>
                <dd className="font-medium">
                  <Link href={`/users/${appt.patient.id}`} className="hover:text-primary hover:underline">
                    {appt.patient.fullName ?? '—'}
                  </Link>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Email</dt>
                <dd>{appt.patient.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Téléphone</dt>
                <dd>{appt.patient.phone ?? '—'}</dd>
              </div>
              {appt.beneficiaryName && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Bénéficiaire</dt>
                  <dd>{appt.beneficiaryName} {appt.beneficiaryPhone ? `(${appt.beneficiaryPhone})` : ''}</dd>
                </div>
              )}
            </dl>
          ) : <p className="text-sm text-muted-foreground">Aucune information patient</p>}
        </div>
      </div>

      {/* Notes */}
      {appt.notes && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">Notes</h2>
          <p className="text-sm whitespace-pre-wrap">{appt.notes}</p>
        </div>
      )}

      {/* Transactions */}
      {appt.transactions && appt.transactions.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">Transactions</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 text-left font-medium text-muted-foreground">Type</th>
                <th className="pb-2 text-left font-medium text-muted-foreground">Montant</th>
                <th className="pb-2 text-left font-medium text-muted-foreground">Statut</th>
                <th className="pb-2 text-left font-medium text-muted-foreground">Provider</th>
                <th className="pb-2 text-left font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {appt.transactions.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="py-2">{t.type}</td>
                  <td className="py-2 font-medium">{Number(t.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}</td>
                  <td className="py-2"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${t.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700' : t.status === 'FAILED' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{t.status}</span></td>
                  <td className="py-2 text-muted-foreground">{t.provider}</td>
                  <td className="py-2 text-muted-foreground">{new Date(t.createdAt).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* History */}
      {appt.history && appt.history.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">Historique</h2>
          <ol className="relative border-l border-border space-y-4">
            {appt.history.map((h) => (
              <li key={h.id} className="ml-4">
                <div className="absolute -left-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                <p className="text-sm font-medium">{h.action}</p>
                {h.description && <p className="text-xs text-muted-foreground mt-0.5">{h.description}</p>}
                <p className="text-xs text-muted-foreground mt-0.5">
                  {h.user?.fullName ?? 'Système'} · {new Date(h.createdAt).toLocaleString('fr-FR')}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
