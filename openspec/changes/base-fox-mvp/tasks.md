## 0. Tarefas de espera — disparar antes de qualquer código

Estas não custam esforço, custam **tempo de terceiro**. Nenhuma acelera com mais trabalho, e todas rodam em paralelo ao desenvolvimento. Atrasar o disparo delas atrasa o lançamento inteiro.

- [x] 0.1 Criar a conta Strava dedicada da Oreggia Tech (e-mail da empresa, não conta pessoal de corrida) e assinar o Strava — a assinatura é obrigatória para a API desde 06/2026 e fica atrelada à conta dona
- [x] 0.2 Registrar a aplicação Strava nessa conta e fazer o auto-upgrade para 10 atletas, disponível sem review
- [ ] 0.3 Solicitar ao Strava o aumento de capacidade acima de 10 atletas — review sem SLA publicado; é o item de prazo mais imprevisível do projeto
- [x] 0.4 Matricular a Oreggia Tech no Apple Developer Program como **pessoa física** (24 a 48 h, sem D-U-N-S)
- [x] 0.5 Criar a conta **pessoal** no Google Play Console (US$ 25, taxa única)
- [ ] 0.6 Recrutar os 12 testadores do teste fechado do Google Play, com o cliente, e avisá-los a não desinstalar o app — sair e voltar reinicia a contagem individual de 14 dias
- [ ] 0.7 Subir ao teste fechado do Google Play a primeira build instalável, ainda que incompleta, para iniciar o relógio de 14 dias corridos em paralelo ao desenvolvimento
- [x] 0.8 Criar a conta e a organização no Sentry, com um projeto React Native, e obter DSN, slug e auth token — a lacuna de 06/11/2026 (`dsn` vazio, nenhum erro reportado) está fechada: o DSN é literal em `app.config.ts` desde `03071da` e em 15/11/2026 o pipeline foi provado ponta a ponta no moto g 100 com uma sonda temporária publicada por OTA só para Android e revertida em seguida. Evento `8b5cbc3fc67b4a5f92d7dd3139d4f010` (issue `BASE-FOX-SPORT-CLUB-1`) chegou com `environment=development`, `release=1.0.0+development` e `dist=01a1e01d-810c-746b-acef-f0af8d6e570c` — o UUID exato do update OTA, não `embedded` nem `unknown`, o que prova de passagem o `resolveDist` da 2.2.ota. Depois da reversão, os cold starts no bundle limpo pararam de gerar eventos. **Só o Android foi exercitado** — o iOS fica na 0.8a
- [ ] 0.8a Provar o mesmo caminho do Sentry no iOS — a metade iOS da 0.8. Exige autorização explícita antes: no iOS o canal `demo` chega apenas ao iPhone do cliente e ao de Patricia, e não existe aparelho iOS próprio aqui, então a sonda de OTA que funcionou no Android alcançaria testadores reais. Alternativa sem risco: esperar o primeiro erro genuíno vindo de um dos dois aparelhos

## 1. Setup do projeto e infraestrutura

- [x] 1.1 Inicializar o app Expo com React Native e TypeScript, usando um nome de pacote e identificadores que não contenham nenhuma menção a Kailash, XKR ou KTR
- [ ] 1.2 Configurar EAS Build e gerar o primeiro dev client para iOS e Android — obrigatório desde o início por causa de Analytics e push
- [x] 1.3 Provisionar o projeto Firebase (Firestore, Authentication, Cloud Functions) e decidir a separação por ambiente (dev/staging/prod)
- [x] 1.4 Aplicar a identidade visual do mockup como tokens de tema — cores, tipografia Saira e Barlow, espaçamentos — a partir de `design/README.md`
- [x] 1.5 Configurar navegação com a tab bar de 5 abas (Início, Eventos, Espaço VIP, Benefícios, Perfil), com a aba central elevada conforme `design/BFTabBar.dc.html`, e as pilhas de detalhe por aba
- [x] 1.6 Criar a camada de repositório por domínio (`associatesRepository`, `eventsRepository`, `benefitsRepository`, `vipAccessRepository`, `notificationsRepository`, `configRepository`) como único ponto de acesso ao Firestore
- [x] 1.7 Modelar as coleções Firestore de forma achatada (`associates`, `events`, `rsvps`, `benefits`, `vip_accesses`, `notifications`, `devices`, `config`) conforme a tabela do `design.md`
- [x] 1.9 Configurar orçamento e alertas de billing no Google Cloud — o Blaze não tem teto por padrão
- [x] 1.9a Guardar o `client_id` do Strava em `config/app`, lido pelo `configRepository`, e manter o `client_secret` exclusivamente nas Cloud Functions
- [x] 1.10 Escrever as regras de segurança do Firestore — cada associado lê e escreve só os próprios dados; eventos e benefícios são somente leitura para o app

