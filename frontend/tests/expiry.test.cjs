const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync(`${__dirname}/../src/lib/config.ts`, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const now = Date.parse('2026-11-01T12:00:00Z');
class Clock extends Date { static now() { return now; } }
const context = { exports: {}, process, Date: Clock };
vm.runInNewContext(source, context);
const countdown = context.exports.formatExpiryCountdown;

test('UTC expiry is identical with missing timezone, Z, or explicit offset', () => {
  assert.equal(countdown('2026-11-01T15:00:00'), '03:00:00');
  assert.equal(countdown('2026-11-01T15:00:00Z'), '03:00:00');
  assert.equal(countdown('2026-11-01T15:00:00+00:00'), '03:00:00');
  assert.equal(countdown('2026-11-01T20:30:00+05:30'), '03:00:00');
});
test('expired shares and invalid timestamps are handled separately', () => {
  assert.equal(countdown('2026-11-01T11:59:59'), 'Expired');
  assert.equal(countdown('invalid'), 'Unavailable');
});
