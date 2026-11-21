from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class PreviewHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    project = Path(__file__).resolve().parent
    handler = partial(PreviewHandler, directory=str(project))
    with ThreadingHTTPServer(('127.0.0.1', 8000), handler) as server:
        print('GearCompare: http://127.0.0.1:8000/', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
