# MineEcho Product Positioning

MineEcho is not just another chat interface. It is a local-first assistant foundation for individuals and small teams, connecting memory, knowledge, skills, and context-cost control into one long-running loop.

In one sentence:

> MineEcho = remember the user + learn from knowledge + call skills and AI apps + reduce context cost with TokenLess.

## Remember, Learn, Use, Save

| Loop | What MineEcho Does | User Value |
|------|--------------------|------------|
| Remember | Conversations, meetings, skill usage, and knowledge interactions enter the memory system. | The assistant can recall what the user said, did, and preferred across sessions. |
| Learn | Imported documents become Wiki++ pages, graph nodes, chunks, and memory-alignment candidates. | Files become inspectable, searchable, reusable knowledge instead of passive RAG fragments. |
| Use | Skills and AI apps enter one registry and one routing surface. | AI apps stop being silos and can participate in chat and task workflows. |
| Save | TokenLess compresses tool output, document extraction, logs, and task results. | Long-running assistants avoid wasting context on repetitive or low-value text. |

## Memory System

MineEcho combines two complementary memory views:

- **Runtime memory:** Working, Short-term, and Long-term memory for active session context, daily interactions, user profile, preferences, and insights.
- **L0-L3 Memory Tree:** L0 raw memory chunks, L1 daily summaries, L2 weekly summaries, and L3 monthly archives.

When a user asks a question, MineEcho recalls relevant memory by combining keyword matching, Chinese semantic aliases, local semantic vectors, importance, recency decay, and optional embedding reranking. The final prompt receives relevant L0/L1/L2 evidence within a context budget instead of blindly injecting all history.

## Wiki++ Knowledge Base

Wiki++ is designed as a higher-density knowledge layer rather than a simple vector chunk store.

| Layer | Content | Purpose |
|-------|---------|---------|
| raw | Uploaded files, URL imports, extracted source text | Preserve source evidence. |
| wiki | LLM-maintained Markdown pages | Create readable and maintainable knowledge pages. |
| chunks | Heading, paragraph, and sentence-level retrieval units | Support vector and BM25 retrieval. |
| graph | Documents, concepts, entities, tags, and relations | Support neighborhood explanation and related discovery. |
| alignment | Memory-to-knowledge candidate links and commit history | Connect user history with imported knowledge. |

Query-time retrieval uses vector search, BM25, structured metadata search, and graph-neighborhood search, then fuses results to reduce dependence on any single retrieval channel.

## Skills and AI Apps

MineEcho treats native skills, imported skills, and registered AI apps as one capability layer.

- Native skills can be imported from JSON, ZIP, `.skill` packages, or URL sources.
- AI apps can be registered as RAG or workflow apps.
- AI apps generate Gateway-callable `call.js` handlers and become skill-like units.
- The router scores triggers, skill names, descriptions, categories, and mode evidence before returning candidate skills.

The goal is to make AI apps callable from chat and task context, not isolated pages that users must remember to open manually.

## TokenLess

TokenLess is MineEcho's scenario-aware context compression layer. It currently includes built-in reducers for git, npm, cargo, docker, document extraction, and generic long output.

It is not blind truncation. TokenLess keeps errors, counts, head/tail context, important lines, and actionable summaries while dropping repeated or low-signal text.

Estimated savings vary by output shape:

| Scenario | Estimated Token Savings |
|----------|-------------------------|
| `git status` | 40%-70% |
| `git diff` | 50%-85% |
| test logs | 30%-75% |
| `docker logs` | 40%-80% |
| document extraction | 35%-80% |
| generic fallback | 20%-60% |

MineEcho records raw/reduced character counts and estimated tokens saved locally, so real workload measurements can replace estimates over time.

## Positioning

| Product Shape | Common Strength | Common Gap | MineEcho Difference |
|---------------|-----------------|------------|---------------------|
| Chat UI | Fast conversation | No durable memory or capability routing | Memory tree + knowledge + skill routing |
| RAG app | Answers from documents | Passive retrieval and isolated chunks | Wiki++ + graph + memory alignment |
| Agent framework | Tool execution | Noisy outputs and high context cost | TokenLess reducers and local metrics |
| AI app portal | Central app list | Apps become isolated silos | AI apps become callable skills |

MineEcho's release goal is a local-first Memory OS for personal assistants: transparent enough to inspect, flexible enough to extend, and conservative enough to keep user data local by default.
