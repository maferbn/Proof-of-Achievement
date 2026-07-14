import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import type { Achievement } from '@repo/shared-types';

function App() {
  const { address, isConnected } = useAccount();

  // Demonstrating the use of shared types imported from the @repo/shared-types workspace
  const [achievements] = useState<Achievement[]>([
    {
      id: 'demo-1',
      name: 'Early Adopter Badge',
      description: 'Awarded to users who joined the SBT platform during testing.',
      projectId: 'project-alpha',
      metadataUri: 'ipfs://QmEarlyAdopter',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'demo-2',
      name: 'Smart Contract Dev',
      description: 'Successfully completed the Hardhat integration milestone.',
      projectId: 'project-alpha',
      metadataUri: 'ipfs://QmSmartContractDev',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const contractAddress =
    import.meta.env.VITE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.logo}>🏆 SBT Platform</h1>
        <ConnectButton />
      </header>

      <main style={styles.main}>
        <section style={styles.hero}>
          <h2 style={styles.heroTitle}>Soulbound Token Badges</h2>
          <p style={styles.heroSubtitle}>
            Earn, view, and verify your achievements on-chain using non-transferable ERC-5192
            tokens.
          </p>
        </section>

        <section style={styles.infoCard}>
          <h3>Contract Status</h3>
          <p>
            <strong>ReputationBadge Contract:</strong>{' '}
            <code style={styles.code}>{contractAddress}</code>
          </p>
          {isConnected ? (
            <p style={styles.successText}>
              ✅ Connected as: <code style={styles.code}>{address}</code>
            </p>
          ) : (
            <p style={styles.warningText}>⚠️ Connect your wallet to view your minted badges.</p>
          )}
        </section>

        <section style={styles.section}>
          <h3>Available Achievements (Demo)</h3>
          <div style={styles.grid}>
            {achievements.map((badge) => (
              <div key={badge.id} style={styles.card}>
                <div style={styles.badgeIcon}>🏅</div>
                <h4 style={styles.badgeName}>{badge.name}</h4>
                <p style={styles.badgeDesc}>{badge.description}</p>
                <div style={styles.badgeMeta}>
                  <span>Project ID: {badge.projectId}</span>
                  <a
                    href={`https://ipfs.io/ipfs/${badge.metadataUri?.replace('ipfs://', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.link}
                  >
                    View Metadata
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer style={styles.footer}>
        <p>© 2026 SBT Platform. Powered by Turborepo, Wagmi, and Viem.</p>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: 'Inter, system-ui, sans-serif',
    minHeight: '100vh',
    backgroundColor: '#0a0a0c',
    color: '#f3f4f6',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 2rem',
    borderBottom: '1px solid #1f2937',
    backgroundColor: '#111827',
  },
  logo: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#6366f1',
  },
  main: {
    flex: 1,
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  hero: {
    textAlign: 'center' as const,
    margin: '3rem 0',
  },
  heroTitle: {
    fontSize: '2.5rem',
    marginBottom: '1rem',
    background: 'linear-gradient(to right, #818cf8, #c084fc)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroSubtitle: {
    fontSize: '1.2rem',
    color: '#9ca3af',
    maxWidth: '600px',
    margin: '0 auto',
  },
  infoCard: {
    backgroundColor: '#1f2937',
    padding: '1.5rem',
    borderRadius: '8px',
    border: '1px solid #374151',
    marginBottom: '2rem',
  },
  code: {
    backgroundColor: '#111827',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    fontFamily: 'monospace',
    color: '#f43f5e',
  },
  successText: {
    color: '#10b981',
    margin: '0.5rem 0 0 0',
  },
  warningText: {
    color: '#fbbf24',
    margin: '0.5rem 0 0 0',
  },
  section: {
    marginBottom: '3rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
    marginTop: '1.5rem',
  },
  card: {
    backgroundColor: '#111827',
    border: '1px solid #1f2937',
    borderRadius: '8px',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column' as const,
    transition: 'transform 0.2s',
  },
  badgeIcon: {
    fontSize: '2.5rem',
    marginBottom: '1rem',
  },
  badgeName: {
    margin: '0 0 0.5rem 0',
    fontSize: '1.25rem',
    color: '#ffffff',
  },
  badgeDesc: {
    margin: '0 0 1.5rem 0',
    color: '#9ca3af',
    fontSize: '0.95rem',
    flexGrow: 1,
  },
  badgeMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
    color: '#6b7280',
    borderTop: '1px solid #1f2937',
    paddingTop: '0.75rem',
  },
  link: {
    color: '#6366f1',
    textDecoration: 'none',
  },
  footer: {
    textAlign: 'center' as const,
    padding: '2rem',
    borderTop: '1px solid #1f2937',
    backgroundColor: '#111827',
    color: '#6b7280',
    fontSize: '0.9rem',
  },
};

export default App;
