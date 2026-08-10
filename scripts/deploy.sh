#!/usr/bin/env bash

set -Eeuo pipefail

readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
readonly DIST_DIR="${PROJECT_DIR}/dist"
readonly DEPLOY_DIR="${DARQ_FE_DEPLOY_DIR:-/opt/akkoma/instance/static/frontends/darq-fe/main}"
readonly DEPLOY_OWNER="${DARQ_FE_DEPLOY_OWNER:-akkoma:akkoma}"
readonly NVM_ROOT="${DARQ_FE_NVM_DIR:-/root/.nvm}"

if [[ "${DEPLOY_DIR}" != */frontends/darq-fe/main ]]; then
  printf 'Refusing unsafe deployment target: %s\n' "${DEPLOY_DIR}" >&2
  printf 'The target must end with /frontends/darq-fe/main.\n' >&2
  exit 1
fi

if [[ ! -s "${NVM_ROOT}/nvm.sh" ]]; then
  printf 'NVM was not found at %s.\n' "${NVM_ROOT}" >&2
  printf 'Set DARQ_FE_NVM_DIR to the correct NVM directory.\n' >&2
  exit 1
fi

export NVM_DIR="${NVM_ROOT}"
set +u
# shellcheck source=/dev/null
source "${NVM_ROOT}/nvm.sh"
nvm use --silent --lts
set -u

if ! command -v corepack >/dev/null 2>&1; then
  printf 'Corepack is missing from the active NVM LTS installation.\n' >&2
  exit 1
fi

PNPM=(corepack pnpm)

if ! command -v rsync >/dev/null 2>&1; then
  printf 'rsync is required to deploy darq-fe.\n' >&2
  exit 1
fi

printf 'Building darq-fe...\n'
cd "${PROJECT_DIR}"
"${PNPM[@]}" run build

if [[ ! -f "${DIST_DIR}/index.html" || ! -d "${DIST_DIR}/assets" ]]; then
  printf 'Build output is incomplete: %s\n' "${DIST_DIR}" >&2
  exit 1
fi

if (( EUID == 0 )); then
  PRIVILEGED=()
elif command -v sudo >/dev/null 2>&1; then
  PRIVILEGED=(sudo)
else
  printf 'Root access is required to deploy to %s.\n' "${DEPLOY_DIR}" >&2
  exit 1
fi

printf 'Deploying dist to %s...\n' "${DEPLOY_DIR}"
"${PRIVILEGED[@]}" install -d -o "${DEPLOY_OWNER%%:*}" -g "${DEPLOY_OWNER##*:}" "${DEPLOY_DIR}"
"${PRIVILEGED[@]}" rsync \
  --archive \
  --delete-delay \
  --chown="${DEPLOY_OWNER}" \
  "${DIST_DIR}/" \
  "${DEPLOY_DIR}/"

printf 'darq-fe deployed successfully. No Darqoma restart is required.\n'
