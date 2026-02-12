import { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';
import { z } from 'zod';

import { formatDateKey, getTodayKey } from '../utils/date';
import { generateId } from '../utils/id';

export const eventIconKeys = [
  'idea',
  'instagram',
  'telegram',
  'x',
  'youtube',
  'vk',
  'compass',
  'facebook',
  'tiktok',
] as const;

export type EventIconKey = (typeof eventIconKeys)[number];

const timeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/)
  .optional();

const baseSchema = z.object({
  title: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: timeSchema,
  endTime: timeSchema,
  allDay: z.boolean(),
  color: z.string().regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/),
  icon: z.enum(eventIconKeys),
  note: z.string().max(500).optional(),
});

const refineEvent = (schema: typeof baseSchema) =>
  schema.superRefine((value, ctx) => {
    if (!value.allDay && !value.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'startTime required when not all-day',
        path: ['startTime'],
      });
    }
    if (!value.allDay && !value.endTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'endTime required when not all-day',
        path: ['endTime'],
      });
    }
    if (value.startTime && value.endTime && value.startTime > value.endTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'endTime must be after startTime',
        path: ['endTime'],
      });
    }
  });

const buildEventSchema = <T extends z.ZodRawShape>(extra: T) =>
  refineEvent(baseSchema.extend(extra));

export const calendarEventSchema = buildEventSchema({
  id: z.string().min(1),
  createdAt: z.number(),
});

export const aiCalendarEventSchema = buildEventSchema({
  id: z.string().optional(),
  createdAt: z.number().optional(),
});

export type CalendarEvent = z.infer<typeof calendarEventSchema>;
export type CalendarEventInput = Omit<CalendarEvent, 'id' | 'createdAt'> & {
  id?: string;
  createdAt?: number;
};

type CalendarStoreState = {
  events: CalendarEvent[];
  selectedDate: string;
  addEvent: (input: CalendarEventInput) => CalendarEvent;
  updateEvent: (id: string, updates: Partial<CalendarEventInput>) => CalendarEvent | null;
  removeEvent: (id: string) => void;
  setSelectedDate: (date: string) => void;
  getEventsByDate: (date: string) => CalendarEvent[];
};

const sortEvents = (entries: CalendarEvent[]) =>
  [...entries].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    if (a.allDay !== b.allDay) {
      return a.allDay ? -1 : 1;
    }
    return (a.startTime ?? '24:00').localeCompare(b.startTime ?? '24:00');
  });

const mmkv = new MMKV({ id: 'calendar-store' });

const storage: StateStorage = {
  getItem: (name) => mmkv.getString(name) ?? null,
  setItem: (name, value) => {
    mmkv.set(name, value);
  },
  removeItem: (name) => {
    mmkv.delete(name);
  },
};

export const useCalendarStore = create<CalendarStoreState>()(
  persist(
    (set, get) => ({
      events: [],
      selectedDate: getTodayKey(),
      addEvent: (input) => {
        const payload = calendarEventSchema.parse({
          ...input,
          id: input.id ?? generateId(),
          createdAt: input.createdAt ?? Date.now(),
        });
        set((state) => ({ events: sortEvents([payload, ...state.events]) }));
        return payload;
      },
      updateEvent: (id, updates) => {
        const existing = get().events.find((event) => event.id === id);
        if (!existing) {
          return null;
        }
        const payload = calendarEventSchema.parse({ ...existing, ...updates });
        set((state) => ({
          events: sortEvents(state.events.map((event) => (event.id === id ? payload : event))),
        }));
        return payload;
      },
      removeEvent: (id) => {
        set((state) => ({ events: state.events.filter((event) => event.id !== id) }));
      },
      setSelectedDate: (date) => {
        set({ selectedDate: date });
      },
      getEventsByDate: (date) => get().events.filter((event) => event.date === date),
    }),
    {
      name: 'calendar-store',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({ events: state.events, selectedDate: state.selectedDate }),
    },
  ),
);
