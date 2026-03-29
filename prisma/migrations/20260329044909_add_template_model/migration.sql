-- CreateTable
CREATE TABLE "template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NO_PRIORITY',
    "status" TEXT NOT NULL DEFAULT 'BACKLOG',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "teamId" TEXT,
    "labelIds" TEXT NOT NULL,
    CONSTRAINT "template_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "template_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "template_workspaceId_idx" ON "template"("workspaceId");

-- CreateIndex
CREATE INDEX "template_teamId_idx" ON "template"("teamId");

-- CreateIndex
CREATE INDEX "template_isDefault_idx" ON "template"("isDefault");
