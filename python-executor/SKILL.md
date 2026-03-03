---
name: python-executor
description: |
  通过 [inference.sh](https://inference.sh) 在安全的沙盒环境中执行Python代码。
  预装：NumPy, Pandas, Matplotlib, requests, BeautifulSoup, Selenium,
  Playwright, MoviePy, Pillow, OpenCV, trimesh 等 100+ 库。
  用于：数据处理、网页抓取、图像处理、视频创建、3D模型处理、PDF生成、API调用、自动化脚本。
  触发词：python、执行代码、运行脚本、网页抓取、数据分析、图像处理、视频编辑、3D模型、自动化、pandas、matplotlib
allowed-tools: Bash(infsh *)
---

# Python代码执行器

![Python代码执行器](https://cloud.inference.sh/u/33sqbmzt3mrg2xxphnhw5g5ear/01k8d8b4mckh6z89dhtxh72dsz.png)

在安全、沙盒的环境中执行Python代码，预装100+库。

## 快速开始

```bash
curl -fsSL https://cli.inference.sh | sh && infsh login

# 运行Python代码
infsh app run infsh/python-executor --input '{
  "code": "import pandas as pd\nprint(pd.__version__)"
}'
```

## 应用详情

| 属性       | 值                           |
| ---------- | ---------------------------- |
| 应用ID     | `infsh/python-executor`      |
| 环境       | Python 3.10，仅CPU           |
| 内存       | 8GB（默认）/ 16GB（高内存） |
| 超时       | 1-300秒（默认：30秒）        |

## 输入模式

```json
{
  "code": "print('Hello World!')",
  "timeout": 30,
  "capture_output": true,
  "working_dir": null
}
```

## 预装库

### 网页抓取和HTTP
- `requests`, `httpx`, `aiohttp` - HTTP客户端
- `beautifulsoup4`, `lxml` - HTML/XML解析
- `selenium`, `playwright` - 浏览器自动化
- `scrapy` - 网页抓取框架

### 数据处理
- `numpy`, `pandas`, `scipy` - 数值计算
- `matplotlib`, `seaborn`, `plotly` - 可视化

### 图像处理
- `pillow`, `opencv-python-headless` - 图像操作
- `scikit-image`, `imageio` - 图像算法

### 视频和音频
- `moviepy` - 视频编辑
- `av` (PyAV), `ffmpeg-python` - 视频处理
- `pydub` - 音频操作

### 3D处理
- `trimesh`, `open3d` - 3D网格处理
- `numpy-stl`, `meshio`, `pyvista` - 3D文件格式

### 文档和图形
- `svgwrite`, `cairosvg` - SVG创建
- `reportlab`, `pypdf2` - PDF生成

## 示例

### 网页抓取

```bash
infsh app run infsh/python-executor --input '{
  "code": "import requests\nfrom bs4 import BeautifulSoup\n\nresponse = requests.get(\"https://example.com\")\nsoup = BeautifulSoup(response.content, \"html.parser\")\nprint(soup.find(\"title\").text)"
}'
```

### 数据分析与可视化

```bash
infsh app run infsh/python-executor --input '{
  "code": "import pandas as pd\nimport matplotlib.pyplot as plt\n\ndata = {\"name\": [\"小明\", \"小红\"], \"sales\": [100, 150]}\ndf = pd.DataFrame(data)\n\nplt.bar(df[\"name\"], df[\"sales\"])\nplt.savefig(\"outputs/chart.png\")\nprint(\"图表已保存！\")"
}'
```

### 图像处理

```bash
infsh app run infsh/python-executor --input '{
  "code": "from PIL import Image\nimport numpy as np\n\n# 创建渐变图像\narr = np.linspace(0, 255, 256*256, dtype=np.uint8).reshape(256, 256)\nimg = Image.fromarray(arr, mode=\"L\")\nimg.save(\"outputs/gradient.png\")\nprint(\"图像已创建！\")"
}'
```

### 视频创建

```bash
infsh app run infsh/python-executor --input '{
  "code": "from moviepy.editor import ColorClip, TextClip, CompositeVideoClip\n\nclip = ColorClip(size=(640, 480), color=(0, 100, 200), duration=3)\ntxt = TextClip(\"你好！\", fontsize=70, color=\"white\").set_position(\"center\").set_duration(3)\nvideo = CompositeVideoClip([clip, txt])\nvideo.write_videofile(\"outputs/hello.mp4\", fps=24)\nprint(\"视频已创建！\")",
  "timeout": 120
}'
```

### 3D模型处理

```bash
infsh app run infsh/python-executor --input '{
  "code": "import trimesh\n\nsphere = trimesh.creation.icosphere(subdivisions=3, radius=1.0)\nsphere.export(\"outputs/sphere.stl\")\nprint(f\"已创建球体，有{len(sphere.vertices)}个顶点\")"
}'
```

### API调用

```bash
infsh app run infsh/python-executor --input '{
  "code": "import requests\nimport json\n\nresponse = requests.get(\"https://api.github.com/users/octocat\")\ndata = response.json()\nprint(json.dumps(data, indent=2))"
}'
```

## 文件输出

保存到 `outputs/` 的文件会自动返回：

```python
# 这些文件会在响应中
plt.savefig('outputs/chart.png')
df.to_csv('outputs/data.csv')
video.write_videofile('outputs/video.mp4')
mesh.export('outputs/model.stl')
```

## 变体

```bash
# 默认（8GB内存）
infsh app run infsh/python-executor --input input.json

# 高内存（16GB）用于大数据集
infsh app run infsh/python-executor@high_memory --input input.json
```

## 使用场景

- **网页抓取** - 从网站提取数据
- **数据分析** - 处理和可视化数据集
- **图像操作** - 调整大小、裁剪、合成图像
- **视频创建** - 生成带文字覆盖的视频
- **3D处理** - 加载、转换、导出3D模型
- **API集成** - 调用外部API
- **PDF生成** - 创建报告和文档
- **自动化** - 运行任何Python脚本

## 重要说明

- **仅CPU** - 无GPU/ML库（ML功能使用专用AI应用）
- **安全执行** - 在隔离的子进程中运行
- **非交互式** - 使用 `plt.savefig()` 而不是 `plt.show()`
- **文件检测** - 输出文件自动检测并返回

## 相关技能

```bash
# AI图像生成（用于基于ML的图像）
npx skills add inferencesh/skills@ai-image-generation

# AI视频生成（用于基于ML的视频）
npx skills add inferencesh/skills@ai-video-generation

# LLM模型（用于文本生成）
npx skills add inferencesh/skills@llm-models
```

## 文档

- [运行应用](https://inference.sh/docs/apps/running) - 如何通过CLI运行应用
- [应用代码](https://inference.sh/docs/extend/app-code) - 理解应用执行
- [沙盒代码执行](https://inference.sh/blog/tools/sandboxed-execution) - Agent的安全代码执行
