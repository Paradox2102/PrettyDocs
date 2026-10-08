import styles from './Segmented.module.css';

interface Props<T extends string> {
  label: string;
  name: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** A radio group drawn as one segmented control. Native radios give the arrow-key behaviour. */
export function Segmented<T extends string>({ label, name, options, value, onChange }: Props<T>) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{label}</legend>
      <div className={styles.track}>
        {options.map((o) => (
          <label key={o.value} className={styles.option}>
            <input type="radio" name={name} value={o.value} checked={o.value === value}
              onChange={() => onChange(o.value)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
