import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getPatchIdComment } from '../util/patches.ts';
import { patchConfig } from './signal.ts';

const patchTransform = patchConfig.transforms[0]!;

await test('Patch supported Signal bundles', () => {
  const content =
    'const handler=(0,sr.useCallback)(()=>{Ir(!1),Kr.current&&Kr.current.submit()},[Kr,Ir]),next=1;';
  const patched = patchTransform.transform(content);

  assert.equal(patched.includes('$4'), false);
  assert.ok(patched.includes('Kr.current?.focus()'));
  assert.ok(patched.includes(getPatchIdComment(patchTransform.id)));
});

await test('Do not patch unsupported Signal bundles', () => {
  assert.throws(() => patchTransform.transform('unsupported bundle'), {
    message: /Failed to match patch search pattern/,
  });
});
