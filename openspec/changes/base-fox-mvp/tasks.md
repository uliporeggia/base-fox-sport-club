## 1. Setup do projeto e infraestrutura

- [ ] 1.1 Inicializar o app Expo com React Native e TypeScript, usando um nome de pacote e identificadores que não contenham nenhuma menção a Kailash, XKR ou KTR
- [ ] 1.2 Configurar EAS Build e gerar o primeiro dev client para iOS e Android — obrigatório desde o início por causa de Analytics e push
- [ ] 1.3 Provisionar o projeto Firebase (Firestore, Authentication, Cloud Functions) e decidir a separação por ambiente (dev/staging/prod)
- [ ] 1.4 Aplicar a identidade visual do mockup como tokens de tema — cores, tipografia Saira e Barlow, espaçamentos — a partir de `design/README.md`
- [ ] 1.5 Configurar navegação com a tab bar de 5 abas (Início, Eventos, Espaço VIP, Benefícios, Perfil), com a aba central elevada conforme `design/BFTabBar.dc.html`, e as pilhas de detalhe por aba
- [ ] 1.6 Criar a camada de repositório por domínio (`associatesRepository`, `eventsRepository`, `benefitsRepository`, `vipAccessRepository`, `notificationsRepository`, `configRepository`) como único ponto de acesso ao Firestore
- [ ] 1.7 Modelar as coleções Firestore de forma achatada (`associates`, `events`, `rsvps`, `benefits`, `vip_accesses`, `notifications`, `devices`, `config`) conforme a tabela do `design.md`
- [ ] 1.8 Escrever as regras de segurança do Firestore — cada associado lê e escreve só os próprios dados; eventos e benefícios são somente leitura para o app

## 2. Observabilidade (base)

- [ ] 2.1 Integrar o Firebase Analytics ao app via config plugin
- [ ] 2.2 Integrar o Sentry com `environment` e `release` preenchidos a partir do build EAS, e adicionar o error boundary no componente raiz
- [ ] 2.3 Configurar o listener de navegação para `screen_view` automático e breadcrumbs de navegação no Sentry
- [ ] 2.4 Criar o módulo de instrumentação que centraliza o envio de eventos, com proteção contra envio de e-mail, nome e valor monetário como parâmetro

## 3. Membership — flag, gate e telas de assinatura

- [ ] 3.1 Implementar a leitura da flag de membership pelo `configRepository`, com valor padrão e último valor conhecido para quando a configuração remota estiver indisponível
- [ ] 3.2 Implementar o cálculo de `hasMemberAccess` em um único módulo, como a única leitura da flag no app inteiro
- [ ] 3.3 Implementar a remoção condicional das rotas de assinatura do grafo de navegação quando a flag estiver desligada, garantindo que nenhum caminho alcance as telas 03, 12 e 13
- [ ] 3.4 Implementar a atribuição do número de associado no cadastro, via Cloud Function com contador transacional em `config/counters`
- [ ] 3.5 Implementar a tela "Torne-se membro" do fluxo de entrada (03), pulável, com os benefícios inclusos e **sem nenhum valor em reais**
- [ ] 3.6 Implementar o bloco de convite a se tornar membro na tela Início, oculto para membros
- [ ] 3.7 Implementar o paywall contextual (12) com recurso bloqueado em primeiro plano, argumento específico, resumo do que vem incluso e registro da tela de origem
- [ ] 3.8 Implementar a promoção a membro sem cobrança e a tela de confirmação (13) com o cartão digital de associado
- [ ] 3.9 Instrumentar `paywall_viewed`, `membership_cta_tapped`, `subscription_confirmed` e `membership_declined`, com o parâmetro de origem
- [ ] 3.10 Escrever testes do gate cobrindo as três combinações de flag e plano, e verificando que as telas 03, 12 e 13 ficam inalcançáveis com a flag desligada

## 4. Entrada — onboarding, cadastro e login

