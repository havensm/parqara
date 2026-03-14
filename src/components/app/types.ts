import type { ReactNode } from "react";

import type { TripWorkspaceTab } from "@/lib/trip-workspace";

type WorkspacePlannerTab = TripWorkspaceTab & {
  isActive?: boolean;
};

export type WorkspaceFrameProps = {
  children: ReactNode;
  sidebar: ReactNode;
  plannerTabs?: WorkspacePlannerTab[];
  activePlannerId?: string;
  adminEnabled?: boolean;
};
