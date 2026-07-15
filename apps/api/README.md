# API Backend — Reputation Badge

Backend API para la DApp de Badges de Reputación Soulbound. Maneja autenticación de administradores (SIWE), gestión de wallets relayer, administración de grupos/miembros, orquestación de acuñación de badges, subida de metadata a IPFS y sincronización automática de eventos on-chain.

## Resumen de Arquitectura

### Componentes Clave

1. **Autenticación (SIWE)**: Los administradores firman mensajes con su wallet de Ethereum para iniciar sesión y recibir tokens JWT.
2. **Wallets Relayer**: Una wallet encriptada por administrador, utilizada para firmar transacciones de acuñación en blockchain.
3. **Modelo Híbrido**:
   - **On-chain** (ReputationBadge.sol): ERC721 Soulbound, control de acceso mediante MINTER_ROLE.
   - **Off-chain** (PostgreSQL): Membresía de grupos, pertenencia admin-grupo, definiciones de badges, historial de emisiones.
4. **Interacciones Blockchain** (ethers.js v6): Acuñación de badges y gestión de MINTER_ROLE vía wallets relayer.
5. **Oráculo Simulado** (validation.service.ts): Validación de evidencias off-chain antes de emitir badges.
6. **Servicio IPFS** (ipfs.service.ts): Subida de metadata e imágenes de badges a IPFS vía Pinata.
7. **Indexador de Eventos** (event-indexer.service.ts): Job en segundo plano que consulta eventos blockchain y auto-confirma emisiones de badges.

### Esquema de Base de Datos (7 Modelos)

- **SiweNonce**: Protección contra replay para SIWE (nonce almacenado en servidor, expiración de 10 min, marcado como usado tras verificación)
- **Admin**: Wallet de login + perfil
- **RelayerWallet**: Llave privada encriptada (1:1 con Admin), estado de MINTER_ROLE
- **Group**: Gestionado por un Admin
- **Member**: Usuario en un Grupo (puede recibir badges)
- **BadgeDefinition**: Plantilla de badge (Admin crea para sus grupos)
- **BadgeAward**: Registro de un badge emitido a un miembro (vincula tokenId on-chain + tx hash, seguimiento de estado: pending/confirmed/failed/revoked)

---

## Configuración

### Prerrequisitos

- Node.js 18+
- PostgreSQL 12+
- Endpoint RPC de Sepolia (Alchemy, Infura u otro proveedor)
- Dirección del contrato ReputationBadge desplegado
- Cuenta en Pinata (opcional, para subida de metadata a IPFS)

### 1. Configurar Variables de Entorno

Copia `.env.example` a `.env` y completa:

```bash
cp apps/api/.env.example apps/api/.env
```

**Variables requeridas:**

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL |
| `SEPOLIA_RPC_URL` | Endpoint JSON-RPC de Sepolia |
| `REPUTATION_BADGE_CONTRACT_ADDRESS` | Dirección del contrato desplegado |
| `DEPLOYER_PRIVATE_KEY` | Llave privada de la wallet que desplegó el contrato |
| `ENCRYPTION_MASTER_KEY` | Clave hexadecimal de 32 bytes para encriptar llaves privadas de relayers |
| `JWT_SECRET` | Secreto para firmar JWT |

**Variables opcionales:**

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `PINATA_JWT` | JWT para subidas a IPFS vía Pinata | *(no configurado — IPFS deshabilitado)* |
| `PINATA_GATEWAY` | URL del gateway IPFS | `https://gateway.pinata.cloud` |
| `INDEXER_POLLING_INTERVAL_MS` | Intervalo de sondeo del indexador de eventos (ms) | `30000` |
| `JWT_EXPIRATION` | Expiración del token JWT | `7d` |
| `PORT` | Puerto del servidor | `3000` |
| `CORS_ORIGIN` | Origen del frontend para CORS | `http://localhost:3001` |
| `NODE_ENV` | Entorno | `development` |
| `LOG_LEVEL` | Nivel de logging | `info` |

### 2. Configurar Base de Datos

> Todos los comandos se ejecutan desde la **raíz del monorepo** (`proof-of-achievement/`).

```bash
npm run db:generate -w apps/api
npm run db:migrate -w apps/api
```

### 3. Iniciar el Servidor

**Desarrollo (API + cliente):**
```bash
npm run dev
```

