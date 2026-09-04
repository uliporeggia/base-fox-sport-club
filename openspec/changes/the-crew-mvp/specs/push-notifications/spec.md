## ADDED Requirements

### Requirement: Lista de notificações com indicador de não lidas
O sistema SHALL exibir a lista de notificações do associado, sinalizando visualmente quais ainda não foram lidas.

#### Scenario: Ver notificações
- **WHEN** o associado abre a tela de Notificações a partir do atalho na Home
- **THEN** o sistema exibe a lista de notificações, cada uma com título e horário relativo, e um indicador visual nas não lidas

### Requirement: Indicador de notificações não lidas na Home
O sistema SHALL exibir um indicador visual no atalho de notificações da Home sempre que houver ao menos uma notificação não lida.

#### Scenario: Indicador visível
- **WHEN** existe pelo menos uma notificação não lida
- **THEN** o sistema exibe um ponto de destaque sobre o atalho "Avisos" na tela Início
