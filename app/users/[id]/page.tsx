'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import {
  ArrowLeft, UserCheck, UserX, Save, KeyRound, Star, Building2,
  FileText, CheckCircle2, Clock, XCircle, AlertCircle, MailCheck,
  MailX, ShieldCheck, User, Heart, BadgeInfo, Activity,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/app/_providers/AuthProvider';

const WRITE_ROLES = ['ADMIN', 'ADMIN_WRITE'];

interface Contract {
  id: string;
  title: string;
  type: string;
  status: string;
  entityName: string;
  startDate: string;
  endDate: string | null;
  value: number | null;
  currency: string;
  signedAt: string | null;
}

interface Facility {
  id: string;
  name: string;
  type: string;
  city: string | null;
}

interface DoctorProfile {
  specialty: string | null;
  city: string | null;
  presentation: string | null;
  hospitalType: string | null;
  address: string | null;
  formations: string | null;
  experiences: string | null;
  averageRating: number | null;
  totalReviews: number;
  autoConfirmPatientBookings: boolean;
  facilities: Facility[];
}

interface PatientProfile {
  civility: string | null;
  firstName: string | null;
  birthLastName: string | null;
  usageLastName: string | null;
  birthDate: string | null;
  birthPlace: string | null;
  birthCountry: string | null;
  phonePrimary: string | null;
  phoneSecondary: string | null;
  addressLine1: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  insuranceProvider: string | null;
  mutualInsurance: string | null;
  bloodGroup: string | null;
  heightCm: number | null;
  weightKg: number | null;
  primaryDoctorName: string | null;
  patientCode: string | null;
}

interface UserDetail {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  phone: string | null;
  city: string | null;
  sex: string | null;
  birthdate: string | null;
  createdAt: string;
  updatedAt: string;
  doctorProfile?: DoctorProfile | null;
  patientProfile?: PatientProfile | null;
  _count?: { appointments: number };
  contracts: Contract[];
}

const ROLES = ['PATIENT', 'DOCTOR', 'PHARMACY', 'HOSPITAL', 'ADMIN', 'FACILITY_MANAGER', 'ADMIN_READ', 'ADMIN_WRITE', 'GUEST'];

const contractStatusIcon: Record<string, React.ReactNode> = {
  ACTIVE: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
  DRAFT: <Clock className="h-3.5 w-3.5 text-amber-500" />,
  EXPIRED: <XCircle className="h-3.5 w-3.5 text-slate-400" />,
  TERMINATED: <XCircle className="h-3.5 w-3.5 text-red-500" />,
  SUSPENDED: <AlertCircle className="h-3.5 w-3.5 text-orange-500" />,
};
const contractStatusLabel: Record<string, string> = {
  ACTIVE: 'Actif', DRAFT: 'Brouillon', EXPIRED: 'Expiré', TERMINATED: 'Résilié', SUSPENDED: 'Suspendu',
};
const contractStatusColor: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  DRAFT: 'bg-amber-50 text-amber-700',
  EXPIRED: 'bg-slate-100 text-slate-600',
  TERMINATED: 'bg-red-50 text-red-700',
  SUSPENDED: 'bg-orange-50 text-orange-700',
};

const roleColor: Record<string, string> = {
  PATIENT: 'bg-blue-50 text-blue-700',
  DOCTOR: 'bg-teal-50 text-teal-700',
  ADMIN: 'bg-violet-50 text-violet-700',
  PHARMACY: 'bg-amber-50 text-amber-700',
  HOSPITAL: 'bg-indigo-50 text-indigo-700',
};

