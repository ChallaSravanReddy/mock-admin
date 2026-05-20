-- ══════════════════════════════════════════════════════════════════════════════
--  MOCK APTITUDE PLATFORM — SUPABASE SCHEMA
--  Covers: Puzzle Builder, Switch Challenge, Grid Challenge,
--          Inductive Challenge, Motion Challenge + Mock Test system
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ENUMs ────────────────────────────────────────────────────────────────────
CREATE TYPE game_type AS ENUM (
  'puzzle',
  'switch_challenge',
  'grid_challenge',
  'inductive_challenge',
  'motion_challenge'
);

CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');

CREATE TYPE test_status AS ENUM ('draft', 'published', 'archived');

-- ─── Utility: auto-update updated_at ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ══════════════════════════════════════════════════════════════════════════════
--  1. PUZZLE BUILDER
--     Matrix grid with a missing cell. Player picks the correct symbol.
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE puzzle_questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  difficulty    difficulty_level NOT NULL DEFAULT 'medium',
  grid_size     INT  NOT NULL DEFAULT 3 CHECK (grid_size BETWEEN 2 AND 6),
  -- grid: 2-D array of symbol strings, e.g. [["circle","square"],["triangle",null]]
  grid          JSONB NOT NULL DEFAULT '[]',
  -- missing_cell: {row: int, col: int}
  missing_cell  JSONB NOT NULL DEFAULT '{}',
  -- options: array of symbol strings the player can pick from
  options       TEXT[] NOT NULL DEFAULT '{}',
  correct_answer TEXT NOT NULL,
  scoring_correct INT NOT NULL DEFAULT 3,
  scoring_wrong   INT NOT NULL DEFAULT -1,
  published     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_puzzle_updated_at
  BEFORE UPDATE ON puzzle_questions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
--  2. SWITCH CHALLENGE
--     Symbols in a top row → rearranged bottom row. Find the ordering code.
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE switch_challenge_games (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  description         TEXT,
  difficulty          difficulty_level NOT NULL DEFAULT 'medium',
  time_duration_sec   INT  NOT NULL DEFAULT 20 CHECK (time_duration_sec BETWEEN 10 AND 60),
  -- e.g. ['circle','square','triangle','cross']
  input_symbols       TEXT[] NOT NULL DEFAULT '{}',
  output_symbols      TEXT[] NOT NULL DEFAULT '{}',
  -- auto-computed code like '3142'
  correct_answer_code TEXT NOT NULL,
  -- four codes the player picks from
  options             TEXT[] NOT NULL DEFAULT '{}',
  correct_option      TEXT NOT NULL,
  scoring_correct     INT  NOT NULL DEFAULT 3,
  scoring_wrong       INT  NOT NULL DEFAULT -1,
  published           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_switch_updated_at
  BEFORE UPDATE ON switch_challenge_games
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ══════════════════════════════════════════════════════════════════════════════
--  3. GRID CHALLENGE
--     3 interleaved rounds: remember highlighted dot → judge symmetry.
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE grid_challenge_games (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 TEXT NOT NULL,
  description           TEXT,
  difficulty            difficulty_level NOT NULL DEFAULT 'medium',
  total_rounds          INT  NOT NULL DEFAULT 3 CHECK (total_rounds BETWEEN 1 AND 6),
  symmetry_display_ms   INT  NOT NULL DEFAULT 6000,
  scoring_correct       INT  NOT NULL DEFAULT 3,
  scoring_wrong         INT  NOT NULL DEFAULT -1,
  published             BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_grid_challenge_updated_at
  BEFORE UPDATE ON grid_challenge_games
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE grid_challenge_rounds (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id               UUID NOT NULL REFERENCES grid_challenge_games(id) ON DELETE CASCADE,
  round_order           INT  NOT NULL,
  -- Dot phase -----------------------------------------------------------------
  -- dots: [{id, x, y, isTarget}] — percentage coordinates
  dots                  JSONB NOT NULL DEFAULT '[]',
  target_dot_id         TEXT NOT NULL,
  highlight_duration_ms INT  NOT NULL DEFAULT 2000,
  -- Symmetry phase ------------------------------------------------------------
  -- 5×5 boolean[][] — true = filled square
  grid_left             JSONB NOT NULL DEFAULT '[]',
  grid_right            JSONB NOT NULL DEFAULT '[]',
  is_symmetric          BOOLEAN NOT NULL DEFAULT FALSE,
  symmetry_label        TEXT NOT NULL DEFAULT 'Is it Symmetric?',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_id, round_order)
);

CREATE INDEX idx_grid_rounds_game ON grid_challenge_rounds(game_id);

-- ══════════════════════════════════════════════════════════════════════════════
--  4. INDUCTIVE CHALLENGE
--     Two grids show a rule → pick which 2 of 4 option grids follow the same rule.
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE inductive_challenge_games (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  description         TEXT,
  difficulty          difficulty_level NOT NULL DEFAULT 'medium',
  display_duration_ms INT  NOT NULL DEFAULT 30000,
  scoring_correct     INT  NOT NULL DEFAULT 3,
  scoring_wrong       INT  NOT NULL DEFAULT -1,
  published           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_inductive_updated_at
  BEFORE UPDATE ON inductive_challenge_games
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE inductive_challenge_questions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id             UUID NOT NULL REFERENCES inductive_challenge_games(id) ON DELETE CASCADE,
  question_order      INT  NOT NULL,
  -- 3×3 ShapeGrid: each cell is null | {shape, color}
  grid_a              JSONB NOT NULL DEFAULT '[]',  -- example "before"
  grid_b              JSONB NOT NULL DEFAULT '[]',  -- example "after"
  -- four answer options
  option_a            JSONB NOT NULL DEFAULT '[]',
  option_b            JSONB NOT NULL DEFAULT '[]',
  option_c            JSONB NOT NULL DEFAULT '[]',
  option_d            JSONB NOT NULL DEFAULT '[]',
  -- e.g. ['A','C']
  correct_option_ids  TEXT[] NOT NULL DEFAULT '{}',
  rule_note           TEXT,   -- admin reference, never shown to players
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_id, question_order)
);

