/**
 * SVG icons via Lucide (reliable rendering; avoids Material Symbols ligature issues).
 */
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Archive,
  ArrowDownWideNarrow,
  ArrowRight,
  BarChart3,
  Bell,
  Brain,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  CircleCheckBig,
  CircleHelp,
  Download,
  History,
  Info,
  LayoutGrid,
  Lightbulb,
  LineChart,
  Layers,
  ListFilter,
  Map,
  MapPin,
  MessageCircle,
  Play,
  RefreshCw,
  ScrollText,
  Search,
  Send,
  Settings,
  Share2,
  Sparkles,
  Table2,
  ZoomIn,
  ZoomOut,
  Zap,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  check: Check,
  analytics: BarChart3,
  architecture: Building2,
  request_quote: ClipboardList,
  description: ScrollText,
  chevron_right: ChevronRight,
  share: Share2,
  play_arrow: Play,
  layers: Layers,
  warning: AlertTriangle,
  psychology: Brain,
  auto_awesome: Sparkles,
  map: Map,
  location_on: MapPin,
  chat_bubble: MessageCircle,
  filter_list: ListFilter,
  sort: ArrowDownWideNarrow,
  grid_view: LayoutGrid,
  arrow_forward: ArrowRight,
  insights: LineChart,
  zoom_in: ZoomIn,
  zoom_out: ZoomOut,
  download: Download,
  refresh: RefreshCw,
  table_chart: Table2,
  info: Info,
  send: Send,
  report_problem: AlertTriangle,
  check_circle: CircleCheckBig,
  expand_more: ChevronDown,
  lightbulb: Lightbulb,
  notifications: Bell,
  settings: Settings,
  bolt: Zap,
  help: CircleHelp,
  archive: Archive,
  history: History,
  search: Search,
};

const PX = {
  xs: 16,
  sm: 18,
  md: 20,
  lg: 22,
  xl: 24,
  "2xl": 28,
  "3xl": 32,
  "4xl": 40,
  "5xl": 52,
  "6xl": 64,
} as const;

export function Icon({
  name,
  size = "md",
  className = "",
}: {
  name: string;
  size?: keyof typeof PX;
  className?: string;
}) {
  const Cmp = MAP[name];
  const px = PX[size];

  if (!Cmp) {
    return (
      <CircleHelp
        size={px}
        strokeWidth={1.65}
        className={`shrink-0 opacity-50 ${className}`}
        aria-hidden
      />
    );
  }

  return (
    <Cmp
      size={px}
      strokeWidth={1.65}
      className={`shrink-0 ${className}`}
      aria-hidden
    />
  );
}
