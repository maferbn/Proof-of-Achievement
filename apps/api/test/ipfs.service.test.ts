import axios from 'axios';

// Mock config to control pinataJwt and pinataGateway
jest.mock('../src/config', () => ({
  config: {
    pinataJwt: 'test-jwt-token',
    pinataGateway: 'https://test-gateway.mypinata.cloud',
  },
}));

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

import { IPFSService } from '../src/services/ipfs.service';

describe('IPFSService', () => {
  let service: IPFSService;

  beforeEach(() => {
    service = new IPFSService();
    jest.clearAllMocks();
  });

  describe('isConfigured', () => {
    it('should return true when PINATA_JWT is set', () => {
      expect(service.isConfigured()).toBe(true);
    });
  });

  describe('toGatewayUrl', () => {
    it('should convert ipfs:// URI to HTTP gateway URL', () => {
      const result = service.toGatewayUrl('ipfs://QmTest123');
      expect(result).toBe('https://test-gateway.mypinata.cloud/ipfs/QmTest123');
    });

    it('should handle URI without ipfs:// prefix', () => {
      const result = service.toGatewayUrl('QmTest123');
      expect(result).toBe('https://test-gateway.mypinata.cloud/ipfs/QmTest123');
    });
  });

  describe('uploadJSON', () => {
    it('should upload JSON metadata and return ipfs:// URI', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { IpfsHash: 'QmMetadataHash123' },
      });

      const metadata = {
        name: 'Test Badge',
        description: 'A test badge',
        attributes: [{ trait_type: 'Level', value: 'Gold' }],
      };

      const result = await service.uploadJSON(metadata);

      expect(result).toBe('ipfs://QmMetadataHash123');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        metadata,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-jwt-token',
          }),
        })
      );
    });

    it('should throw on upload failure', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network error'));

      await expect(
        service.uploadJSON({ name: 'Test' })
      ).rejects.toThrow('IPFS upload failed');
    });
  });

  describe('uploadFile', () => {
    it('should upload a file and return ipfs:// URI', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { IpfsHash: 'QmImageHash456' },
      });

      const buffer = Buffer.from('fake image data');
      const result = await service.uploadFile(buffer, 'badge.png');

      expect(result).toBe('ipfs://QmImageHash456');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        expect.anything(),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-jwt-token',
          }),
        })
      );
    });

    it('should throw on upload failure', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Upload failed'));

      await expect(
        service.uploadFile(Buffer.from('data'), 'test.png')
      ).rejects.toThrow('IPFS file upload failed');
    });
  });
});

describe('IPFSService - not configured', () => {
  it('should throw when PINATA_JWT is not set', () => {
    jest.resetModules();
    jest.doMock('../src/config', () => ({
      config: { pinataJwt: undefined, pinataGateway: 'https://gateway.pinata.cloud' },
    }));

    const { IPFSService: UnconfiguredService } = jest.requireActual('../src/services/ipfs.service');
    const unconfigured = new UnconfiguredService();

    expect(() => unconfigured.uploadJSON({ name: 'test' })).rejects.toThrow(
      'PINATA_JWT is not configured'
    );
  });
});
