import type {
  GeneratorCategoryAlert,
  ProjectedCategoryAlert,
  StorageLimitAlert,
} from "./domain";

export interface RealtimeEventBase {
  id: string;
  ts: string;
  generator_id: number;
}

export type RealtimeEvent =
  | (RealtimeEventBase & {
      kind: "alert.category.created";
      payload: GeneratorCategoryAlert;
    })
  | (RealtimeEventBase & {
      kind: "alert.category.projected.created";
      payload: ProjectedCategoryAlert;
    })
  | (RealtimeEventBase & {
      kind: "alert.category.acknowledged";
      payload: { alert_id: number };
    })
  | (RealtimeEventBase & {
      kind: "alert.category.projected.acknowledged";
      payload: { alert_id: number };
    })
  | (RealtimeEventBase & {
      kind: "alert.storage.created";
      payload: StorageLimitAlert;
    })
  | (RealtimeEventBase & {
      kind: "alert.storage.resolved";
      payload: { alert_id: number };
    })
  | (RealtimeEventBase & {
      kind: "entry.created";
      payload: {
        entry_id: number;
        waste_id: number;
        waste_name: string;
        weight_kg: number;
      };
    })
  | (RealtimeEventBase & {
      kind: "exit.created";
      payload: {
        exit_id: number;
        waste_id: number;
        weight_kg: number;
        receptor_id: number;
      };
    });

export type RealtimeEventKind = RealtimeEvent["kind"];

export interface RealtimeSnapshot {
  events: RealtimeEvent[];
}
