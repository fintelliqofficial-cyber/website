#!/usr/bin/env python3
"""Local dev server that mimics GitHub Pages routing for /portfolio/<userId>."""

import http.server
import os
import re
import socketserver
from urllib.parse import quote

PORT = int(os.environ.get("PORT", "8771"))
ROOT = os.path.dirname(os.path.abspath(__file__))

PORTFOLIO_USER = re.compile(r"^/portfolio/([^/]+)/?$")


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def _redirect_portfolio_user(self):
        match = PORTFOLIO_USER.match(self.path.split("?", 1)[0])
        if match and match.group(1) != "index.html":
            user_id = match.group(1)
            self.send_response(302)
            self.send_header(
                "Location",
                f"/portfolio/index.html?user={quote(user_id, safe='')}",
            )
            self.end_headers()
            return True
        return False

    def do_GET(self):
        if self._redirect_portfolio_user():
            return
        return super().do_GET()

    def do_HEAD(self):
        if self._redirect_portfolio_user():
            return
        return super().do_HEAD()


if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving {ROOT} at http://localhost:{PORT}/")
        print(f"Portfolio: http://localhost:{PORT}/portfolio/demo")
        print("Uses live API by default. Add ?mock=1 for local mock data.")
        httpd.serve_forever()
