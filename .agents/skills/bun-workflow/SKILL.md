---
name: bun-workflow
description: >-
  Enforces the use of Bun for all package management, script execution, and test running within this workspace.
  Use whenever installing dependencies, executing dev scripts, running tests, or invoking binaries.
---

# Bun Workflow

## Overview
This repository strictly uses **Bun** as its JavaScript/TypeScript runtime, package manager, and test runner.

## Mandatory Rules

1. **Package Management**:
   - Install packages: `bun install`
   - Add dependencies: `bun add <package>`
   - Add dev dependencies: `bun add -d <package>`
   - Remove dependencies: `bun remove <package>`
   - **Never** invoke `npm`, `yarn`, `pnpm`, or `npx`.

2. **Script & Binary Execution**:
   - Run package scripts: `bun run <script>` (or simply `bun <script>`)
   - Run local/remote CLIs: `bunx <command>` (or `bunx --bun <command>` to run the CLI itself under Bun)
   - Dev server: `bun run dev`
   - Build: `bun run build`

3. **Testing**:
   - Run tests: `bun test`
   - Run a specific test file: `bun test path/to/file.test.ts`
   - Watch mode: `bun test --watch`

4. **Deno / Supabase Edge Functions Distinction**:
   - Within Deno-based Supabase Edge Functions (`supabase/functions/*`), standard library and external packages use the `npm:` or `jsr:` specifiers (e.g., `import { Hono } from "npm:hono"`).
   - This is a Deno runtime feature and does not violate the Bun workflow rule on the host machine.
