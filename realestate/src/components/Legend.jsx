import { ZONE_COLORS, ZONE_DESCRIPTIONS } from '../constants/zoning';
import styles from './Legend.module.css';

const GROUPS = [
  {
    label: 'Residential',
    codes: ['R-1', 'R-1.5', 'R-2', 'R-3', 'R-4'],
  },
  {
    label: 'Commercial',
    codes: ['C-1', 'C-2', 'C-3', 'GO'],
  },
  {
    label: 'Employment / Industrial',
    codes: ['E-1', 'E-2', 'I-2', 'I-3'],
  },
  {
    label: 'Other',
    codes: ['PL', 'NR', 'PRO', 'AG'],
  },
];

export default function Legend({ visible }) {
  if (!visible) return null;

  return (
    <div className={styles.legend}>
      <h3 className={styles.title}>Base Zones</h3>
      {GROUPS.map((group) => (
        <div key={group.label} className={styles.group}>
          <p className={styles.groupLabel}>{group.label}</p>
          {group.codes.map((code) => (
            <div key={code} className={styles.item}>
              <span
                className={styles.swatch}
                style={{ background: ZONE_COLORS[code] ?? '#444' }}
              />
              <span className={styles.code}>{code}</span>
              <span className={styles.desc}>{ZONE_DESCRIPTIONS[code]}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
