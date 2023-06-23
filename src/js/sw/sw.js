/**
 * Copyright 2021 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { precacheAndRoute } from 'workbox-precaching'
import { Route, registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

const assets = new Route(({url}) => {
  return url.pathname === '/' || url.pathname === '/style.css' || url.pathname === '/script.js'
}, new NetworkFirst({
  plugins: [
    new CacheableResponsePlugin({
      statuses: [0, 200]
    })
  ]
}))

const castFramework = new Route(({url}) => {
  return url === 'https://www.gstatic.com/cast/sdk/libs/sender/1.0/cast_framework.js'
}, new NetworkFirst({
  plugins: [
    new CacheableResponsePlugin({
      statuses: [0, 200]
    })
  ]
}))

const riveApp = new Route(({url}) => {
  return url === 'https://unpkg.com/@rive-app/canvas@1.0.102'
}, new NetworkFirst({
  plugins: [
    new CacheableResponsePlugin({
      statuses: [0, 200]
    })
  ]
}))

registerRoute(assets)
registerRoute(castFramework)
registerRoute(riveApp)
precacheAndRoute(self.__WB_MANIFEST)