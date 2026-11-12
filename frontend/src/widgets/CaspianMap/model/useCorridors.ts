import { useQuery } from '@tanstack/react-query';
import type { CorridorList } from '../../../../../api/public-data.types';

export function useCorridors() {
  return useQuery({
    queryKey: ['port-corridors'],
    queryFn: async (): Promise<CorridorList> => {
      const r = await fetch('/api/backend/corridors', { cache: 'no-store' });
      if (!r.ok) throw new Error('Сеть портов недоступна');
      return r.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
