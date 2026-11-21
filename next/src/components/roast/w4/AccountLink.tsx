import * as React from 'react';
import Link from 'next/link';
import {useRoast} from './RoastContext';
import ViewerAvatar from './ViewerAvatar';
import styles from './roast.module.css';

// The viewer's avatar in the header as Weeks 4 and 5 delivered it: the way to the Me page; nothing while signed out
export default function AccountLink() {
  const { paths, viewer } = useRoast();

  if (!viewer) {
    return null;
  }
  return (
    <Link href={paths.me} aria-label="Your profile">
      <ViewerAvatar user={viewer} className={styles.avatar} />
    </Link>
  );
}
