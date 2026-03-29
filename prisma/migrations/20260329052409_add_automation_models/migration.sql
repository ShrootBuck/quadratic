-- CreateTable
CREATE TABLE "automation_rule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger" TEXT NOT NULL,
    "conditions" TEXT NOT NULL,
    "actions" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "teamId" TEXT,
    CONSTRAINT "automation_rule_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "automation_rule_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "automation_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "error" TEXT,
    "inputData" TEXT NOT NULL,
    "outputData" TEXT,
    "executedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ruleId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "issueId" TEXT,
    CONSTRAINT "automation_log_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "automation_rule" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "automation_log_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "automation_rule_workspaceId_idx" ON "automation_rule"("workspaceId");

-- CreateIndex
CREATE INDEX "automation_rule_teamId_idx" ON "automation_rule"("teamId");

-- CreateIndex
CREATE INDEX "automation_rule_enabled_idx" ON "automation_rule"("enabled");

-- CreateIndex
CREATE INDEX "automation_rule_isTemplate_idx" ON "automation_rule"("isTemplate");

-- CreateIndex
CREATE INDEX "automation_log_ruleId_idx" ON "automation_log"("ruleId");

-- CreateIndex
CREATE INDEX "automation_log_workspaceId_idx" ON "automation_log"("workspaceId");

-- CreateIndex
CREATE INDEX "automation_log_executedAt_idx" ON "automation_log"("executedAt");

-- CreateIndex
CREATE INDEX "automation_log_status_idx" ON "automation_log"("status");
