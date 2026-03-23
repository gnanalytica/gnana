# Gnana Canvas Redesign — Design Specification

## Vision

Replace the fixed 6-node pipeline visualization with an AI-first, free-form agent builder. Users start in a conversational interface that generates a visual pipeline, then refine it on a full DAG canvas. The AI and canvas are bidirectional — changes in one are reflected in the other.

---

## User Flow

### Phase 1: Chat Onboarding (full-screen)

User lands on a clean, full-screen chat interface when creating a new agent.

```
┌─────────────────────────────────────────────┐
│                                             │
│          ⬡ Build Your Agent                │
│                                             │
│   Describe what you want your agent to do   │
│   and I'll build it for you.                │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │ Start from a template...            │   │
│   └─────────────────────────────────────┘   │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │ "Monitor GitHub PRs for my repo     │   │
│   │  and post summaries to Slack..."    ▶│   │
│   └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

**Chat behavior:**

- AI asks 2-3 clarifying questions (what triggers it, what tools it needs, approval required?)
- AI generates the agent config: name, system prompt, model selection, tools, pipeline structure
- Shows a summary card: "Here's what I built" with key details
- "Open in Canvas" button transitions to Phase 2

**Template shortcut:**

- "Start from a template" shows a grid of template cards
- Selecting one pre-fills the chat with the template's description
- AI confirms and generates the pipeline
- Templates: PM Analyst, Code Reviewer, Report Generator, Support Agent, Data Analyst, Custom

### Phase 2: Canvas + Chat (split view)

After the AI generates the pipeline, the view transitions to a split layout:

```
┌──────────────────────────────────┬──────────────┐
│                                  │    Chat      │
│         Canvas (DAG)             │              │
│                                  │  AI: I've    │
│   [Trigger] → [Analyze]         │  built your  │
│                  ↓               │  pipeline... │
│              [Plan]              │              │
│                ↓                 │  You: Add a  │
│          [Approval Gate]         │  Slack notif │
│                ↓                 │  after each  │
│            [Execute]             │  step        │
│                ↓                 │              │
│            [Output]              │  AI: Done!   │
│                                  │  I've added  │
│                                  │  3 Slack     │
│   ─────────────────────────────  │  nodes...    │
│   Node palette (drag to add)     │              │
│   [LLM] [Tool] [Gate] [Branch]  │  ┌────────┐  │
│                                  │  │ Type.. │  │
│                                  │  └────────┘  │
└──────────────────────────────────┴──────────────┘
```

**Layout:**

- Canvas takes ~70% width, chat panel ~30% (resizable)
- Chat panel is collapsible (full-screen canvas mode)
- On mobile: tabs to switch between canvas and chat
- Node palette at bottom of canvas for drag-and-drop

---

## Canvas Architecture

### Node Types

Extend the existing 6 node types to support free-form DAGs:

| Node           | Purpose                                       | Handles                               |
| -------------- | --------------------------------------------- | ------------------------------------- |
| **Trigger**    | Entry point (manual, webhook, cron, event)    | 1 output                              |
| **LLM**        | Call an LLM with a prompt                     | 1 input, 1 output                     |
| **Tool**       | Execute a specific tool/connector             | 1 input, 1 output                     |
| **Human Gate** | Pause for human approval/input                | 1 input, 1 output                     |
| **Condition**  | Branch based on a condition                   | 1 input, 2 outputs (true/false)       |
| **Loop**       | Repeat a sub-graph N times or until condition | 1 input, 1 body output, 1 done output |
| **Parallel**   | Run multiple branches simultaneously          | 1 input, N outputs                    |
| **Merge**      | Wait for multiple branches to complete        | N inputs, 1 output                    |
| **Transform**  | Transform/map data between nodes              | 1 input, 1 output                     |
| **Output**     | Terminal node, store result                   | 1 input                               |

### Node Configuration

Each node has a config panel (right-side drawer or inline):

**LLM Node:**

- Provider + model selector
- System prompt (with variables from upstream nodes)
- Temperature, max tokens
- Output format (text, JSON, structured)

**Tool Node:**

- Connector selector (GitHub, Slack, HTTP, etc.)
- Tool selector (from connector's tools)
- Input mapping (map upstream data to tool inputs)
- Output variable name

**Condition Node:**

- Condition expression (simple: field == value, or JavaScript)
- True/false labels

**Human Gate Node:**

- Approval message template
- Auto-approve conditions (optional)
- Timeout + default action

### Edge Behavior

- Click canvas background and drag to create an edge
- Edges snap to handles
- Animated edges show data flow direction
- Edge labels (optional) for condition outputs
- Delete edges by selecting + backspace
- Edges carry typed data (text, JSON, array) — validated on connection

### Node Palette

Bottom toolbar with draggable node types:

```
[+ LLM] [+ Tool] [+ Gate] [+ Branch] [+ Loop] [+ Parallel] [+ Merge] [+ Transform]
```

- Drag from palette to canvas to add
- Double-click to add at cursor position
- Keyboard shortcut: `L` for LLM, `T` for Tool, `G` for Gate, etc.

---

## AI Chat System

### Capabilities

The AI chat can:

1. **Generate pipelines** — "Build an agent that monitors GitHub PRs and posts to Slack"
2. **Modify pipelines** — "Add error handling after the execute step"
3. **Configure nodes** — "Use Claude Sonnet for the analysis step"
4. **Explain nodes** — "What does the condition node do?"
5. **Suggest improvements** — "How can I make this more reliable?"
6. **Debug issues** — "Why did my last run fail at the planning step?"

### Bidirectional Sync

**Chat → Canvas:**

- User types "add a Slack notification after approval"
- AI determines where to place the node, creates it, connects edges
- Canvas animates the addition (node fades in, edges draw)
- AI confirms: "Added a Slack notification node after the approval gate"

**Canvas → Chat:**

- User drags a new Tool node onto the canvas
- Chat shows: "I see you added a Tool node. Which connector should it use?"
- User configures via chat or via the node's config panel
- Either method updates both views

### AI Pipeline Generation

When the AI generates a pipeline from a description, it produces a structured spec:

```typescript
interface PipelineSpec {
  name: string;
  description: string;
  systemPrompt: string;
  nodes: NodeSpec[];
  edges: EdgeSpec[];
}

