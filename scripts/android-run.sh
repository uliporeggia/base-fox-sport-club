#!/usr/bin/env bash
#
# android-run.sh — roda o caminho completo do build Android local:
# preflight -> prebuild -> run:android, com JAVA_HOME ajustado para um JDK
# 17/21 utilizável e a compilação nativa restrita a UMA arquitetura (ver
# seção "Arquitetura nativa (ABI)" abaixo — importante: essa restrição é só
# para este build local, não para builds de distribuição).
#
# Uso:
#   scripts/android-run.sh [APP_ENV] [DEVICE] [ARCH]
#
#   APP_ENV  ambiente ("development" | "staging" | "production"), default:
#            "development". Mesmo valor que app.config.ts lê de process.env.
#   DEVICE   nome ou serial do dispositivo/emulador (ex.: "0074259419",
#            o serial que "adb devices -l" mostra), repassado para
#            "npx expo run:android --device". Opcional — se omitido e houver
#            só um dispositivo conectado, o Expo usa esse automaticamente.
#   ARCH     ABI nativa a compilar (ex.: "arm64-v8a", "x86_64"). Opcional —
#            se omitido, é detectada a partir do aparelho conectado via
#            DEVICE_SERIAL/env REACT_NATIVE_ARCHITECTURES; ver a seção
#            dedicada abaixo.
#
# Este script NUNCA cria, gera ou fabrica um google-services*.json. Se o
# arquivo esperado não existir, o preflight já bloqueia a execução — um
# arquivo falso faria o app compilar e falhar em runtime de forma confusa,
# o que é pior do que simplesmente não compilar.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/lib/jdk-detect.sh
source "$REPO_ROOT/scripts/lib/jdk-detect.sh"

APP_ENV="${1:-${APP_ENV:-development}}"
DEVICE="${2:-${DEVICE_SERIAL:-}}"
export APP_ENV

echo "== android-run: APP_ENV=$APP_ENV =="
echo

# -----------------------------------------------------------------------------
# 1. Preflight — aborta aqui se faltar qualquer coisa essencial (JDK, SDK,
#    dispositivo, google-services.<APP_ENV>.json etc). O preflight já explica
#    o que falta; não repetimos o diagnóstico aqui.
# -----------------------------------------------------------------------------
if ! "$REPO_ROOT/scripts/android-preflight.sh" "$APP_ENV"; then
  echo
  echo "== Preflight falhou — build abortado. Resolva as pendências acima e rode de novo. =="
  exit 1
fi
echo

# -----------------------------------------------------------------------------
# 2. JAVA_HOME — mesma detecção do preflight (prefere o JDK auto-provisionado
#    pelo Gradle em ~/.gradle/jdks, cai para um JDK 17/21 de sistema; ver
#    scripts/lib/jdk-detect.sh). Se chegamos aqui o preflight já garantiu que
#    existe um; isto só resolve o caminho de novo para exportar.
# -----------------------------------------------------------------------------
JDK_HOME="$(find_valid_jdk || true)"
if [[ -z "$JDK_HOME" ]]; then
  echo "== Nenhum JDK 17 ou 21 utilizável encontrado — não é possível rodar o Gradle. =="
  echo "   (o preflight deveria ter pego isso; veja a seção de JDK no relatório dele.)"
  exit 1
fi
export JAVA_HOME="$JDK_HOME"
echo "JAVA_HOME = $JAVA_HOME ($(jdk_major_version "$JAVA_HOME" | sed 's/^/JDK /'))"
echo

