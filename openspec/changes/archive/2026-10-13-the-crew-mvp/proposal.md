## Why

A Oreggia Tech foi contratada para desenvolver o app do clube **The Crew** (antigo "Moving Club"). O produto e o MVP já foram validados num deck e num protótipo navegável no Claude Design ("O clube que se movimenta" — presença física móvel em corridas, trilhas e trekking), mas o repositório de código ainda não tem nenhuma especificação técnica: hoje só existe o tooling OpenSpec, sem app nem backend. Esta proposta formaliza o escopo do MVP e as decisões de arquitetura antes de iniciar a implementação.

## What Changes

- Criar as 7 capabilities do MVP a partir das 13 telas já desenhadas no protótipo navegável (onboarding, cadastro/login, calendário de ativações, benefícios, loja, Strava, notificações, perfil).
- Fixar a stack: app em **React Native com Expo**; backend em **Firebase** (Firestore + Firebase Auth + Cloud Functions) para o MVP.
- Estabelecer como requisito arquitetural (não opcional) uma **camada de acesso a dados** entre as telas e o Firestore, para permitir uma futura migração de backend sem reescrever a UI. Modelagem de dados no Firestore deve evitar subcollections profundas específicas de NoSQL, favorecendo uma estrutura "achatada".
- Fixar que o **Firebase Auth permanece** como serviço de autenticação mesmo após uma eventual migração futura do backend de dados — não está no escopo de portabilidade desta proposta.
- Adicionar observabilidade: **Firebase Analytics** para métricas comerciais (funil de adesão/uso) e **Sentry** para monitoramento de erros/crashes — Firebase Crashlytics foi descartado por exigir dev client customizado (EAS Build) desde o início, o que contradiz o uso do Expo gerenciado.
- Excluir explicitamente do MVP (fica para v2, após validar adesão): gamificação/ranking, pagamento nativo na loja, mapa geolocalizado de benefícios, check-in físico com QR code.

## Capabilities

### New Capabilities
- `associate-onboarding`: onboarding (3 telas com opção de pular), cadastro (e-mail/senha ou Strava OAuth), login e perfil (dados do associado, encerrar sessão).
- `activation-calendar`: calendário de ativações do clube (corridas, trilhas, trekking) com filtro por tipo, tela de detalhe e confirmação/cancelamento de presença (RSVP).
- `partner-benefits`: catálogo de benefícios de parceiros com filtro por categoria, tela de detalhe com código de desconto e cópia do código.
- `club-store`: loja exclusiva com catálogo de produtos e finalização de pedido via link do WhatsApp, sem gateway de pagamento.
- `strava-connection`: conexão e desconexão da conta Strava via OAuth, acessível a partir da home e do perfil.
- `push-notifications`: lista de notificações do associado com indicador de mensagens não lidas.
- `product-observability`: instrumentação de métricas comerciais (Firebase Analytics) e monitoramento de erros (Sentry) aplicada a todas as demais capabilities.

### Modified Capabilities
_Nenhuma — este é o primeiro conjunto de specs do repositório._

## Impact

- **Código**: criação do app React Native (Expo) do zero; hoje o repositório só contém tooling OpenSpec, nenhum código de app é afetado ou removido.
- **Backend**: provisionamento de um projeto Firebase (Firestore, Authentication, Cloud Functions).
- **Integrações externas**: Strava (OAuth), WhatsApp (deep link para finalizar pedidos), Sentry (SaaS de erro/crash).
- **Dependências novas**: SDKs Firebase, SDK Sentry para Expo/React Native, biblioteca de navegação (`@react-navigation`).
- **Comercial**: nenhum impacto em CRM/prospecção — fora do escopo desta proposta.
