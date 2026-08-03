#!/bin/sh
# Maven with the JDK this project actually needs.
#
# The pom targets Java 21; macOS here ships Java 11 and has no Homebrew, so the
# toolchain lives under ~/.local/matcha-tools rather than being installed system
# wide. Re-create it with:
#
#   mkdir -p ~/.local/matcha-tools && cd ~/.local/matcha-tools
#   curl -L -o jdk.tgz "https://api.adoptium.net/v3/binary/latest/21/ga/mac/aarch64/jdk/hotspot/normal/eclipse"
#   tar xzf jdk.tgz && rm jdk.tgz
#   curl -L -o mvn.tgz "https://dlcdn.apache.org/maven/maven-3/3.9.16/binaries/apache-maven-3.9.16-bin.tar.gz"
#   tar xzf mvn.tgz && rm mvn.tgz
#
# Usage: ./mvn.sh test
set -e

TOOLS="$HOME/.local/matcha-tools"
JAVA_HOME="$TOOLS/jdk-21.0.12+8/Contents/Home"
export JAVA_HOME

if [ ! -x "$JAVA_HOME/bin/java" ]; then
  echo "JDK 21 not found at $JAVA_HOME — see the header of this script." >&2
  exit 1
fi

exec "$TOOLS/apache-maven-3.9.16/bin/mvn" "$@"
