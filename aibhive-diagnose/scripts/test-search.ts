import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseDiagnosis } from '../lib/diagnose/parseDiagnosis';
import {
  buildGreetingReply,
  buildOfflineReply,
  isEquipmentProbeOnly,
  isMetaAppQuestion,
  buildMetaAppReply,
} from '../lib/diagnose/offlineConversation';
import { detectEquipment, searchFaults } from '../lib/knowledge/search';

describe('searchFaults equipment disambiguation', () => {
  it('keeps dishwasher queries on dishwasher faults', () => {
    const hits = searchFaults('dishwasher won’t drain standing water', 'property');
    assert.ok(hits.length > 0, 'expected dishwasher hits');
    assert.ok(
      hits[0]!.id.includes('dishwasher') || hits[0]!.title.toLowerCase().includes('dishwasher'),
      `unexpected top hit ${hits[0]!.id}`
    );
    assert.ok(!hits[0]!.id.startsWith('prop-washer'), 'should not rank laundry washer first');
  });

  it('ranks washer drain for laundry wording', () => {
    const hits = searchFaults('washing machine will not drain standing water in drum', 'property');
    assert.ok(hits.length > 0);
    assert.ok(hits[0]!.id.includes('washer'), `unexpected ${hits[0]!.id}`);
  });

  it('detects dishwasher equipment tokens', () => {
    const eq = detectEquipment('My dishwasher leaked under the door');
    assert.ok(eq.includes('dishwasher'));
  });

  it('matches bathtub not draining to tub/shower plumbing — not dishwasher', () => {
    const hits = searchFaults('bathtub not draining', 'property');
    assert.ok(hits.length > 0, 'expected bathtub/plumbing hits');
    assert.ok(
      hits[0]!.id.includes('shower-tub') ||
        hits[0]!.title.toLowerCase().includes('tub') ||
        hits[0]!.packId === 'plumbing',
      `unexpected top hit ${hits[0]!.id} (${hits[0]!.title})`
    );
    assert.ok(!hits[0]!.id.includes('dishwasher'), 'must not return dishwasher for bathtub');
  });

  it('detects plumbing equipment from bathtub wording', () => {
    const eq = detectEquipment('bathtub not draining');
    assert.ok(eq.includes('plumbing'), `expected plumbing, got ${eq.join(',')}`);
  });

  it('finds pool pump no prime', () => {
    const hits = searchFaults('pump humming air in basket no prime', 'pool');
    assert.ok(hits.some((h) => h.id.includes('pump')));
  });

  it('returns no fault hits for bare greeting hi', () => {
    assert.equal(searchFaults('hi', 'property').length, 0);
    assert.equal(searchFaults('hi', 'hvac').length, 0);
  });

  it('ranks sink topics ahead of tub/shower for bare sink query', () => {
    const hits = searchFaults('sink slow drain', 'property');
    assert.ok(hits.length > 0, 'expected sink-related hits');
    assert.ok(
      hits[0]!.id.includes('kitchen') ||
        hits[0]!.id.includes('under-sink') ||
        hits[0]!.title.toLowerCase().includes('sink'),
      `unexpected top hit ${hits[0]!.id} (${hits[0]!.title})`
    );
    assert.ok(!hits[0]!.id.includes('shower-tub'), 'must not rank tub/shower first for sink');
  });

  it('offline greeting hi responds with hello', () => {
    assert.match(buildGreetingReply('hi'), /hello/i);
    const offline = buildOfflineReply(
      { id: 'property', shortName: 'Property', name: 'Property' } as never,
      'hi',
      false
    );
    assert.ok(offline);
    assert.match(offline!.reply, /hello/i);
  });

  it('bare sink returns related topics not a full tub playbook', () => {
    assert.ok(isEquipmentProbeOnly('sink'));
    assert.ok(isEquipmentProbeOnly('kitchen sink'));
    assert.ok(!isEquipmentProbeOnly('sink slow drain'));
    const offline = buildOfflineReply(
      { id: 'property', shortName: 'Property', name: 'Property Maintenance' } as never,
      'sink',
      false
    );
    assert.ok(offline);
    assert.match(offline!.reply, /toilet/i);
    assert.doesNotMatch(offline!.reply, /shower or tub drain slow/i);
  });

  it('meta question Is AI live now does not match washer faults', () => {
    assert.ok(isMetaAppQuestion('Is AI live now?'));
    assert.equal(searchFaults('Is AI live now?', 'property').length, 0);
    const offline = buildOfflineReply(
      { id: 'property', shortName: 'Property', name: 'Property' } as never,
      'Is AI live now?',
      false,
      { offline: true }
    );
    assert.ok(offline);
    assert.match(offline!.reply, /offline|pack/i);
    assert.doesNotMatch(offline!.reply, /washer/i);
  });

  it('meta reply when ai configured', () => {
    assert.match(buildMetaAppReply({ aiConfigured: true, aiEnabled: true }), /live/i);
  });
});

describe('parseDiagnosis', () => {
  it('parses structured markdown into checkbox sections', () => {
    const result = parseDiagnosis(`**Quick summary**
Pump has lost prime after backwash.

**Likely causes**
- Loose lid o-ring
- Low water in basket

**Step-by-step checks**
1. Fill basket and seal lid
2. Check suction side unions for air

**Safety notes**
- Lock out pump power before opening strainer

**Parts / tools**
- Lid o-ring
- PTFE tape`);

    assert.ok(result);
    assert.match(result!.summary, /lost prime/i);
    assert.equal(result!.likelyCauses.length, 2);
    assert.equal(result!.steps.length, 2);
    assert.equal(result!.safetyNotes.length, 1);
    assert.equal(result!.partsToCheck.length, 2);
  });

  it('returns null for unstructured short replies', () => {
    assert.equal(parseDiagnosis('Try cleaning the filter.'), null);
  });
});
