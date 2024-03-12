export type BreadcrumbItem = {
  id: string;
  name: string;
  prefixIcon?: string;
  action?: () => Promise<void>;
  getDropdownChildren?: () => BreadcrumbDropdownItem[];
  width?: number;
  shortWidth?: number;
};

export type BreadcrumbDropdownItem = {
  id: string;
  name: string;
  subtitle?: string;
  action?: () => Promise<void>;
};

export type BreadcrumbSeparator =
  | "panel-breadcrumb-separator"
  | "panel-breadcrumb-slash-separator";
