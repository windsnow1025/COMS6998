import * as React from 'react';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import UserLogic from '@/lib/common/user/UserLogic';
import {useAuthentication} from '@/session/SessionContext';
import {UserResDto} from '@/client/nest';

export default function AccountBar() {
  const authentication = useAuthentication();
  const [user, setUser] = React.useState<UserResDto | null>(null);
  const [error, setError] = React.useState('');
  const userLogic = React.useMemo(() => new UserLogic(), []);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        setUser(await userLogic.fetchUser());
      } catch (err) {
        setError((err as Error).message);
      }
    };
    fetchUser();
  }, [userLogic]);

  if (!user) {
    return (
      <Stack spacing={2} sx={{ mb: 2, alignItems: 'flex-start' }}>
        {error && <Alert severity="error">{error}</Alert>}
        <Button variant="contained" onClick={() => authentication?.signIn()}>
          Sign in
        </Button>
      </Stack>
    );
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username;

  return (
    <Stack spacing={2} sx={{ mb: 2 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Avatar src={user.avatar} alt={name} />
        <Typography variant="body1">
          {name}
        </Typography>
        <Button variant="outlined" href="/w3/profile">
          Profile
        </Button>
        <Button variant="outlined" onClick={() => authentication?.signOut()}>
          Sign out
        </Button>
      </Stack>
      {(!user.firstName || !user.lastName) && (
        <Alert
          severity="warning"
          slotProps={{ action: { sx: { alignItems: 'center', pt: 0 } } }}
          action={
            <Button variant="outlined" color="inherit" size="small" href="/w3/profile">
              Profile
            </Button>
          }
        >
          Add your first name and last name in your profile.
        </Alert>
      )}
    </Stack>
  );
}
