## Context

O Base Fox Sport Club está tecnicamente pronto para a fase de publicação — cinco Cloud Functions no ar, push validado em aparelho, TestFlight entregue ao cliente — e **não tem nenhuma presença web**. Três exigências independentes convergem para o mesmo artefato que não existe:

| Exigência | Onde aparece | Estado hoje |
| --- | --- | --- |
| Campo **Site** da aplicação Strava `297349` | Registro da aplicação | perfil pessoal de LinkedIn, provisório |
| **URL de política de privacidade** | Ficha do Google Play e App Store Connect | vazio |
| **URL de exclusão de conta** | Ficha do Google Play | vazio |

As duas últimas são condição para publicar. A primeira é insumo da tarefa **0.3** — o pedido de aumento de capacidade acima de 10 atletas do Strava, que é um review sem SLA publicado e o item de prazo mais imprevisível do projeto. Esse review avalia o site informado; um perfil pessoal de LinkedIn é evidência fraca, e um review sem prazo não tem pressa de reclamar.

A infraestrutura já existe: o projeto `base-fox-sport-club-prod` tem site de Hosting provisionado em `https://base-fox-sport-club-prod.web.app`, hoje vazio. Não há custo novo.

O layout também já existe: o canvas **https://claude.ai/artifact/RMgekcJJ9ZvoLyuWG2R84H** traz as três páginas desenhadas e as quatro peças de publicação nas medidas exatas. Ele é referência de layout e de conteúdo, e os colchetes nele marcam o que ainda depende de decisão.

O que não existe é conteúdo — e a parte mais difícil dele não é técnica. A política de privacidade é documento jurídico, precisa refletir o que o aplicativo de fato faz, e precisa nomear um controlador de dados que a restrição de marca do projeto dificulta nomear.

## Goals / Non-Goals

**Goals:**

- Publicar três páginas públicas e estáveis — raiz, privacidade e exclusão de conta — que desbloqueiem as três exigências acima de uma vez.
- Derivar a política de privacidade de uma **auditoria do código**, não de suposição sobre o que o app coleta.
- Manter a publicação do site e a implantação das Cloud Functions **isoladas uma da outra**.
- Deixar explícitas, como pendências nomeadas, as duas coisas que esta change não pode resolver sozinha: a decisão do controlador e a exclusão de conta dentro do app.

**Non-Goals:**

- **Exclusão de conta dentro do aplicativo.** O Google Play exige as duas vias; esta change entrega a via web. A via in-app é trabalho de produto, com tarefa própria.
- **Domínio próprio.** `*.web.app` atende às três exigências. Domínio é melhora cosmética posterior.
- **Backend ou formulário com estado.** Nada de banco, autenticação ou fila de solicitações.
- **Site institucional da Oreggia Tech.** O escopo é o produto, não a empresa.
- **Marketing, SEO, analytics.** Páginas de conformidade e apresentação, não funil.

## Decisions

### Site estático, sem framework

Três páginas de conteúdo, sem estado. HTML e CSS escritos à mão, sem build, sem dependências.

**Por quê:** o custo de manutenção de um gerador estático — dependências, versões, pipeline — não se paga em três páginas que mudam raramente. E essas páginas precisam durar: uma política de privacidade quebrada por dependência desatualizada é a ficha da loja caindo junto.

**Alternativas consideradas:** Next.js ou Astro — descartados por desproporção. Uma única página com âncoras — descartado porque Play e Strava registram **URLs distintas**, e âncora dentro de página longa não satisfaz o requisito de "caminho em destaque" da política de exclusão de conta.

### Hospedagem no projeto de produção, com deploy isolado

Firebase Hosting em `base-fox-sport-club-prod`. O bloco `hosting` entra no `firebase.json`, e **toda publicação passa a ser explícita** — `--only hosting` para o site, `--only functions:<nome>` para functions.

**Por quê:** o projeto de produção é onde a ficha da loja aponta, e o Hosting já está provisionado. Mas adicionar `hosting` ao `firebase.json` muda o comportamento de um `firebase deploy` sem flags, que passaria a publicar as duas coisas — ver Riscos.

**Alternativa considerada:** hospedar no projeto de dev. Descartado: a URL vai em fichas de loja públicas e em registro de API de terceiro; apontar produção para um projeto chamado `-dev` é dívida garantida.

### A política de privacidade sai de uma auditoria, e a auditoria vem antes do texto

A ordem é: **auditar o código → preencher o inventário → escrever a política**. Nunca o inverso.

**Por quê:** é a lição mais cara das últimas semanas deste projeto, repetida quatro vezes — o `seed.ts` que nunca rodara, a tarefa 1.3 quase fechada com Functions apenas desbloqueado, o Sentry instrumentado com DSN vazio, o fuso horário que só passava na máquina certa. Em todas, "parece certo" divergiu de "é certo". Numa política de privacidade esse erro não é um bug: é declaração incorreta a um órgão regulador e ao Google.

A auditoria cobre o que é persistido em `associates`, `rsvps`, `vip_accesses`, `devices` e `notifications`, as regras do Firestore, e quais SDKs enviam dados para fora — Firebase, Expo, Sentry, Strava.

