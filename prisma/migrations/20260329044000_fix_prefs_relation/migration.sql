-- DropIndex
DROP INDEX IF EXISTS "notification_preferences_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_workspaceId_key" ON "notification_preferences"("userId", "workspaceId");
