import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Snackbar from '@mui/material/Snackbar';
import TextField from '@mui/material/TextField';
import UserLogic from '@/lib/common/user/UserLogic';
import {UserResDto} from '@/client/nest';

interface NameSectionProps {
  user: UserResDto;
  onUpdate: (user: UserResDto) => void;
}

export default function NameSection({ user, onUpdate }: NameSectionProps) {
  const [firstName, setFirstName] = React.useState(user.firstName ?? '');
  const [lastName, setLastName] = React.useState(user.lastName ?? '');
  const [isProcessing, setIsProcessing] = React.useState(false);

  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertMessage, setAlertMessage] = React.useState('');
  const [alertSeverity, setAlertSeverity] = React.useState<'success' | 'error' | 'info' | 'warning'>('info');

  const userLogic = new UserLogic();

  const showAlert = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      showAlert('First name and last name are required.', 'warning');
      return;
    }

    try {
      setIsProcessing(true);
      onUpdate(await userLogic.updateName(firstName.trim(), lastName.trim()));
      showAlert('Name updated successfully', 'success');
    } catch (err) {
      showAlert((err as Error).message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      noValidate
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        gap: 2,
      }}
    >
      <FormControl>
        <FormLabel htmlFor="firstName">First name</FormLabel>
        <TextField
          id="firstName"
          name="firstName"
          placeholder="Your first name"
          autoComplete="given-name"
          required
          fullWidth
          variant="outlined"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          disabled={isProcessing}
        />
      </FormControl>
      <FormControl>
        <FormLabel htmlFor="lastName">Last name</FormLabel>
        <TextField
          id="lastName"
          name="lastName"
          placeholder="Your last name"
          autoComplete="family-name"
          required
          fullWidth
          variant="outlined"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          disabled={isProcessing}
        />
      </FormControl>
      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={isProcessing}
      >
        Save
      </Button>
      <Snackbar
        open={alertOpen}
        autoHideDuration={6000}
        onClose={() => setAlertOpen(false)}
      >
        <Alert onClose={() => setAlertOpen(false)} severity={alertSeverity} sx={{ width: '100%' }}>
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
