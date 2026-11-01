const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync(`${__dirname}/../src/lib/api.ts`, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;

function harness(count, stalled = false) {
  let active = 0, peak = 0, completed = false;
  const transfers = [];
  class XHR {
    constructor() { this.events = {}; this.progress = () => {}; this.upload = { addEventListener: (_, f) => { this.progress = f; } }; transfers.push(this); }
    addEventListener(name, fn) { this.events[name] = fn; }
    open() {}
    setRequestHeader() {}
    send() {
      active++; peak = Math.max(peak, active);
      if (!stalled) setImmediate(() => {
        this.progress({ lengthComputable: true, loaded: 5, total: 10 });
        active--; this.status = 200; this.events.load(); this.events.loadend();
      });
    }
    abort() { active--; this.events.abort(); this.events.loadend(); }
  }
  const context = { exports: {}, require: () => ({ config: { apiUrl: '' } }), XMLHttpRequest: XHR,
    DOMException, AbortController, FormData, URLSearchParams,
    fetch: async (url) => {
      if (url.endsWith('/complete')) { completed = true; return { ok: true, json: async () => ({ code: 'TEST-CODE' }) }; }
      return { ok: true, json: async () => ({ direct_upload_supported: true, upload_urls: Array.from({ length: count }, () => ({ upload_url: 'storage' })) }) };
    },
  };
  vm.runInNewContext(source, context);
  return { api: context.exports, transfers, peak: () => peak, completed: () => completed };
}

test('mixed batch uses at most four transfers and reports aggregate bytes', async () => {
  const h = harness(20), progress = [];
  const files = Array.from({ length: 20 }, (_, i) => ({ name: `${i}.txt`, size: 10, type: 'text/plain' }));
  await h.api.uploadFiles(files, 'test@example.com', (pct, bytes) => progress.push([pct, bytes]));
  assert.equal(h.peak(), 4);
  assert.equal(h.transfers.length, 20);
  assert.deepEqual(progress.at(-1), [100, 200]);
  assert.ok(progress.every((p, i) => i === 0 || p[1] >= progress[i - 1][1]));
  assert.equal(h.completed(), true);
});

test('cancellation stops active transfers and never starts queued files or finalization', async () => {
  const h = harness(20, true), controller = new AbortController();
  const task = h.api.uploadFiles(Array.from({ length: 20 }, () => ({ name: 'a', size: 10 })), 'test@example.com', () => {}, controller.signal);
  await new Promise(setImmediate);
  controller.abort();
  await assert.rejects(task, error => error.name === 'AbortError');
  assert.equal(h.transfers.length, 4);
  assert.equal(h.completed(), false);
});