**Solo API:**
```bash
npm run dev -w apps/api
```

**Producción:**
```bash
npm run build
npm start -w apps/api
```

El servidor escucha en `http://localhost:3000` por defecto.

### 4. Health Check

```
GET /health
```

```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "eventIndexer": "running",
  "ipfs": "configured"
}
```

---

## Endpoints de la API

> Todos los endpoints retornan `{ "error": "mensaje" }` en caso de error.
> Los endpoints protegidos requieren el header `Authorization: Bearer <JWT_TOKEN>`.

---

### Autenticación

#### `POST /auth/siwe-message`

Solicita un mensaje SIWE para firmar. Genera un nonce único almacenado en el servidor para protección contra replay.

**Request:**
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE0"
}
```

**Response `200`:**
```json
{
  "message": "reputation-badges.local wants you to sign in with your Ethereum account:\n0x742d35Cc...",
  "nonce": "abc123def456"
}
```

**Errores:**
- `400` — Campo "address" faltante o inválido

---

#### `POST /auth/siwe-verify`

Verifica el mensaje SIWE firmado y obtiene un token JWT. Auto-crear el registro Admin y la wallet relayer en el primer inicio de sesión.

**Request:**
```json
{
  "message": "reputation-badges.local wants you to sign in...",
  "signature": "0x..."
}
```

**Response `200`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "admin": {
    "id": "clx...",
    "walletAddress": "0x742d35Cc...",
    "displayName": null
  },
  "relayerStatus": {
    "relayerAddress": "0xAbC...",
    "isActive": false,
    "hasRoleOnChain": false,
    "minterRoleGrantedAt": null,
    "minterRoleRevokedAt": null,
    "createdAt": "2024-..."
  }
}
```

**Errores:**
- `400` — Faltan "message" o "signature"
- `400` — Firma inválida / verificación SIWE fallida

---

#### `POST /auth/initialize-minter-role`

Otorga MINTER_ROLE a la wallet relayer del administrador on-chain. La wallet deployer paga el gas.

**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Request:** *(body vacío)*

**Response `200`:**
```json
{
  "message": "MINTER_ROLE granted successfully",
  "transactionHash": "0x...",
  "relayerAddress": "0xAbC..."
}
```

**Errores:**
- `400` — Wallet relayer no encontrada
- `400` — MINTER_ROLE ya otorgado

---

#### `GET /auth/relayer-status`

Consulta el estado de la wallet relayer del administrador autenticado.

**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Response `200`:**
```json
{
  "relayerAddress": "0xAbC...",
  "isActive": true,
  "hasRoleOnChain": true,
  "minterRoleGrantedAt": "2024-...",
  "minterRoleRevokedAt": null
}
```

**Errores:**
- `404` — Wallet relayer no encontrada

---

### Grupos

#### `POST /groups`

Crea un nuevo grupo para el administrador autenticado.

**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Request:**
```json
{
  "name": "Developers",
  "description": "Comunidad de desarrolladores Web3"
}
```

**Response `201`:**
```json
{
  "id": "clx...",
  "adminId": "clx...",
  "name": "Developers",
  "description": "Comunidad de desarrolladores Web3",
  "createdAt": "2024-...",
  "updatedAt": "2024-..."
}
```

**Errores:**
- `400` — Campo "name" faltante o inválido
- `409` — El nombre del grupo ya existe para este administrador

---

#### `GET /groups`

Lista todos los grupos del administrador autenticado. Incluye conteo de miembros y definiciones de badges.

**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Response `200`:**
```json
[
  {
    "id": "clx...",
    "adminId": "clx...",
    "name": "Developers",
    "description": "Comunidad de desarrolladores Web3",
    "createdAt": "2024-...",
    "updatedAt": "2024-...",
    "_count": {
      "members": 5,
      "badgeDefinitions": 3
    }
  }
]
```

---

#### `GET /groups/:id`

Obtiene detalles del grupo incluyendo miembros y definiciones de badges. **Público** (no requiere autenticación).

