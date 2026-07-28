'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import {
  ArrowLeft, UserCheck, UserX, Save, KeyRound, Star, Building2,
  FileText, CheckCircle2, Clock, XCircle, AlertCircle, MailCheck,
  MailX, ShieldCheck, User, Heart, BadgeInfo, Activity, Crown, Users, Shield,
  Wallet, TrendingUp, ArrowDownLeft, Plus, ExternalLink,
  Hospital, Stethoscope, X, Search,
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
  contracts?: Contract[];
}

interface TeamMembership {
  id: string;
  ownerId: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  isManager: boolean;
  permissions: string[];
  invitedAt: string;
  joinedAt: string | null;
  owner: { id: string; fullName: string | null; email: string };
}

interface FacilityOption {
  id: string;
  name: string;
  type: string;
  city: string | null;
}

interface ManagedDoctor {
  id: string;
  fullName: string | null;
  email: string;
  doctorProfile: { specialty: string | null; city: string | null } | null;
}

interface FacilityManagerProfile {
  id: string;
  userId: string;
  facilityId: string;
  managedDoctorIds: string[];
  facility: FacilityOption;
  managedDoctors: ManagedDoctor[];
}

interface WalletTransaction {
  id: string;
  amount: string | number;
  type: string;
  status: string;
  provider: string;
  description: string | null;
  createdAt: string;
}

interface WalletDetail {
  doctor: { id: string; fullName: string | null; email: string };
  summary: { balance: number; totalEarned: number; totalWithdrawn: number; pendingAmount: number };
  transactions: WalletTransaction[];
}

const fmt = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' });
const txTypeColor: Record<string, string> = {
  PAYMENT: 'bg-emerald-100 text-emerald-700',
  PAYOUT: 'bg-violet-100 text-violet-700',
  REFUND: 'bg-orange-100 text-orange-700',
};
const txStatusColor: Record<string, string> = {
  SUCCESS: 'bg-emerald-50 text-emerald-700',
  PENDING: 'bg-amber-50 text-amber-700',
  FAILED: 'bg-red-50 text-red-700',
};

