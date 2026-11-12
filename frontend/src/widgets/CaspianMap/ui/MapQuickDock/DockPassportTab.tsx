'use client';

import { CheckCircle2, Clock, ExternalLink, ShieldCheck } from 'lucide-react';
import type { Role, Shipment } from '@/shared/api/caspian';
import { Badge, Button } from '@/shared/ui';
import styles from './MapQuickDock.module.css';

interface DockPassportTabProps {
  shipment: Shipment;
  role?: Role;
  isBusy?: boolean;
  onAttest?: (decision: 'approved' | 'rejected') => void;
}

const ROLE_NAMES: Record<Role, string> = { logistician: 'Логист', carrier: 'Перевозчик', customs: 'Таможня' };

export function DockPassportTab({ shipment, role, isBusy, onAttest }: DockPassportTabProps) {
  const { passport } = shipment;
  const canAttest = shipment.allowed_actions.includes('attest');
  return (
    <div className={styles.list}>
      <div className={styles.card}>
        <div className={styles.rowBetween}>
          <span className={styles.title}><ShieldCheck className={styles.icon} /> Паспорт V{passport.version}</span>
          <Badge variant={passport.status === 'ready' ? 'success' : 'secondary'}>{passport.status.toUpperCase()}</Badge>
        </div>
        <span className={styles.meta}>DOC: {passport.documents_hash.slice(0, 14)}…</span>
        <span className={styles.meta}>RTE: {passport.route_hash.slice(0, 14)}…</span>
      </div>
      {passport.required_roles.map((reqRole) => {
        const att = passport.attestations.find((a) => a.role === reqRole && a.status === 'active');
        return (
          <div key={reqRole} className={`${styles.card} ${reqRole === role ? styles.cardActive : ''}`}>
            <div className={styles.rowBetween}>
              <span className={styles.title}>{ROLE_NAMES[reqRole]}</span>
              {att ? <span className={styles.activeTag}><CheckCircle2 className={styles.icon} /> Подписано</span> : <span className={styles.meta}><Clock className={styles.icon} /> Ожидает</span>}
            </div>
          </div>
        );
      })}
      {onAttest && (
        <Button type="button" size="sm" variant="default" disabled={!canAttest || isBusy} onClick={() => onAttest('approved')}>
          <CheckCircle2 className={styles.icon} />
          <span>Подписать смарт-контракт · {role ? ROLE_NAMES[role] : 'Сеть'}</span>
        </Button>
      )}
      {passport.explorer_url && (
        <a href={passport.explorer_url} target="_blank" rel="noreferrer" className={styles.link}>
          Реестр блокчейна <ExternalLink className={styles.icon} />
        </a>
      )}
    </div>
  );
}
