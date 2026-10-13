## ADDED Requirements

### Requirement: Onboarding de 3 passos, pulável
O sistema SHALL apresentar 3 telas de introdução ao clube antes do cadastro, com indicador de progresso, e SHALL permitir que o visitante pule direto para o cadastro a partir de qualquer um dos passos. Os três passos apresentam, nesta ordem, a presença móvel do clube, o espaço VIP e os benefícios de parceiros.

#### Scenario: Primeiro acesso ao app
- **WHEN** o visitante abre o app pela primeira vez
- **THEN** o sistema exibe o passo 1 de 3 ("O clube que vai até você"), com indicador de progresso, a ação "Pular" e a ação "Avançar"

#### Scenario: Avançar até o último passo
- **WHEN** o visitante avança do passo 2 para o passo 3 ("Vantagens que crescem com o clube")
- **THEN** o sistema exibe a ação final como "Começar", em lugar de "Avançar"

#### Scenario: Pular o onboarding
- **WHEN** o visitante toca em "Pular" em qualquer um dos três passos
- **THEN** o sistema leva o visitante direto para a tela de cadastro

#### Scenario: Onboarding não reaparece
- **WHEN** o visitante conclui ou pula o onboarding e depois reabre o app
- **THEN** o sistema não exibe o onboarding novamente, levando o visitante para o cadastro ou para o Início conforme haja sessão ativa

### Requirement: Cadastro por e-mail e senha
O sistema SHALL permitir criar uma conta informando nome, e-mail e senha, habilitando a ação "Criar conta" apenas quando os três campos forem válidos. A senha SHALL ter no mínimo 8 caracteres.

#### Scenario: Cadastro válido
- **WHEN** o visitante informa um nome não vazio, um e-mail em formato válido e uma senha de 8 caracteres ou mais, e toca em "Criar conta"
- **THEN** o sistema cria a conta, atribui um número de associado e leva o associado ao próximo passo do fluxo de entrada

#### Scenario: Senha curta bloqueia o cadastro
- **WHEN** a senha informada tem menos de 8 caracteres
- **THEN** a ação "Criar conta" permanece desabilitada e o cadastro não é submetido

#### Scenario: E-mail inválido bloqueia o cadastro
- **WHEN** o e-mail informado não está em formato válido ou o nome está vazio
- **THEN** a ação "Criar conta" permanece desabilitada e o cadastro não é submetido

#### Scenario: E-mail já cadastrado
- **WHEN** o visitante submete um cadastro com um e-mail que já possui conta
- **THEN** o sistema exibe uma mensagem informando que o e-mail já está em uso e oferece o caminho de entrar na conta existente

### Requirement: Cadastro e login via Strava
O sistema SHALL permitir criar conta e entrar usando a conta Strava do visitante via OAuth, importando nome e foto quando disponíveis, e marcando a conta como conectada ao Strava. Essa opção SHALL ser apresentada como alternativa ao cadastro por e-mail, e é opcional.

#### Scenario: Cadastro com Strava
- **WHEN** o visitante toca em "Cadastrar com Strava" na tela de cadastro e autoriza o acesso
- **THEN** o sistema cria a conta, importa nome e foto do Strava, marca a conta como conectada ao Strava, atribui um número de associado e leva o associado ao próximo passo do fluxo de entrada

#### Scenario: Autorização recusada no Strava
- **WHEN** o visitante recusa a autorização na tela do Strava ou o fluxo OAuth é interrompido
- **THEN** o sistema retorna o visitante à tela de cadastro sem criar conta e sem exibir erro de falha do sistema

#### Scenario: Entrar com uma conta Strava já cadastrada
- **WHEN** o visitante autentica via Strava com uma conta Strava já associada a um associado existente
- **THEN** o sistema entra na conta existente, sem criar duplicata

### Requirement: Login por e-mail e senha
O sistema SHALL permitir entrar com e-mail e senha a partir da tela de cadastro, habilitando a ação de entrar apenas quando ambos os campos estiverem preenchidos. O mockup não desenha a tela de login — ela é alcançada pelo link "Já tem conta? Entrar" na tela de cadastro e SHALL reutilizar a identidade visual daquela tela.

#### Scenario: Acessar o login
- **WHEN** o visitante toca em "Já tem conta? Entrar" na tela de cadastro
- **THEN** o sistema exibe a tela de login, com os campos de e-mail e senha e a opção de entrar com Strava

#### Scenario: Login válido
- **WHEN** o visitante preenche e-mail e senha corretos e confirma
- **THEN** o sistema autentica o associado e o leva para a tela Início

#### Scenario: Credenciais incorretas
- **WHEN** o e-mail não existe ou a senha está incorreta
- **THEN** o sistema exibe uma mensagem de credenciais inválidas sem revelar qual dos dois campos está errado, e mantém o associado na tela de login

### Requirement: Sessão persistente
O sistema SHALL manter a sessão do associado entre aberturas do app, levando-o direto para a tela Início enquanto houver sessão válida.

#### Scenario: Reabrir o app autenticado
- **WHEN** o associado com sessão válida abre o app
- **THEN** o sistema exibe a tela Início sem pedir autenticação novamente

### Requirement: Perfil do associado
O sistema SHALL exibir, na aba Perfil, a foto ou as iniciais do associado, seu nome, seu e-mail e o selo de associado do clube, organizados em uma seção "Conta" (assinatura, Strava, notificações) e uma seção "Dados" (editar dados pessoais), além da ação de sair.

#### Scenario: Visualizar o perfil
- **WHEN** o associado abre a aba Perfil
- **THEN** o sistema exibe foto ou iniciais, nome, e-mail, o selo de associado e as seções "Conta" e "Dados"

#### Scenario: Item de notificações é um interruptor
- **WHEN** o associado visualiza o item "Notificações" na seção "Conta"
- **THEN** o sistema exibe um interruptor de ligar e desligar, não uma linha de navegação — a caixa de entrada é alcançada pelo sino no cabeçalho da Home

### Requirement: Edição de nome e foto
O sistema SHALL permitir ao associado alterar seu nome e sua foto a partir do item "Editar dados pessoais" do Perfil. A alteração de e-mail e de senha SHALL ficar fora desta versão, por exigir reautenticação e um caminho alternativo para contas sem senha criadas via Strava.

#### Scenario: Alterar o nome
- **WHEN** o associado edita o nome para um valor não vazio e salva
- **THEN** o sistema persiste o novo nome e passa a exibi-lo no Perfil, na saudação da Home e no QR de acesso ao espaço VIP

#### Scenario: Nome vazio é rejeitado
- **WHEN** o associado tenta salvar com o campo de nome vazio
- **THEN** a ação de salvar permanece desabilitada e nada é persistido

#### Scenario: E-mail e senha não são editáveis
- **WHEN** o associado abre a tela de editar dados pessoais
- **THEN** o sistema exibe apenas nome e foto como campos editáveis, sem campos de e-mail ou senha

### Requirement: Encerrar sessão
O sistema SHALL permitir ao associado encerrar a sessão a partir do Perfil, limpando os dados locais de autenticação.

#### Scenario: Sair da conta
- **WHEN** o associado toca em "Sair" no Perfil e confirma
- **THEN** o sistema encerra a sessão, limpa os dados locais de autenticação e retorna o associado à tela de cadastro, sem reexibir o onboarding
