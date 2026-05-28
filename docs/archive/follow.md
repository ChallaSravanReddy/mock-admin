Perfect. Now I have everything I need. Let me map the exact inconsistencies before writing Cursor instructions.Now here are the exact Cursor instructions, grounded in real file paths and component names.

---

## Cursor instructions — paste these in order

### Step 1 — Read before touching anything

```
Open @src/admin/Pages/MockTestViewer.tsx

Read the following sections carefully before making any changes:
1. L41–85: PuzzleQuestion component — note it has NO timer, NO feedback display
2. L86–130: SwitchQuestion — has timeDuration countdown, has correct/wrong feedback
3. L313–550: GridChallengeQuestion — timer is phase-scoped (highlightDurationMs), not a global challenge timer
4. L551–649: InductiveQuestion — has displayDurationMs but renders it differently from SwitchQuestion's countdown
5. L650–943: MotionQuestion — has timeDurationSeconds, renders a move counter not a timer bar
6. L1007–1100: MockTestViewer — the shell that wraps all five, note what state it holds at this level vs inside each component

Do not edit yet. List the exact state variables and JSX elements each component uses for: (a) timer display, (b) progress display, (c) submit/advance action.
```

---

### Step 2 — Create a shared chrome component

```
In @src/admin/Pages/MockTestViewer.tsx, ABOVE the PuzzleQuestion component definition, add a new component called ChallengeShell.

Props interface:
  - title: string
  - questionNumber?: number       // e.g. 2
  - totalQuestions?: number       // e.g. 5
  - timeRemaining?: number        // seconds remaining, undefined = no timer shown
  - totalTime?: number            // seconds total, used to calc progress bar width
  - onTimeout?: () => void        // called when timeRemaining hits 0
  - children: React.ReactNode

Behavior:
  - If timeRemaining and totalTime are provided, show a horizontal progress bar at the TOP using existing gray/blue Tailwind classes already in this file (bg-gray-200, bg-blue-600). Bar width = (timeRemaining / totalTime) * 100 + '%'. When timeRemaining < 10, change bar color to bg-red-500.
  - If questionNumber and totalQuestions are provided, show "Question {questionNumber} of {totalQuestions}" in text-sm text-gray-500 top-right.
  - The title goes below the bar, same styling as each component currently uses for its own heading.
  - children renders below the title.
  - Use only Tailwind utilities already present in this file. Do not import anything new.

Do not change any existing component yet.
```

---

### Step 3 — Add timer logic hook

```
In @src/admin/Pages/MockTestViewer.tsx, add a hook called useCountdown directly above ChallengeShell.

Signature: function useCountdown(totalSeconds: number | undefined, onExpire: () => void)
Returns: { timeRemaining: number | undefined, resetTimer: () => void }

Implementation:
  - If totalSeconds is undefined, return { timeRemaining: undefined, resetTimer: () => {} }
  - Use useEffect + setInterval to count down from totalSeconds
  - Call onExpire when it hits 0, clear the interval
  - resetTimer restarts from totalSeconds
  - Use useRef to track the interval so cleanup works correctly on unmount

Do not use any library. Do not create a new file.
```

---

### Step 4 — Wrap PuzzleQuestion in ChallengeShell

```
In @src/admin/Pages/MockTestViewer.tsx, update PuzzleQuestion only:

1. Add useCountdown(undefined, () => {}) — Puzzle has no timer in its type definition (@src/admin/types/puzzle.ts). Pass timeRemaining={undefined} to ChallengeShell so no bar renders.
2. Wrap its return JSX in <ChallengeShell title="..." questionNumber={...} totalQuestions={...} timeRemaining={undefined}>
3. Pull the title from q.prompt or q.description if present, otherwise "Choose the missing symbol".
4. For questionNumber/totalQuestions: these come from q.sequence and a totalCount prop — check how MockTestViewer calls PuzzleQuestion at L1084 and pass those values through.
5. After the user selects an answer and clicks submit, show a feedback line: if correct, "Correct! +{points} pts" in text-green-600; if wrong, "Incorrect" in text-red-500. Match the pattern already used in SwitchQuestion for this.

Keep all existing puzzle grid and option rendering exactly as-is. Only add the shell wrapper and feedback line.
```

