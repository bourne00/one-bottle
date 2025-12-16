import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// 上传截止时间：2026-01-01 00:00:00 PST (UTC-8)
const DEADLINE = new Date('2026-01-01T08:00:00.000Z');

export async function POST(request: NextRequest) {
  try {
    // 检查截止时间
    if (new Date() >= DEADLINE) {
      return NextResponse.json(
        { error: '上传已截止，时光胶囊已封存' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const ownerId = formData.get('owner_id') as string;

    if (!file || !ownerId) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 检查是否已上传过（一次性封印）
    const { data: existing } = await supabase
      .from('bottles')
      .select('id')
      .eq('owner_id', ownerId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: '你已经投放过瓶子了，每人仅一次机会' },
        { status: 403 }
      );
    }

    // 验证文件类型
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: '仅支持图片或视频文件' },
        { status: 400 }
      );
    }

    // 验证文件大小（50MB）
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: '文件大小不能超过 50MB' },
        { status: 400 }
      );
    }

    // 上传文件到 Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${ownerId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('bottles')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: '文件上传失败' },
        { status: 500 }
      );
    }

    // 获取公开 URL
    const { data: urlData } = supabase.storage
      .from('bottles')
      .getPublicUrl(fileName);

    // 保存到数据库（状态为 approved，简化审核流程）
    const { error: dbError } = await supabase.from('bottles').insert({
      owner_id: ownerId,
      content_url: urlData.publicUrl,
      content_type: isVideo ? 'video' : 'image',
      status: 'approved',
      created_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: '保存失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Upload handler error:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

