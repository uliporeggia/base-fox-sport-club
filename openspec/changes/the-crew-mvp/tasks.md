## 1. Setup do projeto

- [ ] 1.1 Inicializar o app Expo (React Native + TypeScript), com EAS configurado para builds de dev client
- [ ] 1.2 Provisionar o projeto Firebase (Firestore, Authentication, Cloud Functions) e decidir/configurar separação por ambiente (dev/staging/prod)
- [ ] 1.3 Configurar navegação (`@react-navigation`) com tab bar de 5 abas (Início, Ativações, Benefícios, Loja, Perfil) e pilhas de detalhe por aba
- [ ] 1.4 Criar a camada de acesso a dados (repository/service) por domínio — nenhuma tela deve chamar o SDK do Firestore diretamente
- [ ] 1.5 Modelar as coleções Firestore de forma achatada (`associates`, `events`, `benefits`, `products`, `notifications`)

## 2. Observabilidade (base)

- [ ] 2.1 Integrar o SDK do Firebase Analytics ao app
- [ ] 2.2 Integrar o SDK do Sentry (`Sentry.init` com `environment`/`release`) e adicionar error boundary no componente raiz
- [ ] 2.3 Configurar listener de navegação (`onStateChange`) para `screen_view` automático

## 3. Onboarding, cadastro e login (`associate-onboarding`)

- [ ] 3.1 Implementar as 3 telas de onboarding com opção de pular
- [ ] 3.2 Implementar tela de cadastro por e-mail/senha com validação de campos
- [ ] 3.3 Implementar tela de login por e-mail/senha com validação de campos
- [ ] 3.4 Implementar cadastro e login via Strava OAuth
- [ ] 3.5 Implementar tela de Perfil (dados do associado + logout)
- [ ] 3.6 Instrumentar eventos `onboarding_step_view`, `onboarding_skipped`, `sign_up`, `login`, `logout`

## 4. Calendário de ativações (`activation-calendar`)

- [ ] 4.1 Implementar listagem de ativações com filtro por tipo
- [ ] 4.2 Implementar tela de detalhe da ativação
- [ ] 4.3 Implementar confirmação/cancelamento de presença (RSVP)
- [ ] 4.4 Implementar card "Próxima ativação" na Home, com atalho para o detalhe
- [ ] 4.5 Instrumentar eventos `calendar_filter_applied`, `event_viewed`, `rsvp_confirmed`, `rsvp_cancelled`, `next_event_card_tapped`

## 5. Benefícios de parceiros (`partner-benefits`)

- [ ] 5.1 Implementar listagem de benefícios com filtro por categoria
- [ ] 5.2 Implementar tela de detalhe com código de desconto e ação de copiar
- [ ] 5.3 Implementar card "Parceiro em destaque" na Home, com atalho para o detalhe
- [ ] 5.4 Instrumentar eventos `benefits_filter_applied`, `benefit_viewed`, `benefit_code_copied`, `featured_benefit_card_tapped`

## 6. Loja exclusiva (`club-store`)

- [ ] 6.1 Implementar catálogo de produtos em grade
- [ ] 6.2 Implementar tela de detalhe do produto
- [ ] 6.3 Implementar finalização de pedido via deep link do WhatsApp e estado de confirmação "Pedido enviado!"
- [ ] 6.4 Instrumentar eventos `product_viewed`, `order_whatsapp_initiated`

## 7. Conexão com Strava (`strava-connection`)

- [ ] 7.1 Implementar banner de conexão do Strava na Home
- [ ] 7.2 Implementar alternância de conexão/desconexão do Strava no Perfil
- [ ] 7.3 Instrumentar eventos `strava_connected`, `strava_disconnected`

## 8. Notificações (`push-notifications`)

- [ ] 8.1 Implementar tela de lista de notificações com indicador de não lidas
- [ ] 8.2 Implementar indicador de não lidas no atalho "Avisos" da Home
- [ ] 8.3 Instrumentar evento `notifications_viewed`

## 9. Dados iniciais e validação do piloto

- [ ] 9.1 Cadastrar manualmente os dados iniciais (eventos, benefícios, produtos) no Firestore para o piloto
- [ ] 9.2 Validar o funil completo ponta a ponta (onboarding → cadastro → RSVP → benefício → loja) em ambiente de staging
- [ ] 9.3 Revisar os dashboards do Firebase Analytics e do Sentry antes do lançamento do piloto
