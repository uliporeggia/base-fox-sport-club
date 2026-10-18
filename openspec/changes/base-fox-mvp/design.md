## Context

O produto está validado em design: 15 telas (19 frames) no mockup final de 08/10/2026, com escopo fechado com o cliente em 05/10. O repositório não tem código — só tooling OpenSpec e os artefatos de design. Este documento fixa **como** as 8 capabilities do `proposal.md` serão construídas.

A change anterior (`the-crew-mvp`) resolveu a camada de arquitetura e esse trabalho é **carregado para cá sem rediscussão** — stack, backend, camada de repositório, modelagem achatada, Auth, observabilidade. Ela resolveu essa parte respondendo a duas tensões que continuam valendo:

1. O critério de corte do MVP exige **custo mínimo de desenvolvimento** — nenhuma decisão aqui deve introduzir complexidade que só se paga numa escala que ainda não existe.
2. Ao mesmo tempo, o crescimento é esperado e uma **migração de backend** (Firebase → backend próprio) é vista como praticamente certa no médio prazo, motivada por funcionalidade (limites do Firestore para relatórios/BI) e custo de escala — não por compliance.

A resposta é pagar só as proteções baratas contra migração agora, e adiar as caras.

O que esta change acrescenta por cima disso é a arquitetura de três coisas que a anterior não conhecia: **membership atrás de flag remota**, **acesso VIP com QR code**, e **push real**. É aí que estão as decisões novas.

Restrições que atravessam todo o design, vindas do cliente e não de preferência técnica:

- **Nenhuma menção a *Kailash*, *XKR* ou *KTR*** em qualquer lugar visível ou inspecionável: copy, logos, rodapés, metadados de loja, nome do pacote, e-mails transacionais, seed data. O Base Fox precisa parecer marca independente porque vai negociar parcerias com concorrentes dessas marcas.
- **Nenhum valor em reais** em lugar nenhum — copy, seed data, mocks, testes. A mensalidade não foi definida. O "R$ 29,90" do protótipo de setembro foi descartado e não pode vazar de volta.
- **Fonte de verdade de UI é o mockup.** Onde este documento divergir de `design/Base Fox - Mockup MVP-print.dc.html`, o mockup vence.

## Goals / Non-Goals

**Goals:**

- Carregar e registrar as decisões de arquitetura herdadas, para que não sejam rediscutidas na implementação.
- Definir onde vivem os gates de permissão de membership, de forma que a flag desligada não produza tela órfã nem caminho morto.
- Definir o payload do QR de acesso VIP de modo que a validação do lado do host (fase 2) não exija reescrita.
- Definir a arquitetura de push real: permissão, token, disparo.
- Atualizar o modelo de dados e a taxonomia de analytics para o escopo fechado em 05/10.

**Non-Goals:**

- Desenhar o backend de destino de uma futura migração (Postgres próprio, Supabase, etc.) — decisão adiada por não ser urgente.
- Especificar checkout, gateway de pagamento ou captura de cartão. A assinatura é confirmada sem cobrança na v1.
- Especificar o app/leitor do host que escaneia e valida a entrada no espaço VIP — fase 2.
- Especificar mapa/geolocalização de parceiros, gamificação, ranking ou cashback.
- Definir pipeline de CI/CD em detalhe — detalhe operacional, não arquitetural.
- Edição de e-mail e senha no Perfil (ver Decisions) — v2.

## Decisions

### Herdadas da change anterior (não re-decidir)

**Stack do app: React Native + Expo.** Alinhado ao stack forte da equipe, um código para iOS e Android, OTA update via EAS. Descartados: nativo separado (Swift/Kotlin) — dobra o esforço e contradiz o critério de custo mínimo; PWA — push notification e Strava OAuth ficam frágeis no iOS.

**Backend: Firebase (Firestore + Firebase Auth + Cloud Functions).** Decisão do cliente. Serviço gerenciado, cobre login/banco/push com custo ~zero na escala do piloto. As decisões abaixo existem para tornar a migração esperada menos custosa quando chegar a hora.

