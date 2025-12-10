import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useAuth } from '../features/auth/useAuth';

const LoginForm = ({ onSubmit, error, loading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <Stack component="form" spacing={2} onSubmit={(e) => { e.preventDefault(); onSubmit({ email, password }); }}>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
      <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth />
      <Button variant="contained" type="submit" disabled={loading} fullWidth>
        {loading ? 'Logging in…' : 'Login'}
      </Button>
    </Stack>
  );
};

const SignupForm = ({ onSubmit, error, loading }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <Stack component="form" spacing={2} onSubmit={(e) => { e.preventDefault(); onSubmit({ name, email, password }); }}>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
      <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
      <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth helperText="Min 6 characters" />
      <Button variant="contained" type="submit" disabled={loading} fullWidth>
        {loading ? 'Creating account…' : 'Create Account'}
      </Button>
    </Stack>
  );
};

const LoginPage = () => {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/editor/modern-flat-tour';

  const [tab, setTab] = useState('login');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async ({ email, password }) => {
    setError('');
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate(redirectTo, { replace: true });
    } catch (e) {
      setError(e?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async ({ name, email, password }) => {
    setError('');
    setSubmitting(true);
    try {
      await signup({ name, email, password });
      navigate(redirectTo, { replace: true });
    } catch (e) {
      setError(e?.message || 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', p: 2, bgcolor: 'background.default' }}>
      <Paper elevation={3} sx={{ width: 400, p: 3 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Welcome
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to continue or create an account.
            </Typography>
          </Box>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} centered>
            <Tab label="Login" value="login" />
            <Tab label="Signup" value="signup" />
          </Tabs>
          {tab === 'login' ? (
            <LoginForm onSubmit={handleLogin} error={error} loading={submitting} />
          ) : (
            <SignupForm onSubmit={handleSignup} error={error} loading={submitting} />
          )}
          <Typography variant="caption" color="text.secondary" textAlign="center">
            Auth connects to the backend; keep your token safe.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
};

export default LoginPage;

