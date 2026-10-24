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

### Requirement: Degradação elegante quando o teto de atletas é atingido
A aplicação registrada no Strava tem um teto de atletas conectados. Quando a API recusar uma autorização por teto atingido, o sistema SHALL apresentar isso como indisponibilidade temporária da conexão com o Strava — nunca como falha do app — e SHALL manter disponíveis os caminhos que não dependem do Strava.

#### Scenario: Cadastro quando o teto está atingido
- **WHEN** um visitante tenta se cadastrar via Strava e a API recusa por teto de atletas atingido
- **THEN** o sistema explica que a conexão com o Strava está indisponível no momento e mantém o cadastro por e-mail disponível na mesma tela

#### Scenario: Login quando o teto está atingido
- **WHEN** um associado existente tenta entrar via Strava e a API recusa por teto atingido
- **THEN** o sistema oferece a entrada por link de e-mail, de modo que o associado não fique impedido de acessar sua conta

#### Scenario: Conexão a partir do Perfil quando o teto está atingido
- **WHEN** um associado toca em conectar o Strava no Perfil e a API recusa por teto atingido
- **THEN** o sistema mantém o estado de desconectado e informa que a conexão está indisponível no momento, sem mensagem de erro do sistema

### Requirement: Identificador da aplicação Strava obtido de configuração remota
O sistema SHALL obter o identificador público da aplicação Strava (`client_id`) da configuração remota, pela camada de repositório, e NÃO SHALL embarcá-lo fixo no código do app. O segredo da aplicação (`client_secret`) SHALL ser usado exclusivamente no servidor, na troca de código por token, e nunca embarcado no app.

#### Scenario: Troca da aplicação Strava sem nova publicação
- **WHEN** a aplicação Strava é substituída por outra, com novo identificador
- **THEN** a atualização da configuração remota basta para o app passar a usar a nova aplicação, sem exigir novo build nem nova publicação nas lojas

#### Scenario: Segredo da aplicação fora do app
- **WHEN** o app inicia o fluxo de autorização com o Strava
- **THEN** o segredo da aplicação não trafega pelo app nem está presente no pacote distribuído, ficando a troca de código por token a cargo do servidor

### Requirement: Reautorização após troca da aplicação Strava
Os tokens do Strava são emitidos por aplicação. Caso a aplicação seja substituída, os tokens existentes deixam de valer e os associados precisam autorizar novamente. O sistema SHALL tratar essa situação como desconexão comum, **sem encerrar a sessão** do associado e **sem criar associados duplicados** na reautorização, já que o identificador do atleta no Strava é o mesmo entre aplicações.

#### Scenario: Token invalidado pela troca de aplicação
- **WHEN** o token Strava de um associado deixa de ser válido porque a aplicação foi substituída
- **THEN** o sistema exibe a conta como desconectada do Strava, mantém a sessão do associado ativa e oferece a ação de conectar

#### Scenario: Reautorização reconcilia no mesmo associado
- **WHEN** um associado reautoriza o acesso pela nova aplicação Strava
- **THEN** o sistema reconhece o mesmo identificador de atleta e restabelece o vínculo no associado existente, sem criar outro registro

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
