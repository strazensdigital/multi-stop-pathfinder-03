import type { Plan } from '../hooks/useAuth';

export function canUse(feature: 'address_lock'|'stops_over_9'|'export_gmaps'|'csv_import'|'save_route', plan: Plan) {
  const map = {
    address_lock: ['pro','team'],
    stops_over_9: ['pro','team'],
    export_gmaps: ['free','pro','team'],
    csv_import: ['free','pro','team'],
    save_route: ['pro','team'] // when you ship saving
  } as const;
  return map[feature].includes(plan);
}
