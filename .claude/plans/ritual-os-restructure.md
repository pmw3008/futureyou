# FutureYou: Daily Identity Operating System Restructure

Transform the app from browsable tabs into a guided daily ritual system.

---

## Phase 1: Daily Ritual State System (Foundation)

Everything depends on a new state layer that tracks daily ritual progress, evidence entries, and content assignments.

### 1a. New types (`src/types/index.ts`)

Add:
```ts
// Daily ritual step tracking
interface DailyRitual {
  date: string; // "YYYY-MM-DD"
  steps: {
    visualization: boolean;
    affirmation: boolean;
    standard: boolean;
    evidence: boolean;
    futureSelf: boolean;
  };
}

// Evidence entry
interface EvidenceEntry {
  id: string;
  date: string;
  type: "manifestation" | "synchronicity" | "identity-proof" | "courage-action";
  title: string;
  body: string;
  photoUri?: string;
}

// Today's standard (set each morning)
interface DailyStandard {
  date: string;
  focus: string;    // "What I'm focused on today"
  action: string;   // "One thing I will do"
  standard: string; // "The standard I'm holding"
  reframe: string;  // "If I feel doubt, I'll remember..."
}

// Content assignment (which viz/affirmation is "today's")
interface DailyAssignment {
  date: string;
  visualizationId: string;
  affirmationSetId: string;
}
```

### 1b. New context: `src/context/RitualContext.tsx`

- Stores `DailyRitual`, `EvidenceEntry[]`, `DailyStandard`, `DailyAssignment`
- Persists all to AsyncStorage
- Auto-resets ritual steps when date changes (new day = fresh ritual)
- Methods: `completeStep(step)`, `addEvidence(entry)`, `setStandard(standard)`, `getCompletedCount()`, `getTodayAssignment()`
- Content assignment logic: rotate visualizations/affirmations based on day index + vibe

### 1c. Content config files

- **`src/config/visualizations.ts`** — Move all hardcoded visualizations here. Add `vibeTag` to each so identity can influence assignment.
- **`src/config/affirmations.ts`** — Move all hardcoded affirmation sets here. Add `vibeTag` field.
- Both files export arrays + a `getAssignedForToday(vibe, date)` function that deterministically picks today's content.

**Files to create:** `src/context/RitualContext.tsx`, `src/config/visualizations.ts`, `src/config/affirmations.ts`
**Files to modify:** `src/types/index.ts`, `App.tsx` (wrap with RitualProvider)

---

## Phase 2: Today Screen — Guided Ritual Sequence

Complete rewrite of `src/screens/TodayScreen/index.tsx`.

Replace the current dashboard with a **5-step guided ritual**:

### Step 1: Morning Visualization
- Shows today's assigned visualization title + description
- CTA: "Begin Visualization" → opens player
- Completion: auto-marks when player finishes OR user taps "Done"
- Completed state: checkmark + "Completed" with muted styling

### Step 2: Speak Today's Loop
- Shows today's assigned affirmation set title
- CTA: "Speak Loop" → plays affirmation loop inline
- Completion: marks when loop finishes

### Step 3: Set Today's Standard
- Four fields: focus, action, standard, reframe
- CTA: "Set My Standard" → opens inline form
- Completion: marks when all 4 fields are filled and saved

### Step 4: Log Evidence Tonight
- Prompt: "What shifted today?"
- CTA: "Log Evidence" → opens evidence input (type selector, text, optional photo)
- Completion: marks when at least one entry is logged today

### Step 5: Ask Future Self Before Bed
- Quick-prompt chip or text input
- CTA: "Ask a Question" → navigates to chat or opens inline chat
- Completion: marks when user sends at least one message

### UI Structure:
- Greeting + identity statement at top (keep current)
- Progress indicator: "3 of 5 rituals complete" with 5 dots/circles
- Each step is a card with: step number, title, one-line description, CTA button, completion state
- Completed steps collapse to a single line with checkmark
- Current (next uncompleted) step is expanded/highlighted with warm glow
- Steps below current are visible but dimmed

**Files to modify:** `src/screens/TodayScreen/index.tsx` (full rewrite)

---

## Phase 3: Evidence Tab

Add Evidence as a core tab. Restructure `src/screens/EvidenceScreen/index.tsx`.

### Changes to navigation:
- **`src/navigation/TabNavigator.tsx`** — Change 5 tabs to: Today, Visualize, Evidence, Affirm, Identity
- Future Self (Chat) moves to accessible from Today screen step 5 + a button on Identity screen
- Import EvidenceScreen

### Evidence screen rebuild:
- **Log section** at top:
  - Type selector: 4 chips (Manifestation, Synchronicity, Identity Proof, Courage/Action)
  - Title input
  - Body text area
  - Optional photo button
  - "Log Evidence" CTA
  - On submit: saves to RitualContext, marks today's evidence step complete
- **Timeline** below:
  - Grouped by date
  - Each entry shows: type chip, title, body preview, date
  - Expandable entries
- **Streak bar** at top:
  - Current streak count
  - Last 7 days dot visualization
  - "X of last 7 days" caption

**Files to modify:** `src/screens/EvidenceScreen/index.tsx` (major rewrite), `src/navigation/TabNavigator.tsx`, `src/screens/index.ts`

