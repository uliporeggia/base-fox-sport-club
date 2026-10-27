# Briefing — Documento de orçamento de infraestrutura (Base Fox Sport Club)

**Para:** gerar o documento no Claude Design.
**Escrito em:** 18/10/2026, a partir do levantamento de preços feito nas fontes oficiais na mesma data.
**Revisado em:** 27/10/2026 — câmbio atualizado para a PTAX de 26/10/2026, inclusão do custo de ativação do Google Cloud e correção de duas premissas, ambas verificadas no provisionamento real.

---

## 1. O que é este documento

Um **levantamento de custos fixos de infraestrutura de terceiros** para operar o app do Base Fox Sport Club. Responde a uma pergunta só: *quanto custa por mês manter este app no ar, e como esse custo cresce com o número de usuários.*

**Quem lê:** o cliente, que decide se banca a infraestrutura e em que conta ela fica.

**O que o documento precisa conseguir:** que o cliente termine a leitura sabendo (a) que o custo de infraestrutura é marginal, (b) exatamente quando ele deixa de ser marginal, e (c) que o que trava o lançamento não é dinheiro — e que há um item, só um, que depende de ação dele: arregimentar os 12 testadores do Google Play.

### Isto NÃO é uma proposta comercial

Não leva honorário da Oreggia Tech, nem escopo, nem cronograma, nem venda. É um anexo técnico de custos. Se o cliente pedir depois uma proposta de manutenção mensal, é **outro documento**, partindo de `Comercial/Modelos/Proposta comercial/` e da tabela de precificação travada no `CLAUDE.md`.

---

## 2. Identidade visual e formato

Usar a identidade da **Oreggia Tech**, não a do Base Fox. É documento da consultoria para o cliente.

Referência: `Comercial/Modelos/Proposta comercial/` (projeto Claude Design "Oreggia Tech branding", `2c1bd53a-08bf-4670-9eec-4902eaa28607`).

| Elemento | Valor                                                                                    |
| -------- | ---------------------------------------------------------------------------------------- |
| Fontes   | **Spectral** (serif, corpo e títulos) + **IBM Plex Mono** (eyebrows, tabelas, metadados) |
| Fundo    | creme `#F5F1EA`                                                                          |
| Texto    | `#1B1714` / `#2A241E` · secundário `#6E645A` / `#9A8E80`                                 |
| Acento   | azul `#5285DE` (eyebrows) · terracota `#C16A42` (numeração, totais)                      |
| Formato  | carta, retrato, margem 0.65in, rodapé "Oreggia Tech · Documento confidencial"            |

**Aproveitar a identidade, não a estrutura.** O modelo de proposta tem capa + 9 seções desenhadas para vender escopo. Este documento tem a estrutura da seção 4 abaixo. O que se reaproveita é paleta, tipografia, geometria de página e o estilo de tabela.

Peso visual: **as duas tabelas da seção 4.2 e 4.3 são o documento**. O resto é moldura. Se algo tiver que ganhar destaque gráfico, são elas.

---

## 3. A narrativa

O documento conta três coisas, nesta ordem:

```
   1. O custo é marginal          2. E assim permanece         3. O que trava
      ~R$ 85/mês hoje                até ~25.000 usuários         não é dinheiro
            │                              │                           │
   quase tudo cabe em           Firebase não é o                 prazos de loja
   plano gratuito; sobram       gargalo — o custo só             e do Strava; só
   duas assinaturas anuais      sobe se adotarmos                1 item depende
   obrigatórias                 atualização OTA                  do cliente
```

O erro a evitar é o documento soar como "é tudo de graça". Não é: há duas assinaturas obrigatórias, um limite técnico que trava o cadastro por Strava, e um plano de faturamento sem teto que exige alerta configurado. O tom é **"barato e previsível, desde que estas quatro coisas sejam feitas"**.

---

## 4. Estrutura e conteúdo

### 4.1 Abertura — o número

Uma frase e um número grande:

> **No regime do piloto, a infraestrutura do app custa cerca de R$ 85 por mês.**

Logo abaixo, a composição em uma linha: duas assinaturas anuais obrigatórias (Apple e Strava); todo o restante — banco de dados, autenticação, servidor, notificações push e monitoramento de erros — cabe nos planos gratuitos.

### 4.2 Tabela 1 — Custos recorrentes no piloto

Câmbio **R$ 5,5007** (PTAX de fechamento de 26/10/2026, Banco Central), **IOF 3,5%** sobre cobranças em dólar no cartão → multiplicador **5,6932**.

