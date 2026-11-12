import { useQuery } from '@tanstack/react-query';
import type { LiveOverview } from '../../../../../api/public-data.types';

export function useLiveOverview() {
  return useQuery({
    queryKey: ['live-overview'],
    queryFn: async (): Promise<LiveOverview> => {
      const response = await fetch('/api/backend/live-overview', { cache: 'no-store' });
      if (!response.ok) throw new Error('Данные портов временно недоступны');
      return response.json();
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60 * 1000,
    retry: 1,
  });
}
