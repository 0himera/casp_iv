'use client';

import { AlertTriangle } from 'lucide-react';
import type { Shipment } from '@/shared/api/caspian';
import styles from './StormInspectionCard.module.css';

interface StormInspectionCardProps {
  shipment: Shipment; isBusy?: boolean; onSelectRoute?: (routeId: string) => void; onClose: () => void;
}

export function StormInspectionCard({ shipment }: StormInspectionCardProps) {
  return <div className={styles.card}>
    <div className={styles.titleWrap}><AlertTriangle className={styles.icon} /><h2 className={styles.name}>Штормовой сценарий</h2></div>
    <p className={styles.meta}>Южный Каспий · Энзели</p>
    <p className={styles.desc}>Зона показывает условное ограничение: сценарий добавляет 24 часа ожидания в выбранном коридоре. Это не сообщение о фактическом закрытии переправы.</p>
    <p className={styles.desc}>В разделе «Маршруты» можно сравнить альтернативы. Их риск рассчитывает сервер; смена пути сама по себе не гарантирует обход ограничения.</p>
    <p className={styles.meta}>Прогноз: {shipment.forecast.method} · условия можно изменить в разделе «Прогноз».</p>
  </div>;
}
