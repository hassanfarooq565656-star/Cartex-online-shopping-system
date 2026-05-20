# Push CARTEX to GitHub

Your project is committed locally. Follow these steps once to publish it.

## Step 1 — Log in to GitHub

Open **PowerShell** or **Terminal** in this folder and run:

```powershell
gh auth login
```

Choose:
- **GitHub.com**
- **HTTPS**
- **Login with a web browser** (easiest)

## Step 2 — Create repo and push

```powershell
cd "C:\Users\khan computers\Projects\hassan"
gh repo create cartex-online-shopping --public --source=. --remote=origin --push
```

Change `cartex-online-shopping` to any repo name you want.

## Or: repo already exists on GitHub

```powershell
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## After push

- Set your real MySQL password locally in `backend/src/main/resources/application.properties` (not committed if you use `YOUR_MYSQL_PASSWORD` placeholder).
- Never commit API keys or real passwords.

## What was committed

- 64 files: backend, frontend, database schema, README
- Password in config replaced with `YOUR_MYSQL_PASSWORD` for safety
