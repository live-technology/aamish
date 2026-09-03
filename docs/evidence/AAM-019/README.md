# AAM-019 login and session evidence

Captured from the Dockerized internal-beta application on 2026-09-01.

- `login-desktop.png`: 1280 × 900 session-ended login state.
- `login-mobile.png`: 390 × 844 default login state.

Validated behavior:

- invalid credentials return a neutral `401` response with a request ID;
- Super Admin, Enterprise Admin, and Employee accounts route to their respective workspaces;
- protected routes without a session redirect to `/login?reason=session-ended`;
- an authenticated visit to `/login` redirects to the active role workspace;
- recent Docker logs contain structured success and failure events without unexpected errors.
