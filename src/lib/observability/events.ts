/**
 * Analytics event taxonomy for the MVP — the single source of truth for
 * event names and their param shapes (task 2.4, design.md "Taxonomia de
 * analytics"). `track()` in `../instrumentation` is typed against
 * `AnalyticsEventParams` so passing an invented event name, or a param the
 * event doesn't declare, is a compile error — not a runtime surprise
 * discovered in the Firebase console weeks later.
 *
 * Contract rules 1.2/1.5 and the spec's "Nenhum valor monetário na
 * instrumentação" requirement: no event here may declare a price, value,
 * currency or revenue param, full stop — the monthly fee isn't set yet and
 * won't be invented in test fixtures either.
 *
 * `screen_view` is intentionally absent: it is emitted automatically by the
 * navigation listener via `logScreenView`, never through `track`.
 */

export type AuthMethod = 'email' | 'strava';
export type StravaSource = 'sign_up' | 'profile';
export type MembershipSource =
  | 'entry_flow'
  | 'home_banner'
  | 'event_detail'
  | 'vip_hub'
  | 'benefit_detail'
  | 'profile';

/** Marker for events that carry no params. */
export type NoParams = Record<string, never>;

export interface AnalyticsEventParams {
  // Onboarding
  onboarding_step_view: { step: string };
  onboarding_skipped: { step: string };

  // Autenticação — sign_up/login são eventos reservados do Firebase,
  // usados do mesmo jeito para aproveitar os funis automáticos do console.
  sign_up: { method: AuthMethod };
  login: { method: AuthMethod };
  logout: { method: AuthMethod };

  // Início
  home_viewed: NoParams;
  next_event_card_tapped: { event_id: string };
  vip_teaser_tapped: { event_id: string };

  // Membership
  paywall_viewed: { source: MembershipSource };
  membership_cta_tapped: { source: MembershipSource };
  subscription_confirmed: { source: MembershipSource };
  membership_declined: { source: MembershipSource };

  // Eventos
  events_filter_applied: { filter_modality: string };
  event_viewed: { event_id: string };
  rsvp_confirmed: { event_id: string; modality: string; has_vip: boolean };
  rsvp_cancelled: { event_id: string; modality: string; has_vip: boolean };

  // Espaço VIP
  vip_hub_viewed: NoParams;
  vip_access_generated: { event_id: string };
  vip_qr_viewed: { event_id: string; has_access: boolean };

  // Benefícios
  benefits_filter_applied: { category: string };
  benefit_viewed: { benefit_id: string; category: string; partner: string; locked: boolean };
  benefit_code_copied: { benefit_id: string; partner: string };
  benefit_link_opened: { benefit_id: string; partner: string };

  // Strava
  strava_connected: { source: StravaSource };
  strava_disconnected: { source: StravaSource };

  // Notificações
  notifications_viewed: { unread_count: number };
  notifications_marked_read: NoParams;
  push_permission_result: { granted: boolean };
}

export type AnalyticsEventName = keyof AnalyticsEventParams;

/**
 * Exhaustiveness guard: this object literal must declare every key of
 * `AnalyticsEventParams` (no more, no less) or the file fails to compile —
 * add a new event to the interface above AND to this list together.
 */
const EVENT_NAME_WITNESS: Record<AnalyticsEventName, true> = {
  onboarding_step_view: true,
  onboarding_skipped: true,
  sign_up: true,
  login: true,
  logout: true,
  home_viewed: true,
  next_event_card_tapped: true,
  vip_teaser_tapped: true,
  paywall_viewed: true,
  membership_cta_tapped: true,
  subscription_confirmed: true,
  membership_declined: true,
  events_filter_applied: true,
  event_viewed: true,
  rsvp_confirmed: true,
  rsvp_cancelled: true,
  vip_hub_viewed: true,
  vip_access_generated: true,
  vip_qr_viewed: true,
  benefits_filter_applied: true,
  benefit_viewed: true,
  benefit_code_copied: true,
  benefit_link_opened: true,
  strava_connected: true,
  strava_disconnected: true,
  notifications_viewed: true,
  notifications_marked_read: true,
  push_permission_result: true,
};

/** Runtime list of every known event name, derived from the witness above. */
export const ANALYTICS_EVENT_NAMES = Object.keys(EVENT_NAME_WITNESS) as AnalyticsEventName[];

/** Events that carry no params — `track()` makes the second argument optional for these. */
export type EmptyParamEventName = {
  [K in AnalyticsEventName]: AnalyticsEventParams[K] extends NoParams ? K : never;
}[AnalyticsEventName];
