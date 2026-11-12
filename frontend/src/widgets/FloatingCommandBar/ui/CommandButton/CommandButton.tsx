'use client';

import { Button } from '@/shared/ui';
import styles from './CommandButton.module.css';

interface CommandButtonProps {
  label: string;
  variant?: 'outline' | 'destructive' | 'secondary';
  disabled?: boolean;
  onClick: () => void;
}

export function CommandButton({
  label,
  variant = 'outline',
  disabled = false,
  onClick,
}: CommandButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant={variant}
      disabled={disabled}
      onClick={onClick}
      className={styles.cmdBtn}
    >
      {label}
    </Button>
  );
}
