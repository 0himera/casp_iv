'use client';

import { useMemo, useState } from 'react';
import type { Shipment, ShipmentSummary } from '@/shared/api/caspian';
import { ScrollArea } from '@/shared/ui';
import { CargoItemCard } from '../CargoItemCard';
import { ManifestHeader } from '../ManifestHeader';
import { ManifestSearch } from '../ManifestSearch';
import styles from './CargoSidebar.module.css';

export interface CargoSidebarProps {
  items: ShipmentSummary[];
  shipment: Shipment;
  isOpen?: boolean;
  onClose?: () => void;
  onSelectShipment: (id: string) => void;
}

export function CargoSidebar({
  items,
  shipment,
  isOpen = true,
  onClose,
  onSelectShipment,
}: CargoSidebarProps) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? items.filter((i) => `${i.id} ${i.title} ${i.origin} ${i.destination}`.toLowerCase().includes(q))
      : items;
  }, [items, query]);

  return (
    <aside className={isOpen ? styles.sidebar : styles.sidebarClosed}>
      <ManifestHeader revision={shipment.revision} count={filtered.length} onClose={onClose} />
      <ManifestSearch value={query} onChange={setQuery} />
      <ScrollArea className={styles.listScroll}>
        <div className={styles.list}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>Отправления не найдены</div>
          ) : (
            filtered.map((item) => (
              <CargoItemCard
                key={item.id}
                item={item}
                isSelected={item.id === shipment.id}
                onSelect={onSelectShipment}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
