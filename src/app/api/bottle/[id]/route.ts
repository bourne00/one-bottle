import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: bottle } = await supabase
      .from('bottles')
      .select('id, content_url, content_type, created_at')
      .eq('id', params.id)
      .eq('status', 'approved')
      .single();

    if (!bottle) {
      return NextResponse.json(
        { error: '瓶子不存在' },
        { status: 404 }
      );
    }

    // 不返回 owner_id，保护隐私
    return NextResponse.json({ bottle });

  } catch (error) {
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

