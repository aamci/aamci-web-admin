import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
      <div className="text-6xl font-bold text-primary">403</div>
      <h1 className="text-2xl font-semibold">Accès refusé</h1>
      <p className="text-muted-foreground">
        Vous n&apos;avez pas les droits administrateur pour accéder à cette interface.
      </p>
      <Link
        href="/login"
        className="btn-primary mt-2 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Retour à la connexion
      </Link>
    </div>
  );
}
