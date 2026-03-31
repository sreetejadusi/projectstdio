type StreakDay = {
  date: string;
  count: number;
};

type Props = {
  days: StreakDay[];
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function levelForCount(count: number) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

function cellClass(level: number) {
  if (level === 0) {
    return "bg-[color:var(--surface)] dark:bg-[#18212b]";
  }

  if (level === 1) {
    return "bg-[#b9efc8] dark:bg-[#0f5d2a]";
  }

  if (level === 2) {
    return "bg-[#73df8f] dark:bg-[#17803a]";
  }

  if (level === 3) {
    return "bg-[#33c45b] dark:bg-[#22c55e]";
  }

  return "bg-[#179740] dark:bg-[#65e572]";
}

export function StreakHeatmap({ days }: Props) {
  const weeks: StreakDay[][] = [];

  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  const monthMarkers = weeks
    .map((week, weekIndex) => {
      const firstDay = week[0];
      if (!firstDay) return null;
      const date = new Date(`${firstDay.date}T00:00:00`);
      if (weekIndex > 0) {
        const previousDate = new Date(`${weeks[weekIndex - 1]?.[0]?.date ?? firstDay.date}T00:00:00`);
        if (previousDate.getMonth() === date.getMonth()) {
          return null;
        }
      }

      return {
        weekIndex,
        label: MONTH_LABELS[date.getMonth()],
      };
    })
    .filter((value): value is { weekIndex: number; label: string } => Boolean(value));

  return (
    <div className="space-y-5">
      <div className="overflow-x-auto">
        <div className="inline-flex min-w-full gap-2">
          <div className="flex w-12 shrink-0 flex-col justify-end gap-2 pt-8 text-xs text-[color:var(--text-secondary)]">
            {WEEKDAY_LABELS.map((label, index) => (
              <div key={label} className={`h-3 ${index % 2 === 0 ? "opacity-0" : ""}`}>
                {index % 2 === 0 ? "." : label}
              </div>
            ))}
          </div>

          <div className="flex-1">
            <div className="relative mb-3 h-5">
              {monthMarkers.map((marker) => (
                <span
                  key={`${marker.label}-${marker.weekIndex}`}
                  className="absolute text-sm font-medium text-[color:var(--text-secondary)]"
                  style={{ left: `${marker.weekIndex * 18}px` }}
                >
                  {marker.label}
                </span>
              ))}
            </div>

            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={`week-${weekIndex}`} className="flex flex-col gap-1">
                  {Array.from({ length: 7 }).map((_, dayIndex) => {
                    const day = week[dayIndex];
                    const level = day ? levelForCount(day.count) : 0;
                    return (
                      <div
                        key={day?.date ?? `${weekIndex}-${dayIndex}`}
                        className={`h-3 w-3 rounded-[4px] border border-black/5 dark:border-white/5 ${cellClass(level)}`}
                        title={day ? `${day.date}: ${day.count} solved` : ""}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 text-xs text-[color:var(--text-secondary)]">
        <p>Submission streak over the last 12 months</p>
        <div className="flex items-center gap-2">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <span
              key={level}
              className={`h-3 w-3 rounded-[4px] border border-black/5 dark:border-white/5 ${cellClass(level)}`}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
