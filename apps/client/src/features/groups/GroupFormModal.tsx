import { useEffect, useState } from 'react';
import { Modal, Input, Textarea, Button } from '../../components/ui';
import { useCreateGroup, useUpdateGroup } from '../../hooks/useGroups';
import { useToast } from '../../providers/toast-context';
import { ApiError } from '../../api/client';
import { getFriendlyError } from '../../utils/errors';
import type { Group } from '../../types/api';

interface GroupFormModalProps {
  open: boolean;
  onClose: () => void;
  /** When provided, the modal edits this group instead of creating. */
  group?: Group;
}

export function GroupFormModal({ open, onClose, group }: GroupFormModalProps) {
  const isEdit = !!group;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState<string>();

  const toast = useToast();
  const create = useCreateGroup();
  const update = useUpdateGroup(group?.id ?? '');
  const pending = create.isPending || update.isPending;

  useEffect(() => {
    if (open) {
      setName(group?.name ?? '');
      setDescription(group?.description ?? '');
      setNameError(undefined);
    }
  }, [open, group]);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('El nombre es obligatorio.');
      return;
    }
    setNameError(undefined);
    const input = { name: trimmed, description: description.trim() || undefined };

    try {
      if (isEdit) {
        await update.mutateAsync(input);
        toast.success('Grupo actualizado');
      } else {
        await create.mutateAsync(input);
        toast.success('Grupo creado');
      }
      onClose();
    } catch (e) {
      if (e instanceof ApiError && e.isConflict) {
        setNameError('Ya tienes un grupo con ese nombre.');
        return;
      }
      toast.error(isEdit ? 'No se pudo actualizar' : 'No se pudo crear', getFriendlyError(e));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={pending}
      title={isEdit ? 'Editar grupo' : 'Nuevo grupo'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={pending}>
            {isEdit ? 'Guardar cambios' : 'Crear grupo'}
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
          label="Nombre del grupo"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="p. ej. Curso de Solidity 2026"
          error={nameError}
          maxLength={120}
          autoComplete="off"
        />
        <Textarea
          label="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe brevemente este grupo (opcional)."
          rows={3}
          maxLength={500}
        />
        <button type="submit" className="sr-only" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
