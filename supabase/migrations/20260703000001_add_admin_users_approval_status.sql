-- admin_users にセルフサーブ登録の承認ステータスを追加する。
-- Why not DEFAULT 'pending': 既存の admin / bar_owner を審査待ちに巻き込むとログイン不能になるため、
-- 既存レコードは承認済みとみなす DEFAULT 'approved' とし、セルフサーブ登録 API 側で明示的に 'pending' を入れる。
ALTER TABLE "admin_users"
  ADD COLUMN "approval_status" TEXT NOT NULL DEFAULT 'approved';

ALTER TABLE "admin_users"
  ADD CONSTRAINT "admin_users_approval_status_check"
  CHECK ("approval_status" IN ('pending', 'approved', 'rejected'));

-- 審査中一覧の絞り込み用。
CREATE INDEX "idx_admin_users_approval_status" ON "admin_users"("approval_status");