## 2. Observabilidade (base)

- [x] 2.1 Integrar o Firebase Analytics ao app via config plugin
- [x] 2.2 Integrar o Sentry com `environment` e `release` preenchidos a partir do build EAS, e adicionar o error boundary no componente raiz
- [x] 2.3 Configurar o listener de navegação para `screen_view` automático e breadcrumbs de navegação no Sentry
- [x] 2.4 Criar o módulo de instrumentação que centraliza o envio de eventos, com proteção contra envio de e-mail, nome e valor monetário como parâmetro
- [x] 2.5 Subir os source maps dos bundles publicados por `eas update` — o casamento entre bundle e map é por **debug ID** embutido no bundle, não por `release`/`dist`, então o upload tem que rodar logo depois do `eas update` que gerou aquele `dist/`, ou o bundle fica sem map para sempre. `scripts/eas-update.sh` (`npm run update -- ...`) encadeia os dois e apaga o `dist/` velho antes. Credencial: o `SENTRY_AUTH_TOKEN` do EAS é Secret e não pode ser lido de volta, então o upload local usa um token de organização próprio em `~/.config/base-fox/sentry-token` (600, fora do repositório). Provado em 16/11/2026 no moto g 100: o evento `37adff2aa8aa486c8daf6763ea34f141` (issue `BASE-FOX-SPORT-CLUB-2`) chegou com frame `/App.tsx:18:36` e o código em volta, contra `index.android.bundle:1:63441` de antes. ⚠️ Publicar com `eas update` cru pula o upload — usar sempre `npm run update`

## 3. Membership — flag, gate e telas de assinatura

- [x] 3.1 Implementar a leitura da flag de membership pelo `configRepository`, com valor padrão e último valor conhecido para quando a configuração remota estiver indisponível
- [x] 3.2 Implementar o cálculo de `hasMemberAccess` em um único módulo, como a única leitura da flag no app inteiro
- [x] 3.3 Implementar a remoção condicional das rotas de assinatura do grafo de navegação quando a flag estiver desligada, garantindo que nenhum caminho alcance as telas 03, 12 e 13
- [x] 3.4 Implementar a atribuição do número de associado no cadastro, via Cloud Function com contador transacional em `config/counters`
- [x] 3.5 Implementar a tela "Torne-se membro" do fluxo de entrada (03), pulável, com os benefícios inclusos e **sem nenhum valor em reais**
- [x] 3.6 Implementar o bloco de convite a se tornar membro na tela Início, oculto para membros
- [x] 3.7 Implementar o paywall contextual (12) com recurso bloqueado em primeiro plano, argumento específico, resumo do que vem incluso e registro da tela de origem
- [x] 3.8 Implementar a promoção a membro sem cobrança e a tela de confirmação (13) com o cartão digital de associado
- [x] 3.9 Instrumentar `paywall_viewed`, `membership_cta_tapped`, `subscription_confirmed` e `membership_declined`, com o parâmetro de origem
- [x] 3.10 Escrever testes do gate cobrindo as três combinações de flag e plano, e verificando que as telas 03, 12 e 13 ficam inalcançáveis com a flag desligada

## 4. Entrada — onboarding, cadastro e login