CREATE INDEX idx_inductive_q_game ON inductive_challenge_questions(game_id);

-- ══════════════════════════════════════════════════════════════════════════════
--  5. MOTION CHALLENGE
--     Slide coloured squares to create a path for the red ball into the hole.
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE motion_challenge_games (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 TEXT NOT NULL,
  description           TEXT,
  difficulty            difficulty_level NOT NULL DEFAULT 'medium',
  time_duration_sec     INT  NOT NULL DEFAULT 240,
  scoring_correct       INT  NOT NULL DEFAULT 4,
  scoring_wrong         INT  NOT NULL DEFAULT -1,
  published             BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_motion_updated_at
  BEFORE UPDATE ON motion_challenge_games
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE motion_challenge_levels (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id       UUID NOT NULL REFERENCES motion_challenge_games(id) ON DELETE CASCADE,
  level_order   INT  NOT NULL,
  label         TEXT,
  rows          INT  NOT NULL DEFAULT 6 CHECK (rows BETWEEN 3 AND 10),
  cols          INT  NOT NULL DEFAULT 4 CHECK (cols BETWEEN 3 AND 8),
  -- MotionGrid: rows × cols of {type, color?}
  grid          JSONB NOT NULL DEFAULT '[]',
  max_moves     INT  NOT NULL DEFAULT 10 CHECK (max_moves >= 1),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (game_id, level_order)
);

CREATE INDEX idx_motion_levels_game ON motion_challenge_levels(game_id);

-- ══════════════════════════════════════════════════════════════════════════════
--  MOCK TEST SYSTEM
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── Mock Tests ───────────────────────────────────────────────────────────────
CREATE TABLE mock_tests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 TEXT NOT NULL,
  description           TEXT,
  category              TEXT,
  difficulty            difficulty_level NOT NULL DEFAULT 'medium',
  status                test_status NOT NULL DEFAULT 'draft',
  duration_minutes      INT  NOT NULL DEFAULT 30 CHECK (duration_minutes >= 1),
  -- enabled game types for this test (subset of game_type enum values)
  enabled_game_types    TEXT[] NOT NULL DEFAULT '{}',
  -- derived count, updated by trigger
  total_questions       INT  NOT NULL DEFAULT 0,
  published             BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_mock_tests_updated_at
  BEFORE UPDATE ON mock_tests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Sections (one per game type per test) ───────────────────────────────────
CREATE TABLE mock_test_sections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mock_test_id    UUID NOT NULL REFERENCES mock_tests(id) ON DELETE CASCADE,
  game_type       game_type NOT NULL,
  section_order   INT  NOT NULL DEFAULT 1,
  title           TEXT,           -- e.g. "Puzzle Section"
  instructions    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (mock_test_id, game_type)  -- one section per game type per test
);

