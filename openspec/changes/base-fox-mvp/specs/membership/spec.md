## ADDED Requirements

### Requirement: Estados de plano do associado
O sistema SHALL manter, para cada associado, um estado de plano com dois valores possíveis — **gratuito** e **membro** — registrando a origem e a data de início quando o associado se torna membro. Todo associado SHALL nascer no plano gratuito ao se cadastrar.

#### Scenario: Associado recém-cadastrado
- **WHEN** um associado conclui o cadastro
- **THEN** o sistema registra o plano como gratuito, sem data de início de assinatura

#### Scenario: Origem registrada ao assinar
- **WHEN** um associado se torna membro a partir de um paywall
- **THEN** o sistema registra o plano como membro, com a data de início e a origem de onde a conversão partiu

### Requirement: Acesso de membro derivado de um único valor
O sistema SHALL calcular o acesso de membro em **um único ponto do código**, a partir da flag remota de membership e do estado de plano do associado, segundo a regra: o acesso é concedido quando a flag está desligada **ou** quando o associado é membro. Nenhuma tela, componente ou outro repositório SHALL ler a flag de membership diretamente.

#### Scenario: Flag desligada concede acesso a todos
- **WHEN** a flag de membership está desligada e um associado do plano gratuito usa o app
- **THEN** o sistema concede acesso de membro a esse associado em todos os pontos da UI que dependem de membership

#### Scenario: Flag ligada respeita o plano
- **WHEN** a flag de membership está ligada e um associado do plano gratuito usa o app
- **THEN** o sistema nega o acesso de membro, aplicando os bloqueios e mascaramentos definidos nas demais capabilities

#### Scenario: Flag ligada com associado membro
- **WHEN** a flag de membership está ligada e o associado é membro
- **THEN** o sistema concede acesso de membro

### Requirement: Flag de membership alterável sem novo build
O sistema SHALL obter o estado da flag de membership de uma configuração remota, de modo que ligá-la ou desligá-la NÃO exija um novo build nem nova publicação nas lojas. A flag SHALL ser lida através da camada de repositório, com um valor padrão aplicado quando a configuração remota estiver indisponível.

#### Scenario: Alteração remota é refletida no app
- **WHEN** a flag de membership é alterada na configuração remota
- **THEN** o app passa a refletir o novo estado sem necessidade de atualização pelas lojas

#### Scenario: Configuração remota indisponível
- **WHEN** o app não consegue ler a configuração remota, por falta de conectividade ou falha do serviço
- **THEN** o sistema aplica o último valor conhecido e, na ausência dele, o valor padrão, sem bloquear o uso do app

### Requirement: Nenhuma tela órfã com a flag desligada
Com a flag de membership desligada, o sistema SHALL remover do grafo de navegação as telas que só existem para vender a assinatura — o passo "Torne-se membro" do fluxo de entrada, o paywall contextual e a confirmação de assinatura. Essas telas NÃO SHALL ser apenas escondidas: nenhum caminho do app SHALL conseguir alcançá-las.

#### Scenario: Fluxo de entrada sem o passo de assinatura
- **WHEN** a flag está desligada e um visitante conclui o cadastro
- **THEN** o sistema leva o associado direto para a tela Início, sem exibir o passo "Torne-se membro"

#### Scenario: Benefício abre o detalhe em lugar do paywall
- **WHEN** a flag está desligada e o associado toca em um benefício ativo
- **THEN** o sistema abre o detalhe do benefício com o cupom visível, sem passar pelo paywall contextual

#### Scenario: Nenhum CTA de assinatura visível
- **WHEN** a flag está desligada e o associado navega por Início, detalhe de evento, hub do Espaço VIP e Benefícios
- **THEN** nenhuma dessas telas exibe banner, botão ou aviso convidando a se tornar membro

### Requirement: Passo "Torne-se membro" no fluxo de entrada
Com a flag ligada, o sistema SHALL apresentar, após o cadastro, uma tela com o pitch do plano de membro, listando os benefícios inclusos — acesso ao espaço VIP em todos os eventos, desconto nos eventos do clube, benefícios exclusivos de parceiros e cartão digital de associado — com a ação de assinar e a ação de continuar no plano gratuito. A tela SHALL ser pulável.

#### Scenario: Ver o pitch do plano
- **WHEN** a flag está ligada e o associado conclui o cadastro
- **THEN** o sistema exibe a tela "Torne-se membro" com a lista de benefícios inclusos, a ação de assinar e a ação de continuar no plano gratuito

#### Scenario: Continuar no plano gratuito
- **WHEN** o associado toca em "Continuar no plano gratuito"
- **THEN** o sistema mantém o plano gratuito e leva o associado para a tela Início

### Requirement: Convite a se tornar membro na Home
Com a flag ligada e o associado no plano gratuito, o sistema SHALL exibir na tela Início um bloco convidando-o a se tornar membro, com acesso direto ao fluxo de assinatura. Esse bloco NÃO SHALL ser exibido para associados membros.

