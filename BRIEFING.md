# Briefing de implementação — Base Fox Sport Club (MVP)

**Status:** ponto de partida para a implementação. Escrito em 08/10/2026, consolidando o deck/protótipo
de 04/09, a reunião de fechamento de escopo com o cliente de 05/10 e o mockup final importado do
Claude Design em 08/10 (`design/`).

**Fonte de verdade de escopo e UI:** `design/Base Fox - Mockup MVP-print.dc.html` (15 telas,
inventário em `design/README.md`). Onde este briefing e o mockup divergirem, o mockup vence.

> ⚠️ **A change OpenSpec `openspec/changes/the-crew-mvp/` está desatualizada.** Foi escrita a partir
> do protótipo anterior ("The Crew", 13 telas), antes da reunião de 05/10. Suas **decisões de
> arquitetura continuam válidas** (ver §5), mas escopo, marca e capabilities não. Não implemente a
> partir dela. O próximo passo recomendado é rodar `/opsx:propose` para gerar uma change nova a
> partir deste briefing — ver §9.

---

## 1. O produto

**Base Fox Sport Club** é um clube de associados para corredores e praticantes de esporte outdoor
(corrida de rua, trilha, trekking). O clube não tem sede fixa: ele se desloca, montando um **espaço
VIP próprio dentro de eventos esportivos**. O app é o cartão de associado — mostra onde o clube vai
estar, dá acesso ao espaço VIP e reúne os benefícios de parceiros.

**Modelo de negócio:** plano gratuito (qualquer um se cadastra e navega) + plano de membro pago por
mensalidade. O gancho de conversão é o **acesso ao espaço VIP**, onde o membro consome cortesias
(café, cerveja, food truck). Essa é a tese comercial inteira do app — o resto da UI existe para
sustentá-la.

**Restrição dura de marca:** o app não pode exibir nenhuma menção a outras marcas do grupo do
cliente — **nada de "Kailash", "XKR" ou "KTR"** em logos, nomes, copy, rodapés, metadados de loja,
nome do pacote ou e-mails transacionais. O Base Fox precisa parecer uma marca independente, porque
vai negociar parcerias com marcas concorrentes dessas. Isso é requisito do cliente, não preferência
estética.

---

## 2. Escopo do MVP

### Dentro

| Área | O que entra |
| --- | --- |
| Entrada | Onboarding (3 passos, pulável), cadastro/login por e-mail/senha **ou** Strava OAuth |
| Membership | Estados gratuito vs. membro em toda a UI, paywall contextual, confirmação de assinatura **sem checkout** |
| Eventos | Lista com filtro por modalidade, detalhe, confirmação de presença (RSVP) |
| Espaço VIP | Hub da aba (bloqueado para gratuito) + **geração e exibição do QR code de acesso** |
| Benefícios | Catálogo com categorias, desconto mascarado para gratuito, detalhe com cupom, placeholders "Em breve" |
| Conta | Notificações, perfil, conexão/desconexão do Strava |
| Observabilidade | Firebase Analytics (funil comercial) + Sentry (erros/crashes) |

### Fora — não implementar

- **Loja / catálogo de produtos / checkout por WhatsApp.** Cortada explicitamente pelo cliente em
  05/10 ("vamos fazer um avião só com os eventos"). A capability `club-store` da change antiga está
  **morta**: some a 5ª aba "Loja", a seção 6 do `tasks.md` antigo, a coleção `products` e os eventos
  de analytics de loja.
- **Checkout / gateway de pagamento / captura de cartão.** A assinatura é confirmada direto na v1.
- **App do host / leitor de QR code / validação de entrada.** Ver §3 — é o ponto mais fácil de errar.
- Mapa / geolocalização de parceiros.
- Gamificação, ranking, cashback.
- **Qualquer preço em reais**, em qualquer lugar: copy, seed data, mock, teste. O valor da
  mensalidade não foi definido. O "R$ 29,90" que aparecia no protótipo de setembro foi descartado e
  não pode vazar de volta.

---

## 3. QR code: dois escopos com o mesmo nome

A change antiga exclui "check-in físico com QR code" do MVP. Isso **continua valendo**, mas só para
metade da história. Separe:

