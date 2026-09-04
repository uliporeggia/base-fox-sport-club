## ADDED Requirements

### Requirement: Lista de ativações com filtro por tipo
O sistema SHALL exibir a lista de ativações do clube (corridas, trilhas, trekking) permitindo filtrar por tipo de atividade.

#### Scenario: Filtrar por tipo
- **WHEN** o associado seleciona o filtro "Trilha" na tela Ativações
- **THEN** o sistema exibe apenas as ativações do tipo Trilha

#### Scenario: Ver todas as ativações
- **WHEN** o filtro "Todas" está selecionado
- **THEN** o sistema exibe todas as ativações cadastradas

### Requirement: Detalhe da ativação
O sistema SHALL exibir data, horário, local, tipo e descrição de uma ativação selecionada.

#### Scenario: Abrir detalhe
- **WHEN** o associado toca em uma ativação na lista
- **THEN** o sistema exibe a tela de detalhe com banner, tipo, título, data/horário, local e descrição

### Requirement: Confirmação de presença (RSVP)
O sistema SHALL permitir que o associado confirme ou cancele presença em uma ativação, refletindo o estado atual no botão de ação.

#### Scenario: Confirmar presença
- **WHEN** o associado toca em "Confirmar presença" na tela de detalhe
- **THEN** o sistema marca a presença como confirmada e o botão passa a exibir "Presença confirmada ✓"

#### Scenario: Cancelar presença
- **WHEN** o associado toca novamente no botão estando a presença já confirmada
- **THEN** o sistema cancela a confirmação e o botão volta a exibir "Confirmar presença"

### Requirement: Próxima ativação em destaque na Home
O sistema SHALL exibir na tela Início um card com a próxima ativação agendada, permitindo abrir seu detalhe diretamente.

#### Scenario: Abrir próxima ativação pela Home
- **WHEN** o associado toca no card "Próxima ativação" na tela Início
- **THEN** o sistema abre a tela de detalhe dessa ativação
