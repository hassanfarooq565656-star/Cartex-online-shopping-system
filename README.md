# CARTEX — Online Shopping System

Full-stack e-commerce app with Spring Boot backend, HTML/JS frontend, and MySQL database.

## Project structure

```
hassan/
├── README.md
├── run.bat                 # Start backend (Windows)
├── database/
│   └── schema.sql          # MySQL schema + seed data (50 products)
├── frontend/               # Standalone UI files (also copied to backend static)
│   ├── index.html
│   ├── auth.html, cart.html, payment.html, records.html, admin.html
│   ├── app.js, auth.js, cart.js, payment.js, records.js, admin.js
│   ├── config.js, styles.css
│   └── ...
└── backend/                # Spring Boot 3.2 + JPA
    ├── pom.xml
    └── src/main/
        ├── java/com/shopping/
        │   ├── ShoppingApplication.java
        │   ├── ShoppingController.java   # REST API
        │   ├── User, Product, Order, CartItem, ...
        │   ├── GrokService.java          # AI support chat
        │   ├── GeminiService.java        # AI product recommendations
        │   └── PaymentService.java
        └── resources/
            ├── application.properties
            └── static/                   # Frontend served at http://localhost:8080
```

## Requirements

- **Java JDK 17+** ([Download Temurin 17](https://adoptium.net/temurin/releases/?version=17))
- **Maven 3.8+** ([Download Maven](https://maven.apache.org/download.cgi)) — or use Cursor/VS Code **Extension Pack for Java** (builds without global Maven)
- **MySQL 8+**

## Fix red errors in Cursor / VS Code

Most errors happen when the IDE sees **duplicate folders** or **Java is not installed**.

1. Open only this folder: `C:\Users\khan computers\Projects\hassan`
2. Install extensions: **Extension Pack for Java** (recommended popup)
3. Install **JDK 17** and restart Cursor
4. Press `Ctrl+Shift+P` → **Java: Clean Java Language Server Workspace** → Reload
5. Wait for Maven import to finish (status bar: "Building workspace...")

The old duplicate `hassan\hassan\` copy was removed — only `backend\` contains Java code now.

## API keys & secrets

**Read [CONFIG.md](CONFIG.md)** — all keys go in one file:

`backend/src/main/resources/application-local.properties`

Quick start: double-click **`setup-secrets.bat`** (copies the example file and opens it in Notepad).

| Key | Purpose |
|-----|---------|
| `spring.datasource.password` | MySQL |
| `gemini.api.key` | AI recommendations |
| `grok.api.key` | AI support chat |

Check configuration: `http://localhost:8080/api/status`

---

## Setup

### 1. Database

```bash
mysql -u root -p < database/schema.sql
```

Or let Spring Boot create tables automatically (`ddl-auto=update`) on first run.

### 2. Configuration

Run `setup-secrets.bat` or copy `application-local.properties.example` → `application-local.properties` and fill in your keys.

### 3. Run

**Windows:** double-click `run.bat` or:

```bash
cd backend
mvn spring-boot:run
```

Open **http://localhost:8080** in your browser.

## Default admin account

| Field    | Value                          |
|----------|--------------------------------|
| Email    | hassanfarooq565656@gmail.com   |
| Password | 12345678                       |

Admin panel: http://localhost:8080/admin.html

## API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Create account |
| POST | `/api/login` | Sign in |
| GET | `/api/products` | Product catalog |
| GET | `/api/categories` | Categories |
| GET | `/api/cart/{userId}` | User cart |
| POST | `/api/cart/{userId}/items` | Add to cart |
| GET | `/api/payment/{userId}` | Checkout summary |
| POST | `/api/payment/bank/init` | Generate PSID |
| POST | `/api/payment/bank/complete` | Confirm bank payment |
| POST | `/api/payment/cod/complete` | Cash on delivery |
| GET | `/api/records/{userId}` | Order history |
| GET | `/api/ai/greet/{userId}` | AI greeting |
| POST | `/api/support/chat/{userId}` | Support chat |
| GET | `/api/ai/recommend/{userId}` | AI recommendations |
| GET | `/api/admin/stats/{userId}` | Admin dashboard |
| POST | `/api/admin/products/{userId}` | Add/update product |
| DELETE | `/api/admin/products/{userId}/{id}` | Delete product |

## Features

- User registration & login
- Product browsing by category
- Server-side cart with 10% first-order discount
- UBL/HBL online pay + cash on delivery
- Order history
- AI support chat (Grok/Groq API)
- AI product recommendations (Gemini API)
- Admin product & order management

## Author
Hassan Farooq
