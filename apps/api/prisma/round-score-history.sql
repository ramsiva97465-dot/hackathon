-- Keep Round 1 (and Round 2) scores visible after promotion.
-- Round 2/3 start at 0 using new per-round score sheets; historical scores stay on older sheets.

ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "round1Score" DOUBLE PRECISION;
ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "round1JudgeCount" INTEGER;
ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "round2Score" DOUBLE PRECISION;
ALTER TABLE "teams" ADD COLUMN IF NOT EXISTS "round2JudgeCount" INTEGER;

ALTER TABLE "score_sheets" ADD COLUMN IF NOT EXISTS "round" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "score_sheets" DROP CONSTRAINT IF EXISTS "score_sheets_judgeId_teamId_key";
DROP INDEX IF EXISTS "score_sheets_judgeId_teamId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "score_sheets_judgeId_teamId_round_key"
  ON "score_sheets"("judgeId", "teamId", "round");

CREATE INDEX IF NOT EXISTS "score_sheets_round_idx"
  ON "score_sheets"("round");
