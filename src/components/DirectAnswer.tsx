/** One-sentence definition block for AI crawlers and quick human scanning. */
export default function DirectAnswer({ children }: { children: string }) {
  return (
    <p className="text-base md:text-lg text-slate-300 leading-relaxed border-l-4 border-bee-amber/60 pl-4 py-1 mb-6 max-w-3xl">
      <strong className="text-white font-semibold">Direct answer: </strong>
      {children}
    </p>
  );
}
