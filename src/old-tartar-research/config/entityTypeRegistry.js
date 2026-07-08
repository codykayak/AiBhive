/**
 * Extensible entity type registry — add new types without schema migrations.
 */

export const ENTITY_TYPES = [
  { id: 'builder', label: 'Builder', icon: 'hammer', roles: ['builder', 'contractor', 'mason'] },
  { id: 'architect', label: 'Architect', icon: 'blueprint', roles: ['architect', 'designer'] },
  { id: 'engineer', label: 'Engineer', icon: 'gear', roles: ['engineer', 'civil engineer', 'structural engineer'] },
  { id: 'author', label: 'Author', icon: 'book', roles: ['author', 'writer', 'historian'] },
  { id: 'publisher', label: 'Publisher', icon: 'press', roles: ['publisher', 'printer', 'editor'] },
  { id: 'organization', label: 'Organization', icon: 'building', roles: ['company', 'firm', 'society', 'guild'] },
  { id: 'contractor', label: 'Contractor', icon: 'wrench', roles: ['contractor', 'construction company'] },
  { id: 'cartographer', label: 'Cartographer', icon: 'map', roles: ['cartographer', 'mapmaker', 'surveyor'] },
  { id: 'other', label: 'Other', icon: 'person', roles: [] },
];

export function getEntityType(id) {
  return ENTITY_TYPES.find((t) => t.id === id) ?? ENTITY_TYPES.find((t) => t.id === 'other');
}

export function matchRoleToType(role) {
  const r = String(role ?? '').toLowerCase().trim();
  if (!r) return 'other';
  for (const et of ENTITY_TYPES) {
    if (et.roles.some((roleLabel) => r.includes(roleLabel))) return et.id;
  }
  return 'other';
}
