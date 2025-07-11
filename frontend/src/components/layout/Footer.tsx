import React from 'react';
import { Box, Container, Typography } from '@mui/material';

const Footer: React.FC = () => {
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
          © 2024 DealerRate. Help car buyers make informed decisions.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;