function InfoRow({ label, value }: { label: string; value?: string | null | React.ReactNode }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

export default function UserDetailPage() {
  const { user: me } = useAuth();
  const canWrite = WRITE_ROLES.includes(me?.role ?? '');
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [verifying, setVerifying] = useState(false);
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

  const notify = (msg: string, isError = false) => {
    if (isError) setError(msg); else setSuccess(msg);
    if (!isError) setTimeout(() => setSuccess(''), 4000);
  };

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      await apiFetch(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ fullName: fullName || null, role }) });
      setUser((prev) => prev ? { ...prev, fullName: fullName || null, role } : prev);
      notify('Modifications enregistrées.');
    } catch (err) { notify((err as Error).message, true); }
    finally { setSaving(false); }
  };

  const handleToggleActive = async () => {
    if (!user) return;
    setError(''); setSuccess('');
    const action = user.isActive ? 'suspend' : 'activate';
    try {
      await apiFetch(`/admin/users/${id}/${action}`, { method: 'POST' });
      setUser((prev) => prev ? { ...prev, isActive: !prev.isActive } : prev);
      notify(`Utilisateur ${action === 'suspend' ? 'suspendu' : 'activé'}.`);
    } catch (err) { notify((err as Error).message, true); }
  };

  const handleResetPassword = async () => {
    if (!confirm(`Réinitialiser le mot de passe de ${user?.fullName ?? user?.email} ?\n\nUn mot de passe temporaire (valable 30 min) sera envoyé par email.`)) return;
    setResetting(true); setError(''); setSuccess('');
    try {
      await apiFetch(`/admin/users/${id}/reset-password`, { method: 'POST' });
      notify("Mot de passe temporaire envoyé par email.");
    } catch (err) { notify((err as Error).message, true); }
    finally { setResetting(false); }
  };

  const handleVerifyEmail = async () => {
    setVerifying(true); setError(''); setSuccess('');
    try {
      await apiFetch(`/admin/users/${id}/verify-email`, { method: 'POST' });
      setUser((prev) => prev ? { ...prev, emailVerified: true } : prev);
      notify('Email vérifié manuellement.');
    } catch (err) { notify((err as Error).message, true); }
    finally { setVerifying(false); }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <div className="rounded-lg bg-destructive/10 p-4 text-destructive">{error || 'Utilisateur introuvable'}</div>;
  }

  const isDoctor = user.role === 'DOCTOR';
  const isPatient = user.role === 'PATIENT';

  return (
    <div className="max-w-3xl space-y-5">

      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/users" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted/60 shrink-0 mt-1">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold truncate">{user.fullName ?? user.email}</h1>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleColor[user.role] ?? 'bg-gray-100 text-gray-700'}`}>
              {user.role}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
        </div>
      </div>

      {/* Status badges row */}
      <div className="flex flex-wrap gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {user.isActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
          {user.isActive ? 'Compte actif' : 'Compte suspendu'}
        </span>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${user.emailVerified ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-700'}`}>
          {user.emailVerified ? <MailCheck className="h-3.5 w-3.5" /> : <MailX className="h-3.5 w-3.5" />}
          {user.emailVerified ? 'Email vérifié' : 'Email non vérifié'}
        </span>
        {user._count !== undefined && (
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-slate-100 text-slate-700">
            <Activity className="h-3.5 w-3.5" />
            {user._count.appointments} rendez-vous
          </span>
        )}
      </div>

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {success && <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>}

      {/* Informations générales */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <BadgeInfo className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Informations générales</h2>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Téléphone" value={user.phone} />
          <InfoRow label="Ville" value={user.city} />
          <InfoRow label="Sexe" value={user.sex === 'M' ? 'Masculin' : user.sex === 'F' ? 'Féminin' : user.sex} />
          <InfoRow
            label="Date de naissance"
            value={user.birthdate ? new Date(user.birthdate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null}
          />
          <InfoRow
            label="Inscrit le"
            value={new Date(user.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          />
          <InfoRow
            label="Dernière mise à jour"
            value={new Date(user.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          />
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Vérification email</p>
            <div className="flex items-center gap-2">
              {user.emailVerified ? (
                <span className="inline-flex items-center gap-1 text-sm text-teal-700 font-medium">
                  <ShieldCheck className="h-4 w-4" /> Vérifié
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-sm text-amber-700 font-medium">
                  <AlertCircle className="h-4 w-4" /> Non vérifié
                </span>
              )}
              {canWrite && !user.emailVerified && (
                <button
                  onClick={handleVerifyEmail}
                  disabled={verifying}
                  className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 hover:bg-teal-100 disabled:opacity-50 transition-colors"
                >
                  <MailCheck className="h-3.5 w-3.5" />
                  {verifying ? 'Vérification…' : 'Valider manuellement'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Doctor profile */}
      {isDoctor && user.doctorProfile && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            <h2 className="font-semibold">Profil médecin</h2>
            {user.doctorProfile.averageRating != null && (
              <span className="ml-auto inline-flex items-center gap-1 text-sm text-amber-600 font-medium">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {user.doctorProfile.averageRating.toFixed(1)}
                <span className="text-muted-foreground text-xs">({user.doctorProfile.totalReviews} avis)</span>
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <InfoRow label="Spécialité" value={user.doctorProfile.specialty} />
            <InfoRow label="Type d'établissement" value={user.doctorProfile.hospitalType} />
            <InfoRow label="Adresse" value={user.doctorProfile.address} />
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Auto-confirmation RDV</p>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${user.doctorProfile.autoConfirmPatientBookings ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {user.doctorProfile.autoConfirmPatientBookings ? 'Activée' : 'Désactivée'}
              </span>
            </div>
            {user.doctorProfile.formations && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-0.5">Formations</p>
                <p className="text-sm">{user.doctorProfile.formations}</p>
              </div>
            )}
            {user.doctorProfile.experiences && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-0.5">Expériences</p>
                <p className="text-sm">{user.doctorProfile.experiences}</p>
              </div>
            )}
          </div>

          {user.doctorProfile.facilities.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Établissements rattachés</p>
              <div className="flex flex-wrap gap-2">
                {user.doctorProfile.facilities.map((f) => (
                  <Link
                    key={f.id}
                    href={`/facilities/${f.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium hover:bg-muted/70 transition-colors"
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    {f.name}
                    {f.city && <span className="text-muted-foreground ml-1">· {f.city}</span>}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Patient profile */}
      {isPatient && user.patientProfile && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-500" />
            <h2 className="font-semibold">Profil patient</h2>
            {user.patientProfile.patientCode && (
              <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-mono text-slate-600">
                {user.patientProfile.patientCode}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <InfoRow label="Prénom" value={user.patientProfile.firstName} />
            <InfoRow label="Nom de naissance" value={user.patientProfile.birthLastName} />
            <InfoRow label="Nom d'usage" value={user.patientProfile.usageLastName} />
            <InfoRow
              label="Date de naissance"
              value={user.patientProfile.birthDate ? new Date(user.patientProfile.birthDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null}
            />
            <InfoRow label="Lieu de naissance" value={user.patientProfile.birthPlace} />
            <InfoRow label="Pays de naissance" value={user.patientProfile.birthCountry} />
            <InfoRow label="Téléphone principal" value={user.patientProfile.phonePrimary} />
            <InfoRow label="Téléphone secondaire" value={user.patientProfile.phoneSecondary} />
            <InfoRow label="Adresse" value={user.patientProfile.addressLine1} />
            <InfoRow
              label="Code postal / Ville / Pays"
              value={[user.patientProfile.postalCode, user.patientProfile.city, user.patientProfile.country].filter(Boolean).join(' · ') || null}
            />
          </div>

          <div className="border-t border-border pt-4 space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-4 w-4 text-red-400" />
              <p className="text-sm font-medium">Santé &amp; couverture</p>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <InfoRow label="Groupe sanguin" value={user.patientProfile.bloodGroup} />
              <InfoRow
                label="Taille / Poids"
                value={
                  user.patientProfile.heightCm || user.patientProfile.weightKg
                    ? [user.patientProfile.heightCm ? `${user.patientProfile.heightCm} cm` : null, user.patientProfile.weightKg ? `${user.patientProfile.weightKg} kg` : null].filter(Boolean).join(' · ')
                    : null
                }
              />
              <InfoRow label="Médecin traitant" value={user.patientProfile.primaryDoctorName} />
              <InfoRow label="Organisme d'assurance" value={user.patientProfile.insuranceProvider} />
              <InfoRow label="Mutuelle" value={user.patientProfile.mutualInsurance} />
            </div>
          </div>
        </div>
      )}

      {/* Contracts */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Contrats</h2>
          <span className="ml-auto text-xs text-muted-foreground">{user.contracts.length} contrat(s)</span>
        </div>
        {user.contracts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun contrat associé.</p>
        ) : (
          <div className="divide-y divide-border">
            {user.contracts.map((c) => (
              <div key={c.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.entityName} · {c.type}</p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${contractStatusColor[c.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {contractStatusIcon[c.status]}
                    {contractStatusLabel[c.status] ?? c.status}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>Début : {new Date(c.startDate).toLocaleDateString('fr-FR')}</span>
                  {c.endDate && <span>Fin : {new Date(c.endDate).toLocaleDateString('fr-FR')}</span>}
                  {c.value != null && <span>{c.value.toLocaleString('fr-FR')} {c.currency}</span>}
                  {c.signedAt && <span>Signé le {new Date(c.signedAt).toLocaleDateString('fr-FR')}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      {canWrite && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <h2 className="font-semibold">Modifier le compte</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nom complet</label>
              <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nom complet" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Rôle</label>
              <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-border">
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
                user.isActive ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              {user.isActive ? <><UserX className="h-4 w-4" />Suspendre</> : <><UserCheck className="h-4 w-4" />Activer</>}
            </button>

            {!user.emailVerified && (
              <button
                onClick={handleVerifyEmail}
                disabled={verifying}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-100 disabled:opacity-50"
              >
                <MailCheck className="h-4 w-4" />
                {verifying ? 'Vérification…' : 'Valider l\'email'}
              </button>
            )}

            <button
              onClick={handleResetPassword}
              disabled={resetting}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-50"
            >
              <KeyRound className="h-4 w-4" />
              {resetting ? 'Envoi…' : 'Réinitialiser le mot de passe'}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">La réinitialisation envoie un mot de passe temporaire valable 30 minutes par email.</p>
        </div>
      )}
    </div>
  );
}
