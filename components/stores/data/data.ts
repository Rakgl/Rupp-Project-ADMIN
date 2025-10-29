// data/data.ts
// You might not need separate icons here if status is just text,
// but this structure is for consistency with your existing setup.
// import { Icon } from '#components'; // Assuming this is from Nuxt/auto-import
// import { h } from 'vue';

export const labels = [
  // For Tasks, keep if still used
  { value: 'bug', label: 'Bug' },
  { value: 'feature', label: 'Feature' },
  { value: 'documentation', label: 'Documentation' },
];

export const statuses = [
  // For Tasks, keep if still used
  // ... your existing task statuses
];

export const priorities = [
  // For Tasks, keep if still used
  // ... your existing task priorities
];

// --- NEW: Data for Role Filters ---
export const roleStatuses = [
  {
    value: 'ACTIVE', // This value should match what your API expects/returns
    label: 'Active',
    // icon: h(Icon, { name: 'i-radix-icons-check-circled' }), // Optional
  },
  {
    value: 'INACTIVE',
    label: 'Inactive',
    // icon: h(Icon, { name: 'i-radix-icons-cross-circled' }), // Optional
  },
  // Add other role statuses if applicable
];
// --- END: Data for Role Filters ---
