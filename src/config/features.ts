/**
 * Feature flags centraux pour l'application Advanced Civilization.
 *
 * Dans la déclinaison locale autonome, toutes les intégrations réseau héritées
 * (Supabase, Resend, hub de télémétrie, multijoueur en ligne) sont neutralisées.
 */
export const features = {
  /** Multijoueur en ligne via Supabase / Cloudflare Pages. */
  onlineMultiplayer: false,

  /** Authentification et identité utilisateur distante. */
  externalIdentity: false,

  /** Envoi et réception automatique de rapports d'erreurs distants. */
  remoteReports: false,

  /** Envoi de métriques de jeu au hub communautaire (recordPlay / recordFinish). */
  externalHub: false,
} as const;

export type Features = typeof features;
