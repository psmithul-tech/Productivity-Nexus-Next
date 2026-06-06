const fs = require('fs');

const cssContent = `
@import "tailwindcss";
@plugin "tailwindcss-motion";

@theme {
  --color-tertiary: #f8f5f6;
  --color-primary-fixed: #7df4ff;
  --color-on-primary-fixed-variant: #004f54;
  --color-tertiary-fixed: #e5e2e3;
  --color-on-background: #e4e2e4;
  --color-on-error: #690005;
  --color-primary-fixed-dim: #00dbe9;
  --color-on-primary: #00363a;
  --color-on-surface-variant: #b9cacb;
  --color-on-tertiary: #313031;
  --color-on-secondary-fixed: #320047;
  --color-on-tertiary-fixed: #1c1b1c;
  --color-primary: #dbfcff;
  --color-tertiary-fixed-dim: #c8c6c7;
  --color-error-container: #93000a;
  --color-inverse-on-surface: #303032;
  --color-on-tertiary-fixed-variant: #474647;
  --color-secondary-fixed: #f8d8ff;
  --color-on-primary-fixed: #002022;
  --color-surface-container: #1f1f21;
  --color-on-surface: #e4e2e4;
  --color-on-tertiary-container: #5f5e5f;
  --color-surface-container-high: #2a2a2c;
  --color-error: #ffb4ab;
  --color-tertiary-container: #dbd8d9;
  --color-on-secondary-container: #fff6fc;
  --color-primary-container: #00f0ff;
  --color-surface-variant: #353437;
  --color-on-primary-container: #006970;
  --color-on-secondary: #520072;
  --color-secondary-fixed-dim: #ebb2ff;
  --color-inverse-primary: #006970;
  --color-surface: #131315;
  --color-outline: #849495;
  --color-on-error-container: #ffdad6;
  --color-on-secondary-fixed-variant: #74009f;
  --color-secondary-container: #b600f8;
  --color-surface-container-low: #1b1b1d;
  --color-surface-container-lowest: #0e0e10;
  --color-surface-tint: #00dbe9;
  --color-outline-variant: #3b494b;
  --color-surface-container-highest: #353437;
  --color-surface-dim: #131315;
  --color-surface-bright: #39393b;
  --color-inverse-surface: #e4e2e4;
  --color-secondary: #ebb2ff;
  --color-background: #131315;

  --spacing-sm: 8px;
  --spacing-gutter: 16px;
  --spacing-unit: 4px;
  --spacing-container-max: 1440px;
  --spacing-xs: 4px;
  --spacing-xl: 48px;
  --spacing-md: 16px;
  --spacing-lg: 24px;

  --font-data-metric: "JetBrains Mono";
  --font-mono-label: "JetBrains Mono";
  --font-headline-md: "Inter";
  --font-headline-sm: "Inter";
  --font-display-lg: "Inter";
  --font-body-sm: "Inter";
  --font-body-lg: "Inter";

  --text-data-metric: 14px;
  --text-data-metric--line-height: 1;
  --text-data-metric--font-weight: 600;

  --text-mono-label: 12px;
  --text-mono-label--line-height: 1.2;
  --text-mono-label--letter-spacing: 0.05em;
  --text-mono-label--font-weight: 500;

  --text-headline-md: 24px;
  --text-headline-md--line-height: 1.2;
  --text-headline-md--font-weight: 600;

  --text-headline-sm: 18px;
  --text-headline-sm--line-height: 1.4;
  --text-headline-sm--font-weight: 600;

  --text-display-lg: 48px;
  --text-display-lg--line-height: 1.1;
  --text-display-lg--letter-spacing: -0.02em;
  --text-display-lg--font-weight: 700;

  --text-body-sm: 14px;
  --text-body-sm--line-height: 1.5;
  --text-body-sm--font-weight: 400;

  --text-body-lg: 16px;
  --text-body-lg--line-height: 1.6;
  --text-body-lg--font-weight: 400;

  --animate-shine: shine 3s linear infinite;

  @keyframes shine {
    0% {
      background-position: 100%;
    }
    100% {
      background-position: -100%;
    }
  }
}

@utility embla {
  @apply overflow-hidden;
}
@utility embla__container {
  @apply flex cursor-grab active:cursor-grabbing;
}
@utility embla__slide {
  @apply min-w-0 flex-[0_0_100%];
}
@utility absolute-center {
  @apply absolute! top-1/2! left-1/2! float-none! -translate-x-1/2! -translate-y-1/2!;
}
@utility movie-grid {
  @apply grid size-full max-w-6xl grid-cols-2 justify-center gap-2 sm:grid-cols-3 md:gap-4 lg:grid-cols-[repeat(auto-fit,minmax(200px,50px))];
}

@layer base {
  :root {
    --background: 222 47% 6%;
    --foreground: 220 20% 94%;
    --card: 222 40% 9%;
    --card-foreground: 220 20% 94%;
    --popover: 222 40% 9%;
    --popover-foreground: 220 20% 94%;
    --border: 222 30% 18%;
    --input: 222 30% 14%;
    --ring: 265 90% 65%;
    --radius: 0.125rem;
    --sidebar-width: 260px;
  }

  * {
    border-color: hsl(var(--border));
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    background-color: var(--color-background);
    color: var(--color-on-surface);
    font-feature-settings: "rlig" 1, "calt" 1;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  ::selection {
    background-color: rgba(125, 244, 255, 0.3);
  }

  /* Custom Scrollbar from Design */
  * {
    scrollbar-width: thin;
    scrollbar-color: var(--color-outline-variant) transparent;
  }
  ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
  }
  ::-webkit-scrollbar-track {
      background: var(--color-background);
  }
  ::-webkit-scrollbar-thumb {
      background: var(--color-outline-variant);
      border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
      background: var(--color-outline);
  }
}

@layer utilities {
  .glow-fx {
      box-shadow: 0 0 10px rgba(0, 240, 255, 0.4);
  }
  .glass-panel {
      background: rgba(22, 22, 24, 0.7);
      backdrop-filter: blur(20px);
      border: 1px solid #252527;
  }
  .module-border {
      border-top: 1px solid var(--color-surface-tint);
  }
  .module-border-alt {
      border-top: 1px solid var(--color-secondary-container);
  }

  /* Page enter animation */
  @keyframes page-in {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .page-enter {
    animation: page-in 0.3s ease-out both;
  }
}
`;

fs.writeFileSync('app/globals.css', cssContent.trim());
console.log('globals.css updated successfully.');
