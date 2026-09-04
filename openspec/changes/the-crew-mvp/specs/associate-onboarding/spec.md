## ADDED Requirements

### Requirement: Onboarding com opção de pular
O sistema SHALL apresentar 3 telas de introdução ao clube antes do cadastro, permitindo que o associado pule diretamente para a tela de cadastro a qualquer momento.

#### Scenario: Associado avança pelas telas de onboarding
- **WHEN** o associado abre o app pela primeira vez
- **THEN** o sistema exibe a primeira de 3 telas de onboarding, com indicador de progresso e a ação "Avançar"

#### Scenario: Associado pula o onboarding
- **WHEN** o associado toca em "Pular" em qualquer tela de onboarding
- **THEN** o sistema leva o associado diretamente para a tela de cadastro

### Requirement: Cadastro por e-mail e senha
O sistema SHALL permitir criar uma conta informando nome, e-mail e senha, habilitando a confirmação apenas quando os dados forem válidos.

#### Scenario: Cadastro válido
- **WHEN** o associado informa um nome com mais de 1 caractere e um e-mail contendo "@", e toca em "Criar conta"
- **THEN** o sistema cria a conta e leva o associado para a tela Início

#### Scenario: Cadastro inválido permanece bloqueado
- **WHEN** o nome está vazio ou o e-mail não contém "@"
- **THEN** o botão "Criar conta" permanece desabilitado e o cadastro não é submetido

### Requirement: Cadastro e login via Strava
O sistema SHALL permitir cadastro e login usando a conta Strava do associado via OAuth, marcando a conta como conectada ao Strava automaticamente.

#### Scenario: Cadastro com Strava
- **WHEN** o associado toca em "Cadastrar com Strava" na tela de cadastro
- **THEN** o sistema autentica via Strava, marca a conta como conectada ao Strava e leva o associado para a tela Início

#### Scenario: Login com Strava
- **WHEN** o associado toca em "Entrar com Strava" na tela de login
- **THEN** o sistema autentica via Strava, marca a conta como conectada ao Strava e leva o associado para a tela Início

### Requirement: Login por e-mail e senha
O sistema SHALL permitir login com e-mail e senha, habilitando a confirmação apenas quando ambos os campos estiverem preenchidos.

#### Scenario: Login válido
- **WHEN** o associado preenche e-mail e senha não vazios e toca em "Entrar"
- **THEN** o sistema autentica o associado e leva para a tela Início

### Requirement: Perfil do associado
O sistema SHALL exibir os dados do associado autenticado (nome, e-mail, data de associação) e permitir encerrar a sessão.

#### Scenario: Visualizar perfil
- **WHEN** o associado abre a aba Perfil
- **THEN** o sistema exibe nome, e-mail e um selo "Associado desde <mês/ano>"

#### Scenario: Logout
- **WHEN** o associado toca em "Sair" no perfil
- **THEN** o sistema encerra a sessão, limpa os dados locais de autenticação e retorna o associado à primeira tela de onboarding
