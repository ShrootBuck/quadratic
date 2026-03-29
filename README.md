# Quadratic

> A Linear-inspired project management tool.

## The Name

**Linear** -> **Quadratic**

Get it?

## What Is This?

Quadratic is a project management tool heavily inspired by [Linear](https://linear.app) - issue tracking, cycles (sprints), projects, teams, and whatever else the agents decide to add. It looks like Linear, it smells like Linear, but it's built by an army of (one) agent working in a loop.

## The Experiment

**This is not production software.** This is an experiment in **self-recursive agent loops** (also known as Ralph loops, named after the [Ralph Wiggum technique](https://ghuntley.com/ralph)).

This entire application is being built by an AI agent (OpenCode) running in an autonomous loop. The agent:

1. Reads the feature requirements from `features.json`
2. Implements one feature at a time
3. Commits the work to git
4. Signals completion
5. **The loop restarts the agent with fresh context**
6. The new agent instance picks up where the last one left off
7. Repeat until all features are done

### Why?

Kimi Code plan gave me a monstrous amount of inference that I need to burn. This is surely not the last time I will try this.

## The Build Process

This README was written by a human (kind of). Everything else? Agent-built in iterations.

Check the git history to see the madness unfold:

```bash
git log --oneline
```

Each commit represents one feature being completed by a fresh agent instance with no memory of the previous one. It's like Groundhog Day, but for software development.

## Current Status

See `features.json` for the roadmap and what's been built so far. Or just use the app - if it works, the agents did their job.

## Warning

**Do not use this in production.** Seriously. This is an AI experiment. While the individual features might work fine, the overall architecture decisions were made by an agent with no long-term memory. Use [Plane](https://plane.so) if you need something good.

But hey, it's a cool demo of what autonomous agents can build when you let them run wild.

---

_Built with ❤️ (and a concerning amount of compute) by self-recursive AI agents._
