<!-- state-memory-mcp:start -->
# Workflow State Memory (state-memory-mcp)

This project uses `state-memory-mcp` with project slug `"grokjs"` to track tasks, decisions, blockers, and progress.
ALWAYS update the state graph when performing work.

## Mandatory Workflow
1. **Start of session**: Call `start_session(agent_id: "...")`, then run `get_project_summary` and `next_tasks` BEFORE any coding.
2. **Before work**: Create or find the task node, set status to `in_progress`.
3. **During work**: Log decisions (`add_node type: decision`), blockers (`add_node type: blocker`), and notes (`add_note`).
4. **Visual Consistency (Dual Memory)**:
   - For UI / layout tasks, capture visual evidence using `vision-memory-mcp:analyze_screenshot`.
   - Link visual proof via `link_visual_state(target_id: task_id, visual_state_id: vs_id, relationship: "renders_state")`.
   - Log visual blockers using `create_visual_blocker` or `link_visual_state(..., relationship: "blocked_by_visual_state")`.
5. **After work**: Run `validate_graph`, set task status to `done`, create artifact nodes, and call `end_session`.

## Tool Priority Order
1. `start_session` — track all mutations under a unique session
2. `get_project_summary` — current state and progress
3. `next_tasks` — query prioritized runnable tasks
4. `link_visual_state` — connect task/artifact nodes to visual states
5. `find_blockers` — what's blocking progress
6. `validate_graph` — check for cycle or logic anomalies
7. `export_joint_trajectories` — export interleaved state + vision logs

## Node Types
`task`, `decision`, `artifact`, `plan`, `milestone`, `blocker`, `observation`, `visual_state`

## Edge Types
`depends_on`, `blocks`, `produces`, `references`, `updates`, `contradicts`, `part_of`, `child_of`, `implements`, `decided_in`, `renders_state`, `blocked_by_visual_state`, `verifies_visual_state`

## Quick Reference
- **Batch updates**: `batch_update(ids: [...], status: "done")`
- **Quick notes**: `add_note(text: "...", attach_to: node_id)`
- **Synergy metrics**: `get_synergy_metrics()`
- **What changed**: `what_changed(since: "2h")` or `what_changed(session_id: "...")`

> For the complete tool reference and workflow patterns, see the `state-memory-mcp` skill in `.agents/skills/state-memory-mcp/SKILL.md`.
<!-- state-memory-mcp:end -->
