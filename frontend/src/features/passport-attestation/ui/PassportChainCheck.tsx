'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, CheckCheck, Loader2, Radio } from 'lucide-react';
import { API_BASE_URL } from '@/entities/shipment';
import { createCaspianClient, type Role, type Shipment } from '@/shared/api/caspian';
import { formatMskDateTime } from '@/shared/lib/formatters';
import styles from './passport-read.module.css';

export function PassportChainCheck({ shipment, role }: { shipment: Shipment; role: Role }) {
  const client = createCaspianClient(API_BASE_URL, () => role);
  const query = useQuery({ queryKey: ['passport-chain', shipment.id, shipment.revision], queryFn: () => client.getPassportState(shipment.id), enabled: false, retry: false });
  const chain = query.data?.passport;
  const matches = chain && chain.version === shipment.passport.version && chain.documents_hash === shipment.passport.documents_hash && chain.route_hash === shipment.passport.route_hash;
  const contract = shipment.passport.contract_address?.replace(/^hash-/, '');
  return <section className={styles.section} aria-label="Проверка в блокчейне">
    <div className={styles.heading}><Radio size={17} />Состояние в Casper</div>
    <p className={styles.note}>Прочитать текущую версию и хеши из сети. Проверка не отправляет транзакцию.</p>
    <div className={styles.links}>{contract && <a href={`https://testnet.cspr.live/contract/${contract}`} target="_blank" rel="noreferrer">Смарт-контракт ↗</a>}{shipment.passport.explorer_url && <a href={shipment.passport.explorer_url} target="_blank" rel="noreferrer">Последняя транзакция ↗</a>}</div>
    <button className={styles.button} onClick={() => void query.refetch()} disabled={query.isFetching || shipment.passport.network === 'mock'}>{query.isFetching ? <Loader2 size={15} className={styles.spin} /> : <CheckCheck size={16} />}{query.isFetching ? 'Читаем Casper…' : 'Сверить с блокчейном'}</button>
    {query.isError && <p role="alert" className={styles.error}>{query.error.message}. Можно повторить проверку.</p>}
    {!query.isError && query.data && !chain && <p className={styles.error}>Паспорт в сети не найден.</p>}
    {!query.isError && chain && <div className={styles.result}>
      <p className={matches ? styles.success : styles.error}>{matches ? 'Версия и хеши совпадают' : 'Версия или хеши отличаются от карточки. Дождитесь синхронизации.'}</p>
      <span>Версия {chain.version} · {({ ready: 'Согласован', collecting: 'Сбор подписей', blocked: 'Отклонён' })[chain.status]}</span>
      <span className={styles.note}>На блоке от {formatMskDateTime(new Date(chain.evaluated_at_ms).toISOString())}</span>
      <div className={styles.links}><a href={`https://testnet.cspr.live/block/${chain.block_hash}`} target="_blank" rel="noreferrer">Блок проверки <ArrowUpRight size={12} style={{ display: 'inline' }} /></a></div>
      <details className={styles.details}><summary>Хеши и решения ролей</summary><p className={styles.hash}>Документы: {chain.documents_hash}</p><p className={styles.hash}>Маршрут: {chain.route_hash}</p>
        {Object.entries(chain.decisions).map(([actor, decision]) => <p key={actor} className={styles.note}>{({ logistician: 'Логист', carrier: 'Перевозчик', customs: 'Таможня' } as Record<string, string>)[actor] ?? actor}: {decision.revoked_at_ms ? 'отозвано' : !decision.approved ? 'отклонено' : decision.valid_until_ms <= chain.evaluated_at_ms ? 'срок истёк' : 'согласовано'}</p>)}
      </details>
    </div>}
  </section>;
}