# -----------------------------------------------------------------------------
# 3. Arquitetura nativa (ABI) — restringe o build Gradle a UMA arquitetura.
#
#    *** ISTO VALE SÓ PARA BUILD LOCAL DE DESENVOLVIMENTO — OU SEJA, SÓ PARA
#    ESTE SCRIPT. *** Builds de DISTRIBUIÇÃO (EAS Build, submissão à Google
#    Play) não passam por aqui e PRECISAM continuar compilando TODAS as
#    arquiteturas (armeabi-v7a, arm64-v8a, x86, x86_64) — um APK/AAB restrito
#    a arm64-v8a subido na loja exclui todo aparelho com outra ABI. Nunca
#    propague esta restrição para eas.json ou qualquer pipeline de build de
#    distribuição.
#
#    Por quê: compilar as 4 arquiteturas de uma vez satura os núcleos desta
#    máquina e já a travou duas vezes, morrendo na fase CMake/NDK depois de
#    ~10 min. Restringindo a uma única ABI: "assembleDebug
#    -PreactNativeArchitectures=arm64-v8a" -> BUILD SUCCESSFUL em ~3 min.
#
#    Detecção: ABI do aparelho conectado via
#    "adb shell getprop ro.product.cpu.abi". Se não for possível identificar
#    um único aparelho (nenhum conectado, ou mais de um sem DEVICE
#    definido), cai para "arm64-v8a" (ABI do aparelho de teste padrão deste
#    projeto). Pode ser sobreposta por quem precisar de outra ABI:
#      REACT_NATIVE_ARCHITECTURES=x86_64 scripts/android-run.sh
#      scripts/android-run.sh development "" x86_64   # 3º argumento posicional
#
#    Mecanismo: "npx expo run:android" já teria sua própria auto-detecção de
#    ABI, mas só a liga/desliga por inteiro via "--all-arch" (desliga a
#    auto-detecção = compila todas). Passamos "--all-arch" sempre e
#    assumimos nós mesmos a restrição via a variável de ambiente
#    ORG_GRADLE_PROJECT_reactNativeArchitectures, que o Gradle lê como se
#    fosse "-PreactNativeArchitectures=<valor>" passado na linha de comando.
#    Assim o valor calculado aqui é a ÚNICA fonte de verdade — nunca
#    sobrescrito silenciosamente por uma detecção interna do Expo. Ou seja:
#    "--all-arch" neste script não significa "compilar todas as
#    arquiteturas" — significa "a decisão de arquitetura é nossa, não do
#    Expo".
# -----------------------------------------------------------------------------
detect_device_abi() {
  local device="$1"
  local abi=""
  if [[ -n "$device" ]]; then
    abi="$(adb -s "$device" shell getprop ro.product.cpu.abi 2>/dev/null | tr -d '[:space:]')"
  elif [[ "$(adb devices 2>/dev/null | tail -n +2 | grep -cE '[[:space:]]device$' || true)" -eq 1 ]]; then
    # Só tenta sem "-s" quando há exatamente um aparelho em estado "device" —
    # com dois ou mais, "adb shell" sem "-s" falha ou vira ambíguo.
    abi="$(adb shell getprop ro.product.cpu.abi 2>/dev/null | tr -d '[:space:]')"
  fi
  echo "$abi"
}

ARCH="${3:-${REACT_NATIVE_ARCHITECTURES:-}}"
if [[ -z "$ARCH" ]]; then
  ARCH="$(detect_device_abi "$DEVICE")"
  if [[ -n "$ARCH" ]]; then
    echo "ABI detectada no aparelho conectado: $ARCH"
  fi
fi
if [[ -z "$ARCH" ]]; then
  ARCH="arm64-v8a"
  echo "Não foi possível detectar a ABI do aparelho (nenhum conectado, ou mais de um sem DEVICE definido) — usando fallback: $ARCH"
fi
export ORG_GRADLE_PROJECT_reactNativeArchitectures="$ARCH"
echo "Build local restrito à arquitetura: $ARCH (só para desenvolvimento — ver comentário acima)"
echo

echo "== Tempo esperado: ~3 min para este primeiro build (uma arquitetura). =="
echo "   Compilar as 4 arquiteturas de uma vez levaria ~10 min E JÁ TRAVOU ESTA"
echo "   MÁQUINA DUAS VEZES — não é isso que vai rodar agora. Demora nos"
echo "   primeiros minutos (configuração do Gradle, download de dependências"
echo "   na primeira vez) é esperada, não é sinal de travamento."
echo

# -----------------------------------------------------------------------------
# 4. prebuild — gera/atualiza android/ a partir de app.config.ts (inclui
#    copiar o google-services.<APP_ENV>.json para dentro de android/app/).
# -----------------------------------------------------------------------------
echo "== npx expo prebuild --platform android (APP_ENV=$APP_ENV) =="
( cd "$REPO_ROOT" && npx expo prebuild --platform android )
echo

# -----------------------------------------------------------------------------
# 5. run:android — compila e instala no dispositivo. "--all-arch" aqui
#    desativa a auto-detecção de ABI do próprio Expo (ver item 3 acima) —
#    quem decide a arquitetura é a variável de ambiente já exportada.
# -----------------------------------------------------------------------------
echo "== npx expo run:android --device --all-arch (APP_ENV=$APP_ENV) =="
if [[ -n "$DEVICE" ]]; then
  ( cd "$REPO_ROOT" && npx expo run:android --device "$DEVICE" --all-arch )
else
  ( cd "$REPO_ROOT" && npx expo run:android --device --all-arch )
fi
