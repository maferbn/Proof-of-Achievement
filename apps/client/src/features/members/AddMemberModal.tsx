import { useEffect, useState } from 'react';
import { Modal, Input, Button } from '../../components/ui';
import { useAddMember } from '../../hooks/useMembers';
import { useToast } from '../../providers/toast-context';
import { isValidAddress } from '../../utils/address';
import { ApiError } from '../../api/client';
import { getFriendlyError } from '../../utils/errors';

interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
}

export function AddMemberModal({ open, onClose, groupId }: AddMemberModalProps) {
  const [walletAddress, setWalletAddress] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [walletError, setWalletError] = useState<string>();

  const add = useAddMember(groupId);
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setWalletAddress('');
      setDisplayName('');
      setWalletError(undefined);
    }
  }, [open]);

  const trimmed = walletAddress.trim();
  const liveInvalid = trimmed.length > 0 && !isValidAddress(trimmed);

  const submit = async () => {
    if (!trimmed) {
      setWalletError('La dirección de la wallet es obligatoria.');
      return;
    }
    if (!isValidAddress(trimmed)) {
      setWalletError('Dirección Ethereum no válida. Debe tener el formato 0x…');
      return;
    }
    setWalletError(undefined);
    try {
      await add.mutateAsync({ walletAddress: trimmed, displayName: displayName.trim() || undefined });
      toast.success('Miembro añadido');
      onClose();
    } catch (e) {
      if (e instanceof ApiError && e.isConflict) {
        setWalletError('Esta wallet ya es miembro del grupo.');
        return;
      }
      toast.error(
        'No se pudo añadir el miembro',
        getFriendlyError(e, {
          403: 'No tienes permiso para añadir miembros a este grupo.',
          404: 'El grupo ya no existe.',
        }),
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={add.isPending}
      title="Añadir miembro"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={add.isPending}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={add.isPending} disabled={liveInvalid}>
            Añadir miembro
          </Button>
        </>
      }
    >
      <form
        className="flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Input
          label="Dirección de la wallet"
          required
          mono
          value={walletAddress}
          onChange={(e) => {
            setWalletAddress(e.target.value);
            if (walletError) setWalletError(undefined);
          }}
          placeholder="0x0000000000000000000000000000000000000000"
          error={walletError ?? (liveInvalid ? 'Dirección Ethereum no válida.' : undefined)}
          hint={!liveInvalid && !walletError ? 'Se guardará con checksum (EIP-55).' : undefined}
          autoComplete="off"
          spellCheck={false}
        />
        <Input
          label="Nombre para mostrar"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Opcional — p. ej. Ana Pérez"
          maxLength={120}
          autoComplete="off"
        />
        <button type="submit" className="sr-only" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
