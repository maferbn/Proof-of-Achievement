import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useDisconnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { Wallet, LogOut, ArrowRight, Info } from 'lucide-react';
import { Button } from '../../components/ui';
import { WalletAddress } from '../../components/web3/WalletAddress';
import { parseProfileInput } from '../../utils/profile';

/**
 * Public, recipient-facing wallet control. Because the backend cannot look up
 * a Member by wallet, connecting does NOT auto-open a profile. Instead we offer
 * an honest panel: the connected address, an explanation, and a field to open
 * a profile link shared by an issuing organization.
 */
export function RecipientWalletMenu() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [inputError, setInputError] = useState<string>();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  if (!isConnected) {
    return (
      <Button
        variant="secondary"
        size="sm"
        leftIcon={<Wallet size={15} />}
        onClick={() => openConnectModal?.()}
      >
        Ver mis logros
      </Button>
    );
  }

  const openProfile = () => {
    const id = parseProfileInput(input);
    if (!id) {
      setInputError('Pega el enlace de perfil (…/profile/ID) o el identificador.');
      return;
    }
    setInputError(undefined);
    setOpen(false);
    setInput('');
    navigate(`/profile/${id}`);
  };

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <Button
        variant="secondary"
        size="sm"
        leftIcon={<Wallet size={15} />}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <WalletAddress address={address} chars={4} copyable={false} />
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="Wallet conectada"
          className="card"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            zIndex: 50,
            width: 300,
            maxWidth: 'calc(100vw - 2rem)',
            padding: 'var(--sp-4)',
          }}
        >
          <div className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Wallet conectada
          </div>
          <div className="mt-2">
            <WalletAddress address={address} chars={6} explorer />
          </div>

          <div
            className="flex items-start gap-2 mt-3"
            style={{
              padding: '0.6rem 0.7rem',
              borderRadius: 'var(--r-sm)',
              background: 'var(--info-bg)',
              border: '1px solid var(--info-border)',
            }}
          >
            <Info size={14} style={{ color: 'var(--info)', flexShrink: 0, marginTop: 1 }} />
            <p className="text-xs" style={{ color: 'var(--text)' }}>
              Para consultar tus logros, abre el enlace de perfil que te comparta una organización
              emisora.
            </p>
          </div>

          <label className="field mt-3">
            <span className="field__label" style={{ fontSize: '0.8rem' }}>
              Abrir enlace de perfil
            </span>
            <input
              className={`input input--mono${inputError ? ' input--error' : ''}`}
              style={{ fontSize: '0.82rem' }}
              placeholder="…/profile/ID"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (inputError) setInputError(undefined);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') openProfile();
              }}
              spellCheck={false}
            />
            {inputError && <span className="field__error">{inputError}</span>}
          </label>

          <div className="flex-col gap-2 mt-3">
            <Button size="sm" onClick={openProfile} rightIcon={<ArrowRight size={14} />} block>
              Abrir perfil
            </Button>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<LogOut size={14} />}
              onClick={() => {
                setOpen(false);
                disconnect();
              }}
              block
            >
              Desconectar wallet
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
