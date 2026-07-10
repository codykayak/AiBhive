import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
html, body, #root {
  height: 100%;
  margin: 0;
  background-color: #0b0f14;
  color: #e8ecf1;
}
body::before {
  content: 'AiBhive Diagnose — loading…\\A If this stays blank, open Ports → 8082 → Open in Browser';
  white-space: pre-line;
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
  font: 700 16px/1.5 system-ui, sans-serif;
  letter-spacing: 0.02em;
  color: #f5a623;
  pointer-events: none;
  z-index: 0;
}
#root {
  position: relative;
  z-index: 1;
  background-color: #0b0f14;
}
body:has(#root:not(:empty))::before {
  display: none;
}`;
