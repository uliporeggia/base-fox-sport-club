## Context

O MVP do app The Crew já está validado em produto (deck + protótipo navegável no Claude Design), mas o repositório está vazio de código. Este design fixa como as 7 capabilities do MVP serão construídas, com foco em duas tensões centrais levantadas na exploração que originou esta proposta:

1. O próprio critério de corte do MVP exige **custo mínimo de desenvolvimento** — logo, nenhuma decisão aqui deve introduzir complexidade que só se paga num cenário de escala que ainda não existe.
2. Ao mesmo tempo, **o crescimento do app é esperado**, e uma migração de backend (Firebase → backend próprio) é vista como praticamente certa no médio prazo, motivada por **funcionalidade** (limites do Firestore para relatórios/BI) e **custo de escala** — não por compliance/LGPD.

O design resolve essa tensão pagando apenas as proteções baratas contra migração agora, e adiando as caras.

## Goals / Non-Goals

**Goals:**
- Definir a stack de implementação (RN/Expo + Firebase) e a estrutura de acesso a dados que reduz o custo de uma futura migração de backend.
- Fixar a taxonomia de eventos comerciais (Firebase Analytics) e a estratégia de monitoramento de erros (Sentry).
- Mapear as 13 telas do protótipo para uma estrutura de navegação concreta.
- Deixar explícito o que é decisão consciente de não generalizar agora (ex.: Auth).

**Non-Goals:**
- Desenhar a arquitetura do backend de destino de uma futura migração (Postgres próprio, Supabase, etc.) — decisão adiada por não ser urgente.
- Especificar pagamento nativo, mapa geolocalizado, check-in via QR code ou gamificação — fora do MVP por decisão de produto (v2).
- Definir pipeline de CI/CD e ambientes de deploy em detalhe — tratado como detalhe operacional, não arquitetural.

## Decisions

**Stack do app: React Native + Expo (managed workflow).**
Alinhado ao stack forte da equipe (React/React Native), permite um único código para iOS e Android, e OTA update simplificado via EAS. Alternativas descartadas: app nativo separado (Swift/Kotlin) — contradiz o critério de custo mínimo do próprio MVP, dobrando o esforço; PWA — descartado porque push notification e Strava OAuth ficam frágeis em iOS.

**Backend do MVP: Firebase (Firestore + Firebase Auth + Cloud Functions).**
Serviço gerenciado, sem servidor próprio, cobre login/banco/push com custo zero na escala de um piloto. Aceito como decisão do cliente, mesmo sabendo que uma migração futura é esperada — as demais decisões deste design existem justamente para tornar essa migração menos custosa quando chegar a hora.

**Camada de acesso a dados obrigatória (repository/service layer).**
Nenhuma tela ou componente de UI chama o SDK do Firestore diretamente — toda leitura/escrita passa por um módulo de acesso a dados por domínio (ex.: `activationsRepository`, `benefitsRepository`). Isso é seguro porque é uma proteção barata (é só uma questão de onde o código é colocado, não de esforço extra real) contra exatamente os dois gatilhos de migração esperados (funcionalidade e custo). Alternativa descartada: chamar Firestore direto das telas — mais rápido para escrever hoje, mas transforma a futura migração numa reescrita de toda a UI.

**Modelagem "achatada" no Firestore.**
Coleções por domínio (`events`, `benefits`, `products`, `associates`) sem subcollections profundas específicas de NoSQL, denormalizando apenas o necessário para os padrões de leitura que já existem no protótipo (ex.: lista de eventos com filtro por tipo). A coleção `events` inclui um campo `organizer` (`the_crew` | `third_party`), já que a maior parte do volume esperado de ativações vem de eventos de terceiros e o filtro por organizador é um requisito de produto (ver spec `activation-calendar`). A coleção `benefits` inclui um campo `redemption_type` (`code` | `referral_link`) — cada parceiro escolhe o formato de resgate, e os dois coexistem (ver spec `partner-benefits`). Facilita um export/ETL futuro para um destino relacional, sem pagar o custo de desenhar um schema relacional completo agora.

**Firebase Auth permanece, mesmo após uma eventual migração do backend de dados.**
Migrar autenticação (hashes de senha, sessões) é desproporcionalmente caro frente ao benefício — é um padrão comum de mercado manter Auth no provedor original enquanto o backend de dados migra separadamente. Por isso, Auth fica explicitamente fora do escopo de portabilidade desta proposta: não vale generalizar essa camada agora.

**Cloud Functions escritas como lógica Node/TS portável.**
Regras de negócio isoladas em módulos que recebem dados e retornam resultado, com o *trigger* do Firestore como uma camada fina de entrada/saída — para que, numa futura migração de hosting, a lógica sobreviva quase sem reescrita.

**Observabilidade: Firebase Analytics (métricas comerciais) + Sentry (erros/crashes).**
Firebase Crashlytics foi descartado porque não funciona no Expo Go, exigindo dev client customizado (EAS Build) desde o início — o que contradiz a escolha de ficar no Expo gerenciado durante o MVP. Sentry funciona nativamente com o SDK do Expo.

**Taxonomia de eventos fixada, ancorada nas interações reais do protótipo:**

