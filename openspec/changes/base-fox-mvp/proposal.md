## Why

A Oreggia Tech foi contratada para construir o app do **Base Fox Sport Club** — clube de associados para corrida de rua, trilha e trekking, sem sede fixa, que monta um **espaço VIP próprio dentro de eventos esportivos**. O escopo foi fechado com o cliente em 05/10/2026 e o mockup final das 15 telas foi importado em 08/10 (`design/`), mas o repositório não tem código: só o tooling OpenSpec.

A change anterior (`the-crew-mvp`, arquivada) foi escrita a partir de um protótipo de setembro, antes daquela reunião. Suas **decisões de arquitetura continuam válidas e são carregadas para cá**; escopo, marca e capabilities não — o cliente cortou a loja, elegeu a assinatura paga como eixo do produto e trouxe o QR de acesso ao espaço VIP para dentro do MVP. Esta proposta reescreve as especificações a partir do mockup e do `BRIEFING.md`, não por diff da change antiga.

## What Changes

- **Criar 8 capabilities** a partir das 15 telas (19 frames) do mockup, substituindo as 7 da change anterior.
- **BREAKING — `club-store` morre.** Loja, catálogo de produtos, pedido por WhatsApp e a 5ª aba "Loja" saem do produto (cortados pelo cliente em 05/10: *"vamos fazer um avião só com os eventos"*). A coleção `products` e os eventos de analytics de loja não existem neste MVP. A 5ª aba passa a ser **Espaço VIP**.
- **BREAKING — `activation-calendar` → `events`.** A UI diz "Eventos", não "Ativações". O filtro por organizador ("Nossos eventos" / "Onde estaremos") sai — hoje só existem eventos próprios — mas o campo `organizer` permanece no modelo. A ação de inscrição externa no detalhe do evento sai junto.
- **Introduzir `membership`** — plano gratuito vs. plano de membro em toda a UI, paywall contextual e confirmação de assinatura **sem checkout**. É o eixo comercial do produto e não existia em nenhuma spec anterior.
- **Introduzir `vip-access`** — hub da aba-âncora (bloqueado para gratuito) e **geração/exibição do QR code de acesso** do lado do associado. O leitor/validação do lado do host fica fora (fase 2), mas o payload do QR é modelado para não exigir reescrita quando ela chegar.
- **Ampliar `push-notifications` para push real** — registro de token por associado, pedido de permissão, disparo por Cloud Function e a caixa de entrada in-app com "marcar como lidos". A change anterior especificava apenas a caixa in-app, apesar do nome.
- **Enxugar `strava-connection`** — o banner de conexão na Home **não existe** no mockup novo; Strava aparece só no cadastro e no Perfil.
- **Toda a camada de membership atrás de uma flag remota**, desligável sem novo build (requisito explícito do cliente). No piloto nasce **desligada**: todos navegam como membros, sem telas órfãs.
- **Restrições duras de marca e preço**, válidas em copy, seed data, mocks e testes: nenhuma menção a *Kailash*, *XKR* ou *KTR* em lugar nenhum (incluindo nome do pacote e metadados de loja); **nenhum valor em reais** em lugar nenhum — a mensalidade não foi definida.
- **Carregar as decisões de arquitetura** da change anterior sem rediscuti-las: React Native + Expo, Firebase (Firestore + Auth + Cloud Functions), camada de repositório obrigatória, modelagem achatada, Firebase Analytics + Sentry.

## Capabilities

### New Capabilities

- `associate-onboarding`: onboarding de 3 passos pulável, cadastro por e-mail/senha ou Strava, login, Perfil do associado e edição mínima de dados pessoais (nome e foto).
- `membership`: estados gratuito vs. membro, pitch do plano, paywall contextual, confirmação de assinatura sem cobrança, número de associado e a flag remota que governa os sete pontos de gate da UI.
- `events`: lista de eventos agrupada por mês com filtro por modalidade, detalhe com variantes membro/gratuito, confirmação de presença (RSVP) disponível para os dois planos, e sinalização de espaço VIP no card e no detalhe.
- `vip-access`: hub do Espaço VIP (variantes membro e bloqueado), lista de próximos espaços, e geração/exibição do QR code de acesso com payload estruturado e validade.
- `partner-benefits`: catálogo por categoria, desconto mascarado para o plano gratuito, detalhe com cupom copiável e link externo, e vagas de parceiro "Em breve" não resgatáveis.
- `strava-connection`: conexão via OAuth no cadastro e conexão/desconexão no Perfil, exibindo o identificador Strava quando conectado.
- `push-notifications`: permissão e registro de token do dispositivo, disparo de notificações por Cloud Function, e caixa de entrada in-app agrupada por data com indicador de não lidas e ação de marcar todas como lidas.
- `product-observability`: instrumentação de métricas comerciais (Firebase Analytics) e monitoramento de erros (Sentry) atravessando todas as demais capabilities.

### Modified Capabilities

_Nenhuma — `openspec/specs/` está vazio. A change anterior nunca foi implementada (0 de 38 tarefas) e foi arquivada sem sincronizar specs, então não há requisito em vigor sendo alterado._

## Impact

- **Código**: criação do app React Native (Expo) do zero. Nenhum código existente é afetado — o repositório só contém tooling OpenSpec e os artefatos de design.
- **Backend**: provisionamento de um projeto Firebase (Firestore, Authentication, Cloud Functions). Coleções: `associates`, `events`, `benefits`, `notifications`, `vip_accesses`, `config`. **Sem** `products`.
- **Build**: **dev client obrigatório desde o início** (EAS Build) — `@react-native-firebase/analytics` e push remoto no iOS não funcionam no Expo Go. Isso encerra, por consequência, a justificativa técnica que a change anterior deu para descartar o Crashlytics; ele segue fora, agora por redundância com o Sentry.
- **Integrações externas**: Strava (OAuth), Sentry (SaaS), APNs/FCM (push).
- **Dependências novas**: SDKs Firebase via `@react-native-firebase/*`, `expo-notifications`, `@sentry/react-native`, `@react-navigation`, biblioteca de geração de QR code.
- **Dependência externa com dono indefinido**: a chave **APNs** exige uma conta paga do Apple Developer Program — a mesma titularidade (Oreggia Tech ou cliente) que o briefing havia adiado. Com push real no escopo, essa decisão sobe para o caminho crítico do primeiro build de distribuição.
- **Prazo**: o cliente citou **17/10** como alvo de um lançamento mínimo, mas pediu para não tratá-lo como compromisso; **07/11** e **05/12** são as alternativas reais. As tarefas são ordenadas por valor de demonstração (Entrada → Eventos → Espaço VIP) para que um corte de prazo preserve o que o cliente precisa ver primeiro.
