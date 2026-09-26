import catalog from '../../content/rv-camping-world-demo.json';

export type RvDemoUnit = (typeof catalog.units)[number];

export const RV_DEMO_CATALOG = catalog;
export const RV_DEMO_UNITS: RvDemoUnit[] = catalog.units;
export const RV_DEMO_PARTNER = catalog.partnerName;
export const RV_DEMO_DISCLAIMER = catalog.disclaimer;

export function rvUnitById(id: string): RvDemoUnit | undefined {
  return RV_DEMO_UNITS.find((u) => u.id === id);
}

export function formatRvCategory(category: string): string {
  const map: Record<string, string> = {
    'travel-trailer': 'Travel trailer',
    'fifth-wheel': 'Fifth wheel',
    'class-c': 'Class C',
    'class-a': 'Class A',
  };
  return map[category] || category;
}
