import FableScrape from '../../fable-scrape/FableScrape';
import styles from '../researchLab.module.css';

/** Embeds the standalone Fable Scrape tool — original component unchanged. */
export default function OwrFableScrape() {
  return (
    <div className={styles.owrFableEmbed}>
      <FableScrape />
    </div>
  );
}
