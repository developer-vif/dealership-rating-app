import { Routes, Route } from 'react-router-dom';
import { Container } from '@mui/material';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import DealershipsPage from './pages/DealershipsPage';
import DealershipDetailPage from './pages/DealershipDetailPage';
import ReviewFormPage from './pages/ReviewFormPage';

function App() {
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