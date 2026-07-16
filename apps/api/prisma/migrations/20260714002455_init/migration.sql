-- CreateTable
CREATE TABLE "SiweNonce" (
    "id" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "address" VARCHAR(42) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiweNonce_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "walletAddress" VARCHAR(42) NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelayerWallet" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "relayerAddress" VARCHAR(42) NOT NULL,
    "encryptedPrivateKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "minterRoleGrantedAt" TIMESTAMP(3),
    "minterRoleRevokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RelayerWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "walletAddress" VARCHAR(42) NOT NULL,
    "displayName" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BadgeDefinition" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageURI" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BadgeDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BadgeAward" (
    "id" TEXT NOT NULL,
    "badgeDefinitionId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "onChainTokenId" BIGINT,
    "transactionHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "failureReason" TEXT,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BadgeAward_pkey" PRIMARY KEY ("id")
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

-- AddForeignKey
ALTER TABLE "RelayerWallet" ADD CONSTRAINT "RelayerWallet_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BadgeDefinition" ADD CONSTRAINT "BadgeDefinition_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BadgeDefinition" ADD CONSTRAINT "BadgeDefinition_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BadgeAward" ADD CONSTRAINT "BadgeAward_badgeDefinitionId_fkey" FOREIGN KEY ("badgeDefinitionId") REFERENCES "BadgeDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BadgeAward" ADD CONSTRAINT "BadgeAward_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
