# shellcheck shell=bash
#
# Detecção de um JDK 17 ou 21 utilizável no sistema.
#
# O Gradle do React Native 0.88 / Expo SDK 58 não aceita o JDK 25 (o default
# do sistema nesta máquina). Este arquivo é "source"-ado por
# android-preflight.sh e android-run.sh para que os dois usem exatamente a
# mesma lógica de busca — evita os dois scripts discordarem sobre qual JDK é
# válido.
#
# Importante: a existência de um diretório em /usr/lib/jvm/java-NN-openjdk*
# NÃO significa que há um JDK funcional ali — pode ser um resquício de pacote
# removido/incompleto (só manpages, sem "bin/java"). Por isso toda validação
# aqui exige rodar "bin/java -version" de fato, nunca apenas checar "-d".
#
# Comprovado empiricamente: nesta máquina, /usr/lib/jvm/java-21-openjdk* é
# exatamente esse resquício (só "man/", sem "bin/java"). O JDK que de fato
# compila o projeto é o que o próprio Gradle baixa sozinho (toolchain
# auto-provisioning) em ~/.gradle/jdks/ — não é preciso instalar nem apontar
# JAVA_HOME manualmente para isso funcionar; ver a ordem de busca abaixo.

# jdk_major_version <jdk_home>
# Imprime o major version (ex.: "17", "21", "25") de um JAVA_HOME, ou nada se
# não for possível determinar.
jdk_major_version() {
  local jh="$1"
  local ver=""

  # Caminho rápido: arquivo "release" do próprio JDK (presente na maioria das
  # distribuições, incluindo Temurin/Adoptium e os pacotes do Fedora).
  if [[ -f "$jh/release" ]]; then
    ver=$(grep -E '^JAVA_VERSION=' "$jh/release" 2>/dev/null \
      | sed -E 's/JAVA_VERSION="?([0-9]+).*/\1/')
  fi

  # Fallback: perguntar ao próprio binário.
  if [[ -z "$ver" && -x "$jh/bin/java" ]]; then
    ver=$("$jh/bin/java" -version 2>&1 | head -n1 \
      | sed -E 's/.*"([0-9]+)\..*/\1/')
  fi

  echo "$ver"
}

# is_valid_jdk_home <dir>
# Verdadeiro se <dir> é um JAVA_HOME com um "bin/java" executável cuja versão
# major é 17 ou 21.
is_valid_jdk_home() {
  local jh="$1"
  [[ -n "$jh" && -x "$jh/bin/java" ]] || return 1
  local major
  major=$(jdk_major_version "$jh")
  [[ "$major" == "17" || "$major" == "21" ]]
}

# _first_match_by_version <wanted order...> -- <candidate dirs...>
# Dado uma lista de major versions desejadas (em ordem de preferência) e uma
# lista de diretórios candidatos, imprime o primeiro candidato cujo
# "bin/java" é executável e cuja major version bate com algum "wanted",
# respeitando a ordem de "wanted" primeiro (ou seja: todos os candidatos são
# checados para 21 antes de qualquer um ser checado para 17). Retorna 1 se
# nenhum candidato bater.
_first_match_by_version() {
  local -a wanted_list=()
  local -a candidates=()
  local in_candidates=0
  for arg in "$@"; do
    if [[ "$arg" == "--" ]]; then
      in_candidates=1
      continue
    fi
    if [[ "$in_candidates" -eq 0 ]]; then
      wanted_list+=("$arg")
    else
      candidates+=("$arg")
    fi
  done

  local wanted cand major
  for wanted in "${wanted_list[@]}"; do
    for cand in "${candidates[@]}"; do
      if [[ -x "$cand/bin/java" ]]; then
        major=$(jdk_major_version "$cand")
        if [[ "$major" == "$wanted" ]]; then
          echo "$cand"
          return 0
        fi
      fi
    done
  done
  return 1
}

# find_valid_jdk
# Imprime no stdout o caminho de um JAVA_HOME válido (JDK 17 ou 21,
# priorizando 21 dentro de cada camada) e retorna 0. Se nenhum for
# encontrado, não imprime nada e retorna 1.
#
# Ordem de busca (comprovada empiricamente nesta máquina/projeto):
#   1. $JAVA_HOME atual, se já apontar para um JDK 17/21 válido — override
#      explícito de quem está rodando o script sempre vence.
#   2. JDKs provisionados automaticamente pelo próprio Gradle (toolchain
#      auto-provisioning) em ~/.gradle/jdks/*/. Esta é a fonte PREFERIDA: é
#      o que de fato compilou o projeto com sucesso, e não exige nenhuma
#      instalação ou configuração manual — o Gradle baixa esse JDK sozinho
#      na primeira vez que precisa dele, mesmo sem nenhum JDK "instalado"
#      de verdade no sistema.
#   3. Locais conhecidos de instalação de JDK via pacote do sistema
#      (/usr/lib/jvm/java-21-openjdk*, /usr/lib/jvm/java-17-openjdk*), como
#      fallback caso o passo 2 não tenha nada ainda (ex.: máquina nova, sem
#      acesso de rede no primeiro build).
# Em cada camada, 21 é tentado antes de 17.
find_valid_jdk() {
  if [[ -n "${JAVA_HOME:-}" ]] && is_valid_jdk_home "$JAVA_HOME"; then
    echo "$JAVA_HOME"
    return 0
  fi

  local -a gradle_candidates=()
  if [[ -d "$HOME/.gradle/jdks" ]]; then
    for cand in "$HOME/.gradle/jdks"/*/; do
      [[ -d "$cand" ]] && gradle_candidates+=("${cand%/}")
    done
  fi
  local found
  if found="$(_first_match_by_version 21 17 -- "${gradle_candidates[@]}")"; then
    echo "$found"
    return 0
  fi

  local -a system_candidates=()
  for cand in /usr/lib/jvm/java-21-openjdk* /usr/lib/jvm/java-17-openjdk*; do
    [[ -d "$cand" ]] && system_candidates+=("$cand")
  done
  if found="$(_first_match_by_version 21 17 -- "${system_candidates[@]}")"; then
    echo "$found"
    return 0
  fi

  return 1
}
