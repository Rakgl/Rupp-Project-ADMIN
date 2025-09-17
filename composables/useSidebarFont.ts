/**
 * Composable for sidebar-specific font utilities
 */

export const useSidebarFont = () => {
  const { locale } = useI18n();
  const { getFontClass, getFontFamily } = useLanguageFont();

  /**
   * Get the current sidebar font class based on active locale
   */
  const currentSidebarFontClass = computed(() => {
    return getFontClass(locale.value);
  });

  /**
   * Get the current sidebar font family based on active locale
   */
  const currentSidebarFontFamily = computed(() => {
    return getFontFamily(locale.value);
  });

  /**
   * Apply sidebar-specific font styles to an element
   */
  const applySidebarFont = (element: HTMLElement) => {
    // Remove all font classes first
    element.classList.remove('font-sans', 'font-khmer');

    // Apply current font class
    element.classList.add(currentSidebarFontClass.value);

    // Apply font family style
    element.style.fontFamily = currentSidebarFontFamily.value;
  };

  /**
   * Sample multilingual navigation items for testing
   */
  const getSampleNavItems = () => {
    return {
      en: [
        { title: 'Dashboard', subtitle: 'Overview & Analytics' },
        { title: 'Patients', subtitle: 'Patient Management' },
        { title: 'Appointments', subtitle: 'Schedule & Calendar' },
        { title: 'Medical Records', subtitle: 'Health Documentation' },
        { title: 'Reports', subtitle: 'Data & Statistics' },
      ],
      km: [
        { title: 'ផ្ទាំងគ្រប់គ្រង', subtitle: 'ទិដ្ឋភាព និងការវិភាគ' },
        { title: 'អ្នកជំងឺ', subtitle: 'ការគ្រប់គ្រងអ្នកជំងឺ' },
        { title: 'ការណាត់ជួប', subtitle: 'កាលវិភាគ និងតារាង' },
        { title: 'កំណត់ត្រាវេជ្ជសាស្ត្រ', subtitle: 'ឯកសារសុខភាព' },
        { title: 'របាយការណ៍', subtitle: 'ទិន្នន័យ និងស្ថិតិ' },
      ],
    };
  };

  return {
    currentSidebarFontClass,
    currentSidebarFontFamily,
    applySidebarFont,
    getSampleNavItems,
  };
};