**Camada de acesso a dados obrigatória.** Nenhuma tela ou componente chama o SDK do Firestore diretamente — toda leitura/escrita passa por um repositório por domínio (`eventsRepository`, `benefitsRepository`, `membershipRepository`, `vipAccessRepository`, `notificationsRepository`, `configRepository`). É proteção barata (é questão de *onde* o código fica, não de esforço extra) contra exatamente os dois gatilhos de migração esperados. Descartado: chamar Firestore direto das telas — mais rápido hoje, transforma a migração futura numa reescrita de toda a UI.

**Modelagem achatada no Firestore.** Coleções por domínio, sem subcollections profundas, denormalizando só o que os padrões de leitura reais exigem. Facilita um export/ETL futuro para destino relacional sem pagar o custo de desenhar um schema relacional completo agora.

**Firebase Auth permanece**, mesmo numa futura migração do backend de dados. Migrar autenticação (hashes, sessões) é desproporcionalmente caro frente ao benefício; manter Auth no provedor original enquanto o backend de dados migra é padrão comum. Auth fica explicitamente fora do escopo de portabilidade — decisão documentada, não descuido.

**Cloud Functions como lógica Node/TS portável.** Regras de negócio em módulos que recebem dados e retornam resultado, com o trigger do Firestore como camada fina de entrada/saída, para que a lógica sobreviva a uma migração de hosting.

**Observabilidade: Firebase Analytics (métricas comerciais) + Sentry (erros/crashes).** Duas ferramentas, dois propósitos.

### Dev client assumido desde o primeiro dia

A change anterior descartou o Crashlytics com o argumento de que *"exige dev client, contradizendo o Expo gerenciado"* — enquanto a própria tarefa 1.1 dela configurava builds de dev client. A contradição se resolve agora, porque duas decisões desta change forçam a mão:

- `@react-native-firebase/analytics` exige config plugin e não roda no Expo Go.
- Push remoto no iOS (`expo-notifications`) não funciona no Expo Go.

Logo: **dev client via EAS Build desde o início**, não "se precisar". Consequência: o argumento técnico contra o Crashlytics cai. Ele **continua fora**, agora pelo motivo honesto — redundância com o Sentry, que já cobre erro e crash com um SDK e um painel. Trocar de motivo importa porque o registro antigo levaria alguém a reabrir a decisão achando que a restrição mudou.

### Gate de membership: um valor derivado, um leitor da flag

Requisito literal do cliente em 05/10: *"suporte para a assinatura oculto — ninguém vai ver isso aqui, vai ser só pra gente ligar e desligar"*. No piloto a flag nasce **desligada** — todos navegam como membros — e é ligada quando ele decidir cobrar, **sem novo build**, porque novo build significa nova review da App Store.

Sete pontos da UI dependem do estado de membership:

| Tela                          | Flag ligada, plano gratuito       | Flag desligada                        |
| ----------------------------- | --------------------------------- | ------------------------------------- |
| `03` Torne-se membro          | passo pulável do fluxo de entrada | sai do fluxo                          |
| `04` banner "Torne-se membro" | visível                           | oculto                                |
| `06` detalhe do evento        | variante gratuito                 | sempre variante membro                |
| `07` hub VIP                  | variante bloqueada                | inalcançável                          |
| `09`/`10` benefícios          | desconto mascarado `••% OFF`      | desconto sempre visível               |
| `12` paywall contextual       | alcançável pelo cupom bloqueado   | inalcançável (cupom abre `11` direto) |
| `13` assinatura confirmada    | alcançável                        | inalcançável                          |

Se cada tela testar a flag por conta própria, são sete lugares para errar, e um `if` esquecido vira tela órfã em produção. A decisão é concentrar isso num **único valor derivado**:

```
hasMemberAccess = !membershipEnabled || associate.membership.status === 'member'
                   └──────┬────────┘
                   desligada ⇒ true para todos, sempre
```

