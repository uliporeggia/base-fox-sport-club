/** Public types of src/lib/auth — see index.ts for the full API. */

export type SignUpResult =
  | { status: 'created' }
  | { status: 'email_in_use' }
  | { status: 'error'; message: string };

/**
 * `invalid_credentials` deliberately does not say whether the e-mail or the
 * password was wrong (associate-onboarding spec, "Credenciais incorretas").
 */
export type LogInResult =
  | { status: 'signed_in' }
  | { status: 'invalid_credentials' }
  | { status: 'error'; message: string };

export type SendLoginLinkResult = { status: 'sent' } | { status: 'error'; message: string };

/**
 * Task 8.7a — definir a primeira senha de uma conta sem nenhuma (Strava ou
 * link de e-mail). Trocar uma senha já existente fica fora desta versão.
 */
export type SetPasswordResult =
  | { status: 'set' }
  /**
   * Firebase já tinha um provedor `password` vinculado (conta de e-mail e
   * senha "de verdade", ou — por uma peculiaridade do Firebase Auth — uma
   * conta de entrada por link de e-mail, que também aparece como provedor
   * `password` em `providerData` mesmo sem senha real definida). Tratado
   * como sucesso silencioso: a UI já devia estar travada antes de chegar
   * aqui; isto é a rede de segurança caso o estado local estivesse
   * desatualizado (ver NOTAS do relatório final).
   */
  | { status: 'already_has_password' }
  /** `auth/requires-recent-login` — a sessão é antiga demais para esta operação sensível. */
  | { status: 'requires_recent_login' }
  | { status: 'error'; message: string };

export type EmailLinkCompletionResult =
  /** Signed in — an associate document already existed for this account. */
  | { status: 'signed_in' }
  /** The link was opened on a device that never requested it — the caller should ask for the e-mail again and call `completeEmailLinkSignIn` a second time with it. */
  | { status: 'needs_email' }
  /**
   * No associate exists for this e-mail. The spec forbids creating an
   * account silently through the login-by-link path ("E-mail sem conta") —
   * the just-created Firebase Auth user is deleted and the caller should
   * guide the visitor to the e-mail cadastro instead.
   */
  | { status: 'no_account' }
  | { status: 'error'; message: string };
