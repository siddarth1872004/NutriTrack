import http.cookiejar
import json
import tempfile
import threading
import unittest
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, build_opener, HTTPCookieProcessor
from http.server import ThreadingHTTPServer

import server


class NutriTrackAuthFlowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.original = (server.ROOT, server.STATE, server.DB)
        cls.temp = tempfile.TemporaryDirectory()
        server.ROOT = Path(__file__).resolve().parents[1]
        server.STATE = Path(cls.temp.name) / ".nutritrack"
        server.DB = server.STATE / "auth.sqlite3"
        server.SESSIONS.clear()
        salt, digest = server.derive("Admin-password-123!")
        with server.connect() as db:
            db.execute(
                "INSERT INTO users(username,salt,digest,role,active,created_at) VALUES(?,?,?,'admin',1,CURRENT_TIMESTAMP)",
                ("rootadmin", salt, digest),
            )
        cls.httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        cls.base = "http://127.0.0.1:" + str(cls.httpd.server_address[1])
        cls.thread = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()
        cls.thread.join(timeout=3)
        server.SESSIONS.clear()
        server.ROOT, server.STATE, server.DB = cls.original
        cls.temp.cleanup()

    def setUp(self):
        self.admin = self.opener()
        self.user = self.opener()
        self.dietitian = self.opener()
        self.other = self.opener()
        self.json_request(self.admin, "/auth/login", {"username": "rootadmin", "password": "Admin-password-123!"}, form=True)

    def opener(self):
        return build_opener(HTTPCookieProcessor(http.cookiejar.CookieJar()))

    def request(self, opener, path, data=None, form=False):
        headers = {}
        body = None
        if data is not None:
            if form:
                body = urlencode(data).encode()
                headers["Content-Type"] = "application/x-www-form-urlencoded"
            else:
                body = json.dumps(data).encode()
                headers["Content-Type"] = "application/json"
        req = Request(self.base + path, data=body, headers=headers)
        try:
            with opener.open(req, timeout=5) as response:
                return response.status, response.read().decode()
        except HTTPError as exc:
            return exc.code, exc.read().decode()

    def json_request(self, opener, path, data=None, form=False):
        status, body = self.request(opener, path, data, form)
        try:
            parsed = json.loads(body)
        except json.JSONDecodeError:
            parsed = body
        return status, parsed

    def create_account(self, username, password, role):
        return self.json_request(self.admin, "/api/admin/users", {
            "username": username, "password": password, "role": role
        })

    def login(self, opener, username, password):
        return self.json_request(opener, "/auth/login", {
            "username": username, "password": password
        }, form=True)

    def test_public_signup_always_creates_user_and_cannot_access_admin(self):
        status, _ = self.json_request(self.user, "/auth/signup", {
            "username": "normaluser", "password": "User-password-123!",
            "confirm": "User-password-123!"
        }, form=True)
        self.assertEqual(status, 200)
        self.login(self.user, "normaluser", "User-password-123!")
        status, me = self.json_request(self.user, "/api/me")
        self.assertEqual(status, 200)
        self.assertEqual(me["role"], "user")
        status, result = self.json_request(self.user, "/api/admin/overview")
        self.assertEqual(status, 403)

    def test_admin_assignment_sync_and_recommendations_are_scoped(self):
        self.assertEqual(self.create_account("dietitian1", "Dietitian-password-123!", "dietitian")[0], 201)
        self.assertEqual(self.create_account("patientone", "Patient-password-123!", "user")[0], 201)
        self.assertEqual(self.create_account("patienttwo", "Patient-two-password-123!", "user")[0], 201)
        self.assertEqual(self.login(self.user, "patientone", "Patient-password-123!")[0], 200)
        self.assertEqual(self.login(self.other, "patienttwo", "Patient-two-password-123!")[0], 200)
        self.assertEqual(self.json_request(self.admin, "/api/admin/assignments", {
            "username": "patientone", "dietitian": "dietitian1"
        })[0], 200)
        snapshot = {"nutrilog_profile": json.dumps({"age": "25"}), "nutrilog_log_today": json.dumps([{"name": "Oats", "cal": 150}])}
        self.assertEqual(self.json_request(self.user, "/api/my-data", snapshot)[0], 200)
        self.assertEqual(self.login(self.dietitian, "dietitian1", "Dietitian-password-123!")[0], 200)
        status, clients = self.json_request(self.dietitian, "/api/dietitian/clients")
        self.assertEqual(status, 200)
        self.assertEqual([c["username"] for c in clients["clients"]], ["patientone"])
        status, detail = self.json_request(self.dietitian, "/api/dietitian/clients/patientone")
        self.assertEqual(status, 200)
        self.assertEqual(detail["snapshot"]["nutrilog_log_today"], snapshot["nutrilog_log_today"])
        self.assertEqual(self.json_request(self.dietitian, "/api/dietitian/clients/patienttwo")[0], 403)
        self.assertEqual(self.json_request(self.dietitian, "/api/dietitian/recommendations", {
            "username": "patientone", "message": "Consider adding vegetables to lunch."
        })[0], 201)
        status, notes = self.json_request(self.user, "/api/my-recommendations")
        self.assertEqual(status, 200)
        self.assertEqual(notes["recommendations"][0]["message"], "Consider adding vegetables to lunch.")
        status, notes = self.json_request(self.other, "/api/my-recommendations")
        self.assertEqual(status, 200)
        self.assertEqual(notes["recommendations"], [])

    def test_non_dietitian_cannot_create_recommendation(self):
        self.assertEqual(self.create_account("normaltwo", "Normal-two-password-123!", "user")[0], 201)
        self.login(self.user, "normaltwo", "Normal-two-password-123!")
        status, result = self.json_request(self.user, "/api/dietitian/recommendations", {
            "username": "normaltwo", "message": "Should be denied"
        })
        self.assertEqual(status, 403)


if __name__ == "__main__":
    unittest.main()
