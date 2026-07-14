# Frontend: Cambios tras upgrade del contrato (ERC-5192 + Revocación)

## Contexto

`ReputationBadge.sol` ahora expone `locked(tokenId)`, `isRevoked(tokenId)` y `revokeBadge(tokenId)`. El frontend es de **solo-lectura** para el contrato (las escrituras van por el backend vía API REST).

**Prerequisito:** El contrato debe estar compilado:
```bash
npx turbo compile --filter=@repo/contracts
```

---

## 1. Actualizar ABI/contrato consumido

El frontend necesita leer datos del contrato (estado `locked`, `isRevoked`). Actualmente no hay un cliente de lectura del contrato en el frontend (usa datos demo).

**Opción A (recomendada):** Importar el ABI desde `@repo/contracts` vía `artifacts/`:
```typescript
import ReputationBadgeArtifact from '@repo/contracts/artifacts/contracts/ReputationBadge.sol/ReputationBadge.json';
export const REPUTATION_BADGE_ABI = ReputationBadgeArtifact.abi;
export const REPUTATION_BADGE_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
```

**Requisito:** Agregar `"exports"` al `package.json` de `packages/contracts/`:
```json
{
  "exports": {
    "./artifacts/*": "./artifacts/*"
  }
}
```

**Opción B (sin cambios en packages):** Embeber el ABI directamente en el frontend (copiar desde `packages/contracts/artifacts/...`). Menos elegante pero funciona sin modificar packages.

---

## 2. Vista pública de badges

### Leer `isRevoked(tokenId)` y `locked(tokenId)`

Usar `wagmi` con `useReadContract` para leer el estado on-chain de cada badge:

```typescript
import { useReadContract } from 'wagmi';
import { REPUTATION_BADGE_ABI, REPUTATION_BADGE_ADDRESS } from './contract';

function BadgeStatus({ tokenId }: { tokenId: number }) {
  const { data: isRevoked } = useReadContract({
    address: REPUTATION_BADGE_ADDRESS,
    abi: REPUTATION_BADGE_ABI,
    functionName: 'isRevoked',
    args: [BigInt(tokenId)],
  });

  const { data: isLocked } = useReadContract({
    address: REPUTATION_BADGE_ADDRESS,
    abi: REPUTATION_BADGE_ABI,
    functionName: 'locked',
    args: [BigInt(tokenId)],
  });

  return (
    <div>
      {isLocked && <span className="badge-soulbound"> Soulbound</span>}
      {isRevoked && <span className="badge-revoked"> Revocado</span>}
    </div>
  );
}
```

### Indicador visual
- **Soulbound (locked):** badge verde o ícono de candado (informativo).
- **Revocado:** badge rojo con texto "Revocado" y tachado.
- **Normal:** badge sin indicadores especiales.

---

## 3. Panel de administración

### Botón "Revocar badge"

El botón llama al endpoint del backend, NO al contrato directamente:

```typescript
async function handleRevokeBadge(badgeAwardId: string) {
  const response = await fetch(
    `${API_URL}/badge-awards/${badgeAwardId}/revoke`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  // Refrescar el estado del badge
  refreshBadges();
}
```

### UX
- El botón aparece solo para badges con `status !== 'revoked'`.
- Confirmación antes de revocar: "¿Estás seguro de que deseas revocar este badge? Esta acción es irreversible."
- Tras revocar, el badge cambia visualmente a estado "Revocado" sin recargar la página.

---

## 4. Tipos compartidos (`packages/shared-types/`)

Actualizar la interfaz `IssuedAchievement` (o `BadgeAward`) para incluir el estado `"revoked"`:

```typescript
export interface IssuedAchievement {
  id: string;
  tokenId: number;
  achievementId: string;
  userAddress: string;
  validatorAddress: string;
  txHash: string;
  metadataUri: string;
  issuedAt: Date;
  status: 'pending' | 'confirmed' | 'failed' | 'revoked';  // ← agregar 'revoked'
  isRevoked?: boolean;  // ← nuevo campo derivado del contrato
}
```

---

## 5. Verificación

```bash
# 1. Compile contratos
npx turbo compile --filter=@repo/contracts

# 2. Build shared-types
npx turbo build --filter=@repo/shared-types

# 3. Iniciar desarrollo (client + api en paralelo)
npm run dev

# 4. Verificar en el navegador:
#    - Un badge emitido muestra " Soulbound" y "Revocado: No"
#    - Tras revocar desde el admin, el badge muestra " Revocado"
#    - El badge revocado sigue siendo visible (no se borra)
```

---

## 6. Nota sobre ERC-5192 y wallets

El estándar ERC-5192 comunica formalmente a wallets (MetaMask, Rabby, etc.) que los tokens están perpetuamente bloqueados. Algunas wallets muestran SBTs con un ícono especial o los separan de NFTs tradicionales. Esto es automático una vez que el contrato soporta ERC-5192 y `supportsInterface(0xb45a3c0e)` retorna `true`.

No se requiere acción adicional en el frontend para esta interoperabilidad — es un beneficio gratuito del estándar.
