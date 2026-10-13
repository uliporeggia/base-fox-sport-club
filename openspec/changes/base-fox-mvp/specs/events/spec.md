## ADDED Requirements

### Requirement: Lista de eventos agrupada por mês
O sistema SHALL exibir, na aba Eventos, a lista de eventos do clube em ordem cronológica crescente, agrupada por mês, com o nome do mês como cabeçalho de cada grupo. A UI SHALL usar o termo "Eventos", nunca "Ativações".

#### Scenario: Ver a lista de eventos
- **WHEN** o associado abre a aba Eventos
- **THEN** o sistema exibe os eventos futuros em ordem cronológica, agrupados sob o cabeçalho do mês a que pertencem

#### Scenario: Eventos de meses distintos
- **WHEN** a lista contém eventos de outubro e de novembro
- **THEN** o sistema exibe dois grupos, cada um sob o cabeçalho do seu mês

#### Scenario: Nenhum evento cadastrado
- **WHEN** não há eventos futuros cadastrados
- **THEN** o sistema exibe um estado vazio informando que novos eventos serão anunciados, sem mensagem de erro

### Requirement: Filtro por modalidade
O sistema SHALL permitir filtrar a lista de eventos por modalidade — Corrida, Trilha e Trekking — além da opção "Todos", que é o estado inicial.

#### Scenario: Filtrar por trilha
- **WHEN** o associado seleciona o filtro "Trilha"
- **THEN** o sistema exibe apenas os eventos da modalidade Trilha, mantendo o agrupamento por mês

#### Scenario: Estado inicial sem filtro
- **WHEN** o associado abre a aba Eventos
- **THEN** o filtro "Todos" está selecionado e todos os eventos futuros são exibidos

#### Scenario: Filtro sem resultados
- **WHEN** o associado seleciona uma modalidade sem eventos futuros cadastrados
- **THEN** o sistema exibe um estado vazio para aquela modalidade, mantendo os filtros acessíveis

### Requirement: Card do evento na lista
Cada item da lista SHALL exibir o dia e o mês, a modalidade com a distância, o nome do evento, o horário e o local, e o organizador. Quando o clube montar espaço VIP naquele evento, o card SHALL exibir também uma marcação de espaço VIP.

#### Scenario: Card de evento com espaço VIP
- **WHEN** a lista exibe um evento em que o clube montará espaço VIP
- **THEN** o card apresenta dia, mês, modalidade com distância, nome, horário, local, organizador e a marcação de espaço VIP

#### Scenario: Card de evento sem espaço VIP
- **WHEN** a lista exibe um evento em que o clube não montará espaço VIP
- **THEN** o card apresenta os mesmos dados sem a marcação de espaço VIP

### Requirement: Organizador registrado sem filtro na UI
O sistema SHALL registrar, em cada evento, se o organizador é o próprio clube ou um terceiro, e SHALL exibir o organizador no card da lista. Esta versão NÃO SHALL oferecer filtro por organizador, porque hoje só existem eventos próprios do clube.

#### Scenario: Organizador exibido no card
- **WHEN** a lista exibe um evento organizado pelo clube
- **THEN** o card identifica o clube como organizador

#### Scenario: Ausência de filtro por organizador
- **WHEN** o associado abre a aba Eventos
- **THEN** os filtros disponíveis são apenas os de modalidade, sem opção de filtrar por organizador

### Requirement: Detalhe do evento
O sistema SHALL exibir, ao selecionar um evento, uma tela de detalhe com imagem de capa, modalidade e distância, nome, data e horário de largada, local com ponto de encontro e cidade, um bloco de espaço VIP, a descrição do evento e a ação de confirmação de presença.

#### Scenario: Abrir o detalhe
- **WHEN** o associado toca em um evento na lista
- **THEN** o sistema exibe a tela de detalhe empilhada sobre a aba Eventos, com capa, modalidade, distância, nome, data, horário de largada, local, bloco de espaço VIP, descrição e a ação de presença

#### Scenario: Voltar para a lista
- **WHEN** o associado volta a partir do detalhe
- **THEN** o sistema retorna à aba Eventos preservando o filtro de modalidade que estava selecionado

### Requirement: Bloco de espaço VIP no detalhe, por estado de acesso
O bloco de espaço VIP no detalhe do evento SHALL variar conforme o acesso de membro do associado. Com acesso, SHALL exibir as cortesias disponíveis e a janela de funcionamento. Sem acesso, SHALL informar que o espaço é exclusivo de membros e oferecer o caminho de assinatura. Para eventos sem espaço VIP, o bloco NÃO SHALL ser exibido.

#### Scenario: Detalhe com acesso de membro
- **WHEN** um associado com acesso de membro abre o detalhe de um evento com espaço VIP
- **THEN** o bloco exibe as cortesias disponíveis e a janela de funcionamento do espaço

#### Scenario: Detalhe sem acesso de membro
- **WHEN** a flag de membership está ligada e um associado do plano gratuito abre o detalhe de um evento com espaço VIP
- **THEN** o bloco informa que o acesso é exclusivo para membros e a tela oferece a ação de se tornar membro como ação principal

#### Scenario: Evento sem espaço VIP
- **WHEN** o associado abre o detalhe de um evento em que o clube não montará espaço VIP
- **THEN** nenhum bloco de espaço VIP é exibido, e a ação de confirmar presença permanece disponível

### Requirement: Confirmação de presença disponível nos dois planos
O sistema SHALL permitir que qualquer associado confirme ou cancele presença em um evento, **independentemente do estado de plano**. O bloqueio de membership recai sobre o acesso ao espaço VIP, nunca sobre a confirmação de presença.

#### Scenario: Confirmar presença como membro
- **WHEN** um associado com acesso de membro toca em "Confirmar presença" no detalhe do evento
- **THEN** o sistema registra a presença e a ação passa a indicar que a presença está confirmada

#### Scenario: Confirmar presença no plano gratuito
- **WHEN** a flag está ligada e um associado do plano gratuito toca na ação de confirmar apenas a presença, apresentada como ação secundária ao lado do convite a se tornar membro
- **THEN** o sistema registra a presença normalmente, mantendo o plano gratuito inalterado

#### Scenario: Cancelar presença
- **WHEN** o associado toca novamente na ação estando a presença já confirmada
- **THEN** o sistema cancela a confirmação e a ação volta a oferecer a confirmação de presença

#### Scenario: Presença persistida entre sessões
- **WHEN** o associado confirma presença, fecha o app e reabre o detalhe daquele evento
- **THEN** o sistema exibe a presença como confirmada

### Requirement: Próximo evento em destaque na Home
O sistema SHALL exibir na tela Início um bloco com o próximo evento agendado, trazendo dia, mês, nome, dia da semana com horário e local, e SHALL permitir abrir seu detalhe diretamente. O bloco SHALL oferecer também um atalho para a lista completa de eventos.

#### Scenario: Abrir o próximo evento pela Home
- **WHEN** o associado toca no bloco do próximo evento na tela Início
- **THEN** o sistema abre a tela de detalhe desse evento

#### Scenario: Atalho para a lista completa
- **WHEN** o associado toca em "Ver todos" ao lado do próximo evento
- **THEN** o sistema abre a aba Eventos com o filtro "Todos" selecionado

#### Scenario: Nenhum evento futuro
- **WHEN** não há eventos futuros agendados
- **THEN** o sistema exibe um estado vazio no lugar do bloco de próximo evento, sem quebrar o restante da Home