const ROLES = ['PATIENT', 'DOCTOR', 'PHARMACY', 'HOSPITAL', 'ADMIN', 'FACILITY_MANAGER', 'SECRETARY', 'ADMIN_READ', 'ADMIN_WRITE', 'GUEST'];
const TEAM_ROLES = ['SECRETARY', 'NURSE', 'ASSISTANT', 'INTERN'];
const TEAM_STATUSES = ['PENDING', 'ACTIVE', 'INACTIVE', 'REVOKED'];
const ALL_PERMISSIONS = [
  'view_appointments', 'manage_appointments', 'view_patients', 'manage_patients',
  'view_schedule', 'manage_schedule', 'view_billing', 'manage_billing',
  'send_messages', 'view_records', 'manage_records',
];

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

  // Team membership state
  const [memberships, setMemberships] = useState<TeamMembership[]>([]);
  const [membershipEdits, setMembershipEdits] = useState<Record<string, Partial<TeamMembership>>>({});
  const [savingMembership, setSavingMembership] = useState<Record<string, boolean>>({});

  // Wallet state (doctors only)
  const [wallet, setWallet] = useState<WalletDetail | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [editingTx, setEditingTx] = useState<WalletTransaction | null>(null);
  const [txStatus, setTxStatus] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [savingTx, setSavingTx] = useState(false);
  const [showAddTx, setShowAddTx] = useState(false);
  const [addTx, setAddTx] = useState({ type: 'PAYMENT', amount: '', description: '' });
  const [addingTx, setAddingTx] = useState(false);

  // Facility manager state
  const [fmProfile, setFmProfile] = useState<FacilityManagerProfile | null>(null);
  const [fmLoading, setFmLoading] = useState(false);
  const [facilities, setFacilities] = useState<FacilityOption[]>([]);
  const [fmFacilityId, setFmFacilityId] = useState('');
  const [savingFm, setSavingFm] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [doctorResults, setDoctorResults] = useState<ManagedDoctor[]>([]);
  const [searchingDoctors, setSearchingDoctors] = useState(false);

  useEffect(() => {
    apiFetch<UserDetail>(`/admin/users/${id}`)
      .then((u) => {
        setUser(u);
        setFullName(u.fullName ?? '');
        setRole(u.role);
        // Load wallet for doctors
        if (u.role === 'DOCTOR') {
          setWalletLoading(true);
          apiFetch<WalletDetail>(`/admin/finances/wallets/${u.id}`)
            .then(setWallet)
            .catch(() => {/* ignore if no wallet */})
            .finally(() => setWalletLoading(false));
        }
        // Load facility manager profile + facility list
        if (['FACILITY_MANAGER', 'SECRETARY'].includes(u.role)) {
          setFmLoading(true);
          Promise.all([
            apiFetch<FacilityManagerProfile | null>(`/admin/facility-managers/${u.id}`).catch(() => null),
            apiFetch<{ facilities: FacilityOption[] }>(`/admin/facilities?limit=100`).catch(() => ({ facilities: [] })),
          ]).then(([fm, facData]) => {
            setFmProfile(fm);
            setFmFacilityId(fm?.facilityId ?? '');
            setFacilities(facData.facilities ?? []);
          }).finally(() => setFmLoading(false));
        }
        return apiFetch<TeamMembership[]>(`/admin/team?userId=${u.id}`);
      })
      .then((ms) => setMemberships(ms))
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

  const handleSaveMembership = async (membershipId: string) => {
    const edits = membershipEdits[membershipId];
    if (!edits || Object.keys(edits).length === 0) return;
    setSavingMembership((prev) => ({ ...prev, [membershipId]: true }));
    setError(''); setSuccess('');
    try {
      const updated = await apiFetch<TeamMembership>(`/admin/team/${membershipId}`, {
        method: 'PATCH',
        body: JSON.stringify(edits),
      });
      setMemberships((prev) => prev.map((m) => (m.id === membershipId ? updated : m)));
      setMembershipEdits((prev) => { const n = { ...prev }; delete n[membershipId]; return n; });
      notify('Droits mis à jour.');
    } catch (err) { notify((err as Error).message, true); }
    finally { setSavingMembership((prev) => ({ ...prev, [membershipId]: false })); }
  };

  const patchMembership = (membershipId: string, field: string, value: any) => {
    setMembershipEdits((prev) => ({ ...prev, [membershipId]: { ...prev[membershipId], [field]: value } }));
  };

  const handleSaveFm = async () => {
    if (!user) return;
    setSavingFm(true); setError(''); setSuccess('');
    try {
      if (!fmProfile) {
        // Create
        const created = await apiFetch<FacilityManagerProfile>(`/admin/facility-managers`, {
          method: 'POST',
          body: JSON.stringify({ userId: user.id, facilityId: fmFacilityId, managedDoctorIds: [] }),
        });
        setFmProfile(created);
        notify('Profil gestionnaire créé.');
      } else {
        // Update facility
        const updated = await apiFetch<FacilityManagerProfile>(`/admin/facility-managers/${user.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ facilityId: fmFacilityId }),
        });
        setFmProfile(updated);
        notify('Établissement mis à jour.');
      }
    } catch (err) { notify((err as Error).message, true); }
    finally { setSavingFm(false); }
  };

  const handleAddDoctor = async (doctor: ManagedDoctor) => {
    if (!fmProfile || !user) return;
    if (fmProfile.managedDoctorIds.includes(doctor.id)) return;
    const newIds = [...fmProfile.managedDoctorIds, doctor.id];
    try {
      await apiFetch(`/admin/facility-managers/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ managedDoctorIds: newIds }),
      });
      setFmProfile((prev) => prev ? {
        ...prev,
        managedDoctorIds: newIds,
        managedDoctors: [...prev.managedDoctors, doctor],
      } : prev);
      setDoctorSearch('');
      setDoctorResults([]);
    } catch (err) { notify((err as Error).message, true); }
  };

  const handleRemoveDoctor = async (doctorId: string) => {
    if (!fmProfile || !user) return;
    const newIds = fmProfile.managedDoctorIds.filter((id) => id !== doctorId);
    try {
      await apiFetch(`/admin/facility-managers/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ managedDoctorIds: newIds }),
      });
      setFmProfile((prev) => prev ? {
        ...prev,
        managedDoctorIds: newIds,
        managedDoctors: prev.managedDoctors.filter((d) => d.id !== doctorId),
      } : prev);
    } catch (err) { notify((err as Error).message, true); }
  };

  const searchDoctors = async (q: string) => {
    setDoctorSearch(q);
    if (q.length < 2) { setDoctorResults([]); return; }
    setSearchingDoctors(true);
    try {
      const data = await apiFetch<{ doctors: ManagedDoctor[] }>(`/admin/doctors?search=${encodeURIComponent(q)}&limit=10`);
      const existing = fmProfile?.managedDoctorIds ?? [];
      setDoctorResults((data.doctors ?? []).filter((d) => !existing.includes(d.id)));
    } catch { setDoctorResults([]); }
    finally { setSearchingDoctors(false); }
  };

  const handleUpdateTx = async () => {
    if (!editingTx) return;
    setSavingTx(true); setError(''); setSuccess('');
    try {
      const updated = await apiFetch<WalletTransaction>(`/admin/finances/transactions/${editingTx.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: txStatus, description: txDesc || undefined }),
      });
      setWallet((prev) => prev ? { ...prev, transactions: prev.transactions.map((t) => t.id === updated.id ? updated : t) } : prev);
      setEditingTx(null);
      notify('Transaction mise à jour.');
    } catch (err) { notify((err as Error).message, true); }
    finally { setSavingTx(false); }
  };

  const handleAddTx = async () => {
    if (!user || !addTx.amount || !addTx.description) return;
    setAddingTx(true); setError(''); setSuccess('');
    try {
      const created = await apiFetch<WalletTransaction>(`/admin/finances/transactions`, {
        method: 'POST',
        body: JSON.stringify({ doctorId: user.id, type: addTx.type, amount: Number(addTx.amount), description: addTx.description }),
      });
      setWallet((prev) => {
        if (!prev) return prev;
        const amt = Number(addTx.amount);
        return {
          ...prev,
          transactions: [created, ...prev.transactions],
          summary: {
            ...prev.summary,
            totalEarned: addTx.type === 'PAYMENT' ? prev.summary.totalEarned + amt : prev.summary.totalEarned,
            totalWithdrawn: addTx.type === 'PAYOUT' ? prev.summary.totalWithdrawn + amt : prev.summary.totalWithdrawn,
            balance: addTx.type === 'PAYMENT' ? prev.summary.balance + amt : addTx.type === 'PAYOUT' ? prev.summary.balance - amt : prev.summary.balance,
          },
        };
      });
      setShowAddTx(false);
      setAddTx({ type: 'PAYMENT', amount: '', description: '' });
      notify('Transaction créée.');
    } catch (err) { notify((err as Error).message, true); }
    finally { setAddingTx(false); }
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

      {/* Établissement & médecins gérés (FACILITY_MANAGER / SECRETARY) */}
      {['FACILITY_MANAGER', 'SECRETARY'].includes(user.role) && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Hospital className="h-5 w-5 text-indigo-500" />
            <h2 className="font-semibold">Établissement & médecins gérés</h2>
          </div>

          {fmLoading ? (
            <div className="flex justify-center py-6"><div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
          ) : (
            <div className="space-y-5">
              {/* Facility selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-muted-foreground" /> Établissement rattaché
                </label>
                {fmProfile?.facility && (
                  <div className="rounded-lg border border-border bg-indigo-50/40 px-4 py-2.5 flex items-center gap-3 mb-2">
                    <Hospital className="h-4 w-4 text-indigo-600 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{fmProfile.facility.name}</p>
                      <p className="text-xs text-muted-foreground">{fmProfile.facility.type}{fmProfile.facility.city ? ` · ${fmProfile.facility.city}` : ''}</p>
                    </div>
                  </div>
                )}
                {canWrite && (
                  <div className="flex gap-2">
                    <select
                      className="input flex-1"
                      value={fmFacilityId}
                      onChange={(e) => setFmFacilityId(e.target.value)}
                    >
                      <option value="">— Choisir un établissement —</option>
                      {facilities.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}{f.city ? ` (${f.city})` : ''}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleSaveFm}
                      disabled={savingFm || !fmFacilityId}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      {savingFm ? 'Enregistrement…' : fmProfile ? 'Modifier' : 'Créer le profil'}
                    </button>
                  </div>
                )}
              </div>

              {/* Managed doctors */}
              {fmProfile && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Stethoscope className="h-4 w-4 text-muted-foreground" /> Médecins gérés
                      <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {fmProfile.managedDoctors.length}
                      </span>
                    </label>
                  </div>

                  {/* Current doctors list */}
                  {fmProfile.managedDoctors.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">Aucun médecin assigné.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {fmProfile.managedDoctors.map((d) => (
                        <div key={d.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                          <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-sm shrink-0">
                            {(d.fullName ?? d.email).charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{d.fullName ?? d.email}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {d.doctorProfile?.specialty ?? d.email}
                              {d.doctorProfile?.city ? ` · ${d.doctorProfile.city}` : ''}
                            </p>
                          </div>
                          {canWrite && (
                            <button
                              onClick={() => handleRemoveDoctor(d.id)}
                              className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                              title="Retirer"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Doctor search */}
                  {canWrite && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        className="input pl-9 w-full"
                        placeholder="Rechercher un médecin à ajouter…"
                        value={doctorSearch}
                        onChange={(e) => searchDoctors(e.target.value)}
                      />
                      {searchingDoctors && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                      )}
                      {doctorResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                          {doctorResults.map((d) => (
                            <button
                              key={d.id}
                              onClick={() => handleAddDoctor(d)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 text-left transition-colors"
                            >
                              <div className="h-7 w-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-xs shrink-0">
                                {(d.fullName ?? d.email).charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{d.fullName ?? '—'}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {d.doctorProfile?.specialty ?? d.email}
                                </p>
                              </div>
                              <Plus className="h-4 w-4 text-primary shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Portefeuille (doctors only) */}
      {isDoctor && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-violet-500" />
            <h2 className="font-semibold">Portefeuille</h2>
            <Link href="/finances" className="ml-auto inline-flex items-center gap-1 text-xs text-primary hover:underline">
              <ExternalLink className="h-3 w-3" /> Vue globale
            </Link>
          </div>

          {walletLoading ? (
            <div className="flex justify-center py-6"><div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
          ) : wallet ? (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Solde', value: wallet.summary.balance, color: 'text-violet-700', bg: 'bg-violet-50', icon: Wallet },
                  { label: 'CA encaissé', value: wallet.summary.totalEarned, color: 'text-emerald-700', bg: 'bg-emerald-50', icon: TrendingUp },
                  { label: 'Retiré', value: wallet.summary.totalWithdrawn, color: 'text-amber-700', bg: 'bg-amber-50', icon: ArrowDownLeft },
                  { label: 'En attente', value: wallet.summary.pendingAmount, color: 'text-slate-600', bg: 'bg-slate-50', icon: Clock },
                ].map(({ label, value, color, bg, icon: Icon }) => (
                  <div key={label} className={`rounded-xl border border-border p-3 ${bg}`}>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Icon className="h-3 w-3" />{label}</p>
                    <p className={`font-bold text-sm mt-0.5 ${color}`}>{fmt(value)}</p>
                  </div>
                ))}
              </div>

              {/* Transactions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Transactions récentes</p>
                  {canWrite && (
                    <button
                      onClick={() => setShowAddTx(true)}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <Plus className="h-3 w-3" /> Ajustement
                    </button>
                  )}
                </div>
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {wallet.transactions.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Aucune transaction</p>
                  ) : wallet.transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5 hover:bg-muted/30">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${txTypeColor[tx.type] ?? 'bg-gray-100 text-gray-700'}`}>{tx.type}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${txStatusColor[tx.status] ?? ''}`}>{tx.status}</span>
                        {tx.description && <p className="text-xs text-muted-foreground truncate">{tx.description}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-sm">{fmt(Number(tx.amount))}</p>
                        <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString('fr-FR')}</p>
                      </div>
                      {canWrite && (
                        <button
                          onClick={() => { setEditingTx(tx); setTxStatus(tx.status); setTxDesc(tx.description ?? ''); }}
                          className="text-xs text-primary hover:underline shrink-0"
                        >
                          Modifier
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune donnée financière disponible.</p>
          )}
        </div>
      )}

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
              <button onClick={() => setEditingTx(null)} className="flex-1 rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Add transaction modal */}
      {showAddTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-card border border-border shadow-xl p-6 space-y-4">
            <h2 className="font-semibold">Ajustement manuel</h2>
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
              <label className="text-xs font-medium text-muted-foreground">Motif</label>
              <input className="input w-full" value={addTx.description} onChange={(e) => setAddTx((p) => ({ ...p, description: e.target.value }))} placeholder="Motif de l'ajustement…" />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={handleAddTx} disabled={addingTx || !addTx.amount || !addTx.description} className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                {addingTx ? 'Création…' : 'Créer'}
              </button>
              <button onClick={() => setShowAddTx(false)} className="flex-1 rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Team memberships */}
      {memberships.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-500" />
            <h2 className="font-semibold">Appartenance équipe</h2>
            <span className="ml-auto text-xs text-muted-foreground">{memberships.length} appartenance(s)</span>
          </div>
          <div className="space-y-4">
            {memberships.map((m) => {
              const edit = membershipEdits[m.id] ?? {};
              const currentRole = edit.role ?? m.role;
              const currentStatus = edit.status ?? m.status;
              const currentIsManager = edit.isManager ?? m.isManager;
              const currentPerms: string[] = edit.permissions ?? m.permissions ?? [];
              const isDirty = Object.keys(edit).length > 0;

              return (
                <div key={m.id} className={`rounded-xl border p-4 space-y-3 ${currentIsManager ? 'border-amber-200 bg-amber-50/30' : 'border-border'}`}>
                  {/* Owner info */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <p className="text-xs text-muted-foreground">Responsable</p>
                      <p className="text-sm font-medium">{m.owner.fullName ?? m.owner.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        currentStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' :
                        currentStatus === 'PENDING' ? 'bg-amber-50 text-amber-700' :
                        currentStatus === 'REVOKED' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {currentStatus === 'ACTIVE' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {currentStatus}
                      </span>
                      {currentIsManager && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                          <Crown className="h-3 w-3" /> Gestionnaire
                        </span>
                      )}
                    </div>
                  </div>

                  {canWrite && (
                    <div className="grid grid-cols-2 gap-3">
                      {/* Role */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Shield className="h-3 w-3" /> Rôle équipe</label>
                        <select
                          className="input text-sm py-1.5"
                          value={currentRole}
                          onChange={(e) => patchMembership(m.id, 'role', e.target.value)}
                        >
                          {TEAM_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>

                      {/* Status */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Statut</label>
                        <select
                          className="input text-sm py-1.5"
                          value={currentStatus}
                          onChange={(e) => patchMembership(m.id, 'status', e.target.value)}
                        >
                          {TEAM_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      {/* isManager toggle */}
                      <div className="col-span-2 flex items-center gap-3 py-1">
                        <button
                          type="button"
                          onClick={() => patchMembership(m.id, 'isManager', !currentIsManager)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${currentIsManager ? 'bg-amber-400' : 'bg-muted'}`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${currentIsManager ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                        <span className="text-sm font-medium flex items-center gap-1">
                          <Crown className="h-3.5 w-3.5 text-amber-500" />
                          Droits gestionnaire
                        </span>
                        <span className="text-xs text-muted-foreground">(accès élargi sans changer de rôle)</span>
                      </div>

                      {/* Permissions */}
                      <div className="col-span-2 space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Permissions</label>
                        <div className="flex flex-wrap gap-1.5">
                          {ALL_PERMISSIONS.map((p) => {
                            const active = currentPerms.includes(p);
                            return (
                              <button
                                key={p}
                                type="button"
                                onClick={() => {
                                  const next = active
                                    ? currentPerms.filter((x) => x !== p)
                                    : [...currentPerms, p];
                                  patchMembership(m.id, 'permissions', next);
                                }}
                                className={`rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors ${
                                  active
                                    ? 'bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-200'
                                    : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                                }`}
                              >
                                {p.replace(/_/g, ' ')}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {canWrite && (
                    <div className="flex justify-end pt-1 border-t border-border">
                      <button
                        onClick={() => handleSaveMembership(m.id)}
                        disabled={!isDirty || savingMembership[m.id]}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
                      >
                        <Save className="h-3.5 w-3.5" />
                        {savingMembership[m.id] ? 'Enregistrement…' : 'Enregistrer'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contracts */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Contrats</h2>
          <span className="ml-auto text-xs text-muted-foreground">{(user.contracts ?? []).length} contrat(s)</span>
        </div>
        {(user.contracts ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun contrat associé.</p>
        ) : (
          <div className="divide-y divide-border">
            {(user.contracts ?? []).map((c) => (
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
