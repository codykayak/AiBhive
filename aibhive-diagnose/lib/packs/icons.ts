import { Cable, Droplets, Waves, Wind, Wrench, Zap } from 'lucide-react-native';
import type { ComponentType } from 'react';
import type { TradePack } from '@/lib/packs';

type IconProps = { color: string; size: number; strokeWidth?: number };

export function packIconComponent(pack: TradePack): ComponentType<IconProps> {
  if (pack.icon === 'waves') return Waves;
  if (pack.icon === 'droplets') return Droplets;
  if (pack.icon === 'wind') return Wind;
  if (pack.icon === 'cable') return Cable;
  if (pack.icon === 'wrench') return Wrench;
  return Zap;
}
