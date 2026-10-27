#!/usr/bin/env bash
#
# android-preflight.sh — checa (sem corrigir) se o caminho de build nativo
# Android local está pronto para rodar.
#
# Não instala nada, não gera nada, não baixa nada. Só relata com precisão o
# que falta, para humano ou outro script decidir o que fazer. Sai com código
# 0 se tudo essencial estiver ok, ou diferente de 0 se faltar algo que
# impediria o build de funcionar.
#
# Uso:
#   scripts/android-preflight.sh [APP_ENV]
#   APP_ENV=staging scripts/android-preflight.sh
#
# APP_ENV decide qual arquivo google-services.<APP_ENV>.json é esperado
# (mesma regra de app.config.ts). Default: development.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/lib/jdk-detect.sh
source "$REPO_ROOT/scripts/lib/jdk-detect.sh"

APP_ENV="${1:-${APP_ENV:-development}}"

# Código de saída final: fica 1 se algum item ESSENCIAL falhar.
FAIL=0

ok()   { printf '✓ %s\n' "$1"; }
bad()  { printf '✗ %s\n' "$1"; FAIL=1; }
info() { printf '  %s\n' "$1"; }

echo "== Preflight do build Android local — APP_ENV=$APP_ENV =="
echo

# -----------------------------------------------------------------------------
# 1. JDK (precisa resolver para um JDK 17 ou 21 — o Gradle do React Native
#    0.88 / Expo SDK 58 não aceita o 25). Na prática isso quase nunca exige
#    ação humana: se nenhum JDK de sistema servir, o próprio Gradle baixa um
#    JDK 17 sozinho (toolchain auto-provisioning) na primeira vez que precisa
#    compilar — find_valid_jdk prefere esse automaticamente. Só reportamos
#    "falta algo" se nem isso existir ainda e não houver JDK de sistema
#    utilizável.
# -----------------------------------------------------------------------------
JDK_HOME="$(find_valid_jdk || true)"

if [[ -n "$JDK_HOME" ]]; then
  JDK_MAJOR="$(jdk_major_version "$JDK_HOME")"
  case "$JDK_HOME" in
    "$HOME"/.gradle/jdks/*) JDK_SOURCE="auto-provisionado pelo Gradle" ;;
    *) JDK_SOURCE="JDK de sistema" ;;
  esac
  ok "JDK $JDK_MAJOR utilizável encontrado ($JDK_SOURCE) em: $JDK_HOME"
  if [[ -n "${JAVA_HOME:-}" && "$JAVA_HOME" != "$JDK_HOME" ]]; then
    info "JAVA_HOME atual é \"$JAVA_HOME\" — android-run.sh vai sobrescrevê-lo com o caminho acima antes de rodar o Gradle."
  fi
  info "Nenhuma configuração manual de JAVA_HOME é necessária — android-run.sh exporta o caminho acima."
else
  bad "Nenhum JDK 17 ou 21 utilizável foi encontrado (nem de sistema, nem auto-provisionado pelo Gradle ainda)."
  if command -v java >/dev/null 2>&1; then
    SYSTEM_JAVA_VER="$(java -version 2>&1 | head -n1)"
    info "O \"java\" padrão do sistema é: $SYSTEM_JAVA_VER"
    info "Esse não serve — o Gradle do React Native 0.88 / Expo SDK 58 exige 17 ou 21."
  fi
  if [[ -d /usr/lib/jvm/java-21-openjdk && ! -x /usr/lib/jvm/java-21-openjdk/bin/java ]]; then
    info "Existe /usr/lib/jvm/java-21-openjdk, mas sem \"bin/java\" dentro — é um resquício"
    info "(ex.: só manpages de um pacote removido/incompleto), não um JDK instalado de verdade."
  fi
  info "Normalmente não é preciso instalar nada: o Gradle baixa seu próprio JDK 17 sozinho na"
  info "primeira vez que compilar (precisa de acesso de rede nesse primeiro build). Se isso não"
  info "for uma opção (ex.: ambiente sem rede), instale um JDK 17 ou 21 manualmente (pacote"
  info "java-21-openjdk da sua distro, ou um Temurin baixado à mão) e torne-o descobrível — ou"
  info "aponte JAVA_HOME para ele antes de rodar."
fi
echo

# -----------------------------------------------------------------------------
# 2. ANDROID_HOME / ANDROID_SDK_ROOT
# -----------------------------------------------------------------------------
SDK_DIR="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
if [[ -n "$SDK_DIR" && -d "$SDK_DIR" ]]; then
  ok "SDK do Android encontrado em: $SDK_DIR"
else
  bad "ANDROID_HOME/ANDROID_SDK_ROOT não está definido ou o diretório não existe (valor atual: \"${SDK_DIR:-<vazio>}\")."
  info "Exporte ANDROID_HOME (e idealmente ANDROID_SDK_ROOT) apontando para a instalação do Android SDK."
fi
echo

# -----------------------------------------------------------------------------
# 3. adb no PATH + pelo menos um dispositivo em estado "device"
# -----------------------------------------------------------------------------
if command -v adb >/dev/null 2>&1; then
  ok "adb encontrado em: $(command -v adb)"

  DEVICE_LINES="$(adb devices -l 2>/dev/null | tail -n +2 | sed '/^[[:space:]]*$/d')"

  if echo "$DEVICE_LINES" | grep -qE '[[:space:]]device([[:space:]]|$)'; then
    ok "Pelo menos um dispositivo em estado 'device':"
    echo "$DEVICE_LINES" | grep -E '[[:space:]]device([[:space:]]|$)' | sed 's/^/    /'
  else
    bad "Nenhum dispositivo em estado 'device'."
    if [[ -z "$DEVICE_LINES" ]]; then
      info "Nenhum dispositivo listado pelo adb. Confira o cabo USB e se a depuração USB está ativada no aparelho."
    else
      echo "$DEVICE_LINES" | sed 's/^/    /'
      if echo "$DEVICE_LINES" | grep -q 'unauthorized'; then
        info "Dispositivo 'unauthorized': aceite o diálogo de depuração USB que aparece na tela do aparelho e rode de novo."
      fi
      if echo "$DEVICE_LINES" | grep -q 'offline'; then
        info "Dispositivo 'offline': desconecte e reconecte o cabo USB (ou rode 'adb kill-server')."
      fi
    fi
  fi
else
  bad "adb não encontrado no PATH."
  info "Confirme que \$ANDROID_HOME/platform-tools está no PATH."
fi
echo

# -----------------------------------------------------------------------------
# 4. platform-tools, ao menos uma platform e uma build-tools
# -----------------------------------------------------------------------------
if [[ -n "$SDK_DIR" && -d "$SDK_DIR" ]]; then
  if [[ -x "$SDK_DIR/platform-tools/adb" ]]; then
    ok "platform-tools presente em: $SDK_DIR/platform-tools"
  else
    bad "platform-tools não encontrado em $SDK_DIR/platform-tools."
  fi

  if [[ -d "$SDK_DIR/platforms" ]] && compgen -G "$SDK_DIR/platforms/android-*" >/dev/null; then
    PLATFORMS=$(cd "$SDK_DIR/platforms" && ls -d android-* 2>/dev/null | tr '\n' ' ')
    ok "Platforms instaladas: $PLATFORMS"
  else
    bad "Nenhuma platform (\"android-NN\") encontrada em $SDK_DIR/platforms."
  fi

  if [[ -d "$SDK_DIR/build-tools" ]] && compgen -G "$SDK_DIR/build-tools/*" >/dev/null; then
    BUILD_TOOLS=$(cd "$SDK_DIR/build-tools" && ls -d */ 2>/dev/null | tr -d '/' | tr '\n' ' ')
    ok "Build-tools instaladas: $BUILD_TOOLS"
  else
    bad "Nenhuma build-tools encontrada em $SDK_DIR/build-tools."
  fi
