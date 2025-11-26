import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetWind,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss';
import presetAnimations from 'unocss-preset-animations';
import { builtinColors, presetShadcn } from 'unocss-preset-shadcn';

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
  theme: {
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.625rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '1.875rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.125rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.375rem' }],
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
        /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
        'components/ui/**/*.{js,ts}',
      ],
    },
  },
  preflights: [
    {
      getCSS: () => `
                :root {
                  --background: 0 0% 100%;
                  --foreground: 240 10% 3.9%;
                  --card: 0 0% 100%;
                  --card-foreground: 240 10% 3.9%;
                  --popover: 0 0% 100%;
                  --popover-foreground: 240 10% 3.9%;
                  --primary: 240 5.9% 10%;
                  --primary-foreground: 0 0% 98%;
                  --secondary: 0 0% 96.1%;
                  --secondary-foreground: 240 5.9% 10%;
                  --muted: 0 0% 96.1%;
                  --muted-foreground: 240 3.8% 46.1%;
                  --accent: 0 0% 96.1%;
                  --accent-foreground: 240 5.9% 10%;
                  --border: 0 0% 89.8%;
                  --input: 0 0% 89.8%;
                  --ring: 240 10% 3.9%;
                }
      
                .dark {
                    --background: 240 10% 3.9%;
                    --foreground: 0 0% 98%;
                    --card: 240 10% 3.9%;
                    --card-foreground: 0 0% 98%;
                    --popover: 240 10% 3.9%;
                    --popover-foreground: 0 0% 98%;
                    --primary: 0 0% 98%;
                    --primary-foreground: 240 5.9% 10%;
                    --secondary: 240 3.7% 15.9%;
                    --secondary-foreground: 0 0% 98%;
                    --muted: 240 3.7% 15.9%;
                    --muted-foreground: 240 5% 64.9%;
                    --accent: 240 3.7% 15.9%;
                    --accent-foreground: 0 0% 98%;
                    --border: 240 3.7% 15.9%;
                    --input: 240 3.7% 15.9%;
                    --ring: 240 4.9% 83.9%;
                }
              `,
    },
  ],
});