As sete telas consomem `hasMemberAccess`. **A flag tem exatamente um leitor no app inteiro** — o módulo que calcula esse valor. Nenhuma tela, nenhum componente e nenhum outro repositório lê `membershipEnabled` diretamente. Os pontos de navegação (`03`, `12`, `13`) são removidos do grafo de rotas quando o valor é `true` por flag desligada, não apenas escondidos — é o que garante "sem telas órfãs nem caminhos mortos".

Descartado: espalhar verificações da flag por tela — mais rápido de escrever, impossível de auditar.

**Onde o valor da flag fica guardado permanece aberto** (ver Open Questions). A decisão acima não depende disso: o `configRepository` expõe `membershipEnabled` e a origem do dado é detalhe de implementação atrás dele. Alternativa já descartada: variável de ambiente no build EAS — viola o requisito, porque ligar a cobrança exigiria novo build e nova review.

### Número de associado atribuído no cadastro, não na assinatura

O mockup exibe `nº 0428` em `08` (QR) e `13` (assinatura confirmada) — ambos contextos de membro. A leitura ingênua seria atribuir o número ao assinar.

Isso quebra com a flag desligada: todo mundo se comporta como membro sem nunca passar pelo fluxo de assinatura, e o QR da tela `08` — que precisa exibir o número — não teria número para exibir.

Decisão: **o número é identidade de clube, não artefato de assinatura.** É atribuído a todo `associate` no cadastro e apenas *exibido* nos contextos onde o mockup o mostra. Funciona idêntico com a flag ligada ou desligada.

Geração: contador em documento único (`config/counters`) incrementado em **transação** dentro de uma Cloud Function no trigger de criação do associado. O Firestore não tem autoincremento; transação é o mecanismo correto e a contenção é irrelevante na escala do piloto. Descartados: número aleatório de 4 dígitos (colisão), derivar da ordem de cadastro em tempo de leitura (instável — muda se um associado for removido).

### QR de acesso: payload estruturado e versionado, validação online na fase 2

O lado do associado está dentro do MVP (gera e exibe); o leitor do host está fora. No piloto o QR é **conferido visualmente** na portaria do espaço. O risco é modelar um blob opaco agora e ter que reescrever quando a validação chegar.

Decisão: o QR codifica um payload **estruturado, legível e versionado**, respaldado por um documento em `vip_accesses`:

```
{ "v": 1, "access": "<accessId>", "associate": "<associateId>",
  "event": "<eventId>", "exp": "<ISO-8601>" }
```

Cada campo tem uma razão de existir:

- `access` — o documento em `vip_accesses` é a fonte de verdade. O leitor da fase 2 resolve por ele, o que torna o acesso **revogável** sem reemitir QR.
- `associate` e `event` — permitem conferência visual na portaria e depuração sem consultar o backend, que é exatamente o modo de operação do piloto.
- `exp` — validade. A tela `08` diz "Válido para o evento de hoje"; a janela vem do evento (`vip_window`), não de um prazo fixo.
- `v` — versionamento, para que a fase 2 possa evoluir o formato sem quebrar QRs já emitidos.

**Não há assinatura criptográfica na v1**, porque não há validador para verificá-la — e gerenciar chave em app distribuído custa mais do que o piloto justifica. Acrescentar um HMAC depois é **aditivo ao payload**, não reescrita: o leitor da fase 2 passa a exigir `v: 2` com o campo extra, e QRs `v: 1` são rejeitados ou aceitos conforme a política da época. Trade-off registrado nos riscos.

Descartados: QR com só o `accessId` opaco — contraria a conferência visual do piloto, que precisa de nome e evento legíveis; QR com JWT assinado em v1 — paga gestão de chave por um validador que não existe.

### Push real: permissão tardia, token por dispositivo, disparo por trigger

Push entra no MVP (decisão de 13/10). Três decisões:

**Permissão pedida tardiamente, no primeiro momento de valor** — depois do primeiro RSVP confirmado, não na abertura do app. Pedir na abertura, antes de o associado entender o que o clube manda, é o jeito conhecido de queimar a permissão de forma irrecuperável no iOS (negada uma vez, só volta pelos Ajustes do sistema). Descartado: pedir no onboarding — converte pior e não dá para repetir.

