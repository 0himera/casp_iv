import { API_BASE_URL } from '@/entities/shipment';
import { ApiError, createCaspianClient, type Operation, type Role } from '@/shared/api/caspian';

export interface PollResult {
  next: Operation | null;
  error: string | null;
  isNotFound: boolean;
}

export async function fetchOperationState(opId: string, role: Role): Promise<PollResult> {
  const client = createCaspianClient(API_BASE_URL, () => role);
  try {
    const next = await client.getOperation(opId);
    return { next, error: null, isNotFound: false };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { next: null, error: 'Операция не найдена. Обновите карточку.', isNotFound: true };
    }
    return { next: null, error: 'Не удалось проверить операцию; повторяем.', isNotFound: false };
  }
}