- ✅ **Lado do associado — DENTRO do MVP.** O app gera e exibe o QR code de acesso ao espaço VIP
  (tela `08`), com nome do associado, evento, data e validade. É o CTA principal da aba-âncora.
- ❌ **Lado do host — FORA do MVP.** O app/leitor que escaneia e valida a entrada é fase 2
  (confirmado com o cliente em 05/10: "quando isso for possível", mira em novembro/dezembro).

Na prática: no piloto o QR é conferido visualmente na portaria do espaço. Não construa scanner, nem
fluxo de validação, nem modelo de check-in — mas **modele o QR de forma que a validação futura não
exija reescrita** (payload com identificador do associado + evento + expiração, não um blob opaco).

---

## 4. Arquitetura de informação

Tab bar de 5 abas:

`Início` · `Eventos` · `Espaço VIP` · `Benefícios` · `Perfil`

Fluxo de entrada: Onboarding → Cadastro/Login → Torne-se membro *(pulável)* → Início.

Telas de detalhe empilham sobre a aba de origem (Eventos → detalhe; Benefícios → detalhe → paywall
contextual).

**Nomenclatura:** a UI diz **"Eventos"**, não "Ativações" (a change antiga usa `activation-calendar`
— renomeie na change nova). Hoje só existem eventos próprios do clube, mas o card já prevê
organizadores externos: **mantenha o campo `organizer`** no modelo, mesmo sem UI de filtro por ele
nesta versão.

**Inventário completo das 15 telas:** `design/README.md` §"Inventário de telas". Não reconstrua de
memória — as variantes (membro vs. gratuito) estão lá e mudam o comportamento.

---

## 5. Decisões de arquitetura que permanecem

Estas vieram de `openspec/changes/the-crew-mvp/design.md` e **continuam válidas**. Não re-decida:

- **App:** React Native + **Expo** (managed workflow). Alinhado ao stack da equipe; um código para
  iOS e Android.
- **Backend:** **Firebase** — Firestore + Firebase Auth + Cloud Functions. Decisão do cliente,
  custo ~zero na escala de piloto.
- **Camada de acesso a dados obrigatória.** Nenhuma tela chama o SDK do Firestore diretamente — tudo
  passa por um repositório por domínio (`eventsRepository`, `benefitsRepository`, …). É proteção
  barata contra a migração de backend que já se espera no médio prazo.
- **Modelagem achatada no Firestore.** Coleções por domínio, sem subcollections profundas,
  denormalizando só o que os padrões de leitura reais exigem.
- **Firebase Auth fica**, mesmo numa futura migração do backend de dados — decisão consciente,
  documentada, fora do escopo de portabilidade.
- **Cloud Functions como lógica Node/TS portável** — trigger do Firestore é camada fina.
- **Observabilidade:** Firebase Analytics (métricas comerciais) + **Sentry** (erros/crashes).
  Crashlytics foi descartado por exigir dev client desde o início, contradizendo o Expo gerenciado.

A taxonomia de eventos de analytics do `design.md` continua a base: **remova** os eventos de Loja e
**acrescente** os de membership e espaço VIP (ver §6).

---

## 6. O que muda no modelo de dados

A change antiga não conhecia membership nem espaço VIP. Ajustes necessários:

- **`associates`** — ganha estado de membership (gratuito/membro), com origem e data. A assinatura é
  confirmada sem cobrança na v1, mas o estado precisa existir de verdade.
- **`events`** — ganha `has_vip` (se o clube terá espaço VIP naquele evento) e mantém `organizer`
  (`base_fox` | `third_party`).
- **`benefits`** — ganha estado "em breve" (placeholder visível, não resgatável) e mantém
  `redemption_type` (`code` | `referral_link`). Hoje existe **um parceiro real**: cupom de 15% nos
  eventos do clube. O cupom é **fixo**, não gerado por associado — a plataforma de ingressos do
  cliente não suporta cupom dinâmico de uso único, e isso foi aceito como limitação da v1.
- **Acesso VIP** — entidade nova, ligando associado + evento + validade, que lastreia o QR da tela `08`.
- **`products`** — **removida** junto com a loja.
- **Novos eventos de analytics** — paywall exibido, origem do paywall, assinatura confirmada, hub VIP
  visto, QR gerado.

