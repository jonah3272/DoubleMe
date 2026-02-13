/**
 * Registry of project tools/integrations. Enabling a tool creates a project_agent row;
 * later you add real OAuth and APIs (calendar, Figma, etc.).
 */
export type ProjectToolId =
  | "calendar"
  | "meeting_notes"
  | "contacts"
  | "figma"
  | "granola";

export interface ProjectTool {
  id: ProjectToolId;
  agentKey: string;
  name: string;
  description: string;
  comingSoon: boolean;
  /** Short label for badges */
  badge?: string;
}

export const PROJECT_TOOLS: ProjectTool[] = [
  {
    id: "calendar",
    agentKey: "calendar",
    name: "Calendar",
    description: "Connect Google or Outlook so meetings and availability are in one place.",
    comingSoon: true,
    badge: "Next",
  },
  {
    id: "meeting_notes",
    agentKey: "meeting_notes",
    name: "Meeting notes & summaries",
    description: "Capture notes and get AI summaries, action items, and follow-ups from meetings.",
    comingSoon: true,
    badge: "Next",
  },
  {
    id: "contacts",
    agentKey: "contacts",
    name: "Teammates & contacts",
    description: "Add teammates and contacts so you can assign tasks and track who does what.",
    comingSoon: false,
  },
  {
    id: "figma",
    agentKey: "figma",
    name: "Figma",
    description: "Link designs and ideate on Figma files from this workspace.",
    comingSoon: true,
    badge: "Later",
  },
  {
    id: "granola",
    agentKey: "granola",
    name: "Granola",
    description: "Import meeting transcripts from Granola to create tasks and meeting notes in this project.",
    comingSoon: false,
  },
];

export function getProjectTool(id: ProjectToolId): ProjectTool | undefined {
  return PROJECT_TOOLS.find((t) => t.id === id);
}

export function getProjectToolByAgentKey(agentKey: string): ProjectTool | undefined {
  return PROJECT_TOOLS.find((t) => t.agentKey === agentKey);
}
