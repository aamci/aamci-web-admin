export default function ConditionsUtilisation() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Conditions d&apos;utilisation — Administration</h1>
          <p className="text-muted-foreground text-sm">Version 1.0 — en vigueur depuis mai 2026 · Usage interne</p>
        </div>

        <div className="rounded-xl border bg-violet-50 border-violet-200 p-5 text-sm text-violet-800">
          Cet espace d&apos;administration est réservé exclusivement au personnel habilité d&apos;Ibogha Health.
          Tout accès non autorisé est susceptible de poursuites pénales conformément au droit gabonais.
        </div>

        {[
          {
            title: '1. Accès réservé',
            content: `L'accès à l'interface d'administration Ibogha Health est strictement réservé aux employés, prestataires et partenaires expressément autorisés par la direction d'Ibogha Health.

Tout compte est nominatif et personnel. Le partage d'identifiants est strictement interdit. Tout accès est journalisé.`,
          },
          {
            title: '2. Niveaux d\'accès',
            content: `• ADMIN : accès complet, gestion des utilisateurs et de la configuration système
• ADMIN_WRITE : lecture et écriture sur toutes les données
• ADMIN_READ : consultation uniquement, aucune modification
• GUEST : tableau de bord uniquement

Chaque intervenant doit disposer du niveau d'accès minimal nécessaire à l'accomplissement de sa mission (principe du moindre privilège).`,
          },
          {
            title: '3. Obligations de l\'utilisateur administrateur',
            content: `Vous vous engagez à :
• Ne consulter que les données strictement nécessaires à votre mission
• Ne pas exporter, copier ou transmettre de données sans autorisation expresse
• Signaler immédiatement tout incident de sécurité ou accès suspect
• Ne pas accéder au système depuis des réseaux non sécurisés
• Activer l'authentification à deux facteurs (2FA) sur votre compte
• Verrouiller votre session en cas d'absence`,
          },
          {
            title: '4. Traitement des données personnelles',
            content: `Les données auxquelles vous accédez (données patients, données médicales, données financières) sont soumises au secret professionnel et à la Loi N° 025/2023 sur la protection des données personnelles.

Tout accès à des données personnelles doit être justifié par une nécessité opérationnelle documentée. Les accès sont tracés et font l'objet d'audits réguliers.`,
          },
          {
            title: '5. Actions irréversibles',
            content: `Certaines actions (suppression de compte, modification de rôle, accès aux données chiffrées) sont irréversibles et font l'objet d'une journalisation renforcée.

Avant toute action susceptible d'affecter des données utilisateurs, vérifiez votre habilitation et la légitimité de l'opération. En cas de doute, consultez un supérieur hiérarchique.`,
          },
          {
            title: '6. Incidents de sécurité',
            content: `En cas de compromission de votre compte ou de détection d'un accès non autorisé :
1. Contactez immédiatement security@ibogha.ga
2. Ne tentez pas de résoudre l'incident seul
3. Conservez les preuves (logs, captures d'écran)

Tout incident doit être déclaré à l'APDPVP dans les 72 heures si des données personnelles sont compromises.`,
          },
          {
            title: '7. Sanctions',
            content: `Le non-respect des présentes conditions peut entraîner :
• La suspension immédiate de l'accès
• Des mesures disciplinaires
• Des poursuites civiles ou pénales

L'accès non autorisé à des données informatiques est puni par la législation gabonaise sur la cybercriminalité.`,
          },
          {
            title: '8. Contact',
            content: `Responsable sécurité : security@ibogha.ga
DPO (Délégué à la Protection des Données) : dpo@ibogha.ga
Urgences : +241 XX XX XX XX`,
          },
        ].map((section) => (
          <div key={section.title} className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold mb-2">{section.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{section.content}</p>
          </div>
        ))}

        <div className="text-center">
          <a href="/dashboard" className="text-primary hover:underline text-sm">
            ← Retour au tableau de bord
          </a>
        </div>
      </div>
    </div>
  );
}
