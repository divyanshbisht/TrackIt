import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>TrackIt</title>
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body {
                background-color: #0B0F17 !important;
                color: #F8FAFC;
                margin: 0;
                padding: 0;
                height: 100%;
                width: 100%;
                overflow: hidden;
              }
              #root {
                display: flex;
                height: 100%;
                width: 100%;
                background-color: #0B0F17;
              }
            `,
          }}
        />
      </head>
      <body style={{ backgroundColor: '#0B0F17', margin: 0, height: '100%', width: '100%' }}>
        {children}
      </body>
    </html>
  );
}
