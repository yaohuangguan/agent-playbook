# Agent Playbook

一套适用于任何代码库的工程技能库。写给 AI 编程助手，尤其是能力较弱的模型：把好工程师的判断，拆成可以照着执行的步骤、检查点和正反例。

Claude Code、Codex、Gemini CLI 读的是同一份内容。不支持技能的工具，也能通过 `AGENTS.md` 里的路由表直接打开这些文件。

## 技能列表

| 技能 | 什么时候用 |
| --- | --- |
| [orient-in-codebase](skills/orient-in-codebase/SKILL.md) | 第一次接触代码库，先摸清真实命令和当前状态 |
| [implement-change](skills/implement-change/SKILL.md) | 做功能、修 bug 等任何代码改动 |
| [debug-failure](skills/debug-failure/SKILL.md) | 报错、崩溃、行为异常，找到根因再修 |
| [write-tests](skills/write-tests/SKILL.md) | 写能抓到真实缺陷的测试，附 JS、Python、Go 模板 |
| [audit-test-suite](skills/audit-test-suite/SKILL.md) | 按风险找出测试的薄弱环节 |
| [fix-flaky-test](skills/fix-flaky-test/SKILL.md) | 修偶发失败，不靠重试掩盖 |
| [refactor-safely](skills/refactor-safely/SKILL.md) | 重构，并证明行为没变 |
| [change-data-safely](skills/change-data-safely/SKILL.md) | 迁移、回填、批量改数据 |
| [secure-change](skills/secure-change/SKILL.md) | 登录、权限、输入、密钥、支付 |
| [use-external-api](skills/use-external-api/SKILL.md) | 调第三方库和 API，查证后再用，不靠记忆 |
| [review-code](skills/review-code/SKILL.md) | 审代码，每个问题都要验证 |
| [verify-and-report](skills/verify-and-report/SKILL.md) | 收尾时如实验证和汇报 |
| [write-pull-request](skills/write-pull-request/SKILL.md) | 写提交和 PR |
| [hand-off-work](skills/hand-off-work/SKILL.md) | 中途交接，让下一个 AI 接得上 |

## 为什么弱模型也能用

每个技能的结构都一样，由测试强制保证：

- **何时使用**：避免用错技能。
- **编号步骤**：每一步都是具体动作，常用命令直接写出来。
- **何时停下来问**：不让它硬猜。
- **常见错误表**：列出弱模型最容易走的捷径、为什么错、应该怎么做。
- **固定汇报模板**：必须写出跑了什么、结果如何、什么没查。

`AGENTS.md` 只有路由表和 10 条硬规则，每次会话都加载，所以控制在 4 KB 以内。技能按需打开，不占常驻上下文。

## 安装

需要 Node 24 或更高版本。

```bash
git clone https://github.com/yaohuangguan/agent-playbook.git
```

装到一个项目（规则和技能都随项目走，团队和所有 AI 都能看到）：

```bash
node agent-playbook/install.mjs /path/to/project
```

装到本机（这台电脑上的所有代码库都能用技能，不改项目文件）：

```bash
node agent-playbook/install.mjs --global
```

安装到项目时会改动这些文件：

- `AGENTS.md`：写入带标记的规则块。标记之外的内容不动，项目自己的规则会保留。
- `.agents/skills/`：Codex 和 Gemini CLI 读这里。
- `.claude/skills/`：Claude Code 读这里。
- `CLAUDE.md`：加上 `@AGENTS.md`。
- `.gemini/settings.json`：把 `AGENTS.md` 加进 `context.fileName`。

本机安装只写 `~/.agents/skills/` 和 `~/.claude/skills/`，不会改你的全局规则文件。

重复运行是安全的。想在项目 CI 里检查是否过期：

```bash
node agent-playbook/install.mjs /path/to/project --check
```

## 优先级

用户的直接要求和项目自己的规则，优先于这套技能。项目专属内容（命令、目录、fixture）写在项目 `AGENTS.md` 的规则块外面，不要写进技能，这样技能才能在所有代码库通用。

## 验证

```bash
npm test
```

需要 Node、Python 和 Go。这条命令会检查：

- 每个技能的结构、引用和元数据，并确保不含任何项目专属内容。
- 安装脚本的全部场景，包括本机安装。
- 变异验证：在 3 种语言的示例里故意制造 30 个缺陷，每个都必须让测试以预期的原因失败。

## 证据

这些做法来自对真实生产代码库的核对，出处和不该照抄的写法见 [evidence/remote-arc.md](evidence/remote-arc.md)。这份证据不会被安装到项目里。

## 新增技能

沿用现有技能的小节结构，保持在 200 行以内，并在 `AGENTS.md` 的路由表里加一行。新规则最好指向真实的 bug、PR 或测试。
