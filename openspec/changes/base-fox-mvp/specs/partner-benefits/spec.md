## ADDED Requirements

### Requirement: Catálogo de benefícios com filtro por categoria
O sistema SHALL exibir, na aba Benefícios, os benefícios oferecidos por parceiros do clube, permitindo filtrar por categoria — Alimentação, Equipamentos e Eventos — além da opção "Todas", que é o estado inicial.

#### Scenario: Ver o catálogo
- **WHEN** o associado abre a aba Benefícios
- **THEN** o sistema exibe os benefícios ativos com o filtro "Todas" selecionado

#### Scenario: Filtrar por categoria
- **WHEN** o associado seleciona a categoria "Eventos"
- **THEN** o sistema exibe apenas os benefícios dessa categoria

### Requirement: Card do benefício com desconto visível para quem tem acesso
Para associados com acesso de membro, cada card de benefício ativo SHALL exibir a categoria, o parceiro, o valor do desconto, uma descrição curta e a ação de abrir o cupom.

#### Scenario: Card visto por quem tem acesso
- **WHEN** um associado com acesso de membro abre a aba Benefícios
- **THEN** cada benefício ativo exibe categoria, parceiro, valor do desconto, descrição curta e a ação de ver o cupom

### Requirement: Desconto mascarado para o plano gratuito
Com a flag de membership ligada, o sistema SHALL mascarar o valor do desconto nos cards de benefício para associados do plano gratuito, exibindo uma marcação de que o benefício é exclusivo de membros. O parceiro, a categoria e a existência do benefício SHALL permanecer visíveis — o mascaramento recai apenas sobre o valor do desconto.

#### Scenario: Desconto mascarado
- **WHEN** a flag está ligada e um associado do plano gratuito abre a aba Benefícios
- **THEN** o valor do desconto aparece mascarado no card, acompanhado da marcação de benefício de membro, com parceiro e categoria legíveis

#### Scenario: Toque no benefício bloqueado
- **WHEN** a flag está ligada e um associado do plano gratuito toca em um benefício ativo
- **THEN** o sistema exibe o paywall contextual em lugar do detalhe do benefício, registrando o detalhe do benefício como origem

#### Scenario: Desconto visível com a flag desligada
- **WHEN** a flag de membership está desligada e um associado do plano gratuito abre a aba Benefícios
- **THEN** o valor do desconto é exibido normalmente e o toque abre o detalhe do benefício, sem marcação de membro

### Requirement: Detalhe do benefício
O sistema SHALL exibir, no detalhe de um benefício ativo, a categoria, o parceiro, o título do desconto, a descrição de onde e como usar, o código do cupom, as condições de uso, a data de validade e as ações de resgate disponíveis.

#### Scenario: Abrir o detalhe
- **WHEN** um associado com acesso de membro toca em um benefício ativo
- **THEN** o sistema exibe o detalhe com categoria, parceiro, título do desconto, descrição, código, condições de uso, validade e as ações de resgate

### Requirement: Resgate por código e por link externo, independentes
Cada benefício SHALL poder oferecer um código de cupom, um link externo para a loja ou plataforma do parceiro, ou **ambos**. O sistema SHALL exibir as ações correspondentes ao que o benefício tiver cadastrado, sem assumir que as duas formas sejam mutuamente exclusivas.

#### Scenario: Copiar o código
- **WHEN** o associado toca em "Copiar código" no detalhe de um benefício que possui código
- **THEN** o sistema copia o código para a área de transferência e exibe uma confirmação temporária

#### Scenario: Abrir o link do parceiro
- **WHEN** o associado toca na ação de ir para o parceiro em um benefício que possui link externo
- **THEN** o sistema abre esse link fora do app

#### Scenario: Benefício com código e link ao mesmo tempo
- **WHEN** o associado abre o detalhe de um benefício que possui código e link externo
- **THEN** o sistema exibe as duas ações na mesma tela, a de copiar o código e a de ir para o parceiro

#### Scenario: Benefício apenas com código
- **WHEN** o associado abre o detalhe de um benefício que possui código e nenhum link externo
- **THEN** o sistema exibe apenas a ação de copiar o código, sem ação de link quebrada ou desabilitada

### Requirement: Cupom fixo, não gerado por associado
O código de cupom de um benefício SHALL ser um valor fixo, compartilhado por todos os associados, e NÃO SHALL ser gerado por associado nem conter identificador individual. A plataforma de ingressos do cliente não suporta cupom dinâmico de uso único, e essa é uma limitação aceita desta versão.

#### Scenario: Mesmo código para associados diferentes
- **WHEN** dois associados distintos abrem o detalhe do mesmo benefício
- **THEN** o sistema exibe o mesmo código de cupom para ambos

#### Scenario: Nenhum identificador do associado no código ou no link
- **WHEN** o sistema exibe o código ou monta o link externo de um benefício
- **THEN** nenhum identificador do associado é anexado ao código ou à URL

### Requirement: Vagas de parceiro "Em breve"
O sistema SHALL exibir, em uma seção separada do catálogo, as vagas de parceiros anunciados mas ainda não ativos, mostrando a categoria e uma identificação genérica, com a marcação "Em breve". Esses itens NÃO SHALL ser resgatáveis nem abrir tela de detalhe.

#### Scenario: Ver as vagas em breve
- **WHEN** o associado abre a aba Benefícios
- **THEN** o sistema exibe a seção de novos parceiros com os itens marcados como "Em breve", cada um com sua categoria

#### Scenario: Item em breve não abre detalhe
- **WHEN** o associado toca em um item marcado como "Em breve"
- **THEN** o sistema não abre tela de detalhe, não exibe código e não aciona o paywall

#### Scenario: Item em breve não é mascarado
- **WHEN** a flag está ligada e um associado do plano gratuito vê a seção de novos parceiros
- **THEN** os itens "Em breve" aparecem iguais para os dois planos, sem mascaramento de desconto, porque não há desconto definido
