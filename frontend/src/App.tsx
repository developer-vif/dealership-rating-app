import { Routes, Route } from 'react-router-dom';
import { Container, CircularProgress, Box } from '@mui/material';
import { useLoadScript } from '@react-google-maps/api';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import DealershipsPage from './pages/DealershipsPage';
import DealershipDetailPage from './pages/DealershipDetailPage';
import ReviewFormPage from './pages/ReviewFormPage';

const libraries: ("places" | "geometry")[] = ['places', 'geometry'];

function App() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  if (loadError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Container sx={{ py: 4, textAlign: 'center' }}>
            <h1>Error loading Google Maps</h1>
            <p>Please check your internet connection and try again.</p>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '60vh',
              gap: 2,
            }}
          >
            <CircularProgress size={60} />
            <p>Loading Google Maps...</p>
          </Box>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dealerships" element={<DealershipsPage />} />
          <Route path="/dealership/:placeId" element={<DealershipDetailPage />} />
          <Route path="/dealership/:placeId/review" element={<ReviewFormPage />} />
          <Route path="*" element={
            <Container sx={{ py: 4, textAlign: 'center' }}>
              <h1>404 - Page Not Found</h1>
              <p>The page you're looking for doesn't exist.</p>
            </Container>
          } />
        </Routes>
      </main>
      
      <Footer />
    </div>
  );
}

export default App;