import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useRealtime } from "./RealtimeProvider";
import { formatEvent } from "./notification-format";

export function RealtimeToaster() {
  const navigate = useNavigate();

  useRealtime((event, meta) => {
    if (meta.replay) return;
    const fmt = formatEvent(event);
    const opts = {
      description: fmt.body,
      action: fmt.href
        ? {
            label: "Ver",
            onClick: () => navigate(fmt.href!),
          }
        : undefined,
    };
    switch (fmt.tone) {
      case "error":
        toast.error(fmt.title, opts);
        break;
      case "warning":
        toast.warning(fmt.title, opts);
        break;
      case "success":
        toast.success(fmt.title, opts);
        break;
      default:
        toast.info(fmt.title, opts);
    }
  }, []);

  return null;
}
