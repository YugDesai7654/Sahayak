#!/bin/bash
set -e

echo "==> Starting Sahayak Backend..."

# If AUTO_SEED is set to "true", seed default schemes and test accounts
if [ "$AUTO_SEED" = "true" ]; then
    echo "==> AUTO_SEED is enabled. Running seed script..."
    python seed.py || echo "Warning: Seed script encountered an error or data already exists."
fi

exec "$@"
