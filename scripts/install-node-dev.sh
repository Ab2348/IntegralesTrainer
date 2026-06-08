#!/usr/bin/env sh
set -eu

NODE_VERSION="${NODE_VERSION:-v22.22.3}"
ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
DEV_DIR="$ROOT_DIR/.dev"
CACHE_DIR="$DEV_DIR/cache"

case "$(uname -s)" in
  Linux) node_os="linux" ;;
  Darwin) node_os="darwin" ;;
  *)
    echo "Sistema no soportado: $(uname -s)" >&2
    exit 1
    ;;
esac

case "$(uname -m)" in
  x86_64 | amd64) node_arch="x64" ;;
  arm64 | aarch64) node_arch="arm64" ;;
  *)
    echo "Arquitectura no soportada: $(uname -m)" >&2
    exit 1
    ;;
esac

node_name="node-${NODE_VERSION}-${node_os}-${node_arch}"
archive_name="${node_name}.tar.xz"
base_url="https://nodejs.org/dist/${NODE_VERSION}"
archive_path="$CACHE_DIR/$archive_name"
shasums_path="$CACHE_DIR/SHASUMS256.txt"
install_dir="$DEV_DIR/$node_name"
env_file="$DEV_DIR/node-env.sh"

mkdir -p "$CACHE_DIR"

download() {
  url="$1"
  target="$2"
  if command -v curl >/dev/null 2>&1; then
    curl --fail --location --proto '=https' --tlsv1.2 --output "$target" "$url"
  elif command -v wget >/dev/null 2>&1; then
    wget --https-only --output-document="$target" "$url"
  else
    echo "Se necesita curl o wget para descargar Node.js." >&2
    exit 1
  fi
}

if [ ! -f "$shasums_path" ]; then
  download "$base_url/SHASUMS256.txt" "$shasums_path"
fi

if [ ! -f "$archive_path" ]; then
  download "$base_url/$archive_name" "$archive_path"
fi

expected="$(grep "  $archive_name\$" "$shasums_path" | awk '{print $1}')"
if [ -z "$expected" ]; then
  echo "No se encontro checksum para $archive_name." >&2
  exit 1
fi

actual="$(sha256sum "$archive_path" | awk '{print $1}')"
if [ "$actual" != "$expected" ]; then
  echo "Checksum invalido para $archive_name." >&2
  echo "Esperado: $expected" >&2
  echo "Actual:   $actual" >&2
  exit 1
fi

rm -rf "$install_dir"
tar -xJf "$archive_path" -C "$DEV_DIR"

cat > "$env_file" <<EOF
export PATH="$install_dir/bin:\$PATH"
EOF

echo "Node instalado en: $install_dir"
echo "Activa el entorno con:"
echo "  . $env_file"
echo "Luego ejecuta:"
echo "  npm ci"
echo "  npm run sass"
