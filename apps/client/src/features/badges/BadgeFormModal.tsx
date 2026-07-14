import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { Modal, Input, Textarea, Button } from '../../components/ui';
import { useCreateBadgeDefinition } from '../../hooks/useBadges';
import { useToast } from '../../providers/toast-context';
import { ApiError } from '../../api/client';
import { getFriendlyError } from '../../utils/errors';

interface BadgeFormModalProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
}

export function BadgeFormModal({ open, onClose, groupId }: BadgeFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageURI, setImageURI] = useState('');
  const [nameError, setNameError] = useState<string>();

  const create = useCreateBadgeDefinition();
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      setImageURI('');
      setNameError(undefined);
    }
  }, [open]);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('El nombre del logro es obligatorio.');
      return;
    }
    setNameError(undefined);
    try {
      await create.mutateAsync({
        groupId,
        name: trimmed,
        description: description.trim() || undefined,
        imageURI: imageURI.trim() || undefined,
      });
      toast.success('Logro creado');
      onClose();
    } catch (e) {
      if (e instanceof ApiError && e.isConflict) {
        setNameError('Ya existe un logro con ese nombre en este grupo.');
        return;
      }
      toast.error('No se pudo crear el logro', getFriendlyError(e));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={create.isPending}
      title="Nuevo logro"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={create.isPending}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={create.isPending}>
            Crear logro
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
          label="Nombre del logro"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="p. ej. Contribuidor destacado"
          error={nameError}
          maxLength={120}
          autoComplete="off"
        />
        <Textarea
          label="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="¿Qué reconoce este logro? (opcional)"
          rows={3}
          maxLength={500}
        />
        <Input
          label="Imagen / Metadata URI"
          mono
          value={imageURI}
          onChange={(e) => setImageURI(e.target.value)}
          placeholder="ipfs://… o https://…"
          hint="URI de imagen o metadata. Se usará como tokenURI al emitir."
          autoComplete="off"
          spellCheck={false}
        />
        <div
          className="flex items-start gap-2 text-xs"
          style={{
            padding: '0.6rem 0.75rem',
            borderRadius: 'var(--r-sm)',
            background: 'var(--info-bg)',
            border: '1px solid var(--info-border)',
            color: 'var(--info)',
          }}
        >
          <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            La subida directa a IPFS no está disponible por ahora. Introduce una URI ya alojada
            (IPFS o HTTPS).
          </span>
        </div>
        <button type="submit" className="sr-only" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
