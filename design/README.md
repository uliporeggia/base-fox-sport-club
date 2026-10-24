# Design — Base Fox Sport Club (mockup do MVP)

Importado do projeto Claude Design **Base Fox Sport Club** (`650ef187-3a72-4dee-b8c9-43d3200572be`)
via MCP `claude_design` em 08/10/2026.

## Arquivos

| Arquivo                                   | Papel                                                                                                                                                                                                                                                                                                                |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Base Fox - Mockup MVP-print.dc.html`     | **Entrada.** Versão para impressão (7 páginas landscape) do mockup de telas. Gerado a partir de `Base Fox - Mockup MVP.dc.html` (ver `<meta name="omelette-print-source">`).                                                                                                                                         |
| `Base Fox - Tela 16 Editar dados.dc.html` | **Complemento local**, escrito em 13/10/2026 — não veio do Claude Design e não existe no projeto remoto. Tela 16 (editar dados pessoais), alcançada pelo item homônimo do Perfil, que no mockup original tinha chevron mas nenhuma tela de destino. Decisão registrada em `openspec/changes/base-fox-mvp/design.md`. |
| `BFTabBar.dc.html`                        | Componente da tab bar, consumido via `<dc-import name="BFTabBar" active="…">`. Não listado no pedido original, mas obrigatório para o mockup renderizar.                                                                                                                                                             |
| `doc-page.js`                             | Runtime do web component `<doc-page>` (paginação/print). Scaffold do Claude Design — não editar.                                                                                                                                                                                                                     |
| `support.js`                              | Runtime `dc-` (parser `<x-dc>`, `DCLogic`, `sc-for`/`sc-if`, `dc-import`). Gerado — não editar.                                                                                                                                                                                                                      |
| `assets/logo-basefox-white.png`           | Logo completa, branca (990×675).                                                                                                                                                                                                                                                                                     |
| `assets/logo-symbol-white.png`            | Símbolo/ícone, branco (960×450). Usado na tab bar e no centro do QR code.                                                                                                                                                                                                                                            |
| `assets/espaco-vip.jpg`                   | Foto do espaço VIP (1527×783). Usada como `background-image` em 8 pontos. Não constava no pedido; só é referenciada via CSS `url()`.                                                                                                                                                                                 |

Não importados (existem no projeto remoto e não são referenciados por este mockup):
`Base Fox - Mockup MVP.dc.html` (fonte editável), `The Crew - Deck MVP`, `The Crew - Prototipo MVP`,
`The Crew - Apresentação do App`, `deck-stage.js`, `ios-frame.jsx`, `screenshots/s01…s11.png`, `uploads/`.

Verificado: todos os 6 arquivos referenciados pelo mockup estão presentes e íntegros; o render foi
conferido no Chrome (React carrega do unpkg, as 7 páginas montam, `BFTabBar` resolve, zero imagens
quebradas, zero erros no console).

Para abrir, sirva o diretório por HTTP (os `<script src="./…">` e as fontes do Google exigem origem):
`python3 -m http.server -d design 8000` → `http://localhost:8000/Base%20Fox%20-%20Mockup%20MVP-print.dc.html`

## Identidade visual

- **Cores:** roxo `#5A1886` (primária), roxo profundo `#22092F`, laranja `#F6730C` (destaque/CTA VIP),
  Strava `#FC4C02`. Texto `#160B1E` / secundário `#6E6478` / `#3B3045`. Fundos `#E9E5ED`, `#F1EAF6`, `#FFFFFF`.
- **Tipografia:** `Saira` (500–800) para títulos e rótulos; `Barlow` (400–700) para corpo.
- **Frame:** 390×844 (iPhone), tab bar de 88px.

## Inventário de telas (15 telas, 19 frames)

Agrupadas por fluxo, como no mockup:

**A — Entrada** (Onboarding → Cadastro → Torne-se membro *(pulável)* → Início)

