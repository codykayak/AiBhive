import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const firebaseConfig = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../firebase-applet-config.json'), 'utf8'),
);

export function renderLeadAgentMobileAuthPage(redirectUri) {
  const redirect = String(redirectUri || 'leadagent://auth').replace(/"/g, '');
  const configJson = JSON.stringify(firebaseConfig).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Lead Agent · Sign in</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0f172a; color: #f8fafc; }
    .card { max-width: 360px; padding: 28px; background: #1e293b; border-radius: 16px; text-align: center; }
    h1 { font-size: 1.25rem; margin: 0 0 8px; }
    p { color: #94a3b8; font-size: 0.9rem; line-height: 1.45; }
    button { margin-top: 20px; width: 100%; padding: 14px; border: 0; border-radius: 10px; font-weight: 700; font-size: 1rem; background: #1e4d2b; color: #fff; cursor: pointer; }
    .err { color: #fca5a5; margin-top: 12px; font-size: 0.85rem; }
  </style>
  <script src="https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.14.0/firebase-auth-compat.js"></script>
</head>
<body>
  <div class="card">
    <h1>MacroREI Lead Agent</h1>
    <p>Sign in with Google to view shared marketing lists and sync with your team.</p>
    <button id="btn" type="button">Continue with Google</button>
    <p id="status" class="err"></p>
  </div>
  <script>
    const redirectBase = ${JSON.stringify(redirect)};
    const firebaseConfig = ${configJson};
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

    function finishWithUser(user) {
      return user.getIdToken(true).then(function (idToken) {
        const sep = redirectBase.indexOf('?') >= 0 ? '&' : '?';
        window.location.replace(redirectBase + sep + 'idToken=' + encodeURIComponent(idToken));
      });
    }

    function setStatus(msg) {
      document.getElementById('status').textContent = msg || '';
    }

    auth.getRedirectResult().then(function (result) {
      if (result.user) return finishWithUser(result.user);
      if (auth.currentUser) return finishWithUser(auth.currentUser);
    }).catch(function (e) {
      setStatus(e.message || String(e));
    });

    document.getElementById('btn').addEventListener('click', function () {
      setStatus('Opening Google…');
      const provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithRedirect(provider).catch(function (e) {
        setStatus(e.message || String(e));
      });
    });
  </script>
</body>
</html>`;
}
