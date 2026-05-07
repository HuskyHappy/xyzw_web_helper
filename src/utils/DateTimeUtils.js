/**
 * 根据传入的时间格式字符串，返回当前时间对应的格式化结果
 * @param {string} format - 时间格式字符串（如"yyyy-MM-dd"、"HH:mm:ss"、"yyyy-MM-dd HH:mm:ss"）
 * @returns {string} 当前时间按指定格式生成的字符串（格式非法/空则返回默认格式：yyyy-MM-dd HH:mm:ss）
 * 支持的占位符：
 * yyyy - 4位年份 | MM - 2位月份（补0） | dd - 2位日期（补0）
 * HH - 24小时制小时（补0） | mm - 2位分钟（补0） | ss - 2位秒数（补0）
 */
 export function getCurrentTimeByFormat(format) {
  // 第一步：处理参数默认值（格式为空/非字符串时，用默认格式）
  const defaultFormat = "yyyy-MM-dd HH:mm:ss";
  if (typeof format !== 'string' || format.trim() === '') {
      format = defaultFormat;
  }
  format = format.trim();

  // 第二步：获取当前时间的所有部分（补零处理）
  const now = new Date();
  const year = now.getFullYear(); // 4位年
  const month = String(now.getMonth() + 1).padStart(2, '0'); // 月份从0开始，补0到2位
  const day = String(now.getDate()).padStart(2, '0'); // 日期补0
  const hour = String(now.getHours()).padStart(2, '0'); // 24小时制，补0
  const minute = String(now.getMinutes()).padStart(2, '0'); // 分钟补0
  const second = String(now.getSeconds()).padStart(2, '0'); // 秒数补0

  // 第三步：替换格式中的占位符
  let result = format
      .replace(/yyyy/g, year)
      .replace(/MM/g, month)
      .replace(/dd/g, day)
      .replace(/HH/g, hour)
      .replace(/mm/g, minute)
      .replace(/ss/g, second);

  return result;
}

// ==================== 活动周期工具 ====================

// 活动周期起始时间: 2025-12-12 12:00:00 (黑市周开始)
const ACTIVITY_CYCLE_START = new Date("2025-12-12T12:00:00").getTime();
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const ACTIVITY_CYCLE_MS = 3 * WEEK_MS; // 3周一循环

/**
 * 获取当前活动周类型
 * @returns {"黑市周"|"招募周"|"宝箱周"|null}
 */
export function getActivityWeek() {
  const elapsed = Date.now() - ACTIVITY_CYCLE_START;
  if (elapsed < 0) return null;
  const cyclePos = elapsed % ACTIVITY_CYCLE_MS;
  if (cyclePos < WEEK_MS) return "黑市周";
  if (cyclePos < 2 * WEEK_MS) return "招募周";
  return "宝箱周";
}

/**
 * 判断当前是否为黑市周
 * @returns {boolean}
 */
export function isBlackMarketWeek() {
  return getActivityWeek() === "黑市周";
}