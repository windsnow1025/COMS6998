import * as React from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import {useColorScheme} from '@mui/material/styles';
import AddAPhotoRoundedIcon from '@mui/icons-material/AddAPhotoRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';
import {createRoastPaths} from '@/lib/roast/RoastPaths';
import {FontVariables} from './Fonts';
import {RoastProvider, useRoast} from './RoastContext';
import styles from './roast.module.css';

export type RoastTab = 'today' | 'top' | 'roast' | 'me';

interface RoastShellProps {
  // The week's base path, under which the product's routes live
  base: string;
  // The icon of the product's mark in the header
  brandMark: React.ReactNode;
  // The viewer's avatar in the header, which renders nothing while signed out: the week's `AccountLink` or `AccountMenu`
  account: React.ReactNode;
  // The tab of the current page; null for a page outside the tabs
  active: RoastTab | null;
  wide?: boolean;
  children: React.ReactNode;
}

export default function RoastShell({ base, brandMark, account, active, wide, children }: RoastShellProps) {
  const paths = React.useMemo(() => createRoastPaths(base), [base]);

  return (
    <div className={`local-scroll-container ${styles.root} ${FontVariables}`}>
      <RoastProvider paths={paths}>
        <Header brandMark={brandMark} account={account} active={active} />
        <main className={styles.main}>
          <div className={wide ? `${styles.page} ${styles.pageWide}` : styles.page}>
            {children}
          </div>
        </main>
        <TabBar active={active} />
      </RoastProvider>
    </div>
  );
}

function useTabs() {
  const { paths } = useRoast();
  return [
    { tab: 'today', label: 'Today', href: paths.today, icon: <TodayRoundedIcon /> },
    { tab: 'top', label: 'Top', href: paths.top, icon: <EmojiEventsRoundedIcon /> },
    { tab: 'roast', label: 'Roast', href: paths.roast, icon: <AddAPhotoRoundedIcon /> },
    { tab: 'me', label: 'Me', href: paths.me, icon: <PersonRoundedIcon /> },
  ] as const;
}

interface HeaderProps {
  brandMark: React.ReactNode;
  account: React.ReactNode;
  active: RoastTab | null;
}

function Header({ brandMark, account, active }: HeaderProps) {
  const { paths, viewer, viewerLoaded } = useRoast();
  const router = useRouter();
  const tabs = useTabs();

  return (
    <header className={styles.header}>
      <Link href={paths.today} className={styles.brand}>
        <span className={styles.brandMark}>{brandMark}</span>
        Daily Roast
      </Link>
      <nav className={styles.nav} aria-label="Sections">
        {tabs.map(({ tab, label, href }) => (
          <Link key={tab} href={href} className={styles.navLink} aria-current={tab === active ? 'page' : undefined}>
            {label}
          </Link>
        ))}
      </nav>
      <div className={styles.headerActions}>
        <ColorModeButton />
        {account}
        {viewerLoaded && !viewer && active !== null && (
          <Link href={paths.signIn(router.asPath)} className={`${styles.buttonGhost} ${styles.buttonSmall}`}>
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}

function ColorModeButton() {
  const { mode, systemMode, setMode } = useColorScheme();
  const isDark = (systemMode || mode) === 'dark';

  return (
    <button
      type="button"
      className={styles.iconButton}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setMode(isDark ? 'light' : 'dark')}
    >
      {isDark ? <LightModeRoundedIcon fontSize="small" /> : <DarkModeRoundedIcon fontSize="small" />}
    </button>
  );
}

function TabBar({ active }: { active: RoastTab | null }) {
  const tabs = useTabs();

  return (
    <nav className={styles.tabbar} aria-label="Sections">
      {tabs.map(({ tab, label, href, icon }) => (
        <Link key={tab} href={href} className={styles.tab} aria-current={tab === active ? 'page' : undefined}>
          {icon}
          {label}
        </Link>
      ))}
    </nav>
  );
}