**Response `200`:**
```json
{
  "id": "clx...",
  "adminId": "clx...",
  "name": "Developers",
  "description": "Comunidad de desarrolladores Web3",
  "createdAt": "2024-...",
  "updatedAt": "2024-...",
  "members": [
    {
      "id": "clx...",
      "groupId": "clx...",
      "walletAddress": "0x...",
      "displayName": "Alice",
      "joinedAt": "2024-..."
    }
  ],
  "badgeDefinitions": [
    {
      "id": "clx...",
      "adminId": "clx...",
      "groupId": "clx...",
      "name": "Contributor",
      "description": "Otorgado a contribuidores del proyecto",
      "imageURI": "ipfs://QmXxx...",
      "createdAt": "2024-..."
    }
  ],
  "_count": {
    "members": 1,
    "badgeDefinitions": 1
  }
}
```

**Errores:**
- `404` — Grupo no encontrado

---

#### `PUT /groups/:id`

Actualiza un grupo (solo propietario).

**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Request:**
```json
{
  "name": "Nombre Actualizado",
  "description": "Descripción actualizada"
}
```

**Response `200`:** Objeto grupo actualizado.

**Errores:**
- `403` — No autorizado para modificar este grupo

---

#### `DELETE /groups/:id`

Elimina un grupo en cascada (solo propietario). Elimina todos los miembros, definiciones de badges y emisiones del grupo.

**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Response `200`:**
```json
{
  "message": "Group deleted"
}
```

**Errores:**
- `403` — No autorizado para eliminar este grupo

---

### Miembros

#### `POST /groups/:id/members`

Agrega un miembro a un grupo (solo propietario). La dirección se formatea con checksum automáticamente.

**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Request:**
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE0",
  "displayName": "Alice"
}
```

**Response `201`:**
```json
{
  "id": "clx...",
  "groupId": "clx...",
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE0",
  "displayName": "Alice",
  "joinedAt": "2024-...",
  "createdAt": "2024-...",
  "updatedAt": "2024-..."
}
```

**Errores:**
- `400` — Campo "walletAddress" faltante o inválido
- `400` — Dirección Ethereum inválida
- `403` — No autorizado para agregar miembros a este grupo
- `409` — El miembro ya existe en este grupo

---

#### `DELETE /groups/:id/members/:memberId`

Elimina un miembro de un grupo (solo propietario). Los badges permanecen soulbound on-chain.

**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Response `200`:**
```json
{
  "message": "Member removed from group"
}
```

**Errores:**
- `403` — No autorizado
- `404` — Miembro no encontrado en este grupo

---

### Definiciones de Badges

#### `POST /badge-definitions`

Crea una plantilla de badge para un grupo (solo propietario).

**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Request:**
```json
{
  "groupId": "clx...",
  "name": "Contributor",
  "description": "Otorgado a contribuidores del proyecto",
  "imageURI": "ipfs://QmXxx..."
}
```

**Response `201`:**
```json
{
  "id": "clx...",
  "adminId": "clx...",
  "groupId": "clx...",
  "name": "Contributor",
  "description": "Otorgado a contribuidores del proyecto",
  "imageURI": "ipfs://QmXxx...",
  "createdAt": "2024-...",
  "updatedAt": "2024-..."
}
```

**Errores:**
- `400` — Faltan "groupId" o "name"
- `403` — No autorizado para crear badges en este grupo
- `409` — El nombre del badge ya existe en este grupo

---

#### `GET /badge-definitions/:id`

Obtiene detalles de la definición de badge. **Público** (no requiere autenticación).

**Response `200`:**
```json
{
  "id": "clx...",
  "adminId": "clx...",
  "groupId": "clx...",
  "name": "Contributor",
  "description": "Otorgado a contribuidores del proyecto",
  "imageURI": "ipfs://QmXxx...",
  "createdAt": "2024-...",
  "updatedAt": "2024-...",
  "_count": {
    "badgeAwards": 5
  }
}
```

**Errores:**
- `404` — Definición de badge no encontrada

---

#### `POST /badge-definitions/:id/validate`

**Oráculo Simulado**: Valida si un miembro es elegible para recibir un badge. Verifica membresía al grupo, unicidad del badge y opcionalmente valida evidencia. NO acuña on-chain — llamar a `/award` después.

**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Request:**
```json
{
  "memberId": "clx...",
  "evidence": {
    "type": "course_completion",
    "data": {
      "courseId": "web3-101",
      "completionDate": "2024-01-15T00:00:00Z"
    }
  }
}
```

**La evidencia es opcional.** Si se omite, solo se verifica la elegibilidad básica (membresía al grupo + unicidad).

**Tipos de evidencia soportados:**

| Tipo | Campos requeridos en `data` | Campos opcionales |
|------|---------------------------|-------------------|
| `course_completion` | `courseId`, `completionDate` | — |
| `game_win` | `gameId`, `matchId` | `score`, `minScore` |
| `exam_pass` | `examId`, `score` | `minPassingScore` (default: 70) |
| `contribution` | `contributionType`, `contributionId` | — |
| *(otro)* | *(cualquier objeto no vacío)* | — |

**Response `200` (válido):**
```json
{
  "valid": true,
  "validatedAt": "2024-...",
  "memberId": "clx...",
  "badgeDefinitionId": "clx...",
  "message": "Member is eligible to receive this badge"
}
```

**Response `200` (inválido):**
```json
{
  "valid": false,
  "reason": "Member does not belong to badge group",
  "validatedAt": "2024-...",
  "memberId": "clx...",
  "badgeDefinitionId": "clx...",
  "message": "Validation failed: Member does not belong to badge group"
}
```

**Errores:**
- `400` — Falta "memberId"
- `403` — No autorizado para validar este badge
- `404` — Definición de badge no encontrada

---

### Metadata IPFS

#### `POST /badges/metadata`

Sube metadata de badge (e imagen opcional) a IPFS vía Pinata. Retorna la URI `ipfs://` que puede usarse como `imageURI` en las definiciones de badges.

