import { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';
import styles from './inputs.module.css';

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${styles.input} ${props.className ?? ''}`} />;
}

export function NumberInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="number"
      {...props}
      className={`${styles.input} ${props.className ?? ''}`}
    />
  );
}

export function DateInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input type="date" {...props} className={`${styles.input} ${props.className ?? ''}`} />
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
}

export function Select({ options, className, ...rest }: SelectProps) {
  return (
    <select {...rest} className={`${styles.select} ${className ?? ''}`}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: ReactNode;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className={styles.toggle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={styles.toggleInput}
      />
      <span className={styles.toggleTrack}>
        <span className={styles.toggleThumb} />
      </span>
      {label && <span className={styles.toggleLabel}>{label}</span>}
    </label>
  );
}

interface CheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: ReactNode;
}

export function Checkbox({ checked, onChange, label }: CheckboxProps) {
  return (
    <label className={styles.checkbox}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={styles.checkboxInput}
      />
      <span className={styles.checkboxBox}>{checked && <span>✓</span>}</span>
      <span className={styles.checkboxLabel}>{label}</span>
    </label>
  );
}

interface RadioGroupProps<T extends string> {
  value: T;
  options: { value: T; label: string; description?: string }[];
  onChange: (next: T) => void;
}

export function RadioGroup<T extends string>({ value, options, onChange }: RadioGroupProps<T>) {
  return (
    <div className={styles.radioGroup}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`${styles.radioCard} ${active ? styles.radioCardActive : ''}`}
          >
            <span className={`${styles.radioDot} ${active ? styles.radioDotActive : ''}`} />
            <span className={styles.radioBody}>
              <span className={styles.radioTitle}>{o.label}</span>
              {o.description && <span className={styles.radioDescription}>{o.description}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
