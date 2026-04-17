import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no"
        />
        <meta name="description" content="Wavelength - A mind sync party game. Give clues, read minds, and score points on a spectrum." />
        <title>Wavelength</title>

        {/* Prevent white flash on load */}
        <style dangerouslySetInnerHTML={{ __html: `
          html, body {
            background-color: #0a172b;
          }
          #root {
            display: flex;
            flex: 1;
            height: 100%;
          }
        `}} />

        <ScrollViewStyleReset />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
