-- CreateTable
CREATE TABLE "SiweNonce" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nonce" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletAddress" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RelayerWallet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminId" TEXT NOT NULL,
    "relayerAddress" TEXT NOT NULL,
    "encryptedPrivateKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "minterRoleGrantedAt" DATETIME,
    "minterRoleRevokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RelayerWallet_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Group_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "displayName" TEXT,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Member_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BadgeDefinition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageURI" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BadgeDefinition_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BadgeDefinition_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BadgeAward" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "badgeDefinitionId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "onChainTokenId" BIGINT,
    "transactionHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "failureReason" TEXT,
    "awardedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BadgeAward_badgeDefinitionId_fkey" FOREIGN KEY ("badgeDefinitionId") REFERENCES "BadgeDefinition" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BadgeAward_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SiweNonce_nonce_key" ON "SiweNonce"("nonce");

-- CreateIndex
CREATE INDEX "SiweNonce_address_idx" ON "SiweNonce"("address");

-- CreateIndex
CREATE INDEX "SiweNonce_expiresAt_idx" ON "SiweNonce"("expiresAt");

-- CreateIndex
CREATE INDEX "SiweNonce_used_idx" ON "SiweNonce"("used");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_walletAddress_key" ON "Admin"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "RelayerWallet_adminId_key" ON "RelayerWallet"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "RelayerWallet_relayerAddress_key" ON "RelayerWallet"("relayerAddress");

-- CreateIndex
CREATE INDEX "RelayerWallet_adminId_idx" ON "RelayerWallet"("adminId");

-- CreateIndex
CREATE INDEX "RelayerWallet_relayerAddress_idx" ON "RelayerWallet"("relayerAddress");

-- CreateIndex
CREATE INDEX "Group_adminId_idx" ON "Group"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "Group_adminId_name_key" ON "Group"("adminId", "name");

-- CreateIndex
CREATE INDEX "Member_groupId_idx" ON "Member"("groupId");

-- CreateIndex
CREATE INDEX "Member_walletAddress_idx" ON "Member"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Member_groupId_walletAddress_key" ON "Member"("groupId", "walletAddress");

-- CreateIndex
CREATE INDEX "BadgeDefinition_adminId_idx" ON "BadgeDefinition"("adminId");

-- CreateIndex
CREATE INDEX "BadgeDefinition_groupId_idx" ON "BadgeDefinition"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "BadgeDefinition_groupId_name_key" ON "BadgeDefinition"("groupId", "name");

-- CreateIndex
CREATE INDEX "BadgeAward_badgeDefinitionId_idx" ON "BadgeAward"("badgeDefinitionId");

-- CreateIndex
CREATE INDEX "BadgeAward_memberId_idx" ON "BadgeAward"("memberId");

-- CreateIndex
CREATE INDEX "BadgeAward_transactionHash_idx" ON "BadgeAward"("transactionHash");

-- CreateIndex
CREATE INDEX "BadgeAward_status_idx" ON "BadgeAward"("status");

-- CreateIndex
CREATE UNIQUE INDEX "BadgeAward_memberId_badgeDefinitionId_key" ON "BadgeAward"("memberId", "badgeDefinitionId");
