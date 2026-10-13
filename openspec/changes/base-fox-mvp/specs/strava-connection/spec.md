## ADDED Requirements

### Requirement: Estado de conexão com o Strava
O sistema SHALL manter, para cada associado, se a conta Strava está conectada e, quando conectada, o identificador e o nome de usuário do atleta no Strava. A conexão SHALL ser opcional — nenhum recurso do app depende dela nesta versão.

#### Scenario: Conta criada com Strava
- **WHEN** um associado se cadastra via Strava
- **THEN** o sistema registra a conta como conectada ao Strava, guardando o identificador e o nome de usuário do atleta

#### Scenario: Conta criada por e-mail
- **WHEN** um associado se cadastra por e-mail e senha
- **THEN** o sistema registra a conta como não conectada ao Strava

#### Scenario: Nenhum recurso bloqueado pela ausência de Strava
- **WHEN** um associado sem Strava conectado navega por todas as abas do app
- **THEN** nenhum recurso é bloqueado ou degradado pela ausência da conexão

### Requirement: Conexão e desconexão a partir do Perfil
O sistema SHALL exibir, no item "Strava" da seção "Conta" do Perfil, o estado atual da conexão — incluindo o nome de usuário do atleta quando conectado — e SHALL permitir conectar ou desconectar a conta a partir dali.

#### Scenario: Perfil com Strava conectado
- **WHEN** um associado com Strava conectado abre a aba Perfil
- **THEN** o item "Strava" indica a conexão ativa, exibe o nome de usuário do atleta e oferece a ação de desconectar

#### Scenario: Desconectar pelo Perfil
- **WHEN** o associado toca na ação de desconectar o Strava
- **THEN** o sistema remove o vínculo e os dados do atleta guardados, e o item passa a oferecer a ação de conectar

#### Scenario: Perfil com Strava desconectado
- **WHEN** um associado sem Strava conectado abre a aba Perfil
- **THEN** o item "Strava" indica a ausência de conexão e oferece a ação de conectar

#### Scenario: Conectar pelo Perfil
- **WHEN** o associado toca na ação de conectar o Strava e autoriza o acesso
- **THEN** o sistema registra a conexão, guarda o identificador e o nome de usuário do atleta, e o item passa a indicar a conexão ativa

#### Scenario: Autorização recusada ao conectar
- **WHEN** o associado recusa a autorização na tela do Strava ou o fluxo OAuth é interrompido
- **THEN** o sistema mantém o estado de desconectado e retorna o associado ao Perfil sem mensagem de erro do sistema

### Requirement: Desconectar não encerra a sessão de contas criadas via Strava
Para associados que criaram a conta via Strava, desconectar o Strava SHALL remover apenas o vínculo com o Strava, mantendo a conta e a sessão ativas no app.

#### Scenario: Conta criada via Strava após desconectar
- **WHEN** um associado que se cadastrou via Strava desconecta o Strava no Perfil
- **THEN** o sistema mantém a conta e a sessão ativas, e o associado continua usando o app normalmente

### Requirement: Nenhum convite de conexão na Home
O sistema NÃO SHALL exibir banner, bloco ou convite de conexão com o Strava na tela Início. A conexão SHALL ser oferecida apenas no cadastro e no Perfil.

#### Scenario: Home sem banner de Strava
- **WHEN** um associado sem Strava conectado abre a tela Início
- **THEN** nenhum banner, bloco ou convite de conexão com o Strava é exibido
