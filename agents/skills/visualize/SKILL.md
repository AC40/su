---
name: visualize
description: Help the user understand something or achieve their goal by visualizing
disable-model-invocation: true
---

# Visualize

Help the user visualize a concept, a piece of data or some content.

## Goals

Distinguish between the goal the user has:
Common goals are:

- Wants to understand a concept (e.g. understand how a codebase works, what a certain phenomenon is like, research, etc.)
- Wants a quicker way of doing things (e.g. quick way to label data, faster way of reviewing results, etc.)
- Wants a diagram/visualization to share

If you are very unsure about the goal, ask the user; but try to infer from context first.

## Means

Use html to create what needs to be created. If not on the machine `acc`, ensure the file is viewable through the users tailscale network.
