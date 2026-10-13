## ADDED Requirements

### Requirement: Permissão de notificação pedida no primeiro momento de valor
O sistema SHALL pedir a permissão de notificação do sistema operacional apenas **após o associado confirmar sua primeira presença em um evento**, e NÃO SHALL pedi-la no onboarding, no cadastro ou na primeira abertura do app. Antes do pedido, o sistema SHALL explicar o que o clube envia.

#### Scenario: Permissão pedida após o primeiro RSVP
- **WHEN** o associado confirma presença em um evento pela primeira vez
- **THEN** o sistema explica o que será notificado e então solicita a permissão de notificação ao sistema operacional

#### Scenario: Permissão não pedida na entrada
- **WHEN** o associado percorre o onboarding, o cadastro e a tela Início pela primeira vez
- **THEN** o sistema não solicita permissão de notificação em nenhum desses pontos

#### Scenario: Permissão não é pedida duas vezes
- **WHEN** o associado confirma presença em um segundo evento, tendo já respondido ao pedido de permissão
- **THEN** o sistema não solicita a permissão novamente

### Requirement: App funcional com a permissão negada
O sistema SHALL permanecer plenamente utilizável quando a permissão de notificação for negada, mantendo a caixa de entrada de notificações completa, porque no iOS a negação não pode ser revertida de dentro do app.

#### Scenario: Caixa de entrada completa sem permissão
- **WHEN** um associado que negou a permissão abre a caixa de entrada de notificações
- **THEN** o sistema exibe todas as notificações destinadas a ele, com os mesmos dados que exibiria se a permissão estivesse concedida

#### Scenario: Nenhum bloqueio por permissão negada
- **WHEN** um associado que negou a permissão navega por todas as abas do app
- **THEN** nenhum recurso é bloqueado e nenhum pedido insistente de permissão é exibido

### Requirement: Registro de token por dispositivo
O sistema SHALL registrar o token de notificação por **dispositivo**, vinculado ao associado, guardando a plataforma e a data de atualização, de modo que um associado possa receber notificações em mais de um aparelho. Tokens recusados pelo serviço de push no momento do envio SHALL ser removidos.

#### Scenario: Token registrado após a permissão
- **WHEN** o associado concede a permissão de notificação
- **THEN** o sistema registra o token do dispositivo vinculado ao associado, com a plataforma e a data de atualização

#### Scenario: Dois dispositivos do mesmo associado
- **WHEN** o mesmo associado concede a permissão em um segundo aparelho
- **THEN** o sistema mantém os dois tokens registrados, e as notificações são enviadas para ambos

#### Scenario: Token inválido removido
- **WHEN** o serviço de push recusa um token como inválido durante um envio
- **THEN** o sistema remove esse token do registro, sem afetar os demais tokens do associado

#### Scenario: Token removido ao encerrar a sessão
- **WHEN** o associado encerra a sessão no app
- **THEN** o sistema remove o token daquele dispositivo, para que ele não receba notificações destinadas ao associado que saiu

### Requirement: Disparo de notificações por evento de negócio
O sistema SHALL enviar notificações a partir de eventos de negócio no backend, cobrindo três tipos: **evento novo com espaço VIP** anunciado, **presença confirmada** em um evento, e **nova parceria** fechada. A lógica de envio SHALL residir no backend, não no app.

#### Scenario: Novo evento com espaço VIP
- **WHEN** um evento com espaço VIP é publicado
- **THEN** o sistema envia a notificação correspondente aos associados e registra a notificação na caixa de entrada de cada um

#### Scenario: Presença confirmada
- **WHEN** um associado confirma presença em um evento
- **THEN** o sistema registra uma notificação de confirmação para esse associado, com a referência ao evento

#### Scenario: Nova parceria
- **WHEN** um novo benefício de parceiro é ativado
- **THEN** o sistema envia a notificação correspondente aos associados e a registra na caixa de entrada

### Requirement: Caixa de entrada como fonte de verdade do histórico
O sistema SHALL registrar toda notificação enviada na caixa de entrada do associado, **independentemente de o push ter sido entregue ou de a permissão ter sido concedida**. A caixa de entrada SHALL ser a fonte de verdade do histórico de avisos.

