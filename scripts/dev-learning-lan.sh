#!/usr/bin/env bash

set -euo pipefail

frontend_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
project_dir="$(cd "${frontend_dir}/.." && pwd)"
certificate_dir="${project_dir}/.dev-certs"
lan_ip="${FORMAFLOW_LAN_IP:-$(hostname -I | awk '{print $1}')}"

if ! command -v mkcert >/dev/null 2>&1; then
  echo "mkcert is required. Install it with: sudo apt install mkcert libnss3-tools"
  exit 1
fi

if [[ ! -f "${project_dir}/backend/.env" ]] || ! grep -Eq '^VAPID_PUBLIC_KEY=.{10,}' "${project_dir}/backend/.env"; then
  echo "Web Push keys are missing in backend/.env. Generate them with:"
  echo "  cd backend && php artisan webpush:generate-vapid"
  echo "Then copy the three printed VAPID_* lines into backend/.env."
  exit 1
fi

mkdir -p "${certificate_dir}"
if [[ ! -f "${certificate_dir}/cert.pem" || ! -f "${certificate_dir}/key.pem" ]]; then
  mkcert -install
  mkcert -key-file "${certificate_dir}/key.pem" -cert-file "${certificate_dir}/cert.pem" localhost 127.0.0.1 ::1 "${lan_ip}"
fi

cleanup() {
  jobs -pr | xargs -r kill
}
trap cleanup EXIT INT TERM

(cd "${project_dir}/backend" && php artisan migrate --force && php artisan serve --host=127.0.0.1 --port=8000) &
(cd "${project_dir}/backend" && php artisan schedule:work) &
(
  cd "${frontend_dir}"
  VITE_API_BASE_URL=/api/v1 \
  VITE_DEV_API_PROXY=http://127.0.0.1:8000 \
  VITE_DEV_CERT_DIR="${certificate_dir}" \
  VITE_DEV_HOST=0.0.0.0 \
  yarn dev
) &

echo "FormaFlow Learning: https://${lan_ip}:5173"
echo "Install the generated mkcert CA on mobile devices once so PWA and Web Push trust this HTTPS origin."
wait
