'use client';

import type { CargoItem } from '@/entities/cargo';
import { SmartContractCard } from '@/features/pre-clearance';
import { ScrollArea } from '@/shared/ui';
import { CargoItemCard } from '../CargoItemCard';
import styles from './CargoSidebar.module.css';

interface CargoSidebarProps {
  cargos: CargoItem[];
  selectedCargo: CargoItem;
  verifyingId: string | null;
  onSelectCargo: (id: string) => void;
  onRunPreClearance: (id: string) => void;
}

export function CargoSidebar({
  cargos,
  selectedCargo,
  verifyingId,
  onSelectCargo,
  onRunPreClearance,
}: CargoSidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.heading}>Мониторинг грузов</h2>
        <span className={styles.counter}>{cargos.length} активных</span>
      </div>
      <ScrollArea className={styles.listScroll}>
        <div className={styles.list}>
          {cargos.map((cargo) => (
            <CargoItemCard
              key={cargo.id}
              cargo={cargo}
              isSelected={cargo.id === selectedCargo.id}
              onSelect={onSelectCargo}
            />
          ))}
        </div>
      </ScrollArea>
      <SmartContractCard
        cargo={selectedCargo}
        isVerifying={verifyingId === selectedCargo.id}
        onRunPreClearance={onRunPreClearance}
      />
    </aside>
  );
}

