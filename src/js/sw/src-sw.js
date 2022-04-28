workbox.routing.registerRoute(
    /https:\/\/staging-bcckids\.kinsta\.cloud\/wp-json\/biex-episodes\/get?lang=no/,
    new workbox.strategies.NetworkFirst({
      cacheName: "biex-episodes",
      plugins: [
        new workbox.expiration.Plugin({
          maxAgeSeconds: 10 * 60 // 10 minutes
        })
      ]
    })
  );