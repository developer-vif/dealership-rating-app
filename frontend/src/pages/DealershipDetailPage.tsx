import React from 'react';
import { Container, Typography, Box, Alert } from '@mui/material';
import { useParams } from 'react-router-dom';

const DealershipDetailPage: React.FC = () => {
  const { placeId } = useParams<{ placeId: string }>();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h1" component="h1" gutterBottom>
        Dealership Details
      </Typography>
      
      <Alert severity="info" sx={{ mt: 2 }}>
        Dealership detail page for Place ID: {placeId}
        <br />
        This page will show detailed dealership information, reviews, ratings, and photos.
      </Alert>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="body1" color="text.secondary">
          Coming soon:
        </Typography>
        <ul>
          <li>Dealership contact information</li>
          <li>Hours of operation</li>
          <li>Customer reviews and ratings</li>
          <li>Photos and virtual tours</li>
          <li>Services offered</li>
          <li>Inventory preview</li>
        </ul>
      </Box>
    </Container>
  );
};

export default DealershipDetailPage;