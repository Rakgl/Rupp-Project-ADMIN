import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetWind, // Using presetWind is common, presetWind3 is an older alias
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss';
import presetAnimations from 'unocss-preset-animations';
import { builtinColors, presetShadcn } from 'unocss-preset-shadcn';
// import { provider } from 'unocss-preset-web-fonts';

export default defineConfig({
  variants: [
    {
      // nth-[]:class
      name: ':nth-child()',
      match: (matcher) => {
        const match = matcher.match(/^nth-\[(.+?):/);
        if (!match) return matcher;
        return {
          // slice `hover:` prefix and passed to the next variants and rules
          matcher: matcher.substring(match[0].length),
          selector: (s) => `${s}:nth-child(${match[1]})`,
        };
      },
      multiPass: true,
    },
  ],
  // --- THEME SECTION WITH ADJUSTED FONT SIZES AND LINE HEIGHTS ---
  theme: {
    fontSize: {
      // Use for tiny helper text or labels - 12px
      xs: ['0.75rem', { lineHeight: '1rem' }], // 16px
      // The new base body text size - 14px
      sm: ['0.875rem', { lineHeight: '1.25rem' }], // 20px
      // The browser default, good for slightly larger text - 16px
      base: ['1rem', { lineHeight: '1.5rem' }], // 24px
      // Use for card titles or section headers - 18px
      lg: ['1.125rem', { lineHeight: '1.625rem' }], // 26px
      // Use for slightly more important titles - 20px
      xl: ['1.25rem', { lineHeight: '1.75rem' }], // 28px
      // Use for main page titles - 24px
      '2xl': ['1.5rem', { lineHeight: '1.875rem' }], // 30px
      // For very prominent hero titles - 30px
      '3xl': ['1.875rem', { lineHeight: '2.125rem' }], // 34px
      // For extra large, impactful titles - 36px
      '4xl': ['2.25rem', { lineHeight: '2.375rem' }], // 38px
    },
    animation: {
      keyframes: {
        'spin-slow': '{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}',
      },
      counts: {
        'spin-slow': 'infinite',
      },
      durations: {
        'spin-slow': '3s',
      },
    },
  },
  presets: [
    presetWind(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
    }),
    presetTypography(),

    presetAnimations(),
    presetShadcn(builtinColors.map((c) => ({ color: c }))),
  ],
  transformers: [transformerDirectives(), transformerVariantGroup({ separators: [':'] })],
  content: {
    pipeline: {
      include: [
        // the default
        /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
        // include js/ts files
        'components/ui/**/*.{js,ts}',
      ],
    },
  },
  preflights: [
    {
      getCSS: () => `
				:root {
				  --sidebar-background: 0 0% 98%;
				  --sidebar-foreground: 240 5.3% 26.1%;
				  --sidebar-primary: 240 5.9% 10%;
				  --sidebar-primary-foreground: 0 0% 98%;
				  --sidebar-accent: 240 4.8% 95.9%;
				  --sidebar-accent-foreground: 240 5.9% 10%;
				  --sidebar-border: 220 13% 91%;
				  --sidebar-ring: 217.2 91.2% 59.8%;
				}
	  
				.dark {
				  --sidebar-background: 240 8% 8%;
				  --sidebar-foreground: 240 6% 94%;
				  --sidebar-primary: 217 91% 68%;
				  --sidebar-primary-foreground: 240 8% 6%;
				  --sidebar-accent: 240 6% 14%;
				  --sidebar-accent-foreground: 240 6% 88%;
				  --sidebar-border: 240 6% 18%;
				  --sidebar-ring: 217 85% 65%;
				}
			  `,
    },
  ],
});
