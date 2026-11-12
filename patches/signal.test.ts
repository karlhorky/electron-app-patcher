import assert from 'node:assert/strict';
import { test } from 'node:test';
import { patchConfig } from './signal.ts';

const transform = patchConfig.transforms[0]!.transform;

await test('Apply the Signal patch once and return unchanged content on repeat runs', () => {
  const content =
    'const handler=(0,sr.useCallback)(()=>{Ir(!1),Kr.current&&Kr.current.submit()},[Kr,Ir]),next=1;';
  const patched = transform(content);

  assert.notEqual(patched, content);
  assert.equal(patched.includes('$4'), false);
  assert.ok(patched.includes('Kr.current?.focus()'));
  assert.equal(transform(patched), patched);
});

await test('Reject unsupported Signal bundles', () => {
  assert.throws(() => transform('unsupported bundle'), {
    message: /Failed to match patch search pattern/,
  });
});

await test('Reject an incomplete Signal patch comment', () => {
  assert.throws(
    () =>
      transform(
        '// Patch to focus message composition input when key is pressed',
      ),
    { message: /Failed to match patch search pattern/ },
  );
});
