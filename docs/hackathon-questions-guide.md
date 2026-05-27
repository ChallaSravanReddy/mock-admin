# Hackathon / Gamified Aptitude — Question Guide

This document explains how to **add questions** in the admin app (Hackathon Studio and mock tests), which **fields** each question type needs, and what **candidates see** when they take the exam.

**Admin routes**

| Area | Route | Storage |
|------|--------|---------|
| Gamified aptitude bank | `/admin/hackathon` | Browser `localStorage` (`hackathon_studio_questions`) |
| Questions on a mock test | `/admin/mock-tests/:id` → **+ Add Questions** | Browser `localStorage` (`mock_test_questions_v1`) |

Both use the same **Add Question** modal (`AddQuestionModal`) and the same five challenge types.

---

## How to add a question (admin)

1. Open **Hackathon Studio** (`/admin/hackathon`) or a **mock test detail** page.
2. Click **+ Add Questions** (or **Create question** on an empty bank).
3. **Choose challenge type** — Puzzle, Switch, Grid, Inductive, or Motion.
4. **Choose mode**
   - **AI generate** — system fills payload; you can edit afterward.
   - **Manual** — opens the editor to set grid/symbols/answers yourself.
5. For AI: pick **how many** to generate (respects per-type limit).
6. For manual: fill **Title**, **Difficulty**, **Description**, type-specific fields, then **Save question**.

**Limits**

- Up to **20 questions per challenge type** per bank (hackathon) or per mock test.
- **Title** is required before save.

**After save (admin list)**

Each question appears in a round grouped by type. The card shows:

| Admin list field | Source |
|------------------|--------|
| Question text preview | `description` (fallback: `title`) |
| Marks | Computed per type (see below) |
| Sub-domain | Game type short label + difficulty (e.g. `Switch · Medium`) |
| Edit / Delete | Updates or removes the stored question |

---

## Fields shared by every question type

These apply to **all** hackathon questions (`HackathonQuestion`).

### Admin configures

| Field | Required | Purpose |
|-------|----------|---------|
| `id` | Auto | Unique ID (generated on create). |
| `type` | Yes | One of: `puzzle`, `switch_challenge`, `grid_challenge`, `inductive_challenge`, `motion_challenge`. |
| `title` | Yes | Internal/admin label; also used in player UI where noted. |
| `description` | Recommended | Prompt shown to the candidate (preview text in admin list). |
| `difficulty` | Yes | `easy` \| `medium` \| `hard` — shown in admin as sub-domain. |
| `source` | Auto | `ai` or `manual`. |
| `createdAt` / `updatedAt` | Auto | Timestamps. |
| `payload` | Yes | Type-specific game data (see sections below). |

### Candidate sees (common)

| Element | What they get |
|---------|----------------|
| Challenge shell | Question number (e.g. “Question 2 of 5”), title/prompt from `description` or `title`. |
| Timer | Only on types that define a time limit (Switch, Inductive, Motion; Grid uses per-phase timers). |
| Scoring feedback | Correct/incorrect and points where implemented in the viewer. |

**Default marks (admin list / scoring helpers)**

| Type | Default marks |
|------|----------------|
| Puzzle | 10 |
| Switch | `scoringRules.correctPoints` (default 3) |
| Grid | `scoringRules.correctPoints` (default 3) |
| Inductive | `scoringRules.correctPoints` (default 3) |
| Motion | `scoringRules.correctPoints` (default 4) |

---

## 1. Puzzle (`puzzle`)

Matrix reasoning: one cell is missing; pick the symbol that completes the pattern.

### Admin — payload fields

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `gridSize` | number | Yes | Usually 3–4. |
| `grid` | `SymbolType[][]` | Yes | Full matrix; missing cell is `null`. |
| `missingCell` | `{ row, col }` | Yes | Which cell shows `?`. |
| `options` | `SymbolType[]` | Yes | Typically 4 choices. |
| `correctAnswer` | `SymbolType` | Yes | Must match one option. |
| `difficulty` | easy/medium/hard | Yes | Also on meta; duplicated in payload for puzzle legacy. |

**Symbols:** `circle`, `square`, `triangle`, `star`, `pentagon`.

**Manual editor tools:** set missing cell, paint cells with symbol picker, set each option, pick correct answer, **Auto-fill grid**.

### Candidate experience

