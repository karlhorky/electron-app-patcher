import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getPatchMarker } from '../getPatchMarker.ts';
import { patchConfig } from './signal.ts';

const { id, transform } = patchConfig.transforms[0]!;

await test('Insert the configured Signal patch ID beside the applied code', () => {
  const content =
    'const handler=(0,sr.useCallback)(()=>{Ir(!1),Kr.current&&Kr.current.submit()},[Kr,Ir]),next=1;';
  const patched = transform(content, id);

  assert.notEqual(patched, content);
  assert.equal(patched.includes('$4'), false);
  assert.ok(patched.includes('Kr.current?.focus()'));
  assert.ok(patched.includes(getPatchMarker(id)));
});

await test('Reject unsupported Signal bundles', () => {
  assert.throws(() => transform('unsupported bundle', id), {
    message: /Failed to match patch search pattern/,
  });
});

await test('Reject an incomplete Signal patch comment', () => {
  assert.throws(
    () =>
      transform(
        '// Patch to focus message composition input when key is pressed',
        id,
      ),
    { message: /Failed to match patch search pattern/ },
  );
});