**Token guardado por dispositivo, não por associado.** Coleção `devices` com `associate_id`, token Expo, plataforma e timestamp. Um associado pode ter telefone e tablet; amarrar o token ao associado perde um dos dois e cria entrega fantasma quando ele troca de aparelho. Tokens inválidos devolvidos pelo serviço de push são removidos no próprio disparo.

**Disparo por Cloud Function em trigger do Firestore**, espelhando os três tipos que o mockup já mostra na tela `14`: evento novo com espaço VIP, presença confirmada, e nova parceria. Cada notificação disparada **também** é escrita em `notifications` — a caixa de entrada in-app é a fonte de verdade do histórico, e não depende de o push ter sido entregue. Isso mantém a tela `14` correta para quem negou a permissão.

### Strava: API paga e com teto de atletas, a partir de 2026

A change anterior tratou o Strava como integração gratuita e sem limite. **Essa premissa está vencida** — o Strava Developer Program mudou em 2026 e impõe duas restrições que afetam o lançamento, não só o orçamento:

**1. A API exige assinatura paga do Strava.** Obrigatória desde 01/06/2026 para desenvolvedores novos no Standard Tier. Apps no Extended Access (10.000+ atletas conectados) são isentos. É um custo recorrente da conta de desenvolvedor, não do app.

**2. O teto de atletas conectados começa em 1.**

```
  App novo         Auto-upgrade        Standard          Extended
  ────────         ────────────        ────────          ────────
  1 atleta   ──▶   10 atletas   ──▶    até 9.999   ──▶   10.000+
                   (sem review)        (review do        (isento da
                                        Strava)           assinatura)
```

O cadastro por Strava é caminho de primeira classe na spec `associate-onboarding`. Com o teto padrão, **o 11º associado não consegue se cadastrar por Strava** — a tela `02` ofereceria um botão que falha. O aumento acima de 10 depende de review do Strava, sem SLA publicado e com relatos recorrentes de pedidos sem resposta.

Consequências para a implementação:

- **Solicitar o aumento de capacidade é tarefa de provisionamento, não de véspera.** Entra junto com o Firebase, não com o build de distribuição.
- **O cadastro por Strava precisa degradar com elegância.** Quando a API recusar a conexão por teto atingido, o app SHALL manter o cadastro por e-mail disponível e explicar que a conexão com o Strava está indisponível no momento — nunca apresentar como falha do app. Enquanto o aumento não sair, essa é a diferença entre um piloto que funciona e um que trava na segunda tela.
- **O teto é de atletas conectados, não de associados.** Só conta quem usa o Strava; quem se cadastra por e-mail não ocupa vaga.

**3. Limite de cache de 7 dias.** A política do Strava restringe o armazenamento de dados da API a sete dias. O modelo de dados guarda `strava.athlete_id` e `username` em `associates` indefinidamente, e importa nome e foto no cadastro. Isso provavelmente se enquadra como dado de perfil do próprio usuário autenticado, e não como cache de dados de atividade — mas **é uma premissa a confirmar na política vigente antes do lançamento**, não uma certeza. Se não se enquadrar, a saída é guardar só o `athlete_id` como chave de vínculo e reconsultar o resto.

### Perfil: edição mínima de nome e foto

A tela `15` tem duas linhas sem tela desenhada. Decisões:

- **"Notificações"** navega para a tela `14` — a mesma do sino no header da Home. Dois pontos de entrada para a mesma tela; não é tela de preferências. Preferências por tipo de notificação ficam para depois de haver taxa de opt-out real para olhar.
- **"Editar dados pessoais"** abre uma tela mínima de **nome e foto**. E-mail e senha ficam fora: mudar e-mail ou senha no Firebase Auth exige reautenticação (`reauthenticateWithCredential`), com fluxo de confirmação, tratamento de `requires-recent-login` e um caminho degradado para quem entrou por Strava e não tem senha. É um dia de trabalho que o cliente não pediu. A linha não é removida nem fica inerte — ela faz algo útil e pequeno.

