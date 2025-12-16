import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const { viewer_id } = await request.json();

    if (!viewer_id) {
      return NextResponse.json(
        { error: '缺少身份标识' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // 检查今日浏览次数
    const { count } = await supabase
      .from('views')
      .select('*', { count: 'exact', head: true })
      .eq('viewer_id', viewer_id)
      .eq('viewed_at', today);

    if ((count || 0) >= 10) {
      return NextResponse.json(
        { error: '今日浏览次数已用完，明天再来吧', remaining: 0 },
        { status: 429 }
      );
    }

    // 获取已浏览的瓶子 ID
    const { data: viewedData } = await supabase
      .from('views')
      .select('bottle_id')
      .eq('viewer_id', viewer_id);

    const viewedIds = viewedData?.map(v => v.bottle_id) || [];

    // 查询随机瓶子（排除自己的和已看过的）
    let query = supabase
      .from('bottles')
      .select('id, content_url, content_type, created_at')
      .eq('status', 'approved')
      .neq('owner_id', viewer_id);

    if (viewedIds.length > 0) {
      query = query.not('id', 'in', `(${viewedIds.join(',')})`);
    }

    const { data: bottles } = await query;

    if (!bottles || bottles.length === 0) {
      return NextResponse.json({
        bottle: null,
        remaining: 10 - (count || 0),
        message: '暂时没有新的瓶子了',
      });
    }

    // 随机选择一个
    const randomIndex = Math.floor(Math.random() * bottles.length);
    const bottle = bottles[randomIndex];

    // 记录浏览
    await supabase.from('views').insert({
      viewer_id,
      bottle_id: bottle.id,
      viewed_at: today,
    });

    return NextResponse.json({
      bottle: {
        id: bottle.id,
        content_url: bottle.content_url,
        content_type: bottle.content_type,
      },
      remaining: 10 - (count || 0) - 1,
    });

  } catch (error) {
    console.error('Random bottle error:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

