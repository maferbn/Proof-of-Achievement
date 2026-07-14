# Plataforma Descentalizada SBT — Proof of Achievement

Este proyecto es una plataforma descentralizada diseñada para emitir, almacenar y verificar credenciales digitales no transferibles mediante **Soulbound Tokens (SBT)** bajo el estándar **ERC-5192** (o ERC-721 restrictivo). 

Permite a organizaciones (ej. universidades, comunidades, empresas de gaming) certificar logros públicamente en la blockchain, manteniendo la lógica de negocio y validación de evidencias fuera de la cadena para optimizar el gas y garantizar la privacidad de los datos.

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
- **Smart Contracts**: Hardhat + Solidity + OpenZeppelin.
- **Frontend**: React + TypeScript + Vite + Wagmi + RainbowKit + Viem.
- **Backend**: Express/Node.js + Prisma ORM + PostgreSQL + Ethers.js.
- **Metadata**: Almacenamiento descentralizado en IPFS.

---

## 3. Comandos de Uso Frecuente

Ejecuta todos estos comandos desde la **raíz del proyecto**:

### Instalación de dependencias
```bash
npm install
```

### Entorno de desarrollo (Inicia cliente y backend en paralelo)
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

### Ejecutar las pruebas unitarias (Contratos)
```bash
npm run test
```

### Ejecutar linteadores y formateador en todo el proyecto
```bash
npm run lint
npm run format
```

---

## 4. Funcionalidades Pendientes (Próximas Fases)

### 💻 Backend API (`apps/api/`) — **Implementado**
- [x] **Configuración Inicial**: Express, CORS, variables de entorno.
- [x] **Persistencia (Prisma & PostgreSQL)**: Schema con 7 modelos, migraciones, soporte SQLite para tests.
- [x] **Servicio de Blockchain**: Interacción con ReputationBadge.sol vía Ethers.js (mint, grantMinter, revokeMinter, hasRole).
- [x] **Autenticación (SIWE + JWT)**: Login con billetera Ethereum, nonces anti-replay, tokens JWT.
- [x] **Relayer Wallets**: Gestión de wallets por admin, encriptación AES-256-GCM de llaves privadas.
- [x] **API REST**: Endpoints para grupos, miembros, badge definitions, badge awards y verificación de transacciones.
- [ ] **Servicio IPFS (`ipfs.service.ts`)**:
  - Integrar la subida y almacenamiento de metadatos del logro e imágenes a servicios como Pinata o Web3.Storage.

### 🔗 Blockchain & Contratos
- [ ] **Implementar estándar ERC-5192**:
  - Extender el contrato actual `ReputationBadge.sol` para implementar formalmente las interfaces ERC-5192 (`IERC5192` con soporte para eventos `Locked`/`Unlocked`).
- [ ] **Script de despliegue final**:
  - Automatizar el despliegue del contrato en la red de pruebas Sepolia configurando variables de entorno dinámicas.

### 🎨 Frontend (`apps/client/`)
- [ ] **Conexión API**:
  - Reemplazar la data demo del tablero por llamadas HTTP reales al servidor backend (`apps/api`) para listar y solicitar logros.
- [ ] **Autenticación Web3 (SIWE)**:
  - Implementar flujo de inicio de sesión con billetera (Sign-In with Ethereum) para asegurar que solo los dueños de la cuenta puedan solicitar o ver sus perfiles de forma autorizada.
- [ ] **Panel de Administración**:
  - Crear la UI para organizaciones, que les permita crear nuevos Grupos, Proyectos y registrar Logros con sus respectivas imágenes y descripciones.
