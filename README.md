# Agent Playbook

给 AI 编程助手用的开发和测试规范。Claude Code、Codex、Gemini CLI 都读同一份规则，换工具不用重写。

规则来自对 [Remote Arc](https://github.com/Remote-Arc/remote-arc) 代码和 PR 的核对，不是凭印象总结的。每条规则的出处、Gemini 总结里哪些说过头了、哪些写法不要照抄，都在 [playbook/evidence-remote-arc.md](playbook/evidence-remote-arc.md)。

## 内容

| 文件 | 用途 | 谁来读 |
| --- | --- | --- |
| [AGENTS.md](AGENTS.md) | 25 条核心规则，控制在 4 KB 以内 | 每次会话自动加载 |
| [playbook/testing.md](playbook/testing.md) | 测什么、怎么测、反模式、评审清单 | 写测试或审测试前 |
| [playbook/development.md](playbook/development.md) | 从调研到发布的流程和 PR 模板 | 做较大改动前 |
| [examples/device-api](examples/device-api) | 可运行的测试模板和变异验证 | 需要参考时 |
| [install.mjs](install.mjs) | 把规则装进任意项目 | 人或 AI |

## 安装到项目

需要 Node 24 或更高版本。

```bash
git clone https://github.com/yaohuangguan/agent-playbook.git
```

```bash
node agent-playbook/install.mjs /path/to/project
```

安装后，项目里会有这些改动：

- `AGENTS.md`：写入一段带标记的规则。标记之外的内容不动，所以项目自己的规则会保留。
- `.agent-playbook/`：放测试和开发指南，AI 按需读取。
- `CLAUDE.md`：加上 `@AGENTS.md`，让 Claude Code 也读这份规则。
- `.gemini/settings.json`：把 `AGENTS.md` 加进 `context.fileName`，让 Gemini CLI 也读这份规则。

重复运行是安全的。规则更新后，先在本仓库 `git pull`，再运行一次即可。

想在项目 CI 里检查规则是否过期：

```bash
node agent-playbook/install.mjs /path/to/project --check
```

## 优先级

用户的直接要求和项目自己的规则，优先于这份规范。项目专属内容（命令、目录、fixture）写在项目的 `AGENTS.md` 里，放在规则块外面。

## 验证

```bash
npm test
```

这条命令会跑三项检查：

- 示例 API 的测试。
- 变异验证：故意在示例里制造 10 个缺陷，每个都必须让测试以预期的原因失败。
- 安装脚本的测试：覆盖全新安装、重复安装、过期检测、保留项目内容，以及遇到无法安全修改的文件时不写入任何内容。

## 修改规则

新规则要写清证据，最好指向真实的 bug、PR 或测试。`AGENTS.md` 每次会话都会加载，所以尽量短，细节放进 `playbook/`。
