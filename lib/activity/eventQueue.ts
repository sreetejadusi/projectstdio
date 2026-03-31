import type { ActivityEvent } from "@/lib/activity/activityTracker";

export function enqueueActivityEvent(
  queue: ActivityEvent[],
  event: ActivityEvent,
) {
  return [...queue, event];
}

export function removeFlushedEvents(
  queue: ActivityEvent[],
  flushedCount: number,
) {
  if (flushedCount <= 0) {
    return queue;
  }

  return queue.slice(flushedCount);
}