### Modelo de dados

Coleções achatadas, com os ajustes do escopo de 05/10:

| Coleção         | Campos relevantes                                                                                                                                                                               |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `associates`    | `name`, `email`, `photo_url`, `member_number`, `joined_at`, `membership: { status: free \| member, source, started_at }`, `strava: { connected, athlete_id, username }`                         |
| `events`        | `name`, `modality` (`corrida` \| `trilha` \| `trekking`), `distance`, `starts_at`, `location`, `description`, `organizer` (`base_fox` \| `third_party`), `has_vip`, `vip_window`, `vip_perks[]` |
| `rsvps`         | `associate_id`, `event_id`, `confirmed_at`                                                                                                                                                      |
| `benefits`      | `partner`, `category`, `discount`, `description`, `code`, `external_url`, `usage_note`, `valid_until`, `status` (`active` \| `coming_soon`)                                                     |
| `vip_accesses`  | `associate_id`, `event_id`, `issued_at`, `expires_at`, `revoked_at`                                                                                                                             |
| `notifications` | `associate_id`, `type`, `title`, `body`, `created_at`, `read_at`                                                                                                                                |
| `devices`       | `associate_id`, `push_token`, `platform`, `updated_at`                                                                                                                                          |
| `config`        | `app` (flags), `counters` (número de associado)                                                                                                                                                 |

`products` **não existe** — morreu com a loja.

Duas notas de modelagem:

**`organizer` permanece sem UI de filtro.** Hoje só há eventos próprios, mas o card do mockup já exibe o organizador por nome. Manter o campo custa nada; adicioná-lo depois exigiria migrar os documentos existentes.

**`benefits` tem `code` *e* `external_url`, não um enum entre os dois.** A change anterior modelou `redemption_type: code | referral_link` como formatos mutuamente exclusivos. O único parceiro real contradiz isso: a tela `11` mostra o cupom `BASEFOX15` **e** a ação "Ir para as inscrições" na mesma tela. Os dois campos são independentes e opcionais; a UI mostra as ações que existirem. O cupom é **fixo**, não gerado por associado — a plataforma de ingressos do cliente não suporta cupom dinâmico de uso único, e isso foi aceito como limitação da v1.

### Taxonomia de analytics

Base da change anterior, **sem** os eventos de Loja e **com** os de membership, VIP e push:

| Domínio      | Eventos                                                                                    | Params                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Onboarding   | `onboarding_step_view`, `onboarding_skipped`                                               | `step`                                                                                     |
| Autenticação | `sign_up` *(reservado)*, `login` *(reservado)*, `logout`                                   | `method`: `email` \| `strava`                                                              |
| Início       | `home_viewed`, `next_event_card_tapped`, `vip_teaser_tapped`                               | `event_id`                                                                                 |
| Membership   | `paywall_viewed`, `membership_cta_tapped`, `subscription_confirmed`, `membership_declined` | `source`: `entry_flow` \| `home_banner` \| `event_detail` \| `vip_hub` \| `benefit_detail` |
| Eventos      | `events_filter_applied`, `event_viewed`, `rsvp_confirmed`, `rsvp_cancelled`                | `filter_modality`, `event_id`, `modality`, `has_vip`                                       |
| Espaço VIP   | `vip_hub_viewed`, `vip_access_generated`, `vip_qr_viewed`                                  | `event_id`, `has_access`                                                                   |
| Benefícios   | `benefits_filter_applied`, `benefit_viewed`, `benefit_code_copied`, `benefit_link_opened`  | `category`, `benefit_id`, `partner`, `locked`                                              |
| Strava       | `strava_connected`, `strava_disconnected`                                                  | `source`: `sign_up` \| `profile`                                                           |
| Notificações | `notifications_viewed`, `notifications_marked_read`, `push_permission_result`              | `unread_count`, `granted`                                                                  |

Três notas:

