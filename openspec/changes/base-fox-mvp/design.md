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

**Onde o valor da flag fica guardado foi resolvido na implementação: documento `config/app` no Firestore** (ver Open Questions). A decisão acima não depende disso: o `configRepository` expõe `membershipEnabled` e a origem do dado é detalhe de implementação atrás dele. Alternativa já descartada: variável de ambiente no build EAS — viola o requisito, porque ligar a cobrança exigiria novo build e nova review.

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

### Autenticação: três caminhos, e o e-mail como chave de recuperação

O cadastro por Strava cria uma conta **sem senha**. Enquanto o Strava for a única credencial dessa pessoa, qualquer indisponibilidade da API — teto de atletas atingido, review pendente, conta da aplicação trocada — deixa de ser degradação de funcionalidade e vira **tranca na própria conta** ao reinstalar o app ou trocar de aparelho.

Agrava isso o fato de que **o Strava removeu o e-mail da API em janeiro de 2019** e nenhum escopo atual o devolve. Um associado cadastrado só por Strava não teria, por padrão, nenhum dado de contato no sistema — portanto nenhum canal de recuperação.

Decisão, em três partes:

**1. E-mail obrigatório em todos os caminhos de cadastro**, inclusive no cadastro por Strava, onde precisa ser digitado pelo associado por não vir da API. Verificado por e-mail de confirmação.

**2. Senha opcional.** Pedir senha num cadastro de um toque desfaz a vantagem do Strava. Quem quiser define no cadastro ou depois, no Perfil.

**3. Login por link de e-mail como terceiro caminho de entrada.** É o que torna a senha *genuinamente* opcional:

```
   Strava            rápido, mas sujeito ao teto de atletas
   E-mail + senha    para quem definiu senha
   Link por e-mail   rede de segurança — sempre funciona
```

Sem o terceiro caminho, "senha opcional" é uma armadilha: quem pula a senha — que será a maioria, por ser o caminho de menor atrito — continua com o Strava como credencial única, e o problema persiste inteiro. O Firebase Auth oferece o provedor de link por e-mail nativamente; o custo é habilitá-lo, tratar o deep link de retorno e uma tela.

**Consequência extra, não planejada mas valiosa:** com e-mail obrigatório nos dois caminhos de cadastro, ele vira **chave de reconciliação entre eles**. Sem isso, a mesma pessoa que se cadastra pelo Strava e depois tenta entrar pelo e-mail vira dois associados, com dois números e dois históricos de presença. Num clube, onde as pessoas trocam de celular e tentam "do outro jeito", essa colisão aconteceria no piloto.

Nota de implementação: **definir** uma senha numa conta que não tem nenhuma é operação mais leve que **trocar** uma existente — é o que permite oferecê-la no Perfil, apesar de a edição de e-mail e senha estar fora desta versão. Ainda assim pode exigir login recente; confirmar antes de prometer o fluxo ao associado.

### Titularidade: Oreggia Tech publica, com contas pessoais

Decidido em 18/10/2026, encerrando a pendência que vinha do briefing §8.

**Quem publica: Oreggia Tech**, com **contas pessoais** na Apple e no Google Play — não contas de organização. A troca que isso representa:

| | Organização | Pessoal (escolhido) |
| --- | --- | --- |
| D-U-N-S | até 30 dias, bloqueia as duas lojas | não exige |
| Apple — matrícula | 2 a 4 semanas | 24 a 48 horas |
| Google Play — 12 testadores × 14 dias | isento | obrigatório |
| Nome exibido na ficha | Oreggia Tech | **Apple:** nome legal · **Google Play:** nome livre ("Oreggia Tech") **+ razão social legal no perfil público** |

> **Verificado no cadastro em 06/11/2026.** A linha acima dizia apenas "nome legal pessoal" para as duas lojas; a realidade é diferente em cada uma.
>
> **Apple:** o *seller* de pessoa física é o nome do documento, sem alternativa.
>
> **Google Play:** são **dois campos distintos**. O *nome de desenvolvedor* é livre e editável depois — o console diz que "não precisa ser igual ao seu nome" — e usamos **Oreggia Tech**. Mas o *perfil público* exibe também a **razão social legal** (`ULI PORTO OREGGIA`) e o país. Logo o nome legal aparece de qualquer forma, só não como rótulo do app.
>
> ⚠️ **Consequência para a fase 2:** o console adverte que *"se você optar por ganhar dinheiro, seu endereço oficial completo será exibido publicamente"*. Enquanto a mensalidade for confirmada sem cobrança, nada muda. **No dia em que a assinatura virar cobrança real, o endereço residencial do titular passa a ser público na ficha da Play Store.** Isso pesa na pergunta em aberto sobre converter para conta de organização, que até agora só considerava o nome exibido.

