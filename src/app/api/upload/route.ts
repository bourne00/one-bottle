import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Sightengine API 配置
const SIGHTENGINE_API_USER = process.env.SIGHTENGINE_API_USER || '';
const SIGHTENGINE_API_SECRET = process.env.SIGHTENGINE_API_SECRET || '';

// 上传截止时间：2026-01-01 00:00:00 PST (UTC-8)
const DEADLINE = new Date('2026-01-01T08:00:00.000Z');

// 内容审核函数
async function moderateContent(url: string, isVideo: boolean): Promise<{ safe: boolean; reason?: string }> {
  // 如果没有配置 Sightengine，跳过审核（开发环境）
  if (!SIGHTENGINE_API_USER || !SIGHTENGINE_API_SECRET) {
    console.warn('Sightengine not configured, skipping moderation');
    return { safe: true };
  }

  try {
    // 审核模型：nudity（色情）、wad（武器/酒精/毒品）、gore（血腥暴力）、offensive（冒犯性内容）
    const models = 'nudity,wad,gore,offensive';
    
    let apiUrl: string;
    let body: URLSearchParams;

    if (isVideo) {
      // 视频审核（同步模式，适用于短视频）
      apiUrl = 'https://api.sightengine.com/1.0/video/check-sync.json';
      body = new URLSearchParams({
        api_user: SIGHTENGINE_API_USER,
        api_secret: SIGHTENGINE_API_SECRET,
        models: models,
        url: url,
      });
    } else {
      // 图片审核
      apiUrl = 'https://api.sightengine.com/1.0/check.json';
      body = new URLSearchParams({
        api_user: SIGHTENGINE_API_USER,
        api_secret: SIGHTENGINE_API_SECRET,
        models: models,
        url: url,
      });
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const result = await response.json();

    if (result.status !== 'success') {
      console.error('Moderation API error:', result);
      // API 错误时，保守起见标记为待审核
      return { safe: false, reason: 'Moderation service error' };
    }

    // 检查图片审核结果
    if (!isVideo) {
      // 色情内容检测
      if (result.nudity) {
        const nudityScore = Math.max(
          result.nudity.sexual_activity || 0,
          result.nudity.sexual_display || 0,
          result.nudity.erotica || 0,
          result.nudity.very_suggestive || 0,
          result.nudity.suggestive || 0,
        );
        if (nudityScore > 0.5) {
          return { safe: false, reason: 'Nudity or sexual content detected' };
        }
      }

      // 武器/酒精/毒品检测
      if (result.weapon && result.weapon > 0.7) {
        return { safe: false, reason: 'Weapon detected' };
      }
      if (result.drugs && result.drugs > 0.7) {
        return { safe: false, reason: 'Drugs detected' };
      }

      // 血腥暴力检测
      if (result.gore && result.gore.prob > 0.5) {
        return { safe: false, reason: 'Gore or violence detected' };
      }

      // 冒犯性内容检测
      if (result.offensive && result.offensive.prob > 0.7) {
        return { safe: false, reason: 'Offensive content detected' };
      }
    } else {
      // 视频审核结果（检查所有帧）
      if (result.data && result.data.frames) {
        for (const frame of result.data.frames) {
          // 色情内容
          if (frame.nudity) {
            const nudityScore = Math.max(
              frame.nudity.sexual_activity || 0,
              frame.nudity.sexual_display || 0,
              frame.nudity.erotica || 0,
              frame.nudity.very_suggestive || 0,
            );
            if (nudityScore > 0.5) {
              return { safe: false, reason: 'Nudity or sexual content detected in video' };
            }
          }

          // 血腥暴力
          if (frame.gore && frame.gore.prob > 0.5) {
            return { safe: false, reason: 'Gore or violence detected in video' };
          }

          // 武器
          if (frame.weapon && frame.weapon > 0.7) {
            return { safe: false, reason: 'Weapon detected in video' };
          }
        }
      }
    }

    return { safe: true };

  } catch (error) {
    console.error('Moderation error:', error);
    // 出错时保守处理，标记为待审核
    return { safe: false, reason: 'Moderation check failed' };
  }
}

export async function POST(request: NextRequest) {
  try {
    // 检查截止时间
    if (new Date() >= DEADLINE) {
      return NextResponse.json(
        { error: 'Uploads have ended. The time capsule is now sealed.' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const ownerId = formData.get('owner_id') as string;

    if (!file || !ownerId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
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
        { error: 'You have already left your bottle. One chance only.' },
        { status: 403 }
      );
    }

    // 验证文件类型
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: 'Only images and videos are allowed' },
        { status: 400 }
      );
    }

    // 验证文件大小（50MB）
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size cannot exceed 50MB' },
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
        { error: 'File upload failed' },
        { status: 500 }
      );
    }

    // 获取公开 URL
    const { data: urlData } = supabase.storage
      .from('bottles')
      .getPublicUrl(fileName);

    const contentUrl = urlData.publicUrl;

    // 🛡️ 内容审核
    const moderation = await moderateContent(contentUrl, isVideo);

    if (!moderation.safe) {
      // 删除违规文件
      await supabase.storage.from('bottles').remove([fileName]);
      
      console.log(`Content rejected: ${moderation.reason}`);
      
      return NextResponse.json(
        { error: 'Your content did not pass moderation. Please ensure it follows community guidelines.' },
        { status: 403 }
      );
    }

    // 保存到数据库
    const { error: dbError } = await supabase.from('bottles').insert({
      owner_id: ownerId,
      content_url: contentUrl,
      content_type: isVideo ? 'video' : 'image',
      status: 'approved',
      created_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error('Database error:', dbError);
      // 删除已上传的文件
      await supabase.storage.from('bottles').remove([fileName]);
      return NextResponse.json(
        { error: 'Failed to save' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Upload handler error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
