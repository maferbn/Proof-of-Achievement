// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

/**
 * @title IERC5192
 * @dev Minimal Soulbound NFT interface (ERC-5192)
 * https://eips.ethereum.org/EIPS/eip-5192
 *
 * Tokens implementing this interface are perpetually locked
 * (non-transferable), making them suitable for reputation badges,
 * certifications, and other soulbound use cases.
 */
interface IERC5192 {
    /**
     * @dev Emitted when tokenId is locked permanently.
     * @param tokenId The locked token identifier.
     */
    event Locked(uint256 tokenId);

    /**
     * @dev Emitted when tokenId is unlocked.
     * @param tokenId The unlocked token identifier.
     */
    event Unlocked(uint256 tokenId);

    /**
     * @dev Returns true if the token is locked (non-transferable).
     * @param tokenId The token identifier to query.
     * @return locked True if the token is locked.
     */
    function locked(uint256 tokenId) external view returns (bool locked);
}