O ganho decisivo é o iOS: TestFlight destravado em dois dias em vez de um mês, sem depender do D-U-N-S. O custo é a regra dos 12 testadores do Google Play, que se aplica a contas pessoais criadas após 13/11/2023.

**Essa regra não é um bloqueio sequencial, e tratá-la como tal é o erro a evitar.** O relógio de 14 dias corridos começa quando o Google aprova a versão de teste fechado e 12 pessoas aderem — não exige app pronto. Uma build incompleta mas instalável já inicia a contagem. Logo: **subir algo para teste fechado cedo é tarefa de começo de projeto**, paralela ao desenvolvimento, não de véspera. Quem sai e volta reinicia a própria contagem, então os testadores precisam ser avisados a não desinstalar.

O recrutamento dos 12 é o problema mais fácil do projeto: o cliente é dono de um clube de corrida.

### Conta do Strava: dedicada, e escolhida de uma vez

Uma aplicação de API do Strava vive numa **conta pessoal de atleta** — não existe conta de organização — e vale **uma chave por conta**. Não há mecanismo documentado de transferência entre contas.

Decisão: **criar uma conta Strava dedicada**, com e-mail da Oreggia Tech, em vez de usar uma conta pessoal de corrida. A assinatura paga fica nela, e uma eventual passagem do projeto ao cliente se dá por entrega de credenciais — que é o único caminho possível na ausência de transferência.

A escolha é irreversível na prática, e o motivo não é o que parece. Trocar de conta depois significa **nova aplicação, novo `client_id`**, e portanto:

| Consequência | Gravidade |
| --- | --- |
| Todos os tokens emitidos morrem — tokens são por `client_id` | recuperável: um toque em "Conectar" |
| Associados precisam reautorizar | recuperável |
| Associados são deslogados do app | **não acontece** — a sessão é Firebase Auth, não Strava |
| Contas duplicadas após reautorizar | **não acontece** — o `athlete_id` é global do Strava, reconcilia no mesmo registro |
| Nova publicação nas lojas | **evitável** — ver decisão abaixo |
| **A aprovação de capacidade não acompanha** | **o custo real**: volta-se ao teto de 10 e à fila de review, sem prazo |

A última linha é a que trava: a aprovação é concedida à aplicação, não ao desenvolvedor. Por isso a conta precisa estar escolhida **antes** do pedido de capacidade.

**O `client_id` do Strava fica em `config/app`, lido pelo `configRepository`** — o mesmo documento e a mesma camada da flag de membership. O `client_secret` é exclusivamente de servidor, usado na troca de código por token dentro de uma Cloud Function, e nunca embarcado no app.

Isso transforma "trocar a aplicação do Strava" de **nova publicação com review de loja** em **edição de um campo no console do Firestore**. É a mesma lógica da camada de repositório: proteção barata paga hoje contra uma troca que já se sabe possível. Cravar o `client_id` no binário custaria o mesmo para escrever e um build mais a review da App Store para desfazer.

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

### Firebase: três projetos, e o Firestore em São Paulo

Provisionado em 25/10/2026, na conta Google **`oreggia.tech@gmail.com`** — mesma lógica de titularidade do Strava e da Apple.

Um projeto por ambiente, com os IDs já fixados no `.firebaserc`:

| Ambiente | Project ID | Bundle / package |
| --- | --- | --- |
| development | `base-fox-sport-club-dev` | `club.basefox.app.dev` |
| staging | `base-fox-sport-club-staging` | `club.basefox.app.staging` |
| production | `base-fox-sport-club-prod` | `club.basefox.app` |

**O Firestore fica em `southamerica-east1` (São Paulo), e essa escolha não tem desfazer** — o console avisa que o local não pode ser alterado depois, e trocar significaria recriar o projeto. Os números que sustentam a decisão, conferidos na tabela de preços da Standard edition:

| | us-central1 | southamerica-east1 |
| --- | --- | --- |
| 100 mil leituras | US$ 0,03 | US$ 0,045 |
| 100 mil gravações | US$ 0,09 | US$ 0,135 |
| Armazenamento (GiB·dia) | US$ 0,000205 | US$ 0,000185 |
| Cota gratuita diária | 50k leituras · 20k gravações · 1 GiB | **idêntica** |

