# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Detailed instructions live in [.claude/](.claude/), organized by topic. Read the relevant file(s) before working in that area.

- [.claude/overview.md](.claude/overview.md) — what this repo is
- [.claude/commands.md](.claude/commands.md) — dev/build/preview commands, the only automated check
- [.claude/architecture/](.claude/architecture/README.md) — the config-mutation pattern, DOM structure, path alias, demo app patterns, the Vite plugin pin
- [.claude/writing.md](.claude/writing.md) — style rules for any documentation you write
- [.claude/docs.md](.claude/docs.md) — pointers to the full README and deep-dive docs

Start with [.claude/architecture/config-mutation-pattern.md](.claude/architecture/config-mutation-pattern.md) if you're touching `MatrixContainer.tsx`'s effects — it's the one pattern in this repo that's easy to accidentally break.
