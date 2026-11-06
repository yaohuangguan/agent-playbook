# Agent Playbook

[![CI](https://github.com/yaohuangguan/agent-playbook/actions/workflows/ci.yml/badge.svg)](https://github.com/yaohuangguan/agent-playbook/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**写给 AI 编程助手的工程技能库，能力较弱的模型也能照着执行。**

支持 Claude Code、Codex、Gemini CLI，以及任何能读文件的工具。采用 MIT 许可证，任何项目都能用，包括商业项目。

[English](README.md)

```bash
npx github:yaohuangguan/agent-playbook .
```

## 为什么需要它

AI 编程助手的失败方式很固定：没跑过就说修好了、凭记忆编 API、把被测代码 mock 掉、放宽断言换来绿灯、同一个错误思路反复重试。

只告诉 AI“把测试写好”没什么用。Agent Playbook 给它的是细心的工程师会走的流程：下一步做什么、什么时候该停下来问、哪些捷径是陷阱、最后要拿出什么证据。

| 没有流程时 | 用了 Agent Playbook |
| --- | --- |
| “现在应该好了。” | 写明跑了什么命令、结果是什么 |
| 加个 `user?.email` 让崩溃消失 | 查清楚用户为什么不存在 |
| 把数据库 mock 掉，测试通过 | 用真实的测试数据库，并证明测试会失败 |
| 把 sleep 调长来修偶发失败 | 在压力下复现，然后改成等待真实结果 |
| 汇报“给计费模块加测试” | 汇报具体缺陷、证据和测试用例 |

## 技能列表

| 技能 | 用途 |
| --- | --- |
| [orient-in-codebase](skills/orient-in-codebase/SKILL.md) | 摸清代码库的真实命令和当前状态 |
| [implement-change](skills/implement-change/SKILL.md) | 做功能、修 bug 等任何行为改动 |
| [debug-failure](skills/debug-failure/SKILL.md) | 先找到根因，再动手修 |
| [write-tests](skills/write-tests/SKILL.md) | 写能抓到真实缺陷的测试，附 JavaScript、Python、Go 模板 |
| [audit-test-suite](skills/audit-test-suite/SKILL.md) | 按风险找出测试的薄弱环节 |
| [fix-flaky-test](skills/fix-flaky-test/SKILL.md) | 修偶发失败，不靠重试掩盖 |
| [structure-code](skills/structure-code/SKILL.md) | 工程结构：模块边界、文件不过大、按领域分目录，权限、配置、错误码和文案各有唯一来源 |
| [refactor-safely](skills/refactor-safely/SKILL.md) | 重构，并证明行为没变 |
| [change-data-safely](skills/change-data-safely/SKILL.md) | 迁移、回填和批量改数据 |
| [secure-change](skills/secure-change/SKILL.md) | 登录、权限、输入、密钥和支付 |
| [use-external-api](skills/use-external-api/SKILL.md) | 查证文档和版本，不靠猜 |
| [review-code](skills/review-code/SKILL.md) | 审代码，每个问题都要验证 |
| [verify-and-report](skills/verify-and-report/SKILL.md) | 基于证据如实汇报完成情况 |
| [write-pull-request](skills/write-pull-request/SKILL.md) | 写好评审的提交和 PR |
| [hand-off-work](skills/hand-off-work/SKILL.md) | 把工作交接给另一个 AI 或下一次会话 |

## 安装

需要 Node 24 或更高版本。

**装到项目**，项目里的所有人和所有 AI 都能用：

```bash
npx github:yaohuangguan/agent-playbook /path/to/project
```

**装到本机**，这台电脑上的所有代码库都能用这些技能：

```bash
npx github:yaohuangguan/agent-playbook --global
```

重复运行是安全的。想在 CI 里检查是否过期：

```bash
npx github:yaohuangguan/agent-playbook /path/to/project --check
```

### 会装哪些内容

| 位置 | 谁来读 |
| --- | --- |
| `AGENTS.md` | Codex 直接读，Claude Code 和 Gemini CLI 通过下面两个文件读 |
| `CLAUDE.md`，加上 `@AGENTS.md` | Claude Code |
| `.gemini/settings.json`，把 `AGENTS.md` 加进 `context.fileName` | Gemini CLI |
| `.agents/skills/` | Codex 和 Gemini CLI |
| `.claude/skills/` | Claude Code |

你自己的内容会保留，只替换 `AGENTS.md` 里带标记的部分。遇到无法安全修改的文件时，安装程序会停止，不写入任何内容。

本机安装只写 `~/.agents/skills/` 和 `~/.claude/skills/`，不改你的全局规则文件。

## 工作方式

`AGENTS.md` 每次会话都会加载，所以保持精简：只有一张把任务分到技能的路由表，加 10 条硬规则。技能按需打开。不支持技能的工具，也能按表直接读文件。

每个技能的结构都一样，由测试强制保证：

1. **何时使用**：避免用错技能。
2. **编号步骤**：每一步都是具体动作。
3. **何时停下来问**：不替别人做决定。
4. **常见错误**：列出诱人的做法、为什么错、该怎么做。
5. **汇报模板**：必须写清跑了什么、没查什么。

技能里不写项目专属的命令和路径。这些内容请写在 `AGENTS.md` 的标记块外面，它们优先生效。

## 测试

`npm test` 在 Linux、Windows 和 macOS 上运行：

- **技能结构**：元数据、小节、链接都有效，且不含项目专属内容。
- **安装程序**：全新安装、重复运行、过期检测、保留文件，以及拒绝不安全的修改。
- **变异验证**：在 JavaScript、Python、Go 模板里故意制造 30 个缺陷，每个都必须让示例测试以预期的原因失败。

**尚未测量的部分**：目前没有基准数据说明这些技能能让某个模型提升多少。上面的对比表描述的是预期行为，不是测量结果。如果你做了对比，欢迎在 issue 里分享。

## 来源

这些做法提炼自一个大型生产代码库的测试和 PR，并重写成适用于任何代码库的形式。

## 参与贡献

欢迎提交新技能、其他语言的模板和真实的失败案例，详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

[MIT](LICENSE) © 2026 Sam Yao
