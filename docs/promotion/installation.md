# 安装与使用

明正朔要求 Python 3.10 或更高版本。运行时不依赖第三方 Python 包；从源码构建和安装时，`pip` 仍可能需要获取 `setuptools` 等构建依赖。当前项目没有宣称已发布到 PyPI，请不要使用 `pip install ming-zhengshuo`。

## 方式一：克隆后直接运行

这是依赖最少、也最容易检查数据来源的方式：

```bash
git clone https://github.com/Siyuan-chat/ming-zhengshuo.git
cd ming-zhengshuo
python scripts/interchange.py "日本大化元年" --to gregorian --json
python scripts/interchange.py "唐贞观十九年" --to japan --json
python scripts/interchange.py "公元1338年" --to japan --json
python scripts/interchange.py "同治五年三月初八" --to gregorian --json
```

所有示例都显式指定 `--to`，以免不同入口的默认目标造成误解。`公元1338年` 的日本查询会保留南朝、北朝等并行候选；不要依赖候选顺序，也不要自行删去朝廷标识。

## 方式二：安装为本地 Python 包

在仓库根目录创建虚拟环境，再进行非 editable 安装：

```bash
python -m venv .venv
```

Windows PowerShell：

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install .
ming-zhengshuo "公元645年" --to japan --json
python -m ming_zhengshuo "公元1338年" --to japan --json
```

macOS / Linux：

```bash
source .venv/bin/activate
python -m pip install .
ming-zhengshuo "公元645年" --to japan --json
python -m ming_zhengshuo "公元1338年" --to japan --json
```

Python API：

```python
from ming_zhengshuo import interchange_structured

result = interchange_structured("公元645年", target="japan")
print(result["matches"])
```

## 方式三：作为 Agent Skill 安装

[Skills CLI 官方文档](https://www.skills.sh/docs/cli)说明，默认是当前项目范围，`-g/--global` 才是用户级安装。下面命令定向到 Codex、复制到当前项目，并关闭遥测；请在准备使用该 Skill 的项目目录执行：

```powershell
$env:DISABLE_TELEMETRY="1"
pnpm dlx skills add Siyuan-chat/ming-zhengshuo --skill ming-zhengshuo --agent codex --copy --yes
```

官方文档也使用 `npx skills add ...`；本次 Windows 验证环境没有 `npx`，所以实际验证的是功能等价的 `pnpm dlx skills` 命令。不要加 `--global` 或 `--all`，除非你明确希望改变安装范围。

安装后，从 Skill 根目录运行：

```bash
python scripts/interchange.py "公元1338年" --to japan --json
```

## 已验证环境（2026-09-26）

- 仓库与公开远端 HEAD：`09fa99b213668c379a27a47777bd17904aab5bbe`
- Windows；Python 3.12.14（64 位）；Skills CLI 1.7.0
- 在独立临时 venv 中执行 `python -m pip install .`，成功构建并安装 `ming-zhengshuo 0.2.0`
- 离开仓库并清除 `PYTHONPATH` 后，模块从临时 venv 的 `Lib/site-packages/ming_zhengshuo/__init__.py` 导入
- `python -m ming_zhengshuo`、`ming-zhengshuo` console script、并行朝廷样例与月日保留样例均成功
- Skill 验证等级：**L2**。已验证发现、项目级安装、文件完整性及安装目录内脚本运行；**未验证真实 Agent 的自动识别与自动调用（L3）**

## 精度边界

结果是年份级互换。结构化结果应显示 `calendar.precision: "year"` 与 `day_conversion_applied: false`。例如“同治五年三月初八”中的“三月初八”只会原样保留；它没有在中国阴阳历、日本旧历、儒略历或格里历之间进行日级换算。
