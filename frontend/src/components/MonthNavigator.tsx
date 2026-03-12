import { ChevronLeftIcon, ChevronRightIcon } from "./Icons";
import { formatMonthLabel, shiftMonth } from "../utils/formatters";

type MonthNavigatorProps = {
  month: string;
  onChange: (month: string) => void;
  className?: string;
};

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export default function MonthNavigator({ month, onChange, className }: MonthNavigatorProps) {
  return (
    <div className={cn("inline-flex items-center gap-1.5 text-foreground", className)}>
      <button
        type="button"
        aria-label="Mês anterior"
        className="inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => onChange(shiftMonth(month, -1))}
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>
      <span className="min-w-[8rem] text-center text-sm font-medium capitalize">{formatMonthLabel(month)}</span>
      <button
        type="button"
        aria-label="Próximo mês"
        className="inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => onChange(shiftMonth(month, 1))}
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
