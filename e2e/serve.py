import http.server
import os
import signal
import sys


class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.translate_path(self.path)
        if not os.path.exists(path) and not os.path.isdir(path):
            self.path = '/index.html'
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

    def log_message(self, format, *args):
        pass


def main():
    os.chdir(os.path.join(os.path.dirname(__file__), '..', 'dist'))
    server = http.server.HTTPServer(('0.0.0.0', 4173), SPAHandler)

    def shutdown(sig, frame):
        server.shutdown()
        sys.exit(0)

    signal.signal(signal.SIGTERM, shutdown)
    signal.signal(signal.SIGINT, shutdown)
    server.serve_forever()


if __name__ == '__main__':
    main()
