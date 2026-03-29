-- CreateTable
CREATE TABLE "custom_field" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "options" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "teamId" TEXT,
    CONSTRAINT "custom_field_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "custom_field_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "custom_field_value" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "customFieldId" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    CONSTRAINT "custom_field_value_customFieldId_fkey" FOREIGN KEY ("customFieldId") REFERENCES "custom_field" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "custom_field_value_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "custom_field_workspaceId_idx" ON "custom_field"("workspaceId");

-- CreateIndex
CREATE INDEX "custom_field_teamId_idx" ON "custom_field"("teamId");

-- CreateIndex
CREATE INDEX "custom_field_order_idx" ON "custom_field"("order");

-- CreateIndex
CREATE INDEX "custom_field_value_customFieldId_idx" ON "custom_field_value"("customFieldId");

-- CreateIndex
CREATE INDEX "custom_field_value_issueId_idx" ON "custom_field_value"("issueId");

-- CreateIndex
CREATE UNIQUE INDEX "custom_field_value_customFieldId_issueId_key" ON "custom_field_value"("customFieldId", "issueId");
