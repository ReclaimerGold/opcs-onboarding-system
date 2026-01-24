# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

## [Unreleased]

### Added

- **Bun workspaces** - Monorepo now uses Bun for faster installs (~20x faster than npm)
- **Vitest** - Modern test runner replacing Jest for both frontend and backend
  - Frontend: Vue component testing with `@vue/test-utils` and jsdom
  - Backend: Node environment testing with native ESM support
  - Run with `bun run test` or `bun run test:watch`
- **ESLint configuration** - Vue 3 linting aligned with CONTRIBUTING.md style guide
  - Enforces `<script setup>` syntax
  - Enforces ES6+ patterns (const, destructuring, arrow functions)
  - Enforces camelCase naming
- **TypeScript configuration** - Ready for gradual TypeScript adoption
- **Husky + lint-staged** - Pre-commit hooks for automated linting and testing
- **VS Code workspace settings** - Recommended extensions and editor config
- **Environment template** - `.env.example` documenting required variables
- **Node version pinning** - `.nvmrc` for consistent Node 20+ usage

### Changed

- **Package manager** - Migrated from npm to Bun
  - Single `bun install` at root installs all workspace dependencies
  - Lockfile changed from `package-lock.json` to `bun.lock`
- **Test runner** - Migrated from Jest to Vitest
  - Changed imports from `@jest/globals` to `vitest`
  - Tests now run via `bun run test` (uses Vitest) not `bun test` (Bun native)
- **Scripts** - Updated all scripts to use `bun run --cwd` pattern
- **Node engine** - Now requires Node.js >= 20.0.0

### Fixed

- Applied ESLint auto-fixes for `prefer-destructuring` and `prefer-const` rules

## [1.0.0] - 2026-01-23

### Added

- Initial HR onboarding system for Optimal Prime Cleaning Services
- 6-step form wizard (W-4, I-9, Background, Direct Deposit, Acknowledgements, 8850)
- PDF generation with official IRS/USCIS templates
- AES-256-GCM encryption for sensitive documents
- Google Drive integration for document storage
- Session-based authentication with HTTP-only cookies
- Audit logging for compliance
- Admin dashboard with applicant management
