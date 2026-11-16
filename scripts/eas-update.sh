#!/usr/bin/env bash
#
# Publica um update OTA e sobe os source maps correspondentes — nessa ordem,
# sempre juntos (tarefa 2.5).
#
# Por que um script em vez de dois comandos na mão: o Sentry casa bundle e
# source map por DEBUG ID embutido no bundle, não por release/dist. Se o
# upload não rodar logo depois do `eas update`, aquele bundle fica sem map
# para sempre — e a stack trace de quem receber o update chega minificada.
# Publicar e subir viram um passo só para não terem como se separar.
#
# Uso: npm run update -- --channel demo --platform android --message "..."
#
set -euo pipefail
cd "$(dirname "$0")/.."

# O SENTRY_AUTH_TOKEN das variáveis do EAS tem visibilidade Secret: só existe
# dentro do builder e não pode ser lido de volta. Para rodar daqui é preciso um
# token de organização próprio, guardado fora do repositório — mesmo tratamento
# da chave de serviço do FCM.
TOKEN_FILE="${SENTRY_TOKEN_FILE:-$HOME/.config/base-fox/sentry-token}"
if [ -z "${SENTRY_AUTH_TOKEN:-}" ]; then
  if [ -r "$TOKEN_FILE" ]; then
    SENTRY_AUTH_TOKEN="$(tr -d '[:space:]' < "$TOKEN_FILE")"
    export SENTRY_AUTH_TOKEN
  else
    echo "erro: nem SENTRY_AUTH_TOKEN no ambiente nem token em $TOKEN_FILE." >&2
    echo "      Criar em https://oreggia-tech.sentry.io/settings/auth-tokens/new-token/" >&2
    echo "      e salvar com: umask 077; cat > $TOKEN_FILE" >&2
    exit 1
  fi
fi

# `eas update` escreve em dist/. Sobra de uma publicação anterior subiria o
# map errado, casado com um debug ID que já não corresponde a nada.
rm -rf dist

npx eas-cli@latest update "$@"
npx sentry-expo-upload-sourcemaps dist
