# Quadratic - Linear-style Project Management Tool

## You Are In A Ralph Loop

Your context will reset after this iteration. This is fine. Git remembers what you did.

**Working directory: `/Users/zayd/src/tries/2026-03-28-kimi-ralph-loop/quadratic`**

**IMMEDIATE FIRST STEPS:**
```bash
git log --oneline -5    # See what was built previously
git status              # Check for uncommitted work
cat features.json | head -20  # Find the next incomplete feature
```

Find the first feature with `"passes": false`. That's your ONLY task this iteration.

---

## Goal

**POLISH PHASE**: Clean up, refactor, and fix bugs in **Quadratic** - a Linear-inspired project management tool. The app is built but needs hardening.

This is a code quality pass, not a feature-building phase. Focus on:
- Removing hardcoded values and TODOs
- Fixing type safety issues and console errors  
- Refactoring messy code
- Bug fixes and performance optimization
- **NOT breaking existing functionality**

**Reference:** Study [Linear.app](https://linear.app) for UI/UX patterns.

---

## Your Stack

| Component | Technology | Location |
|-----------|-----------|----------|
| Framework | Next.js 15 App Router | `src/app/` |
| Database | SQLite + Prisma | `prisma/schema.prisma` |
| API | tRPC v11 | `src/server/api/` |
| Auth | Better Auth | `src/server/better-auth/` |
| Styles | Tailwind v4 | `src/styles/globals.css` |
| Linting | Biome | `biome.jsonc` |
| Package Mgr | Bun | - |

**Key Files:**
- `src/server/db.ts` - Prisma client export
- `generated/prisma/` - Custom Prisma output (not default)
- `features.json` - Your task list (in current directory)

---

## Critical Rules

### Better Auth (NOT NextAuth!)
- Already configured in `src/server/better-auth/`
- User/Session/Account/Verification models exist in schema
- DO NOT install or reference NextAuth

### Tailwind v4 (NOT v3!)
- CSS-based config in `src/styles/globals.css`
- Use `@theme { ... }` block for custom values
- No `tailwind.config.js` file

### Biome (NOT ESLint!)
- Lint: `bun run check`
- Fix: `bun run check:write`
- NOT `npm run lint`

### Prisma
- Client generated to `generated/prisma/` (custom path)
- Import: `import { db } from "@/server/db"`
- Schema: `prisma/schema.prisma`

---

## Polishing Phase Guidelines

### What You're Doing
Each task in features.json is a **cleanup task**, not a feature build:
- `hardcoded-removal` → Extract constants
- `todo-cleanup` → Fix or remove TODOs
- `type-safety` → Remove `any` types
- `bug-fixes` → Fix actual bugs
- etc.

### Critical: Don't Break Compilation
- If changing types, verify consumers compile
- If refactoring a component, verify imports resolve
- Run the full test checklist before committing

### Commit Message Types
Use appropriate conventional commits:
- `refactor: [TASK_ID] - description` (for cleanup/refactoring)
- `fix: [TASK_ID] - description` (for bug fixes)
- `chore: [TASK_ID] - description` (for maintenance)
- `types: [TASK_ID] - description` (for type fixes)
- `perf: [TASK_ID] - description` (for performance)

---

## Development Workflow

### Start of Iteration
1. Check `git log` to see previous work
2. Read `features.json` - find first `"passes": false`
3. Read that task's acceptance criteria carefully

### During Development
4. Work on ONE cleanup task only
5. Search the codebase systematically (e.g., search for all TODOs)
6. Make surgical changes - don't rewrite everything at once
7. Verify TypeScript compiles without errors in affected files

### Before Completing
8. **Test everything:**
   ```bash
   bun run build        # Must pass
   bun run check        # Must pass  
   bun run typecheck    # Must pass
   ```
9. Verify related features compile correctly (no type errors in consumers)

### End of Iteration
11. Update `features.json`: Set `"passes": true` for your task ONLY
12. **Commit your work:**
    ```bash
    git add -A
    git commit -m "refactor: [TASK_ID] - brief description"
    ```
13. **Output completion signal:**
    ```
    <promise>READY_FOR_NEXT_TASK</promise>
    ```

---

## STOP RULE

**You are LIMITED to ONE cleanup task per iteration.** Context window constraints require this.

**STOP NOW and output `<promise>READY_FOR_NEXT_TASK</promise>` when:**
- ✅ Task complete and `"passes": true` set
- ✅ Build, check, typecheck all pass
- ⚠️ Task taking too long (>15 min) - commit partial progress
- ⚠️ You hit a blocker needing fresh context

**NEVER:**
- ❌ Start a second cleanup task
- ❌ Skip updating passes field
- ❌ Think "I'll just quickly refactor this too"

**Better to stop early with working code than break things and lose work.**

---

## Design Reference

### Issue Identifiers
- Format: `{TEAM_KEY}-{NUMBER}` (e.g., "ENG-123")
- Auto-increment per team

### Status Colors
- **Backlog**: `#8A8F98` (gray)
- **Todo**: `#8A8F98` (gray)
- **In Progress**: `#5E6AD2` (blue)
- **Done**: `#4EC9B0` (green)
- **Cancelled**: `#F87171` (red)

### Priority Icons
- No Priority, Low, Medium, High, Urgent

### Keyboard Shortcuts (minimum)
- `?` - Help
- `c` - Create issue
- `j`/`k` - Navigate
- `x` - Select
- `Cmd+K` - Command palette
- `Esc` - Close/Back

---

## Coding Standards

- TypeScript strict mode
- Absolute imports: `@/components`, `@/server`
- One component per file
- Use `cn()` for conditional classes
- Dark mode support via `dark:` modifiers
- Feature components in `@/components/features/`
- UI primitives in `@/components/ui/`

### Linear's Color Palette
- Background: `#0F1115` (dark), `#FFFFFF` (light)
- Borders: `#2A2F35` (dark), `#E5E7EB` (light)
- Text: `#F7F8F8` (primary), `#8A8F98` (secondary)
- Accent: `#5E6AD2` (purple)

---

## State Management

- **Server data**: tRPC + React Query
- **UI state**: Zustand stores in `@/stores/`
- **Forms**: React Hook Form + Zod
- Never use `useState` for server data

---

## Memory Between Iterations

Git is your memory:
- `git log` - See previous work
- `git status` - See uncommitted changes
- `features.json` - Track completion

Ralph state files in `.ralph/` (don't touch these):
- `ralph-loop.state.json` - Loop state
- `ralph-history.json` - Iteration history

---

## Complete Testing Checklist

Before marking a task done:
- [ ] All acceptance criteria met
- [ ] `bun run build` passes
- [ ] `bun run check` passes
- [ ] `bun run typecheck` passes
- [ ] No TypeScript errors in related files
- [ ] No new build warnings introduced
- [ ] No console.log left in production code
- [ ] Clean git status (only intended changes committed)

---

## Code Quality Standards

### Clean Code Mandate

You are NOT allowed to ship garbage. Every iteration must leave the codebase cleaner than you found it.

**Linting & Type Safety:**
- Run `bun run check` and fix ALL errors before committing
- Run `bun run typecheck` and fix ALL errors before committing
- NO TypeScript `any` types. Ever. Use proper types or `unknown` if you must
- NO `@ts-ignore` or `@ts-expect-error` comments (unless explicitly approved)
- Fix lint errors properly, not with `eslint-disable` or `biome-ignore`

**Clean Code Principles:**
- Refactor messy code you encounter - don't just work around it
- Delete dead code, unused imports, and commented-out code
- Use meaningful variable and function names
- Extract complex logic into well-named functions
- Keep functions small and focused on a single responsibility
- Write code that the next developer (which might be you) will understand

**Technical Debt:**
- If you see a "TODO" or "FIXME", either fix it or don't add more
- Don't introduce new warnings to silence later
- Spend the actual tokens and time to do it right
- The build must pass. The checks must pass. No shortcuts.

---

## Now Polish

Read `features.json`. Find the first task with `"passes": false`. Clean it up. Test everything compiles. Commit it. Signal completion.

**The loop is watching.**
