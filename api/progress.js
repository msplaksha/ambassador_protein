const { createClient } = require('@supabase/supabase-js');

// Environment variables configured in Vercel project settings
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const TEACHER_KEY = process.env.TEACHER_KEY || 'biology2026';

let supabaseClient = null;
function getClient() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.');
  }
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false }
    });
  }
  return supabaseClient;
}

module.exports = async function handler(req, res) {
  // Allow requests from same origin and set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const supabase = getClient();

    // --- GET Requests ---
    if (req.method === 'GET') {
      const { action, id, key } = req.query;

      // 1. Student resuming progress on another device
      if (action === 'get') {
        if (!id) return res.status(400).json({ ok: false, error: 'Missing id parameter' });

        const { data, error } = await supabase
          .from('students')
          .select('doc')
          .eq('id', String(id))
          .maybeSingle();

        if (error) throw error;
        if (!data || !data.doc) return res.status(200).json({ ok: false });
        return res.status(200).json({ ok: true, doc: data.doc });
      }

      // 2. Teacher view loading roster
      if (action === 'list') {
        if (!key || key !== TEACHER_KEY) {
          return res.status(200).json({ ok: false, error: 'Invalid teacher key' });
        }

        const { data, error } = await supabase
          .from('students')
          .select('id, doc')
          .order('last_active', { ascending: false });

        if (error) throw error;
        return res.status(200).json({ ok: true, students: data || [] });
      }

      return res.status(200).json({ ok: true, service: 'ai-era-biology-supabase' });
    }

    // --- POST Requests ---
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { /* ignore parse error */ }
      }

      if (!body || typeof body !== 'object') {
        return res.status(400).json({ ok: false, error: 'Invalid request body' });
      }

      // 1. Save student progress
      if (body.action === 'save') {
        const id = String(body.id || '').trim().slice(0, 80);
        if (!id) return res.status(400).json({ ok: false, error: 'Missing student id' });

        const summary = body.summary || {};
        const now = new Date().toISOString();

        const payload = {
          id: id,
          name: body.name || '',
          section: body.section || '',
          joined_at: body.joinedAt || now,
          last_active: body.lastActive || now,
          activities_done: summary.activities_done != null ? summary.activities_done : 0,
          questions_answered: summary.questions_answered != null ? summary.questions_answered : 0,
          correct_first_try: summary.correct_first_try != null ? summary.correct_first_try : 0,
          summary: summary,
          doc: body.doc || {}
        };

        const { error } = await supabase
          .from('students')
          .upsert(payload, { onConflict: 'id' });

        if (error) throw error;
        return res.status(200).json({ ok: true });
      }

      // 2. Teacher deleting student records
      if (body.action === 'remove') {
        if (!body.key || body.key !== TEACHER_KEY) {
          return res.status(403).json({ ok: false, error: 'Invalid teacher key' });
        }

        const ids = body.ids || [];
        if (Array.isArray(ids) && ids.length > 0) {
          const { error } = await supabase
            .from('students')
            .delete()
            .in('id', ids);

          if (error) throw error;
        }
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ ok: false, error: 'Unknown action' });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ ok: false, error: err.message || 'Internal error' });
  }
};
