# CONTEXTO PARA ASISTENTE IA - PROYECTO SBT PLATFORM

## 1. Visión General del Proyecto

- **Nombre:** Plataforma descentralizada de logros verificables mediante Soulbound Tokens (SBT).
- **Objetivo:** Permitir a organizaciones (estudios de juegos, universidades, empresas) emitir credenciales no transferibles (SBT) a usuarios, verificables públicamente en blockchain.
- **Características clave:**
  - Jerarquía: Organización → Grupo → Proyecto → Logro → SBT emitido.
  - Tokens no transferibles (ERC-5192).
  - Validación externa mediante oráculo o cuenta autorizada.
  - Metadata almacenada en IPFS.

## 2. Stack Tecnológico Elegido

- **Monorepo:** Turborepo + npm workspaces.
- **Smart Contracts:** Hardhat + Solidity (ERC-5192).
- **Backend:** Node.js + TypeScript + Express.
- **ORM y BD:** Prisma + PostgreSQL.
- **Interacción Blockchain:** Viem (tanto en backend como en frontend).
- **Frontend:** React + TypeScript + Vite + Wagmi + RainbowKit.
- **Estructura:**
  - `apps/client/` - Frontend React.
  - `apps/api/` - Backend Express.
  - `packages/contracts/` - Contratos Hardhat.
  - `packages/shared-types/` (o `@repo/types`) - Tipos compartidos.

## 3. Arquitectura y Flujo de Datos

- **Frontend:**
  - Lee datos del contrato (vista) usando `wagmi` y `viem`.
  - Conecta wallets de usuarios con RainbowKit.
  - **NO** escribe en el contrato directamente (excepto firmas para autenticación).
  - Se comunica con el backend para obtener datos indexados (GET `/api/achievements/user/:address`).

- **Backend:**
  - Expone API REST (Express).
  - Contiene la(s) wallet(s) validadora(s) (clave privada en `.env`).
  - Valida la evidencia del logro (lógica de negocio).
  - Firma y envía la transacción `issueAchievement` usando Viem.
  - Indexa eventos de blockchain en PostgreSQL para consultas rápidas.
  - Gestiona subida de metadata a IPFS.

- **Contrato Inteligente:**
  - Registra Organización → Grupo → Proyecto → Logro.
  - Emite SBTs (ERC-5192).
  - Funciones clave: `createOrganization`, `createGroup`, `createProject`, `createAchievement`, `issueAchievement` (solo validador), `hasAchievement`.

- **Compartir ABIs:**
  - El paquete `contracts` genera los artifacts en `artifacts/`.
  - Backend y frontend importan la ABI como: `import contractArtifact from 'contracts/artifacts/contracts/...'`.
  - Esto garantiza sincronización automática.

## 4. Gestión de Wallets y Seguridad (Consensuado)

- **Cada organización debe tener su propia wallet validadora** (aislamiento de riesgos, trazabilidad, delegación).
- En el prototipo inicial, se usará **una única wallet** en el backend (configurada en `.env`) para simplificar pruebas, pero el diseño debe permitir escalar a múltiples wallets.
- **El backend nunca debe exponer claves privadas en el frontend.**
- El validador autorizado (backend) paga el gas de las transacciones (mejor UX).

## 5. Configuración del Monorepo (Turborepo)

- **Estructura esperada:**
  proof-of-achievement/
  ├── apps/
  │ ├── api/
  │ │ ├── src/ # routes, controllers, services, prisma
  │ │ ├── prisma/ # schema.prisma
  │ │ ├── package.json
  │ │ └── tsconfig.json
  │ └── client/
  │ ├── src/
  │ ├── package.json
  │ └── vite.config.ts
  ├── packages/
  │ ├── contracts/ # Hardhat
  │ └── shared-types/ # o @repo/types
  ├── turbo.json
  ├── pnpm-workspace.yaml # o npm workspaces
  └── package.json # raíz con scripts

- **Scripts raíz:** `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm clean`.
- **Archivos de configuración:** Asegurar que existen `.eslintrc.js`, `.prettierrc`, `.gitignore` completo.
- **Compartir tipos:** Usar `"workspace:*"` en dependencias internas.

## 6. Base de Datos (Prisma)

- Modelos definidos en `schema.prisma`: Organization, Group, Project, Achievement, IssuedAchievement, User.
- `IssuedAchievement` guarda referencia al tokenId, userAddress, validator, txHash.
- `postinstall` script para generar Prisma Client automáticamente.

## 7. Variables de Entorno Necesarias

- **Backend:**
- `DATABASE_URL`
- `CONTRACT_ADDRESS`
- `VALIDATOR_PRIVATE_KEY`
- `SEPOLIA_RPC_URL`
- `CORS_ORIGIN`

- **Frontend:**
- `VITE_CONTRACT_ADDRESS`
- `VITE_SEPOLIA_RPC_URL`
- `VITE_API_URL` (para conectar con backend)

## 8. Estado Actual (Pendientes)

- [ ] Migrar de npm a pnpm (recomendado).
- [ ] Añadir ESLint y Prettier a nivel de monorepo.
- [ ] Completar `.gitignore` con exclusiones de Turborepo y pnpm.
- [ ] Configurar scripts `lint` y `clean` en `turbo.json` y `package.json` raíz.
- [ ] Crear los servicios en el backend: `blockchain.service.ts` (con Viem), `ipfs.service.ts`, `validation.service.ts`.
- [ ] Implementar las rutas y controladores para la lógica de negocio.
- [ ] Conectar el frontend al backend para listar logros y usar RainbowKit/Wagmi.

## 9. Instrucciones para el Asistente del IDE

- Al recibir consultas sobre el código, asume que estamos trabajando dentro de este monorepo y con las tecnologías listadas.
- Prioriza soluciones que mantengan la sincronización de ABIs a través del paquete `contracts`.
- Para el backend, usa Express, Prisma y Viem. No uses ethers.js.
- Para el frontend, usa Wagmi, Viem y RainbowKit.
- Recuerda que el frontend es de solo-lectura para el contrato; las escrituras van por el backend.
- Si se sugiere agregar un nuevo paquete, recuerda actualizar `pnpm-workspace.yaml` (o `workspaces` en `package.json` raíz).

---

## Contexto Adicional

- El usuario ha mostrado preferencia por la claridad, la estructura modular y las buenas prácticas (ESLint, Prettier, TypeScript estricto).
- El foco principal ahora es **configurar correctamente la base del monorepo** y **empezar a escribir el código del backend y frontend** con la lógica de SBT.
- La guía definitiva para la estructura del monorepo se ha basado en: [https://github.com/neiserdeveloper/turborepo-react-nest-starter/tree/main](https://github.com/neiserdeveloper/turborepo-react-nest-starter/tree/main) (adaptado a Express).
