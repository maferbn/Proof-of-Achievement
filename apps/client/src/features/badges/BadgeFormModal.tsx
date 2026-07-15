import { useEffect, useRef, useState } from 'react';
import { UploadCloud, X, Link2, Image as ImageIcon } from 'lucide-react';
import { Modal, Input, Textarea, Button } from '../../components/ui';
import { useCreateBadgeDefinition, useUploadMetadata } from '../../hooks/useBadges';
import { useToast } from '../../providers/toast-context';
import { ApiError } from '../../api/client';
import { getFriendlyError } from '../../utils/errors';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // backend limit

interface BadgeFormModalProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
}

export function BadgeFormModal({ open, onClose, groupId }: BadgeFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState<string>();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string>();
  const [dragOver, setDragOver] = useState(false);

  const [manualMode, setManualMode] = useState(false);
  const [manualUri, setManualUri] = useState('');

  const [busyStep, setBusyStep] = useState<string | null>(null);
  const busy = busyStep !== null;

  const create = useCreateBadgeDefinition();
  const uploadMetadata = useUploadMetadata();
  const toast = useToast();
  const previewRef = useRef<string | null>(null);

  const clearImage = () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
    setImageFile(null);
    setPreview(null);
  };

  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      setNameError(undefined);
      setFileError(undefined);
      setManualMode(false);
      setManualUri('');
      setBusyStep(null);
      clearImage();
    }
  }, [open]);

  // Revoke the object URL on unmount.
  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  const acceptFile = (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFileError('Selecciona un archivo de imagen válido.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setFileError('La imagen no puede superar los 10 MB.');
      return;
    }
    setFileError(undefined);
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = URL.createObjectURL(file);
    previewRef.current = url;
    setPreview(url);
    setImageFile(file);
  };

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('El nombre del logro es obligatorio.');
      return;
    }
    setNameError(undefined);

    try {
      let imageURI: string | undefined;

      if (manualMode) {
        imageURI = manualUri.trim() || undefined;
      } else if (imageFile) {
        setBusyStep('Subiendo a IPFS…');
        // Store the metadata JSON URI (which references the image) as imageURI,
        // because the backend uses BadgeDefinition.imageURI as the tokenURI.
        const meta = await uploadMetadata.mutateAsync({
          name: trimmed,
          description: description.trim() || undefined,
          image: imageFile,
        });
        imageURI = meta.metadataUri;
      }

      setBusyStep('Creando logro…');
      await create.mutateAsync({
        groupId,
        name: trimmed,
        description: description.trim() || undefined,
        imageURI,
      });
      toast.success('Logro creado');
      onClose();
    } catch (e) {
      if (e instanceof ApiError && e.status === 503) {
        setManualMode(true);
        toast.error(
          'IPFS no disponible',
          'El servicio IPFS no está configurado en el servidor. Puedes introducir una URI manual.',
        );
      } else if (e instanceof ApiError && e.isConflict) {
        setNameError('Ya existe un logro con ese nombre en este grupo.');
      } else if (e instanceof ApiError && e.status === 413) {
        setFileError('La imagen no puede superar los 10 MB.');
      } else {
        toast.error('No se pudo crear el logro', getFriendlyError(e));
      }
    } finally {
      setBusyStep(null);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={busy}
      title="Nuevo logro"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={busy}>
            {busyStep ?? 'Crear logro'}
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
          placeholder="p. ej. Primer Parcial"
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

        {!manualMode ? (
          <div className="field">
            <span className="field__label">Imagen del logro</span>

            {preview ? (
              <div
                className="flex items-center gap-3"
                style={{
                  padding: 'var(--sp-3)',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass-bg)',
                }}
              >
                <img
                  src={preview}
                  alt="Vista previa"
                  style={{ width: 56, height: 56, borderRadius: 'var(--r-sm)', objectFit: 'cover' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="text-sm text-strong truncate">{imageFile?.name}</div>
                  <div className="text-xs text-muted">
                    {imageFile ? `${(imageFile.size / 1024 / 1024).toFixed(2)} MB` : ''}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn--ghost btn--icon"
                  onClick={clearImage}
                  aria-label="Quitar imagen"
                  disabled={busy}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label
                className="flex-col items-center justify-center text-center"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  acceptFile(e.dataTransfer.files?.[0]);
                }}
                style={{
                  gap: 'var(--sp-2)',
                  padding: 'var(--sp-5)',
                  borderRadius: 'var(--r-md)',
                  border: `1.5px dashed ${dragOver ? 'var(--cyan)' : 'var(--glass-border-strong)'}`,
                  background: dragOver ? 'var(--glass-bg-strong)' : 'var(--glass-bg)',
                  cursor: 'pointer',
                  transition: 'border-color 160ms, background 160ms',
                }}
              >
                <UploadCloud size={24} style={{ color: 'var(--cyan)' }} />
                <span className="text-sm text-strong">Arrastra una imagen o selecciónala</span>
                <span className="text-xs text-muted">PNG, JPG, GIF o WEBP · máx. 10 MB</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => acceptFile(e.target.files?.[0])}
                  disabled={busy}
                />
              </label>
            )}

            {fileError && (
              <span className="field__error" role="alert">
                {fileError}
              </span>
            )}

            <button
              type="button"
              className="flex items-center gap-1 text-sm text-muted"
              style={{ background: 'none', border: 'none', padding: '2px 0', width: 'fit-content' }}
              onClick={() => setManualMode(true)}
            >
              <Link2 size={14} /> Usar una URI manual
            </button>
          </div>
        ) : (
          <div className="field">
            <Input
              label="Imagen / Metadata URI"
              mono
              value={manualUri}
              onChange={(e) => setManualUri(e.target.value)}
              placeholder="ipfs://… o https://…"
              hint="Se usará como tokenURI al emitir. Puede ser una imagen o un JSON de metadata."
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              className="flex items-center gap-1 text-sm text-muted"
              style={{ background: 'none', border: 'none', padding: '2px 0', width: 'fit-content' }}
              onClick={() => setManualMode(false)}
            >
              <ImageIcon size={14} /> Volver a subir una imagen
            </button>
          </div>
        )}

        <button type="submit" className="sr-only" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
