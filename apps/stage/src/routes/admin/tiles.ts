import {
  CloudServerIcon,
  DatabaseIcon,
  Note01Icon,
  Pulse01Icon,
  Queue01Icon,
  SlidersHorizontalIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

export interface AdminTile {
  href: string;
  title: string;
  blurb: string;
  icon: IconSvgElement;
  ready: boolean;
}

export const ADMIN_TILES: readonly AdminTile[] = [
  {
    href: "/admin/runtime",
    title: "Runtime settings",
    blurb: "Model temperature, prompt budget, illustration and dice tuning.",
    icon: SlidersHorizontalIcon,
    ready: true,
  },
  {
    href: "/admin/health",
    title: "Health",
    blurb: "Reachability and latency for the LLM, diffusion, TTS, cache and storage.",
    icon: Pulse01Icon,
    ready: true,
  },
  {
    href: "/admin/queues",
    title: "Queues",
    blurb: "Diffusion, audio and memory jobs waiting, running and failed.",
    icon: Queue01Icon,
    ready: false,
  },
  {
    href: "/admin/storage",
    title: "Storage",
    blurb: "Objects in the assets bucket, orphan scan and cleanup.",
    icon: CloudServerIcon,
    ready: false,
  },
  {
    href: "/admin/worlds",
    title: "Worlds and characters",
    blurb: "Every world and character across all accounts.",
    icon: DatabaseIcon,
    ready: false,
  },
  {
    href: "/admin/accounts",
    title: "Accounts",
    blurb: "Who can sign in, and who holds the admin role.",
    icon: UserGroupIcon,
    ready: true,
  },
  {
    href: "/admin/audit",
    title: "Audit",
    blurb: "Every change made from these screens.",
    icon: Note01Icon,
    ready: false,
  },
];
