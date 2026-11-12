'use client';

import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/shared/ui';
import styles from './ForceMajeureButton.module.css';

interface ForceMajeureButtonProps {
  stormActive: boolean;
  onToggle: () => void;
}

export function ForceMajeureButton({
  stormActive,
  onToggle,
}: ForceMajeureButtonProps) {
  return (
    <Button
      type="button"
      variant={stormActive ? 'destructive' : 'outline'}
      size="sm"
      onClick={onToggle}
      className={stormActive ? styles.activeTrigger : styles.idleTrigger}
    >
      {stormActive ? (
        <>
          <RotateCcw className={styles.icon} />
          <span>Сбросить форс-мажор (Шторм в Энзели)</span>
        </>
      ) : (
        <>
          <AlertTriangle className={styles.iconWarning} />
          <span>Симулировать форс-мажор (Шторм в Энзели)</span>
        </>
      )}
    </Button>
  );
}

