  
**ANTEPROYECTO**

**Proof of Achievement**

*Plataforma descentralizada de logros verificables mediante Soulbound Tokens*

**Materia: Blockchain**

# 

# 

# 

# 

# 

# 

# 

# 

# 

# 

# **1\. Introducción**

En la actualidad, los sistemas de logros, insignias digitales y certificados se han convertido en una forma habitual de reconocer el esfuerzo y los avances de las personas. Los videojuegos otorgan trofeos por completar desafíos, las plataformas educativas entregan insignias por finalizar cursos y muchas instituciones emiten certificados digitales que acreditan competencias adquiridas.

Sin embargo, la mayoría de estos reconocimientos se gestionan de forma centralizada. Esto significa que dependen de los servidores privados de cada plataforma, no pueden ser verificados con facilidad por terceros ajenos a esa plataforma y carecen de interoperabilidad: un logro obtenido en un sistema no tiene ningún valor ni representación en otro. Si la empresa que administra esos logros desaparece, cambia sus políticas o sufre una falla, la evidencia del logro puede perderse o quedar en entredicho.

El presente anteproyecto propone una alternativa basada en tecnología blockchain. La idea central es construir una plataforma de “logros como servicio” que permita a distintas organizaciones —estudios de videojuegos, universidades, plataformas de cursos, organizadores de eventos— crear y emitir logros verificables públicamente. Cada logro se representa mediante un Soulbound Token (SBT), es decir, un token no transferible asociado de forma permanente a la billetera del usuario que lo obtuvo. De esta manera, el logro deja de ser un dato encerrado en un servidor privado para convertirse en una credencial abierta, comprobable y resistente a la manipulación.

# **2\. Planteamiento del problema**

Los sistemas actuales de logros y certificaciones digitales presentan una serie de limitaciones que afectan su confiabilidad y su utilidad a largo plazo:

* **Centralización:** los logros se almacenan en servidores controlados por una única entidad, que tiene control total sobre su creación, modificación y eliminación.

* **Falta de verificación pública:** un tercero externo no puede comprobar de forma independiente si un logro es auténtico, pues depende de la palabra de la plataforma emisora.

* **Dependencia de una sola plataforma:** si el servicio cierra o cambia de políticas, los logros pueden perderse o dejar de ser accesibles.

* **Posibilidad de manipulación interna:** al no existir un registro inmutable, la entidad emisora podría alterar, falsificar o eliminar logros sin dejar rastro.

* **Poca interoperabilidad:** los logros de una organización no pueden reutilizarse ni reconocerse en otros sistemas o ecosistemas.

* **Riesgo de transferencia o venta:** cuando los logros se representan como NFT tradicionales, pueden venderse o transferirse a otra persona, lo que rompe el vínculo entre el logro y quien realmente lo mereció.

En consecuencia, surge la necesidad de un mecanismo que permita emitir logros de forma descentralizada, verificable por cualquiera, no transferible y reutilizable por múltiples tipos de organizaciones.

# **3\. Justificación**

El uso de blockchain resulta apropiado para resolver los problemas planteados porque ofrece un registro distribuido, inmutable y verificable públicamente. Una vez emitido un logro en la cadena, su existencia y autenticidad pueden ser comprobadas por cualquier persona sin necesidad de confiar en la plataforma emisora.

Los contratos inteligentes permiten definir, mediante código, las reglas bajo las cuales se crean las estructuras de logros y se emiten las credenciales, garantizando que solo organizaciones y validadores autorizados puedan realizar estas operaciones. Por su parte, los Soulbound Tokens (SBT) aportan la propiedad clave del proyecto: al ser tokens no transferibles, asocian el logro a la billetera del usuario de forma permanente, impidiendo que pueda venderse, regalarse o transferirse, tal como corresponde a una evidencia personal.

El almacenamiento descentralizado IPFS permite guardar la metadata de cada logro —nombre, descripción, imagen y atributos— fuera de la cadena, reduciendo costos y manteniendo una referencia inmutable. Finalmente, los oráculos posibilitan que el contrato reaccione a eventos del mundo real (por ejemplo, que un jugador ganó una partida o que un estudiante aprobó una materia), información que no existe de forma nativa dentro de la blockchain. La combinación de estas tecnologías hace posible una solución abierta, confiable y reutilizable.

