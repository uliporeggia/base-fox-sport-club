import type { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Centralized route types for the whole app — every screen across the 16
 * mockup screens (including the membership-conditional 03/12/13) is declared
 * here so no later agent needs to touch this file to add a route.
 *
 * Ownership: this file, and the rest of src/navigation/, is fully owned and
 * finished by the foundation wave. The membership-conditional routes (03
 * BecomeMember, 12 Paywall, 13 SubscriptionConfirmed) are wired in
 * RootNavigator.tsx / EntryStack.tsx using `useMemberAccess()` — no feature
 * agent edits navigation files to make that work.
 */

// ---------------------------------------------------------------------------
// Entry flow — Onboarding → Cadastro → (Torne-se membro, conditional) → Início
// ---------------------------------------------------------------------------

export type EntryStackParamList = {
  /** Tela 01 — onboarding, 3 passos (gerido como estado interno da tela). */
  Onboarding: undefined;
  /** Tela 02 — cadastro (Strava ou e-mail/senha). */
  SignUp: undefined;
  /** Sem tela numerada — alcançada por "Já tem conta? Entrar" em 02. */
  Login: undefined;
  /** Tela 03 — Torne-se membro, pulável. Ausente do grafo com a flag de membership desligada. */
  BecomeMember: undefined;
};

// ---------------------------------------------------------------------------
// Per-tab stacks
// ---------------------------------------------------------------------------

export type HomeStackParamList = {
  /** Tela 04 — Início. */
  Home: undefined;
};

export type EventModalityFilter = 'todos' | 'corrida' | 'trilha' | 'trekking';

export type EventsStackParamList = {
  /** Tela 05 — lista de eventos. The modality filter is local UI state, not a nav param. */
  EventsList: undefined;
  /** Tela 06 — detalhe do evento. */
  EventDetail: { eventId: string };
};

export type VipStackParamList = {
  /** Tela 07 — hub do Espaço VIP (variantes membro / bloqueado decididas via `hasMemberAccess`). */
  VipHub: undefined;
  /** Tela 08 — QR code de acesso. */
  VipQr: { eventId: string };
};

export type BenefitsStackParamList = {
  /** Telas 09/10 — catálogo de benefícios (variante por `hasMemberAccess`). */
  BenefitsList: undefined;
  /** Tela 11 — detalhe do benefício. */
  BenefitDetail: { benefitId: string };
};

export type ProfileStackParamList = {
  /** Tela 15 — Perfil. */
  Profile: undefined;
  /** Tela 16 — editar dados pessoais (nome e foto). */
  EditProfile: undefined;
};

// ---------------------------------------------------------------------------
// Bottom tab bar — 5 abas, Espaço VIP elevada (design/BFTabBar.dc.html)
// ---------------------------------------------------------------------------

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  EventsTab: NavigatorScreenParams<EventsStackParamList>;
  VipTab: NavigatorScreenParams<VipStackParamList>;
  BenefitsTab: NavigatorScreenParams<BenefitsStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

/** Reachable from the Home header bell (9.4) and from the Perfil "Notificações" row (Perfil section of design.md) — never a tab of its own. */
export type NotificationsStackParamList = {
  /** Tela 14 — caixa de entrada de notificações. */
  Notifications: undefined;
};

/** `source` param of `paywall_viewed` / the screens that can open the contextual paywall. */
export type PaywallSource = 'entry_flow' | 'home_banner' | 'event_detail' | 'vip_hub' | 'benefit_detail' | 'profile';

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export type RootStackParamList = {
  /** Onboarding/cadastro/login — mounted while no associate is signed in. */
  Entry: NavigatorScreenParams<EntryStackParamList>;
  /** The 5-tab app — mounted once an associate is signed in. */
  Main: NavigatorScreenParams<MainTabParamList>;
  Notifications: NavigatorScreenParams<NotificationsStackParamList>;
  /** Tela 12 — paywall contextual. Removed from the graph when membership is hidden. */
  Paywall: { source: PaywallSource; benefitId?: string };
  /** Tela 13 — assinatura confirmada. Removed from the graph when membership is hidden. */
  SubscriptionConfirmed: undefined;
};

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- documented react-navigation TS pattern
    interface RootParamList extends RootStackParamList {}
  }
}
