#!/bin/bash
# ── KHASLANA · servidor local ──
# Doble clic para abrir. Sirve la app en http://localhost:8124
#
# Hace falta servirla desde localhost y no con file://: Chrome trata cada
# archivo local como un origen distinto y deja los iframes vacíos, así que
# el lector de capítulos no funciona abriendo el index directamente.
#
# Los capítulos se sirven a través del symlink codex/ → la carpeta del
# Escritorio. Si mueves esa carpeta, corre el indexador y se rehace solo.
#
# El servidor vive en scripts/serve.py (el mismo que usa .claude/launch.json).

cd "$(dirname "$0")" || exit 1
PORT=8124

# si el puerto ya está ocupado, sube hasta encontrar uno libre
while lsof -nP -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; do
  PORT=$((PORT+1))
done

if [ ! -e codex ]; then
  echo ""
  echo "  ⚠  Falta el enlace codex/. Corre:  node scripts/index-codex.mjs"
fi

echo ""
echo "  KHASLANA   →  http://localhost:$PORT"
echo "  Deja esta ventana abierta mientras la usas."
echo "  Para cerrar el servidor: Ctrl-C"
echo ""

# la marca de tiempo hace que cada arranque sea una URL nueva para el
# navegador: así jamás puede reutilizar una copia vieja de la página
sleep 1 && open "http://localhost:$PORT/?b=$(date +%s)" &

exec python3 scripts/serve.py "$PORT"
