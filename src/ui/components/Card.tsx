import { ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  tone?: 'default' | 'info' | 'warn' | 'accent';
}

export function Card({ title, description, children, tone = 'default' }: CardProps) {
  return (
    <section className={`${styles.card} ${styles[tone]}`}>
      {title && <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {description && <p className={styles.description}>{description}</p>}
      </header>}
      <div className={styles.body}>{children}</div>
    </section>
  );
}
