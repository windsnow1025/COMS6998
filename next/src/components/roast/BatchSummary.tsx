import * as React from 'react';
import Link from 'next/link';
import IosShareRoundedIcon from '@mui/icons-material/IosShareRounded';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import RoastLogic from '@/lib/roast/RoastLogic';
import {formatCampusDate, getCampusDate} from '@/lib/roast/CampusTime';
import {buildShareGrid} from '@/lib/roast/PhotoResults';
import {share} from '@/lib/roast/Share';
import {BatchResDto, FlavorResDto, StatsResDto} from '@/client/nest';
import {useRoast} from './RoastContext';
import Countdown from './Countdown';
import FlavorChip from './FlavorChip';
import styles from './roast.module.css';

interface BatchSummaryProps {
  // A batch whose every photo the viewer has voted on or uploaded
  batch: BatchResDto;
}

// What the viewer gets for finishing a batch: the score against the crowd, the streak, and the voices they picked.
export default function BatchSummary({ batch }: BatchSummaryProps) {
  const { paths, notify } = useRoast();
  const roastLogic = React.useMemo(() => new RoastLogic(), []);
  const [stats, setStats] = React.useState<StatsResDto | null>(null);

  React.useEffect(() => {
    roastLogic.fetchMyStats().then(setStats, (error: Error) => notify(error.message));
  }, [roastLogic, notify]);

  const picks = batch.photos.filter(({ viewer }) => viewer.captionId !== null);
  const judged = picks.filter(({ viewer }) => viewer.matched !== undefined);
  const matches = judged.filter(({ viewer }) => viewer.matched);

  const pickedFlavors = new Map<string, { flavor: FlavorResDto; count: number }>();
  for (const photo of picks) {
    const flavor = photo.captions.find(({ id }) => id === photo.viewer.captionId)?.flavor;
    if (flavor) {
      const count = (pickedFlavors.get(flavor.slug)?.count ?? 0) + 1;
      pickedFlavors.set(flavor.slug, { flavor, count });
    }
  }

  const isToday = batch.date === getCampusDate(new Date());

  const handleShare = async () => {
    const score = judged.length > 0 ? ` · ${matches.length}/${judged.length} with the crowd` : '';
    const streak = stats && stats.streak > 0 ? ` · \u{1F525} ${stats.streak}` : '';
    const result = await share({
      title: 'Daily Roast',
      text: `Daily Roast · ${formatCampusDate(batch.date)}\n${buildShareGrid(batch.photos)}${score}${streak}`,
      url: `${window.location.origin}${isToday ? paths.today : paths.batch(batch.date)}`,
    });
    if (result === 'copied') {
      notify('Result copied. Paste it anywhere.');
    }
  };

  return (
    <section className={styles.summary}>
      <h2 className={styles.title}>Batch done.</h2>
      <p className={styles.subtitle}>{formatCampusDate(batch.date)}</p>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statValue}>
            <LocalFireDepartmentRoundedIcon className={styles.flame} />
            {stats ? stats.streak : '–'}
          </div>
          <div className={styles.statLabel}>day streak</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>
            {judged.length > 0 ? `${matches.length}/${judged.length}` : '–'}
          </div>
          <div className={styles.statLabel}>
            {judged.length > 0 ? 'with the crowd' : 'verdicts pending'}
          </div>
        </div>
      </div>

      {pickedFlavors.size > 0 && (
        <>
          <div className={styles.statLabel}>Your taste in this batch</div>
          <div className={styles.chips}>
            {[...pickedFlavors.values()]
              .sort((a, b) => b.count - a.count)
              .map(({ flavor, count }) => (
                <FlavorChip key={flavor.slug} flavor={flavor} suffix={`×${count}`} />
              ))}
          </div>
        </>
      )}

      <div className={`${styles.actions} ${styles.actionsFill}`}>
        <button type="button" className={styles.buttonGhost} onClick={handleShare}>
          <IosShareRoundedIcon fontSize="small" />
          Share
        </button>
        <Link href={paths.roast} className={styles.button}>
          Roast my photo
        </Link>
      </div>

      {isToday && <Countdown />}
    </section>
  );
}