---

### Step 5 — Normalize SwitchQuestion

```
In @src/admin/Pages/MockTestViewer.tsx, update SwitchQuestion:

1. Replace its current custom timer bar JSX with <ChallengeShell> passing:
   - timeRemaining and totalTime from useCountdown(q.timeDuration, handleTimeout)
   - questionNumber and totalQuestions same as Puzzle step above
2. The existing correct/wrong feedback text is fine — keep it, just move it inside ChallengeShell children.
3. Remove any duplicate heading/title JSX that ChallengeShell now renders.

The game logic (symbol display, option buttons, answer checking) must not change.
```

---

### Step 6 — Normalize InductiveQuestion

```
In @src/admin/Pages/MockTestViewer.tsx, update InductiveQuestion:

Current situation: it uses displayDurationMs (milliseconds) differently from Switch's timeDuration (seconds).

1. Convert: const totalSeconds = Math.round((q.displayDurationMs ?? 30000) / 1000)
2. Use useCountdown(totalSeconds, handleTimeout)
3. Wrap in <ChallengeShell> with timeRemaining, totalTime={totalSeconds}, questionNumber, totalQuestions
4. Add the same correct/wrong feedback pattern after submission (currently missing — check @src/admin/types/inductiveChallenge.ts for correctOptionIds to validate the two selected options).

Do not change the 3×3 grid rendering or option selection logic.
```

---

### Step 7 — Normalize GridChallengeQuestion

```
In @src/admin/Pages/MockTestViewer.tsx, update GridChallengeQuestion:

Grid has two timers: phase timer (dot highlight duration) and overall challenge timer. Keep both but separate them:

1. The phase timer (highlightDurationMs) stays INTERNAL — it drives the dot phase and symmetry phase transitions. Do not touch this logic.
2. Add an OVERALL challenge timer using useCountdown(totalSeconds, handleTimeout) where totalSeconds comes from q.totalRounds * 30 (reasonable default since GridChallengeGame has no top-level timeDuration — confirm by checking @src/admin/types/gridChallenge.ts before hardcoding).
3. Wrap in <ChallengeShell> showing overall timeRemaining and round progress: questionNumber={currentRound} totalQuestions={q.totalRounds}
4. The phase-specific UI (dot canvas, symmetry grids) stays exactly as-is inside ChallengeShell children.
```

---

### Step 8 — Verify MotionQuestion (least changes needed)

```
In @src/admin/Pages/MockTestViewer.tsx, update MotionQuestion:

Motion already has timeDurationSeconds and level progress. Minimal work:

1. Replace its custom timer display with useCountdown(q.timeDurationSeconds, handleTimeout) + ChallengeShell
2. Pass questionNumber={currentLevel} totalQuestions={q.levelsData.length}
3. Keep the move counter (moves remaining) as-is INSIDE ChallengeShell children — it's game-specific, not chrome.
4. Confirm q.timeDurationSeconds exists by checking @src/admin/services/mockTestService.ts getQuestionsForTest Motion mapping before assuming the field name.
```

---

### Final check

```
After all five components are wrapped in ChallengeShell:

1. In MockTestViewer's renderQuestion() (~L1084), verify each case still passes the right props — nothing should be undefined that wasn't before.
2. Run the viewer at /admin/mock-tests/:id/view with a test that has all 5 game types linked. Confirm:
   - Every challenge shows the same top bar (timer + question counter)
   - Timer bar color turns red under 10 seconds on Switch, Inductive, Motion
   - Puzzle and Grid show the bar only if a time is configured
3. Do NOT change ScoreScreen, MockTestViewer shell state, or getQuestionsForTest. Those are out of scope.
```

---

The key principle across all steps: `ChallengeShell` is the only new thing — everything else is the five existing components being told to use it instead of their own ad-hoc headers. No game logic moves, no files split, no new imports.