import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Alert, Paper } from '@mui/material';
import axios from '../utils/axios';

const WebhookConfig: React.FC = () => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchWebhookUrl();
  }, []);

  const fetchWebhookUrl = async () => {
    try {
      const response = await axios.get('/api/auth/webhook-url');
      setWebhookUrl(response.data.webhookUrl);
    } catch (error) {
      console.error('Error fetching webhook URL:', error);
      setError('Failed to fetch webhook URL');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await axios.put('/api/auth/webhook-url', { webhookUrl });
      setSuccess('Webhook URL updated successfully');
    } catch (error) {
      console.error('Error updating webhook URL:', error);
      setError('Failed to update webhook URL');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4, border: 1, borderColor: 'divider', bgcolor: 'background.paper', boxShadow: 2 }}>
      <Typography variant="h5" gutterBottom>
        Discord Webhook Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure the Discord webhook URL for notifications. This URL will be used to send notifications about new items.
      </Typography>

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Discord Webhook URL"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          margin="normal"
          variant="outlined"
          placeholder="https://discord.com/api/webhooks/..."
          required
        />

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default WebhookConfig; 