| Sees | Does not see |
|------|----------------|
| Symbol grid with `?` in missing cell | Full admin title if different from prompt |
| Four (or more) symbol options | Which symbol is “correct” until after submit |
| Prompt from `description` / title | Grid editing controls |
| Submit → correct/incorrect feedback | Per-question countdown (no timer on puzzle in viewer) |

---

## 2. Switch Challenge (`switch_challenge`)

Decode how bottom symbols map to top symbols; pick the correct **ordering code**.

### Admin — payload fields

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `title` | string | Yes | Shown in player shell. |
| `description` | string | Yes | Instructions. |
| `difficulty` | easy/medium/hard | Yes | |
| `timeDuration` | number (seconds) | Yes | Countdown (e.g. 20–25). |
| `inputSymbols` | `SymbolCode[]` | Yes | Top row, **4–8** symbols, order matters. |
| `outputSymbols` | `SymbolCode[]` | Yes | Bottom row, same length as input. |
| `correctAnswerCode` / `correctOption` | string | Yes | e.g. `"3142"` — position mapping. |
| `options` | `string[]` | Yes | Multiple codes to choose from (typically 4). |
| `scoringRules.correctPoints` | number | Yes | Default 3. |
| `scoringRules.wrongPoints` | number | Yes | Default -1. |

**Symbols:** `circle`, `square`, `triangle`, `cross`, `star`, `pentagon`, `hexagon`, `diamond`.

**Manual editor tools:** input/output symbol rows (visual + comma-separated), time limit, answer codes, correct code dropdown, **New symbol set**.

### Candidate experience

| Sees | Does not see |
|------|----------------|
| Top input row and bottom output row of symbols | Internal `correctAnswerCode` until feedback |
| Multiple numeric code buttons | Raw comma-separated admin input |
| Countdown bar (`timeDuration`) | Wrong-answer code breakdown before submit |
| “What is the ordering code?” | |

---

## 3. Grid Challenge (`grid_challenge`)

Alternating **dot memory** and **symmetry** mini-rounds.

### Admin — payload fields

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `title` | string | Yes | |
| `description` | string | Yes | |
| `difficulty` | easy/medium/hard | Yes | |
| `totalRounds` | number | Yes | Usually 3 (admin can set 1–10). |
| `rounds[]` | `GridChallengeRound[]` | Yes | One object per round. |
| `symmetryDisplayMs` | number | Optional | How long symmetry grids show (default ~6000 ms). |
| `scoringRules` | correct/wrong points | Yes | Default +3 / -1. |

**Each round (`GridChallengeRound`)**

| Sub-field | Purpose |
|-----------|---------|
| `dotPhase.dots[]` | Dot positions (`x`, `y` %), `isTarget` flags. |
| `dotPhase.targetDotId` | Which dot blinks (must remember). |
| `dotPhase.highlightDurationMs` | Blink duration (default 2000). |
| `symmetryPhase.gridLeft` / `gridRight` | 5×5 boolean grids (filled vs empty). |
| `symmetryPhase.isSymmetric` | Correct answer: symmetric or not. |
| `symmetryPhase.label` | Optional prompt (e.g. “Is it Symmetric?”). |

**Manual editor tools:** round count, per-round preview, **Regenerate all rounds**.

### Candidate experience

| Sees | Does not see |
|------|----------------|
| Scattered dots; one target blinks | Which dot is target until memory phase ends |
| Then left/right 5×5 patterns | Admin round IDs |
| Yes/No (or similar) for symmetry | Full round editor |
| Phase timers driven by `highlightDurationMs` / `symmetryDisplayMs` | |

---

## 4. Inductive Challenge (`inductive_challenge`)

Learn a rule from an example pair (Grid A → Grid B), then pick **two** answer grids that follow the same rule.

### Admin — payload fields

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `title` | string | Yes | |
| `description` | string | Yes | |
| `difficulty` | easy/medium/hard | Yes | |
| `questions[]` | `InductiveChallengeQuestion[]` | Yes | Studio editor focuses on **first** question. |
| `scoringRules` | correct/wrong points | Yes | Default +3 / -1. |

**Each inductive question**

| Sub-field | Purpose |
|-----------|---------|
| `examplePair.gridA` / `gridB` | 3×3 shape grids demonstrating the rule. |
| `options[]` | Four options (`A`–`D`), each a 3×3 `ShapeGrid`. |
| `correctOptionIds` | **Exactly two** correct option IDs. |
| `options[].isCorrect` | Synced with `correctOptionIds`. |
| `rule` | Admin-only note (not shown to player). |
| `displayDurationMs` | Time to answer (default 30000). |

