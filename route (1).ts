@import "tailwindcss";

:root {
  --background: #f5f7fb;
  --foreground: #0b0e13;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  min-height: 100vh;
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}

::selection {
  background: rgba(8, 145, 178, 0.3);
  color: #0b0e13;
}

audio {
  height: 42px;
}
