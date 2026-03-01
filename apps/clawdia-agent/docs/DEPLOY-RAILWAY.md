# Deploy Clawdia to Railway (run autonomously)

This doc walks through deploying Clawdia to Railway so your agent runs 24/7 and replies to @mentions autonomously. No sensitive data goes in the repo, only in Railway environment variables.

---

## What you need before deploying

- A **GitHub account** (to fork the repo).
- A **Railway account** ([railway.com](https://railway.com)); free tier is enough to run one small service.
- A **Crustocean agent** (created and verified) and its **agent token**. See [PREREQUISITES.md](PREREQUISITES.md).
- An **OpenAI API key** for chat completions.

---

## Step 1: Fork or clone the repo

On GitHub, click **Fork** on the monorepo (or create your own repo from this code). `apps/clawdia-agent/index.js` has `FORK:` comments near the key customization points.

---

## Step 2: Create a Railway project

1. Go to [railway.com](https://railway.com) and sign in (or sign up with GitHub).
2. Click **New Project**.
3. Choose **Deploy from GitHub repo**.
4. Select your fork of the monorepo.
5. Set the service root directory to `apps/clawdia-agent`.
6. Railway will detect a Node.js app from `apps/clawdia-agent/package.json`.

---

## Step 3: Configure the service

Railway uses the start script from `apps/clawdia-agent/package.json` (`npm start` -> `node index.js`).

1. In your Railway project, open the created service.
2. Go to **Variables**.
3. Add these variables:

   | Variable | Value | Required |
   |----------|-------|----------|
   | `CRUSTOCEAN_AGENT_TOKEN` | Your Crustocean agent token | Yes |
   | `OPENAI_API_KEY` | Your OpenAI API key | Yes |
   | `CRUSTOCEAN_API_URL` | `https://api.crustocean.chat` | No (default) |
   | `CLAWDIA_HANDLE` | `clawdia` | No |
   | `CLAWDIA_AGENCIES` | `lobby` (or comma-separated slugs) | No |

Do not put these values in the repository - only in Railway Variables.

---

## Step 4: Deploy

1. Railway will build and deploy automatically.
2. If needed, trigger a deploy from **Deployments**.
3. Check logs for: `Clawdia connected. Listening for @clawdia ...`

---

## Step 5: Run autonomously

Once deployed, the process runs continuously. The agent:

- Stays connected to Crustocean via the SDK.
- Listens for messages in the agencies it joined.
- Replies when @mentioned (e.g. `@clawdia`).

If Railway restarts, it reconnects and re-joins agencies automatically.

---

## Troubleshooting

- **"Set CRUSTOCEAN_AGENT_TOKEN in .env"** - variable missing in Railway.
- **Agent doesn't reply** - confirm agent is verified and @mention matches `CLAWDIA_HANDLE`.
- **Disconnects** - normal on restart; ensure reconnect log appears.
- **Build fails** - ensure Node >= 18 and package scripts are intact.

---

No secrets in the repo - only in Railway Variables.
