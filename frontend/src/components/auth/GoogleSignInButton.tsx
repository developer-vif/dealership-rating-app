import React, { useEffect, useRef } from 'react';
import { Button, CircularProgress, Alert } from '@mui/material';
import { Google } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    google: any;
    handleCredentialResponse?: (response: any) => void;
  }
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  disabled = false
}) => {
  const { login, loading } = useAuth();
  const [localLoading, setLocalLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) {
      setError('Google Client ID not configured');
      return;
    }

    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleSignIn;
    script.onerror = () => {
      setError('Failed to load Google Sign-In script');
    };
    
    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [clientId]);

  const initializeGoogleSignIn = () => {
    if (!window.google || !clientId) return;

    // Initialize Google Identity Services
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    // Render the button
    if (googleButtonRef.current) {
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
      });
    }
  };

  const handleCredentialResponse = async (response: any) => {
    try {
      setLocalLoading(true);
      setError(null);

      if (!response.credential) {
        throw new Error('No credential received from Google');
      }

      await login(response.credential);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google sign-in failed';
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLocalLoading(false);
    }
  };

  // Expose the handler globally for Google to call
  useEffect(() => {
    window.handleCredentialResponse = handleCredentialResponse;
    
    return () => {
      delete window.handleCredentialResponse;
    };
  }, []);

  const handleFallbackSignIn = () => {
    if (!window.google || !clientId) {
      setError('Google Sign-In not available');
      return;
    }

    // Fallback: Use Google One Tap or prompt
    window.google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        console.log('Google One Tap was not displayed or was skipped');
      }
    });
  };

  if (!clientId) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Google Sign-In is not configured. Please check your environment variables.
      </Alert>
    );
  }

  return (
    <div>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <div style={{ position: 'relative' }}>
        {/* Google-rendered button */}
        <div 
          ref={googleButtonRef}
          style={{ 
            display: (loading || localLoading || disabled) ? 'none' : 'block' 
          }}
        />
        
        {/* Fallback button */}
        <Button
          variant="outlined"
          startIcon={
            (loading || localLoading) ? (
              <CircularProgress size={20} />
            ) : (
              <Google />
            )
          }
          onClick={handleFallbackSignIn}
          disabled={disabled || loading || localLoading}
          fullWidth
          sx={{
            mt: 1,
            py: 1.5,
            borderColor: '#dadce0',
            color: '#3c4043',
            '&:hover': {
              backgroundColor: '#f8f9fa',
              borderColor: '#dadce0',
            },
            display: (loading || localLoading || disabled) ? 'flex' : 'none'
          }}
        >
          {(loading || localLoading) ? 'Signing in...' : 'Sign in with Google'}
        </Button>
      </div>
    </div>
  );
};

export default GoogleSignInButton;