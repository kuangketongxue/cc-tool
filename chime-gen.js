#!/usr/bin/env node
// 生成 chime.wav 提示音（两音阶上升，清脆）
const fs = require('fs')
const path = require('path')

const SR = 44100
const DUR = 0.45
const N = Math.floor(SR * DUR)

const samples = new Float64Array(N)
for (let i = 0; i < N; i++) {
  const t = i / SR
  // 880Hz 基频 + 1320Hz 泛音（纯五度），快速衰减
  const env = Math.exp(-t * 8) * 0.5
  samples[i] = env * (Math.sin(2 * Math.PI * 880 * t) + 0.3 * Math.sin(2 * Math.PI * 1320 * t))
}

const wav = Buffer.alloc(44 + N * 2)
wav.write('RIFF', 0)
wav.writeUInt32LE(36 + N * 2, 4)
wav.write('WAVE', 8)
wav.write('fmt ', 12)
wav.writeUInt32LE(16, 16)
wav.writeUInt16LE(1, 20)       // PCM
wav.writeUInt16LE(1, 22)       // mono
wav.writeUInt32LE(SR, 24)      // sample rate
wav.writeUInt32LE(SR * 2, 28)  // byte rate
wav.writeUInt16LE(2, 32)       // block align
wav.writeUInt16LE(16, 34)      // bits per sample
wav.write('data', 36)
wav.writeUInt32LE(N * 2, 40)

for (let i = 0; i < N; i++) {
  const v = Math.max(-1, Math.min(1, samples[i]))
  wav.writeInt16LE(Math.round(v * 32767), 44 + i * 2)
}

const outFile = path.join(__dirname, 'chime.wav')
fs.writeFileSync(outFile, wav)
console.log(`Generated ${outFile} (${wav.length} bytes)`)
