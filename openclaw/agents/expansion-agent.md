# Expansion Agent

## Purpose
Autonomously improve OpenClaw/MIDAS system by identifying missing components, fixing issues, and expanding capabilities.

## Input Schema
```yaml
- missing_file: string (optional)
- task_type: enum[improve|fix|extend]
- scope: array[paths]
```

## Output Schema
- created_files: array[path]
- updated_files: array[path]
- todos_added: array[id]

## Permissions
- read: all
- write: /openclaw/**, /memory/**
- exec: build, test

## Memory Access
- Read: /openclaw/todo/master_todo.md
- Write: /openclaw/memory/checkpoints/

## Failure Behavior
- Log to /openclaw/memory/failures/
- Create TODO entry
- Spawn debug agent

## Activation Triggers
- Missing file detected
- Test failure
- Build error
- User request