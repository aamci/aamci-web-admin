'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/_providers/AuthProvider';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (pathname === '/login') return;

    if (!user) {
      router.replace('/login');
      return;
    }

    const ALLOWED_ROLES = ['ADMIN', 'ADMIN_WRITE', 'ADMIN_READ', 'GUEST'];
    if (!ALLOWED_ROLES.includes(user.role ?? '')) {
      router.replace('/403');
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (pathname === '/login') return <>{children}</>;
  if (pathname === '/403') return <>{children}</>;

  const ALLOWED_ROLES = ['ADMIN', 'ADMIN_WRITE', 'ADMIN_READ', 'GUEST'];
  if (!user || !ALLOWED_ROLES.includes(user.role ?? '')) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
