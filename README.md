# Lunovia

Static GitHub Pages frontend with a Cloudflare Worker proxy for Gemini. The source HTML in `sources/` is a read-only local reference and is excluded from Git.

## Configure and deploy the Worker

1. Install Wrangler (`npm install --save-dev wrangler`) and authenticate with `npx wrangler login`.
2. Edit `ALLOWED_ORIGIN` in `wrangler.toml` to the exact GitHub Pages origin, with no path or trailing slash. For a project site the origin is still `https://USERNAME.github.io`. For a custom domain, use `https://your-domain.example`.
3. From this project directory, set the Gemini key as an encrypted Worker secret:

   ```sh
   npx wrangler secret put GEMINI_API_KEY --name lunovia-chat-api
   ```

   Paste the key only at Wrangler's secure prompt. Do not put it in `wrangler.toml`, frontend files, or Git.
4. Deploy:

   ```sh
   npx wrangler deploy
   ```

## Configure and deploy GitHub Pages

1. Copy the deployed Worker URL into `WORKER_ENDPOINT` near the top of `script.js` (for example, `https://lunovia-chat-api.YOUR-SUBDOMAIN.workers.dev`). Keep the trailing slash out of the value.
2. Commit `index.html`, `style.css`, `script.js`, `worker/index.js`, `wrangler.toml`, `README.md`, and `.gitignore` to your GitHub repository.
3. In GitHub, open **Settings → Pages**, choose **Deploy from a branch**, select the desired branch and `/ (root)`, then save. GitHub Pages will publish the frontend.
4. If the Pages origin changes, update `ALLOWED_ORIGIN` and redeploy the Worker.

## CORS behavior

The Worker accepts only the single exact origin configured as `ALLOWED_ORIGIN`. It handles `OPTIONS` preflight requests and permits `POST` with `Content-Type`. Requests from other origins receive HTTP 403. Do not use `*` for the allowed origin.

## Commit guidance

Commit the frontend, Worker source, Wrangler config, and this setup guide. Do not commit `.dev.vars`, any API key, build credentials, or the read-only `sources/` reference. The API key belongs only in the Cloudflare Worker secret store. The public Worker URL and Pages origin are configuration values, not secrets.

The key that was present in the original supplied HTML should be considered exposed. Revoke/rotate it with its provider before deploying, then store the replacement with `wrangler secret put`.
