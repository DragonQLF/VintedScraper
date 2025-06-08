import React from 'react';
import WebhookConfig from '../components/WebhookConfig';
import { Container, Box, Typography } from '@mui/material';

const WebhookConfigPage: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Box>
        <Typography variant="h4" fontWeight="bold" mb={4}>
          Configuration
        </Typography>
        <WebhookConfig />
      </Box>
    </Container>
  );
};

export default WebhookConfigPage; 