# **4\. Objetivo general**

*Diseñar y desarrollar una plataforma descentralizada de logros verificables mediante Soulbound Tokens, que permita a organizaciones externas crear estructuras personalizadas de logros y emitir credenciales no transferibles a los usuarios, utilizando contratos inteligentes,* almacenamiento descentralizado y *mecanismos de validación externa mediante oráculos o validadores autorizados.*

# **5\. Objetivos específicos**

1. Diseñar una estructura flexible y jerárquica que permita representar organizaciones, grupos, proyectos y logros, adaptable a distintos tipos de clientes.

2. Implementar un contrato inteligente en Solidity que registre dicha estructura y emita los logros como Soulbound Tokens no transferibles.

3. Incorporar un mecanismo de validación mediante oráculo o validador autorizado que confirme las evidencias antes de emitir cada logro.

4. Utilizar IPFS para almacenar la metadata de los logros (nombre, descripción, imagen y atributos).

5. Definir y documentar al menos tres casos de uso: estudios de videojuegos y universidades, .

6. Plantear el esquema de despliegue de todos los componentes del sistema sobre una red de prueba (testnet).

# **6\. Alcance del proyecto**

El presente proyecto se limita al desarrollo de un prototipo funcional centrado en la infraestructura de logros. No se desarrollará un videojuego completo ni un sistema académico real en su totalidad; estos contextos se utilizan únicamente como ejemplos de aplicación.

El prototipo abarcará las siguientes funcionalidades:

* Creación de organizaciones dentro de la plataforma.

* Creación de grupos (categorías de juegos o carreras universitarias).

* Creación de proyectos (videojuegos o materias).

* Definición de logros asociados a cada proyecto.

* Emisión de Soulbound Tokens a las billeteras de los usuarios.

* Consulta pública de los logros emitidos.

Para la etapa de validación se empleará un oráculo simulado o una cuenta autorizada que represente al validador externo, evitando así la complejidad de integrar fuentes de datos reales en esta fase. Todo el despliegue se realizará sobre una red de prueba para evitar costos reales de transacción.

# **7\. Descripción general de la solución**

La plataforma se compone de varios módulos que trabajan de forma coordinada para permitir que las organizaciones creen logros y los emitan a sus usuarios de manera verificable:

* **Panel de administración:** interfaz donde cada organización crea y gestiona sus grupos, proyectos y logros.

* **Backend de gestión y validación:** servicio que coordina las operaciones, gestiona los datos auxiliares y prepara las validaciones antes de enviarlas al contrato.

* **Smart contract:** contrato que registra la estructura jerárquica y emite los logros como SBT.

* **IPFS:** almacenamiento descentralizado de la metadata de cada logro.

* **Oráculo o validador externo:** componente que confirma que la evidencia de un logro es legítima.

* **Frontend web:** interfaz pública donde los usuarios y terceros pueden consultar los logros emitidos.

* **Wallet del usuario:** billetera (por ejemplo MetaMask) donde el usuario recibe y conserva sus SBT.

# **8\. Tecnologías utilizadas**

El proyecto se apoya en un conjunto de tecnologías propias del ecosistema blockchain, seleccionadas para cumplir con los objetivos de descentralización, verificación pública y no transferibilidad:

* **Blockchain pública:** se utilizará una red compatible con Ethereum, preferiblemente una testnet como Sepolia o Polygon Amoy, o bien una red local con Hardhat para el desarrollo.

* **Smart contracts:** el contrato principal se programará en Solidity.

* **Soulbound Tokens (SBT):** tokens no transferibles que representan cada logro obtenido. 

