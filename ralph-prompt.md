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

Build **Quadratic** - a Linear-inspired project management tool (issues, cycles, projects, teams, automations). Built by self-recursive AI agents iterating one feature at a time.

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

## Development Workflow

### Start of Iteration
1. Check `git log` to see previous work
2. Read `features.json` - find first `"passes": false`
3. Read that feature's acceptance criteria carefully

### During Development
4. Work on ONE feature only
5. Follow acceptance criteria sequentially
6. Install dependencies as needed:
   - shadcn/ui: `bunx shadcn@latest add button`
   - npm packages: `bun add <package>`

### Before Completing
7. **Test everything:**
   ```bash
   bun run build        # Must pass
   bun run check        # Must pass  
   bun run typecheck    # Must pass
   ```

### End of Iteration
8. Update `features.json`: Set `"passes": true` for your feature ONLY
9. **Commit your work:**
   ```bash
   git add -A
   git commit -m "feat: [FEATURE_ID] - [brief description]"
   ```
10. **Output completion signal:**
    ```
    <promise>READY_FOR_NEXT_TASK</promise>
    ```

---

## STOP RULE

**You are LIMITED to ONE feature per iteration.** Context window constraints require this.

**STOP NOW and output `<promise>READY_FOR_NEXT_TASK</promise>` when:**
- ✅ Feature complete and `"passes": true` set
- ✅ Build, check, typecheck all pass
- ⚠️ Feature taking too long (>15 min)
- ⚠️ You hit a blocker needing fresh context

**NEVER:**
- ❌ Start a second feature
- ❌ Skip updating passes field
- ❌ Think "I'll just quickly add this too"
- ❌ Work on multiple criteria simultaneously

**Better to stop early than lose work to context overflow.**

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

Before marking a feature done:
- [ ] All acceptance criteria met
- [ ] `bun run build` passes
- [ ] `bun run check` passes
- [ ] `bun run typecheck` passes
- [ ] Feature works in browser
- [ ] Keyboard navigation works
- [ ] Mobile responsive
- [ ] Dark mode looks good
- [ ] No console errors
- [ ] Smooth animations

---

## Now Go Build

Read features.json. Find the next incomplete feature. Build it. Test it. Commit it. Signal completion.

**The loop is watching.**
