import * as React from 'react';
import Link from 'next/link';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import {formatCampusDate} from '@/lib/roast/CampusTime';
import {useRoast} from '../RoastContext';
import {useTodayBatch} from '../useTodayBatch';
import TodayBatch from '../TodayBatch';
import BatchFeed from './BatchFeed';
import styles from '../roast.module.css';

// The home of the product as Week 4 delivered it: a title, today's batch, and the way to the previous batch's verdicts
export default function TodayView() {
  const { viewer, viewerLoaded, paths } = useRoast();
  const load = useTodayBatch();
  const previous = load.earlier?.[0];

  return (
    <>
      {viewerLoaded && !viewer && (
        <>
          <h1 className={styles.title}>Pick the funniest caption.</h1>
          <p className={styles.subtitle}>
            A fresh batch of photos every day. AI writes the roasts. You pick the winner.
          </p>
        </>
      )}
      {viewer && (
        <>
          <h1 className={styles.title}>Today&apos;s batch</h1>
          {load.batch.data && <p className={styles.subtitle}>{formatCampusDate(load.batch.data.date)}</p>}
        </>
      )}
      <TodayBatch load={load} feed={BatchFeed} />
      {previous && (
        <Link href={paths.batch(previous.date)} className={`${styles.notice} mt-7`}>
          <span className={styles.noticeText}>
            <strong>{formatCampusDate(previous.date)}</strong>
            <br />
            <span className={`${styles.muted} ${styles.small}`}>See how the crowd voted on the last batch</span>
          </span>
          <ArrowForwardRoundedIcon />
        </Link>
      )}
    </>
  );
}
