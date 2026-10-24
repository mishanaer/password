import type { ComponentType } from "react";

// Type contract retained from the upstream icon context.
export interface IconComponentProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export type IconComponent = ComponentType<IconComponentProps>;
