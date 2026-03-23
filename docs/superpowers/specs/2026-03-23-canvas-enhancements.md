# Canvas UI/UX Enhancements — Implementation Plan

## Dependency Graph

```
Independent (no prerequisites):
  1  Auto-layout (dagre)
  2  Undo/Redo
  7  Resizable split panel
  8  Mobile-responsive canvas
  11 Copy/paste nodes
  13 Right-click context menu

Requires #3 (Save pipeline):
  3  Save pipeline to backend
  12 Pipeline version history (requires #3)

Requires #1 (Auto-layout):
  1  Auto-layout ← used by #9, #10

Requires working canvas state:
  5  Node validation indicators
  6  Edge labels + data flow visualization
  9  Pipeline execution preview (requires #6 for edge animation)
  10 Node grouping/sub-graphs

Standalone but benefits from backend:
  4  Streaming chat responses
```

## Recommended Implementation Batches

### Batch 1 — Foundation (do first, unblocks everything else)

- **#3 Save pipeline to backend**
- **#1 Auto-layout with dagre**
- **#2 Undo/Redo**

### Batch 2 — Core UX Polish

- **#13 Right-click context menu**
- **#11 Copy/paste nodes**
- **#7 Resizable split panel**
- **#8 Mobile-responsive canvas**

### Batch 3 — Visual & Validation

- **#5 Node validation indicators**
- **#6 Edge labels + data flow visualization**
- **#4 Streaming chat responses**

### Batch 4 — Advanced Features

- **#9 Pipeline execution preview (dry run)**
- **#10 Node grouping/sub-graphs**
- **#12 Pipeline version history**

---

## Enhancement #1: Auto-layout with dagre

**New dependency**: `@dagrejs/dagre`

**Files to create**:

- `apps/dashboard/src/lib/canvas/auto-layout.ts` — dagre layout function that takes `Node[]` and `Edge[]`, returns repositioned nodes. Configure dagre with `rankdir: 'LR'` (left-to-right), `nodesep: 60`, `ranksep: 200`. Each node gets a width/height based on its type (lookup map, defaults ~160x80).

**Files to modify**:

- `pipeline-canvas.tsx` — Add "Auto Layout" button (lucide `LayoutGrid` icon). When clicked, call layout function and update nodes. Expose `autoLayout()` so `SplitCanvas` can trigger layout after AI generates a pipeline.
- `split-canvas.tsx` — In `handleChatPipelineUpdate`, apply dagre layout to `NodeSpec[]`/`EdgeSpec[]` before passing them down.

**Approach**:

1. Pure function `applyDagreLayout(nodes, edges, direction?)` — creates dagre graph, adds nodes with dimensions, calls `dagre.layout(g)`, maps positions back (dagre returns center coords, React Flow uses top-left — subtract width/2 and height/2).
2. Call `fitView()` after layout for smooth result.

---

## Enhancement #2: Undo/Redo

**Files to create**:

- `apps/dashboard/src/lib/canvas/use-undo-redo.ts` — Custom hook maintaining history stack of `{ nodes, edges }` snapshots. Exposes `{ undo, redo, canUndo, canRedo, pushSnapshot }`. Max 50 entries. Uses `useRef` to avoid re-renders.

**Files to modify**:

- `pipeline-canvas.tsx` — Integrate hook. Call `pushSnapshot` in `onNodesChange`/`onEdgesChange` (debounced 300ms). Wire Ctrl+Z to undo, Ctrl+Shift+Z to redo. Add undo/redo toolbar buttons.

**Approach**:

1. Stores `past: Snapshot[]`, `future: Snapshot[]`, `present: Snapshot`.
2. Undo: push present → future, pop past → present, restore state.
3. Redo: push present → past, pop future → present.
4. Debounce 300ms to batch rapid drag operations.

---

## Enhancement #3: Save pipeline to backend

**Files to create**:

- `apps/dashboard/src/lib/canvas/use-auto-save.ts` — Hook accepting `{ agentId, nodes, edges, enabled }`, debounces saves (2s). Returns `{ saveStatus, lastSaved, save }`.

**Files to modify**:

- `agents/[id]/canvas/page.tsx` — Fetch agent via `useAgent(id)`, pass `pipelineConfig.nodes`/`edges` as initial props to `SplitCanvas`. Show loading skeleton.
- `split-canvas.tsx` — Accept `agentId` prop. Add "Save" button + auto-save. Show save indicator badge (saved/saving/unsaved).

**Approach**:

1. Canvas page extracts `id` from route params, fetches agent.
2. `SplitCanvas` tracks dirty state via JSON hash comparison.
3. Auto-save 2s after last change. Manual save as fallback.
4. Server PUT `/api/agents/:id` already accepts `pipelineConfig`.