---

## 7. Assinatura atrás de feature flag

Requisito explícito do cliente em 05/10: *"suporte para a assinatura oculto — ninguém vai ver isso
aqui, vai ser só pra gente ligar e desligar"*.

Toda a camada de membership (CTA "Torne-se membro", paywalls, mascaramento de desconto, bloqueio do
hub VIP) precisa estar **atrás de uma flag de configuração remota**, desligável sem novo build. No
lançamento do piloto ela fica **desligada**: todo mundo entra, navega e usa tudo como ambiente de
teste. A flag é ligada quando o cliente decidir começar a cobrar.

Isso é requisito de implementação, não detalhe de UI — define onde os gates de permissão vivem no
código. Com a flag desligada, o app deve se comportar como se todos fossem membros, sem telas órfãs
nem caminhos mortos.

---

## 8. Pendências que não bloqueiam o começo

- **Processador de pagamento.** Direção tentativa: **Mercado Pago**, conta do cliente (decidido como
  caminho provável em 05/10, substituindo a hipótese anterior de Cielo/PagSeguro). Continua aberto:
  o site de inscrições do cliente usa Cielo, e a conversa técnica a três com o freelancer que fez
  aquela integração (William) ainda não aconteceu. Restrição: o checkout **não pode expor a marca
  Kailash nem o nome do cliente**. Como não há cobrança na v1, isso não bloqueia nada agora.
- **Conta de publicação nas lojas** e titularidade da infraestrutura Firebase — ainda indefinido se
  sai pela Oreggia Tech ou pelo cliente (que só não quer aparecer como publicador). Decidir antes do
  primeiro build de distribuição, não antes de começar a codar.
- **Projeto Firebase único ou separado por ambiente** (dev/staging/prod).
- **Painel admin mínimo?** Eventos e benefícios são cadastrados à mão no piloto. Avaliar se o console
  do Firestore basta ou se vale um admin enxuto antes do lançamento.
- **Preço da mensalidade** — não definido. Não assumir nenhum valor.

### Risco de prazo

O cliente mencionou um evento em **17/10** como alvo de um lançamento mínimo, sem divulgação ampla.
São ~9 dias a partir desta data, com **review da App Store** no caminho e a conta de publicação
ainda indefinida. O próprio cliente disse para **não contar com essa data como primordial** e citou
os eventos de **07/11 e 05/12** como alternativas reais. Trate 17/10 como *stretch*, nunca como
compromisso assumido.

---

## 9. Primeiros passos sugeridos

1. Rodar `/opsx:propose` para criar uma change nova a partir deste briefing — marca Base Fox,
   `club-store` removida, capabilities novas de **membership** e **espaço VIP**,
   `activation-calendar` renomeada para eventos. Arquivar a change `the-crew-mvp`.
2. Scaffold do app Expo + TypeScript, navegação com as 5 abas de §4 e a camada de repositórios.
3. Provisionar o Firebase e modelar as coleções com os ajustes de §6.
4. Implementar na ordem do valor de demonstração: **Entrada → Eventos → Espaço VIP** (é o que o
   cliente precisa ver funcionando primeiro) → Benefícios → Conta.

---

## 10. Referências

| Arquivo | Conteúdo |
| --- | --- |
| `design/README.md` | Inventário das 15 telas, paleta, tipografia, divergências vs. a change antiga |
| `design/Base Fox - Mockup MVP-print.dc.html` | Mockup final — fonte de verdade de UI |
| `openspec/changes/the-crew-mvp/design.md` | Decisões de arquitetura (§5) e open questions originais |
| `../../2026-10-05 Escopo Base Fox.txt` | Transcrição da reunião de fechamento de escopo |
| `../../2026-09-04 MVP The Crew (1'10-37'11).txt` | Transcrição da reunião de apresentação do protótipo |

**Identidade visual** (de `design/README.md`): roxo `#5A1886` primário, roxo profundo `#22092F`,
laranja `#F6730C` para destaque/CTA do VIP, Strava `#FC4C02`. Tipografia `Saira` (títulos) +
`Barlow` (corpo). Frame 390×844, tab bar de 88px.
