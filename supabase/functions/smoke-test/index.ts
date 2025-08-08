// Follow this setup guide …
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

// ⚠️ IMPORTANT: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
//   in your .env.local so the function can connect.
serve(async (req) => {
  const url = new URL(req.url);
  const profile =
url.searchParams.get('profile') ?? '11111111-1111-1111-1111-111111111111';
  const audience = url.searchParams.get('audience') ?? 'slack';
  const purpose = url.searchParams.get('purpose') ?? 'display';

  const supabase = createClient(
Deno.env.get('SUPABASE_URL')!,
Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data, error } = await supabase.rpc('resolve_name', {
p_profile: profile,
p_audience: audience,
p_purpose: purpose,
  });

  if (error) {
return new Response(JSON.stringify({ error }), {
  status: 500,
  headers: { 'Content-Type': 'application/json' },
});
  }

  return new Response(JSON.stringify({ result: data }), {
headers: { 'Content-Type': 'application/json' },
  });
});
