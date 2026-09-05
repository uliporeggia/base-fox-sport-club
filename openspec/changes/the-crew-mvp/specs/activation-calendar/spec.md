## ADDED Requirements

### Requirement: Lista de ativações com filtro por tipo
O sistema SHALL exibir a lista de ativações do clube (corridas, trilhas, trekking) permitindo filtrar por tipo de atividade.

#### Scenario: Filtrar por tipo
- **WHEN** o associado seleciona o filtro "Trilha" na tela Ativações
- **THEN** o sistema exibe apenas as ativações do tipo Trilha

#### Scenario: Ver todas as ativações
- **WHEN** o filtro "Todas" está selecionado
- **THEN** o sistema exibe todas as ativações cadastradas

### Requirement: Filtro por organizador
O sistema SHALL permitir filtrar as ativações entre "Nossos eventos" (organizados pelo próprio The Crew) e "Onde estaremos" (eventos de terceiros em que o clube marca presença), já que a maior parte do volume de ativações vem de eventos de terceiros.

#### Scenario: Filtrar eventos de terceiros
- **WHEN** o associado seleciona o filtro "Onde estaremos"
- **THEN** o sistema exibe apenas ativações organizadas por terceiros

#### Scenario: Filtrar eventos próprios
- **WHEN** o associado seleciona o filtro "Nossos eventos"
- **THEN** o sistema exibe apenas ativações organizadas pelo The Crew

### Requirement: Detalhe da ativação
O sistema SHALL exibir data, horário, local, tipo, organizador e descrição de uma ativação selecionada.

#### Scenario: Abrir detalhe
- **WHEN** o associado toca em uma ativação na lista
- **THEN** o sistema exibe a tela de detalhe com banner, tipo, título, data/horário, local e descrição

### Requirement: Confirmação de presença (RSVP)
O sistema SHALL permitir que o associado confirme ou cancele presença em uma ativação, refletindo o estado atual no botão de ação. Esse comportamento é o mesmo tanto para ativações organizadas pelo The Crew quanto para eventos de terceiros.

#### Scenario: Confirmar presença
- **WHEN** o associado toca em "Confirmar presença" na tela de detalhe
- **THEN** o sistema marca a presença como confirmada e o botão passa a exibir "Presença confirmada ✓"

#### Scenario: Cancelar presença
- **WHEN** o associado toca novamente no botão estando a presença já confirmada
- **THEN** o sistema cancela a confirmação e o botão volta a exibir "Confirmar presença"

### Requirement: Inscrição externa em eventos de terceiros
Para ativações organizadas por terceiros, o sistema SHALL exibir, além do RSVP, uma ação separada de "Fazer inscrição" que leva a um link externo de inscrição na prova. Essa ação não se aplica a ativações organizadas pelo próprio The Crew.

#### Scenario: Ação de inscrição em evento de terceiro
- **WHEN** o associado abre o detalhe de uma ativação organizada por terceiros
- **THEN** o sistema exibe, junto ao RSVP, uma ação "Fazer inscrição" que abre o link externo de inscrição na prova

#### Scenario: Evento próprio não exibe inscrição externa
- **WHEN** o associado abre o detalhe de uma ativação organizada pelo próprio The Crew
- **THEN** o sistema exibe apenas o botão de confirmar/cancelar presença, sem ação de inscrição externa

### Requirement: Próxima ativação em destaque na Home
O sistema SHALL exibir na tela Início um card com a próxima ativação agendada, permitindo abrir seu detalhe diretamente.

#### Scenario: Abrir próxima ativação pela Home
- **WHEN** o associado toca no card "Próxima ativação" na tela Início
- **THEN** o sistema abre a tela de detalhe dessa ativação
