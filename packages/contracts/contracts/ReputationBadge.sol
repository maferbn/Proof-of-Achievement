// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./IERC5192.sol";

/**
 * @title ReputationBadge
 * @dev Soulbound ERC721 tokens (non-transferable) for reputation achievements.
 *
 * Implements ERC-5192 (Minimal Soulbound NFTs) for formal interoperability
 * with wallets, marketplaces, and block explorers.
 *
 * Badges can only be minted by addresses with MINTER_ROLE (one relayer wallet per admin).
 * Once minted, badges cannot be transferred. All business logic (group membership, permission
 * validation) lives off-chain in the backend (PostgreSQL). This contract only enforces on-chain
 * access control and the soulbound nature of tokens.
 *
 * Badges can be revoked by admins or minters. Revocation marks the badge as revoked
 * but preserves ownership for traceability (the token is not burned or transferred).
 */
contract ReputationBadge is ERC721, AccessControl, IERC5192 {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 private _tokenIdCounter;
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => bool) private _tokenExists;
    mapping(uint256 => bool) private _revoked;

    event BadgeMinted(address indexed to, uint256 indexed tokenId, string tokenURI);
    event MinterGranted(address indexed minter);
    event MinterRevoked(address indexed minter);
    event BadgeRevoked(uint256 indexed tokenId, address indexed owner);

    /**
     * @dev Initialize the ReputationBadge contract.
     * @param initialAdmin The admin of the contract (can grant/revoke MINTER_ROLE).
     */
    constructor(address initialAdmin) ERC721("ReputationBadge", "BADGE") {
        _tokenIdCounter = 1;
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
    }

    /**
     * @dev Mint a new badge to a recipient.
     * Only callable by addresses with MINTER_ROLE (backend relayer wallets).
     * Emits a Locked event per ERC-5192 to signal the token is permanently non-transferable.
     *
     * @param to The address receiving the badge.
     * @param uri The token URI pointing to IPFS metadata.
     */
    function mint(address to, string memory uri) public returns (uint256) {
        require(hasRole(MINTER_ROLE, msg.sender), "ReputationBadge: caller does not have MINTER_ROLE");
        require(to != address(0), "ReputationBadge: cannot mint to zero address");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(to, tokenId);
        _tokenURIs[tokenId] = uri;
        _tokenExists[tokenId] = true;

        emit BadgeMinted(to, tokenId, uri);
        emit Locked(tokenId);
        return tokenId;
    }

    /**
     * @dev Grant MINTER_ROLE to a relayer wallet.
     * Only callable by an admin.
     */
    function grantMinter(address minter) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "ReputationBadge: caller does not have DEFAULT_ADMIN_ROLE");
        grantRole(MINTER_ROLE, minter);
        emit MinterGranted(minter);
    }

    /**
     * @dev Revoke MINTER_ROLE from a relayer wallet.
     * Only callable by an admin.
     */
    function revokeMinter(address minter) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "ReputationBadge: caller does not have DEFAULT_ADMIN_ROLE");
        revokeRole(MINTER_ROLE, minter);
        emit MinterRevoked(minter);
    }

    /**
     * @dev Get the URI for a badge.
     */
    function getTokenURI(uint256 tokenId) public view returns (string memory) {
        require(_tokenExists[tokenId], "ReputationBadge: URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }

    // ==================== ERC-5192 (Soulbound) ====================

    /**
     * @dev Returns true if the token is locked (permanently non-transferable).
     * Reverts if the token does not exist.
     * @param tokenId The token identifier to query.
     */
    function locked(uint256 tokenId) external view override returns (bool) {
        require(_tokenExists[tokenId], "ReputationBadge: locked query for nonexistent token");
        return true;
    }

    /**
     * @dev Enforce soulbound (non-transferable) behavior.
     * Only allow minting (from == address(0)) and burning (to == address(0)).
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        require(from == address(0) || to == address(0), "ReputationBadge: badges cannot be transferred");
    }

    // ==================== Revocation ====================

    /**
     * @dev Revoke a badge. The token is NOT burned or transferred — it is only
     * marked as revoked for traceability. Anyone verifying on-chain can see
     * the revoked status via isRevoked().
     *
     * Only callable by DEFAULT_ADMIN_ROLE or MINTER_ROLE.
     * @param tokenId The badge to revoke.
     */
    function revokeBadge(uint256 tokenId) public {
        require(_tokenExists[tokenId], "ReputationBadge: cannot revoke nonexistent token");
        require(!_revoked[tokenId], "ReputationBadge: token already revoked");
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || hasRole(MINTER_ROLE, msg.sender),
            "ReputationBadge: caller does not have permission to revoke"
        );

        _revoked[tokenId] = true;
        emit BadgeRevoked(tokenId, ownerOf(tokenId));
    }

    /**
     * @dev Check if a badge has been revoked.
     * @param tokenId The token identifier to query.
     * @return revoked True if the badge is revoked.
     */
    function isRevoked(uint256 tokenId) public view returns (bool) {
        require(_tokenExists[tokenId], "ReputationBadge: revocation query for nonexistent token");
        return _revoked[tokenId];
    }

    // ==================== ERC165 ====================

    /**
     * @dev Required override for ERC721 + AccessControl + IERC5192 diamond inheritance.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return
            interfaceId == type(IERC5192).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
