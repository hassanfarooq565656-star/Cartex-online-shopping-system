# CARTEX — Where to put API keys & secrets

## Quick setup

1. Copy the example file:
   ```
   backend/src/main/resources/application-local.properties.example
   → backend/src/main/resources/application-local.properties
   ```

2. Open `application-local.properties` and replace every `YOUR_...` value.

3. Start the app: `run.bat` or `mvn spring-boot:run` in `backend/`.

---

## Key reference

| Setting | File | What it does |
|---------|------|----------------|
| `spring.datasource.password` | `application-local.properties` | MySQL password |
| `gemini.api.key` | `application-local.properties` | AI product recommendations |
| `grok.api.key` | `application-local.properties` | Support chat & greetings |
| `grok.model` | `application-local.properties` | Model name (default `grok-3-mini`) |
| `app.admin.email` | `application-local.properties` | Who can use admin APIs |

## Environment variables (alternative)

You can set these instead of `application-local.properties`:

| Variable | Maps to |
|----------|---------|
| `DB_PASSWORD` | MySQL password |
| `GEMINI_API_KEY` | Gemini |
| `GROK_API_KEY` | Grok/Groq |
| `GROK_MODEL` | Grok model |
| `ADMIN_EMAIL` | Admin email |

## Frontend

The frontend has **no API keys**. It only calls `http://localhost:8080/api` via `config.js`.

## Check if keys work

After starting the backend, open:

`http://localhost:8080/api/status`

You will see which services are configured (not the actual keys).
