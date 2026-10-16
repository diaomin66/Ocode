#!/bin/bash
# Retry only the stapling operation after the caller has an accepted ticket.
# electron-notarize invokes this command only after notarytool reports Accepted.

set -u

OCODE_STAPLER_REAL_XCRUN="${OCODE_XCRUN_REAL:-/usr/bin/xcrun}"

if [[ "${1:-}" != "stapler" || "${2:-}" != "staple" || -z "${OCODE_STAPLER_MAX_ATTEMPTS:-}" ]]; then
  exec "$OCODE_STAPLER_REAL_XCRUN" "$@"
fi

OCODE_STAPLER_ATTEMPTS="$OCODE_STAPLER_MAX_ATTEMPTS"
OCODE_STAPLER_DELAY="${OCODE_STAPLER_RETRY_DELAY_SECONDS:-10}"

if [[ ! "$OCODE_STAPLER_ATTEMPTS" =~ ^[1-6]$ ]]; then
  echo "error: OCODE_STAPLER_MAX_ATTEMPTS must be between 1 and 6." >&2
  exit 2
fi

if [[ ! "$OCODE_STAPLER_DELAY" =~ ^[0-9]+$ ]] || (( OCODE_STAPLER_DELAY > 60 )); then
  echo "error: OCODE_STAPLER_RETRY_DELAY_SECONDS must be between 0 and 60." >&2
  exit 2
fi

OCODE_STAPLER_STATUS=1
for ((attempt = 1; attempt <= OCODE_STAPLER_ATTEMPTS; attempt += 1)); do
  if "$OCODE_STAPLER_REAL_XCRUN" "$@"; then
    exit 0
  else
    OCODE_STAPLER_STATUS=$?
  fi

  if (( attempt < OCODE_STAPLER_ATTEMPTS )); then
    echo "warning: stapler staple attempt $attempt/$OCODE_STAPLER_ATTEMPTS failed; retrying in ${OCODE_STAPLER_DELAY}s." >&2
    sleep "$OCODE_STAPLER_DELAY"
  fi
done

exit "$OCODE_STAPLER_STATUS"
