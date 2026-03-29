-- CreateTable
CREATE TABLE "api_key" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'READ',
    "lastUsedAt" DATETIME,
    "expiresAt" DATETIME,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" DATETIME,
    "revokedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rateLimitRequests" INTEGER NOT NULL DEFAULT 1000,
    "workspaceId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "api_key_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "webhook" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "webhook_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "webhook_delivery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventType" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "responseCode" INTEGER,
    "responseBody" TEXT,
    "errorMessage" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" DATETIME,
    "deliveredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "webhookId" TEXT NOT NULL,
    CONSTRAINT "webhook_delivery_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "webhook" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "api_key_keyHash_key" ON "api_key"("keyHash");

-- CreateIndex
CREATE INDEX "api_key_workspaceId_idx" ON "api_key"("workspaceId");

-- CreateIndex
CREATE INDEX "api_key_keyHash_idx" ON "api_key"("keyHash");

-- CreateIndex
CREATE INDEX "api_key_isRevoked_idx" ON "api_key"("isRevoked");

-- CreateIndex
CREATE INDEX "api_key_createdAt_idx" ON "api_key"("createdAt");

-- CreateIndex
CREATE INDEX "webhook_workspaceId_idx" ON "webhook"("workspaceId");

-- CreateIndex
CREATE INDEX "webhook_status_idx" ON "webhook"("status");

-- CreateIndex
CREATE INDEX "webhook_delivery_webhookId_idx" ON "webhook_delivery"("webhookId");

-- CreateIndex
CREATE INDEX "webhook_delivery_status_idx" ON "webhook_delivery"("status");

-- CreateIndex
CREATE INDEX "webhook_delivery_createdAt_idx" ON "webhook_delivery"("createdAt");
