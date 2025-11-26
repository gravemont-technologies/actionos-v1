import type { VercelRequest, VercelResponse } from 'vercel';
import { z } from 'zod';

import { getSupabaseClient } from './lib/supabase';
import { validateEnvVars } from './lib/validateEnvVars';
// ...existing code...

const statsSchema = z.object({
  profile_id: z.string().min(1).max(100).trim(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    validateEnvVars(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  } catch (e) {
    return res.status(500).json({ error: 'Missing environment variables', details: (e as Error).message });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parsed = statsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.message });
  }

  // Minimal business logic: return basic stats for the profile
  const supabase = getSupabaseClient();
  const { profile_id } = parsed.data;
  // Count completed feedback records
  const { count } = await supabase
    .from('feedback_records')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profile_id);
  const completed = typeof count === 'number' ? count : 0;
  // Mock streak logic: streak = completed % 5
  const streak = completed % 5;
  // Mock totalDeltaIpp: sum of all slider values
  const { data: feedbacks } = await supabase
    .from('feedback_records')
    .select('slider')
    .eq('profile_id', profile_id);
  const safeFeedbacks = Array.isArray(feedbacks) ? feedbacks : [];
  const totalDeltaIpp = safeFeedbacks.reduce((sum, f) => sum + (f.slider || 0), 0);
  return res.status(200).json({
    completed,
    streak,
    totalDeltaIpp,
  });
}
