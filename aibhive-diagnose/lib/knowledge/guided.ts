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
  {
    id: 'prop-washer-drain',
    packId: 'property',
    title: 'Washer won’t drain',
    description: 'Coin trap → hose → pump → door lock.',
    startStepId: 'standing',
    steps: {
      standing: {
        id: 'standing',
        prompt: 'Is there standing water in the drum?',
        yesNext: 'filter',
        noNext: 'spin',
      },
      filter: {
        id: 'filter',
        prompt: 'After cleaning the pump filter / coin trap, does it drain?',
        yesNext: 'result-filter',
        noNext: 'hose',
      },
      hose: {
        id: 'hose',
        prompt: 'Is the drain hose kinked or pushed too far into a sealed standpipe?',
        yesNext: 'result-hose',
        noNext: 'result-pump',
      },
      spin: {
        id: 'spin',
        prompt: 'Does it drain but refuse to spin?',
        yesNext: 'result-spin',
        noNext: 'result-filter',
      },
      'result-filter': { id: 'result-filter', prompt: '', resultFaultId: 'prop-washer-no-drain' },
      'result-hose': { id: 'result-hose', prompt: '', resultFaultId: 'prop-washer-no-drain' },
      'result-pump': { id: 'result-pump', prompt: '', resultFaultId: 'prop-washer-no-drain' },
      'result-spin': { id: 'result-spin', prompt: '', resultFaultId: 'prop-washer-no-spin' },
    },
  },
  {
    id: 'prop-dryer-heat',
    packId: 'property',
    title: 'Dryer no heat',
    description: '240V → vent → fuse → element / gas path.',
    startStepId: 'power',
    steps: {
      power: {
        id: 'power',
        prompt: 'Does the drum tumble normally?',
        yesNext: 'fuel',
        noNext: 'result-power',
      },
      fuel: {
        id: 'fuel',
        prompt: 'Is this an electric dryer (240V) rather than gas?',
        yesNext: 'vent',
        noNext: 'result-gas',
      },
      vent: {
        id: 'vent',
        prompt: 'Is the exterior vent blowing strongly with little lint restriction?',
        yesNext: 'result-fuse',
        noNext: 'result-vent',
      },
      'result-power': { id: 'result-power', prompt: '', resultFaultId: 'prop-dryer-no-heat' },
      'result-gas': { id: 'result-gas', prompt: '', resultFaultId: 'prop-dryer-gas-no-heat' },
      'result-vent': { id: 'result-vent', prompt: '', resultFaultId: 'prop-dryer-no-heat' },
      'result-fuse': { id: 'result-fuse', prompt: '', resultFaultId: 'prop-dryer-no-heat' },
    },
  },
];

export function getGuidedFlows(packId?: import('../packs/types').TradePackId) {
  return packId ? guidedFlows.filter((f) => f.packId === packId) : guidedFlows;
}

export function getGuidedFlow(id: string) {
  return guidedFlows.find((f) => f.id === id);
}
