var staticCacheName = 'django-pwa-v' + new Date().getTime();
var CDN_CACHE_NAME = 'cdn-ache-v' + new Date().getTime();

var dirToCache = ['/', 'dashboard/', 'offline/'];

const filesToCache = [
    "manifest.json", "static/app/css/dashboard.css", "static/app/css/index.css",
    "static/app/css/style.css", "static/app/img/logo.jpg", 
    "static/app/img/pwa_logo.png", 
    "static/app/js/dashboard.js", "static/app/js/index.js", ...dirToCache
];

const CDN_URLS = [
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css',
    'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap',
    'https://fonts.googleapis.com/css?family=Poppins',
    'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.3/js/bootstrap.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.3/css/bootstrap.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/webfonts/fa-solid-900.woff2',
    'https://fonts.gstatic.com/s/poppins/v21/pxiEyp8kv8JHgFVrJJfecg.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/webfonts/fa-solid-900.ttf',
];

self.addEventListener('install', event => {
    event.waitUntil(
        Promise.all([
            caches.open(staticCacheName).then(cache => {
                return cache.addAll(filesToCache);
            }),

            caches.open(CDN_CACHE_NAME).then(cache => {
                return cache.addAll(CDN_URLS);
            })
        ])
    )
})


self.addEventListener('activate', event => {
    const cacheWhitelist = [staticCacheName, CDN_CACHE_NAME];

    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            )
        })
    )
})


self.addEventListener('fetch', event => {
    const url = event.request.url;

    if (url.protocol === 'http' || url.protocol === 'https') {
        if (CDN_URLS.some(cdnUrl => url.startsWith(cdnUrl))) {
            event.respondWith(
                (async () => {
                    try {
                        const networkResponse = await fetch(event.request);

                        if (networkResponse && networkResponse.status === 200) {
                            const cache = await caches.open(CDN_CACHE_NAME);
                            cache.put(event.request, networkResponse.clone());

                            return networkResponse;
                        }
                    } catch (error) {
                        const cacheResponse = await caches.match(event.request);

                        if (cacheResponse) {
                            return cacheResponse;
                        }

                        return caches.match('/offline.html');
                    }
                })()
            )

            return;
        }

        event.respondWith(
            (async () => {
                try {
                    const networkResponse = await fetch(event.request);

                    if (networkResponse && networkResponse.status === 200) {
                        const cache = await caches.open(staticCacheName);

                        cache.put(event.request, networkResponse.clone());

                        return networkResponse;
                    }

                    return networkResponse;
                } catch (error) {
                    const cachedResponse = await caches.match(event.request);

                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    return caches.match('/offline.html');
                }
            })()
        )
    }
})

async function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('offlineDataStore', 1);

        request.onsuccess = function (event) {
            const db = event.target.result;

            resolve(db);
        }

        request.onerror = function (event) {
            reject(event.target.error);
        }

        request.onupgradeneeded = function (event) {
            const db = event.target.result;

            if (!db.objectStoreNames.contains('data')) {
                const store = db.createObjectStore('data', {keyPath: 'id', autoIncrement: true});

                store.createIndex('targetIndex', 'target', {unique: false});
            }
        }
    })
}

async function getOfflineData() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('offlineDataStore', 1);

        request.onsuccess = (event) => {
            const db = event.target.result;

            const transaction = db.transaction('data', 'readonly');

            const store = transaction.objectStore('data');

            const allData = store.getAll();

            allData.onsuccess = () => resolve(allData.result);
            allData.onerror = () => reject('Failed to fetch offline data');
        }

        request.onerror = (event) => reject('Database open failed: ' + event.target.error);

    })
}

async function clearOfflineData() {
    const db = await openDatabase();

    const transaction = db.transaction('data', 'readwrite');

    const store = transaction.objectStore('data');

    await store.clear();

    transaction.oncomplete = () => console.log('Offline data cleared');

    return transaction.complete;
}

async function syncOfflineData() {
    const data = await getOfflineData();

    if (data && data.length > 0) {
        for (i=0; i<data.length; i++) {
            let gotData = data[i];

            if (gotData.target === 'income-form') {
                var actionUrl = '/income/create/'

                var formData = new FormData();

                formData.append('amount', gotData.amount)
                formData.append('category', gotData.category)
                formData.append('date_received', gotData.date_received)
                formData.append('description', gotData.description)
                formData.append('source', gotData.source)
            } else {
                var actionUrl = '/expense/create/'

                var formData = new FormData();

                formData.append('amount', gotData.amount)
                formData.append('category', gotData.category)
                formData.append('date_incurred', gotData.date_incurred)
                formData.append('description', gotData.description)
                formData.append('receipt_image', gotData.receipt_image)
            }

            try {
                const response = await fetch(actionUrl, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': gotData.csrfmiddlewaretoken,
                    },
                    body: formData,
                })

                if (response.ok) {
                    await clearOfflineData();

                }
            } catch (err) {
                console.log('Error syncing data: ', err);
            }
        }

        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({action: 'reload'});
            })
        })
    } else {
        console.log('No offline data to sync');
    }
}


self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-offline-data') {
        event.waitUntil(syncOfflineData());
    }
})
     
