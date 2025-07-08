import React from 'react';
import { Container, Typography, Box, Alert } from '@mui/material';
import { useParams } from 'react-router-dom';

const ReviewFormPage: React.FC = () => {
  const { placeId } = useParams<{ placeId: string }>();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h1" component="h1" gutterBottom>
        Write a Review
      </Typography>
      
      <Alert severity="info" sx={{ mt: 2 }}>
        Review form for dealership with Place ID: {placeId}
        <br />
        This page will include a comprehensive review form with rating system.
      </Alert>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="body1" color="text.secondary">
          Coming soon:
        </Typography>
        <ul>
          <li>Star rating system</li>
          <li>Document processing time tracking</li>
          <li>Written review with character limits</li>
          <li>Photo upload capability</li>
          <li>Review verification system</li>
          <li>Experience categorization</li>
        </ul>
      </Box>
    </Container>
  );
};

export default ReviewFormPage;