CREATE INDEX idx_sections_test ON mock_test_sections(mock_test_id);

-- ─── Questions (links section → game-specific question) ──────────────────────
--  question_ref_id points to the PK in the corresponding game table:
--    puzzle             → puzzle_questions.id
--    switch_challenge   → switch_challenge_games.id
--    grid_challenge     → grid_challenge_games.id
--    inductive_challenge→ inductive_challenge_games.id
--    motion_challenge   → motion_challenge_games.id
CREATE TABLE mock_test_questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id      UUID NOT NULL REFERENCES mock_test_sections(id) ON DELETE CASCADE,
  mock_test_id    UUID NOT NULL REFERENCES mock_tests(id) ON DELETE CASCADE,
  game_type       game_type NOT NULL,
  question_ref_id UUID NOT NULL,   -- FK enforced at app level (polymorphic)
  sequence_order  INT  NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (section_id, sequence_order)
);

CREATE INDEX idx_mtq_test    ON mock_test_questions(mock_test_id);
CREATE INDEX idx_mtq_section ON mock_test_questions(section_id);
CREATE INDEX idx_mtq_ref     ON mock_test_questions(question_ref_id);

-- Auto-update total_questions on mock_tests when questions are added/removed
CREATE OR REPLACE FUNCTION sync_total_questions()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE mock_tests
  SET total_questions = (
    SELECT COUNT(*) FROM mock_test_questions WHERE mock_test_id = COALESCE(NEW.mock_test_id, OLD.mock_test_id)
  )
  WHERE id = COALESCE(NEW.mock_test_id, OLD.mock_test_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_total_after_insert
  AFTER INSERT ON mock_test_questions
  FOR EACH ROW EXECUTE FUNCTION sync_total_questions();

CREATE TRIGGER trg_sync_total_after_delete
  AFTER DELETE ON mock_test_questions
  FOR EACH ROW EXECUTE FUNCTION sync_total_questions();

-- ══════════════════════════════════════════════════════════════════════════════
--  USER ATTEMPTS & ANSWERS
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE mock_test_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mock_test_id    UUID NOT NULL REFERENCES mock_tests(id) ON DELETE CASCADE,
  user_id         UUID,           -- references auth.users if Supabase Auth is enabled
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  total_score     INT NOT NULL DEFAULT 0,
  max_score       INT NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'in_progress'
                    CHECK (status IN ('in_progress','completed','abandoned'))
);

CREATE INDEX idx_attempts_test ON mock_test_attempts(mock_test_id);
CREATE INDEX idx_attempts_user ON mock_test_attempts(user_id);

CREATE TABLE mock_test_answers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id        UUID NOT NULL REFERENCES mock_test_attempts(id) ON DELETE CASCADE,
  mock_test_id      UUID NOT NULL REFERENCES mock_tests(id) ON DELETE CASCADE,
  section_id        UUID NOT NULL REFERENCES mock_test_sections(id),
  question_ref_id   UUID NOT NULL,
  game_type         game_type NOT NULL,
  -- flexible answer storage — shape depends on game type:
  --  puzzle: {"answer": "circle"}
  --  switch_challenge: {"answer": "3142"}
  --  grid_challenge: {"dotAnswers": ["dot-3","dot-7","dot-12"], "symmetryAnswers": [true,false,true]}
  --  inductive_challenge: {"questionId": "...", "selectedOptions": ["A","C"]}
  --  motion_challenge: {"levelId": "...", "moveCount": 8, "solved": true}
  answer            JSONB,
  is_correct        BOOLEAN,
  points_earned     INT NOT NULL DEFAULT 0,
  time_taken_sec    INT,
  answered_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_answers_attempt ON mock_test_answers(attempt_id);

