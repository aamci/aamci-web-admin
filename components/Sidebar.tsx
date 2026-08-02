'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/_providers/AuthProvider';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ShieldCheck,
  LogOut,
  Activity,
  CreditCard,
  Stethoscope,
  Building2,
  ClipboardList,
  Settings,
  FileText,
  BarChart2,
  MessageSquare,
  Wallet,
  Mail,
  KeyRound,
  Star,
} from 'lucide-react';
import { Logo } from '@/components/Logo';

const navGroups = [
  {
    label: 'Général',
    items: [
      { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { href: '/users', label: 'Utilisateurs', icon: Users },
      { href: '/doctors', label: 'Médecins', icon: Stethoscope },
      { href: '/facilities', label: 'Établissements', icon: Building2 },
      { href: '/appointments', label: 'Rendez-vous', icon: Calendar },
      { href: '/transactions', label: 'Transactions', icon: CreditCard },
      { href: '/finances', label: 'Finances', icon: Wallet },
      { href: '/contracts', label: 'Contrats', icon: FileText },
      { href: '/reviews', label: 'Avis médecins', icon: Star },
      { href: '/tickets', label: 'Tickets support', icon: MessageSquare },
      { href: '/correspondences', label: 'Correspondances', icon: Mail },
    ],
  },
  {
    label: 'Analytiques',
    items: [
      { href: '/statistics', label: 'Statistiques', icon: BarChart2 },
    ],
  },
  {
    label: 'Système',
    items: [
      { href: '/audit', label: "Journal d'audit", icon: ClipboardList },
      { href: '/settings', label: 'Paramètres', icon: Settings },
      { href: '/encryption', label: 'Chiffrement', icon: ShieldCheck },
      { href: '/security', label: 'Sécurité 2FA', icon: KeyRound },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-card overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border shrink-0">
        <Logo className="h-10 w-auto" />
        <span className="font-semibold text-sm tracking-tight text-muted-foreground">Admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User + logout */}
      <div className="border-t border-border px-4 py-4 shrink-0">
        <div className="mb-3">
          <p className="text-sm font-medium truncate">{user?.fullName ?? user?.email}</p>
          <p className="text-xs text-muted-foreground">{user?.role}</p>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
