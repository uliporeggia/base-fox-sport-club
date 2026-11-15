## ADDED Requirements

### Requirement: Página pública de solicitação de exclusão de conta

O site SHALL ter uma página dedicada à solicitação de exclusão de conta, acessível por URL estável, que carrega sem erro e **SHALL NOT** exigir login — o solicitante pode não conseguir mais entrar na conta que quer excluir.

#### Scenario: Solicitante sem acesso à conta

- **WHEN** alguém que não consegue mais entrar no aplicativo abre a página de exclusão
- **THEN** consegue registrar a solicitação sem autenticar

#### Scenario: Link registrado na ficha do Google Play

- **WHEN** o revisor do Google Play abre a URL registrada no campo de exclusão de conta
- **THEN** a página carrega sem erro e o caminho de exclusão está em destaque, não escondido em rodapé ou em texto corrido

### Requirement: A página identifica o aplicativo e o desenvolvedor como aparecem na ficha

A página SHALL nomear o aplicativo e o desenvolvedor exatamente como constam na ficha da loja, para que o revisor confirme que a página pertence ao app que a declarou.

#### Scenario: Revisor confere a correspondência

- **WHEN** o revisor compara a página com a ficha da loja
- **THEN** encontra na página o nome do aplicativo e o nome do desenvolvedor usados na ficha

### Requirement: A página declara o que é apagado e o que é retido

A página SHALL descrever quais dados são apagados com a conta e quais, se algum, são retidos, por qual motivo e por quanto tempo. SHALL deixar explícito que desativar ou congelar a conta não substitui a exclusão.

#### Scenario: Solicitante quer saber o efeito do pedido

- **WHEN** o solicitante lê a página antes de pedir a exclusão
- **THEN** sabe que a conta e os dados associados são apagados, e quais exceções de retenção existem

### Requirement: A solicitação tem prazo e confirmação

A página SHALL informar o prazo de atendimento e o meio pelo qual o solicitante é informado da conclusão. O canal de recebimento das solicitações SHALL ser operante e monitorado.

#### Scenario: Solicitação é registrada

- **WHEN** uma solicitação de exclusão é enviada
- **THEN** o solicitante recebe confirmação de recebimento e é informado do prazo de atendimento

### Requirement: O caminho web não substitui o caminho dentro do aplicativo

A exclusão de conta pela web SHALL ser tratada como uma das duas vias exigidas pelo Google Play. A ausência da via dentro do aplicativo SHALL ser registrada como pendência bloqueante de publicação, e não como resolvida por esta capability.

#### Scenario: Publicação é preparada sem exclusão in-app

- **WHEN** a ficha da loja é preparada com a URL de exclusão preenchida, mas o aplicativo ainda não oferece exclusão de conta
- **THEN** a pendência do caminho in-app permanece aberta e explicitamente marcada como bloqueio de publicação