else
  bad "Não foi possível checar platform-tools/platforms/build-tools sem um ANDROID_HOME válido (ver item 2)."
fi
echo

# -----------------------------------------------------------------------------
# 5. google-services.<APP_ENV>.json na raiz do repo
# -----------------------------------------------------------------------------
# Mesma regra de app.config.ts: em "production" o nome é google-services.json
# (sem sufixo); nos demais ambientes é google-services.<APP_ENV>.json.
if [[ "$APP_ENV" == "production" ]]; then
  GOOGLE_SERVICES_FILE="google-services.json"
else
  GOOGLE_SERVICES_FILE="google-services.${APP_ENV}.json"
fi

BASE_BUNDLE_ID="club.basefox.app"
case "$APP_ENV" in
  development) PACKAGE_NAME="${BASE_BUNDLE_ID}.dev" ;;
  staging)     PACKAGE_NAME="${BASE_BUNDLE_ID}.staging" ;;
  production)  PACKAGE_NAME="${BASE_BUNDLE_ID}" ;;
  *)           PACKAGE_NAME="${BASE_BUNDLE_ID}.dev" ;;
esac

if [[ -f "$REPO_ROOT/$GOOGLE_SERVICES_FILE" ]]; then
  ok "$GOOGLE_SERVICES_FILE encontrado na raiz do repo."
else
  bad "$GOOGLE_SERVICES_FILE não existe na raiz do repo ($REPO_ROOT)."
  info "Esse arquivo depende do provisionamento do projeto Firebase (tarefa humana). Passos:"
  info "  1. Abra (ou crie) o projeto Firebase correspondente ao ambiente \"$APP_ENV\"."
  info "  2. Nele, adicione um app Android com o package name exato: $PACKAGE_NAME"
  info "  3. Baixe o google-services.json gerado para esse app Android."
  info "  4. Salve-o na raiz deste repo com o nome exato: $GOOGLE_SERVICES_FILE"
  info "     (${REPO_ROOT}/${GOOGLE_SERVICES_FILE})"
fi
echo

# -----------------------------------------------------------------------------
# 6. Aviso (não bloqueante) sobre um android/ já gerado
# -----------------------------------------------------------------------------
if [[ -d "$REPO_ROOT/android" ]]; then
  info "Aviso: já existe $REPO_ROOT/android (gerado por um prebuild anterior)."
  info "Pode estar desatualizado em relação a app.config.ts / google-services — o prebuild"
  info "do Expo reconcilia o conteúdo, mas se algo parecer errado, apague a pasta e rode de novo."
  echo
fi

# -----------------------------------------------------------------------------
# Resultado
# -----------------------------------------------------------------------------
if [[ "$FAIL" -eq 0 ]]; then
  echo "== Preflight OK — pronto para o build Android local. =="
  exit 0
else
  echo "== Preflight encontrou pendências essenciais (ver ✗ acima). =="
  exit 1
fi
