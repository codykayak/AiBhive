import type { GuidedFlow } from './types';

export const guidedFlows: GuidedFlow[] = [
  {
    id: 'pool-no-flow',
    packId: 'pool',
    title: 'No flow / weak returns',
    description: 'Guided triage from pump basket to filter to returns.',
    startStepId: 'power',
    steps: {
      power: {
        id: 'power',
        prompt: 'Is the pump powered and trying to run (hum, display on, shaft attempting)?',
        yesNext: 'basket',
        noNext: 'result-power',
      },
      basket: {
        id: 'basket',
        prompt: 'Is the pump basket full of water with the lid sealed and minimal air bubbles?',
        yesNext: 'pressure',
        noNext: 'result-prime',
      },
      pressure: {
        id: 'pressure',
        prompt: 'Is filter pressure high vs the clean baseline?',
        yesNext: 'result-filter',
        noNext: 'result-suction',
      },
      'result-power': { id: 'result-power', prompt: '', resultFaultId: 'pool-pump-hum-no-spin' },
      'result-prime': { id: 'result-prime', prompt: '', resultFaultId: 'pool-pump-no-prime' },
      'result-filter': { id: 'result-filter', prompt: '', resultFaultId: 'pool-filter-high-pressure' },
      'result-suction': { id: 'result-suction', prompt: '', resultFaultId: 'pool-pump-no-prime' },
    },
  },
  {
    id: 'elec-trip',
    packId: 'electrical',
    title: 'Breaker keeps tripping',
    description: 'Separate overload, short, GFCI, and weak breaker paths.',
    startStepId: 'immediate',
    steps: {
      immediate: {
        id: 'immediate',
        prompt: 'Does it trip instantly with all loads unplugged/off?',
        yesNext: 'result-short',
        noNext: 'gfci',
      },
      gfci: {
        id: 'gfci',
        prompt: 'Is it a GFCI/AFCI device, or is there an upstream GFCI involved?',
        yesNext: 'result-gfci',
        noNext: 'onload',
      },
      onload: {
        id: 'onload',
        prompt: 'Does it only trip when a motor/compressor/heater starts?',
        yesNext: 'result-inrush',
        noNext: 'result-nuisance',
      },
      'result-short': { id: 'result-short', prompt: '', resultFaultId: 'elec-breaker-nuisance' },
      'result-gfci': { id: 'result-gfci', prompt: '', resultFaultId: 'elec-gfci-wont-reset' },
      'result-inrush': { id: 'result-inrush', prompt: '', resultFaultId: 'elec-motor-wont-start' },
      'result-nuisance': { id: 'result-nuisance', prompt: '', resultFaultId: 'elec-breaker-nuisance' },
    },
  },
];

export function getGuidedFlows(packId?: 'pool' | 'electrical') {
  return packId ? guidedFlows.filter((f) => f.packId === packId) : guidedFlows;
}

export function getGuidedFlow(id: string) {
  return guidedFlows.find((f) => f.id === id);
}
