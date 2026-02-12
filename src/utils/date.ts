export const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseDateKey = (value: string): Date | null => {
  if (!value) {
    return null;
  }
  const [year, month, day] = value.split('-').map(Number);
  if ([year, month, day].some((part) => Number.isNaN(part))) {
    return null;
  }
  return new Date(year, (month ?? 1) - 1, day ?? 1);
};

export const getTodayKey = () => formatDateKey(new Date());

export const addDays = (date: Date, amount: number) => {
  const clone = new Date(date);
  clone.setDate(clone.getDate() + amount);
  return clone;
};

export const formatMonthLabel = (date: Date, locale = 'en-US') =>
  date.toLocaleString(locale, { month: 'long', year: 'numeric' });

export const toDisplayDate = (dateKey: string, locale = 'en-US') => {
  const date = parseDateKey(dateKey);
  if (!date) {
    return dateKey;
  }
  return date.toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' });
};

export type CalendarGridDay = {
  key: string;
  label: string;
  dateKey: string;
  isCurrentMonth: boolean;
  isToday: boolean;
};

export const buildMonthMatrix = (visibleDate: Date): CalendarGridDay[][] => {
  const year = visibleDate.getFullYear();
  const month = visibleDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const firstWeekDay = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previousMonthDays = new Date(year, month, 0).getDate();

  const cells: CalendarGridDay[] = [];

  for (let index = firstWeekDay - 1; index >= 0; index -= 1) {
    const dayOfMonth = previousMonthDays - index;
    const date = new Date(year, month - 1, dayOfMonth);
    const dateKey = formatDateKey(date);
    cells.push({
      key: `prev-${dateKey}`,
      label: `${dayOfMonth}`,
      dateKey,
      isCurrentMonth: false,
      isToday: dateKey === getTodayKey(),
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const dateKey = formatDateKey(date);
    cells.push({
      key: `current-${dateKey}`,
      label: `${day}`,
      dateKey,
      isCurrentMonth: true,
      isToday: dateKey === getTodayKey(),
    });
  }

  while (cells.length < 42) {
    const lastCell = cells[cells.length - 1];
    const lastDate = parseDateKey(lastCell?.dateKey ?? formatDateKey(visibleDate)) ?? visibleDate;
    const nextDate = addDays(lastDate, 1);
    const dateKey = formatDateKey(nextDate);
    cells.push({
      key: `next-${dateKey}`,
      label: `${nextDate.getDate()}`,
      dateKey,
      isCurrentMonth: false,
      isToday: dateKey === getTodayKey(),
    });
  }

  const rows: CalendarGridDay[][] = [];
  for (let start = 0; start < cells.length; start += 7) {
    rows.push(cells.slice(start, start + 7));
  }
  return rows.slice(0, 6);
};

export const getWeekdayLabels = (locale = 'en-US') => {
  const referenceDate = new Date(Date.UTC(2023, 0, 1));
  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(referenceDate);
    date.setDate(referenceDate.getDate() + index);
    return date.toLocaleDateString(locale, { weekday: 'short' });
  });
};