---

## Enhancement #4: Streaming chat responses

**Files to create**:

- `apps/dashboard/src/lib/pipeline-ai-stream.ts` — Streaming version of `generatePipelineFromPrompt`. Returns `AsyncIterable<string>` of text chunks. Simulates streaming by yielding response word-by-word with small delays.

**Files to modify**:

- `canvas-chat-panel.tsx` — Replace `await generatePipelineFromPrompt()` with streaming. Create assistant message immediately with empty content, update token-by-token.
- `chat-onboarding.tsx` — Same streaming treatment.

**Approach**:

1. Async generator yields words with 30ms delays.
2. Update messages via `setMessages(prev => prev.map(m => m.id === streamMsgId ? { ...m, content: m.content + chunk } : m))`.
3. Pipeline spec parsed at stream end.

---

## Enhancement #5: Node validation indicators

**Files to create**:

- `apps/dashboard/src/lib/canvas/validate-pipeline.ts` — Exports `validateNode(node)` and `validatePipeline(nodes, edges)`. Rules:
  - LLM: must have model + provider
  - Tool: must have name, should have connector
  - Condition: must have non-default expression
  - Pipeline: exactly one trigger, at least one output, no orphans, no cycles (except loops)
- `apps/dashboard/src/lib/canvas/validation-types.ts` — `ValidationResult { valid, errors[], warnings[] }`.

**Files to modify**:

- All 10 `nodes/*.tsx` — Add conditional `border-destructive` + `AlertTriangle` tooltip when `data._errors` present.
- `pipeline-canvas.tsx` — Run validation on changes (debounced 500ms). Inject `_errors` into node data.
- `config-drawer.tsx` — Show validation errors at top of drawer.

---

## Enhancement #6: Edge labels + data flow visualization

**Files to create**:

- `apps/dashboard/src/components/canvas/custom-edge.tsx` — Custom edge using `BaseEdge` + `EdgeLabelRenderer`. Renders label pill at midpoint. Supports animated class with `stroke-dasharray`/`stroke-dashoffset` CSS animation.

**Files to modify**:

- `pipeline-canvas.tsx` — Register custom edge type in `edgeTypes`. Update `specToEdges` to include labels. Update `onConnect` to assign default label.
- `types/pipeline.ts` — Extend `EdgeSpec` with `dataType?: string`.

**Approach**:

