import type { PlantCategory, PlantEntry, PlantUse } from './types';

export function useLabel(u: PlantUse): string {
  if (u === 'both') return 'Edible & Medicinal';
  if (u === 'edible') return 'Edible';
  if (u === 'medicinal') return 'Medicinal';
  return 'Hallucinogenic';
}

export function useBadgeClass(u: PlantUse): string {
  if (u === 'both') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  if (u === 'edible') return 'bg-lime-500/20 text-lime-300 border-lime-500/30';
  if (u === 'medicinal') return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
  return 'bg-violet-500/20 text-violet-300 border-violet-500/30';
}

export function categoryLabel(c: PlantCategory): string {
  if (c === 'mushroom') return 'Mushroom';
  if (c === 'lichen') return 'Lichen';
  if (c === 'seaweed') return 'Seaweed';
  if (c === 'berry') return 'Berry';
  if (c === 'fern') return 'Fern';
  if (c === 'shrub') return 'Shrub';
  if (c === 'tree') return 'Tree';
  return 'Herb';
}

export function categoryBadgeClass(c: PlantCategory): string {
  if (c === 'mushroom') return 'bg-amber-500/20 text-amber-300 border-amber-500/35';
  if (c === 'lichen') return 'bg-stone-500/20 text-stone-300 border-stone-500/35';
  if (c === 'seaweed') return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/35';
  if (c === 'berry') return 'bg-rose-500/20 text-rose-300 border-rose-500/35';
  if (c === 'fern') return 'bg-green-500/20 text-green-300 border-green-500/35';
  if (c === 'shrub') return 'bg-orange-500/20 text-orange-300 border-orange-500/35';
  if (c === 'tree') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35';
  return 'bg-lime-500/20 text-lime-300 border-lime-500/35';
}

export function PlantCategoryBadges({ plant, className = '' }: { plant: PlantEntry; className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <span
        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${categoryBadgeClass(plant.category)}`}
      >
        {categoryLabel(plant.category)}
      </span>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${useBadgeClass(plant.uses)}`}>
        {useLabel(plant.uses)}
      </span>
    </div>
  );
}
