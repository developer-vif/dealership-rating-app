import React, { useState } from 'react';
import { Box, Container, Typography, Link } from '@mui/material';
import TermsOfServiceDialog from '../dialogs/TermsOfServiceDialog';

const Footer: React.FC = () => {
  const [showTermsDialog, setShowTermsDialog] = useState(false);

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.primary.main,
        color: 'white'
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" align="center">
          © 2025 ORCR Agad! Help car and motorcycle buyers make informed decisions.
        </Typography>
        <Typography variant="caption" align="center" sx={{ display: 'block', mt: 1, opacity: 0.8 }}>
          <Link
            component="button"
            onClick={(e) => {
              e.preventDefault();
              setShowTermsDialog(true);
            }}
            color="inherit"
            sx={{ 
              textDecoration: 'underline',
              background: 'none',
              border: 'none',
              padding: 0,
              font: 'inherit',
              cursor: 'pointer'
            }}
          >
            Terms of Service
          </Link>
        </Typography>
      </Container>

      {/* Terms of Service Dialog */}
      <TermsOfServiceDialog
        open={showTermsDialog}
        onClose={() => setShowTermsDialog(false)}
      />
    </Box>
  );
};

export default Footer;