-- ══════════════════════════════════════════════════════════════════════════════
--  VIEWS
-- ══════════════════════════════════════════════════════════════════════════════

-- Full test details with section + question counts
CREATE OR REPLACE VIEW v_mock_test_summary AS
SELECT
  t.id,
  t.title,
  t.description,
  t.category,
  t.difficulty,
  t.status,
  t.duration_minutes,
  t.enabled_game_types,
  t.total_questions,
  t.published,
  t.created_at,
  t.updated_at,
  COUNT(DISTINCT s.id) AS section_count
FROM mock_tests t
LEFT JOIN mock_test_sections s ON s.mock_test_id = t.id
GROUP BY t.id;

-- Per-test score leaderboard
CREATE OR REPLACE VIEW v_attempt_scores AS
SELECT
  a.mock_test_id,
  t.title AS test_title,
  a.user_id,
  a.total_score,
  a.max_score,
  ROUND((a.total_score::NUMERIC / NULLIF(a.max_score,0)) * 100, 1) AS percentage,
  a.status,
  a.started_at,
  a.completed_at
FROM mock_test_attempts a
JOIN mock_tests t ON t.id = a.mock_test_id;

-- ══════════════════════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY (enable after connecting Supabase Auth)
-- ══════════════════════════════════════════════════════════════════════════════

-- Uncomment these when you have Supabase Auth set up:

-- ALTER TABLE mock_tests             ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE mock_test_sections     ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE mock_test_questions    ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE puzzle_questions       ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE switch_challenge_games ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE grid_challenge_games   ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE grid_challenge_rounds  ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE inductive_challenge_games     ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE inductive_challenge_questions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE motion_challenge_games ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE motion_challenge_levels       ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE mock_test_attempts     ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE mock_test_answers      ENABLE ROW LEVEL SECURITY;

-- Admin: full access (replace 'admin' with your actual role/claim check)
-- CREATE POLICY admin_all ON mock_tests
--   FOR ALL TO authenticated
--   USING (auth.jwt() ->> 'role' = 'admin');

-- Players: read published tests, write own attempts
-- CREATE POLICY player_read_tests ON mock_tests
--   FOR SELECT TO authenticated
--   USING (published = TRUE);

-- CREATE POLICY player_own_attempts ON mock_test_attempts
--   FOR ALL TO authenticated
--   USING (user_id = auth.uid())
--   WITH CHECK (user_id = auth.uid());

-- ══════════════════════════════════════════════════════════════════════════════
--  SEED DATA (optional — safe to delete)
-- ══════════════════════════════════════════════════════════════════════════════

-- Sample mock test with all 5 game types enabled
INSERT INTO mock_tests (title, description, category, difficulty, duration_minutes, enabled_game_types, published)
VALUES (
  'Aptitude Sample Test 1',
  'A comprehensive test covering all five challenge types',
  'Aptitude',
  'medium',
  45,
  ARRAY['puzzle','switch_challenge','grid_challenge','inductive_challenge','motion_challenge'],
  FALSE
);

-- ══════════════════════════════════════════════════════════════════════════════
--  SQL COMMANDS TO FIX 401/42501 UNAUTHORIZED / RLS ERRORS
-- ══════════════════════════════════════════════════════════════════════════════
-- Copy and run the following script in your Supabase SQL Editor:

-- ALTER TABLE mock_tests DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE mock_test_sections DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE mock_test_questions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE puzzle_questions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE switch_challenge_games DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE grid_challenge_games DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE grid_challenge_rounds DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE inductive_challenge_games DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE inductive_challenge_questions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE motion_challenge_games DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE motion_challenge_levels DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE mock_test_attempts DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE mock_test_answers DISABLE ROW LEVEL SECURITY;

