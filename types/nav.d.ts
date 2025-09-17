export interface NavMenuMeta {
  roles?: string[],
}

export interface NavLink {
  title: string;
  link: string;
  icon?: string;
  new?: boolean;
  meta?: NavMenuMeta;
}

export interface NavSectionTitle {
  heading: string;
}

export interface NavGroup {
  title: string;
  icon?: string;
  new?: boolean;
  meta?: NavMenuMeta;
  children: NavLink[];
}

export interface NavMenu {
  heading: string;
  items: NavMenuItems;
}

export declare type NavMenuItems = (NavLink | NavGroup | NavSectionTitle)[];
