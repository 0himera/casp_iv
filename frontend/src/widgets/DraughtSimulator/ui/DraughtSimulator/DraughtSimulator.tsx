'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Shipment } from '@/shared/api/caspian';
import { Badge } from '@/shared/ui';
import { BASIN_PORTS, computeDraughtTelemetry } from '../../model/draughtMath';
import styles from './DraughtSimulator.module.css';

interface DraughtSimulatorProps { shipment: Shipment; }

export function DraughtSimulator({ shipment }: DraughtSimulatorProps) {
  const [portId, setPortId] = useState(BASIN_PORTS[0].id);
  const [msl, setMsl] = useState(-28.6);
  const [tonnes, setTonnes] = useState(shipment.mass_tonnes || 4200);
  const port = BASIN_PORTS.find((p) => p.id === portId) ?? BASIN_PORTS[0];
  const sim = computeDraughtTelemetry(port, msl, tonnes);

  return (
    <section className={styles.frame}>
      <div className={styles.header}>
        <div>
          <span className={styles.stamp}>{'[ ARCHIVAL SPEC // КАЛЬКУЛЯТОР ОСАДКИ И ОБМЕЛЕНИЯ КАСПИЯ ]'}</span>
          <h2 className={styles.heading}>Гидрологический симулятор прохода судов</h2>
        </div>
        <Badge variant={sim.atRisk ? 'destructive' : 'success'}>
          {sim.atRisk ? <AlertTriangle className={styles.icon} /> : <CheckCircle2 className={styles.icon} />}
          {sim.atRisk ? 'ОГРАНИЧЕНИЕ ОСАДКИ' : 'ПРОХОД БЕЗОПАСЕН'}
        </Badge>
      </div>
      <div className={styles.grid}>
        <div className={styles.controls}>
          <label className={styles.field}>
            <span className={styles.label}>ПОРТ БАССЕЙНА</span>
            <select value={portId} onChange={(e) => setPortId(e.target.value)} className={styles.select}>
              {BASIN_PORTS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            <div className={styles.labelRow}><span>УРОВЕНЬ КАСПИЯ (MSL)</span><span className={styles.val}>{msl.toFixed(2)} м</span></div>
            <input type="range" min={-29.2} max={-28.0} step={0.05} value={msl} onChange={(e) => setMsl(Number(e.target.value))} className={styles.slider} />
          </label>
          <label className={styles.field}>
            <div className={styles.labelRow}><span>ЗАГРУЗКА ПАРТИИ</span><span className={styles.val}>{tonnes} т</span></div>
            <input type="range" min={1200} max={8000} step={200} value={tonnes} onChange={(e) => setTonnes(Number(e.target.value))} className={styles.slider} />
          </label>
        </div>
        <div className={styles.metrics}>
          <div className={styles.kpi}><span className={styles.label}>ГЛУБИНА КАНАЛА</span><span className={styles.big}>{sim.availableDepth} м</span><span className={styles.sub}>Требуемая осадка: {sim.requiredDraught} м</span></div>
          <div className={styles.kpi}><span className={styles.label}>ЗАПАС ПОД КИЛЕМ (UKC)</span><span className={`${styles.big} ${sim.atRisk ? styles.danger : styles.ok}`}>{sim.ukc} м</span><span className={styles.sub}>{sim.atRisk ? 'Риск касания грунта (рекомендуется Махачкала / Актау)' : 'В пределах допуска БСУ'}</span></div>
          <div className={styles.kpi}><span className={styles.label}>ПРЕДЕЛЬНЫЙ ДЕДВЕЙТ</span><span className={styles.big}>{sim.safeDwt.toLocaleString('ru-RU')} т</span><span className={styles.sub}>Загруженность рейда: {sim.congestion}%</span></div>
          <div className={styles.kpi}><span className={styles.label}>ДНОУГЛУБ. СБОР</span><span className={styles.big}>{sim.ecoEscrow.toLocaleString('ru-RU')} ₽</span><span className={styles.sub}>Пропорционально тоннажу и уровню MSL</span></div>
        </div>
      </div>
    </section>
  );
}