### A política e o formulário de Segurança de Dados são escritos juntos

São duas declarações separadas, e o Google compara as duas. Divergência é motivo de rejeição.

**Decisão:** o formulário de Segurança de Dados da ficha do Play é preenchido a partir do **mesmo inventário** que gera a política, na mesma tarefa, não meses depois por outra pessoa.

### O site repete as restrições duras do app

Nenhuma menção a "Kailash", "XKR" ou "KTR"; nenhum valor em reais. A auditoria de conteúdo do site usa o mesmo critério da tarefa 10.2.

**Por quê:** a ficha do app no Strava e as páginas linkadas pelas lojas são superfícies inspecionáveis como qualquer outra. A restrição não distingue entre o binário e o que o acompanha.

### A seção sobre o Strava é tratada como par acoplado

O texto do site sobre o uso do Strava e a descrição registrada na aplicação `297349` **mudam juntos**, pelo mesmo motivo que `.gitignore` e `.easignore` mudam juntos: o review compara os dois, e divergência entre eles é exatamente o que ele procura.

Texto registrado na aplicação, que o site precisa espelhar: a conexão serve apenas ao cadastro e à identificação do associado, importando nome, foto e identificador do atleta; o app não lê, não exibe e não armazena atividades.

## Risks / Trade-offs

- **[Risco] O controlador dos dados não é decidido.** Os associados são do clube; os dados vivem no Firebase da Oreggia Tech; a restrição de marca proíbe nomear o cliente. "Operado pela Oreggia Tech em nome do clube" atende à restrição e é juridicamente frágil. → **Mitigação**: levar a decisão ao cliente **antes** de escrever o texto final, apresentada como decisão dele e não como detalhe de redação. Enquanto não houver decisão, a política não é referenciada em ficha de loja — e isso fica registrado como bloqueio de publicação, não como pendência menor.

- **[Risco] `firebase deploy` sem flags passa a publicar o site junto com as functions.** Hoje o `firebase.json` só tem `functions` e `firestore`, então o comando é inofensivo; depois desta change, deixa de ser. → **Mitigação**: nenhum script ou rotina usa `firebase deploy` sem `--only`. Revisar os scripts existentes na mesma change e registrar a regra.

- **[Risco] A política descreve o app errado.** Escrita de memória, descreveria o app que supomos ter. → **Mitigação**: a auditoria do código é tarefa separada e anterior, com saída verificável — o inventário —, não um passo mental dentro da redação.

- **[Risco] A página de exclusão de conta é aceita pelo Play, mas a exclusão não acontece.** Uma página que recebe pedidos sem processo atrás é pior que nenhuma: vira promessa pública descumprida, com exposição em LGPD. → **Mitigação**: definir o canal de recebimento e o responsável por executar a exclusão antes de publicar a página. Enquanto o volume for de piloto, processo manual documentado é suficiente; o que não é suficiente é não ter processo.

- **[Risco] A via in-app de exclusão continua faltando e trava a publicação.** Esta change entrega metade do requisito do Play. → **Mitigação**: registrar a pendência explicitamente, como bloqueio de publicação, visível fora desta change.

- **[Trade-off] HTML à mão não escala para um site de verdade.** Se o produto ganhar site institucional, blog ou páginas por evento, a escolha vira limitação. → Aceito: o gatilho de revisão é a quarta página de conteúdo real.

- **[Risco] A revisão jurídica do cliente demora e segura a publicação.** → **Mitigação**: enviar o rascunho ao cliente assim que o inventário estiver pronto, em paralelo às demais tarefas de publicação, e não como último passo.

## Migration Plan

1. Auditar o código e produzir o inventário de dados.
2. Levar ao cliente a decisão do controlador, junto com o inventário.
3. Escrever as três páginas; auditar conteúdo contra as restrições de marca e de valores.
4. Adicionar o bloco `hosting` ao `firebase.json` e revisar scripts que chamem `firebase deploy`.
5. Publicar com `--only hosting`; verificar as três URLs de outra rede, sem sessão.
6. Preencher o formulário de Segurança de Dados do Play a partir do mesmo inventário.
7. Atualizar os campos: Site da aplicação Strava, política e exclusão de conta nas fichas das lojas.
8. Só então solicitar a 0.3.

**Rollback:** o Hosting mantém versões anteriores e permite reverter a publicação em um passo. Os campos de ficha e o campo Site do Strava são editáveis a qualquer momento. Nenhum passo é irreversível.

## Open Questions

- **Quem é o controlador dos dados?** Bloqueia o texto final da política. Decisão do cliente.
- **Qual o canal e o responsável por processar as solicitações de exclusão?** Bloqueia a publicação da página de exclusão.
- **O cliente tem um site próprio que deva ser referenciado?** Se tiver e ele carregar a marca restrita, não pode ser linkado.
- **Domínio próprio agora ou depois?** Default assumido: depois.
- **A política precisa de versão em inglês?** A distribuição é Brasil apenas, por causa da declaração de não comerciante no Google Play — então presumivelmente não.
