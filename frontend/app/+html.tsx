import { ScrollViewStyleReset } from 'expo-router/html';
import React from 'react';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />

        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Supreme Compliance" />
        <meta name="application-name" content="Supreme Compliance" />
        <meta name="theme-color" content="#7B2D8E" />
        <meta name="msapplication-TileColor" content="#7B2D8E" />
        <meta name="description" content="Supreme Compliance — SOPs & Compliance Document Generator" />

        {/* Apple Touch Icon */}
        <link rel="apple-touch-icon" href="/assets/supreme-logo.png" />

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: `
          html, body, #root {
            height: 100%;
            margin: 0;
            padding: 0;
            background-color: #f8f7f4;
            overflow: hidden;
          }
          body {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          /* Web scrollbar styles */
          ::-webkit-scrollbar {
            width: 4px;
          }
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          ::-webkit-scrollbar-thumb {
            background: rgba(123,45,142,0.2);
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(123,45,142,0.4);
          }
          /* Prevent text selection on interactive elements */
          button, [role="button"] {
            user-select: none;
            -webkit-user-select: none;
          }
          /* Desktop centering */
          @media (min-width: 769px) {
            body {
              background: linear-gradient(135deg, #0a0a14 0%, #1a1a2e 50%, #2d1b4e 100%);
              display: flex;
              justify-content: center;
            }
            #root {
              max-width: 480px;
              box-shadow: 0 0 60px rgba(0,0,0,0.3);
              border-left: 1px solid rgba(196,162,101,0.15);
              border-right: 1px solid rgba(196,162,101,0.15);
              overflow: hidden;
            }
          }
        `}} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
