'use client';

import styles from './RailSignature.module.css';

interface RailSignatureProps {
  text?: string;
}

export function RailSignature({
  text = 'CASPIAN // MTC NORTH-SOUTH // 42.98°N',
}: RailSignatureProps) {
  return (
    <div className={styles.wrapper}>
      <span className={styles.signature}>{text}</span>
    </div>
  );
}