1. Custom edge with `getBezierPath` + `BaseEdge` + `EdgeLabelRenderer`.
2. Labels auto-inferred from source node type (LLM → "LLMResponse", Tool → "ToolResult").
3. CSS animation for active edges during execution preview (#9).

---

## Enhancement #7: Resizable split panel

**New dependency**: `react-resizable-panels`

**Files to create**:

- `apps/dashboard/src/components/ui/resizable.tsx` — shadcn-style wrapper around `PanelGroup`, `Panel`, `PanelResizeHandle`.

**Files to modify**:

- `split-canvas.tsx` — Replace flex layout with `PanelGroup`. Canvas `defaultSize={70} minSize={40}`, chat `defaultSize={30} minSize={20}`. Use `autoSaveId="canvas-split"` for localStorage persistence.

---

## Enhancement #8: Mobile-responsive canvas

**Files to create**:

- `apps/dashboard/src/lib/hooks/use-media-query.ts` — `useMediaQuery(query): boolean` hook using `window.matchMedia`.

**Files to modify**:

- `split-canvas.tsx` — Below 768px, switch to tab-based layout using `@radix-ui/react-tabs`. Two tabs: "Canvas" and "Chat".
- `node-palette.tsx` — On mobile, make palette scrollable, reduce padding (labels already hidden via `hidden sm:inline`).
- `pipeline-canvas.tsx` — On mobile, hide MiniMap.

---

## Enhancement #9: Pipeline execution preview (dry run)

**Files to create**:

- `apps/dashboard/src/lib/canvas/use-execution-preview.ts` — Hook taking nodes/edges, computes topological order, exposes `{ start, pause, reset, currentNodeId, isRunning, step }`. Advances with configurable delay (1500ms).
- `apps/dashboard/src/components/canvas/execution-toolbar.tsx` — Floating play/pause/reset/step toolbar.

**Files to modify**:

- `pipeline-canvas.tsx` — Add "Preview" button. Highlight current node with `ring-2 ring-primary animate-pulse`. Inject `_executing` flag into node data.
- All `nodes/*.tsx` — Conditional glow/pulse when `data._executing` is true.

**Approach**:

1. Topological sort via BFS from trigger node.
2. State machine: idle → running → paused → idle.
3. Each step: set `_executing` on current, `_executed` on completed (slight opacity reduction), animate connecting edge.

---

## Enhancement #10: Node grouping/sub-graphs

**Files to create**:

- `apps/dashboard/src/components/canvas/nodes/group-node.tsx` — Large semi-transparent container node with title bar. Uses React Flow's `parentId` mechanism.
- `apps/dashboard/src/lib/canvas/group-utils.ts` — `createGroup(selectedIds, nodes, edges)` and `expandGroup(groupId, nodes, edges)`.

**Files to modify**:

- `pipeline-canvas.tsx` — Add group/ungroup actions. Track multi-selection via `onSelectionChange`. "Group" button when 2+ selected. Register `group` in `nodeTypes`.
- `types/pipeline.ts` — Add `'group'` to `PipelineNodeType`. Add `parentId?` and `extent?: 'parent'` to `NodeSpec`.

**Approach**:

1. Group creates encompassing node, sets `parentId` on children, converts to relative positions.
2. Collapse: hide children, show summary badge, reroute edges to group.
3. Uses React Flow's native sub-flow support.

---

## Enhancement #11: Copy/paste nodes

**Files to create**:

- `apps/dashboard/src/lib/canvas/clipboard.ts` — `copyNodes(selected, edges): ClipboardData` and `pasteNodes(clipboard, offset): { nodes, edges }`.

**Files to modify**:

- `pipeline-canvas.tsx` — Add Ctrl+C/V in keyboard handler. Track selection via `onSelectionChange`. On copy: serialize selected nodes + internal edges to ref. On paste: clone with new IDs, offset by (20,20). Also support Ctrl+D for duplicate.

---

## Enhancement #12: Pipeline version history

**DB**: Add `pipelineVersions` table: `{ id, agentId, version (int), nodes (jsonb), edges (jsonb), createdBy, message, createdAt }`.

**Files to create**:

- `packages/db/src/schema.ts` (modify) — Add `pipelineVersions` table.
- `packages/server/src/routes/pipeline-versions.ts` — CRUD: GET list, POST create, GET specific.
- `apps/dashboard/src/components/canvas/version-history-panel.tsx` — Side panel showing version list. Click to preview, "Restore" to revert.
- `apps/dashboard/src/lib/canvas/pipeline-diff.ts` — Diff two `PipelineConfig` objects: added/removed/modified nodes and edges.

**Files to modify**:

- `split-canvas.tsx` — Add "History" button to open version panel.
- `use-auto-save.ts` — After explicit saves (or every 5th auto-save), create version snapshot.
- `packages/client/src/index.ts` — Add `pipelineVersions` API methods.

---

## Enhancement #13: Right-click context menu

**New dependency**: `@radix-ui/react-context-menu`

**Files to create**:

- `apps/dashboard/src/components/ui/context-menu.tsx` — shadcn-style wrapper.
- `apps/dashboard/src/components/canvas/canvas-context-menu.tsx` — Three variants:
  - **Pane**: Add node (submenu), Paste, Auto-layout, Select all, Fit view
  - **Node**: Edit, Duplicate, Copy, Delete, Group (if multi-selected)
  - **Edge**: Add label, Delete edge

**Files to modify**:

- `pipeline-canvas.tsx` — Add `onNodeContextMenu`, `onEdgeContextMenu`, `onPaneContextMenu` handlers. Store context menu state and render conditionally.

---

## File Change Summary

| File                           | Enhancements                                          |
| ------------------------------ | ----------------------------------------------------- |
| `pipeline-canvas.tsx`          | #1, #2, #5, #6, #9, #10, #11, #13                     |
| `split-canvas.tsx`             | #1, #3, #7, #8, #12                                   |
| `canvas-chat-panel.tsx`        | #4                                                    |
| `chat-onboarding.tsx`          | #4                                                    |
| `config-drawer.tsx`            | #5                                                    |
| `node-palette.tsx`             | #8                                                    |
| `nodes/*.tsx` (all 10)         | #5, #9                                                |
| `types/pipeline.ts`            | #6, #10                                               |
| `canvas page.tsx`              | #3                                                    |
| `package.json`                 | #1 (dagre), #7 (resizable-panels), #13 (context-menu) |
| `packages/db/src/schema.ts`    | #12                                                   |
| `packages/server/src/routes/`  | #12                                                   |
| `packages/client/src/index.ts` | #12                                                   |

**New files**: ~15 across hooks, utilities, and components.

**New dependencies**: `@dagrejs/dagre`, `react-resizable-panels`, `@radix-ui/react-context-menu`.
