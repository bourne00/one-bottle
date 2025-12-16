// 浏览器唯一身份 - 基于 localStorage UUID

export function getOneBottleId(): string {
  if (typeof window === 'undefined') return '';
  
  let id = localStorage.getItem('onebottle_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('onebottle_id', id);
  }
  return id;
}

// 冷静期倒计时（60秒）
const COOLDOWN_KEY = 'upload_intent_timestamp';
const COOLDOWN_DURATION = 60 * 1000; // 60秒

export function startCooldown(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
}

export function getCooldownRemaining(): number {
  if (typeof window === 'undefined') return 0;
  
  const timestamp = localStorage.getItem(COOLDOWN_KEY);
  if (!timestamp) return 0;
  
  const elapsed = Date.now() - parseInt(timestamp);
  const remaining = COOLDOWN_DURATION - elapsed;
  
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

export function clearCooldown(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(COOLDOWN_KEY);
}

// 每日浏览计数
const VIEW_COUNT_KEY = 'daily_view_count';
const VIEW_DATE_KEY = 'daily_view_date';
const MAX_DAILY_VIEWS = 10;

export function getDailyViewCount(): number {
  if (typeof window === 'undefined') return 0;
  
  const today = new Date().toISOString().split('T')[0];
  const savedDate = localStorage.getItem(VIEW_DATE_KEY);
  
  if (savedDate !== today) {
    localStorage.setItem(VIEW_DATE_KEY, today);
    localStorage.setItem(VIEW_COUNT_KEY, '0');
    return 0;
  }
  
  return parseInt(localStorage.getItem(VIEW_COUNT_KEY) || '0');
}

export function incrementViewCount(): void {
  if (typeof window === 'undefined') return;
  
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(VIEW_DATE_KEY, today);
  
  const count = getDailyViewCount();
  localStorage.setItem(VIEW_COUNT_KEY, (count + 1).toString());
}

export function canViewMore(): boolean {
  return getDailyViewCount() < MAX_DAILY_VIEWS;
}

export function getRemainingViews(): number {
  return MAX_DAILY_VIEWS - getDailyViewCount();
}

