## ADDED Requirements

### Requirement: Conectar Strava a partir da Home
O sistema SHALL exibir um banner na Home convidando o associado a conectar sua conta Strava, enquanto ela não estiver conectada.

#### Scenario: Conectar pelo banner da Home
- **WHEN** o associado toca em "Conectar" no banner da Home
- **THEN** o sistema conecta a conta Strava e o banner deixa de ser exibido

### Requirement: Alternar conexão do Strava no Perfil
O sistema SHALL permitir conectar ou desconectar a conta Strava a partir da tela de Perfil, exibindo o status atual.

#### Scenario: Desconectar pelo Perfil
- **WHEN** o associado, com Strava conectado, toca no item "Strava" no Perfil
- **THEN** o sistema desconecta a conta e o status exibido muda para "Conectar"

#### Scenario: Conectar pelo Perfil
- **WHEN** o associado, com Strava desconectado, toca no item "Strava" no Perfil
- **THEN** o sistema conecta a conta e o status exibido muda para "Conectado"
