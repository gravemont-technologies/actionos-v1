import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyRequest } from '../_lib/verify';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = await verifyRequest(req);
    
    // Check if profile already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('profile_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return res.json({ 
        profileId: existing.profile_id,
        created: false,
        message: 'Profile already exists' 
      });
    }

    // Generate 16-char lowercase hex for profile_id (matches DB constraint)
    let profileId = randomBytes(8).toString('hex');
    const isValidProfileId = /^[a-f0-9]{16,}$/.test(profileId);
    if (!isValidProfileId) {
      console.error('[auth/create-profile] Generated invalid profile_id:', profileId);
      return res.status(500).json({ error: 'PROFILE_ID_INVALID', detail: 'Generated profile_id does not match DB constraint' });
    }
    console.log('[auth/create-profile] Attempting profile_id:', profileId);
    
    // Retry logic for handling rare race conditions
    const maxRetries = 3;
    let attempt = 0;
    let profile = null;
    let insertError = null;

    while (attempt < maxRetries) {
      const { data, error } = await supabase
        .from('profiles')
        .insert({ 
          profile_id: profileId,
          user_id: userId 
        })
        .select('profile_id')
        .single();
      if (error && error.message && error.message.includes('profile_id')) {
        console.error('[auth/create-profile] Insert failed due to profile_id constraint:', profileId, error.message);
      }

      if (!error) {
        profile = data;
        break;
      }

      // Handle unique constraint violation - profile might have been created concurrently
      if (error.code === '23505') {
        console.warn(`[auth/create-profile] Conflict on attempt ${attempt + 1}, retrying...`);
        
        // Re-check if profile exists now
        const { data: recheck } = await supabase
          .from('profiles')
          .select('profile_id')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (recheck) {
          return res.json({
            profileId: recheck.profile_id,
            created: false,
            message: 'Profile already exists (created concurrently)'
          });
        }
        
        // Generate new 16-char hex for next retry attempt
        profileId = randomBytes(8).toString('hex');
        if (!/^[a-f0-9]{16,}$/.test(profileId)) {
          console.error('[auth/create-profile] Retry generated invalid profile_id:', profileId);
          return res.status(500).json({ error: 'PROFILE_ID_INVALID', detail: 'Retry generated profile_id does not match DB constraint' });
        }
        console.log('[auth/create-profile] Retry attempt profile_id:', profileId);
      }

      insertError = error;
      attempt++;
      
      // Exponential backoff: 50ms, 100ms, 200ms
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 50 * Math.pow(2, attempt - 1)));
      }
    }

    if (!profile) {
      console.error('[auth/create-profile] Insert failed after retries:', insertError);
      return res.status(500).json({ 
        error: 'PROFILE_CREATE_FAILED',
        detail: insertError?.message || 'Unknown error after retries'
      });
    }

    return res.status(201).json({
      profileId: profile.profile_id,
      created: true,
      message: 'Profile created successfully'
    });
  } catch (err: any) {
    console.error('[auth/create-profile] Auth error:', err.message);
    return res.status(401).json({ 
      error: err.message || 'Unauthorized',
      code: err.code || 'AUTH_FAILED' 
    });
  }
}
