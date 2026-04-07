---
name: TubeScribe
description: "YouTube视频总结器，带说话人检测、格式化文档和音频输出。当用户发送YouTube URL或要求总结、转录YouTube视频时，必须触发此技能。"
---

# TubeScribe 🎬

**将任何YouTube视频转换为精美的文档+音频摘要。**

提供YouTube链接 → 获得带说话人标签、关键引用、可点击时间戳（链接回视频）和音频摘要的转录内容，你可以在旅途中收听。

### 💸 100%免费且本地化

- **无需订阅** - 完全在你的机器上运行
- **无需API密钥** - 开箱即用
- **数据不离开计算机** - 你的内容保持私密

### ✨ 功能特性

- **📄 带摘要和关键引用的转录** - 导出为DOCX、HTML或Markdown
- **🎯 智能说话人检测** - 自动识别参与者
- **🔊 音频摘要** - 收听关键要点（MP3/WAV）
- **📝 可点击时间戳** - 每个引用都直接链接到视频中的那一刻
- **💬 YouTube评论** - 观众情绪分析和最佳评论
- **📋 队列支持** - 发送多个链接，它们按顺序处理
- **🚀 非阻塞工作流** - 视频在后台处理时继续对话

### 🎬 适用于任何视频

- 访谈和播客（多说话人检测）
- 讲座和教程（单个说话人）
- 音乐视频（歌词提取）
- 新闻和纪录片
- 任何有字幕的YouTube内容

## 快速开始

当用户发送YouTube URL时：
1. **立即**使用完整管道任务生成子代理
2. 回复："🎬 TubeScribe正在处理 - 我会告诉你什么时候准备好了！"
3. 继续对话（不要等待！）
4. 子代理通知将宣布完成，包括标题和详细信息

**不要阻塞** - 立即生成并继续。

## 首次设置

运行设置以检查依赖关系并配置默认值：

```bash
python skills/tubescribe/scripts/setup.py
```

这会检查：`summarize` CLI、`pandoc`、`ffmpeg`、`Kokoro TTS`

## 完整工作流（单子代理）

生成一个执行整个管道的子代理：

```python
# 使用你的 agent 对应的子代理工具
# Claude Code/OpenCode: Task()
# OpenClaw: sessions_spawn()
Task(
    prompt=f"""
## TubeScribe: 处理 {youtube_url}

⚠️ 关键：不要安装任何软件。
不需要pip、brew、curl、venv或二进制下载。
如果缺少工具，停止并报告需要什么。

运行完整管道 - 不要停直到所有步骤完成。

### 步骤1：提取
```bash
python3 skills/tubescribe/scripts/tubescribe.py "{youtube_url}"
```
注意步骤1输出中的 **源路径**和**输出路径**。临时目录因操作系统而异（例如，macOS上为`/var/folders/.../tubescribe-501/`，Linux上为`/tmp/tubescribe-1000/`）。

### 步骤2：读取源JSON
从步骤1输出中读取源路径并注意：
- metadata.title（用于文件名）
- metadata.video_id
- metadata.channel, upload_date, duration_string

### 步骤3：创建格式化markdown
写入步骤1的输出路径：

1. `# **<title>**`
---
2. 视频信息块 - 频道、日期、时长、URL（可点击）。每个字段之间空一行。
---
3. `## **参与者**` - 表格带粗体标题：
   ```
   | **姓名** | **角色** | **描述** |
   |----------|----------|-----------------|
   ```
---
4. `## **摘要**` - 3-5段散文
---
5. `## **关键引用**` - 5个最佳带可点击YouTube时间戳。每个格式为：
   ```
   "引用文本在这里。" - [12:34](https://www.youtube.com/watch?v=ID&t=754s)

   "另一个引用。" - [25:10](https://www.youtube.com/watch?v=ID&t=1510s)
   ```
   使用常规破折号`-`，不要用破折号`—`。不要使用块引用`>`。只有普通段落。
---
6. `## **观众情绪**`（如果评论存在）
---
7. `## **最佳评论**`（如果评论存在）- 前5个，评论之间没有行：
   ```
   评论文本在这里。

   *- ▲ 123 @作者名*

   下一条评论文本在这里。

   *- ▲ 45 @另一个作者*
   ```
   归属行：破折号 + 斜体。只有评论之间空行，不要`---`分隔符。

---
8. `## **完整转录**` - 合并片段、说话人标签、可点击时间戳

