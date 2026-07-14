# **ANTEPROYECTO: Proof of Achievement (V2)**

**Plataforma descentralizada de logros verificables mediante Soulbound Tokens con Arquitectura de Implementación Avanzada**

## **1\. Resumen Ejecutivo de Mejoras Técnicas**

Esta nueva versión (V2) del documento de arquitectura expande la propuesta inicial de "Proof of Achievement" para subsanar los vacíos técnicos asociados con la gestión de oráculos, las comisiones de red (gas), el cumplimiento estricto de estándares EIP y la resiliencia del sistema ante la pérdida de llaves privadas por parte de los usuarios. El sistema transiciona de un modelo conceptual simple a una infraestructura Web3 de grado industrial adaptada para instituciones educativas y de entretenimiento digital.

## **2\. Arquitectura de Infraestructura Avanzada**

### **2.1. Sistema de Oráculo mediante Firmas Criptográficas ECDSA (Off-Chain)**

Para evitar los costos operativos y la latencia excesiva de oráculos descentralizados tradicionales en la fase de prototipo, se implementa un modelo de oráculo de fuente única basado en criptografía asimétrica (ECDSA). El backend central de la organización actúa como la entidad validadora off-chain. Cuando un evento ocurre (por ejemplo, aprobación de una materia o una victoria en un juego), el backend firma digitalmente un hash compuesto por los datos esenciales de la transacción.

`// Implementación de Verificación ECDSA en Solidity (AchievementSBTPlatform.sol)`  
`import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";`

`mapping(address => bool) public isValidator;`

`function issueAchievementWithSignature(`  
    `uint256 achievementId,`   
    `bytes memory signature`  
`) external {`  
    `bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, achievementId));`  
    `bytes32 ethSignedMessageHash = ECDSA.toEthSignedMessageHash(messageHash);`  
      
    `address signer = ECDSA.recover(ethSignedMessageHash, signature);`  
    `require(isValidator[signer], "SBT: Firma de validador invalida");`  
      
    `_mintSBT(msg.sender, achievementId);`  
`}`

Este enfoque garantiza que el contrato inteligente verifique la legitimidad de la procedencia de la evidencia sin necesidad de interactuar directamente con el entorno externo, mitigando ataques de inyección de datos maliciosos en la red.

### **2.2. Gobernanza y Modelo de Control de Accesos (AccessControl)**

Con el fin de mitigar riesgos críticos de seguridad tales como el compromiso de llaves de los validadores, el sistema segrega estrictamente las funciones operativas y administrativas mediante el estándar AccessControl de OpenZeppelin.

| Rol del Sistema | Entidad Asignada | Capacidades Técnicas | Mitigación de Riesgos   |
| :---- | :---- | :---- | :---- |
| **DEFAULT\_ADMIN\_ROLE** | Billetera Fría / Multisig Institucional | Revocación de credenciales, asignación de validadores, gestión de contratos. | Evita que el hackeo de un servidor automatizado destruya la base de logros histórica. |
| **VALIDATOR\_ROLE** | Llave del Servidor Automatizado (API Backend) | Emisión de firmas criptográficas para habilitar el minteo de SBTs por los usuarios. | No posee privilegios destructivos (no puede revocar ni alterar la estructura base). |

### **2.3. Cumplimiento del Estándar ERC-5192 (Minimal Soulbound Tokens)**

Para garantizar una interoperabilidad total y estandarizada dentro del ecosistema Web3, el contrato inteligente implementa explícitamente la interfaz del estándar ERC-5192. Esto comunica formalmente a los mercados secundarios, billeteras y exploradores de bloques que los tokens están perpetuamente bloqueados.

`// Interfaz ERC-5192 de bloqueo inmutable`  
`interface IERC5192 {`  
    `event Locked(uint256 tokenId);`  
    `event Unlocked(uint256 tokenId);`  
    `function locked(uint256 tokenId) external view returns (bool);`  
`}`

`contract AchievementSBT is IERC5192 {`  
    `// Los tokens se mintean directamente en estado bloqueado`  
    `function locked(uint256 tokenId) external view override returns (bool) {`  
        `require(_exists(tokenId), "SBT: El token no existe");`  
        `return true;`   
    `}`  
`}`

### **2.4. Abstracción de Tarifas de Red (Experiencia de Usuario Gasless via ERC-2771)**

Uno de los principales obstáculos para la adopción masiva en entornos universitarios y de gaming es la fricción de adquirir criptoactivos nativos para costear el gas de red. Se soluciona implementando el estándar de transacciones gasless **ERC-2771**.

* **Firma Digital del Usuario:** El usuario final firma un mensaje digital (EIP-712) que denota su intención de mintear el logro. Esta acción no requiere gas.  
* **Estructura del Relayer:** Un servicio intermedio automatizado (ej. OpenZeppelin Defender Relay) toma el mensaje firmado del usuario, empaqueta la transacción, paga la tarifa correspondiente de la testnet, y la distribuye directamente hacia el contrato inteligente.  
* **Extracción Contextual:** El smart contract hereda de ERC2771Context, permitiendo descifrar de manera transparente el emisor original mediante la función interna \_msgSender().

### **2.5. Protocolo de Recuperación Institucional ante Pérdida de Claves Privadas**

Dado que un Soulbound Token está intrínsecamente anclado a la identidad digital de una billetera, el extravío de llaves privadas tradicionalmente implicaría la pérdida total del historial de logros de la persona. Se introduce una función controlada institucionalmente para resolver esta contingencia crítica:

`// Protocolo de Recuperación Institucional Seguro`  
`function recoverSBT(`  
    `address oldWallet,`   
    `address newWallet,`   
    `uint256 achievementId`  
`) external onlyRole(DEFAULT_ADMIN_ROLE) {`  
    `require(hasAchievement(oldWallet, achievementId), "SBT: La cuenta anterior no posee el logro");`  
    `require(!hasAchievement(newWallet, achievementId), "SBT: La cuenta destino ya cuenta con este logro");`  
      
    `_burn(oldWallet, achievementId); // Quema el token en la billetera comprometida`  
    `_mintSBT(newWallet, achievementId); // Reemite el token a la nueva billetera verificada`  
`}`

Este proceso requiere una verificación offline y formal por parte del departamento de admisiones o soporte técnico de la organización, asegurando que se preserva la integridad de la identidad del acreedor.

## **3\. Matriz de Despliegue de Componentes Actualizada**

Para reflejar adecuadamente la introducción de los nuevos elementos arquitectónicos, la estrategia de despliegue queda consolidada bajo el siguiente esquema técnico:

| Componente de Sistema | Tecnología Seleccionada | Estrategia de Despliegue   |
| :---- | :---- | :---- |
| **Núcleo del Smart Contract** | Solidity v0.8.20 \+ ERC-5192 \+ ERC-2771 | Sepolia Testnet / Polygon Amoy (Hardhat Compiler) |
| **Infraestructura Gasless Relayer** | OpenZeppelin Defender Relayer API | Servicio en la nube integrado con el Backend Corporativo |
| **Oráculo & Backend de Gestión** | Node.js / TypeScript \+ Ethers.js (Criptografía ECDSA) | Entorno de contenedores Docker en Railway / Render |
| **Almacenamiento de Metadatos** | IPFS (InterPlanetary File System) | Nodos persistentes vía Pinata SDK |

