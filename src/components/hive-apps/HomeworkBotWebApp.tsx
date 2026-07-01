import { HomeworkWorkspace } from '../../pages/Homework';

/** Public Homework Bot — per-user RAG library with credit-gated OCR and Grok completion. */
export default function HomeworkBotWebApp({ expanded }: { expanded?: boolean }) {
  return (
    <div className={expanded ? '' : 'px-4 sm:px-6 lg:px-8 py-6'}>
      <HomeworkWorkspace variant="public" />
    </div>
  );
}
