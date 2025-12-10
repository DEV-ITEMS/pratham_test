# Backend API

Documenting the currently implemented endpoints.

## Health
- **GET /health** — Public.
  - Purpose: service liveness.
  - Response: `{"status":"ok"}`.

## Auth
- **POST /auth/signup** — Public.
  - Body:
    ```json
    {"name":"Jane","email":"jane@example.com","password":"supersecret"}
    ```
  - Response: `{"token":"...","user":{...},"organization":{...}}`.
- **POST /auth/login** — Public.
  - Body:
    ```json
    {"email":"jane@example.com","password":"supersecret"}
    ```
  - Response: `{"token":"...","user":{...},"organization":{...}}`.
- **GET /auth/me** — Requires JWT.
  - Headers: `Authorization: Bearer <token>`
  - Response: `{"user":{...},"organization":{...}}`.

## Organization
- **GET /org** — Requires JWT.
  - Headers: `Authorization: Bearer <token>`
  - Purpose: fetch current org by `organizationId` claim.
  - Response fields: `id, name, slug, logoUrl, primaryColor, seatLimit, createdAt`.
- **GET /org/seat-usage** — Requires JWT.
  - Headers: `Authorization: Bearer <token>`
  - Purpose: seat usage summary for current org.
  - Response:
    ```json
    {"used":2,"available":3,"limit":5}
    ```

## Projects
- **GET /projects** — Requires JWT.
  - Headers: `Authorization: Bearer <token>`
  - Query:
    - `portfolio` (boolean, optional)
    - `visibility` ("PUBLIC" | "INVITE_ONLY" | "PRIVATE", optional)
    - `page` (default 1), `pageSize` (default 20, max 100)
  - Response:
    ```json
    {
      "items": [
        {
          "id": "...",
          "name": "Lobby",
          "slug": "lobby",
          "visibility": "PRIVATE",
          "portfolio": false,
          "description": "Welcome area",
          "tags": ["entrance"],
          "createdAt": "2025-01-01T00:00:00.000Z",
          "heroAsset": {"id":"...","url":"https://..."} // null if none
        }
      ],
      "page": 1,
      "pageSize": 20,
      "total": 12
    }
    ```
- **POST /projects** — Requires JWT.
  - Headers: `Authorization: Bearer <token>`
  - Body:
    ```json
    {
      "name": "New Project",
      "description": "Optional",
      "visibility": "PRIVATE",   // default PRIVATE
      "portfolio": false,        // default false
      "tags": ["tag1", "tag2"]   // default []
    }
    ```
  - Purpose: create project within `organizationId` from token; slug auto-generated and unique per org.
  - Response (same shape as list item):
    ```json
    {
      "id": "...",
      "name": "New Project",
      "slug": "new-project",
      "visibility": "PRIVATE",
      "portfolio": false,
      "description": "Optional",
      "tags": ["tag1","tag2"],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "heroAsset": null
    }
    ```
