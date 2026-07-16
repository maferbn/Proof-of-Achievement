import { ApiError } from '../api/client';

/**
 * Maps an unknown error (usually ApiError) to a friendly, user-facing
 * Spanish message. Optional per-status overrides let callers tailor the
 * copy to their context (e.g. "wallet duplicada" for a 409 on members).
 */
export function getFriendlyError(
  error: unknown,
  overrides?: Partial<Record<number | 'network' | 'default', string>>,
): string {
  if (error instanceof ApiError) {
    if (error.isNetwork) {
      return overrides?.network ?? 'No se pudo conectar con el servidor. Verifica tu conexión.';
    }
    const override = overrides?.[error.status];
    if (override) return override;

    switch (error.status) {
      case 400:
        return error.message || 'La solicitud no es válida.';
      case 401:
        return 'Tu sesión expiró. Vuelve a iniciar sesión.';
      case 403:
        return 'No tienes permiso para realizar esta acción.';
      case 404:
        return 'El recurso solicitado no existe.';
      case 409:
        return error.message || 'El recurso ya existe.';
      default:
        if (error.isServer) return 'El servidor tuvo un problema. Inténtalo más tarde.';
        return error.message || 'Ocurrió un error inesperado.';
    }
  }

  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado.';
}

/**
 * Dedicated mapper for the SIWE verify flow. The backend wraps failures as
 * "SIWE verification failed: <reason>"; instead of collapsing every 400 into a
 * generic "no se pudo verificar la firma", we surface the real reason with
 * friendly copy for the common cases (nonce reuse/expiry, address mismatch,
 * DB/connection problems). Signature rejection is handled separately.
 */
export function getSiweErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isNetwork) {
      return 'No se pudo contactar al servidor de autenticación. Revisa tu conexión e inténtalo de nuevo.';
    }
    if (error.isServer) {
      return 'El servicio de autenticación no está disponible en este momento. Inténtalo más tarde.';
    }

    const raw = (error.message || '').toLowerCase();

    if (raw.includes('nonce already used')) {
      return 'El mensaje de acceso ya se había usado. Generaremos uno nuevo: vuelve a intentarlo.';
    }
    if (raw.includes('nonce expired')) {
      return 'El mensaje de acceso caducó. Vuelve a intentarlo para generar uno nuevo.';
    }
    if (raw.includes('nonce not found')) {
      return 'El mensaje de acceso ya no es válido. Vuelve a intentarlo para generar uno nuevo.';
    }
    if (raw.includes('nonce address') || raw.includes('does not match')) {
      return 'La firma no coincide con la wallet conectada. Asegúrate de firmar con la misma wallet.';
    }
    if (raw.includes('database') || raw.includes('connect') || raw.includes('econnrefused')) {
      return 'El servicio de autenticación no está disponible en este momento. Inténtalo más tarde.';
    }

    // Otherwise show the real backend reason, stripped of the internal prefix.
    if (error.message) {
      const cleaned = error.message.replace(/^siwe verification failed:\s*/i, '').trim();
      return cleaned || 'No se pudo verificar la firma. Vuelve a intentarlo.';
    }
  }

  if (error instanceof Error && error.message) return error.message;
  return 'No se pudo verificar la firma. Vuelve a intentarlo.';
}
