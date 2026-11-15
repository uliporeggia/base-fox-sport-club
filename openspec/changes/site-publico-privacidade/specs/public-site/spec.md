## ADDED Requirements

### Requirement: Site público acessível sem autenticação

O site SHALL ser servido publicamente por HTTPS e SHALL carregar sem erro, sem login e sem qualquer barreira de consentimento que impeça a leitura do conteúdo. Todas as páginas exigidas por lojas e pelo Strava SHALL ter URL estável e direta.

#### Scenario: Visitante anônimo abre qualquer página exigida

- **WHEN** um visitante sem sessão abre a raiz do site, a página de privacidade ou a de exclusão de conta
- **THEN** a página responde com HTTP 200 por HTTPS e exibe o conteúdo completo, sem redirecionar para login

#### Scenario: Revisor de loja verifica o link da ficha

- **WHEN** o link registrado na ficha da loja é aberto a partir de outra rede, sem cookies da sessão do desenvolvedor
- **THEN** a página carrega normalmente e não apresenta erro, página em branco ou aviso de site não encontrado

### Requirement: Página raiz descreve o produto e identifica o operador

A página raiz SHALL descrever o que é o aplicativo, a quem se destina e quais são suas funções principais — eventos, acesso ao espaço VIP por QR code, benefícios de parceiros e notificações. SHALL identificar a Oreggia Tech como operadora e SHALL oferecer um canal de contato. SHALL conter links visíveis para a política de privacidade e para a solicitação de exclusão de conta.

#### Scenario: Visitante entende o produto sem instalar o app

- **WHEN** um visitante lê a página raiz
- **THEN** encontra o nome do aplicativo, a descrição das funções principais, a identificação do operador, um canal de contato e os links para privacidade e exclusão de conta

### Requirement: A descrição do uso do Strava no site corresponde à declarada na aplicação registrada

A página raiz SHALL conter uma seção dedicada ao uso do Strava que afirme que a conexão serve apenas ao cadastro e à identificação do associado, importando nome, foto e identificador do atleta, e que o aplicativo não lê, não exibe e não armazena atividades. Essa descrição SHALL ser materialmente equivalente à registrada na aplicação Strava, porque o review de capacidade compara as duas.

#### Scenario: Texto do site diverge da aplicação registrada

- **WHEN** a descrição registrada na aplicação Strava é alterada
- **THEN** a seção correspondente do site é atualizada na mesma mudança, de modo que as duas nunca afirmem escopos de uso diferentes

#### Scenario: Revisor do Strava compara site e aplicação

- **WHEN** o revisor abre o site informado no campo Site da aplicação
- **THEN** encontra a descrição do uso do Strava coerente com a declarada no registro, sem prometer leitura de atividades

### Requirement: O site não expõe a marca do cliente nem valores em reais

O site SHALL seguir as mesmas restrições duras do aplicativo: SHALL NOT conter qualquer menção a "Kailash", "XKR" ou "KTR", e SHALL NOT exibir qualquer valor em reais, incluindo preço de mensalidade.

#### Scenario: Auditoria de conteúdo antes de publicar

- **WHEN** o conteúdo do site é auditado antes de cada publicação
- **THEN** nenhuma ocorrência das marcas restritas nem qualquer valor monetário é encontrada em texto, metadados, nomes de arquivo ou imagens

### Requirement: O site é publicado no projeto de produção sem alterar o deploy das Cloud Functions

O site SHALL ser publicado no Firebase Hosting do projeto `base-fox-sport-club-prod`. A configuração de hospedagem SHALL NOT fazer com que uma publicação do site implante Cloud Functions, nem que um deploy de Cloud Functions publique o site involuntariamente.

#### Scenario: Publicar apenas o site

- **WHEN** o site é publicado
- **THEN** apenas o conteúdo de hosting é enviado, e as Cloud Functions implantadas permanecem inalteradas

#### Scenario: Implantar apenas as Cloud Functions

- **WHEN** uma Cloud Function é implantada
- **THEN** o conteúdo publicado do site permanece inalterado
