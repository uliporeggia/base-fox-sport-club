## ADDED Requirements

### Requirement: Rastreamento de eventos comerciais
O sistema SHALL registrar no Firebase Analytics os eventos de negócio definidos na taxonomia do MVP (onboarding, cadastro/login, ativações, benefícios, loja, Strava, notificações), incluindo seus parâmetros associados (ex.: `event_id`, `benefit_id`, `method`, `source`).

#### Scenario: Evento de cadastro
- **WHEN** um associado conclui o cadastro por e-mail ou por Strava
- **THEN** o sistema registra o evento reservado `sign_up` com o parâmetro `method` igual a `email` ou `strava`

#### Scenario: Evento de confirmação de presença
- **WHEN** um associado confirma presença em uma ativação
- **THEN** o sistema registra o evento `rsvp_confirmed` com os parâmetros `event_id` e `event_type`

### Requirement: Rastreamento automático de navegação
O sistema SHALL registrar eventos `screen_view` automaticamente a cada mudança de tela ou aba, sem instrumentação manual por tela.

#### Scenario: Troca de aba
- **WHEN** o associado troca de aba na tab bar
- **THEN** o sistema registra um evento `screen_view` correspondente à nova tela, via listener de mudança de estado de navegação

### Requirement: Monitoramento de erros e crashes
O sistema SHALL reportar erros não tratados e crashes ao Sentry, com contexto de ambiente, versão do build e identificador interno do associado quando autenticado.

#### Scenario: Erro não tratado é capturado
- **WHEN** ocorre uma exceção não tratada em qualquer tela do app
- **THEN** o sistema captura o erro via error boundary e o envia ao Sentry com as tags `environment` e `release` preenchidas

#### Scenario: Contexto de usuário sem dado sensível
- **WHEN** um associado autenticado gera um evento de erro
- **THEN** o sistema anexa ao evento um identificador interno do associado (`associate_id`), nunca o e-mail em texto puro
