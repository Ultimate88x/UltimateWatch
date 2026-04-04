import type { JSX } from "react";

type MenuItem = {
  label: string;
  path: string;
  icon: JSX.Element;
  requiresAuth: boolean;
};

export type {MenuItem}