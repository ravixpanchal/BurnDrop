const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const code = ts.transpileModule(
  fs.readFileSync(`${__dirname}/../src/components/RetrieveForm.tsx`, 'utf8') + '\nexport { FileReadyView };',
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 } },
).outputText;
const context = { exports: {}, require: name => {
  if (name === '@/lib/api') return {};
  if (name === '@/lib/config') return {
    formatExpiryCountdown: () => 'Expired', formatBytes: () => '1 KB', getFileExtension: () => 'PDF',
  };
  return require(name);
} };
vm.runInNewContext(code, context);

test('browser expiry estimate cannot block server-authorized download or preview', () => {
  const html = renderToStaticMarkup(React.createElement(context.exports.FileReadyView, {
    data: { expires_at: '2000-01-01T00:00:00', filename: 'test.pdf', size_bytes: 1000,
      access_token: 'fixture', files: [{ id: 'test', filename: 'test.pdf', size_bytes: 1000, can_preview: true }] },
    onError() {}, onBack() {},
  }));
  assert.ok(html.includes('Try downloading to check with the server'));
  assert.ok(html.includes('Download file'));
  assert.ok(!html.includes('disabled=""'));
});