- Os eventos reservados do Firebase (`sign_up`, `login`) são usados onde existem, para aproveitar os relatórios de funil automáticos do console sem configuração extra.
- `screen_view` sai automático do listener `onStateChange` do `@react-navigation` — não se loga troca de aba à mão.
- **Nenhum parâmetro de preço ou valor monetário em nenhum evento.** O `price` que a taxonomia antiga mandava em `order_whatsapp_initiated` morreu com a loja e não ressuscita em `subscription_confirmed`.

O param `source` de `paywall_viewed` é o que torna a taxonomia útil comercialmente: ele responde *qual tela vende a assinatura*, que é a pergunta do piloto. Instrumentá-lo mal esvazia o resto.

### Sentry: configuração mínima viável

`Sentry.init` com `environment` (dev/staging/prod) e `release` (versão do build EAS); error boundary no componente raiz; contexto de usuário pós-login usando `associate_id` interno — **nunca e-mail em texto puro**; breadcrumbs automáticos de navegação ligados.

### Navegação

Tab bar de 5 abas — **Início · Eventos · Espaço VIP · Benefícios · Perfil** — com a aba central (Espaço VIP) destacada em botão elevado, conforme `design/BFTabBar.dc.html`. Telas de detalhe empilham sobre a aba de origem. Fluxo de entrada: Onboarding → Cadastro → Torne-se membro *(pulável, e ausente com a flag desligada)* → Início.

## Risks / Trade-offs

- **[Risco] QR sem assinatura criptográfica pode ser fotografado e reapresentado por terceiro.** → **Mitigação**: aceito no piloto, onde a conferência é visual e o QR traz o nome do associado — quem apresenta precisa bater com quem está escrito. O HMAC é aditivo ao payload (`v: 2`) quando o leitor da fase 2 existir.
- **[Risco] A flag de membership desligada esconde todo o funil comercial, inclusive dos dados.** → **Mitigação**: `paywall_viewed` e `subscription_confirmed` não disparam no piloto por definição, então não haverá baseline de conversão antes de ligar a flag. Registrar essa expectativa com o cliente, para que a ausência de dados não seja lida como falha de instrumentação.
- **[Risco] Permissão de push negada é praticamente irreversível no iOS.** → **Mitigação**: pedido tardio, após o primeiro RSVP; a caixa in-app (`14`) continua completa para quem negou, então nenhuma informação se perde.
- **[Risco] O teto de 10 atletas conectados do Strava trava o cadastro por Strava já no piloto.** → **Mitigação**: solicitar o aumento de capacidade no provisionamento, não na véspera; e fazer o cadastro por Strava degradar com elegância para o cadastro por e-mail quando a API recusar por teto. Sem SLA do Strava, a degradação é a única mitigação sob nosso controle.
- **[Risco] A assinatura paga do Strava é um custo recorrente que a change anterior não previa.** → **Mitigação**: valor baixo frente ao orçamento, mas precisa estar no levantamento de custos entregue ao cliente e vinculado a uma conta de desenvolvedor com dono definido — a mesma pendência de titularidade da App Store.
- **[Risco] O limite de cache de 7 dias do Strava pode conflitar com guardar nome, foto e username em `associates`.** → **Mitigação**: confirmar o enquadramento na política vigente antes do lançamento; se não couber, guardar apenas o `athlete_id` como chave de vínculo.
- **[Risco] A chave APNs depende de uma conta paga do Apple Developer cuja titularidade não foi decidida.** → **Mitigação**: push é a última capability na ordem das tarefas; tudo antes dela roda em Android e em dev build iOS. Mas a decisão precisa sair antes do primeiro build de distribuição — está no caminho crítico, não na cauda.
- **[Risco] Dev client desde o início elimina o Expo Go, encarecendo o setup de qualquer pessoa nova no projeto.** → **Mitigação**: é consequência inevitável de Analytics + push; o custo é um build de dev client por plataforma, reaproveitável.
- **[Risco] Modelagem achatada pode não ser o padrão de leitura mais eficiente no Firestore para todos os casos.** → **Mitigação**: modelar sobre os padrões de leitura que o mockup já exibe, sem especular além; revisitar só se o piloto expuser problema real.
- **[Risco] A camada de repositório adiciona esforço inicial de estrutura.** → **Mitigação**: mantê-la fina (funções simples por coleção), sem construir ORM — o custo extra é próximo de zero.
- **[Risco] Auth ficar permanentemente preso ao Firebase.** → **Mitigação**: aceito conscientemente como decisão documentada, não descuido.
- **[Risco] Analytics e Sentry separados não dão visão unificada.** → **Mitigação**: aceitável na escala do piloto; consolidar só se virar problema real.
- **[Risco] O cupom fixo `BASEFOX15` não permite atribuir uso a associado nem detectar vazamento público.** → **Mitigação**: limitação aceita da v1 por restrição da plataforma de ingressos do cliente; `benefit_code_copied` dá o proxy de intenção, não de uso.
- **[Risco] Eventos e benefícios cadastrados à mão no console do Firestore são frágeis** (um campo errado quebra a tela em produção, sem validação). → **Mitigação**: regras de segurança e um script de seed versionado para o piloto; a necessidade de painel admin fica em aberto.
- **[Risco] 17/10 como data de lançamento.** → **Mitigação**: tratado como *stretch*, nunca como compromisso — o próprio cliente pediu isso e citou 07/11 e 05/12 como alternativas reais. A ordem das tarefas preserva o caminho de demonstração (Entrada → Eventos → Espaço VIP) para que um corte de prazo corte das pontas, não do meio.

