import type { NavMenu, NavMenuItems } from '~/types/nav';

export const navMenu: NavMenu[] = [
  {
    heading: 'nav.overview',
    items: [
      {
        title: 'nav.dashboard',
        icon: 'i-lucide-layout-dashboard',
        link: '/',
      },
    ],
  },
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
          // {
          //   title: 'nav.store_notifications',
          //   icon: 'i-lucide-circle',
          //   link: '/store-notifications',
          // },
          {
            title: 'settings.sidebar.security',
            icon: 'i-lucide-globe',
            link: '/settings/security',
          },
          {
            title: 'nav.items.payment_methods',
            icon: 'i-lucide-credit-card',
            link: '/payment-methods',
          },
        ],
      },
      {
        title: 'nav.app_download_links',
        icon: 'i-lucide-settings',
        children: [
          {
            title: 'nav.get_our_app',
            icon: 'i-lucide-smartphone-download',
            link: '/download-links',
          },
          {
            title: 'nav.app_versions',
            icon: 'i-lucide-smartphone',
            link: '/app-version',
          },
        ],
      },
    ],
  },
  // --- Product & Sales ---
  {
    heading: 'nav.product_sales',
    items: [
      // {
      //   title: 'nav.store',
      //   icon: 'i-lucide-store',
      //   link: '/stores',
      // },
      {
        title: 'nav.categories',
        icon: 'i-lucide-tag',
        link: '/categories',
      },
      {
        title: 'nav.products',
        icon: 'i-lucide-package',
        link: '/products',
      },
      {
        title: 'nav.pets',
        icon: 'i-lucide-dog',
        link: '/pets',
      },
      {
        title: 'nav.services',
        icon: 'i-lucide-wrench',
        link: '/services',
      },
      {
        title: 'nav.appointments',
        icon: 'i-lucide-calendar',
        link: '/appointments',
      },
      // {
      //   title: 'nav.store_inventory',
      //   icon: 'i-lucide-warehouse',
      //   link: '/store-inventory',
      // },
      {
        title: 'nav.carts',
        icon: 'i-lucide-shopping-cart',
        link: '/carts',
      },
      {
        title: 'nav.favorites',
        icon: 'i-lucide-heart',
        link: '/favorites',
      },
      {
        title: 'nav.all_orders',
        icon: 'i-lucide-receipt-text',
        link: '/orders',
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
];
