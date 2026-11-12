export function formatMskDateTime(iso: string | null | undefined): string {
  if (!iso) return 'Нет данных';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Нет данных';
  return (
    new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Europe/Moscow',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date) + ' МСК'
  );
}

export function formatRubFromMinor(amountMinor: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amountMinor / 100);
}

export function formatProbability(prob: number | null | undefined): string {
  if (prob === null || prob === undefined) return 'Нет данных';
  return `${Math.round(prob * 100)}%`;
}

export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.readAsDataURL(file);
  });
}
