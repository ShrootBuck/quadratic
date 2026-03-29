-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "issueId" TEXT,
    "actorId" TEXT,
    "mentionedInComment" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "notification_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "notification_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "issue" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_notification" ("actorId", "content", "createdAt", "id", "issueId", "mentionedInComment", "read", "title", "type", "userId", "workspaceId") SELECT "actorId", "content", "createdAt", "id", "issueId", "mentionedInComment", "read", "title", "type", "userId", "workspaceId" FROM "notification";
DROP TABLE "notification";
ALTER TABLE "new_notification" RENAME TO "notification";
CREATE INDEX "notification_userId_idx" ON "notification"("userId");
CREATE INDEX "notification_workspaceId_idx" ON "notification"("workspaceId");
CREATE INDEX "notification_issueId_idx" ON "notification"("issueId");
CREATE INDEX "notification_read_createdAt_idx" ON "notification"("read", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