São Paulo custa 1,5× por operação e paga isso com latência de dezenas de ms em vez de ~120–150 ms por ida e volta — para uma base de usuários inteiramente brasileira que lê a cada abertura de tela. No piloto o custo é nulo de qualquer forma: tudo cabe na cota gratuita, que não varia por região. A assimetria só aparece em escala, e nessa altura a migração de backend já prevista no Context volta à mesa.

Nota: a gratuidade **do Cloud Storage** é que é restrita a `us-central1`, `us-west1` e `us-east1`. Storage não está no escopo desta change; se entrar, o bucket é uma decisão de região separada da do Firestore.

Banco criado em **modo de produção** (`allow read, write: if false`) — as regras reais entram por deploy do `firestore.rules`, nunca pelo console.

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
| `config`        | `app` (flag de membership, `client_id` do Strava), `counters` (número de associado)                                                                                                                                                 |

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
| Membership   | `paywall_viewed`, `membership_cta_tapped`, `subscription_confirmed`, `membership_declined` | `source`: `entry_flow` \| `home_banner` \| `event_detail` \| `vip_hub` \| `benefit_detail` \| `profile` |
| Eventos      | `events_filter_applied`, `event_viewed`, `rsvp_confirmed`, `rsvp_cancelled`                | `filter_modality`, `event_id`, `modality`, `has_vip`                                       |
| Espaço VIP   | `vip_hub_viewed`, `vip_access_generated`, `vip_qr_viewed`                                  | `event_id`, `has_access`                                                                   |
| Benefícios   | `benefits_filter_applied`, `benefit_viewed`, `benefit_code_copied`, `benefit_link_opened`  | `category`, `benefit_id`, `partner`, `locked`                                              |
| Strava       | `strava_connected`, `strava_disconnected`                                                  | `source`: `sign_up` \| `profile`                                                           |
| Notificações | `notifications_viewed`, `notifications_marked_read`, `push_permission_result`              | `unread_count`, `granted`                                                                  |

Três notas:

- Os eventos reservados do Firebase (`sign_up`, `login`) são usados onde existem, para aproveitar os relatórios de funil automáticos do console sem configuração extra.
- `screen_view` sai automático do listener `onStateChange` do `@react-navigation` — não se loga troca de aba à mão.
- **`profile` foi acrescentado como sexta origem na implementação (24/10/2026)**, exigido pela tarefa 8.2 ("acesso ao fluxo de assinatura quando aplicável" a partir do item Assinatura do Perfil). A tabela de sete pontos de gate acima descreve comportamento de gate, não a lista fechada de origens de paywall. Reaproveitar o `source` de outra tela foi explicitamente rejeitado: corromperia o parâmetro que responde *qual tela vende a assinatura*.
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
- **[Risco] O teto do Strava não bloqueia só cadastros novos — tranca associados existentes para fora da própria conta.** Quem se cadastrou por Strava e não definiu senha tem o Strava como credencial única; se a autorização falhar por teto, não consegue entrar ao reinstalar o app ou trocar de aparelho. → **Mitigação**: e-mail obrigatório no cadastro e login por link de e-mail como terceiro caminho de entrada, que funciona independente do Strava.
- **[Risco] A regra dos 12 testadores do Google Play vira bloqueio sequencial se tratada como tarefa de véspera.** → **Mitigação**: subir uma build instalável para teste fechado no começo do projeto, para que o relógio de 14 dias rode em paralelo ao desenvolvimento. Avisar os testadores a não desinstalar — sair e voltar reinicia a contagem individual.
- **[Risco] O teto de 10 atletas conectados do Strava trava o cadastro por Strava já no piloto.** → **Mitigação**: solicitar o aumento de capacidade no provisionamento, não na véspera; e fazer o cadastro por Strava degradar com elegância para o cadastro por e-mail quando a API recusar por teto. Sem SLA do Strava, a degradação é a única mitigação sob nosso controle.
- **[Risco] A assinatura paga do Strava é um custo recorrente que a change anterior não previa.** → **Mitigação**: valor baixo frente ao orçamento, mas precisa estar no levantamento de custos entregue ao cliente e vinculado a uma conta de desenvolvedor com dono definido — a mesma pendência de titularidade da App Store.
- **[Risco] O limite de cache de 7 dias do Strava pode conflitar com guardar nome, foto e username em `associates`.** → **Mitigação**: confirmar o enquadramento na política vigente antes do lançamento; se não couber, guardar apenas o `athlete_id` como chave de vínculo.
- **[Risco] A chave APNs depende de uma conta paga do Apple Developer cuja titularidade não foi decidida.** → **Mitigação**: push é a última capability na ordem das tarefas; tudo antes dela roda em Android e em dev build iOS. Mas a decisão precisa sair antes do primeiro build de distribuição — está no caminho crítico, não na cauda.
- **[Risco descoberto na implementação, 25/10/2026] O SDK nativo do Firebase e o toolchain Kotlin do Expo SDK 58 não casam.** O `firebase-auth` moderno traz metadados Kotlin 2.4, que o compilador 2.2.10 fixado pelo Expo não lê; baixar o BoM do Firebase conserta o Auth e quebra o Firestore, porque o módulo `firestore` do `@react-native-firebase` v27 exige APIs de `SearchStage` que só existem no SDK novo. → **Mitigação aplicada**: o config plugin `scripts/withFirebaseAuthVersionForce.js` força **apenas** o artefato `firebase-auth` para uma versão com metadados legíveis, mantendo o resto do SDK moderno. Validado com `BUILD SUCCESSFUL` e APK gerado. O plugin deve ser removido quando o `@react-native-firebase` publicar um `auth` compilado com um Kotlin que o projeto consiga ler — o próprio arquivo documenta isso.
- **[Risco descoberto na implementação, 25/10/2026] Build local para as 4 arquiteturas satura a máquina de desenvolvimento.** O build morreu duas vezes na fase CMake/NDK após ~10 minutos, travando o computador. → **Mitigação**: build local de desenvolvimento restrito à ABI do aparelho conectado (`-PreactNativeArchitectures=arm64-v8a` no `scripts/android-run.sh`), que fecha em ~3 minutos. **Builds de distribuição (EAS, Google Play) continuam exigindo todas as arquiteturas** — um APK arm64-only na loja excluiria aparelhos.
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