* **ERC-721 / ERC-5192:** el estándar ERC-721 sirve de base para los tokens no fungibles, mientras que ERC-5192 define la propiedad de “bloqueo” (locked) que convierte un token en no transferible. 

  Para el desarrollo de los logros digitales de esta plataforma se utilizará el estándar ERC-5192 (Minimal Soulbound NFTs), el cual funciona como una extensión directa del estándar de tokens no fungibles ERC-721.

  A diferencia de un NFT tradicional, un SBT no debe poder ser vendido, regalado ni transferido a otra billetera, ya que representa un mérito personal e intransferible. El estándar ERC-5192 soluciona esto a nivel de protocolo introduciendo una propiedad nativa de "bloqueo". Al momento de ser minteado, el token nace en un estado bloqueado inmutable, es decir, no se podrá cambiar el dueño del token, mediante el uso de una función cuyo valor de retorno siempre será “true”.

  // Función obligatoria del estándar ERC-5192 integrada en el contrato


  function locked(uint256 tokenId) external view override returns (bool) {

      require(\_exists(tokenId), "SBT: El token no existe");

      return true; // Retorna siempre 'true' para asegurar que el token nunca se pueda transferir

  }

* **IPFS:** almacenamiento descentralizado de la metadata de los logros: imágenes, descripciones y atributos.

* **Oráculos:** mecanismo para validar datos externos que no existen dentro de la blockchain.

* **Backend:** API encargada de gestionar clientes, proyectos, eventos y validaciones.

* **Frontend:** interfaz web para organizaciones y usuarios.

* **Wallet:** MetaMask u otra billetera compatible con EVM.

* **Base de datos:** PostgreSQL o similar para almacenar datos auxiliares que no requieren estar en la cadena.

* **Hyperledger y Quorum:** se mencionan como alternativas para escenarios privados o empresariales; no obstante, el prototipo usará blockchain pública porque el objetivo principal es la verificación abierta de los logros.

# **9\. Arquitectura del sistema**

La arquitectura sigue un esquema por capas. La organización interactúa con el panel de administración para crear su estructura de logros; el backend coordina las operaciones y se apoya en una base de datos para la información auxiliar. Cuando un usuario cumple un logro, el oráculo o validador confirma la evidencia y el backend invoca al smart contract, que emite el SBT en la blockchain hacia la billetera del usuario. La metadata de cada logro se almacena en IPFS y se referencia desde el contrato mediante una URI. El frontend web permite a usuarios y terceros consultar públicamente los logros emitidos.

\+----------------------------+  
          |   CLIENTE / ORGANIZACION   |  
          \+-------------+--------------+  
                        | administra  
                        v  
          \+----------------------------+        \+----------------------------+  
          |  PANEL DE ADMINISTRACION   |        |  USUARIO FINAL             |  
          \+-------------+--------------+        |  (jugador / estudiante)    |  
                        |                       \+-------------+--------------+  
                        v                                     | consulta logros  
          \+----------------------------+                      v  
          |       BACKEND / API        |        \+----------------------------+  
          |   (gestion y validacion)   |\<------\>|        FRONTEND WEB        |  
          \+----+------------------+----+        \+----------------------------+  
               |                  |  
               v                  v  
     \+-------------------+  \+-----------------------+  
     |  BASE DE DATOS    |  |  ORACULO / VALIDADOR  |  
     |   (PostgreSQL)    |  |     (evidencias)      |  
     \+-------------------+  \+-----------+-----------+  
                                        | valida / firma  
                                        v  
                          \+----------------------------+  
                          |       SMART CONTRACT       |  
                          |  AchievementSBTPlatform    |  
                          \+-----+----------------+-----+  
                                |                |  
                  emite SBT     |                |  metadata (URI)  
                                v                v  
                     \+-------------------+  \+-------------------+  
                     |    BLOCKCHAIN     |  |       IPFS        |  
                     | (Ethereum/testnet)|  |  (Pinata/Web3)   |  
                     \+---------+---------+  \+-------------------+  
                               |  
                               v  
                     \+-------------------+  
                     | WALLET (MetaMask) |  
                     \+-------------------+

*Figura 1\. Diagrama de bloques funcional de la arquitectura.*

# **10\. Modelo jerárquico de la plataforma**

La plataforma organiza la información en una estructura jerárquica de cinco niveles, que se adapta al tipo de organización que la utilice:

