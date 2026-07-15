// ============================================================
// Shared ABI for ReputationBadge.sol
// Used by both apps/api and apps/client
// ============================================================

export const REPUTATION_BADGE_ABI = [
  // Core minting
  'function mint(address to, string memory uri) public returns (uint256)',
  // Role management
  'function grantMinter(address minter) public',
  'function revokeMinter(address minter) public',
  // ERC-5192 soulbound
  'function locked(uint256 tokenId) public view returns (bool)',
  // Metadata
  'function getTokenURI(uint256 tokenId) public view returns (string memory)',
  // Revocation
  'function revokeBadge(uint256 tokenId) public',
  'function isRevoked(uint256 tokenId) public view returns (bool)',
  // AccessControl utility
  'function hasRole(bytes32 role, address account) public view returns (bool)',
  // Events — needed to recover the real tokenId from a mint receipt
  'event BadgeMinted(address indexed to, uint256 indexed tokenId, string tokenURI)',
] as const;