**Headers:** `Authorization: Bearer <JWT_TOKEN>`, `Content-Type: multipart/form-data`

**Request (multipart/form-data):**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | string | Sí | Nombre del badge |
| `description` | string | No | Descripción del badge |
| `attributes` | string (JSON) | No | Array JSON de `{ "trait_type": "...", "value": "..." }` |
| `image` | file | No | Archivo de imagen (máx 10MB) |

**Ejemplo con curl:**
```bash
curl -X POST http://localhost:3000/badges/metadata \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "name=Contributor Gold" \
  -F "description=Otorgado por 10+ contribuciones" \
  -F 'attributes=[{"trait_type":"Level","value":"Gold"}]' \
  -F "image=@badge.png"
```

**Response `200`:**
```json
{
  "metadataUri": "ipfs://QmXxx...",
  "gatewayUrl": "https://gateway.pinata.cloud/ipfs/QmXxx...",
  "imageUri": "ipfs://QmYyy..."
}
```

**Errores:**
- `503` — IPFS no configurado (PINATA_JWT no establecido)
- `400` — Falta "name"
- `400` — Formato de "attributes" inválido (debe ser un array JSON)
- `500` — Error en la subida a IPFS

---

### Emisión de Badges

#### `POST /badge-definitions/:id/award`

**Endpoint crítico**: Emite un badge a un miembro. Acuña on-chain vía la wallet relayer del administrador, luego guarda en la DB con `status: "pending"`. El indexador de eventos auto-confirma una vez que la transacción es minada.

**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Flujo de validación:**
1. El administrador es propietario del grupo del badge
2. El miembro pertenece a ese grupo
3. La evidencia pasa la validación del oráculo (si se proporciona)
4. La wallet relayer está activa (MINTER_ROLE otorgado)
5. El miembro no ha recibido este badge exacto anteriormente
6. Si todo es correcto: acuña on-chain, luego guarda en DB

**Request:**
```json
{
  "memberId": "clx...",
  "evidence": {
    "type": "exam_pass",
    "data": {
      "examId": "final-exam",
      "score": 95,
      "minPassingScore": 70
    }
  }
}
```

**`evidence` es opcional.** Si se proporciona y es inválida, la emisión se rechaza antes de acuñar.

**Response `201`:**
```json
{
  "badgeAward": {
    "id": "clx...",
    "badgeDefinitionId": "clx...",
    "memberId": "clx...",
    "onChainTokenId": 42,
    "transactionHash": "0x...",
    "status": "pending",
    "failureReason": null,
    "awardedAt": "2024-...",
    "confirmedAt": null,
    "revokedAt": null
  },
  "message": "Badge awarded successfully (pending on-chain confirmation)"
}
```

**Errores:**
- `400` — Falta "memberId"
- `400` — Validación de evidencia fallida
- `400` — Wallet relayer no activa (llamar primero a `/auth/initialize-minter-role`)
- `400` — Error al acuñar badge on-chain
- `403` — No autorizado / El miembro no pertenece al grupo
- `404` — Definición de badge no encontrada
- `409` — El miembro ya recibió este badge

