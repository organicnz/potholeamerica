---
name: oxlint-biome-quality
description: >-
  Tooling standards for ultra-fast code formatting, linting, and pre-commit hooks using Biome, Oxlint, and Lefthook.
  Use when configuring formatters, running lint checks, setting up git hooks, or fixing style violations.
---

# Code Quality: Biome, Oxlint & Lefthook

## Strategy Overview
We combine three hyper-fast Rust-based tools to achieve an instantaneous developer feedback loop and a strict zero-warning baseline:

1. **Biome**: Handles automated code formatting, import organization, and syntax diagnostics.
2. **Oxlint**: Runs comprehensive static analysis and catches logical/React bugs in milliseconds.
3. **Lefthook**: Manages Git pre-commit hooks to ensure dirty or malformed code can never be committed.

---

## Tool Configurations

### 1. `biome.json`
```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": false,
    "includes": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx", "**/*.json"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "always",
      "trailingCommas": "es5"
    }
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "warn"
      }
    }
  }
}
```

### 2. `oxlint.json`
```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "unicorn"],
  "categories": {
    "correctness": "error",
    "perf": "warn"
  },
  "rules": {
    "eqeqeq": "error",
    "no-unused-vars": "warn",
    "react/jsx-key": "error",
    "react-hooks/rules-of-hooks": "error"
  }
}
```

### 3. `lefthook.yml`
```yaml
pre-commit:
  parallel: true
  commands:
    biome-format:
      glob: "*.{js,ts,cjs,mjs,jsx,tsx,json}"
      run: bunx biome check --write --no-errors-on-unmatched --files-ignore-unknown=true {staged_files}
      stage_fixed: true
    oxlint:
      glob: "*.{js,ts,jsx,tsx}"
      run: bunx oxlint --deny-warnings {staged_files}
```

---

## Execution Commands

- **Format & Fix with Biome**:
  ```bash
  bunx biome check --write .
  ```
- **Lint with Oxlint**:
  ```bash
  bunx oxlint
  ```
- **Run Pre-Commit Hooks Manually**:
  ```bash
  bunx lefthook run pre-commit
  ```

## Quality Guardrails
- **Zero-Warning Baseline**: Never merge or commit with pending Oxlint or Biome errors.
- Always stage fixed files (`stage_fixed: true`) when Biome corrects formatting during pre-commit.