| Domínio | Eventos | Params |
|---|---|---|
| Onboarding | `onboarding_step_view`, `onboarding_skipped` | `step` |
| Autenticação | `sign_up` *(reservado)*, `login` *(reservado)* | `method`: `email`\|`strava` |
| Início | `home_viewed`, `next_event_card_tapped`, `featured_benefit_card_tapped` | `event_id`, `benefit_id` |
| Ativações | `calendar_filter_applied`, `event_viewed`, `rsvp_confirmed`, `rsvp_cancelled` | `filter_type`, `event_id`, `event_type` |
| Benefícios | `benefits_filter_applied`, `benefit_viewed`, `benefit_code_copied`, `benefit_referral_opened` | `category`, `benefit_id`, `partner` |
| Loja | `product_viewed`, `order_whatsapp_initiated` | `product_id`, `product_name`, `price` |
| Strava | `strava_connected`, `strava_disconnected` | `source`: `home_banner`\|`profile` |
| Perfil | `logout` | — |
| Notificações | `notifications_viewed` | `unread_count` |

Uso dos eventos reservados do Firebase (`sign_up`, `login`) onde existem, para aproveitar os relatórios de funil automáticos do console sem configuração extra. Navegação usa `screen_view` automático via listener do `@react-navigation` (`onStateChange`) em vez de logar troca de aba manualmente.

**Sentry: configuração mínima viável.**
`Sentry.init` com `environment` (dev/staging/prod) e `release` (versão do build EAS); error boundary no componente raiz; contexto de usuário pós-login usando um `associate_id` interno — nunca e-mail em texto puro; breadcrumbs automáticos de navegação ligados.

**Navegação: tab bar com 5 abas (Início, Ativações, Benefícios, Loja, Perfil), replicando a estrutura do protótipo**, com telas de detalhe empilhadas sobre cada aba (calendário → detalhe do evento; benefícios → detalhe; loja → detalhe do produto).

**Checkout da loja sem gateway de pagamento.**
Pedido finalizado via deep link do WhatsApp (`wa.me`) com dados do produto pré-preenchidos, replicando o estado "Pedido enviado!" do protótipo. Validação de demanda antes de qualquer investimento em gateway — consistente com o critério de corte do MVP.

## Risks / Trade-offs

- **[Risco]** Modelagem "achatada" pode não ser o padrão de leitura mais eficiente no Firestore para todos os casos → **Mitigação**: modelar em cima dos padrões de leitura que já existem no protótipo (não especular além disso); revisitar só se o piloto expuser problema real de performance.
- **[Risco]** A camada de acesso a dados adiciona um pequeno esforço inicial de estrutura → **Mitigação**: mantê-la fina (funções simples por coleção), sem construir um ORM completo — o custo extra é próximo de zero.
- **[Risco]** Auth ficar permanentemente preso ao Firebase → **Mitigação**: aceito conscientemente aqui como decisão documentada, não como descuido — é uma troca deliberada de custo de migração por velocidade de entrega agora.
- **[Risco]** Duas ferramentas de observabilidade separadas (Analytics + Sentry) não dão uma visão unificada → **Mitigação**: aceitável na escala de um piloto; considerar consolidar (ex. PostHog) só se isso virar um problema real.
- **[Risco]** Checkout via WhatsApp não escala operacionalmente além de um certo volume de pedidos (atendimento manual) → **Mitigação**: escolha deliberada do MVP — pagamento nativo é item explícito da v2, só depois de validar demanda.
- **[Risco]** Os gatilhos de migração (funcionalidade/custo) não têm métrica automática de alerta → **Mitigação**: tratado como acompanhamento operacional (revisão periódica de uso/custo do Firestore e do console de Analytics), não como requisito de código nesta proposta.

## Open Questions

- Qual será o destino real de uma futura migração de backend (Postgres próprio, Supabase, outro)? Não precisa ser decidido agora — a camada de abstração já reduz o custo de decidir depois.
- Um projeto Firebase único ou projetos separados por ambiente (dev/staging/prod)?
- Eventos, benefícios e produtos são "cadastrados à mão" no MVP (conforme o deck) — isso basta via console do Firestore para o piloto, ou vale um painel admin mínimo antes do lançamento?
- **Cobrança de anuidade/evento avulso (stretch, não bloqueia o MVP)**: o cliente pediu, se possível, algum caminho de cobrança já na primeira versão — nem que seja só um link de PIX — em vez de deixar 100% para v2. O padrão discutido é redirecionamento externo (app gera o pedido → sai para um checkout fora do app → webhook de confirmação marca o associado como pago), não um gateway nativo. Está bloqueado por uma decisão externa ainda não feita: qual processador usar (o site de inscrições do cliente já usa Cielo; alternativa cogitada foi PagSeguro/Mercado Pago) e em qual conta (o cliente não quer que o checkout exponha a marca "Kailash"/nome dele, já que o The Crew precisa parecer uma marca independente). Essa decisão depende de uma conversa técnica a três (cliente, Oreggia Tech e o freelancer que já integrou o site do cliente com a Cielo). Sem prazo definido — o próprio cliente aceita adiar para novembro/dezembro.
- **Conta de publicação nas lojas e titularidade da infraestrutura**: ainda não decidido se o app é publicado na App Store/Play Store sob a conta da Oreggia Tech ou do cliente (o cliente não se importa, só não quer aparecer como publicador), nem quem arca com a manutenção mensal do projeto Firebase.
