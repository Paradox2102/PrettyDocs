import { driveShade, GROUP_COLORS } from '../logic/viewer';
import styles from './DriveKey.module.css';

const PARTS = 'gears, pulleys, belts, shafts, wheels, rollers';

/**
 * The key for the power-transfer shade in the 3D views. With a mechanism group: its color, then the darker shade.
 * Without one (the whole robot): text only, since every mechanism has its own shade.
 */
export function DriveKey({ group, className }: { group?: string; className?: string }) {
  const color = group ? GROUP_COLORS[group] : undefined;
  return (
    <p className={className ? `${styles.key} ${className}` : styles.key}>
      {color ? (
        <>
          <span className={styles.swatch} style={{ background: color }} aria-hidden="true" />
          <span className={styles.swatch} style={{ background: driveShade(color) }} aria-hidden="true" />
          {`Darker shade: power transfer (${PARTS})`}
        </>
      ) : `Power-transfer parts (${PARTS}) are a darker shade of their mechanism's color.`}
    </p>
  );
}
