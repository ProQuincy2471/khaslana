#!/usr/bin/env python3
"""KHASLANA — servidor local.

Único servidor del proyecto: lo usan tanto abrir.command como .claude/launch.json.

Dos detalles que importan y conviene no deshacer:

  · ThreadingHTTPServer, no TCPServer. El navegador mantiene varias conexiones
    abiertas a la vez (la página, el iframe del capítulo, las fuentes); con un
    servidor de un solo hilo se queda bloqueado en una y la página se cuelga
    sin dar ningún error.

  · Cache-Control: no-store, y se descartan las peticiones condicionales. Sin
    eso el navegador reutiliza la copia vieja y los cambios no se ven aunque
    el archivo en disco esté actualizado.

Escucha sólo en 127.0.0.1: por defecto http.server se expone a toda la red
local, y aquí se está sirviendo la carpeta de capítulos.

Uso:  python3 scripts/serve.py [puerto]
"""

import os
import sys
import http.server

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8124

# servir siempre la raíz del proyecto, sin importar desde dónde se invoque
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def send_head(self):
        for h in ('If-Modified-Since', 'If-None-Match'):
            if h in self.headers:
                del self.headers[h]
        return super().send_head()

    def log_message(self, *a):
        pass


http.server.ThreadingHTTPServer.allow_reuse_address = True
http.server.ThreadingHTTPServer.daemon_threads = True

with http.server.ThreadingHTTPServer(('127.0.0.1', PORT), NoCache) as httpd:
    print(f'KHASLANA  ->  http://localhost:{PORT}', flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\n  servidor cerrado')