---

#### `POST /badge-awards/:id/verify-receipt`

Verificación manual: Comprueba si una acuñación de badge pendiente fue confirmada o revertida on-chain. Útil si el indexador de eventos aún no la ha procesado o para depuración.

**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Comportamiento:**
- Si la tx aún no fue minada: retorna `pending`
- Si la tx fue confirmada: actualiza estado a `confirmed`, establece `confirmedAt`
- Si la tx fue revertida: actualiza estado a `failed`

**Response `200` (pendiente):**
```json
{
  "status": "pending",
  "message": "Transaction not yet mined. Please try again later.",
  "badgeAward": { ... }
}
```

**Response `200` (confirmado):**
```json
{
  "status": "confirmed",
  "message": "Transaction confirmed on-chain",
  "badgeAward": {
    "id": "clx...",
    "status": "confirmed",
    "confirmedAt": "2024-...",
    ...
  }
}
```

**Response `200` (fallido):**
```json
{
  "status": "failed",
  "message": "Transaction reverted on-chain. You can now re-award this badge to the member.",
  "badgeAward": {
    "id": "clx...",
    "status": "failed",
    "failureReason": "Transaction reverted on-chain",
    ...
  }
}
```

**Errores:**
- `400` — No se puede verificar un badge con estado 'confirmed'/'failed'/'revoked'
- `400` — La emisión del badge no tiene hash de transacción
- `403` — No autorizado para verificar este badge
- `404` — Emisión de badge no encontrada

---

#### `POST /badge-awards/:id/revoke`

Revoca un badge que fue emitido previamente. Solo el administrador propietario de la definición del badge puede revocarlo. Escribe on-chain vía la wallet deployer, luego actualiza la DB local.

**Headers:** `Authorization: Bearer <JWT_TOKEN>`

**Response `200`:**
```json
{
  "message": "Badge revoked successfully",
  "transactionHash": "0x...",
  "badgeAward": {
    "id": "clx...",
    "status": "revoked",
    "revokedAt": "2024-...",
    "failureReason": "Revoked by admin. Tx: 0x...",
    ...
  }
}
```

**Errores:**
- `400` — El badge aún no tiene token on-chain
- `403` — No autorizado para revocar este badge
- `404` — Emisión de badge no encontrada
- `409` — El badge ya está revocado

---

### Endpoints de Consulta

#### `GET /groups/:groupId/badges`

Lista todas las definiciones de badges de un grupo, incluyendo sus emisiones y miembros. **Público** (no requiere autenticación).

**Response `200`:**
```json
[
  {
    "id": "clx...",
    "adminId": "clx...",
    "groupId": "clx...",
    "name": "Contributor",
    "description": "Otorgado a contribuidores",
    "imageURI": "ipfs://QmXxx...",
    "createdAt": "2024-...",
    "updatedAt": "2024-...",
    "badgeAwards": [
      {
        "id": "clx...",
        "badgeDefinitionId": "clx...",
        "memberId": "clx...",
        "onChainTokenId": 42,
        "transactionHash": "0x...",
        "status": "confirmed",
        "awardedAt": "2024-...",
        "confirmedAt": "2024-...",
        "revokedAt": null,
        "member": {
          "id": "clx...",
          "walletAddress": "0x...",
          "displayName": "Alice"
        }
      }
    ],
    "_count": {
      "badgeAwards": 1
    }
  }
]
```

---

#### `GET /members/:memberId/badges`

Lista todos los badges emitidos a un miembro específico, incluyendo definiciones de badges e información del grupo. **Público** (no requiere autenticación).

**Response `200`:**
```json
{
  "member": {
    "id": "clx...",
    "walletAddress": "0x...",
    "displayName": "Alice"
  },
  "badges": [
    {
      "id": "clx...",
      "badgeDefinitionId": "clx...",
      "memberId": "clx...",
      "onChainTokenId": 42,
      "transactionHash": "0x...",
      "status": "confirmed",
      "awardedAt": "2024-...",
      "confirmedAt": "2024-...",
      "revokedAt": null,
      "badgeDefinition": {
        "id": "clx...",
        "name": "Contributor",
        "description": "Otorgado a contribuidores",
        "imageURI": "ipfs://QmXxx...",
        "group": {
          "id": "clx...",
          "name": "Developers"
        }
      }
    }
  ]
}
```

