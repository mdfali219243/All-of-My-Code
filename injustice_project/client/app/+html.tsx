import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>Injustice — Debate. Connect. Share.</title>
        <meta
          name="description"
          content="Project Injustice is a social app for live debates, video posts, reels, and messaging. Join the conversation."
        />
        <meta name="theme-color" content="#18191a" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
