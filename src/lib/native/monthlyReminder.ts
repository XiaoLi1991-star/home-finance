export interface MonthlyReminderSupport {
  supported: false
  reason: string
  followUp: string
}

export function getMonthlyReminderSupport(): MonthlyReminderSupport {
  return {
    supported: false,
    reason: '当前 v2 未引入本地通知原生插件，避免在发布前增加未经验证的 Android 权限和依赖。',
    followUp: '后续可接入 @capacitor/local-notifications，再实现每月固定日期提醒。'
  }
}