**Organización  →  Grupo  →  Proyecto  →  Logro  →  SBT emitido**

En el caso de un estudio de videojuegos, la organización es el estudio, el grupo es la categoría de juegos, el proyecto es un videojuego concreto y el logro es un trofeo dentro de ese juego. En el caso de una universidad, la organización es la universidad, el grupo es la carrera, el proyecto es la materia y el logro es un logro académico. La siguiente tabla resume esta correspondencia:

| Nivel genérico | Estudio de videojuegos | Universidad |
| ----- | ----- | ----- |
| Organización | Estudio de videojuegos (ej. Pixel Games) | Universidad (ej. Universidad Central) |
| Grupo | Categoría (RPG, terror, acción, deportes) | Carrera (ej. Ingeniería de Sistemas) |
| Proyecto | Videojuego (ej. Dragon Quest Arena) | Materia (ej. Blockchain) |
| Logro | Trofeo del juego (ej. Derrotó al jefe final) | Logro académico (ej. Aprobó el parcial) |
| Usuario | Jugador | Estudiante |
| Validador | Servidor del juego u oráculo autorizado | Profesor, sistema académico u oráculo |

**Ejemplo (videojuegos):** Pixel Games → RPG → Dragon Quest Arena → “Primera victoria”, “Derrotó al jefe final”, “Completó la historia principal”, “Ganó 10 partidas”.

**Ejemplo (universidad):** Universidad Central → Ingeniería de Sistemas → Blockchain → “Completó laboratorio de Solidity”, “Aprobó el parcial”, “Entregó el proyecto final”, “Mejor proyecto de la sección”.

# **11\. Contrato inteligente propuesto**

Se propone un contrato denominado AchievementSBTPlatform.sol, que centraliza el registro de la estructura jerárquica y la emisión de los logros como Soulbound Tokens. El contrato define las siguientes estructuras de datos:

### **Estructuras de datos**

struct Organization {  
    uint256 id;  
    string  name;  
    address owner;        // wallet que controla la organizacion  
    bool    active;  
}  
   
struct Group {  
    uint256 id;  
    uint256 organizationId;  
    string  name;         // categoria (RPG) o carrera (Ing. Sistemas)  
}  
   
struct Project {  
    uint256 id;  
    uint256 groupId;  
    string  name;         // videojuego o materia  
    string  metadataURI;  // referencia a IPFS  
}  
   
struct Achievement {  
    uint256 id;  
    uint256 projectId;  
    string  name;  
    string  metadataURI;  // imagen, descripcion y atributos (IPFS)  
    bool    active;  
}  
   
struct IssuedAchievement {  
    uint256 achievementId;  
    address user;  
    address validator;    // quien valido la evidencia  
    uint256 issuedAt;  
    bool    revoked;  
}

### **Funciones principales**

// \--- Gestion de la estructura jerarquica \---  
function createOrganization(string name) external;            // solo admin  
function createGroup(uint orgId, string name) external;       // solo owner org  
function createProject(uint groupId, string name, string uri) external;  
function createAchievement(uint projectId, string name, string uri) external;  
   
// \--- Validacion y emision \---  
function setValidator(uint orgId, address val, bool ok) external; // solo owner  
function issueAchievement(uint achievementId, address user) external; // solo validador  
function hasAchievement(address user, uint achievementId)  
        external view returns (bool);  
function revokeAchievement(uint issuedId) external;           // owner / validador  
   
// \--- Naturaleza Soulbound: bloqueadas (revert) \---  
function transferFrom(...)      \=\> revert("SBT: no transferible");  
function safeTransferFrom(...)  \=\> revert("SBT: no transferible");  
function approve(...)           \=\> revert("SBT: no aprobable");  
function setApprovalForAll(...) \=\> revert("SBT: no aprobable");

Las funciones de creación (createOrganization, createGroup, createProject, createAchievement) construyen la jerarquía; setValidator autoriza a las cuentas que podrán confirmar evidencias; issueAchievement emite el SBT a un usuario; hasAchievement permite consultar si un usuario posee un logro; y revokeAchievement permite anular un logro emitido por error.

