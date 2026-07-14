# Backend: Cambios tras upgrade del contrato (ERC-5192 + Revocación)

## Contexto

`ReputationBadge.sol` ahora implementa **ERC-5192** (Minimal Soulbound NFTs con `locked()` + eventos `Locked`/`Unlocked`) y **revocación** (`revokeBadge` + `isRevoked`). El backend usa un ABI hardcoded en `relayer.service.ts` que debe actualizarse.

**Prerequisito:** El contrato debe estar compilado y los typechain-types regenerados.
```bash
npx turbo compile --filter=@repo/contracts
```

---

## 1. Actualizar ABI en `apps/api/src/services/relayer.service.ts`

Reemplazar la constante `REPUTATION_BADGE_ABI` por la siguiente versión expandida:

```typescript
const REPUTATION_BADGE_ABI = [
  // Existentes
  'function mint(address to, string memory uri) public returns (uint256)',
  'function grantMinter(address minter) public',
  'function revokeMinter(address minter) public',
  // Nuevos (ERC-5192)
  'function locked(uint256 tokenId) public view returns (bool)',
  'function getTokenURI(uint256 tokenId) public view returns (string memory)',
  // Nuevos (Revocación)
  'function revokeBadge(uint256 tokenId) public',
  'function isRevoked(uint256 tokenId) public view returns (bool)',
  // Utilidades
  'function hasRole(bytes32 role, address account) public view returns (bool)',
];
```

---

## 2. Nuevas funciones en `apps/api/src/services/relayer.service.ts`

Agregar dos métodos a la clase `RelayerService`:

### `revokeBadge(tokenId: number)`
- Llama a `contract.revokeBadge(tokenId)` con el **deployer wallet** (no el relayer).
- Solo `DEFAULT_ADMIN_ROLE` o `MINTER_ROLE` pueden revocar. El deployer tiene `DEFAULT_ADMIN_ROLE`.
- Retorna `{ transactionHash: string }`.

```typescript
async revokeBadge(tokenId: number): Promise<{ transactionHash: string }> {
  try {
    console.log(`Revoking badge tokenId=${tokenId} via deployer wallet`);
    const tx = await this.reputationBadgeContract.revokeBadge(tokenId);
    console.log(`Badge revoke transaction sent: ${tx.hash}`);
    return { transactionHash: tx.hash };
  } catch (error: any) {
    console.error('Failed to revoke badge:', error);
    throw new Error(`Badge revocation failed: ${error.message || error}`);
  }
}
```

### `isBadgeRevoked(tokenId: number)`
- Llama a `contract.isRevoked(tokenId)` (lectura on-chain, no gasta gas).
- Retorna `boolean`.

```typescript
async isBadgeRevoked(tokenId: number): Promise<boolean> {
  try {
    return await this.reputationBadgeContract.isRevoked(tokenId);
  } catch (error) {
    console.error('Failed to check revocation status:', error);
    return false;
  }
}
```

---

## 3. Nuevo endpoint en `apps/api/src/routes/badges.routes.ts`

### `POST /badge-awards/:id/revoke`

**Protegido** (requiere JWT). El admin revoca un badge que había emitido.

```typescript
router.post('/badge-awards/:id/revoke', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.adminId;

    // 1. Buscar el BadgeAward
    const badgeAward = await prisma.badgeAward.findUnique({
      where: { id },
      include: { badgeDefinition: true, member: true },
    });
    if (!badgeAward) {
      return res.status(404).json({ error: 'Badge award not found' });
    }

    // 2. Validar ownership (admin posee el badge award)
    const badgeDef = await prisma.badgeDefinition.findUnique({
      where: { id: badgeAward.badgeDefinitionId },
    });
    if (!badgeDef || badgeDef.adminId !== adminId) {
      return res.status(403).json({ error: 'Not authorized to revoke this badge' });
    }

    // 3. Verificar que tenga tokenId on-chain
    if (!badgeAward.onChainTokenId) {
      return res.status(400).json({ error: 'Badge has no on-chain token yet' });
    }

    // 4. Verificar que no esté ya revocado
    if (badgeAward.status === 'revoked') {
      return res.status(409).json({ error: 'Badge is already revoked' });
    }

    // 5. Revocar en el contrato
    const { transactionHash } = await relayerService.revokeBadge(
      Number(badgeAward.onChainTokenId)
    );

    // 6. Actualizar en la base de datos
    const updated = await prisma.badgeAward.update({
      where: { id },
      data: {
        status: 'revoked',
        failureReason: `Revoked by admin. Tx: ${transactionHash}`,
      },
    });

    res.json({
      message: 'Badge revoked successfully',
      transactionHash,
      badgeAward: updated,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 4. Modelo Prisma

El campo `BadgeAward.status` es un `String` con default `"pending"`. Agregar `"revoked"` como valor posible:

- **No requiere migración de esquema** — es un campo String libre.
- Opcional: agregar `revokedAt DateTime?` para trazabilidad (requiere migración).

Si se desea `revokedAt`:
```bash
# Agregar al schema.prisma en BadgeAward:
#   revokedAt DateTime?
npm run db:migrate -w apps/api -- --name add-revoked-at
npx turbo db:generate --filter=api
```

---

## 5. Verificación

```bash
# 1. Compilar contratos (regenera typechain-types)
npx turbo compile --filter=@repo/contracts

# 2. Build del backend
npx turbo build --filter=api

# 3. Tests del backend (29 tests existentes)
npx turbo test --filter=api

# 4. Lint
npx turbo lint --filter=api

# 5. Probar manualmente el nuevo endpoint
# POST /auth/siwe-message → obtener nonce
# POST /auth/siwe-verify → obtener JWT
# POST /badge-definitions/:id/award → emitir badge (obtener badgeAward.id)
# POST /badge-awards/:badgeAwardId/revoke → revocar
# GET /auth/relayer-status → verificar estado
```

---

## 6. Nota sobre ABI compartido

Actualmente el backend usa un ABI **hardcoded** en `relayer.service.ts`. Una mejora futura es importar el ABI desde `@repo/contracts`:

```typescript
// Mejora futura: importar desde artifacts
import ReputationBadgeArtifact from '@repo/contracts/artifacts/contracts/ReputationBadge.sol/ReputationBadge.json';
const REPUTATION_BADGE_ABI = ReputationBadgeArtifact.abi;
```

Esto requiere agregar `"exports"` al `package.json` de `packages/contracts/` y sincronizar versiones. No es urgente pero elimina la duplicación del ABI.
