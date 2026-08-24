# cc-tool

<p align="center">
  <a href="https://github.com/kuangketongxue/cc-tool/releases"><img src="https://img.shields.io/github/v/release/kuangketongxue/cc-tool?label=release&color=blue" alt="release"></a>
  <a href="https://github.com/kuangketongxue/cc-tool/stargazers"><img src="https://img.shields.io/github/stars/kuangketongxue/cc-tool?style=flat&logo=github&color=yellow" alt="stars"></a>
  <a href="https://github.com/kuangketongxue/cc-tool/issues"><img src="https://img.shields.io/github/issues/kuangketongxue/cc-tool?style=flat&logo=github" alt="issues"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="license"></a>
</p>


Claude Code 实用工具：上下文容量显示 + 任务提示音。

## 功能

### 上下文容量显示

终端底部实时显示当前对话消耗了多少上下文窗口：

```
sonnet-4-6 [████████░░░░░░░░░░░░] 42%
```

- 按模型自动适配窗口大小（Opus/Sonnet → 1M，Haiku → 200K）
- 用真实 token 消耗量计算（`total_input_tokens + total_output_tokens`），不用 Claude Code 内置的 `used_percentage`（不准确）
- 超窗口时显示压缩倍数：`sonnet-4-6 [████████████████████] 1.7x compressed`
- 颜色：绿（<60%）→ 黄（60-85%）→ 红（>85%）

### 任务提示音

Claude Code 任务完成或需要确认时，播放提示音 + Windows 系统通知弹窗 + TTS 语音。

- `chime.wav`：双音阶上升（880Hz + 1320Hz），清脆短促（0.45s）
- Windows 系统通知弹窗（自动消失）
- 可选：TTS 语音（放入 `voices/` 目录，文件名以 `stop-` 或 `notify-` 开头）

## 安装

### 1. 克隆仓库

```bash
git clone https://github.com/kuangketongxue/cc-tool.git
cd cc-tool
```

### 2. 复制脚本到 Claude Code 配置目录

```bash
# Windows
cp statusline-command.sh ~/.claude/statusline-command.sh

# 或手动复制到 C:\Users\<你的用户名>\.claude\
```

### 3. 配置 Claude Code

在 `~/.claude/settings.local.json` 中添加：

```json
{
  "statusLine": {
    "type": "command",
    "command": "bash ~/.claude/statusline-command.sh",
    "refreshInterval": 2
  }
}
```

`refreshInterval` 设为 `2` 秒可获得接近实时的更新。设为 `10` 秒更省资源。

### 4. 配置提示音 hooks（可选）

在 `~/.claude/settings.local.json` 中添加：

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node /path/to/cc-tool/notify.js"
          }
        ]
      }
    ],
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node /path/to/cc-tool/notify.js"
          }
        ]
      }
    ]
  }
}
```

把 `/path/to/cc-tool/` 换成你的实际路径。

## 文件说明

| 文件 | 说明 |
|------|------|
| `statusline-command.sh` | 上下文容量显示脚本，由 Claude Code statusLine 调用 |
| `notify.js` | 提示音 + 系统通知 + TTS，由 hooks 调用 |
| `chime.wav` | 预生成的提示音文件（~40KB） |
| `chime-gen.js` | 生成 chime.wav 的脚本（用 Node.js，需 `wav` 包） |

## 手动测试

```bash
# 测试上下文容量显示
echo '{"model":{"id":"claude-sonnet-4-6"},"context_window":{"total_input_tokens":500000,"total_output_tokens":50000}}' | bash statusline-command.sh

# 测试提示音
node notify.js
```

## 上下文容量计算说明

Claude Code 内置的 `used_percentage` 不准确，原因：
- 分子只算 `cache_read_input_tokens`，遗漏系统提示词等
- 分母始终报 200K，不随模型变化

本工具的计算方式：
```
真实使用率 = (total_input_tokens + total_output_tokens) / 模型真实窗口大小
```

| 模型 | 真实窗口 |
|------|----------|
| Opus / Sonnet | 1,000,000 (1M) |
| Haiku | 200,000 (200K) |
| 未知 | 200,000 (兜底) |

## License

MIT