- [x] 4.1 Implementar os 3 passos do onboarding (01) com indicador de progresso, ação de pular e "Começar" no último passo
- [x] 4.2 Implementar a persistência do onboarding já visto, para não reexibi-lo
- [x] 4.3 Implementar o cadastro por e-mail e senha (02) com validação de nome, e-mail e senha de no mínimo 8 caracteres, e tratamento de e-mail já cadastrado
- [x] 4.4 Implementar cadastro e login via Strava OAuth, com importação de nome e foto e tratamento de autorização recusada
- [x] 4.4a Implementar a degradação elegante do cadastro por Strava quando a API recusar por teto de atletas atingido — mantém o cadastro por e-mail e explica a indisponibilidade, sem apresentar como falha do app
- [x] 4.4b Exigir e-mail no cadastro via Strava, informado pelo visitante — a API do Strava não devolve e-mail desde 01/2019
- [x] 4.4c Implementar a reconciliação de contas pelo e-mail entre os caminhos de cadastro, para que a mesma pessoa não vire dois associados
- [x] 4.4d Implementar o envio e o acompanhamento da verificação de e-mail, com sinalização de pendência no Perfil
- [x] 4.5a Implementar o login por link de e-mail como terceiro caminho de entrada, incluindo o tratamento do deep link de retorno — é o que torna a senha genuinamente opcional
- [x] 4.5 Implementar a tela de login alcançada por "Já tem conta? Entrar", reutilizando a identidade visual da tela de cadastro, com mensagem de credenciais inválidas que não revela qual campo está errado
- [x] 4.6 Implementar a sessão persistente e o roteamento de abertura (onboarding, cadastro ou Início)
- [x] 4.7 Implementar a tela Início (04) com saudação, sino de notificações no cabeçalho e a composição dos blocos de próximo evento e espaço VIP
- [x] 4.8 Instrumentar `onboarding_step_view`, `onboarding_skipped`, `sign_up`, `login` e `home_viewed`

## 5. Eventos

- [x] 5.1 Implementar a lista de eventos (05) em ordem cronológica, agrupada por mês, com estado vazio
- [x] 5.2 Implementar o filtro por modalidade (Todos, Corrida, Trilha, Trekking) com estado vazio por modalidade
- [x] 5.3 Implementar o card do evento com dia, mês, modalidade, distância, nome, horário, local, organizador e marcação de espaço VIP
- [x] 5.4 Implementar o detalhe do evento (06) com capa, modalidade, distância, nome, data, largada, local e descrição, preservando o filtro ao voltar
- [x] 5.5 Implementar as duas variantes do bloco de espaço VIP no detalhe (com acesso: cortesias e janela; sem acesso: exclusivo para membros com CTA), e a ausência do bloco em eventos sem espaço VIP
- [x] 5.6 Implementar a confirmação e o cancelamento de presença, disponível nos dois planos, com a variante de ação secundária "Confirmar só a presença" para o plano gratuito
- [x] 5.7 Implementar o bloco de próximo evento na Home com atalho para o detalhe e para a lista completa
- [x] 5.8 Instrumentar `events_filter_applied`, `event_viewed`, `rsvp_confirmed`, `rsvp_cancelled` e `next_event_card_tapped`

## 6. Espaço VIP

- [x] 6.1 Implementar o hub do Espaço VIP (07) com descrição, bloco do próximo espaço, cortesias e lista de espaços seguintes, com estado vazio
- [x] 6.2 Implementar a variante bloqueada do hub, mantendo o conteúdo informativo visível e substituindo a ação de gerar acesso pelo bloco de acesso de membro
- [x] 6.3 Implementar a geração do acesso, criando o registro em `vip_accesses` com validade derivada da janela do evento e reaproveitando registro existente
- [x] 6.4 Implementar a montagem do payload estruturado e versionado do QR, com versão, acesso, associado, evento e validade
- [x] 6.5 Implementar a tela do QR de acesso (08) com código, evento, data, janela, nome, número de associado, validade e instrução de apresentação
- [x] 6.6 Implementar a exibição do QR a partir de dados já obtidos, para que a tela funcione sem conectividade na portaria
- [x] 6.7 Implementar o bloco de espaço VIP na Home com atalho para o hub
- [x] 6.8 Instrumentar `vip_hub_viewed`, `vip_access_generated` e `vip_qr_viewed`

## 7. Benefícios

- [x] 7.1 Implementar o catálogo de benefícios (09/10) com filtro por categoria (Todas, Alimentação, Equipamentos, Eventos)
- [x] 7.2 Implementar o card do benefício com desconto visível para quem tem acesso de membro
- [x] 7.3 Implementar o mascaramento do valor do desconto e a marcação de benefício de membro para o plano gratuito, mantendo parceiro e categoria legíveis
- [x] 7.4 Implementar o desvio do toque em benefício bloqueado para o paywall contextual, registrando o detalhe do benefício como origem
- [x] 7.5 Implementar o detalhe do benefício (11) com categoria, parceiro, título, descrição, código, condições de uso e validade
- [x] 7.6 Implementar as ações de resgate independentes — copiar código com confirmação temporária e abrir link externo — exibindo só as que o benefício tiver
- [x] 7.7 Implementar a seção de novos parceiros com itens "Em breve" não resgatáveis, que não abrem detalhe nem acionam o paywall
- [x] 7.8 Instrumentar `benefits_filter_applied`, `benefit_viewed`, `benefit_code_copied` e `benefit_link_opened`

