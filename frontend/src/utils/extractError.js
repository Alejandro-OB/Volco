export function extractError(err) {
  if (err?.response?.data?.detail) return err.response.data.detail;
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.response?.data && typeof err.response.data === 'object') {
    const messages = Object.values(err.response.data).flat().join('. ');
    if (messages) return messages;
  }
  if (err?.message) return err.message;
  return 'Error inesperado. Intenta de nuevo.';
}