Para preservar la naturaleza Soulbound del token, las funciones de transferencia, aprobación y venta (transferFrom, safeTransferFrom, approve y setApprovalForAll) deben estar bloqueadas y revertir cualquier intento de uso. De este modo, el logro queda asociado permanentemente a la billetera que lo recibió.

# **12\. Oráculo o mecanismo de validación**

Por sí solo, un contrato inteligente no puede saber si un jugador ganó realmente una partida o si un estudiante aprobó una materia, ya que esa información proviene del mundo exterior y no existe de forma nativa en la blockchain. Para resolverlo se requiere un oráculo o validador autorizado que confirme la evidencia antes de emitir el logro. Se contemplan tres alternativas:

* **Validador autorizado mediante wallet:** una o varias cuentas autorizadas por la organización tienen permiso para llamar a issueAchievement tras verificar la evidencia por sus propios medios.

* **Backend que firma digitalmente la evidencia:** el servidor de la organización genera una firma criptográfica que el contrato verifica antes de emitir el logro, garantizando que la evidencia proviene de la fuente legítima.

* **Oráculo real (Chainlink Functions):** el contrato consulta APIs externas a través de un servicio de oráculos descentralizado para obtener y validar la información de forma automática.

Para el prototipo se utilizará un oráculo simulado o una cuenta autorizada, lo que permite demostrar el flujo completo sin la complejidad de una integración externa real.

# **13\. Despliegue de componentes**

Cada componente del sistema se desplegará en un entorno adecuado a su función. La siguiente tabla resume la tecnología propuesta y la estrategia de despliegue:

| Componente | Tecnología propuesta | Despliegue |
| ----- | ----- | ----- |
| Contrato inteligente | Solidity (EVM) | Sepolia, Polygon Amoy o red local Hardhat |
| Frontend | Aplicación web (React u otra) | Vercel o Netlify |
| Backend | API (Node.js u otra) | Render, Railway, Docker o servidor local |
| Base de datos | PostgreSQL | Servicio gestionado o contenedor Docker |
| IPFS | Almacenamiento descentralizado | Pinata, Web3.Storage o nodo local |
| Oráculo simulado | Servicio backend / cuenta autorizada | Integrado al backend o cuenta dedicada |
| Wallet | MetaMask | Extensión del navegador del usuario |
| Reyaler | Openzeppelin / Defender Relay: Actua como intermediario que patrocinador que recibe la firma digital gratuita del usuario a traves del internet y paga las comisiones de red con su propio fondo. |  |

# **14\. Casos de uso y diagramas de flujo de proceso**

A continuación se describen dos casos de uso representativos que ilustran el funcionamiento de la plataforma de extremo a extremo.

## **14.1. Caso de uso 1: Estudio de videojuegos**

Un estudio de videojuegos desea reconocer los logros de sus jugadores mediante credenciales verificables. El flujo del proceso es el siguiente:

\[ El estudio crea una categoria (ej. RPG) \]  
                    |  
                    v  
  \[ El estudio registra un videojuego \]  
                    |  
                    v  
  \[ El estudio define los logros del juego \]  
                    |  
                    v  
  \[ El jugador cumple un logro \]  
                    |  
                    v  
  \[ El servidor del juego envía la evidencia \]  
                    |  
                    v  
  \[ El oraculo / validador confirma el logro \]  
                    |  
                    v  
  \[ El smart contract emite el SBT \]  
                    |  
                    v  
  \[ El jugador recibe el logro en su wallet \]

*Figura 2\. Diagrama de flujo del caso de uso de videojuegos.*

## **14.2. Caso de uso 2: Universidad**

Una universidad desea emitir logros académicos verificables a sus estudiantes. El flujo del proceso es el siguiente:

\[ La universidad crea una carrera \]  
                    |  
                    v  
  \[ La universidad registra una materia \]  
                    |  
                    v  
  \[ El profesor define los logros academicos \]  
                    |  
                    v  
  \[ El estudiante cumple una actividad \]  
                    |  
                    v  
  \[ El sistema academico / profesor valida la evidencia \]  
                    |  
                    v  
  \[ El oraculo / validador confirma el logro \]  
                    |  
                    v  
  \[ El smart contract emite el SBT \]  
                    |  
                    v  
  \[ El estudiante recibe el logro en su wallet \]

