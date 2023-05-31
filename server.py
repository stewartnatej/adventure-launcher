from http.server import HTTPServer, SimpleHTTPRequestHandler


class CORSRequestHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        """redirect root path to the home page"""
        if self.path == '/':
            self.path = '/hiking.html'
        return SimpleHTTPRequestHandler.do_GET(self)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        SimpleHTTPRequestHandler.end_headers(self)


if __name__ == '__main__':
    HTTPServer(('localhost', 8000), CORSRequestHandler).serve_forever()
