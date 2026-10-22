import * as React from 'react';
import RoastLogic from '@/lib/roast/RoastLogic';
import {TopRange} from '@/lib/roast/RoastClient';
import {useRoast} from './RoastContext';
import {useLoad} from './useLoad';
import TopTile from './TopTile';
import {LoadError, Loading} from './Status';
import styles from './roast.module.css';

const Ranges: { range: TopRange; label: string }[] = [
  { range: 'week', label: 'This week' },
  { range: 'all', label: 'All time' },
];

const PageSize = 24;

// The photos of past batches, ranked by the picks of their winning caption
export default function TopView() {
  const { viewer, viewerLoaded } = useRoast();
  const roastLogic = React.useMemo(() => new RoastLogic(), []);

  const [range, setRange] = React.useState<TopRange>('week');
  const [limit, setLimit] = React.useState(PageSize);

  // The limit is no part of the key, so that the shown photos stay while more load
  const key = viewerLoaded ? `top:${range}:${viewer?.id ?? ''}` : null;
  const loadPhotos = React.useCallback(
    () => roastLogic.fetchTopPhotos(range, limit, 0),
    [roastLogic, range, limit],
  );
  const photos = useLoad(key, loadPhotos);

  return (
    <>
      <h1 className={styles.title}>Top roasts</h1>
      <p className={styles.subtitle}>The captions the crowd picked, from every batch that has closed.</p>

      <div className={`${styles.segments} mt-5`}>
        {Ranges.map((option) => (
          <button
            key={option.range}
            type="button"
            className={styles.segment}
            aria-pressed={option.range === range}
            onClick={() => {
              setRange(option.range);
              setLimit(PageSize);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {photos.error && <LoadError message={photos.error} onRetry={photos.reload} />}
      {!photos.data && !photos.error && <Loading />}
      {photos.data && photos.data.length === 0 && (
        <div className={`${styles.card} ${styles.empty} mt-5`}>
          <p>
            No caption has won {range === 'week' ? 'this week' : 'yet'}. A photo lands here once its batch has closed
            at midnight with votes on it.
          </p>
        </div>
      )}
      {photos.data && photos.data.length > 0 && (
        <>
          <div className={styles.grid}>
            {photos.data.map((photo, index) => (
              <TopTile key={photo.id} photo={photo} rank={index + 1} />
            ))}
          </div>
          {photos.data.length === limit && (
            <div className="flex justify-center mt-6">
              <button type="button" className={styles.buttonGhost} onClick={() => setLimit(limit + PageSize)}>
                Show more
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
