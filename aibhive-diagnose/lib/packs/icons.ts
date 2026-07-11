import { Waves, Wrench, Zap } from 'lucide-react-native';
import type { ComponentType } from 'react';
import type { TradePack } from '@/lib/packs';

type IconProps = { color: string; size: number; strokeWidth?: number };

export function packIconComponent(pack: TradePack): ComponentType<IconProps> {
  if (pack.icon === 'waves') return Waves;
  if (pack.icon === 'wrench') return Wrench;
  return Zap;
}
