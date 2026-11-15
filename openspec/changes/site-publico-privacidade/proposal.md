## Why

O app está pronto para publicar e **não tem nenhuma presença web** — o que bloqueia três coisas ao mesmo tempo: o campo **Site** da aplicação Strava (preenchido em 15/11/2026 com um perfil pessoal de LinkedIn, provisório), a **URL de política de privacidade** que o Google Play e a Apple exigem na ficha, e a **URL de exclusão de conta** que o Google Play exige de todo app que permite criar conta — como o Base Fox permite.

Nenhuma dessas três é negociável e todas têm prazo: a 0.7 (teste fechado) não sai sem a ficha completa, e a 0.3 (aumento de capacidade do Strava) é um review sem SLA publicado que avalia justamente o site do app. Um perfil de LinkedIn é evidência fraca para esse review — e ele não tem prazo para reclamar.

## What Changes

- **Site estático novo**, publicado no Firebase Hosting do projeto de produção (`base-fox-sport-club-prod.web.app`, já provisionado e hoje vazio), com três páginas públicas e sem login.
- **Página raiz**: o que é o app, para quem é, as telas principais, e uma seção explícita sobre o uso do Strava — que a conexão serve só para cadastro e identificação, e que o app não lê, não exibe e não armazena atividades. Precisa bater com a descrição registrada na aplicação Strava, porque o review compara as duas.
- **Página de política de privacidade**, em conformidade com a LGPD, descrevendo os dados que o app **de fato** coleta e os terceiros que os recebem (Google Firebase, Expo, Sentry, Strava).
- **Página de solicitação de exclusão de conta**, atendendo à política do Google Play: carrega sem erro, não exige login, nomeia o app e o desenvolvedor como aparecem na ficha, e explica o que é apagado.
- **Atualização do campo Site** da aplicação Strava, de LinkedIn para a URL do site — pré-requisito da tarefa 0.3.
- `firebase.json` passa a ter um bloco `hosting`.

**Não entra nesta change:** o caminho de exclusão **dentro do app**, que o Google Play também exige. Esta change cobre o lado web; o lado in-app é trabalho de produto e precisa de tarefa própria — ver Impact.

## Capabilities

### New Capabilities
- `public-site`: presença web pública do produto — estrutura, conteúdo da página raiz, hospedagem, e a correspondência obrigatória entre o que o site diz sobre o Strava e o que foi declarado na aplicação registrada.
- `privacy-policy`: política de privacidade em LGPD — inventário de dados coletados, terceiros que os recebem, bases legais, direitos do titular, retenção e canal de contato. Precisa ser consistente com o formulário de Segurança de Dados do Google Play, que é declaração separada e comparada pelo Google.
- `account-deletion-request`: via pública para solicitar exclusão de conta e dos dados associados, nos termos exigidos pelo Google Play.

### Modified Capabilities
Nenhuma. Trocar o valor do campo Site na aplicação Strava é configuração de conta, não mudança de requisito de `strava-connection`.

## Impact

**Código e repositório**
- Diretório novo para os fontes do site.
- `firebase.json` ganha bloco `hosting`. ⚠️ **Isso muda o comportamento de `firebase deploy` sem `--only`**, que passa a publicar o site junto com as functions. Os scripts e a rotina de deploy precisam ser revistos.
- `.firebaserc` já tem o alias `production`; nenhum projeto novo é necessário.

**Infraestrutura**
- Firebase Hosting no projeto `base-fox-sport-club-prod`. Cota gratuita; sem custo recorrente novo.
- Decisão em aberto: domínio próprio ou `*.web.app`. O `*.web.app` resolve as três exigências hoje; domínio próprio é melhora cosmética que pode vir depois.

**Contas e fichas de loja**
- Strava: campo Site da aplicação `297349`.
- Google Play: campos de política de privacidade e de exclusão de conta na ficha, hoje vazios.
- App Store Connect: campo de política de privacidade.

**Decisões que isto força, e que não são nossas**
- ⚠️ **Quem é o controlador dos dados.** Os associados são do clube; os dados vivem no Firebase da Oreggia Tech. A política precisa nomear um controlador, e a restrição de marca proíbe citar o cliente em qualquer superfície inspecionável. "Operado pela Oreggia Tech em nome do clube" atende à restrição mas é frágil juridicamente. **Decisão do cliente.**
- Política de privacidade é documento jurídico. O conteúdo aqui descreve com precisão o que o app faz; a revisão jurídica é do cliente.

**Dependência que esta change expõe mas não resolve**
- O Google Play exige exclusão de conta **dentro do app também**, não só na web. Hoje não existe. Precisa de tarefa própria no escopo de produto, antes da publicação.

**Premissa a verificar antes de escrever a política**
- O inventário de dados precisa ser levantado **do código e das regras do Firestore**, não de memória. O app coleta nome, e-mail, foto, número de associado, `athlete_id` e `username` do Strava, token de push, confirmações de presença e acessos ao espaço VIP — lista a confirmar, não a assumir.
