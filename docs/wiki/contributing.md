# Contributing & Development Setup

Use this page to get a local dev environment running and run the standard project workflows.

## Required toolchain

- Package manager: `pnpm` (project field `packageManager` is `pnpm@9.0.0`)
- Node.js: `>=20.19.0`

## Repository setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. (Optional) install/update git hooks used in this repo:

   ```bash
   pnpm run prepare
   ```

3. Run quality checks when making changes before opening a PR.

## Available scripts

The scripts below are defined in `package.json`:

- `pnpm run build`  
  Build distributable output with `tsup`.
- `pnpm run dev`  
  Start watch mode builds with `tsup --watch`.
- `pnpm run test`  
  Run unit tests via `vitest run`.
- `pnpm run test:watch`  
  Run Vitest in watch mode.
- `pnpm run test:types`  
  Type-check via `tsc --noEmit -p tsconfig.types.json`.
- `pnpm run lint`  
  Run ESLint checks on source files.
- `pnpm run lint:fix`  
  Run ESLint with `--fix`.
- `pnpm run format`  
  Run Prettier checks.
- `pnpm run format:write`  
  Format files with Prettier.
- `pnpm run prepare`  
  Install Husky hooks.
- `pnpm run prepublishOnly`  
  Build before publish (`pnpm build`).
- `pnpm run publish` / `pnpm run release:publish`  
  Publish to npm (`pnpm publish --access public`).

## Suggested workflow

1. Install dependencies (`pnpm install`)
2. Make code changes
3. Run checks that should pass:

   - `pnpm run test`
   - `pnpm run lint`
   - `pnpm run format`
   - `pnpm run test:types`

4. Build to verify output:

   ```bash
   pnpm run build
   ```

Use the publish-related scripts only when you intentionally prepare a release.