- `01` Onboarding, 3 passos — "O clube que vai até você", "Seu espaço VIP em cada evento", "Vantagens que crescem com o clube"
- `02` Cadastro — Strava OAuth ou e-mail/senha. **Divergente desde 18/10:** o caminho Strava passa a exigir **e-mail digitado pelo visitante** (a API do Strava não devolve e-mail desde 01/2019) e a senha vira **opcional**. O mockup não desenha esse campo
- `03` Torne-se membro — pitch do plano pago
- `04` Início · plano gratuito

**B — Eventos** (*hoje só eventos do clube — o card já prevê organizadores externos*)

- `05` Eventos · lista — filtros Todos / Corrida / Trilha / Trekking
- `06` Detalhe do evento — variantes **membro** e **plano gratuito**

**C — Espaço VIP** (*o benefício-âncora — a aba que vende a assinatura*)

- `07` Espaço VIP · hub — variantes **membro** e **plano gratuito (bloqueado)**
- `08` Espaço VIP · QR code de acesso

**D — Benefícios** (*1 parceiro real hoje (cupom de 15%) + vagas "Em breve"*)

- `09` Benefícios · plano gratuito (desconto mascarado `••% OFF`)
- `10` Benefícios · membro (15% OFF visível)
- `11` Detalhe do benefício · cupom (membro)
- `12` Assinatura contextual — paywall ao tocar no cupom bloqueado
- `13` Assinatura confirmada

**E — Conta**

- `14` Notificações — alcançada pelo **sino no cabeçalho da Home**, não por atalho no corpo da tela
- `15` Perfil · membro — atenção: o item "Notificações" é um **interruptor**, não uma linha de navegação; "Assinatura" e "Editar dados pessoais" têm chevron; "Strava" tem ação de texto
- `16` Editar dados pessoais — **fora do mockup original**, em arquivo próprio (ver tabela acima); nome e foto editáveis, e-mail travado, e a linha de senha com dois estados: “Definir uma senha” para quem não tem, travada para quem já tem

**Sem tela desenhada** (alcançadas por link, não constam das 15)

- Login — link “Já tem conta? Entrar” da tela `02`; reaproveita a identidade dela. Ganhou um terceiro caminho de entrada: **login por link de e-mail**, que é o que garante acesso a quem se cadastrou por Strava e não definiu senha

Dados de exemplo (4 eventos, 3 parceiros "Em breve") e o QR code sintético ficam no
`<script type="text/x-dc" data-dc-script>` no fim do arquivo.

## Divergências em relação a `openspec/changes/the-crew-mvp`

> **Resolvidas em 13/10/2026.** Todos os itens abaixo foram decididos na change
> `openspec/changes/base-fox-mvp/` (marca Base Fox, loja cortada, `membership` e `vip-access`
> como capabilities novas, `activation-calendar` renomeada para `events`). A change antiga foi
> arquivada em `openspec/changes/archive/2026-10-13-the-crew-mvp/` sem sincronizar specs — nada
> dela chegou a ser implementado. A lista permanece aqui como registro de como se chegou lá.

O mockup é uma iteração **posterior** à proposta OpenSpec (que foi escrita a partir de
`The Crew - Prototipo MVP`, de 13 telas). Antes de implementar, decidir o que vale:

1. **Marca** — mockup diz "Base Fox Sport Club"; a proposta diz "The Crew" (antigo "Moving Club").
2. **Loja ausente** — a capability `club-store` (catálogo + pedido por WhatsApp) não existe na
   arquitetura de informação do mockup; a 5ª aba é "Espaço VIP", não "Loja".
3. **Assinatura paga é o eixo do produto** — "Plano membro" não aparece em nenhuma spec. O mockup
   trata estados **gratuito vs. membro** em quase toda tela, com paywall contextual (`12`) e
   confirmação (`13`). Isso é uma capability nova (monetização/membership), não um detalhe de UI.
4. **QR code de acesso (`08`)** — a proposta exclui explicitamente "check-in físico com QR code"
   do MVP; o mockup o coloca como o CTA principal da aba-âncora.
5. **Nomenclatura** — `activation-calendar` aparece como "Eventos"; o card já prevê organizadores
   externos (hoje só eventos do clube).
6. **Consistentes:** `associate-onboarding` (01–04, 15), `strava-connection` (02, 15),
   `partner-benefits` (09–11), `push-notifications` (14).
