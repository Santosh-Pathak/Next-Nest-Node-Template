import dayjs from 'dayjs';

export function formatDateTime(date: Date): string {
  return dayjs(date).format('YYYY-MM-DD hh:mma').toLowerCase();
}

export function formatDate(date: Date): string {
  return dayjs(date).format('YYYY-MM-DD');
}

export function formatTime(date: Date): string {
  return dayjs(date).format('hh:mm:ss A');
}

// Using any to accept various date formats (string, number, Date)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isValidDate(date: any): boolean {
  return dayjs(date).isValid();
}

export function addDays(date: Date, days: number): Date {
  return dayjs(date).add(days, 'day').toDate();
}

export function subtractDays(date: Date, days: number): Date {
  return dayjs(date).subtract(days, 'day').toDate();
}

export function getDaysDifference(date1: Date, date2: Date): number {
  return dayjs(date1).diff(dayjs(date2), 'day');
}
