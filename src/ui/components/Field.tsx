import { ReactNode } from 'react';
import styles from './Field.module.css';

interface FieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
  inline?: boolean;
}

export function Field({ label, hint, children, inline }: FieldProps) {
  return (
    <div className={inline ? styles.fieldInline : styles.field}>
      <label className={styles.label}>{label}</label>
      {children}
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}
