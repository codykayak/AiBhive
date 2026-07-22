import { MessageCircle } from 'lucide-react';
import { openLivingKnowledgeAsk } from '../../../lib/oregonPlantMedicine/livingKnowledgeAsk';

type Props = {
  className?: string;
};

/** Plants-app Ask Bhive — opens the Living Knowledge AI box, not site-wide Bhive Builder. */
export default function LivingKnowledgeAskFab({ className = '' }: Props) {
  return (
    <button
      type="button"
      onClick={() => openLivingKnowledgeAsk()}
      className={`fixed bottom-5 right-5 z-[45] inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-4 py-3 shadow-lg shadow-emerald-950/40 border border-emerald-400/30 transition-colors ${className}`}
      aria-label="Ask Bhive"
    >
      <MessageCircle className="w-5 h-5" />
      <span>Ask Bhive</span>
    </button>
  );
}
