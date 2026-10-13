## ADDED Requirements

### Requirement: Hub do Espaço VIP como aba-âncora
O sistema SHALL dedicar a aba central da tab bar ao Espaço VIP, exibindo o que é o espaço, o próximo evento em que ele será montado — com data, janela de funcionamento e local — as cortesias disponíveis, e a lista dos espaços seguintes.

#### Scenario: Abrir o hub
- **WHEN** o associado abre a aba Espaço VIP
- **THEN** o sistema exibe a descrição do espaço, o bloco "Próximo espaço" com evento, data, janela e local, as cortesias disponíveis, e a lista de espaços seguintes

#### Scenario: Lista de espaços seguintes
- **WHEN** há mais de um evento futuro com espaço VIP
- **THEN** o sistema lista os eventos posteriores ao próximo, cada um com data e nome, abaixo do bloco do próximo espaço

#### Scenario: Nenhum espaço VIP agendado
- **WHEN** não há eventos futuros com espaço VIP
- **THEN** o sistema exibe um estado vazio informando que os próximos espaços serão anunciados, sem oferecer geração de acesso

### Requirement: Hub bloqueado para quem não tem acesso de membro
Com a flag de membership ligada, o sistema SHALL exibir o hub do Espaço VIP a associados do plano gratuito com o conteúdo informativo visível — descrição, próximo espaço e cortesias — substituindo a ação de gerar acesso por um bloco explicando que a entrada é de membro, com a ação de se tornar membro.

#### Scenario: Hub visto pelo plano gratuito
- **WHEN** a flag está ligada e um associado do plano gratuito abre a aba Espaço VIP
- **THEN** o sistema exibe o próximo espaço e as cortesias, e no lugar da ação de gerar acesso exibe o bloco de acesso de membro com a ação de se tornar membro

#### Scenario: Geração de acesso indisponível sem membership
- **WHEN** a flag está ligada e um associado do plano gratuito está no hub do Espaço VIP
- **THEN** nenhum caminho da tela permite gerar ou visualizar um QR de acesso

#### Scenario: Hub liberado com a flag desligada
- **WHEN** a flag de membership está desligada e um associado do plano gratuito abre a aba Espaço VIP
- **THEN** o sistema exibe o hub com a ação de gerar acesso disponível, sem qualquer menção a plano de membro

### Requirement: Geração de acesso ao espaço VIP
O sistema SHALL permitir que um associado com acesso de membro gere seu acesso ao espaço VIP do próximo evento, criando um registro de acesso que vincula o associado, o evento e a validade. Gerar o acesso novamente para o mesmo evento SHALL reaproveitar o registro existente, em vez de criar outro.

#### Scenario: Gerar o acesso
- **WHEN** um associado com acesso de membro toca em "Gerar meu acesso" no hub do Espaço VIP
- **THEN** o sistema cria um registro de acesso vinculando associado, evento e validade, e exibe a tela do QR de acesso

#### Scenario: Gerar novamente o mesmo acesso
- **WHEN** o associado gera o acesso para um evento em que já possui acesso válido
- **THEN** o sistema reaproveita o registro existente e exibe o mesmo acesso, sem criar um registro duplicado

#### Scenario: Validade derivada do evento
- **WHEN** o sistema cria um registro de acesso
- **THEN** a validade do acesso é derivada da janela de funcionamento do espaço VIP daquele evento, não de um prazo fixo

### Requirement: Tela do QR de acesso
O sistema SHALL exibir o acesso ao espaço VIP como um QR code, acompanhado do nome do evento, da data e janela de funcionamento, do nome do associado, do seu número de associado, da indicação de validade e da instrução de apresentar o código na entrada do espaço.

#### Scenario: Visualizar o acesso
- **WHEN** o associado abre a tela do QR de acesso
- **THEN** o sistema exibe o QR code, o nome do evento, a data e a janela de funcionamento, o nome do associado, o número de associado, a indicação de validade e a instrução de apresentação

#### Scenario: QR legível sem conexão
- **WHEN** o associado abre a tela do QR de acesso sem conectividade, tendo gerado o acesso anteriormente
- **THEN** o sistema exibe o QR code a partir dos dados já obtidos, porque a conferência na portaria não pode depender de rede

### Requirement: Payload do QR estruturado e versionado
O QR code SHALL codificar um payload estruturado contendo a versão do formato, o identificador do registro de acesso, o identificador do associado, o identificador do evento e a validade. O payload NÃO SHALL ser um identificador opaco sem contexto, para que a conferência visual do piloto e a validação automatizada da fase 2 funcionem sobre o mesmo dado.

#### Scenario: Campos presentes no payload
- **WHEN** o sistema gera o QR code de um acesso
- **THEN** o payload codificado contém a versão do formato, o identificador do acesso, o identificador do associado, o identificador do evento e a validade

#### Scenario: Payload sem dado sensível
- **WHEN** o sistema monta o payload do QR
- **THEN** nenhum dado sensível do associado — e-mail, senha, telefone ou token de autenticação — é incluído

### Requirement: Acesso revogável
O sistema SHALL permitir que um registro de acesso seja marcado como revogado, de modo que a validação futura possa recusá-lo sem exigir a reemissão de QR codes já apresentados.

#### Scenario: Registro marcado como revogado
- **WHEN** um registro de acesso é marcado como revogado
- **THEN** o registro permanece armazenado com a marcação de revogação, mantendo o histórico do acesso emitido

### Requirement: Validação pelo lado do host fora desta versão
O sistema NÃO SHALL incluir leitor de QR code, fluxo de validação de entrada, registro de check-in nem app do host. No piloto, o código é conferido visualmente na portaria do espaço.

#### Scenario: Nenhum leitor no app do associado
- **WHEN** o associado percorre todas as telas do app
- **THEN** nenhuma tela oferece leitura ou validação de QR code de outro associado

#### Scenario: Nenhum registro de check-in
- **WHEN** um associado apresenta seu QR na portaria do espaço
- **THEN** o sistema não registra entrada, horário de check-in nem contagem de presença no espaço

### Requirement: Espaço VIP em destaque na Home
O sistema SHALL exibir na tela Início um bloco sobre o espaço VIP do próximo evento que tiver um, com o nome do evento, a data, o local e as cortesias, e SHALL oferecer um atalho para o hub do Espaço VIP.

#### Scenario: Bloco do espaço VIP na Home
- **WHEN** há um evento futuro com espaço VIP e o associado abre a tela Início
- **THEN** o sistema exibe o bloco com a confirmação do espaço VIP, nome do evento, data, local e cortesias

#### Scenario: Atalho para o hub
- **WHEN** o associado toca no atalho "Saiba mais" ao lado do bloco do espaço VIP
- **THEN** o sistema abre a aba Espaço VIP