### 步骤4：创建DOCX
清理文件名（删除特殊字符），然后：
```bash
pandoc <output_path> -o ~/Documents/TubeScribe/<safe_title>.docx
```

### 步骤5：生成音频
将摘要文本写入临时文件，然后使用TubeScribe的内置音频生成：
```bash
# 将摘要写入临时文件（使用python3写入，避免shell转义问题）
python3 -c "
text = '''你的摘要文本在这里'''
with open('<temp_dir>/tubescribe_<video_id>_summary.txt', 'w') as f:
    f.write(text)
"

# 生成音频（自动处理引擎检测、语音混合、格式转换）
python3 skills/tubescribe/scripts/tubescribe.py --generate-audio <temp_dir>/tubescribe_<video_id>_summary.txt --audio-output ~/Documents/TubeScribe/<safe_title>_summary
```
这会读取 `~/.tubescribe/config.json` 并自动使用配置的TTS引擎（mlx/kokoro/builtin）、语音混合和速度。输出格式（mp3/wav）来自配置。

### 步骤6：清理
```bash
python3 skills/tubescribe/scripts/tubescribe.py --cleanup <video_id>
```

### 步骤7：打开文件夹
```bash
open ~/Documents/TubeScribe/
```

### 报告
报告创建了什么：DOCX名称、MP3名称 + 时长、视频统计。
""",
    label="tubescribe",
    runTimeoutSeconds=900,
    cleanup="delete"
)
```

**生成后立即回复：**
> 🎬 TubeScribe正在处理 - 我会告诉你什么时候准备好了！
然后继续对话。子代理通知宣布完成。

## 配置

配置文件：`~/.tubescribe/config.json`

```json
{
  "output": {
    "folder": "~/Documents/TubeScribe",
    "open_folder_after": true,
    "open_document_after": false,
    "open_audio_after": false
  },
  "document": {
    "format": "docx",
    "engine": "pandoc"
  },
  "audio": {
    "enabled": true,
    "format": "mp3",
    "tts_engine": "mlx"
  },
  "mlx_audio": {
    "path": "~/.openclaw/tools/mlx-audio",
    "model": "mlx-community/Kokoro-82M-bf16",
    "voice": "af_heart",
    "lang_code": "a",
    "speed": 1.05
  },
  "kokoro": {
    "path": "~/.openclaw/tools/kokoro",
    "voice_blend": { "af_heart": 0.6, "af_sky": 0.4 },
    "speed": 1.05
  },
  "processing": {
    "subagent_timeout": 600,
    "cleanup_temp_files": true
  }
}
```

### 输出选项
| 选项                   | 默认值                           | 描述                           |
| ---------------------- | -------------------------------- | ------------------------------ |
| `output.folder`        | `~/Documents/TubeScribe`         | 保存文件的位置                 |
| `output.open_folder_after` | `true`                        | 完成后打开输出文件夹           |
| `output.open_document_after` | `false`                       | 自动打开生成的文档             |
| `output.open_audio_after` | `false`                       | 自动打开生成的音频摘要         |

### 文档选项
| 选项                | 默认值                      | 值                          | 描述                          |
| ------------------- | --------------------------- | --------------------------- | ----------------------------- |
| `document.format`   | `docx`                      | `docx`, `html`, `md`        | 输出格式                     |
| `document.engine`   | `pandoc`                    | `pandoc`                    | DOCX的转换器（回退到HTML）   |

### 音频选项
| 选项                  | 默认值              | 值                                  | 描述                                        |
| --------------------- | ------------------- | ----------------------------------- | ------------------------------------------- |
| `audio.enabled`       | `true`              | `true`, `false`                     | 生成音频摘要                                |
| `audio.format`        | `mp3`               | `mp3`, `wav`                        | 音频格式（mp3需要ffmpeg）                   |
| `audio.tts_engine`    | `mlx`               | `mlx`, `kokoro`, `builtin`          | TTS引擎（mlx = Apple Silicon上最快）         |

### MLX-Audio选项（Apple Silicon首选）
| 选项                      | 默认值                                     | 描述                               |
| ------------------------- | ------------------------------------------ | ---------------------------------- |
| `mlx_audio.path`          | `~/.openclaw/tools/mlx-audio`              | mlx-audio venv位置                  |
| `mlx_audio.model`         | `mlx-community/Kokoro-82M-bf16`           | 要使用的MLX模型                    |
| `mlx_audio.voice`         | `af_heart`                                 | 语音预设（如果没有voice_blend则使用）  |
| `mlx_audio.voice_blend`   | `{af_heart: 0.6, af_sky: 0.4}`            | 自定义语音混合（加权混合）            |
| `mlx_audio.lang_code`     | `a`                                        | 语言代码（a=美式英语）              |
| `mlx_audio.speed`         | `1.05`                                     | 播放速度（1.0=正常，1.05=快5%）     |

### Kokoro PyTorch选项（回退）
| 选项                    | 默认值                               | 描述                    |
| ----------------------- | ------------------------------------ | ----------------------- |
| `kokoro.path`           | `~/.openclaw/tools/kokoro`           | Kokoro仓库位置          |
| `kokoro.voice_blend`    | `{af_heart: 0.6, af_sky: 0.4}`      | 自定义语音混合          |
| `kokoro.speed`          | `1.05`                               | 播放速度                |

### 处理选项
| 选项                                  | 默认值              | 描述                    |
| ------------------------------------- | ------------------- | ----------------------- |
| `processing.subagent_timeout`         | `600`               | 子代理的秒数（长视频增加） |
| `processing.cleanup_temp_files`       | `true`              | 完成后删除/tmp文件      |

## 输出结构

```
~/Documents/TubeScribe/
├── {视频标题}.html        # 格式化文档（或.docx / .md）
└── {视频标题}_summary.mp3 # 音频摘要（或.wav）
```

生成后，打开文件夹（不是单独的文件），这样你可以访问所有内容。

## 依赖项

**必需：**
- `summarize` CLI — `brew install steipete/tap/summarize`
- Python 3.8+

**可选（更好质量）：**
- `pandoc` — DOCX输出：`brew install pandoc`
- `ffmpeg` — MP3音频：`brew install ffmpeg`
- `yt-dlp` — YouTube评论：`brew install yt-dlp`
- mlx-audio — Apple Silicon上最快的TTS：`pip install mlx-audio`（使用MLX后端作为Kokoro）
- Kokoro TTS — PyTorch回退：见 https://github.com/hexgrad/kokoro

## 队列处理

当用户在一个视频处理时发送多个YouTube URL时：

### 开始前检查
```bash
python skills/tubescribe/scripts/tubescribe.py --queue-status
```

### 如果正在处理
```bash
# 添加到队列而不是开始并行处理
python skills/tubescribe/scripts/tubescribe.py --queue-add "新URL"
# → 回复："📋 已添加到队列（位置2）"
```

### 完成后
```bash
# 检查是否有更多内容在队列中
python skills/tubescribe/scripts/tubescribe.py --queue-next
# → 自动弹出并处理下一个URL
```

### 队列命令
| 命令              | 描述                     |
| ----------------- | ------------------------ |
| `--queue-status`  | 显示正在处理 + 队列项目  |
| `--queue-add URL` | 添加URL到队列            |
| `--queue-next`    | 从队列处理下一个项目     |
| `--queue-clear`   | 清除整个队列             |

### 批量处理（一次多个URL）
```bash
python skills/tubescribe/scripts/tubescribe.py url1 url2 url3
```
依次顺序处理所有URL，并在最后进行汇总。

## 错误处理

脚本会检测并报告这些错误并附带明确消息：

| 错误              | 消息                               |
| ----------------- | ---------------------------------- |
| 无效URL           | ❌ 不是有效的YouTube URL           |
| 私有视频          | ❌ 视频是私有的 - 无法访问          |
| 视频已删除        | ❌ 未找到视频或已删除              |
| 无字幕            | ❌ 此视频没有可用字幕              |
| 年龄限制          | ❌ 年龄限制视频 - 无法登录访问      |
| 区域限制          | ❌ 视频在你的区域被阻止            |
| 直播              | ❌ 不支持直播 - 等待结束           |
| 网络错误          | ❌ 网络错误 - 检查连接              |
| 超时              | ❌ 请求超时 - 稍后重试              |

发生错误时，向用户报告该错误，不要继续处理该视频。

## 提示

- 对于长视频（>30分钟），增加子代理超时到900秒
- 说话人检测最适合清晰的访谈/播客格式
- 单说话人视频（教程、讲座）自动跳过说话人标签
- 时间戳直接链接到YouTube上的那一刻
- 对多个视频使用批处理模式：`tubescribe url1 url2 url3`