| Item                        | Para que serve                                     | Plano                | US$/mês   | R$/mês  |
| --------------------------- | -------------------------------------------------- | -------------------- | ---------:| -------:|
| Firebase                    | Banco de dados, login, servidor e push             | Blaze (pago por uso) | 0,00      | 0       |
| EAS Build                   | Geração dos aplicativos iOS e Android              | Free                 | 0,00      | 0       |
| Sentry                      | Monitoramento de erros e travamentos               | Developer            | 0,00      | 0       |
| Firebase Cloud Messaging    | Entrega das notificações push                      | —                    | 0,00      | 0       |
| **Apple Developer Program** | Publicar na App Store **e** chave de push do iOS   | —                    | **8,25**  | **47**  |
| **Assinatura Strava**       | Acesso à API do Strava (obrigatória desde 06/2026) | Standard             | **6,67**  | **38**  |
|                             |                                                    | **Total**            | **14,92** | **~85** |

**Custos de entrada, uma única vez:**

| Item | Valor |
| ---- | -----:|
| Google Play Console | US$ 25 ≈ **R$ 142** |
| Ativação do Google Cloud (pagamento antecipado exigido no Brasil) | **R$ 150** |
| **Total de entrada** | **R$ 292** |

O Google Play não recorre: não tem anuidade nem taxa por aplicativo. Os R$ 150 do Google Cloud **não são taxa** — o valor entra como saldo na conta de faturamento e é abatido do uso futuro. Mas é condição para ativar o serviço: sem ele a conta de faturamento permanece fechada e as rotinas de servidor não rodam.

### 4.3 Tabela 2 — Como o custo cresce com usuários ativos mensais

Esta é a tabela que o cliente vai querer. Duas colunas de total, porque **a decisão de adotar atualização OTA dobra ou triplica a conta** e ainda não foi tomada.

| Usuários ativos/mês | Firebase | EAS Update | Sentry | Strava | Apple | **Total com OTA** | **Total sem OTA** |
| -------------------:| --------:| ----------:| ------:| ------:| -----:| -----------------:| -----------------:|
| 100                 | R$ 0     | R$ 0       | R$ 0   | R$ 38  | R$ 47 | **R$ 85**         | **R$ 85**         |
| 500                 | R$ 0     | R$ 0       | R$ 0   | R$ 38  | R$ 47 | **R$ 85**         | **R$ 85**         |
| 1.000               | R$ 0     | R$ 0       | R$ 0   | R$ 38  | R$ 47 | **R$ 85**         | **R$ 85**         |
| 2.500               | R$ 0     | R$ 108     | R$ 0   | R$ 38  | R$ 47 | **R$ 193**        | **R$ 85**         |
| 5.000               | R$ 0     | R$ 165     | R$ 0   | R$ 38  | R$ 47 | **R$ 250**        | **R$ 85**         |
| 10.000              | R$ 2     | R$ 307     | R$ 0   | R$ 38  | R$ 47 | **R$ 394**        | **R$ 87**         |
| 25.000              | R$ 12    | R$ 734     | R$ 0   | R$ 38  | R$ 47 | **R$ 831**        | **R$ 97**         |

> *Valores em real arredondados para o inteiro; os totais são calculados sobre os valores exatos em dólar, então podem diferir em R$ 1 da soma das colunas arredondadas.*

**O achado que o documento precisa deixar explícito:** sem atualização OTA, o custo vai de **R$ 85 a R$ 97 por mês entre 100 e 25.000 usuários** — praticamente plano. O Firebase, que é o que todo mundo teme, custa **R$ 12/mês a 25.000 usuários**. Quem puxa a curva para cima é exclusivamente o EAS Update.

Vale uma frase explicando o que se compra com ele: atualização OTA permite corrigir bugs e ajustar telas **sem passar por nova revisão da App Store**, que leva dias. É conveniência operacional, não requisito.

### 4.4 Onde cada plano gratuito acaba

Tabela ou lista, com os limites oficiais e o ponto de virada:

| Serviço                 | Cota gratuita              | Acaba por volta de                                                             |
| ----------------------- | -------------------------- | ------------------------------------------------------------------------------ |
| Firestore (leituras)    | 50.000/dia                 | ~7.500 usuários na média; **~2.000 em dias de evento**, quando o uso concentra |
| Firestore (escritas)    | 20.000/dia                 | ~30.000 usuários                                                               |
| Firebase Authentication | 50.000 usuários ativos/mês | fora do horizonte do piloto                                                    |
| Cloud Functions         | 2.000.000 execuções/mês    | fora do horizonte do piloto                                                    |
| Cloud Storage (imagens) | 5 GB                       | fora do horizonte do piloto                                                    |
| Sentry                  | 5.000 erros/mês            | depende da estabilidade, não do tamanho — ver abaixo                           |
| EAS Update              | 1.000 usuários ativos/mês  | 1.000 usuários                                                                 |

Dois pontos que merecem destaque gráfico (caixa, não nota de rodapé):

