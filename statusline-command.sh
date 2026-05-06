#!/bin/bash
node -e "
const input = JSON.parse(require('fs').readFileSync(0, 'utf8'));
const ctx = input.context_window || {};
const modelId = input.model?.id || '';

// Real context window sizes by model family
let realWindow = 200000;
const id = modelId.toLowerCase();
if (id.includes('opus'))       realWindow = 1000000;
else if (id.includes('sonnet')) realWindow = 1000000;
else if (id.includes('haiku'))  realWindow = 200000;

const totalIn = ctx.total_input_tokens || 0;
const totalOut = ctx.total_output_tokens || 0;
const total = totalIn + totalOut;

let pct, label;
if (total >= realWindow) {
  const fills = (total / realWindow).toFixed(1);
  pct = 100;
  label = fills + 'x compressed';
} else {
  pct = Math.round(total / realWindow * 100);
  label = pct + '%';
}

const barLen = 20;
const filled = Math.round(Math.min(100, pct) / 100 * barLen);
const bar = '█'.repeat(filled) + '░'.repeat(barLen - filled);

let color;
if (pct >= 85) color = '\x1b[31m';
else if (pct >= 60) color = '\x1b[33m';
else color = '\x1b[32m';

const shortModel = modelId.replace('claude-', '').replace(/-\d{8}$/, '');

// Sync context percent to context.json for the popup
try {
  const ctxPath = require('path').join(require('os').homedir(), '.claude', 'context.json');
  require('fs').writeFileSync(ctxPath, JSON.stringify({ percent: pct, inputTokens: totalIn, ts: Date.now() }));
} catch {}

process.stdout.write(shortModel + ' ' + color + '[' + bar + ']\x1b[0m ' + label);
"
