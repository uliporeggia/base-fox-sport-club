## ADDED Requirements

### Requirement: Lista de benefícios com filtro por categoria
O sistema SHALL exibir os benefícios oferecidos por parceiros do clube, permitindo filtrar por categoria (ex.: Alimentação, Equipamentos, Viagem, Saúde).

#### Scenario: Filtrar por categoria
- **WHEN** o associado seleciona a categoria "Saúde"
- **THEN** o sistema exibe apenas os benefícios dessa categoria

### Requirement: Detalhe do benefício com código de desconto
O sistema SHALL exibir parceiro, desconto, descrição e um código de desconto para cada benefício, permitindo copiar o código.

#### Scenario: Copiar código do benefício
- **WHEN** o associado toca em "Copiar código" na tela de detalhe do benefício
- **THEN** o sistema copia o código para a área de transferência e exibe a confirmação "Copiado!" temporariamente

### Requirement: Parceiro em destaque na Home
O sistema SHALL exibir na tela Início um card com um benefício de parceiro em destaque, permitindo abrir seu detalhe diretamente.

#### Scenario: Abrir benefício em destaque pela Home
- **WHEN** o associado toca no card "Parceiro em destaque" na tela Início
- **THEN** o sistema abre a tela de detalhe desse benefício
