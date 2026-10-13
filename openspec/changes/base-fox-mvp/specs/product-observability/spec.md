## ADDED Requirements

### Requirement: Rastreamento de eventos comerciais
O sistema SHALL registrar no Firebase Analytics os eventos de negócio da taxonomia do MVP, cobrindo onboarding, autenticação, Início, membership, eventos, espaço VIP, benefícios, Strava e notificações, com os parâmetros definidos para cada um. Os eventos reservados do Firebase (`sign_up`, `login`) SHALL ser usados onde existem, para aproveitar os relatórios de funil automáticos do console.

#### Scenario: Evento de cadastro
- **WHEN** um associado conclui o cadastro por e-mail ou por Strava
- **THEN** o sistema registra o evento reservado `sign_up` com o parâmetro de método igual a `email` ou `strava`

#### Scenario: Evento de confirmação de presença
- **WHEN** um associado confirma presença em um evento
- **THEN** o sistema registra `rsvp_confirmed` com os parâmetros de identificador do evento, modalidade e se o evento tem espaço VIP

#### Scenario: Evento de geração de acesso VIP
- **WHEN** um associado gera seu acesso ao espaço VIP
- **THEN** o sistema registra `vip_access_generated` com o identificador do evento

### Requirement: Origem do paywall registrada
O sistema SHALL registrar, a cada exibição do paywall contextual, **de qual tela ele foi aberto**, para permitir identificar qual ponto do app converte assinaturas.

#### Scenario: Paywall aberto pelo benefício
- **WHEN** o paywall é exibido a partir de um benefício bloqueado
- **THEN** o sistema registra `paywall_viewed` com a origem identificando o detalhe do benefício

#### Scenario: Paywall aberto pelo hub do Espaço VIP
- **WHEN** o paywall é exibido a partir do hub do Espaço VIP
- **THEN** o sistema registra `paywall_viewed` com a origem identificando o hub do Espaço VIP

#### Scenario: Assinatura confirmada
- **WHEN** um associado é promovido a membro
- **THEN** o sistema registra `subscription_confirmed` com a origem de onde a conversão partiu

### Requirement: Rastreamento automático de navegação
O sistema SHALL registrar eventos `screen_view` automaticamente a cada mudança de tela ou aba, por meio de um listener de mudança de estado de navegação, sem instrumentação manual por tela.

#### Scenario: Troca de aba
- **WHEN** o associado troca de aba na tab bar
- **THEN** o sistema registra um `screen_view` correspondente à nova tela, sem chamada explícita na tela

### Requirement: Nenhum valor monetário na instrumentação
O sistema NÃO SHALL enviar valor monetário, preço, moeda ou receita como parâmetro de nenhum evento de analytics, enquanto o preço da mensalidade não for definido.

#### Scenario: Assinatura registrada sem valor
- **WHEN** o sistema registra a confirmação de uma assinatura
- **THEN** o evento não contém parâmetro de valor, preço, moeda ou receita

### Requirement: Nenhum dado pessoal sensível na instrumentação
O sistema NÃO SHALL enviar e-mail, senha, nome completo, telefone ou token de autenticação como parâmetro de evento de analytics nem como contexto de erro. A identificação do associado SHALL usar o identificador interno.

#### Scenario: Evento com identificação do associado
- **WHEN** o sistema registra um evento que precisa identificar o associado
- **THEN** o evento carrega o identificador interno do associado, nunca o e-mail ou o nome

### Requirement: Monitoramento de erros e crashes
O sistema SHALL reportar ao Sentry os erros não tratados e crashes, com o ambiente e a versão do build preenchidos, e com o identificador interno do associado quando houver sessão ativa. Um error boundary no componente raiz SHALL capturar as exceções de renderização.

#### Scenario: Erro não tratado é capturado
- **WHEN** ocorre uma exceção não tratada em qualquer tela do app
- **THEN** o sistema captura o erro pelo error boundary e o envia ao Sentry com o ambiente e a versão do build preenchidos

#### Scenario: Contexto de usuário sem dado sensível
- **WHEN** um associado autenticado gera um evento de erro
- **THEN** o sistema anexa ao evento o identificador interno do associado, nunca o e-mail em texto puro

#### Scenario: Breadcrumbs de navegação
- **WHEN** um erro é reportado
- **THEN** o evento no Sentry inclui a trilha de navegação que antecedeu o erro

### Requirement: Separação de ambientes na observabilidade
O sistema SHALL distinguir os dados de desenvolvimento, homologação e produção tanto no Sentry quanto no Firebase Analytics, para que a instrumentação do piloto não seja contaminada por uso interno.

#### Scenario: Erro em desenvolvimento
- **WHEN** um erro ocorre em um build de desenvolvimento
- **THEN** o evento no Sentry é marcado com o ambiente de desenvolvimento, separado dos erros de produção

### Requirement: Nenhum evento de loja
O sistema NÃO SHALL registrar eventos de catálogo de produtos, visualização de produto ou pedido, porque a loja não faz parte deste produto.

#### Scenario: Taxonomia sem eventos de loja
- **WHEN** a instrumentação do app é revisada
- **THEN** nenhum evento referente a produto, catálogo, carrinho ou pedido existe na taxonomia