interface NodeSpec {
  id: string;
  type:
    | "trigger"
    | "llm"
    | "tool"
    | "humanGate"
    | "condition"
    | "loop"
    | "parallel"
    | "merge"
    | "transform"
    | "output";
  position: { x: number; y: number };
  data: Record<string, unknown>; // type-specific config
}

interface EdgeSpec {
  source: string;
  target: string;
  sourceHandle?: string;
  label?: string;
}
```

The AI uses a tool-call to generate this spec, which the canvas renders.

### LLM Integration

The chat uses the workspace's configured LLM providers. The chat itself is powered by an LLM with tool-calling:

**Tools available to the chat AI:**

- `generate_pipeline(description)` → PipelineSpec
- `add_node(type, config, afterNodeId?)` → NodeSpec
- `remove_node(nodeId)` → void
- `update_node(nodeId, config)` → void
- `add_edge(source, target)` → EdgeSpec
- `remove_edge(source, target)` → void
- `get_pipeline_state()` → PipelineSpec
- `suggest_improvements()` → string[]
- `explain_node(nodeId)` → string

---

## Data Model Changes

### Agent Definition Update

The current `AgentDefinition` assumes a fixed 4-phase pipeline. Update to support arbitrary DAGs:

```typescript
// Current (fixed pipeline)
interface AgentDefinition {
  systemPrompt: string;
  llm: { analysis: ModelConfig; planning: ModelConfig; execution?: ModelConfig };
  tools: ToolDefinition[];
  approval: "required" | "auto" | "conditional";
}

// New (free-form DAG)
interface AgentDefinition {
  systemPrompt: string;
  pipeline: {
    nodes: PipelineNode[];
    edges: PipelineEdge[];
  };
  defaultModel: ModelConfig; // fallback for nodes without explicit model
}
```

### Database Schema

The `agents` table already has `toolsConfig` (jsonb) and `llmConfig` (jsonb). Add a new `pipelineConfig` (jsonb) field to store the DAG:

```sql
ALTER TABLE agents ADD COLUMN pipeline_config jsonb DEFAULT '{}';
```

This stores the full node/edge graph. The `llmConfig` and `toolsConfig` become derived from the pipeline nodes.

---

## Implementation Phases

### Phase 1: Chat Onboarding + Pipeline Generation

- Full-screen chat interface for agent creation
- AI generates PipelineSpec from natural language
- Summary card with "Open in Canvas" transition
- Template selector in chat

### Phase 2: Free-form Canvas

- Replace fixed 6-node canvas with React Flow DAG editor
- Node palette with drag-and-drop
- Node config drawer (existing, extended)
- Add/remove/connect nodes
- Save pipeline to `pipelineConfig`

### Phase 3: Bidirectional Chat + Canvas

- Split-view layout (canvas + chat panel)
- Chat modifies canvas via tool calls
- Canvas changes reflected in chat context
- AI-assisted node configuration

### Phase 4: Advanced Node Types

- Loop, Parallel, Merge nodes
- Transform node with data mapping UI
- Condition node with expression builder
- Variables/data flow visualization between nodes

---

## Technical Stack

- **Canvas:** React Flow (@xyflow/react) — already in use
- **Chat UI:** Custom chat component with streaming
- **AI Backend:** Uses workspace's configured LLM provider via @gnana/core
- **Pipeline execution:** Update @gnana/core to execute arbitrary DAGs (currently hardcoded 4-phase)
- **Auto-layout:** dagre or elkjs for automatic node positioning when AI generates pipelines

---

## Success Criteria

1. A non-technical user can describe an agent in natural language and get a working pipeline in under 60 seconds
2. A technical user can build complex multi-branch pipelines with the visual canvas
3. Chat and canvas stay in sync — changes in either are immediately reflected
4. The generated pipelines are correct and executable by the @gnana/core runtime
5. The experience feels closer to Figma than to a typical workflow builder
