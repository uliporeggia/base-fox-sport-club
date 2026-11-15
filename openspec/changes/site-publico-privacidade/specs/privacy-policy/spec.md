## ADDED Requirements

### Requirement: O inventário de dados é levantado do código, não presumido

O conteúdo da política SHALL ser derivado de uma verificação no código-fonte, nas regras do Firestore e na configuração dos SDKs de terceiros. Nenhum item SHALL ser declarado por suposição. A verificação SHALL cobrir, no mínimo, o que é gravado em `associates`, `rsvps`, `vip_accesses`, `devices` e `notifications`, e quais SDKs enviam dados para fora.

#### Scenario: Dado coletado pelo app não consta da política

- **WHEN** a auditoria encontra um campo persistido ou enviado a terceiro que não está descrito na política
- **THEN** a política é corrigida antes da publicação, e não o contrário

#### Scenario: Política declara coleta que o app não faz

- **WHEN** a auditoria encontra na política um dado que o aplicativo não coleta
- **THEN** o item é removido, porque declarar coleta inexistente também é declaração incorreta

### Requirement: A política descreve dados, finalidades e terceiros

A política SHALL listar os dados pessoais tratados, a finalidade de cada um e os terceiros que os recebem, nomeando ao menos Google Firebase, Expo, Sentry e Strava, com o papel de cada um. SHALL informar que a conexão com o Strava importa nome, foto e identificador do atleta e que atividades não são lidas nem armazenadas.

#### Scenario: Titular quer saber quem recebe seus dados

- **WHEN** um titular lê a política
- **THEN** encontra a lista de terceiros, o que cada um recebe e para quê

### Requirement: A política atende à LGPD

A política SHALL informar a base legal de cada tratamento, os direitos do titular previstos na LGPD, o prazo ou critério de retenção, e um canal de contato operante para exercício de direitos. SHALL identificar o controlador dos dados.

#### Scenario: Titular exerce um direito

- **WHEN** um titular quer acessar, corrigir ou excluir seus dados
- **THEN** a política indica um canal de contato e o caminho a seguir, incluindo o link para a solicitação de exclusão de conta

### Requirement: A política é consistente com o formulário de Segurança de Dados do Google Play

As declarações da política SHALL ser consistentes com as respostas do formulário de Segurança de Dados da ficha do Google Play, que é declaração separada e comparada pelo Google. Dados retidos após a exclusão da conta por motivo de segurança, prevenção a fraude ou obrigação legal SHALL ser divulgados na política.

#### Scenario: Formulário de Segurança de Dados é preenchido ou alterado

- **WHEN** o formulário de Segurança de Dados é preenchido ou alterado
- **THEN** a política é conferida contra ele na mesma ocasião, e qualquer divergência é resolvida antes do envio

#### Scenario: Há retenção após exclusão

- **WHEN** algum dado é mantido após a exclusão da conta por exigência legal ou de segurança
- **THEN** a política descreve qual dado, por que e por quanto tempo

### Requirement: A política é revisável pelo cliente antes de publicar

A política SHALL ser submetida ao cliente para revisão antes de ser referenciada em qualquer ficha de loja, com a questão do controlador dos dados apresentada explicitamente como decisão dele.

#### Scenario: Controlador não decidido

- **WHEN** a identificação do controlador ainda não foi decidida pelo cliente
- **THEN** a política não é referenciada nas fichas de loja, e a pendência fica registrada como bloqueio de publicação
