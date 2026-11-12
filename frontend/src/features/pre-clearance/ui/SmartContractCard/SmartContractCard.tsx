'use client';

import { FileCheck2, ShieldCheck } from 'lucide-react';
import type { CargoItem } from '@/entities/cargo';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';
import { ClearanceStepRow } from '../ClearanceStepRow';
import { ContractMetaGrid } from '../ContractMetaGrid';
import styles from './SmartContractCard.module.css';

interface SmartContractCardProps {
  cargo: CargoItem;
  isVerifying: boolean;
  onRunPreClearance: (cargoId: string) => void;
}

export function SmartContractCard({ cargo, isVerifying, onRunPreClearance }: SmartContractCardProps) {
  const { smartContract } = cargo;
  const btnText = isVerifying
    ? 'Верификация блокчейн-шлюза...'
    : smartContract.isCleared
      ? 'Таможня пройдена (Verified)'
      : 'Выполнить Pre-Clearance';

  return (
    <Card className={styles.card}>
      <CardHeader className={styles.header}>
        <div className={styles.titleRow}>
          <div className={styles.titleWrap}>
            <ShieldCheck className={styles.shieldIcon} />
            <CardTitle>Цифровой коридор (Pre-clearance)</CardTitle>
          </div>
          <Badge variant={smartContract.isCleared ? 'success' : 'warning'}>
            {smartContract.isCleared ? 'Verified & Cleared' : 'В работе'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className={styles.content}>
        <ContractMetaGrid hash={smartContract.hash} accelerationHours={smartContract.accelerationHours} />
        <div className={styles.ecmrRow}>
          <FileCheck2 className={styles.miniIcon} />
          <span>e-CMR: {smartContract.eCmrStatus}</span>
        </div>
        <div className={styles.stepsList}>
          {smartContract.steps.map((step) => <ClearanceStepRow key={step.id} step={step} />)}
        </div>
        <Button type="button" size="sm" disabled={smartContract.isCleared || isVerifying} onClick={() => onRunPreClearance(cargo.id)} className={styles.actionBtn}>
          {btnText}
        </Button>
      </CardContent>
    </Card>
  );
}