**Errores:**
- `404` — Miembro no encontrado

---

## Resumen de Endpoints

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `POST` | `/auth/siwe-message` | — | Obtener mensaje SIWE para firmar |
| `POST` | `/auth/siwe-verify` | — | Verificar firma, obtener JWT |
| `POST` | `/auth/initialize-minter-role` | JWT | Otorgar MINTER_ROLE al relayer |
| `GET` | `/auth/relayer-status` | JWT | Consultar estado de wallet relayer |
| `POST` | `/groups` | JWT | Crear un grupo |
| `GET` | `/groups` | JWT | Listar grupos del admin |
| `GET` | `/groups/:id` | — | Obtener detalles del grupo |
| `PUT` | `/groups/:id` | JWT | Actualizar grupo |
| `DELETE` | `/groups/:id` | JWT | Eliminar grupo (cascada) |
| `POST` | `/groups/:id/members` | JWT | Agregar miembro al grupo |
| `DELETE` | `/groups/:id/members/:memberId` | JWT | Eliminar miembro |
| `POST` | `/badge-definitions` | JWT | Crear definición de badge |
| `GET` | `/badge-definitions/:id` | — | Obtener definición de badge |
| `POST` | `/badge-definitions/:id/validate` | JWT | Validar elegibilidad (oráculo) |
| `POST` | `/badge-definitions/:id/award` | JWT | Emitir badge (acuñar on-chain) |
| `POST` | `/badges/metadata` | JWT | Subir metadata a IPFS |
| `POST` | `/badge-awards/:id/verify-receipt` | JWT | Verificación manual de tx |
| `POST` | `/badge-awards/:id/revoke` | JWT | Revocar un badge |
| `GET` | `/groups/:groupId/badges` | — | Listar badges del grupo |
| `GET` | `/members/:memberId/badges` | — | Listar badges del miembro |

**Total: 20 endpoints** (12 protegidos, 8 públicos)

---

## Ciclo de Vida del Estado de un Badge Award

```
           ┌──────────┐
           │ pending  │ ← Creado cuando la tx de acuñación se envía
           └────┬─────┘
                │
       ┌────────┴────────┐
       │                  │
  Indexador           Indexador
  (tx confirmada)     (tx revertida)
       │                  │
       ▼                  ▼
 ┌───────────┐     ┌──────────┐
 │ confirmed │     │  failed  │ ← Se puede re-emitir
 └───────────┘     └──────────┘
       │
  Admin llama
  /revoke
       │
       ▼
  ┌──────────┐
  │ revoked  │ ← Permanente
  └──────────┘
```

---

## Consideraciones de Seguridad

### Gestión de Llaves Privadas

- Las llaves privadas de los relayers se encriptan en reposo usando **AES-256-GCM + PBKDF2**
- Clave maestra desde la variable de entorno `ENCRYPTION_MASTER_KEY`
- **Nunca** registrar llaves privadas en texto plano en logs
- **Nunca** exponer llaves encriptadas en respuestas de la API
- Mejora para producción: Migrar a AWS KMS o HashiCorp Vault

### Autenticación

- Los mensajes SIWE incluyen un nonce único (almacenado en servidor, expiración de 10 min, marcado como usado tras verificación)
- Los tokens JWT son stateless, firmados con `JWT_SECRET`, expiran después de `JWT_EXPIRATION`
- Todos los endpoints protegidos requieren `Authorization: Bearer <JWT_TOKEN>`

### Control de Acceso

- La pertenencia del administrador se verifica en cada endpoint mutante
- Los miembros se validan para pertenecer al grupo del badge antes de emitir
- Las direcciones Ethereum se validan y formatean con checksum vía ethers.js
- Restricciones únicas previenen badges duplicados por miembro

### Base de Datos

- Prisma ORM para consultas type-safe
- Eliminación en cascada para integridad de datos (eliminar grupo → elimina miembros, badges)
- Restricciones únicas previenen nombres de grupo, miembros y badges duplicados

---

## Testing

> Todos los comandos se ejecutan desde la **raíz del monorepo** (`proof-of-achievement/`).

```bash
npm run test -w apps/api
```

### Suites de Tests

