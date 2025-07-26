import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface TermsOfServiceDialogProps {
  open: boolean;
  onClose: () => void;
}

const TermsOfServiceDialog: React.FC<TermsOfServiceDialogProps> = ({ open, onClose }) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h5" component="h2">
          Terms and Agreement for Dealership Reviews
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: 'grey.500' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ py: 2 }}>
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Effective Date:</strong> January 1, 2024<br />
            <strong>Last Updated:</strong> January 1, 2024
          </Typography>
        </Box>

        <Typography variant="body2" sx={{ mb: 3 }}>
          By submitting a review on this platform, you ("Reviewer") agree to be bound by these Terms and Agreement ("Terms"). 
          Please read these Terms carefully before submitting any review.
        </Typography>

        <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 3 }}>
          1. Review Standards and Requirements
        </Typography>

        <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ mt: 2 }}>
          1.1 Truthfulness and Accuracy
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          You agree to provide only truthful, accurate, and honest reviews based on your actual experience with the car or motorcycle dealership. Reviews must be:
        </Typography>
        <List dense sx={{ mb: 2 }}>
          <ListItem>
            <ListItemText primary="Based on genuine personal experience" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Factually accurate to the best of your knowledge" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Free from false, misleading, or deceptive information" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Current and relevant to recent interactions" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
        </List>

        <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ mt: 2 }}>
          1.2 Respectful Communication
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          All reviews must maintain a respectful and professional tone. You agree not to submit content that:
        </Typography>
        <List dense sx={{ mb: 2 }}>
          <ListItem>
            <ListItemText primary="Contains offensive, abusive, or discriminatory language" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Includes personal attacks against individuals or staff members" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Uses profanity, hate speech, or threatening language" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Violates the dignity and rights of others" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
        </List>

        <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ mt: 2 }}>
          1.3 Prohibited Content
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Reviews must not contain:
        </Typography>
        <List dense sx={{ mb: 3 }}>
          <ListItem>
            <ListItemText primary="Spam, promotional content, or commercial solicitation" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Copyrighted material without proper authorization" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Personal information of third parties (names, contact details, etc.)" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Content that violates Philippine laws or regulations" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="False claims or unsubstantiated accusations" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
        </List>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" component="h3" gutterBottom>
          2. Reviewer Identity and Privacy
        </Typography>

        <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ mt: 2 }}>
          2.1 Anonymous Reviews
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          We respect your privacy and allow anonymous reviews. Your personal identity will not be publicly displayed alongside your review.
        </Typography>

        <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ mt: 2 }}>
          2.2 Data Collection and Storage
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          For authenticity and verification purposes, we reserve the right to:
        </Typography>
        <List dense sx={{ mb: 2 }}>
          <ListItem>
            <ListItemText primary="Collect and store your personal information including but not limited to name, email address, IP address, and device information" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Verify your identity through various means" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Maintain records of your review submissions" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
        </List>

        <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ mt: 2 }}>
          2.3 Data Processing and Third-Party Services
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          In accordance with Philippine law, including the Data Privacy Act of 2012 (Republic Act No. 10173), we may:
        </Typography>
        <List dense sx={{ mb: 3 }}>
          <ListItem>
            <ListItemText primary="Process your personal data for verification and moderation purposes" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Share your information with third-party verification services" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Forward relevant details to concerned dealerships for legitimate business purposes" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Disclose information when required by law or court order" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
        </List>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" component="h3" gutterBottom>
          3. Review Moderation and Removal
        </Typography>

        <Typography variant="body2" sx={{ mb: 3 }}>
          We reserve the right to review, moderate, edit, or remove any submitted content. Reviews may be removed if they violate these Terms, 
          are determined to be fake or fraudulent, contain inappropriate content, or violate applicable laws.
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" component="h3" gutterBottom>
          4. Compliance with Philippine Law
        </Typography>

        <Typography variant="body2" sx={{ mb: 2 }}>
          These Terms are governed by Philippine law, including but not limited to:
        </Typography>
        <List dense sx={{ mb: 3 }}>
          <ListItem>
            <ListItemText primary="Data Privacy Act of 2012 (Republic Act No. 10173)" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Cybercrime Prevention Act of 2012 (Republic Act No. 10175)" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Consumer Act of the Philippines (Republic Act No. 7394)" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Civil Code of the Philippines" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
        </List>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" component="h3" gutterBottom>
          5. Liability Disclaimers and Review Policies
        </Typography>

        <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ mt: 2 }}>
          5.1 Limitation of Liability
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          ORCR Agad! and its operators disclaim all liability for any consequences, damages, or losses that may arise from:
        </Typography>
        <List dense sx={{ mb: 2 }}>
          <ListItem>
            <ListItemText primary="The submission, publication, or content of user reviews" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Actions taken by dealerships or third parties in response to reviews" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Any disputes arising between reviewers and dealerships" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Reliance on information contained in user reviews" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Economic, reputational, or other damages to any party" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
        </List>

        <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ mt: 2 }}>
          5.2 Review Independence Policy
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          ORCR Agad! maintains strict independence regarding user reviews:
        </Typography>
        <List dense sx={{ mb: 2 }}>
          <ListItem>
            <ListItemText primary="We do not solicit, encourage, or compensate users with money or any form of payment in exchange for reviews" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="We do not accept payment from dealerships to influence, modify, or remove reviews" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Reviews are submitted voluntarily by users based on their genuine experiences" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="All compensation arrangements, if any, are strictly prohibited and will result in review removal" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
        </List>

        <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ mt: 2 }}>
          5.3 Editorial Independence
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          User-generated content and opinions expressed in reviews:
        </Typography>
        <List dense sx={{ mb: 3 }}>
          <ListItem>
            <ListItemText primary="Do not reflect the views, opinions, or positions of ORCR Agad! or its operators" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Are solely the responsibility and liability of the individual reviewers" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Should not be considered as endorsements or recommendations by the website" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="May not represent accurate or complete information about any dealership" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
        </List>

        <Box sx={{ bgcolor: 'info.light', p: 2, borderRadius: 1, mb: 3 }}>
          <Typography variant="body2" fontWeight="bold" align="center">
            IMPORTANT: Users assume full responsibility for their reviews and any consequences thereof. 
            ORCR Agad! serves solely as a platform and does not endorse or guarantee the accuracy of user-generated content.
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" component="h3" gutterBottom>
          6. Contact Information
        </Typography>

        <Typography variant="body2" sx={{ mb: 2 }}>
          For questions about these Terms or our privacy practices, please contact us at:
        </Typography>
        
        <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 3 }}>
          <Typography variant="body2">
            <strong>ORCR Agad!</strong><br />
            Email: developer.vif@gmail.com<br />
            Address: Philippines
          </Typography>
        </Box>

        <Typography variant="h6" component="h3" gutterBottom>
          7. Acknowledgment and Consent
        </Typography>

        <Typography variant="body2" sx={{ mb: 2 }}>
          By submitting a review, you acknowledge that you have:
        </Typography>
        <List dense sx={{ mb: 3 }}>
          <ListItem>
            <ListItemText primary="Read and understood these Terms" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Agree to comply with all requirements and standards" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Consent to the collection, processing, and use of your personal data as described" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
          <ListItem>
            <ListItemText primary="Understand your rights under Philippine data privacy laws" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
        </List>

        <Box sx={{ bgcolor: 'warning.light', p: 2, borderRadius: 1, mb: 3 }}>
          <Typography variant="body2" fontWeight="bold" align="center">
            By submitting a review, you are agreeing to the above terms and conditions.
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ fontStyle: 'italic' }}>
          This document complies with Philippine data privacy and consumer protection laws. 
          For legal advice specific to your situation, please consult with a qualified Philippine attorney.
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TermsOfServiceDialog;