> **O limite do Firestore é diário, não mensal.** O uso deste app concentra em dias de evento. Um sábado de corrida pode consumir várias vezes a média diária, então o teto efetivo de leituras fica mais perto de **2.000 usuários ativos** do que dos 7.500 que a média sugere.

> **O gatilho de escrita não é o número de associados, é o disparo em massa de avisos.** Cada notificação enviada grava um registro por associado. Um disparo para 20.000 pessoas consome a cota diária inteira de uma vez.

Sobre o Sentry, uma linha de sensibilidade: o limite de 5.000 erros/mês é ultrapassado por volta de **25.000 usuários** se o app gerar 0,2 erro por usuário/mês, **10.000** se gerar 0,5, e **5.000** se gerar 1,0. É função da estabilidade do app, não do tamanho da base. O plano pago custa US$ 29/mês.

### 4.5 O que trava, e não é dinheiro

Seção curta e direta. Nenhum destes é linha de orçamento, mas todos podem atrasar o lançamento mais que qualquer código.

**Titularidade — decidida em 18/10.** Quem publica é a **Oreggia Tech**, com **contas pessoais** nas duas lojas, e não contas de organização. A troca que isso representa:

| | Organização | Pessoal (escolhido) |
| --- | --- | --- |
| D-U-N-S | até 30 dias, bloqueia as duas lojas | não exige |
| Apple — matrícula | 2 a 4 semanas | 24 a 48 horas |
| Google Play — 12 testadores | isento | obrigatório |
| Nome exibido na ficha | Oreggia Tech | nome legal pessoal |

O ganho decisivo é o iOS: TestFlight destravado em dois dias em vez de um mês, sem depender do D-U-N-S.

No documento ao cliente isto entra como **informação**, não como pergunta — a decisão já está tomada e não depende dele. O que ele precisa saber é que a infraestrutura nasce sob a conta da Oreggia Tech e que uma eventual transferência futura é um processo à parte, a combinar quando fizer sentido.

**a) Os 12 testadores do Google Play — e o cliente é quem resolve.** Contas pessoais criadas após 13/11/2023 precisam de 12 testadores mantidos por 14 dias corridos antes de liberar a publicação pública. O relógio só começa depois da aprovação da versão de teste e da adesão dos 12, e quem sai e volta reinicia a própria contagem.

Dois pontos para o documento deixar claros, porque mudam a leitura de risco:

- **Não é bloqueio sequencial.** O relógio roda em paralelo ao desenvolvimento, bastando uma build instalável ainda que incompleta. Por isso o teste fechado é tarefa de começo de projeto.
- **É o pedido mais fácil que faremos a ele.** Arregimentar 12 pessoas de um clube de corrida que mantenham um app instalado por duas semanas é trivial para o cliente — e é o único item desta seção que depende de ação dele.

**b) Teto de atletas do Strava.** A API libera **1 atleta conectado** por padrão, com auto-upgrade para **10**. Acima disso depende de aprovação do Strava, sem prazo publicado. Como o cadastro por Strava é um dos caminhos de entrada do app, o 11º associado não conseguiria se cadastrar por lá enquanto o aumento não sair — e associados que já dependem do Strava para entrar ficariam trancados fora da conta ao trocar de aparelho.

O pedido já está na lista de tarefas a disparar antes de qualquer código. A mitigação sob nosso controle também está prevista: e-mail obrigatório no cadastro e login por link de e-mail, de modo que ninguém dependa exclusivamente do Strava para acessar a própria conta.

**c) Review da App Store.** Dias, a cada build enviada. Entra no cronograma, não no orçamento.

### 4.6 Riscos de custo

Curta, mas obrigatória — é o que protege a Oreggia Tech se a conta vier diferente.

> **O plano Blaze do Firebase não tem teto por padrão.** A previsão de R$ 0 só é confiável com orçamento e alertas de faturamento configurados no provisionamento. Um erro de programação em rotina de servidor é o único cenário em que esta previsão produz uma conta inesperada.
>
> **Configurado em 27/10/2026:** orçamento mensal de R$ 25 com alertas por e-mail em 50%, 90% e 100% — o primeiro dispara em R$ 12,50, valor que o uso normal não alcança. Além disso, o console passou a oferecer **limite de gastos por serviço**, que não apenas avisa: ao atingir 100%, o serviço é pausado até o fim do mês de faturamento, voltando sozinho no mês seguinte. Vale para Cloud Functions e App Hosting, não para o banco de dados.

### 4.7 Premissas declaradas

O documento precisa declarar isto abertamente — é o que o torna defensável:

