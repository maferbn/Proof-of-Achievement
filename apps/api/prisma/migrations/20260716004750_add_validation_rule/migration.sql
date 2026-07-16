-- CreateTable
CREATE TABLE "ValidationRule" (
    "id" TEXT NOT NULL,
    "badgeDefinitionId" TEXT NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "rules" JSONB NOT NULL,
    "externalVerifierUrl" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ValidationRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ValidationRule_badgeDefinitionId_key" ON "ValidationRule"("badgeDefinitionId");

-- CreateIndex
CREATE INDEX "ValidationRule_badgeDefinitionId_idx" ON "ValidationRule"("badgeDefinitionId");

-- AddForeignKey
ALTER TABLE "ValidationRule" ADD CONSTRAINT "ValidationRule_badgeDefinitionId_fkey" FOREIGN KEY ("badgeDefinitionId") REFERENCES "BadgeDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