- [ ] 4.1 Implementar os 3 passos do onboarding (01) com indicador de progresso, ação de pular e "Começar" no último passo
- [ ] 4.2 Implementar a persistência do onboarding já visto, para não reexibi-lo
- [ ] 4.3 Implementar o cadastro por e-mail e senha (02) com validação de nome, e-mail e senha de no mínimo 8 caracteres, e tratamento de e-mail já cadastrado
- [ ] 4.4 Implementar cadastro e login via Strava OAuth, com importação de nome e foto e tratamento de autorização recusada
- [ ] 4.5 Implementar a tela de login alcançada por "Já tem conta? Entrar", reutilizando a identidade visual da tela de cadastro, com mensagem de credenciais inválidas que não revela qual campo está errado
- [ ] 4.6 Implementar a sessão persistente e o roteamento de abertura (onboarding, cadastro ou Início)
- [ ] 4.7 Implementar a tela Início (04) com saudação, sino de notificações no cabeçalho e a composição dos blocos de próximo evento e espaço VIP
- [ ] 4.8 Instrumentar `onboarding_step_view`, `onboarding_skipped`, `sign_up`, `login` e `home_viewed`

## 5. Eventos

- [ ] 5.1 Implementar a lista de eventos (05) em ordem cronológica, agrupada por mês, com estado vazio
- [ ] 5.2 Implementar o filtro por modalidade (Todos, Corrida, Trilha, Trekking) com estado vazio por modalidade
- [ ] 5.3 Implementar o card do evento com dia, mês, modalidade, distância, nome, horário, local, organizador e marcação de espaço VIP
- [ ] 5.4 Implementar o detalhe do evento (06) com capa, modalidade, distância, nome, data, largada, local e descrição, preservando o filtro ao voltar
- [ ] 5.5 Implementar as duas variantes do bloco de espaço VIP no detalhe (com acesso: cortesias e janela; sem acesso: exclusivo para membros com CTA), e a ausência do bloco em eventos sem espaço VIP
- [ ] 5.6 Implementar a confirmação e o cancelamento de presença, disponível nos dois planos, com a variante de ação secundária "Confirmar só a presença" para o plano gratuito
- [ ] 5.7 Implementar o bloco de próximo evento na Home com atalho para o detalhe e para a lista completa
- [ ] 5.8 Instrumentar `events_filter_applied`, `event_viewed`, `rsvp_confirmed`, `rsvp_cancelled` e `next_event_card_tapped`

## 6. Espaço VIP

- [ ] 6.1 Implementar o hub do Espaço VIP (07) com descrição, bloco do próximo espaço, cortesias e lista de espaços seguintes, com estado vazio
- [ ] 6.2 Implementar a variante bloqueada do hub, mantendo o conteúdo informativo visível e substituindo a ação de gerar acesso pelo bloco de acesso de membro
- [ ] 6.3 Implementar a geração do acesso, criando o registro em `vip_accesses` com validade derivada da janela do evento e reaproveitando registro existente
- [ ] 6.4 Implementar a montagem do payload estruturado e versionado do QR, com versão, acesso, associado, evento e validade
- [ ] 6.5 Implementar a tela do QR de acesso (08) com código, evento, data, janela, nome, número de associado, validade e instrução de apresentação
- [ ] 6.6 Implementar a exibição do QR a partir de dados já obtidos, para que a tela funcione sem conectividade na portaria
- [ ] 6.7 Implementar o bloco de espaço VIP na Home com atalho para o hub
- [ ] 6.8 Instrumentar `vip_hub_viewed`, `vip_access_generated` e `vip_qr_viewed`

## 7. Benefícios

- [ ] 7.1 Implementar o catálogo de benefícios (09/10) com filtro por categoria (Todas, Alimentação, Equipamentos, Eventos)
- [ ] 7.2 Implementar o card do benefício com desconto visível para quem tem acesso de membro
- [ ] 7.3 Implementar o mascaramento do valor do desconto e a marcação de benefício de membro para o plano gratuito, mantendo parceiro e categoria legíveis
- [ ] 7.4 Implementar o desvio do toque em benefício bloqueado para o paywall contextual, registrando o detalhe do benefício como origem
- [ ] 7.5 Implementar o detalhe do benefício (11) com categoria, parceiro, título, descrição, código, condições de uso e validade
- [ ] 7.6 Implementar as ações de resgate independentes — copiar código com confirmação temporária e abrir link externo — exibindo só as que o benefício tiver
- [ ] 7.7 Implementar a seção de novos parceiros com itens "Em breve" não resgatáveis, que não abrem detalhe nem acionam o paywall
- [ ] 7.8 Instrumentar `benefits_filter_applied`, `benefit_viewed`, `benefit_code_copied` e `benefit_link_opened`

