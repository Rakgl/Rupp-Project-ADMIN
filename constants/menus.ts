import type { NavMenu, NavMenuItems } from '~/types/nav';

// Note: All 'heading' and 'title' properties are i18n keys.

export const navMenu: NavMenu[] = [
  {
    heading: 'nav.core_administration',
    items: [
      {
        title: 'nav.authentication',
        icon: 'i-lucide-lock-keyhole-open',
        children: [
          {
            title: 'nav.role_permission',
            icon: 'i-lucide-circle',
            link: '/roles',
          },
          {
            title: 'nav.system_users',
            icon: 'i-lucide-circle',
            link: '/users',
          },
        ],
      },
      {
        title: 'nav.platform_settings',
        icon: 'i-lucide-settings',
        children: [
          {
            title: 'nav.general_settings',
            icon: 'i-lucide-circle',
            link: '/general-settings',
          },
          {
            title: 'nav.translation',
            icon: 'i-lucide-globe',
            link: '/translations',
          },
          {
            title: 'nav.store_notifications',
            icon: 'i-lucide-circle',
            link: '/store-notifications',
          },
          {
            title: 'settings.sidebar.security',
            icon: 'i-lucide-globe',
            link: '/settings/security',
          },
          {
            title: 'nav.items.account_recovery',
            icon: 'i-lucide-shield-check',
            link: '/account-recoveries',
          },
          {
            title: 'nav.items.payment_methods',
            icon: 'i-lucide-credit-card',
            link: '/payment-methods',
          },
        ],
      },
    ],
  },
  // --- Product & Sales ---
  {
    heading: 'nav.product_sales',
    items: [
      {
        title: 'nav.store',
        icon: 'i-lucide-store',
        link: '/stores',
      },
      {
        title: 'nav.product_inventory',
        icon: 'i-lucide-shopping-basket',
        children: [
          {
            title: 'nav.product_list',
            icon: 'i-lucide-circle',
            link: '/products',
          },
          {
            title: 'nav.store_inventories',
            icon: 'i-lucide-circle',
            link: '/store-products',
          },
          {
            title: 'nav.manage_categories',
            icon: 'i-lucide-circle',
            link: '/categories',
          },
          {
            title: 'nav.manage_brands',
            icon: 'i-lucide-circle',
            link: '/brands',
          },
        ],
      },
      {
        title: 'nav.orders_sales',
        icon: 'i-lucide-credit-card',
        meta: { roles: ['admin'] },
        children: [
          {
            title: 'nav.all_orders',
            icon: 'i-lucide-circle',
            link: '/orders',
          },
          {
            title: 'nav.pending_orders',
            icon: 'i-lucide-circle',
            link: '/orders/pending',
          },
          // {
          //   title: 'nav.sales_reports',
          //   icon: 'i-lucide-circle',
          //   link: '/reports/sales',
          // },
        ],
      },
    ],
  },
];

export const navMenuBottom: NavMenuItems = [
  {
    title: 'nav.help_support',
    meta: { roles: ['admin'] },
    icon: 'i-lucide-circle-help',
    link: '/support',
  },
  {
    title: 'nav.feedback',
    meta: { roles: ['admin'] },
    icon: 'i-lucide-send',
    link: '/feedback',
  },
  {
    title: 'nav.get_our_app',
    meta: { roles: ['admin'] },
    icon: 'i-lucide-smartphone-download',
    link: '/get-app',
  },
];
