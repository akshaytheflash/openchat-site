# OpenChat — launch site

Static site for OpenChat. No build step, no dependencies. `index.html` + `styles.css` + `app.js` + `assets/`.

The launch film (`assets/openchat-launch.mp4`, 23 s, 1080p30) is the one made with **onetake** in
`../onetake/cases/openchat-launch-24s/`.

## Download button

The APK is not committed to the repo. It lives as a GitHub **Release asset** (94 MB), and every
download button points at the stable "latest" URL:

```
https://github.com/akshaytheflash/openchat-site/releases/latest/download/OpenChat.apk
```

The buttons are in the hero, the mobile menu, the final CTA, the footer, and the FAQ. To ship a new
build, replace the asset on a new release (`v1.0.1`); the URL above keeps working as long as the
release is marked **Latest**.

```bash
gh release create v1.0.1 "path/to/OpenChat.apk" --title "OpenChat 1.0.1 - Android APK" --notes "What changed"
```

## What's on the page

- Hero with the living orb (pointer parallax, respects reduced motion)
- The film, with chapter buttons that seek it and custom play/pause + mute + progress
- A live connect demo: paste a demo key, it validates the `sk-or-v1-` prefix and shows "Connected"
- A rebuilt phone chat that streams the film's canned answer — no model is called
- Persona switcher, the honest free-tier limits, FAQ
- Dark by default, light mode toggle (persisted, respects `prefers-color-scheme`)

Everything is canned/front-end only. No API key is ever sent anywhere.

## Host it on GitHub Pages

### Option A — from the browser (5 steps)

1. Create a new **public** repo, e.g. `openchat-site` (do not add a README/gitignore).
2. On your machine, from this `site/` folder:

   ```bash
   git init
   git add .
   git commit -m "OpenChat launch site"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/openchat-site.git
   git push -u origin main
   ```

3. In the repo: **Settings → Pages**.
4. Under **Build and deployment**, set **Source: Deploy from a branch**, **Branch: `main`**, folder **`/ (root)`**, then **Save**.
5. Wait 1–2 minutes. The site is at:

   ```
   https://YOUR_USERNAME.github.io/openchat-site/
   ```

### Option B — from the CLI

```bash
cd C:\Users\aksha\Downloads\Openchat\site
git init
git add .
git commit -m "OpenChat launch site"
git branch -M main

gh repo create openchat-site --public --source=. --remote=origin --push
gh api -X POST repos/YOUR_USERNAME/openchat-site/pages \
  -f "source[branch]=main" -f "source[path]=/"
```

Then `gh api repos/YOUR_USERNAME/openchat-site/pages` shows the URL — after the first build it's
`https://YOUR_USERNAME.github.io/openchat-site/`.

### User site (no repo path in the URL)

Name the repo exactly `YOUR_USERNAME.github.io` and repeat the same steps. The site is then
`https://YOUR_USERNAME.github.io/`.

### Custom domain (`openchat.app`)

1. Add a file named `CNAME` at the repo root containing only:

   ```
   openchat.app
   ```

   (You can also set it in **Settings → Pages → Custom domain**, which writes the file for you.)
2. At your DNS provider, point the apex to GitHub Pages:

   ```
   A     @    185.199.108.153
   A     @    185.199.109.153
   A     @    185.199.110.153
   A     @    185.199.111.153
   AAAA  @    2606:50c0:8000::153
   AAAA  @    2606:50c0:8001::153
   AAAA  @    2606:50c0:8002::153
   AAAA  @    2606:50c0:8003::153
   CNAME www  YOUR_USERNAME.github.io.
   ```

3. Wait for DNS, then enable **Enforce HTTPS** in Settings → Pages.

## Updating

Every push to `main` redeploys in a minute or two:

```bash
git add .
git commit -m "Update copy"
git push
```

Hard-refresh (Ctrl/Cmd + Shift + R) if you still see the old version — Pages sends
`Cache-Control: max-age=600`.

## Notes

- Keep the repo public. Pages on a private repo needs a paid GitHub plan.
- The video is 5.3 MB, well under the 100 MB per-file limit.
- `.nojekyll` is included so Pages serves the files as-is (no Jekyll pass).
- All asset paths are relative, so the site works at `username.github.io/repo/` and on a custom domain.
- Fonts: Geist / Geist Mono, OFL — licence in `assets/fonts/LICENSES.txt`.
- Local preview: `python -m http.server 8080` in this folder, then open <http://localhost:8080/>.