*Figura 3\. Diagrama de flujo del caso de uso universitario.*

# **14.3 Caso de uso: Certificaciones labores**

En el sector de la tecnología y la consultoría profesional, la falsificación de habilidades en currículums (fake resumes) y la dificultad para verificar la experiencia real de un candidato representan un costo operativo y legal muy alto para los departamentos de Recursos Humanos. Por otro lado, cuando un empleado completa capacitaciones internas o lidera proyectos de alta complejidad dentro de una empresa, carece de un mecanismo público e independiente para demostrar esos méritos una vez que se desvincula de la organización.

Este caso de uso aplica la plataforma en un entorno corporativo de desarrollo de software (por ejemplo, una empresa tecnológica multinacional), permitiendo a la organización emitir credenciales de competencias técnicas e hitos laborales inmutables que el empleado conserva permanentemente en su identidad digital Web3, listos para ser validados por futuros reclutadores.

# **15\. Seguridad y control de permisos**

El diseño contempla diversas reglas de seguridad y control de acceso para garantizar la integridad de los logros:

* Solo las organizaciones autorizadas pueden crear grupos, proyectos y logros.

* Solo los validadores autorizados pueden emitir logros a los usuarios.

* Un usuario no puede emitirse logros a sí mismo.

* Los SBT no se pueden transferir, vender ni aprobar a terceros.

* Un logro emitido por error puede ser revocado por la organización o el validador.

* La metadata de cada logro se referencia desde IPFS, no se almacena directamente en la cadena.

* El contrato evita duplicar el mismo logro para el mismo usuario, garantizando que cada credencial sea única.

# **16\. Beneficios del sistema**

* **Verificación pública:** cualquiera puede comprobar la autenticidad de un logro sin depender del emisor.

* **No transferibilidad:** el logro permanece asociado a quien lo mereció y no puede venderse ni regalarse.

* **Interoperabilidad:** los logros pueden reconocerse y reutilizarse en distintos sistemas y ecosistemas.

* **Transparencia:** todas las emisiones quedan registradas de forma inmutable en la blockchain.

* **Reutilización:** la misma plataforma sirve a varios tipos de clientes mediante una plantilla adaptable.

* **Mayor confianza:** se incrementa la credibilidad de los logros digitales frente a terceros.

* **Integración amplia:** posibilidad de integrarse con videojuegos, universidades, cursos y eventos.

## **17\. Consideraciones sobre revocación**

La revocación no implicará transferencia ni eliminación del token. En su lugar, la credencial se marcará como revocada para conservar el historial y permitir trazabilidad. Esta decisión mantiene la integridad del registro y evita contradicciones con la naturaleza Soulbound del estándar

# **19\. Referencias**

1. Ethereum Foundation. Ethereum: documentación oficial. https://ethereum.org/es/developers/docs/

2. Solidity. Solidity Documentation. https://docs.soliditylang.org/

3. Ethereum Improvement Proposals. ERC-721: Non-Fungible Token Standard. https://eips.ethereum.org/EIPS/eip-721

4. Ethereum Improvement Proposals. ERC-5192: Minimal Soulbound NFTs. https://eips.ethereum.org/EIPS/eip-5192

5. Weyl, E. G., Ohlhaver, P. y Buterin, V. (2022). Decentralized Society: Finding Web3’s Soul. https://papers.ssrn.com/sol3/papers.cfm?abstract\_id=4105763

6. IPFS. InterPlanetary File System: Documentation. https://docs.ipfs.tech/

7. Chainlink. Chainlink Functions Documentation. https://docs.chain.link/chainlink-functions

8. OpenZeppelin. OpenZeppelin Contracts Documentation. https://docs.openzeppelin.com/contracts/

9. Hyperledger Foundation. Hyperledger Fabric Documentation. https://hyperledger-fabric.readthedocs.io/

10. ConsenSys. Quorum Documentation. https://docs.goquorum.consensys.io/