## 8. Conta — Perfil, dados pessoais e Strava

- [ ] 8.1 Implementar o Perfil (15) com foto ou iniciais, nome, e-mail, selo de associado e as seções "Conta" e "Dados"
- [ ] 8.2 Implementar o item "Assinatura" exibindo o estado do plano, com acesso ao fluxo de assinatura quando aplicável
- [ ] 8.3 Implementar o item "Strava" com estado da conexão, nome de usuário do atleta quando conectado, e as ações de conectar e desconectar
- [ ] 8.4 Garantir que desconectar o Strava em uma conta criada via Strava mantenha a conta e a sessão ativas
- [ ] 8.5 Implementar o item "Notificações" como interruptor de ligar e desligar o envio, refletindo a permissão negada no sistema operacional
- [ ] 8.6 Desenhar a tela de edição de dados pessoais em `.dc.html`, seguindo a identidade visual do mockup, por não existir entre as 15 telas
- [ ] 8.7 Implementar a tela de edição de nome e foto, sem campos de e-mail e senha, com validação de nome não vazio
- [ ] 8.8 Implementar o encerramento de sessão com limpeza dos dados locais de autenticação e retorno à tela de cadastro
- [ ] 8.9 Instrumentar `strava_connected`, `strava_disconnected` e `logout`
- [ ] 8.10 Verificar que a tela Início não exibe nenhum banner ou convite de conexão com o Strava

## 9. Notificações e push

- [ ] 9.1 Resolver a titularidade da conta Apple Developer e obter a chave APNs, além das credenciais FCM — bloqueia o push no iOS
- [ ] 9.2 Implementar a caixa de entrada de notificações (14) agrupada por período, com título, texto, tempo relativo e destaque nas não lidas, com estado vazio
- [ ] 9.3 Implementar a marcação automática como lidas ao visualizar e a ação de marcar todas como lidas
- [ ] 9.4 Implementar o sino no cabeçalho da Home com indicador de não lidas e navegação para a caixa de entrada — único ponto de entrada da caixa
- [ ] 9.4a Implementar a interrupção e a retomada do envio pelo interruptor do Perfil, preservando a caixa de entrada íntegra
- [ ] 9.5 Implementar o pedido de permissão após a primeira confirmação de presença, com a explicação prévia do que o clube envia, e sem repetir o pedido
- [ ] 9.6 Implementar o registro de token por dispositivo em `devices`, com remoção no logout
- [ ] 9.7 Implementar as Cloud Functions de disparo para os três tipos — novo evento com espaço VIP, presença confirmada e nova parceria — escrevendo sempre em `notifications` independentemente da entrega
- [ ] 9.8 Implementar a remoção de tokens recusados pelo serviço de push durante o envio
- [ ] 9.9 Implementar a abertura do app na tela referenciada ao tocar na notificação do sistema
- [ ] 9.10 Verificar em dispositivo físico (iOS e Android) que o app permanece plenamente utilizável com a permissão negada
- [ ] 9.11 Instrumentar `notifications_viewed`, `notifications_marked_read` e `push_permission_result`

## 10. Dados iniciais, auditoria de restrições e validação do piloto

- [ ] 10.1 Escrever um script de seed versionado com os dados iniciais do piloto — eventos, o benefício do cupom de 15% e as vagas "Em breve" — sem nenhum valor em reais
- [ ] 10.2 Auditar o repositório inteiro, incluindo copy, seed, mocks, testes, nome do pacote e metadados de loja, em busca de menções a Kailash, XKR ou KTR, e de qualquer valor em reais
- [ ] 10.3 Validar o funil completo com a flag de membership **desligada**, confirmando que nenhuma tela de assinatura é alcançável e que nenhum caminho morto aparece
- [ ] 10.4 Validar o funil completo com a flag **ligada**, percorrendo os sete pontos de gate nos dois planos
- [ ] 10.5 Conferir os dashboards do Firebase Analytics e do Sentry, com atenção à origem do paywall, antes do lançamento do piloto
- [ ] 10.6 Alinhar com o cliente que, com a flag desligada no piloto, o funil comercial não gera dados — para que a ausência não seja lida como falha de instrumentação
