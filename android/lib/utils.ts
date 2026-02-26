import type { MoodEntry, User } from '@/lib/store';

const moodColors: Record<number, string> = {
  1: '#f7768e',
  2: '#ff9e64',
  3: '#e0af68',
  4: '#d5c490',
  5: '#c6cda0',
  6: '#b0d4a0',
  7: '#9ece6a',
  8: '#73daca',
  9: '#7dcfff',
  10: '#7aa2f7',
};

export function moodColor(value: number): string {
  return moodColors[value] ?? '#565f89';
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatTime12h(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const ap = h < 12 ? 'AM' : 'PM';
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${pad2(m)} ${ap}`;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isYesterday(date: Date, now: Date): boolean {
  const yesterday = new Date(now.getTime());
  yesterday.setDate(now.getDate() - 1);
  return sameDay(date, yesterday);
}

function daysAgo(date: Date, now: Date): number {
  return (now.getTime() - date.getTime()) / 86400000;
}

export function formatRelativeTime(isoStr: string): string {
  const date = new Date(isoStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffM = diffMs / 60000;
  const diffH = diffM / 60;

  if (diffM < 1) return 'just now';
  if (diffH < 1) return `${Math.floor(diffM)}m ago`;
  if (sameDay(date, now) && diffH < 12) return `${Math.floor(diffH)}h ago`;
  if (sameDay(date, now)) return `Today at ${formatTime12h(date)}`;
  if (isYesterday(date, now)) return `Yesterday at ${formatTime12h(date)}`;
  if (daysAgo(date, now) < 7) return `${dayNames[date.getDay()]} at ${formatTime12h(date)}`;
  if (date.getFullYear() === now.getFullYear())
    return `${monthNames[date.getMonth()]} ${date.getDate()}`;
  return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function dateKey(isoStr: string): string {
  const d = new Date(isoStr);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function dateLabel(isoStr: string): string {
  const date = new Date(isoStr);
  const now = new Date();

  if (sameDay(date, now)) return 'Today';
  if (isYesterday(date, now)) return 'Yesterday';
  if (daysAgo(date, now) < 7)
    return `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}`;
  if (date.getFullYear() === now.getFullYear())
    return `${monthNames[date.getMonth()]} ${date.getDate()}`;
  return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export type ListItem =
  | { type: 'divider'; key: string; label: string }
  | { type: 'entry'; key: string; entry: MoodEntry; mine: boolean; user?: User };

export function buildListItems(
  edges: { cursor: string; node: MoodEntry }[],
  currentUserId: string | null,
  usersById: Record<string, User>,
): ListItem[] {
  const items: ListItem[] = [];
  edges.forEach((edge, idx) => {
    const curDate = dateKey(edge.node.createdAt);
    const prevDate = idx > 0 ? dateKey(edges[idx - 1].node.createdAt) : null;
    if (idx === 0 || curDate !== prevDate) {
      items.push({
        type: 'divider',
        key: `d-${curDate}`,
        label: dateLabel(edge.node.createdAt),
      });
    }
    const mine = edge.node.user?.id === currentUserId;
    items.push({
      type: 'entry',
      key: edge.node.id,
      entry: edge.node,
      mine,
      user: edge.node.user?.id ? usersById[edge.node.user.id] : undefined,
    });
  });
  return items;
}
