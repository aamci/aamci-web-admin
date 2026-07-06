'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/app/_providers/AuthProvider';
import {
  ArrowLeft, Star, UserCheck, UserX, MapPin, Phone, Mail,
  Building2, Calendar, Stethoscope, MessageSquare,
} from 'lucide-react';
import Link from 'next/link';

const WRITE_ROLES = ['ADMIN', 'ADMIN_WRITE'];

interface DoctorDetail {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  city: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  doctorProfile: {
    specialty: string | null;
    presentation: string | null;
    address: string | null;
    city: string | null;
    averageRating: number | null;
    totalReviews: number;
    autoConfirmPatientBookings: boolean;
    facilities: Array<{ id: string; name: string; type: string; city: string | null }>;
    reviews: Array<{ id: string; overallRating: number; comment: string | null; createdAt: string }>;
  } | null;
  _count: { appointments: number };
}

export default function DoctorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuth();
  const canWrite = WRITE_ROLES.includes(me?.role ?? '');

  const [doctor, setDoctor] = useState<DoctorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    apiFetch<DoctorDetail>(`/admin/doctors/${id}`)
      .then(setDoctor)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleToggle = async () => {
    if (!doctor) return;
    setToggling(true);
    try {
      await apiFetch(`/admin/users/${doctor.id}/${doctor.isActive ? 'suspend' : 'activate'}`, { method: 'POST' });
      setDoctor((d) => d ? { ...d, isActive: !d.isActive } : d);
    } catch (e) {
      alert('Erreur : ' + (e as Error).message);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!doctor) {
    return <div className="rounded-lg bg-destructive/10 p-4 text-destructive">{error || 'Médecin introuvable'}</div>;
  }

  const profile = doctor.doctorProfile;
  const initials = (doctor.fullName ?? doctor.email).slice(0, 2).toUpperCase();

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/doctors" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted/60 shrink-0">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <div className="flex-1 min-w-0 flex items-start gap-4">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0 overflow-hidden">
            {doctor.avatarUrl ? (
              <img src={doctor.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold truncate">{doctor.fullName ?? '—'}</h1>
              {doctor.isActive ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Actif
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Suspendu
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {profile?.specialty ?? 'Spécialité non renseignée'}
              {' · '}Inscrit le {new Date(doctor.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          {canWrite && (
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors ${
                doctor.isActive
                  ? 'border-red-200 text-red-600 hover:bg-red-50'
                  : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
              } disabled:opacity-50`}
            >
              {doctor.isActive ? <><UserX className="h-4 w-4" /> Suspendre</> : <><UserCheck className="h-4 w-4" /> Activer</>}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Rendez-vous', value: doctor._count.appointments, icon: <Calendar className="h-5 w-5 text-blue-500" /> },
          { label: 'Note moyenne', value: profile?.averageRating ? profile.averageRating.toFixed(1) : '—', icon: <Star className="h-5 w-5 text-amber-500" /> },
          { label: 'Avis', value: profile?.totalReviews ?? 0, icon: <MessageSquare className="h-5 w-5 text-teal-500" /> },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
            {s.icon}
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Coordonnées */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><Stethoscope className="h-4 w-4 text-primary" /> Informations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="truncate">{doctor.email}</span>
          </div>
          {doctor.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{doctor.phone}</span>
            </div>
          )}
          {(profile?.address || profile?.city || doctor.city) && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{[profile?.address, profile?.city ?? doctor.city].filter(Boolean).join(', ')}</span>
            </div>
          )}
        </div>
        {profile?.presentation && (
          <p className="text-sm text-muted-foreground pt-1 border-t border-border">{profile.presentation}</p>
        )}
      </div>

      {/* Établissements */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><Building2 className="h-4 w-4 text-violet-500" /> Établissements ({profile?.facilities.length ?? 0})</h2>
        {!profile?.facilities.length ? (
          <p className="text-sm text-muted-foreground">Aucun établissement rattaché.</p>
        ) : (
          <div className="divide-y divide-border">
            {profile.facilities.map((f) => (
              <div key={f.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                <div>
                  <Link href={`/facilities/${f.id}`} className="text-sm font-medium hover:text-primary hover:underline">
                    {f.name}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.type}{f.city ? ` · ${f.city}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Avis récents */}
      {profile?.reviews && profile.reviews.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" /> Avis récents</h2>
          <div className="divide-y divide-border">
            {profile.reviews.map((r) => (
              <div key={r.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < r.overallRating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                  ))}
                  <span className="text-xs text-muted-foreground ml-1">{new Date(r.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
                {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lien profil utilisateur */}
      <div className="flex justify-end">
        <Link href={`/users/${doctor.id}`} className="text-sm text-primary hover:underline">
          Voir le profil utilisateur complet →
        </Link>
      </div>
    </div>
  );
}
