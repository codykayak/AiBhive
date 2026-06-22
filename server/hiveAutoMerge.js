/**
 * Auto-merge the PR the Cursor build agent opened, so that:
 *   1. The user does not need to click anything.
 *   2. The on-push CI (.github/workflows/auto-deploy.yml) immediately ships
 *      an EAS Update + a fresh APK + a Firebase .gz mirror.
 *
 * Requires HIVE_GITHUB_TOKEN with `repo` scope (PAT or fine-grained token
 * scoped to codykayak/AiBhive with contents + pull-requests + workflows write).
 * If the token is missing we no-op so the rest of the loop still works.
 */

const GITHUB_API = 'https://api.github.com';

function authHeader() {
  const token = process.env.HIVE_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) return null;
  return `Bearer ${token}`;
}

function parsePrUrl(prUrl) {
  // https://github.com/<owner>/<repo>/pull/<number>
  const m = /https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/.exec(prUrl || '');
  if (!m) return null;
  return { owner: m[1], repo: m[2], number: Number(m[3]) };
}

async function githubFetch(path, init = {}) {
  const auth = authHeader();
  if (!auth) throw new Error('HIVE_GITHUB_TOKEN not configured');
  const res = await fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      Authorization: auth,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'aibhive-orchestrator',
      ...(init.headers || {}),
    },
  });
  return res;
}

/**
 * Wait briefly for the PR to be "mergeable=true" — GitHub computes it async.
 */
async function waitForMergeable({ owner, repo, number }, { tries = 6, delayMs = 5000 } = {}) {
  for (let i = 0; i < tries; i += 1) {
    const res = await githubFetch(`/repos/${owner}/${repo}/pulls/${number}`);
    if (!res.ok) {
      return { ok: false, reason: `github_${res.status}` };
    }
    const pr = await res.json();
    if (pr.state !== 'open') {
      return { ok: false, reason: `pr_${pr.state}`, pr };
    }
    if (typeof pr.mergeable === 'boolean') {
      return { ok: pr.mergeable, reason: pr.mergeable ? 'ok' : 'has_conflicts', pr };
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return { ok: false, reason: 'mergeable_unknown_timeout' };
}

/**
 * Best-effort: mark the PR ready for review if it is currently a draft.
 * Required because draft PRs cannot be merged via the API.
 */
async function markReady({ owner, repo, number }) {
  // The "Mark PR ready for review" API uses the GraphQL endpoint or
  // PATCH /repos/:owner/:repo/pulls/:number with draft=false (preview).
  // We use the REST patch which is supported on classic+fine-grained tokens.
  const res = await githubFetch(`/repos/${owner}/${repo}/pulls/${number}`, {
    method: 'PATCH',
    body: JSON.stringify({ draft: false }),
  });
  return res.ok;
}

/**
 * @param {{ prUrl: string, taskId: string, method?: 'squash' | 'merge' | 'rebase' }} args
 */
export async function autoMergeTaskPullRequest({ prUrl, taskId, method }) {
  const parsed = parsePrUrl(prUrl);
  if (!parsed) return { merged: false, reason: 'invalid_pr_url' };
  if (!authHeader()) return { merged: false, reason: 'no_token' };

  // Make sure the PR is not still in draft state.
  try {
    await markReady(parsed);
  } catch {
    // non-fatal
  }

  const wait = await waitForMergeable(parsed);
  if (!wait.ok) {
    return { merged: false, reason: wait.reason, prState: wait.pr?.state };
  }

  const mergeMethod = method || process.env.HIVE_MERGE_METHOD || 'squash';
  const res = await githubFetch(`/repos/${parsed.owner}/${parsed.repo}/pulls/${parsed.number}/merge`, {
    method: 'PUT',
    body: JSON.stringify({
      commit_title: `hive: auto-merge task ${taskId} (PR #${parsed.number})`,
      commit_message: 'Auto-merged by the Hive orchestrator after Cursor build completed.',
      merge_method: mergeMethod,
    }),
  });

  if (res.status === 200) {
    const data = await res.json();
    return { merged: true, sha: data.sha, method: mergeMethod };
  }

  let errText = '';
  try {
    errText = JSON.stringify(await res.json());
  } catch {
    errText = await res.text();
  }
  return { merged: false, reason: `merge_${res.status}`, detail: errText.slice(0, 240) };
}

export function isAutoMergeConfigured() {
  return !!authHeader();
}