- **~~Onde o valor da flag de membership fica guardado?~~ Resolvido na implementação (24/10/2026): documento `config/app` no Firestore, lido pelo `configRepository`.** Descartado o **Firebase Remote Config** — traria rollout por porcentagem e segmentação por audiência que ninguém pediu, e um segundo mecanismo de configuração convivendo com o Firestore. O `client_id` do Strava vive no mesmo documento (tarefa 1.9a), então a flag não introduz origem de configuração nova. Variável de ambiente no build EAS seguia descartada: viola o requisito de desligar sem novo build.
- **~~Projeto Firebase único ou separado por ambiente~~ Resolvido na implementação (24/10/2026): três projetos (dev/staging/prod).** O `app.config.ts` deriva de `APP_ENV` o projeto, o nome exibido e o bundle id — `club.basefox.app` em produção, com sufixos `.dev` e `.staging`, para que os três possam coexistir no mesmo aparelho. Os ids em `.firebaserc` são placeholders até o provisionamento.
- **A conversão de conta Apple individual para organização vale a pena no futuro?** Hoje publicamos como pessoa física, o que expõe o nome legal pessoal na ficha da App Store. A Apple tem um processo de conversão, mas suas condições e prazo não foram verificados — e se for custoso, seriam duas matrículas de US$ 99. Reavaliar quando a marca Base Fox tiver tração.
- **Definir senha numa conta sem senha exige login recente?** Decide se o fluxo de "definir senha" no Perfil pode ser oferecido direto ou precisa de etapa de confirmação. Confirmar na implementação antes de prometer o fluxo ao associado.
- **Painel admin mínimo?** Eventos e benefícios são cadastrados à mão no piloto. Avaliar se o console do Firestore basta ou se vale um admin enxuto antes do lançamento.
- **Processador de pagamento.** Direção tentativa: **Mercado Pago**, conta do cliente (substituindo a hipótese anterior de Cielo/PagSeguro). Pendente de uma conversa técnica a três com o freelancer que integrou o site de inscrições do cliente (William). Restrição: o checkout não pode expor a marca Kailash nem o nome do cliente. Como não há cobrança na v1, não bloqueia nada agora.
- **Preço da mensalidade** — não definido. Não assumir nenhum valor em nenhum artefato, mock ou teste.
- **Destino real de uma futura migração de backend** (Postgres próprio, Supabase, outro)? Não precisa ser decidido agora — a camada de repositório já reduz o custo de decidir depois.
