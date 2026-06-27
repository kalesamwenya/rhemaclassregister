import axios from 'axios';

/**
 * RHEMA ATTENDANCE API CONFIGURATION
 *
 * We use HTTPS for production to avoid method-stripping redirects.
 */

const api = axios.create({
  baseURL: 'https://darkslategrey-goldfish-293517.hostingersite.com',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export default api;
