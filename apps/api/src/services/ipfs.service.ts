import axios, { AxiosError } from 'axios';
import FormData from 'form-data';
import { config } from '../config';

export interface BadgeMetadata {
  name: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}

const PINATA_API_URL = 'https://api.pinata.cloud';

/**
 * Service for uploading badge metadata and images to IPFS via Pinata.
 *
 * Requires PINATA_JWT to be configured. If not set, methods will throw
 * so callers can decide whether to skip IPFS or fail.
 */
export class IPFSService {
  private get jwt(): string {
    if (!config.pinataJwt) {
      throw new Error('PINATA_JWT is not configured. Cannot upload to IPFS.');
    }
    return config.pinataJwt;
  }

  /**
   * Upload a JSON object to IPFS.
   * Returns the ipfs:// URI (e.g. ipfs://QmXxx...).
   */
  async uploadJSON(metadata: BadgeMetadata): Promise<string> {
    try {
      const res = await axios.post<{ IpfsHash: string }>(
        `${PINATA_API_URL}/pinning/pinJSONToIPFS`,
        metadata,
        {
          headers: {
            Authorization: `Bearer ${this.jwt}`,
            'Content-Type': 'application/json',
          },
          timeout: 30_000,
        }
      );

      console.log(`[IPFS] Uploaded JSON metadata: ${res.data.IpfsHash}`);
      return `ipfs://${res.data.IpfsHash}`;
    } catch (error) {
      const err = error as AxiosError;
      console.error('[IPFS] Failed to upload JSON metadata:', err.message);
      throw new Error(`IPFS upload failed: ${err.message}`);
    }
  }

  /**
   * Upload a file buffer to IPFS.
   * Returns the ipfs:// URI (e.g. ipfs://QmXxx...).
   */
  async uploadFile(buffer: Buffer, fileName: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', buffer, { filename: fileName });

      const res = await axios.post<{ IpfsHash: string }>(
        `${PINATA_API_URL}/pinning/pinFileToIPFS`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${this.jwt}`,
            ...formData.getHeaders(),
          },
          timeout: 60_000,
        }
      );

      console.log(`[IPFS] Uploaded file ${fileName}: ${res.data.IpfsHash}`);
      return `ipfs://${res.data.IpfsHash}`;
    } catch (error) {
      const err = error as AxiosError;
      console.error(`[IPFS] Failed to upload file ${fileName}:`, err.message);
      throw new Error(`IPFS file upload failed: ${err.message}`);
    }
  }

  /**
   * Resolve an ipfs:// URI to an HTTP gateway URL.
   * Useful for returning URLs that browsers can open directly.
   */
  toGatewayUrl(ipfsUri: string): string {
    const hash = ipfsUri.replace('ipfs://', '');
    const gateway = config.pinataGateway || 'https://gateway.pinata.cloud';
    return `${gateway}/ipfs/${hash}`;
  }

  /**
   * Check whether IPFS is configured (PINATA_JWT is set).
   */
  isConfigured(): boolean {
    return !!config.pinataJwt;
  }
}

export const ipfsService = new IPFSService();
