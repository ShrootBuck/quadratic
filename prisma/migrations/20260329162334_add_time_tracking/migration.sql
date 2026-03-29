-- AlterTable
ALTER TABLE "issue" ADD COLUMN "estimatedTime" REAL;

-- CreateTable
CREATE TABLE "time_entry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "duration" REAL NOT NULL,
    "description" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "isRunning" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "issueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    CONSTRAINT "time_entry_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "time_entry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "time_entry_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "github_pull_request" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "githubId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "branch" TEXT NOT NULL,
    "baseBranch" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "repository" TEXT NOT NULL,
    "mergedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "issueId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    CONSTRAINT "github_pull_request_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "github_pull_request_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "time_entry_issueId_idx" ON "time_entry"("issueId");

-- CreateIndex
CREATE INDEX "time_entry_userId_idx" ON "time_entry"("userId");

-- CreateIndex
CREATE INDEX "time_entry_workspaceId_idx" ON "time_entry"("workspaceId");

-- CreateIndex
CREATE INDEX "time_entry_startedAt_idx" ON "time_entry"("startedAt");

-- CreateIndex
CREATE INDEX "time_entry_isRunning_idx" ON "time_entry"("isRunning");

-- CreateIndex
CREATE INDEX "github_pull_request_workspaceId_idx" ON "github_pull_request"("workspaceId");

-- CreateIndex
CREATE INDEX "github_pull_request_issueId_idx" ON "github_pull_request"("issueId");

-- CreateIndex
CREATE INDEX "github_pull_request_status_idx" ON "github_pull_request"("status");

-- CreateIndex
CREATE INDEX "github_pull_request_repository_idx" ON "github_pull_request"("repository");

-- CreateIndex
CREATE UNIQUE INDEX "github_pull_request_issueId_githubId_key" ON "github_pull_request"("issueId", "githubId");
