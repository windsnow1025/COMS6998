import * as React from 'react';
import {useRouter} from 'next/router';
import Divider, {dividerClasses} from '@mui/material/Divider';
import {listClasses} from '@mui/material/List';
import ListItemIcon, {listItemIconClasses} from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem, {menuItemClasses} from '@mui/material/MenuItem';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import {useRoast} from './RoastContext';
import ViewerAvatar from './ViewerAvatar';
import styles from './roast.module.css';

// The theme styles MUI's menu over a CSS module's class, so the product's tokens reach it through `sx`;
// the menu renders inside the product's root, where the tokens are defined
const MenuPaperColors = {
  border: '1px solid var(--dr-line)',
  bgcolor: 'var(--dr-surface)',
  color: 'var(--dr-ink)',
};

const MenuPaperSx = {
  minWidth: 220,
  borderRadius: '16px',
  boxShadow: 'var(--dr-shadow)',
  ...MenuPaperColors,
  // The theme paints the paper again under the dark color scheme as `:where([data-mui-color-scheme="dark"]) &`,
  // which this selector outranks; the same selector would merge into the theme's and lose to it
  '[data-mui-color-scheme="dark"] &': MenuPaperColors,
};

const MenuSx = {
  [`& .${listClasses.root}`]: { padding: '4px' },
  [`& .${dividerClasses.root}`]: { margin: '4px -4px', borderColor: 'var(--dr-line)' },
  [`& .${menuItemClasses.root}`]: { margin: '2px 0', borderRadius: '10px', fontWeight: 600 },
  [`& .${listItemIconClasses.root}`]: { color: 'var(--dr-ink-soft)' },
};

// The viewer's avatar in the header as Week 7 delivers it: it opens the menu of the viewer's account, as
// PolyFlexLLM's avatar does; nothing while signed out
export default function AccountMenu() {
  const { paths, viewer, signOut } = useRoast();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const isOpen = anchorEl !== null;

  if (!viewer) {
    return null;
  }
  const close = () => setAnchorEl(null);
  const name = [viewer.firstName, viewer.lastName].filter(Boolean).join(' ') || viewer.username;

  return (
    <>
      <button
        type="button"
        className={styles.avatarMenuButton}
        aria-label="Your account"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        <ViewerAvatar user={viewer} className={styles.avatar} />
      </button>
      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={close}
        disablePortal
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        slotProps={{ paper: { sx: MenuPaperSx } }}
        sx={MenuSx}
      >
        <div className={styles.accountMenuHead}>
          <div className={styles.accountMenuName}>{name}</div>
          <div className={`${styles.muted} ${styles.small}`}>{viewer.email}</div>
        </div>
        <Divider />
        <MenuItem
          onClick={async () => {
            close();
            await router.push(paths.me);
          }}
        >
          <ListItemIcon>
            <PersonRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Your profile</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={async () => {
            close();
            signOut();
            await router.push(paths.today);
          }}
          sx={{ [`& .${listItemIconClasses.root}`]: { ml: 'auto', minWidth: 0 } }}
        >
          <ListItemText>Sign out</ListItemText>
          <ListItemIcon>
            <LogoutRoundedIcon fontSize="small" />
          </ListItemIcon>
        </MenuItem>
      </Menu>
    </>
  );
}