---

## Phase 4: Visualize — Today's Assignment + Library

Restructure `src/screens/VisualizeScreen/index.tsx`.

### New layout:
1. **Today's Visualization** (prominent hero section):
   - Large card with warm glow background
   - Title, description, "why this one" line based on identity/vibe
   - Listen / Read buttons
   - Completion state if already done today
   - "Assigned based on your [vibe label] energy"

2. **Divider: "Explore More"**

3. **Library** (compact list below):
   - All other visualizations in smaller cards
   - Save/favorite toggle
   - Duration label
   - Tap to play

**Files to modify:** `src/screens/VisualizeScreen/index.tsx`

---

## Phase 5: Affirm — Repetition Engine

Restructure `src/screens/AffirmationsScreen/index.tsx`.

### New layout:
1. **Today's Loop** (hero section):
   - Prominent card with "Today's Assigned Loop" label
   - Shows affirmation set title + count
   - Big "Speak Loop" CTA with completion state
   - "Assigned based on your identity" subtitle

2. **Quick Play** section:
   - Horizontal row of small loop cards (all available sets)
   - Tap to play immediately

3. **Favorites** section:
   - Saved/favorited loops
   - Quick-play buttons

4. **Bedtime Loop** section:
   - A calming affirmation set specifically tagged for evening
   - "Wind down with these before sleep"

5. **Custom Loop Builder** (keep existing "Create Your Own" card)

6. **Guide badge** stays at top (already working)

**Files to modify:** `src/screens/AffirmationsScreen/index.tsx`

---

## Phase 6: Future Self — Actionable Coaching

Modify `src/screens/ChatScreen/index.tsx` and `src/utils/index.ts` (system prompt).

### Changes:
1. **Restructure system prompt** (`buildSystemPrompt`):
   - Include today's standard (focus/action/standard/reframe) if set
   - Include recent evidence entries for context
   - Add instruction: "Always respond with: one focus, one action, one standard to hold, one reframe. Be specific. Reference the user's identity statement and goals. No generic comfort."

2. **Update quick prompts** to be more actionable:
   - "What's my one focus right now?"
   - "Give me tonight's reframe"
   - "How do I hold my standard today?"
   - "What evidence should I look for?"

3. **Add context banner** at top showing today's standard if set:
   - "Today's focus: [focus]"
   - Makes chat feel connected to the daily ritual

**Files to modify:** `src/screens/ChatScreen/index.tsx`, `src/utils/index.ts`

---

## Phase 7: Identity Drives Content

Modify content assignment to use identity data.

### Changes to `src/config/visualizations.ts` and `src/config/affirmations.ts`:
- Each visualization/affirmation set gets `vibeTags: VibeOption[]`
- Assignment function prioritizes content matching user's vibe
- Add identity-aware prompts to evidence screen: "As someone pursuing [goal], what proof did you see today?"

### Changes to `src/context/RitualContext.tsx`:
- `getAssignment()` reads profile vibe from UserProfileContext
- Rotates through vibe-matched content first, then others

### Changes to Today screen:
- Show "why" context on each step: "Based on your Bold Energy vibe" / "Connected to: Build a creative studio"

**Files to modify:** `src/config/visualizations.ts`, `src/config/affirmations.ts`, `src/context/RitualContext.tsx`

---

## Phase 8: Polish & Clarity

- **Tab icons** — Add simple text-based icons to tab bar (◉ Today, ◎ Visualize, ◈ Evidence, ◇ Affirm, ◆ Identity)
- **Step numbering** — Clear "1 of 5", "2 of 5" labeling on Today screen
- **Progress persistence** — Verify AsyncStorage saves/loads correctly on app restart
- **Warm glow distribution** — RadialGlow strongest on Today + player, lighter on Evidence/Affirm, minimal on Identity

**Files to modify:** `src/navigation/TabNavigator.tsx`, `src/components/ScreenContainer.tsx`

---

## Implementation Order & Dependencies

```
Phase 1 (Foundation) → required by everything
  ↓
Phase 2 (Today) → uses RitualContext
Phase 3 (Evidence) → uses RitualContext
  ↓ (can be parallel)
Phase 4 (Visualize) → uses content configs from Phase 1
Phase 5 (Affirm) → uses content configs from Phase 1
  ↓ (can be parallel)
Phase 6 (Future Self) → uses RitualContext for standard/evidence
Phase 7 (Identity drives content) → connects identity to assignments
  ↓
Phase 8 (Polish)
```

## Files Summary

**New files (3):**
- `src/context/RitualContext.tsx`
- `src/config/visualizations.ts`
- `src/config/affirmations.ts`

**Major rewrites (3):**
- `src/screens/TodayScreen/index.tsx`
- `src/screens/EvidenceScreen/index.tsx`
- `src/screens/AffirmationsScreen/index.tsx`

**Significant modifications (5):**
- `src/types/index.ts`
- `src/navigation/TabNavigator.tsx`
- `src/screens/VisualizeScreen/index.tsx`
- `src/screens/ChatScreen/index.tsx`
- `src/utils/index.ts` (system prompt)

**Minor modifications (2):**
- `App.tsx`
- `src/screens/index.ts`