#### Scenario: Notificação registrada sem entrega
- **WHEN** uma notificação é disparada para um associado cujo push não pode ser entregue
- **THEN** o sistema registra a notificação na caixa de entrada daquele associado normalmente

#### Scenario: Abrir a notificação pelo push
- **WHEN** o associado toca em uma notificação recebida no sistema operacional
- **THEN** o sistema abre o app na caixa de entrada ou na tela referenciada pela notificação

### Requirement: Caixa de entrada agrupada por data
O sistema SHALL exibir a caixa de entrada de notificações agrupada por período — começando pelas de hoje, depois as da semana e as mais antigas — cada notificação com título, texto e o tempo relativo desde o recebimento, e as não lidas visualmente destacadas.

#### Scenario: Ver as notificações
- **WHEN** o associado abre a caixa de entrada de notificações
- **THEN** o sistema exibe as notificações agrupadas por período, cada uma com título, texto e tempo relativo, com destaque visual nas não lidas

#### Scenario: Notificação marcada como lida ao ser vista
- **WHEN** o associado abre a caixa de entrada contendo notificações não lidas
- **THEN** o sistema registra como lidas as notificações exibidas e remove o destaque visual delas

#### Scenario: Caixa de entrada vazia
- **WHEN** o associado não possui nenhuma notificação
- **THEN** o sistema exibe um estado vazio, sem mensagem de erro

### Requirement: Marcar todas como lidas
O sistema SHALL oferecer, na caixa de entrada, uma ação para marcar todas as notificações como lidas de uma vez.

#### Scenario: Marcar todas como lidas
- **WHEN** o associado toca na ação de marcar como lidos, havendo notificações não lidas
- **THEN** o sistema marca todas as notificações do associado como lidas e remove o indicador de não lidas do app

### Requirement: Interruptor de notificações no Perfil
O sistema SHALL oferecer, no item "Notificações" da seção "Conta" do Perfil, um interruptor único que liga e desliga o envio de notificações ao associado. Desligá-lo SHALL interromper o envio sem exigir que o associado vá aos ajustes do sistema operacional, e SHALL preservar a caixa de entrada in-app íntegra.

#### Scenario: Desligar as notificações
- **WHEN** o associado desliga o interruptor de notificações no Perfil
- **THEN** o sistema interrompe o envio de notificações a esse associado, mantendo o registro na caixa de entrada

#### Scenario: Caixa de entrada preservada com o interruptor desligado
- **WHEN** um associado com o interruptor desligado abre a caixa de entrada
- **THEN** o sistema exibe todas as notificações destinadas a ele, com o indicador de não lidas funcionando normalmente

#### Scenario: Religar as notificações
- **WHEN** o associado liga novamente o interruptor, tendo a permissão do sistema operacional concedida
- **THEN** o sistema retoma o envio de notificações a esse associado

#### Scenario: Interruptor refletindo permissão negada no sistema operacional
- **WHEN** um associado que negou a permissão do sistema operacional abre o Perfil
- **THEN** o interruptor aparece desligado e o item explica que a permissão precisa ser concedida nos ajustes do sistema operacional

### Requirement: Indicador de não lidas no cabeçalho da Home
O sistema SHALL exibir o acesso à caixa de entrada por um ícone de sino no cabeçalho da tela Início, com um indicador visual sempre que houver ao menos uma notificação não lida.

#### Scenario: Indicador visível
- **WHEN** o associado tem ao menos uma notificação não lida e abre a tela Início
- **THEN** o sistema exibe o indicador visual sobre o ícone de sino no cabeçalho

#### Scenario: Indicador ausente
- **WHEN** o associado não tem notificações não lidas
- **THEN** o ícone de sino é exibido sem indicador

#### Scenario: Abrir a caixa de entrada pelo sino
- **WHEN** o associado toca no ícone de sino no cabeçalho da Home
- **THEN** o sistema abre a caixa de entrada de notificações
