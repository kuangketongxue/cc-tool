#!/usr/bin/env node
// 由 Notification / Stop hook 调用
// 功能：提示音 chime.wav + Windows 系统通知弹窗 + TTS 语音
// 弹一下就消失，不挂常驻窗口

const { spawnSync } = require('child_process')
const path = require('path')
const fs = require('fs')

// 读 stdin
let input = ''
try { input = fs.readFileSync(0, 'utf8') } catch {}
let data = {}
try { data = JSON.parse(input) } catch { process.exit(0) }

const hookEvent = data.hook_event_name || ''
const isStop = hookEvent === 'Stop'
const type = isStop ? 'stop' : 'notify'

const voiceDir = path.join(__dirname, 'voices')
const chimeFile = path.join(__dirname, 'chime.wav')

// 列出对应类型的语音文件（过滤 0 字节）
let files = []
try {
  files = fs.readdirSync(voiceDir)
    .filter(f => f.startsWith(type + '-'))
    .filter(f => {
      try { return fs.statSync(path.join(voiceDir, f)).size > 0 } catch { return false }
    })
} catch {}

// Windows 系统通知弹窗 + 提示音
const title = isStop ? 'Claude Code' : 'Claude Code 需要确认'
const message = isStop ? '任务完成' : '等待你的回复'
const chimePath = chimeFile.replace(/\\/g, '\\\\')

const ps = `
# 提示音
if (Test-Path '${chimePath}') {
  Add-Type -AssemblyName System.Media
  $snd = New-Object System.Media.SoundPlayer('${chimePath}')
  $snd.PlaySync()
}

# 系统通知弹窗
Add-Type -AssemblyName System.Windows.Forms
$notify = New-Object System.Windows.Forms.NotifyIcon
$notify.Icon = [System.Drawing.SystemIcons]::Information
$notify.Visible = $true
$notify.ShowBalloonTip(3000, '${title}', '${message}', [System.Windows.Forms.ToolTipIcon]::Info)
Start-Sleep -Seconds 4
$notify.Dispose()
`

spawnSync('powershell', [
  '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps
], { timeout: 10000, windowsHide: true })

// TTS 语音
if (!files.length) process.exit(0)

const file = files[Math.floor(Math.random() * files.length)]
const outFile = path.join(voiceDir, file)
const psPath = outFile.replace(/\\/g, '\\\\')
const psTTS = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Audio {
    [DllImport("winmm.dll")]
    public static extern int mciSendString(string command, string buffer, int bufferSize, IntPtr callback);
}
"@
[Audio]::mciSendString("open \\"${psPath}\\" type mpegvideo alias mp3", $null, 0, [IntPtr]::Zero)
[Audio]::mciSendString("play mp3", $null, 0, [IntPtr]::Zero)
Start-Sleep -Seconds 5
[Audio]::mciSendString("close mp3", $null, 0, [IntPtr]::Zero)
`
spawnSync('powershell', [
  '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psTTS
], { timeout: 12000, windowsHide: true })
