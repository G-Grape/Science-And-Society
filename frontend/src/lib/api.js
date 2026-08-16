// Central API base URL - reads from environment variable so it works in both dev and production.
// In development: defaults to http://localhost:3001
// In production: set VITE_API_URL in your .env file to your deployed backend URL
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

import { supabase } from './supabase';

export async function sendNotification(endpoint, body) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const headers = { 'Content-Type': 'application/json' };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    
    return await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
  } catch (err) {
    console.error('Notification Error:', err);
    return null;
  }
}