## 8. Conta — Perfil, dados pessoais e Strava

- [x] 8.1 Implementar o Perfil (15) com foto ou iniciais, nome, e-mail, selo de associado e as seções "Conta" e "Dados"
- [x] 8.2 Implementar o item "Assinatura" exibindo o estado do plano, com acesso ao fluxo de assinatura quando aplicável
- [x] 8.3 Implementar o item "Strava" com estado da conexão, nome de usuário do atleta quando conectado, e as ações de conectar e desconectar
- [x] 8.4 Garantir que desconectar o Strava em uma conta criada via Strava mantenha a conta e a sessão ativas
- [x] 8.5 Implementar o item "Notificações" como interruptor de ligar e desligar o envio, refletindo a permissão negada no sistema operacional
- [x] 8.6 Desenhar a tela de edição de dados pessoais em `.dc.html`, seguindo a identidade visual do mockup, por não existir entre as 15 telas
- [x] 8.7 Implementar a tela de edição de nome e foto, sem campos de e-mail e senha, com validação de nome não vazio
- [x] 8.7a Implementar a ação de definir senha no Perfil para associados que não têm nenhuma, mantendo troca de senha e alteração de e-mail fora desta versão
- [x] 8.8 Implementar o encerramento de sessão com limpeza dos dados locais de autenticação e retorno à tela de cadastro
- [x] 8.9 Instrumentar `strava_connected`, `strava_disconnected` e `logout`
- [x] 8.10 Verificar que a tela Início não exibe nenhum banner ou convite de conexão com o Strava

## 9. Notificações e push

- [x] 9.1 Resolver a titularidade da conta Apple Developer e obter a chave APNs, além das credenciais FCM — bloqueia o push no iOS
- [x] 9.2 Implementar a caixa de entrada de notificações (14) agrupada por período, com título, texto, tempo relativo e destaque nas não lidas, com estado vazio
- [x] 9.3 Implementar a marcação automática como lidas ao visualizar e a ação de marcar todas como lidas
- [x] 9.4 Implementar o sino no cabeçalho da Home com indicador de não lidas e navegação para a caixa de entrada — único ponto de entrada da caixa
- [x] 9.4a Implementar a interrupção e a retomada do envio pelo interruptor do Perfil, preservando a caixa de entrada íntegra
- [x] 9.5 Implementar o pedido de permissão após a primeira confirmação de presença, com a explicação prévia do que o clube envia, e sem repetir o pedido
- [x] 9.6 Implementar o registro de token por dispositivo em `devices`, com remoção no logout
- [x] 9.7 Implementar as Cloud Functions de disparo para os três tipos — novo evento com espaço VIP, presença confirmada e nova parceria — escrevendo sempre em `notifications` independentemente da entrega
- [x] 9.8 Implementar a remoção de tokens recusados pelo serviço de push durante o envio
- [x] 9.9 Implementar a abertura do app na tela referenciada ao tocar na notificação do sistema
- [ ] 9.10 Verificar em dispositivo físico (iOS e Android) que o app permanece plenamente utilizável com a permissão negada
- [x] 9.11 Instrumentar `notifications_viewed`, `notifications_marked_read` e `push_permission_result`

## 10. Dados iniciais, auditoria de restrições e validação do piloto

- [x] 10.1 Escrever um script de seed versionado com os dados iniciais do piloto — eventos, o benefício do cupom de 15% e as vagas "Em breve" — sem nenhum valor em reais
- [x] 10.2 Auditar o repositório inteiro, incluindo copy, seed, mocks, testes, nome do pacote e metadados de loja, em busca de menções a Kailash, XKR ou KTR, e de qualquer valor em reais
- [x] 10.3 Validar o funil completo com a flag de membership **desligada**, confirmando que nenhuma tela de assinatura é alcançável e que nenhum caminho morto aparece
- [x] 10.4 Validar o funil completo com a flag **ligada**, percorrendo os sete pontos de gate nos dois planos
- [ ] 10.5 Conferir os dashboards do Firebase Analytics e do Sentry, com atenção à origem do paywall, antes do lançamento do piloto
- [ ] 10.6 Alinhar com o cliente que, com a flag desligada no piloto, o funil comercial não gera dados — para que a ausência não seja lida como falha de instrumentação
