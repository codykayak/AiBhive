/** Admin / owner emails — free Hive builds when signed in (beta testing). */
const DEFAULT_FREE_BUILD_EMAILS = [
  'codykayak@gmail.com',
  'test@test.com',
  'admin@aibhive.com',
];

function getFreeBuildEmails() {
  const fromEnv = process.env.HIVE_FREE_BUILD_EMAILS || process.env.ADMIN_EMAILS;
  const parsed = fromEnv
    ? fromEnv.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
    : [];
  return [...new Set([...DEFAULT_FREE_BUILD_EMAILS.map((e) => e.toLowerCase()), ...parsed])];
}

const FREE_BUILD_EMAILS = getFreeBuildEmails();

export function isHiveFreeBuildEmail(email) {
  return Boolean(email && FREE_BUILD_EMAILS.includes(email.toLowerCase()));
}
