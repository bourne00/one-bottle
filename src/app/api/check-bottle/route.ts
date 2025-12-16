import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const { owner_id } = await request.json();

    if (!owner_id) {
      return NextResponse.json({ hasBottle: false });
    }

    const { data } = await supabase
      .from('bottles')
      .select('id, status')
      .eq('owner_id', owner_id)
      .single();

    return NextResponse.json({
      hasBottle: !!data,
      status: data?.status || null,
    });

  } catch (error) {
    return NextResponse.json({ hasBottle: false });
  }
}

