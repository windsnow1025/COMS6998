import * as React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import MuiCard from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {styled} from '@mui/material/styles';
import UserLogic from '@/lib/common/user/UserLogic';
import {useAuthentication} from '@/session/SessionContext';
import {UserResDto} from '@/client/nest';
import NameSection from '@/components/user/NameSection';
import AvatarSection from '@/components/common/settings/auth/signed-in/AvatarSection';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const ProfileContainer = styled(Stack)(({ theme }) => ({
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles('dark', {
      backgroundImage:
        'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
    }),
  },
}));

export default function Profile() {
  const authentication = useAuthentication();
  const [user, setUser] = React.useState<UserResDto | null>(null);
  const [loading, setLoading] = React.useState(true);
  const userLogic = React.useMemo(() => new UserLogic(), []);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        setUser(await userLogic.fetchUser());
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userLogic]);

  const renderContent = () => {
    if (loading) {
      return <CircularProgress sx={{ alignSelf: 'center' }} />;
    }
    if (!user) {
      return (
        <>
          <Alert severity="info">Sign in to see your profile.</Alert>
          <Button fullWidth variant="contained" onClick={() => authentication?.signIn()}>
            Sign in
          </Button>
        </>
      );
    }
    return (
      <>
        {(!user.firstName || !user.lastName) && (
          <Alert severity="warning">Add your first name and last name to complete your profile.</Alert>
        )}
        <AvatarSection />
        <Divider />
        <FormControl>
          <FormLabel htmlFor="email">Email</FormLabel>
          <TextField
            id="email"
            name="email"
            value={user.email}
            disabled
            fullWidth
            variant="outlined"
          />
        </FormControl>
        <NameSection user={user} onUpdate={setUser} />
        <Divider />
        <Stack direction="row" spacing={2}>
          <Button fullWidth variant="outlined" href="/w3">
            Captions
          </Button>
          <Button fullWidth variant="outlined" onClick={() => authentication?.signOut()}>
            Sign out
          </Button>
        </Stack>
      </>
    );
  };

  return (
    <ProfileContainer direction="column" justifyContent="space-between">
      <Card variant="outlined">
        <Typography
          component="h1"
          variant="h4"
          sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
        >
          Profile
        </Typography>
        {renderContent()}
      </Card>
    </ProfileContainer>
  );
}
