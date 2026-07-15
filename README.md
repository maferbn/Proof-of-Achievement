# Plataforma Descentralizada SBT — Proof of Achievement

Este proyecto es una plataforma descentralizada diseñada para emitir, almacenar y verificar credenciales digitales no transferibles mediante **Soulbound Tokens (SBT)** bajo el estándar **ERC-5192** (o ERC-721 restrictivo).

Permite a organizaciones (ej. universidades, comunidades, empresas de gaming) certificar logros públicamente en la blockchain, manteniendo la lógica de negocio y validación de evidencias fuera de la cadena para optimizar el gas y garantizar la privacidad de los datos.

---

## Tabla de contenidos

1. [Estructura del Monorepo](#1-estructura-del-monorepo)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Prerrequisitos del sistema](#3-prerrequisitos-del-sistema)
4. [Configuración paso a paso](#4-configuración-paso-a-paso)
   - [4.1 Clonar el repositorio](#41-clonar-el-repositorio)
   - [4.2 Instalar dependencias](#42-instalar-dependencias)
   - [4.3 Configurar variables de entorno](#43-configurar-variables-de-entorno)
   - [4.4 Preparar la base de datos](#44-preparar-la-base-de-datos)
   - [4.5 Compilar los contratos](#45-compilar-los-contratos)
   - [4.6 Desplegar el contrato](#46-desplegar-el-contrato)
   - [4.7 Generar el cliente Prisma y correr migraciones](#47-generar-el-cliente-prisma-y-correr-migraciones)
   - [4.8 Iniciar el desarrollo](#48-iniciar-el-desarrollo)
5. [Comandos de Uso Frecuente](#5-comandos-de-uso-frecuente)
6. [Funcionalidades Pendientes](#6-funcionalidades-pendientes)

---

## 1. Estructura del Monorepo

El proyecto está organizado utilizando **Turborepo** y **npm workspaces**:

```
proof-of-achievement/
├── apps/
│   ├── client/               # Frontend en React + Vite + TypeScript (Wagmi/RainbowKit)
│   └── api/                  # Backend API en Node/Express + Prisma (PostgreSQL)
├── packages/
│   ├── contracts/            # Smart contracts (Hardhat, Solidity, OpenZeppelin)
│   └── shared-types/         # Tipos TypeScript comunes para frontend y backend
├── docs/                     # Documentación de fases (PHASE_1_SUMMARY, PHASE_2_SUMMARY)
├── package.json              # Configuración y scripts raíz del monorepo
└── turbo.json                # Configuración de las tareas de compilación y caché de Turbo
```

---

## 2. Stack Tecnológico

- **Monorepo**: Turborepo + npm workspaces.
- **Smart Contracts**: Hardhat + Solidity + OpenZeppelin (ERC-721 + ERC-5192 + AccessControl).
- **Frontend**: React + TypeScript + Vite + Wagmi + RainbowKit + Viem.
- **Backend**: Express/Node.js + Prisma ORM + Supabase (PostgreSQL) + Ethers.js.
- **Oráculo**: Validación off-chain simulada (`validation.service.ts`).
- **Metadata**: Almacenamiento descentralizado en IPFS (Pinata).
- **Indexación**: Event indexer automático para sincronización on-chain ↔ DB.

---

## 3. Prerrequisitos del sistema

Antes de empezar, asegúrate de tener instalado:

| Requisito | Versión recomendada | Notas |
|-----------|---------------------|-------|
| Node.js | `>= 20` | El monorepo usa `packageManager: npm@10.8.2` |
| npm | `>= 10` | Viene con Node.js 20+ |
| Cuenta en Supabase | — | Base de datos PostgreSQL en la nube (recomendado) |
| PostgreSQL local | `>= 14` | Alternativa si prefieres correrlo localmente |
| Cuenta en Pinata | — | Gateway IPFS para almacenar metadata de badges (gratis hasta 1GB) |
| Git | Cualquier versión reciente | |

### Herramientas opcionales pero recomendadas

- **MetaMask** o cualquier wallet compatible con EVM para probar el flujo Web3.
- **Node local de Hardhat** para desarrollo sin gastar gas real.
- Cuenta en **Alchemy** o **Infura** si vas a desplegar o probar en Sepolia.

Verifica tu entorno con:

```bash
node -v
npm -v
git --version
```

---

## 4. Configuración paso a paso

> **Nota:** Esta guía está pensada para los miembros del equipo que ya tienen acceso al repositorio y a los recursos compartidos (Supabase, RPCs, wallets de prueba, etc.). Todos los comandos se ejecutan desde la **raíz del proyecto**, a menos que se indique lo contrario.

### 4.1 Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd proof-of-achievement
```

### 4.2 Instalar dependencias

```bash
npm install
```

Esto instalará todas las dependencias de los workspaces (`apps/*` y `packages/*`) y las herramientas compartidas como `turbo` y `prettier`.

### 4.3 Configurar variables de entorno

El proyecto necesita archivos `.env` en dos lugares. Puedes copiar los ejemplos y completarlos:

#### Backend (`apps/api/.env`)

```bash
cp apps/api/.env.example apps/api/.env
```

Completa al menos estas variables:

| Variable | Descripción | Cómo obtenerla |
|----------|-------------|----------------|
| `DATABASE_URL` | URL de conexión a PostgreSQL (Supabase) | Ver paso 4.4 para obtener la URL del pooler |
| `SEPOLIA_RPC_URL` | RPC de Sepolia | Alchemy, Infura u otro proveedor |
| `REPUTATION_BADGE_CONTRACT_ADDRESS` | Dirección del contrato desplegado | La obtienes en el paso 4.6 |
| `DEPLOYER_PRIVATE_KEY` | Llave privada de la wallet que desplegó el contrato | De tu wallet (MetaMask, etc.) |
| `ENCRYPTION_MASTER_KEY` | Clave maestra para encriptar relayers | Genera con: `node -e "console.log('0x' + require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_SECRET` | Secreto para firmar JWT | Genera con: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `PINATA_JWT` | JWT de Pinata para subir metadata a IPFS | Genera una API key en https://app.pinata.cloud (opcional, IPFS se omite si no se configura) |
| `PINATA_GATEWAY` | Gateway para resolver URIs IPFS | Por defecto: `https://gateway.pinata.cloud` |

#### Contratos (`packages/contracts/.env`)

```bash
cp packages/contracts/.env.example packages/contracts/.env
```

Completa:

| Variable | Descripción |
|----------|-------------|
| `SEPOLIA_RPC_URL` | RPC de Sepolia para despliegues |
| `PRIVATE_KEY` | Llave privada de la wallet que desplegará el contrato |

> **Advertencia de seguridad:** Nunca subas archivos `.env` ni llaves privadas al control de versiones. Ambos están ignorados en `.gitignore`.

### 4.4 Conectar la base de datos (Supabase)

La base de datos del proyecto **ya está creada en Supabase**. No necesitas crear un nuevo proyecto ni una nueva base de datos.

1. Pide el **connection string** del proyecto de Supabase al administrador del repositorio, o cópialo desde el panel compartido del proyecto.
2. Pégalo en `apps/api/.env` como `DATABASE_URL`.

El formato esperado es similar a:

```
postgresql://postgres.xxx:[PASSWORD]@aws-1-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require
```

> **Importante:** No compartas este link públicamente ni lo subas al repositorio. Debe permanecer solo en tu archivo `.env` local.

### 4.5 Compilar los contratos

```bash
npm run compile
```

Esto ejecuta `hardhat compile` en el workspace de contratos y regenera los artefactos y tipos de TypeChain.

### 4.6 Desplegar el contrato

Puedes desplegar en una red local de Hardhat o en Sepolia.

#### Opción A: Red local de Hardhat (recomendado para desarrollo)

1. En una terminal, inicia el nodo local:

```bash
npm run node -w packages/contracts
```

2. En otra terminal, despliega el contrato:

```bash
npm run deploy:localhost -w packages/contracts
```

3. Copia la dirección del contrato impresa en consola y pégala en `apps/api/.env` como `REPUTATION_BADGE_CONTRACT_ADDRESS`.

#### Opción B: Sepolia testnet

Asegúrate de que `SEPOLIA_RPC_URL` y `PRIVATE_KEY` en `packages/contracts/.env` estén correctas y de que la wallet tenga ETH de Sepolia (faucet).

```bash
npm run deploy:sepolia -w packages/contracts
```

Copia la dirección del contrato a `apps/api/.env`.

### 4.7 Generar el cliente Prisma y correr migraciones

Con la base de datos creada y `DATABASE_URL` configurada:

```bash
# Generar el cliente de Prisma
npx turbo db:generate --filter=api

# Crear y aplicar migraciones
npm run db:migrate -w apps/api
```

Para reiniciar la base de datos durante desarrollo (borra todos los datos):

```bash
npm run db:reset -w apps/api
```

### 4.8 Iniciar el desarrollo

Con todo configurado, inicia el frontend y el backend en paralelo:

```bash
npm run dev
```

Por defecto:

- **API** corre en: http://localhost:3000
- **Cliente** corre en: http://localhost:3001

---

## 5. Comandos de Uso Frecuente

Ejecuta todos estos comandos desde la **raíz del proyecto**:

### Instalación de dependencias
```bash
npm install
```

### Entorno de desarrollo (inicia cliente y backend en paralelo)
```bash
npm run dev
```

### Compilar todos los paquetes y aplicaciones
```bash
npm run build
```

### Compilar únicamente los contratos inteligentes (Hardhat)
```bash
npm run compile
```

### Ejecutar las pruebas unitarias
```bash
npm run test
```

### Ejecutar linters y formateador en todo el proyecto
```bash
npm run lint
npm run format
```

### Limpiar artefactos y caché de Turbo
```bash
npm run clean
```

### Comandos útiles por workspace

```bash
# API: tests en modo watch
npm run test:watch -w apps/api

# API: servidor compilado
npm start -w apps/api

# Contratos: nodo local
npm run node -w packages/contracts

# Contratos: despliegue local
npm run deploy:localhost -w packages/contracts

# Contratos: despliegue en Sepolia
npm run deploy:sepolia -w packages/contracts
```

---

## 6. Estado de Funcionalidades

### 💻 Backend API (`apps/api/`) — **Implementado**
- [x] **Configuración Inicial**: Express, CORS, variables de entorno, health check con estado de servicios.
- [x] **Persistencia (Prisma & PostgreSQL)**: Schema con 7 modelos, migraciones, soporte SQLite para tests.
- [x] **Servicio de Blockchain**: Interacción con ReputationBadge.sol vía Ethers.js (mint, grantMinter, revokeMinter, hasRole, revokeBadge, isRevoked).
- [x] **Autenticación (SIWE + JWT)**: Login con billetera Ethereum, nonces anti-replay, tokens JWT.
- [x] **Relayer Wallets**: Gestión de wallets por admin, encriptación AES-256-GCM de llaves privadas.
- [x] **Oráculo Simulado (`validation.service.ts`)**: Validación off-chain de evidencias antes de emitir badges. Soporte para múltiples tipos: cursos, juegos, exámenes, contribuciones.
- [x] **Servicio IPFS (`ipfs.service.ts`)**: Subida de metadata e imágenes a IPFS vía Pinata. Endpoint `POST /badges/metadata`.
- [x] **Event Indexer (`event-indexer.service.ts`)**: Background job que sincroniza eventos on-chain (`BadgeMinted`, `BadgeRevoked`) con la base de datos automáticamente vía polling.
- [x] **ABI Compartido**: ABI del contrato centralizada en `@repo/shared-types`, consumida por API y cliente.
- [x] **API REST**: Endpoints para grupos, miembros, badge definitions, badge awards, validación, IPFS metadata, revocación y verificación de transacciones.
- [x] **Tests**: 63 tests unitarios e integración (7 suites).

### 🔗 Blockchain & Contratos
- [x] **Estándar ERC-5192**: `ReputationBadge.sol` implementa `IERC5192` con `locked()`, eventos `Locked`/`Unlocked` y `supportsInterface`.
- [x] **Revocación de Badges**: Funciones `revokeBadge(tokenId)` e `isRevoked(tokenId)` con eventos `BadgeRevoked`.
- [x] **Script de despliegue**: Despliegue automatizado en localhost (Hardhat) y Sepolia.
- [ ] **Recuperación institucional ante pérdida de claves**: Función `recoverSBT` controlada por `DEFAULT_ADMIN_ROLE` (propuesto en Anteproyecto V2).

### 🎨 Frontend (`apps/client/`)
- [ ] **Conexión API**:
  - Reemplazar la data demo del tablero por llamadas HTTP reales al servidor backend (`apps/api`) para listar y solicitar logros.
- [ ] **Autenticación Web3 (SIWE)**:
  - Implementar flujo de inicio de sesión con billetera (Sign-In with Ethereum) para asegurar que solo los dueños de la cuenta puedan solicitar o ver sus perfiles de forma autorizada.
- [ ] **Panel de Administración**:
  - Crear la UI para organizaciones, que les permita crear nuevos Grupos, Proyectos y registrar Logros con sus respectivas imágenes y descripciones.

---

## 7. Arquitectura del Backend

### Flujo de emisión de badges

1. **Admin** se autentica con SIWE (firma con su wallet) → obtiene JWT
2. **Admin** inicializa su relayer wallet → backend genera wallet, encripta llave, otorga `MINTER_ROLE` on-chain
3. **Admin** crea grupo y agrega miembros
4. **Admin** crea badge definition → metadata se sube a IPFS (si `PINATA_JWT` está configurado)
5. **Admin** valida evidencia del miembro → `POST /badge-definitions/:id/validate` (oráculo simulado)
6. **Admin** emite badge → `POST /badge-definitions/:id/award`
   - Backend valida ownership, membresía, evidencia
   - Relayer wallet firma `mint(recipiente, metadataURI)` on-chain
   - BadgeAward se guarda con `status: 'pending'`
7. **Event Indexer** detecta `BadgeMinted` → actualiza `status: 'confirmed'` automáticamente
8. **Admin** puede revocar → `POST /badge-awards/:id/revoke` (deployer firma `revokeBadge`)

### Servicios del backend

| Servicio | Archivo | Responsabilidad |
|----------|---------|-----------------|
| Auth | `auth.service.ts` | SIWE, JWT, nonces anti-replay |
| Wallet | `wallet.service.ts` | Generar y encriptar relayer wallets |
| Relayer | `relayer.service.ts` | Mint on-chain, MINTER_ROLE, revokeBadge |
| Validation | `validation.service.ts` | Oráculo simulado: valida evidencias off-chain |
| IPFS | `ipfs.service.ts` | Subir metadata e imágenes a Pinata |
| Event Indexer | `event-indexer.service.ts` | Sincronizar eventos on-chain con DB (polling 30s) |
