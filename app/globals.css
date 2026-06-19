@tailwind base;
@tailwind components;
@tailwind utilities;

/* ----------------------------------------
   Root Theme Variables
---------------------------------------- */
:root {
  --background: #eef7ff;
  --foreground: #0f172a;

  /* Brand Colors */
  --brand-blue: #06b6d4;
  --brand-blue-dark: #0e7490;
  --brand-green: #22c55e;
  --brand-green-dark: #15803d;
}

/* ----------------------------------------
   Prevent White Flash Before Tailwind Loads
---------------------------------------- */


/* ----------------------------------------
   Global Background (Tailwind Base Layer)
---------------------------------------- */
/* ----------------------------------------
   Prevent White Flash Before Tailwind Loads
---------------------------------------- */
html {
  background-color: #eef7ff; /* only html gets fallback */
}

/* ----------------------------------------
   Global Background (Tailwind Base Layer)
---------------------------------------- */
@layer base {
  body {
    background: linear-gradient(
      135deg,
      #eef7ff 0%,
      #dbeafe 35%,
      #93c5fd 100%
    );
    color: var(--foreground);
    min-height: 100vh;
  }
}


/* ----------------------------------------
   Smooth Scrolling
---------------------------------------- */
html {
  scroll-behavior: smooth;
}

/* ----------------------------------------
   Text Selection
---------------------------------------- */
::selection {
  background: rgba(6, 182, 212, 0.25);
  color: #0f172a;
}

/* ----------------------------------------
   Audio Player Accent
---------------------------------------- */
audio {
  accent-color: var(--brand-blue);
  border-radius: 6px;
}

/* ----------------------------------------
   Card Styling (global)
---------------------------------------- */
.card {
  @apply rounded-xl border border-cyan-200 bg-white shadow-sm hover:shadow-md transition;
}

/* ----------------------------------------
   Button Styling (global)
---------------------------------------- */
.btn-primary {
  @apply h-11 rounded-md bg-gradient-to-br from-cyan-600 to-green-500 px-5 text-sm font-black text-white shadow-sm hover:opacity-90 transition;
}

.btn-secondary {
  @apply h-11 rounded-md border border-cyan-300 bg-white px-5 text-sm font-bold text-cyan-700 hover:bg-cyan-50 transition;
}

.btn-danger {
  @apply h-11 rounded-md bg-gradient-to-br from-rose-500 to-rose-600 px-5 text-sm font-bold text-white shadow-sm hover:opacity-90 transition;
}

/* ----------------------------------------
   Input Styling (global)
---------------------------------------- */
.input {
  @apply h-11 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-400;
}