| Suite | Tests | Cobertura |
|-------|-------|-----------|
| `permissions.test.ts` | 8 | Pertenencia de admin, membresía de grupo, unicidad de badges, validación de direcciones |
| `auth.service.test.ts` | 5 | Generación de mensajes SIWE, verificación JWT, expiración de tokens |
| `encryption.test.ts` | 4 | Encriptar/desencriptar ida y vuelta, detección de manipulación |
| `badge-verification.test.ts` | 4 | Interpretación de estado de recibos, transiciones de estado |
| `validation.service.test.ts` | 19 | Validación de oráculo, todos los tipos de evidencia, validación por lotes |
| `ipfs.service.test.ts` | 6 | uploadJSON, uploadFile, toGatewayUrl, manejo de errores |
| `event-indexer.service.test.ts` | 7 | Ciclo de vida, emisiones pendientes (confirmadas/revertidas/omitidas) |
| **Total** | **63** | |

Ejecutar un archivo específico:
```bash
npm run test -w apps/api -- --testPathPattern=validation.service.test.ts
```

Modo watch:
```bash
npm run test:watch -w apps/api
```

---

## Decisiones de Diseño

| Decisión | Elección | Razón |
|----------|----------|-------|
| **SDK Blockchain** | ethers.js v6 | Estable, mejor para integraciones backend |
| **Autenticación** | JWT (stateless) | Escalable, estándar para APIs REST |
| **Nonce SIWE** | Persistir + validar en servidor | Protección contra replay; nonce almacenado en DB, marcado como usado tras verificación, expiración de 10 min |
| **Confirmación de Tx** | Optimista + indexador de eventos | Respuesta rápida del endpoint; indexador auto-confirma vía sondeo cada 30s |
| **Encriptación de Llaves** | AES-256-GCM + PBKDF2 | Encriptación simétrica fuerte; clave maestra solo en variables de entorno |
| **Modelo Relayer** | 1 por administrador | Cada admin tiene wallet aislada, alcance claro de gestión de llaves |
| **Modelo Oráculo** | Simulado (backend valida off-chain) | Pragmático para prototipo académico; validation.service.ts verifica evidencia |
| **IPFS** | Pinata (opcional) | Metadata subida a IPFS si PINATA_JWT está configurado; fallback elegante si no |
| **Indexador de Eventos** | Sondeo cada 30s | Job en segundo plano procesa emisiones pendientes y escucha nuevos eventos |

---

## Limitaciones Conocidas y Trabajo Futuro

1. **Sin acuñación por lotes**: Cada badge es una transacción separada (costoso en gas para operaciones masivas)
2. **Sin mecanismo de pausa**: Si el relayer es comprometido, el admin debe revocar MINTER_ROLE manualmente
3. **KMS para producción**: La encriptación AES-256-GCM actual es suficiente para testnet; producción debería usar AWS KMS o Vault
4. **Sin limpieza automática de nonces**: Los nonces SIWE expirados deben limpiarse vía `authService.cleanupExpiredNonces()` (puede ser un job programado)
5. **IPFS opcional**: Si PINATA_JWT no está configurado, la metadata usa URIs de marcador de posición; la metadata real requiere cuenta en Pinata
6. **Latencia de sondeo**: El indexador de eventos sondea cada 30s; la confirmación del badge toma hasta 30 segundos después de la minería on-chain
7. **Sin eventos WebSocket**: El servidor no envía actualizaciones en tiempo real a los clientes; el frontend debe consultar los cambios de estado

---

## Estructura del Proyecto

```
apps/api/
├── src/
│   ├── config.ts
│   ├── server.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── groups.routes.ts
│   │   └── badges.routes.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── wallet.service.ts
│   │   ├── relayer.service.ts
│   │   ├── validation.service.ts
│   │   ├── ipfs.service.ts
│   │   └── event-indexer.service.ts
│   ├── middleware/
│   │   └── auth.middleware.ts
│   └── utils/
│       └── encryption.ts
├── prisma/
│   ├── schema.prisma
│   └── schema.test.prisma
├── test/
│   ├── permissions.test.ts
│   ├── auth.service.test.ts
│   ├── encryption.test.ts
│   ├── badge-verification.test.ts
│   ├── validation.service.test.ts
│   ├── ipfs.service.test.ts
│   ├── event-indexer.service.test.ts
│   └── global-setup.ts
├── package.json
├── tsconfig.json
├── jest.config.cjs
├── .env.example
└── .env.test
```

---

## Licencia

MIT
