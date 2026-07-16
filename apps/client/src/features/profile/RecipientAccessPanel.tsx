import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useDisconnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ArrowRight, LogOut, Info } from 'lucide-react';
import { Button } from '../../components/ui';
import { WalletAddress } from '../../components/web3/WalletAddress';
import { parseProfileInput } from '../../utils/profile';

/**
 * Inline recipient access panel for the landing page. Honest UX for the current
 * backend: connecting a wallet does not resolve a Member (no lookup-by-wallet
 * endpoint), so we let the user open a profile link shared by an organization
 * and explain the wallet's real purpose (ownership verification, not login).
 */
export function RecipientAccessPanel() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [error, setError] = useState<string>();

  const openProfile = () => {
    const id = parseProfileInput(input);
    if (!id) {
      setError('Pega el enlace de perfil (…/profile/ID) o el identificador.');
      return;
    }
    setError(undefined);
    navigate(`/profile/${id}`);
  };

  return (
    <div className="flex-col gap-3">
      {isConnected ? (
        <div
          className="flex items-center justify-between gap-2"
          style={{
            padding: '0.6rem 0.8rem',
            borderRadius: 'var(--r-sm)',
            background: 'var(--glass-bg-strong)',
            border: '1px solid var(--glass-border)',
          }}
        >
          <span className="flex items-center gap-2 text-sm">
            <span className="status__dot" style={{ background: 'var(--success)' }} aria-hidden />
            <WalletAddress address={address} chars={5} />
          </span>
          <button
            type="button"
            className="copy-btn"
            onClick={() => disconnect()}
            aria-label="Desconectar wallet"
            title="Desconectar"
          >
            <LogOut size={15} />
          </button>
        </div>
      ) : (
        <ConnectButton showBalance={false} chainStatus="none" label="Conectar wallet" />
      )}

      <label className="field">
        <span className="field__label" style={{ fontSize: '0.82rem' }}>
          Abrir enlace de perfil
        </span>
        <input
          className={`input input--mono${error ? ' input--error' : ''}`}
          style={{ fontSize: '0.84rem' }}
          placeholder="https://…/profile/ID"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (error) setError(undefined);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') openProfile();
          }}
          spellCheck={false}
        />
        {error && <span className="field__error">{error}</span>}
      </label>

      <Button size="sm" onClick={openProfile} rightIcon={<ArrowRight size={15} />}>
        Abrir mi perfil
      </Button>

      <div className="flex items-start gap-2">
        <Info size={13} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
        <p className="text-xs text-muted">
          Conectar la wallet es gratis y no firma ninguna transacción: solo sirve para comprobar si
          un perfil te pertenece. Para ver tus logros, abre el enlace de perfil que te comparta la
          organización emisora.
        </p>
      </div>
    </div>
  );
}
