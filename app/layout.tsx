import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from './_providers/AuthProvider';
import { AdminGuard } from '@/components/AdminGuard';
import { Sidebar } from '@/components/Sidebar';
import AdminShell from '@/components/AdminShell';

export const metadata: Metadata = {
  title: 'Admin — Health Platform',
  description: 'Interface d\'administration de la plateforme santé',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <AdminGuard>
            <AdminShell>{children}</AdminShell>
          </AdminGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
