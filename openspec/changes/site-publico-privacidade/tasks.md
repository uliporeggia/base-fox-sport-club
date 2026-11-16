## 0. Decisões e espera de terceiro — disparar antes de escrever qualquer texto

Custam tempo de outras pessoas, não esforço. Atrasar o disparo atrasa a publicação inteira.

- [ ] 0.1 Levar ao cliente a decisão do **controlador dos dados**, apresentada como decisão dele: os associados são do clube, os dados vivem no Firebase da Oreggia Tech, e a restrição de marca proíbe nomear o cliente. Registrar a resposta — bloqueia o texto final da política
- [ ] 0.2 Definir **quem recebe e quem executa** as solicitações de exclusão de conta, e em que prazo. Processo manual documentado basta no piloto; não ter processo não basta — bloqueia a publicação da página de exclusão
- [ ] 0.3 Perguntar ao cliente se existe site próprio a ser referenciado e se ele carrega a marca restrita

## 1. Auditoria — vem antes do texto, sempre

- [ ] 1.1 Levantar do código e das regras do Firestore o que é persistido em `associates`, `rsvps`, `vip_accesses`, `devices` e `notifications`, campo a campo
- [ ] 1.2 Levantar quais SDKs enviam dados para fora e o que cada um recebe — Firebase, Expo (push), Sentry, Strava
- [ ] 1.3 Confirmar o que a conexão com o Strava grava de fato (`athlete_id`, `username`, nome, foto) e confirmar que nenhuma atividade é lida ou armazenada
- [ ] 1.4 Consolidar o **inventário de dados** num documento verificável, que é a entrada das tarefas 3 e 5 — nenhum item por suposição

## 2. Estrutura do site

Layout e conteúdo de referência: **https://claude.ai/artifact/RMgekcJJ9ZvoLyuWG2R84H** (canvas "Site Base Fox — mockup", privado). Os trechos entre colchetes nele são as decisões em aberto, não texto a copiar.

- [ ] 2.1 Criar o diretório de fontes do site, com três páginas HTML estáticas e uma folha de estilo, sem build e sem dependências, seguindo o canvas de referência
- [ ] 2.2 Aplicar a identidade visual a partir de `design/README.md` — cores, Saira e Barlow — sem importar o tema do app
- [ ] 2.3 Garantir legibilidade em largura de celular, com as três páginas linkadas entre si

## 3. Conteúdo

- [ ] 3.1 Escrever a **página raiz**: o que é o app, para quem, funções principais (eventos, espaço VIP por QR, benefícios, notificações), operador e canal de contato
- [ ] 3.2 Escrever a seção sobre o **uso do Strava**, materialmente equivalente à descrição registrada na aplicação `297349` — a conexão serve só ao cadastro e à identificação; o app não lê, não exibe e não armazena atividades
- [ ] 3.3 Escrever a **política de privacidade** a partir do inventário da 1.4: dados, finalidades, terceiros nomeados, bases legais, direitos do titular, retenção, contato e controlador
- [ ] 3.4 Escrever a **página de exclusão de conta**: sem login, caminho em destaque, nome do app e do desenvolvedor como na ficha, o que é apagado, o que é retido e por quê, prazo e confirmação
- [ ] 3.5 Incluir na raiz links visíveis para privacidade e exclusão de conta

## 4. Auditoria de conteúdo e publicação

- [ ] 4.1 Auditar as três páginas contra as restrições duras: nenhuma menção a "Kailash", "XKR" ou "KTR"; nenhum valor em reais — texto, metadados, nomes de arquivo e imagens
- [ ] 4.2 Adicionar o bloco `hosting` ao `firebase.json`, apontando para o diretório do site
- [ ] 4.3 Revisar todo script ou rotina que chame `firebase deploy` sem `--only` e corrigir — depois do 4.2 esse comando publica site e functions juntos
- [ ] 4.4 Publicar com `--only hosting` no projeto `base-fox-sport-club-prod`
- [ ] 4.5 Verificar que implantar uma Cloud Function não altera o site publicado, e que publicar o site não altera as functions implantadas
- [ ] 4.6 Abrir as três URLs **de outra rede e sem sessão**, confirmando HTTP 200, sem login e sem erro

## 5. Fichas, registros e desbloqueios

- [ ] 5.1 Preencher o **formulário de Segurança de Dados** do Google Play a partir do inventário da 1.4, e conferir cada resposta contra a política publicada
- [ ] 5.2 Preencher a URL de **política de privacidade** na ficha do Google Play
- [ ] 5.3 Preencher a URL de **exclusão de conta** na ficha do Google Play
- [ ] 5.4 Preencher a URL de política de privacidade no **App Store Connect**
- [ ] 5.5 Trocar o campo **Site** da aplicação Strava `297349`, de LinkedIn para a URL do site
- [ ] 5.6 Registrar fora desta change, como **bloqueio de publicação**, a pendência da exclusão de conta **dentro do aplicativo** — o Google Play exige as duas vias e esta change entrega só a web
- [ ] 5.7 Enviar o rascunho da política ao cliente para revisão jurídica, em paralelo às demais tarefas, não como último passo
- [ ] 5.8 Exportar do canvas, a 1×, o **gráfico de destaque 1024×500** e o **ícone 512×512**, e enviá-los na ficha do Google Play
- [ ] 5.9 Exportar do canvas, a 1×, o **cabeçalho 4096×2304** e enviá-lo na página do desenvolvedor do Play, junto com o ícone 512×512 e o texto promocional de até 140 caracteres — os três estão marcados como obrigatórios e vazios
- [ ] 5.10 Exportar a **og:image 1200×630** e referenciá-la nos metadados das três páginas do site

## 6. Só depois de tudo acima

- [ ] 6.1 Solicitar ao Strava o aumento de capacidade acima de 10 atletas (tarefa 0.3 da change `base-fox-mvp`), agora com um site que sustenta o pedido

## 7. Fora desta change, mas na mesma superfície visual

Registrar e encaminhar ao builder — mexem na build do app, não no site.

- [ ] 7.1 Trocar o **ícone embarcado do app**, hoje o padrão do Expo (`assets/icon.png` e `assets/android-icon-foreground.png` são o "A" azul com guias de construção), pelos arquivos já gerados em `brand-assets/`
- [ ] 7.2 Produzir as **capturas de tela** da ficha das lojas — dependem do app rodando, não de desenho. No Play: mínimo de 2, entre 320 e 3840 px, lado maior no máximo o dobro do menor
