import React, { useState, useRef, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Container, 
  Box, 
  Avatar, 
  Menu, 
  MenuItem, 
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Home, Login, Logout, AccountCircle, Close } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import GoogleSignInButton from '../auth/GoogleSignInButton';
import LogoutConfirmationDialog from '../auth/LogoutConfirmationDialog';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  
  const loginDialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store the element that had focus before the login dialog opened
  useEffect(() => {
    if (loginDialogOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [loginDialogOpen]);

  // Restore focus when login dialog closes
  useEffect(() => {
    if (!loginDialogOpen && previousFocusRef.current) {
      // Use setTimeout to ensure the dialog is fully closed before restoring focus
      setTimeout(() => {
        if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
          previousFocusRef.current.focus();
        }
      }, 100);
    }
  }, [loginDialogOpen]);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLoginClick = () => {
    setLoginDialogOpen(true);
  };

  const handleLoginDialogClose = () => {
    setLoginDialogOpen(false);
  };

  const handleLoginSuccess = () => {
    setLoginDialogOpen(false);
    handleUserMenuClose();
  };

  const handleLogout = () => {
    setLogoutDialogOpen(true);
    handleUserMenuClose();
  };

  const handleLogoutConfirm = () => {
    logout();
    setLogoutDialogOpen(false);
  };

  const handleLogoutCancel = () => {
    setLogoutDialogOpen(false);
  };

  return (
    <>
      <AppBar position="sticky" color="primary">
        <Container maxWidth="lg">
          <Toolbar>
            <Typography
              variant="h6"
              component={RouterLink}
              to="/"
              sx={{
                flexGrow: 1,
                textDecoration: 'none',
                color: 'inherit',
                fontWeight: 'bold',
                fontSize: '1.5rem'
              }}
            >
              DealerRate
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                component={RouterLink}
                to="/"
                color="inherit"
                startIcon={<Home />}
              >
                Home
              </Button>
              
              
              {isAuthenticated ? (
                <>
                  <Button
                    color="inherit"
                    onClick={handleUserMenuOpen}
                    startIcon={
                      user?.picture ? (
                        <Avatar
                          src={user.picture}
                          sx={{ width: 24, height: 24 }}
                        />
                      ) : (
                        <AccountCircle />
                      )
                    }
                  >
                    {user?.name || 'User'}
                  </Button>
                  
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleUserMenuClose}
                    PaperProps={{
                      elevation: 0,
                      sx: {
                        overflow: 'visible',
                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                        mt: 1.5,
                        '& .MuiAvatar-root': {
                          width: 32,
                          height: 32,
                          ml: -0.5,
                          mr: 1,
                        },
                      },
                    }}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  >
                    <MenuItem onClick={(e) => e.stopPropagation()}>
                      {user?.picture ? (
                        <Avatar
                          src={user.picture}
                          sx={{ width: 32, height: 32, mr: 1 }}
                        />
                      ) : (
                        <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                          <AccountCircle />
                        </Avatar>
                      )}
                      <Box>
                        <Typography variant="subtitle1">{user?.name}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {user?.email}
                        </Typography>
                      </Box>
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleLogout}>
                      <Logout fontSize="small" sx={{ mr: 1 }} />
                      Logout
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Button
                  color="inherit"
                  startIcon={<Login />}
                  onClick={handleLoginClick}
                >
                  Login
                </Button>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Login Dialog */}
      <Dialog 
        ref={loginDialogRef}
        open={loginDialogOpen} 
        onClose={handleLoginDialogClose} 
        maxWidth="sm" 
        fullWidth
        disableRestoreFocus
        disableAutoFocus
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Sign In to DealerRate
          <IconButton onClick={handleLoginDialogClose}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Sign in with your Google account to write reviews, rate dealerships, and track your experiences.
          </Typography>
          <GoogleSignInButton 
            onSuccess={handleLoginSuccess}
            onError={(error) => console.error('Login error:', error)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLoginDialogClose}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmationDialog
        open={logoutDialogOpen}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
};

export default Navbar;