# Quadratic

> A Linear-inspired project management tool.

## The Name

**Linear** -> **Quadratic**

Get it?

## What Is This?

Quadratic is a project management tool heavily inspired by [Linear](https://linear.app) - issue tracking, cycles (sprints), projects, teams, and whatever else the bots felt like adding. It looks like Linear, it smells like Linear, but it was built by a schizophrenic AI agent stuck in a time loop.

## The Experiment

**This is not production software.** This is an experiment in **self-recursive agent loops** (also known as Ralph loops, named after the [Ralph Wiggum technique](https://ghuntley.com/ralph)).

This entire application is being built by an AI agent (OpenCode) running in an autonomous loop. The workflow:

1. Reads the feature requirements from `features.json`
2. Implements exactly one feature
3. Commits the code
4. **Dies**
5. Resurrects with fresh context
6. Picks up right where its past life left off
7. Repeats until the roadmap is done

### Why?

Kimi Code gave me a monstrous amount of inference and I need to burn it.

I'm running this experiment on **Kimi K2.5** which is... definitely not the smartest model I could be using right now. I believe the loop matters more than the IQ. Give an agent a solid iterative process, clear constraints, and the ability to learn from its own git history, and it'll outperform the raw "intelligence" of whatever frontier model is trending on Twitter this week.

This is surely not the last time I will try this. For future projects, I'm likely going to attempt many different types of models, from frontier models to self hosted LLMs.

## The Build Process

I wrote this README. Everything else was built by iterative AI.

Check the git history to see the madness unfold:

```bash
git log --oneline
```

Each commit represents one feature being completed by a fresh agent instance with no memory of the previous one. It's like Groundhog Day, but for software development.

## Current Status

See `features.json` for the roadmap and what's been built so far. Or just use the app - if it works, the agents did their job.

## Warning

**Do not use this in production.** Seriously. This is an AI experiment. While the individual features might work fine, the overall architecture decisions were made by a neural network with the memory of a goldfish. Use [Plane](https://plane.so) if you need something good.

_Built with ❤️ (and a concerning carbon footprint) by self-recursive AI agents._
