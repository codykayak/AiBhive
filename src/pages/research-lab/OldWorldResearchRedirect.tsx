import { Navigate, useLocation } from 'react-router-dom';

/** Preserve old /old-world-research URLs after Research Lab rename */
export default function OldWorldResearchRedirect() {
  const { pathname, search, hash } = useLocation();
  const next = pathname.replace(/^\/old-world-research/, '/research-lab') + search + hash;
  return <Navigate to={next} replace />;
}
