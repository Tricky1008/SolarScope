#!/usr/bin/env bash
echo "🛑 Stopping SolarScope..."

# Kill backend
if [ -f .backend.pid ]; then
  kill $(cat .backend.pid) 2>/dev/null && echo "✅ Backend stopped"
  rm .backend.pid
fi

# Kill frontend
if [ -f .frontend.pid ]; then
  kill $(cat .frontend.pid) 2>/dev/null && echo "✅ Frontend stopped"
  rm .frontend.pid
fi

# Stop docker services
docker compose down && echo "✅ Database stopped"
echo "Done."