## Plano de lançamento

Greenfield — não há migração de dados nem rollback de schema. O que existe é uma sequência de ligações:

1. **Piloto com a flag de membership desligada.** Todos entram e usam tudo; o app serve como ambiente de teste real. Nenhum caminho de assinatura é alcançável.
2. **Ligar a flag** quando o cliente decidir cobrar — mudança de configuração remota, sem build. É aqui que `03`, `12` e `13` entram no grafo de rotas e o funil comercial começa a gerar dados.
3. **Fase 2** — leitor do host para validar o QR, e cobrança de verdade (processador ainda indefinido).

Rollback de qualquer passo é a operação inversa da flag, exceto a fase 2, que é build novo.

## Open Questions

- **Onde o valor da flag de membership fica guardado?** As duas opções vivas: documento `config/app` no Firestore lido pelo `configRepository` (nenhuma dependência nativa nova, cliente liga pelo console, já respeita a camada de repositório obrigatória) ou **Firebase Remote Config** (produto feito para flags, com rollout por porcentagem e segmentação por audiência que ninguém pediu, e um segundo mecanismo de configuração convivendo com o Firestore). Não bloqueia nenhuma tarefa — o `configRepository` esconde a origem — e deve ser resolvido ao provisionar o Firebase. Variável de ambiente no build EAS já está descartada: viola o requisito de desligar sem novo build.
- **Projeto Firebase único ou separado por ambiente** (dev/staging/prod)?
- **Painel admin mínimo?** Eventos e benefícios são cadastrados à mão no piloto. Avaliar se o console do Firestore basta ou se vale um admin enxuto antes do lançamento.
- **Titularidade da conta de publicação nas lojas e da infraestrutura Firebase** — Oreggia Tech ou cliente. O cliente só não quer aparecer como publicador. Agora com prazo: a chave APNs depende disso.
- **Processador de pagamento.** Direção tentativa: **Mercado Pago**, conta do cliente (substituindo a hipótese anterior de Cielo/PagSeguro). Pendente de uma conversa técnica a três com o freelancer que integrou o site de inscrições do cliente (William). Restrição: o checkout não pode expor a marca Kailash nem o nome do cliente. Como não há cobrança na v1, não bloqueia nada agora.
- **Preço da mensalidade** — não definido. Não assumir nenhum valor em nenhum artefato, mock ou teste.
- **Destino real de uma futura migração de backend** (Postgres próprio, Supabase, outro)? Não precisa ser decidido agora — a camada de repositório já reduz o custo de decidir depois.
