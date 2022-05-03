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
import { Route, registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

const btvPlayer = new Route(({url}) => {
  return url === 'https://brunstad.tv/Content/js/btvplayer.js';
}, new NetworkFirst({
  plugins: [
    new CacheableResponsePlugin({
      statuses: [0, 200]
    })
  ]
}))

registerRoute(btvPlayer);
precacheAndRoute(self.__WB_MANIFEST)