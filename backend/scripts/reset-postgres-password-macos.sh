#!/usr/bin/env bash
# Reset PostgreSQL superuser password (macOS, EDB installer default paths).
# Run:  bash backend/scripts/reset-postgres-password-macos.sh
# You will be prompted for: (1) your macOS sudo password, (2) the NEW postgres password (twice).
set -euo pipefail

PG_BIN="${PG_BIN:-/Library/PostgreSQL/16/bin}"
PGDATA="${PGDATA:-/Library/PostgreSQL/16/data}"
PG_HBA="${PGDATA}/pg_hba.conf"
BACKUP="${PG_HBA}.before_catface_reset.$(date +%Y%m%d%H%M%S)"

if [[ ! -x "${PG_BIN}/psql" ]]; then
  echo "ERROR: psql not found at ${PG_BIN}/psql. Set PG_BIN to your install's bin directory."
  exit 1
fi
# Data dir is often mode 700 (postgres only): non-root users cannot stat pg_hba.conf, so only check PGDATA.
if [[ ! -d "${PGDATA}" ]]; then
  echo "ERROR: PGDATA directory not found at ${PGDATA}. Set PGDATA to your cluster data directory (see: ps aux | grep '[p]ostgres')."
  exit 1
fi

echo "Checking pg_hba.conf (sudo may ask for your Mac password)..."
if ! sudo test -f "${PG_HBA}"; then
  echo "ERROR: ${PG_HBA} not found or not readable. Set PGDATA to the path after postgres -D in: ps aux | grep '[p]ostgres'"
  exit 1
fi

escape_sql() {
  printf '%s' "$1" | sed "s/'/''/g"
}

read -r -s -p "New password for PostgreSQL user 'postgres': " NEW_PASS
echo
read -r -s -p "Confirm new password: " NEW_PASS2
echo
if [[ "$NEW_PASS" != "$NEW_PASS2" ]]; then
  echo "ERROR: passwords do not match."
  exit 1
fi
if [[ -z "$NEW_PASS" ]]; then
  echo "ERROR: empty password not allowed."
  exit 1
fi

echo "Backing up pg_hba.conf and switching local TCP auth to trust (requires sudo)..."
sudo cp "${PG_HBA}" "${BACKUP}"
sudo sed -i '' \
  -e 's/scram-sha-256/trust/g' \
  -e 's/[[:space:]]md5$/ trust/g' \
  -e 's/[[:space:]]password$/ trust/g' \
  "${PG_HBA}"

echo "Reloading PostgreSQL configuration..."
# pg_ctl must not run as root; use the same OS user that owns the server (usually postgres).
sudo -u postgres "${PG_BIN}/pg_ctl" reload -D "${PGDATA}"

NEW_ESC="$(escape_sql "$NEW_PASS")"
echo "Setting postgres user password..."
"${PG_BIN}/psql" -h localhost -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 \
  -c "ALTER USER postgres WITH PASSWORD '${NEW_ESC}';"

if [[ "$("${PG_BIN}/psql" -h localhost -p 5432 -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='catface'" 2>/dev/null || true)" != "1" ]]; then
  echo "Creating database catface..."
  "${PG_BIN}/psql" -h localhost -p 5432 -U postgres -d postgres -v ON_ERROR_STOP=1 \
    -c "CREATE DATABASE catface;"
fi

echo "Restoring pg_hba.conf and reloading..."
sudo cp "${BACKUP}" "${PG_HBA}"
sudo -u postgres "${PG_BIN}/pg_ctl" reload -D "${PGDATA}"

echo
echo "Done. Put this in backend/.env (adjust database name if needed):"
echo "DATABASE_URL=\"postgresql://postgres:${NEW_PASS}@localhost:5432/catface\""
echo
echo "Then: cd backend && npx prisma migrate deploy"
echo "Backup of pg_hba.conf: ${BACKUP}"
