import { expect } from 'chai';
import hre from 'hardhat';
import { ReputationBadge } from '../typechain-types';

describe('ReputationBadge', function () {
  let badge: ReputationBadge;
  let owner: any;
  let relayer: any;
  let user1: any;
  let user2: any;
  let unauthorized: any;

  const TEST_URI = 'ipfs://QmTestURI123456789';
  const TEST_URI_2 = 'ipfs://QmTestURI987654321';

  beforeEach(async function () {
    const accounts = await hre.ethers.getSigners();
    owner = accounts[0];
    relayer = accounts[1];
    user1 = accounts[2];
    user2 = accounts[3];
    unauthorized = accounts[4];

    const ReputationBadge = await hre.ethers.getContractFactory('ReputationBadge');
    badge = await ReputationBadge.deploy(owner.address);
  });

  describe('Deployment', function () {
    it('should deploy successfully', async function () {
      const name = await badge.name();
      expect(name).to.equal('ReputationBadge');
    });

    it('should have correct name and symbol', async function () {
      expect(await badge.name()).to.equal('ReputationBadge');
      expect(await badge.symbol()).to.equal('BADGE');
    });
  });

  describe('MINTER_ROLE Management', function () {
    it('should grant MINTER_ROLE to a relayer', async function () {
      const MINTER_ROLE = await badge.MINTER_ROLE();

      await badge.connect(owner).grantMinter(relayer.address);

      const hasMinterRole = await badge.hasRole(MINTER_ROLE, relayer.address);
      expect(hasMinterRole).to.be.true;
    });

    it('should emit MinterGranted event when granting MINTER_ROLE', async function () {
      await expect(badge.connect(owner).grantMinter(relayer.address))
        .to.emit(badge, 'MinterGranted')
        .withArgs(relayer.address);
    });

    it('should revoke MINTER_ROLE from a relayer', async function () {
      const MINTER_ROLE = await badge.MINTER_ROLE();

      await badge.connect(owner).grantMinter(relayer.address);
      expect(await badge.hasRole(MINTER_ROLE, relayer.address)).to.be.true;

      await badge.connect(owner).revokeMinter(relayer.address);
      expect(await badge.hasRole(MINTER_ROLE, relayer.address)).to.be.false;
    });

    it('should emit MinterRevoked event when revoking MINTER_ROLE', async function () {
      await badge.connect(owner).grantMinter(relayer.address);

      await expect(badge.connect(owner).revokeMinter(relayer.address))
        .to.emit(badge, 'MinterRevoked')
        .withArgs(relayer.address);
    });

    it('should revert if non-admin tries to grant MINTER_ROLE', async function () {
      await expect(badge.connect(unauthorized).grantMinter(relayer.address)).to.be.revertedWith(
        'ReputationBadge: caller does not have DEFAULT_ADMIN_ROLE',
      );
    });

    it('should revert if non-admin tries to revoke MINTER_ROLE', async function () {
      await badge.connect(owner).grantMinter(relayer.address);

      await expect(badge.connect(unauthorized).revokeMinter(relayer.address)).to.be.revertedWith(
        'ReputationBadge: caller does not have DEFAULT_ADMIN_ROLE',
      );
    });
  });

  describe('Minting', function () {
    beforeEach(async function () {
      await badge.connect(owner).grantMinter(relayer.address);
    });

    it('should mint a badge to a user', async function () {
      await badge.connect(relayer).mint(user1.address, TEST_URI);

      const balance = await badge.balanceOf(user1.address);
      expect(balance).to.equal(1);
    });

    it('should assign correct tokenId and tokenURI', async function () {
      await badge.connect(relayer).mint(user1.address, TEST_URI);

      // Token ID should be 1 (counter starts at 1)
      const tokenUri = await badge.getTokenURI(1);
      expect(tokenUri).to.equal(TEST_URI);
    });

    it('should emit BadgeMinted event', async function () {
      await expect(badge.connect(relayer).mint(user1.address, TEST_URI))
        .to.emit(badge, 'BadgeMinted')
        .withArgs(user1.address, 1, TEST_URI);
    });

    it('should mint multiple badges with sequential IDs', async function () {
      await badge.connect(relayer).mint(user1.address, TEST_URI);
      await badge.connect(relayer).mint(user2.address, TEST_URI_2);

      const user1Balance = await badge.balanceOf(user1.address);
      const user2Balance = await badge.balanceOf(user2.address);

      expect(user1Balance).to.equal(1);
      expect(user2Balance).to.equal(1);

      expect(await badge.getTokenURI(1)).to.equal(TEST_URI);
      expect(await badge.getTokenURI(2)).to.equal(TEST_URI_2);
    });

    it('should revert if unauthorized address tries to mint', async function () {
      await expect(badge.connect(unauthorized).mint(user1.address, TEST_URI)).to.be.revertedWith(
        'ReputationBadge: caller does not have MINTER_ROLE',
      );
    });

    it('should revert if trying to mint to zero address', async function () {
      await expect(
        badge.connect(relayer).mint(hre.ethers.ZeroAddress, TEST_URI),
      ).to.be.revertedWith('ReputationBadge: cannot mint to zero address');
    });
  });

  describe('Soulbound (Non-transferable)', function () {
    beforeEach(async function () {
      await badge.connect(owner).grantMinter(relayer.address);
      await badge.connect(relayer).mint(user1.address, TEST_URI);
    });

    it('should revert when user tries to transfer badge to another user', async function () {
      await expect(
        badge.connect(user1).transferFrom(user1.address, user2.address, 1),
      ).to.be.revertedWith('ReputationBadge: badges cannot be transferred');
    });

    it('should revert when third party tries to transfer badge', async function () {
      await badge.connect(user1).approve(user2.address, 1);

      await expect(
        badge.connect(user2).transferFrom(user1.address, user2.address, 1),
      ).to.be.revertedWith('ReputationBadge: badges cannot be transferred');
    });

    it('should revert on safeTransferFrom attempts', async function () {
      await expect(
        badge.connect(user1).safeTransferFrom(user1.address, user2.address, 1),
      ).to.be.revertedWith('ReputationBadge: badges cannot be transferred');
    });

    it('should confirm badge ownership after mint', async function () {
      const ownerOf = await badge.ownerOf(1);
      expect(ownerOf).to.equal(user1.address);
    });
  });

  describe('ERC-5192 (Soulbound Standard)', function () {
    beforeEach(async function () {
      await badge.connect(owner).grantMinter(relayer.address);
      await badge.connect(relayer).mint(user1.address, TEST_URI);
    });

    it('should return true for locked() on existing token', async function () {
      expect(await badge.locked(1)).to.be.true;
    });

    it('should revert for locked() on nonexistent token', async function () {
      await expect(badge.locked(999)).to.be.revertedWith(
        'ReputationBadge: locked query for nonexistent token',
      );
    });

    it('should emit Locked event when minting', async function () {
      await expect(badge.connect(relayer).mint(user2.address, TEST_URI_2))
        .to.emit(badge, 'Locked')
        .withArgs(2);
    });

    it('should return true for supportsInterface(ERC-5192)', async function () {
      // ERC-5192 interface ID = selector of locked(uint256) = keccak256("locked(uint256)")[0:4]
      const ERC5192_INTERFACE = '0xb45a3c0e';
      expect(await badge.supportsInterface(ERC5192_INTERFACE)).to.be.true;
    });

    it('should still support ERC721 and AccessControl interfaces', async function () {
      expect(await badge.supportsInterface('0x80ac58cd')).to.be.true; // ERC721
      expect(await badge.supportsInterface('0x7965db0b')).to.be.true; // AccessControl
    });
  });

  describe('Revocation', function () {
    beforeEach(async function () {
      await badge.connect(owner).grantMinter(relayer.address);
      await badge.connect(relayer).mint(user1.address, TEST_URI);
    });

    it('should allow admin to revoke a badge', async function () {
      await badge.connect(owner).revokeBadge(1);
      expect(await badge.isRevoked(1)).to.be.true;
    });

    it('should allow minter to revoke a badge', async function () {
      await badge.connect(relayer).revokeBadge(1);
      expect(await badge.isRevoked(1)).to.be.true;
    });

    it('should emit BadgeRevoked event', async function () {
      await expect(badge.connect(owner).revokeBadge(1))
        .to.emit(badge, 'BadgeRevoked')
        .withArgs(1, user1.address);
    });

    it('should revert if non-admin/non-minter tries to revoke', async function () {
      await expect(badge.connect(unauthorized).revokeBadge(1)).to.be.revertedWith(
        'ReputationBadge: caller does not have permission to revoke',
      );
    });

    it('should revert if token does not exist', async function () {
      await expect(badge.connect(owner).revokeBadge(999)).to.be.revertedWith(
        'ReputationBadge: cannot revoke nonexistent token',
      );
    });

    it('should revert if token is already revoked', async function () {
      await badge.connect(owner).revokeBadge(1);
      await expect(badge.connect(owner).revokeBadge(1)).to.be.revertedWith(
        'ReputationBadge: token already revoked',
      );
    });

    it('should keep ownership after revocation (token not burned)', async function () {
      await badge.connect(owner).revokeBadge(1);

      // Token still belongs to user1
      expect(await badge.ownerOf(1)).to.equal(user1.address);
      // Token still counted in balance
      expect(await badge.balanceOf(user1.address)).to.equal(1);
      // Token URI still accessible
      expect(await badge.getTokenURI(1)).to.equal(TEST_URI);
    });

    it('should report false for isRevoked before revocation', async function () {
      expect(await badge.isRevoked(1)).to.be.false;
    });

    it('should revert isRevoked for nonexistent token', async function () {
      await expect(badge.isRevoked(999)).to.be.revertedWith(
        'ReputationBadge: revocation query for nonexistent token',
      );
    });
  });
});