- **Câmbio de R$ 5,5007 em 26/10/2026** (PTAX de fechamento do Banco Central), mais **IOF de 3,5%** sobre cobranças em dólar no cartão. Variação cambial altera os valores em real, e não é hipótese remota: entre 23/10 e 26/10/2026 o dólar subiu de R$ 5,0377 para R$ 5,5007 — cerca de 9% em um pregão — o que sozinho elevou o total do piloto de R$ 79 para R$ 85 por mês. Os valores em real valem para a data da cotação, não para o mês.
- **A Apple cobra em dólar, não em reais.** Verificado na matrícula em 25/10/2026: como a loja online brasileira não vende a assinatura, a Apple apresenta um formulário de cartão e cobra **US$ 99 em dólar**. O valor em real é sempre conversão mais IOF, e muda a cada renovação conforme o câmbio.
- **O preço da assinatura Strava no Brasil difere do americano.** O valor usado (US$ 79,99/ano) é o preço dos EUA.
- **O consumo por usuário é estimado a partir das telas desenhadas**: cerca de 200 leituras e 20 escritas por usuário ativo por mês, assumindo 10 sessões mensais. Vai ser medido de verdade no piloto, com os dados do próprio Firebase.
- **Os preços unitários do Firestore** usados nas projeções acima da cota gratuita são de ordem de grandeza, região Estados Unidos. As cotas gratuitas são números oficiais do Google.
- **O faturamento do Google Cloud no Brasil sai em reais**, por entidade local e sem IOF — confirmado no provisionamento em 25/10/2026. Mas há um requisito que o levantamento de 18/10 não previa: contas brasileiras novas exigem um **pagamento antecipado de ativação de R$ 150**, sem o qual a conta de faturamento permanece fechada e as rotinas de servidor não rodam. O valor vira saldo abatido do uso, então não altera o custo recorrente — altera o custo de entrada.

---

## 5. O que não entra

- Honorários, manutenção ou qualquer valor da Oreggia Tech.
- **Valor da mensalidade do clube** — não foi definido pelo cliente, e nenhum valor pode ser sugerido.
- Menção a **Kailash, XKR ou KTR**. A restrição de marca vale para o app; neste documento, trate como "o grupo do cliente" se precisar referenciar. Na seção 4.5(a) a referência é inevitável, mas deve ser genérica.
- Custos de fase 2: leitor de QR do lado da portaria, gateway de pagamento, processador de cobrança.
- Detalhe técnico de arquitetura. O leitor é o cliente, não um engenheiro. "Banco de dados", não "Firestore com modelagem achatada".

---

## 6. Lacunas a preencher antes de gerar

| Lacuna                                              | Como resolver                                                                                        |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Preço da assinatura Strava no Brasil                | Consultar a página de assinatura do Strava com IP/conta brasileira                                   |
| Nome e cargo do destinatário no cliente             | Preencher na capa                                                                                    |
| A Oreggia Tech vai operar as contas ou só orientar? | Muda o tom da seção 4.5 — se o cliente opera, vira instrução; se operamos nós, vira pedido de acesso |

---

## 7. Como os números foram apurados

Todos verificados em 18/10/2026, nas fontes primárias onde elas publicam preço:

- Firebase — cotas gratuitas e exigência do plano Blaze para Cloud Functions: <https://firebase.google.com/pricing>
- EAS/Expo — planos e limites de MAU: <https://expo.dev/pricing>
- Sentry — planos Developer e Team: <https://sentry.io/pricing/>
- Apple Developer Program — valor e moeda: <https://developer.apple.com/support/enrollment/>
- Google Play Console — taxa única: <https://support.google.com/googleplay/android-developer/answer/6112435>
- Strava Developer Program 2026 — assinatura obrigatória e teto de atletas: confirmado em duas fontes independentes
- Regra dos 12 testadores do Google Play — quem está sujeito e como o prazo conta
- IOF de 3,5% sobre compras internacionais no cartão

**Revisão de 27/10/2026** — o que foi reverificado e onde:

- **Câmbio** — PTAX de fechamento do Banco Central, série `CotacaoDolarPeriodo` da API Olinda (<https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/>). Fechamento de 26/10/2026: compra 5,49980 / venda 5,50070. O valor usado é o de **venda**.
- **Cobrança da Apple em dólar** — observado no próprio checkout da matrícula em 25/10/2026: a loja brasileira não vende a assinatura, e a Apple apresenta formulário de cartão com "Your order will be charged in U.S. dollars", total US$ 99.
- **Ativação de R$ 150 do Google Cloud** — observado no console de faturamento em 26/10/2026, no aviso da conta: *"É necessário um pagamento ocasional de pelo menos R$ 150,00 para ativar o serviço. Se você já tiver feito isso, o valor será creditado na sua conta em breve."*
- **Cotas gratuitas do Firestore por região** — reconferidas em <https://cloud.google.com/firestore/pricing>, alternando a região no seletor da página: a cota gratuita é idêntica em `us-central1` e `southamerica-east1`; o que muda é o preço por operação, 1,5× maior em São Paulo.

As contas da tabela 4.3 foram calculadas por script, não à mão. O modelo está registrado no levantamento que originou este briefing.