**Shapes:** `square`, `circle`, `triangle`, `cross`.  
**Colors:** `green`, `purple`, `blue`, `red`, `orange`.

**Manual editor tools:** example pair preview, mark two options correct, **New pattern**.

### Candidate experience

| Sees | Does not see |
|------|----------------|
| Grid A → Grid B example | Admin `rule` text |
| Four option grids | Which two are correct until submit/timeout |
| Timer from `displayDurationMs` | |
| Instruction to select two matching patterns | |

---

## 5. Motion Challenge (`motion_challenge`)

Slide colored blocks so the **red ball** reaches the **hole** within a move limit.

### Admin — payload fields

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `title` | string | Yes | |
| `description` | string | Yes | |
| `difficulty` | easy/medium/hard | Yes | |
| `levels[]` | `MotionChallengeLevel[]` | Yes | 1–5 levels in manual editor. |
| `timeDurationSeconds` | number | Yes | Overall challenge time (default 240). |
| `scoringRules` | correct/wrong points | Yes | Default +4 / -1. |

**Each level**

| Sub-field | Purpose |
|-----------|---------|
| `rows` / `cols` | Grid size (default 6×4). |
| `grid[][]` | Each cell: `empty`, `ball`, `hole`, `blocked`, or `colored` (+ `color`). |
| `maxMoves` | Move budget for the level. |
| `label` | e.g. “Level 1” (admin). |

**Manual editor tools:** level count, time limit, per-level grid preview; AI uses quick generator (avoids UI freeze).

### Candidate experience

| Sees | Does not see |
|------|----------------|
| Playable grid (ball, hole, blocks) | Admin cell IDs |
| Moves used vs `maxMoves` | |
| Optional overall timer (`timeDurationSeconds`) | |
| Success / out-of-moves messages | Solution path |

---

## Admin vs candidate — quick comparison

| Concern | Admin | Candidate |
|---------|--------|-----------|
| **Where** | Hackathon Studio or mock test detail | Mock test preview `/admin/mock-tests/:id/view` or live exam |
| **Grouping** | Rounds by game type (Round 1 Puzzle, …) | Same order if test enables those types |
| **Text** | Title + description + optional `rule` (inductive) | Description/title as prompt; no `rule` |
| **Answers** | Full payload, correct codes, grids | Interactive UI only; feedback after action |
| **Timing** | Sets seconds/ms in payload | Sees countdown / phase timers |
| **Marks** | Listed on question card | Points on correct/wrong where wired |
| **Limits** | 20 per type | N/A |
| **Persistence** | localStorage in browser | Answers in session during preview |

---

## AI vs manual (admin)

| Mode | Admin effort | Best for |
|------|----------------|----------|
| **AI generate** | Low; review in list or open edit | Bulk fill, prototypes, demos |
| **Manual** | High; full control of grids/symbols/codes | Production content, fixed answers |

After AI generation, use **Edit** (pencil) to open the same manual editor and adjust any field above.

---

## Related code (for developers)

| Piece | Path |
|-------|------|
| Question union type | `src/admin/types/hackathon.ts` |
| Game type labels | `src/admin/constants/gameTypes.ts` |
| Add flow UI | `src/admin/components/hackathon/AddQuestionModal.tsx` |
| Manual fields | `src/admin/components/hackathon/ManualQuestionEditor.tsx` |
| AI templates | `src/admin/lib/hackathonGenerators.ts` |
| Hackathon store | `src/admin/store/hackathonStore.ts` |
| Player rendering | `src/admin/Pages/MockTestViewer.tsx` |
| Admin question cards | `src/admin/components/mockTest/AssessmentQuestionCard.tsx` |

---

## Checklist before publishing a mock test

1. Each enabled round type has at least one question (or candidates see an empty section).
2. Every question has a **title** and a clear **description** for the candidate.
3. **Correct answers** are set (symbol, code, symmetry flag, two inductive options, solvable motion grid).
4. **Timers** are realistic (Switch / Inductive / Motion / Grid phases).
5. Question count and **total marks** on the assessment header look correct.
6. Use **Preview exam** to walk through as a candidate.