#### Scenario: Banner visível para o plano gratuito
- **WHEN** a flag está ligada e um associado do plano gratuito abre a tela Início
- **THEN** o sistema exibe o bloco "Torne-se membro" com a ação de assinar

#### Scenario: Banner ausente para membros
- **WHEN** um associado membro abre a tela Início
- **THEN** o sistema não exibe o bloco "Torne-se membro"

### Requirement: Paywall contextual
Com a flag ligada, o sistema SHALL exibir um paywall contextual quando um associado do plano gratuito tentar acessar um recurso exclusivo de membro, mostrando o recurso bloqueado em primeiro plano, o argumento específico daquele recurso e um resumo do que mais vem incluso, com a ação de assinar e a ação de recusar. O sistema SHALL registrar de qual tela o paywall foi aberto.

#### Scenario: Paywall a partir de um cupom bloqueado
- **WHEN** um associado do plano gratuito toca em um benefício cujo desconto está mascarado
- **THEN** o sistema exibe o paywall contextual, com o código do cupom parcialmente mascarado, o argumento do desconto e a lista do que mais vem incluso

#### Scenario: Recusar o paywall
- **WHEN** o associado toca em "Agora não" no paywall
- **THEN** o sistema fecha o paywall e retorna o associado à tela de origem, com o plano inalterado

#### Scenario: Origem do paywall registrada
- **WHEN** o paywall é exibido a partir de qualquer tela
- **THEN** o sistema registra a tela de origem junto ao evento de exibição do paywall

### Requirement: Confirmação de assinatura sem cobrança
Com a flag ligada, o sistema SHALL confirmar a assinatura diretamente, **sem checkout, sem gateway de pagamento e sem captura de dados de cartão**, promovendo o associado a membro e exibindo uma tela de boas-vindas com seu cartão digital de associado — nome, data de início como membro e número de associado.

#### Scenario: Assinar a partir do paywall
- **WHEN** o associado toca na ação de se tornar membro em qualquer paywall ou CTA de assinatura
- **THEN** o sistema promove o associado a membro e exibe a tela de confirmação com o cartão digital de associado

#### Scenario: Acesso liberado imediatamente
- **WHEN** o associado conclui a tela de confirmação de assinatura
- **THEN** o sistema já concede o acesso ao espaço VIP e aos benefícios de membro, sem exigir reinício do app

#### Scenario: Nenhum dado de pagamento é solicitado
- **WHEN** o associado percorre o fluxo de assinatura do início ao fim
- **THEN** em nenhum momento o sistema solicita dados de cartão, CPF, endereço de cobrança ou redireciona para um checkout externo

### Requirement: Nenhum valor monetário exibido
O sistema NÃO SHALL exibir nenhum valor em reais em nenhum ponto do produto — copy de telas, dados de exemplo, mocks ou testes — enquanto o preço da mensalidade não for definido pelo cliente. O pitch do plano de membro SHALL ser construído sobre os benefícios inclusos, não sobre preço.

#### Scenario: Pitch do plano sem preço
- **WHEN** o associado visualiza a tela "Torne-se membro" ou qualquer paywall contextual
- **THEN** nenhum valor monetário, periodicidade de cobrança ou símbolo de moeda é exibido

#### Scenario: Dados de exemplo sem preço
- **WHEN** os dados iniciais do piloto são cadastrados
- **THEN** nenhum documento de evento, benefício ou configuração contém valor monetário

### Requirement: Número de associado
O sistema SHALL atribuir a cada associado, no momento do cadastro, um número de associado único e sequencial, independente do estado de plano. Esse número SHALL ser exibido nos contextos de identidade de clube — o cartão digital de associado e o QR de acesso ao espaço VIP.

#### Scenario: Número atribuído no cadastro
- **WHEN** um associado conclui o cadastro, por e-mail ou por Strava
- **THEN** o sistema atribui um número de associado único, mesmo que o associado permaneça no plano gratuito

#### Scenario: Números não se repetem
- **WHEN** dois cadastros são concluídos simultaneamente
- **THEN** o sistema atribui números distintos a cada associado, sem colisão

#### Scenario: Número estável ao assinar
- **WHEN** um associado do plano gratuito se torna membro
- **THEN** o sistema mantém o mesmo número de associado atribuído no cadastro

### Requirement: Estado da assinatura visível no Perfil
O sistema SHALL exibir no Perfil, na seção "Conta", o estado atual do plano do associado.

#### Scenario: Perfil de um membro
- **WHEN** um associado membro abre a aba Perfil
- **THEN** o sistema exibe o item "Assinatura" indicando que o plano de membro está ativo

#### Scenario: Perfil do plano gratuito
- **WHEN** a flag está ligada e um associado do plano gratuito abre a aba Perfil
- **THEN** o sistema exibe o item "Assinatura" indicando o plano gratuito, com acesso ao fluxo de assinatura
