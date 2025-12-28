export function formatPeriod(dateStr: string, period: string): string {
  if (!dateStr) return '';

  const locale = 'default'; // Or get from i18n if available

  if (period === 'daily') {
    // Expects YYYY-MM-DD
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
  }

  if (period === 'monthly') {
    // Expects YYYY-MM
    const [year, month] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(date);
  }

  if (period === 'weekly') {
    // Expects YYYY-WW
    // SQLite %W is 00-53.
    const [yearStr, weekStr] = dateStr.split('-');
    const year = parseInt(yearStr);
    const week = parseInt(weekStr);

    // Simple fallback: "Week X, YYYY"
    // Calculating exact date from ISO week is complex without a library like date-fns or moment,
    // but we can approximate or just show readable text.
    // "Week 47, 2025" is quite informative.
    // Or we can try to calculate start of week.
    
    // Let's stick to "Week X, YYYY" for simplicity and safety unless we want to do the math.
    // The user specifically complained about "2025-47". "Week 47, 2025" is better.
    return `Week ${week}, ${year}`;
  }

  return dateStr;
}
