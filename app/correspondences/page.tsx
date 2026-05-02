'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Mail, Search, Eye, X, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DoctorUser {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  doctorProfile?: { specialty?: string | null; city?: string | null } | null;
}

interface Correspondence {
  id: string;
  category: string;
  subject: string;
  content: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  sender: DoctorUser;
  recipient: DoctorUser;
  patient?: { id: string; fullName: string; email: string; avatarUrl?: string | null } | null;
}

interface PaginatedResult {
  items: Correspondence[];
  total: number;
  page: number;
  totalPages: number;
}

const CATEGORIES: Record<string, { label: string; className: string }> = {
  COMPTE_RENDU: { label: 'Compte-rendu',    className: 'bg-blue-100 text-blue-700' },
  DEMANDE_AVIS: { label: "Demande d'avis",  className: 'bg-violet-100 text-violet-700' },
  REPONSE_AVIS: { label: 'Réponse',         className: 'bg-emerald-100 text-emerald-700' },
  TRANSFERT:    { label: 'Transfert',        className: 'bg-amber-100 text-amber-700' },
  AUTRE:        { label: 'Autre',            className: 'bg-gray-100 text-gray-600' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function DoctorCell({ doctor }: { doctor: DoctorUser }) {
  return (
    <div>
      <p className="font-medium text-sm">{doctor.fullName}</p>
      {doctor.doctorProfile?.specialty && (
        <p className="text-xs text-muted-foreground">{doctor.doctorProfile.specialty}</p>
      )}
    </div>
  );
}

export default function CorrespondencesPage() {
  const [data, setData]         = useState<PaginatedResult | null>(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('all');
  const [isRead, setIsRead]     = useState('all');
  const [page, setPage]         = useState(1);
  const [selected, setSelected] = useState<Correspondence | null>(null);

  const load = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' });
      if (search)              params.set('search', search);
      if (category !== 'all') params.set('category', category);
      if (isRead   !== 'all') params.set('isRead', isRead);
      const res = await apiFetch(`/admin/correspondences?${params}`);
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); setPage(1); }, [search, category, isRead]);
  useEffect(() => { load(page); }, [page]);

  const loadDetail = async (id: string) => {
    const res = await apiFetch(`/admin/correspondences/${id}`);
    setSelected(res);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Correspondances médicales</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {data ? `${data.total} correspondance${data.total > 1 ? 's' : ''}` : '—'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher médecin, sujet..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {Object.entries(CATEGORIES).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={isRead} onValueChange={setIsRead}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Statut lecture" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="false">Non lus</SelectItem>
            <SelectItem value="true">Lus</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Expéditeur</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Destinataire</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Sujet</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Catégorie</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Patient</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Lu</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">Chargement...</td></tr>
            ) : !data?.items.length ? (
              <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">Aucune correspondance trouvée</td></tr>
            ) : data.items.map(c => (
              <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3"><DoctorCell doctor={c.sender} /></td>
                <td className="px-4 py-3"><DoctorCell doctor={c.recipient} /></td>
                <td className="px-4 py-3">
                  <p className={`font-medium truncate max-w-[200px] ${!c.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {!c.isRead && <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 mb-0.5" />}
                    {c.subject}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORIES[c.category]?.className ?? 'bg-gray-100 text-gray-600'}`}>
                    {CATEGORIES[c.category]?.label ?? c.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {c.patient ? c.patient.fullName : <span className="text-muted-foreground/40">—</span>}
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(c.createdAt)}</td>
                <td className="px-4 py-3">
                  <Badge variant={c.isRead ? 'secondary' : 'default'} className="text-xs">
                    {c.isRead ? 'Lu' : 'Non lu'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="ghost" onClick={() => loadDetail(c.id)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>Page {data.page} / {data.totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-background border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-lg">{selected.subject}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/40 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Expéditeur</p>
                  <p className="font-medium">{selected.sender.fullName}</p>
                  <p className="text-xs text-muted-foreground">{selected.sender.doctorProfile?.specialty}</p>
                  {selected.sender.doctorProfile?.city && (
                    <p className="text-xs text-muted-foreground">{selected.sender.doctorProfile.city}</p>
                  )}
                </div>
                <div className="bg-muted/40 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Destinataire</p>
                  <p className="font-medium">{selected.recipient.fullName}</p>
                  <p className="text-xs text-muted-foreground">{selected.recipient.doctorProfile?.specialty}</p>
                  {selected.recipient.doctorProfile?.city && (
                    <p className="text-xs text-muted-foreground">{selected.recipient.doctorProfile.city}</p>
                  )}
                </div>
              </div>

              {selected.patient && (
                <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3">
                  <User className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Patient concerné</p>
                    <p className="font-medium text-sm">{selected.patient.fullName}</p>
                    <p className="text-xs text-muted-foreground">{selected.patient.email}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${CATEGORIES[selected.category]?.className}`}>
                  {CATEGORIES[selected.category]?.label}
                </span>
                <Badge variant={selected.isRead ? 'secondary' : 'default'}>
                  {selected.isRead ? `Lu le ${formatDate(selected.readAt!)}` : 'Non lu'}
                </Badge>
                <span className="text-xs text-muted-foreground ml-auto">{formatDate(selected.createdAt)}</span>
              </div>

              {/* Content */}
              <div className="bg-muted/30 rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Contenu</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{selected.content}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
