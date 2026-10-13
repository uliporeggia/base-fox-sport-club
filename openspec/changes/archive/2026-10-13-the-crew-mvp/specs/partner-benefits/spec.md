## ADDED Requirements

### Requirement: Lista de benefícios com filtro por categoria
O sistema SHALL exibir os benefícios oferecidos por parceiros do clube, permitindo filtrar por categoria (ex.: Alimentação, Equipamentos, Viagem, Saúde).

#### Scenario: Filtrar por categoria
- **WHEN** o associado seleciona a categoria "Saúde"
- **THEN** o sistema exibe apenas os benefícios dessa categoria

### Requirement: Detalhe do benefício com resgate por código ou por link de referral
Cada benefício SHALL ter um formato de resgate definido pelo parceiro: **código de desconto** (para copiar e apresentar) ou **link de referral** (para redirecionar a uma loja externa com rastreio da indicação). O sistema SHALL exibir parceiro, desconto e descrição em ambos os casos, com a ação de resgate correspondente ao formato do benefício.

#### Scenario: Copiar código do benefício
- **WHEN** o associado abre um benefício do tipo "código" e toca em "Copiar código"
- **THEN** o sistema copia o código para a área de transferência e exibe a confirmação "Copiado!" temporariamente

#### Scenario: Abrir link de referral do benefício
- **WHEN** o associado abre um benefício do tipo "link de referral" e toca em "Ir para a loja parceira"
- **THEN** o sistema monta a URL do parceiro incluindo um identificador do associado (ex.: `?ref=<associate_id>`) e abre esse link fora do app

### Requirement: Rastreio de referral por associado
O sistema SHALL identificar, em cada link de referral aberto, qual associado o originou, para permitir que o parceiro (ou o clube) reconcilie comissões posteriormente. Essa reconciliação em si SHALL acontecer fora do app — o sistema apenas gera e abre o link com o identificador.

#### Scenario: Identificador incluído no link
- **WHEN** o sistema monta a URL de um benefício do tipo "link de referral"
- **THEN** o identificador interno do associado (`associate_id`) é incluído como parâmetro na URL, sem expor e-mail ou outro dado sensível

### Requirement: Parceiro em destaque na Home
O sistema SHALL exibir na tela Início um card com um benefício de parceiro em destaque, permitindo abrir seu detalhe diretamente.

#### Scenario: Abrir benefício em destaque pela Home
- **WHEN** o associado toca no card "Parceiro em destaque" na tela Início
- **THEN** o sistema abre a tela de detalhe desse benefício
