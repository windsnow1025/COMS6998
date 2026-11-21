import * as React from 'react';
import Link from 'next/link';
import {formatPercent, getPickShare, getWinner} from '@/lib/roast/PhotoResults';
import {PhotoResDto} from '@/client/nest';
import {useRoast} from './RoastContext';
import FlavorChip from './FlavorChip';
import styles from './roast.module.css';

interface TopTileProps {
  photo: PhotoResDto;
  rank: number;
}

// A photo of the top list: its batch has closed, so its results show, and a caption of it leads alone
export default function TopTile({ photo, rank }: TopTileProps) {
  const { paths } = useRoast();
  const winner = getWinner(photo);
  if (!winner) {
    throw new Error('A photo of the top list has no winning caption');
  }

  return (
    <Link href={paths.photo(photo.id)} className={styles.tile}>
      {/* The photo is served from object storage, outside the image optimizer */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} alt={photo.description} className={styles.photoImage} loading="lazy" />
      <span className={styles.tileRank}>{rank}</span>
      <div className={styles.tileShade}>
        <p className={styles.tileCaption}>{winner.content}</p>
        <div className={styles.tileMeta}>
          {winner.flavor && <FlavorChip flavor={winner.flavor} />}
          <span>
            {formatPercent(getPickShare(photo, winner))} of {photo.voters} votes
          </span>
        </div>
      </div>
    </Link>
  );
}
