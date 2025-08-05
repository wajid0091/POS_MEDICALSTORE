const CACHE_NAME = 'inam-pos-cache-v3'; // ورژن نمبر بڑھا دیا ہے
const urlsToCache = [
  '/', // ایپ کے روٹ کو کیش کرے گا
  './index.html', // مین HTML فائل
  './manifest.json' // مینی فیسٹ فائل
  // باقی URLs کو ہم fetch event کے دوران ڈائنامک طور پر کیش کریں گے
];

// 1. Install Event: ایپ شیل (app shell) کو کیش کرنا
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // صرف بنیادی اور اہم فائلز کو انسٹال کے وقت کیش کریں
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. Fetch Event: نیٹ ورک کی درخواستوں کو ہینڈل کرنا
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // اگر ریسپانس کیش میں موجود ہے تو اسے واپس کریں
        if (cachedResponse) {
          return cachedResponse;
        }

        // اگر کیش میں نہیں ہے، تو نیٹ ورک سے fetch کریں
        return fetch(event.request).then(
          networkResponse => {
            // اگر نیٹ ورک سے کامیاب جواب ملا
            if (networkResponse && networkResponse.status === 200) {
              // جواب کی ایک کاپی بنائیں کیونکہ اسے دو جگہ استعمال کرنا ہے
              const responseToCache = networkResponse.clone();

              caches.open(CACHE_NAME)
                .then(cache => {
                  // نئی ریسپانس کو کیش میں محفوظ کریں
                  cache.put(event.request, responseToCache);
                });
            }
            // اصل جواب براؤزر کو بھیجیں
            return networkResponse;
          }
        ).catch(error => {
          // اگر نیٹ ورک فیل ہو جائے (آف لائن ہونے کی صورت میں)
          // یہاں آپ ایک فال بیک آف لائن پیج بھی دکھا سکتے ہیں
          console.error('Fetching failed:', error);
          // throw error; // آپ چاہیں تو ایرر بھی دے سکتے ہیں
        });
      })
  );
});

// 3. Activate Event: پرانے کیش کو صاف کرنا
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // اگر کیش کا نام وائٹ لسٹ میں نہیں ہے تو اسے ڈیلیٹ کر دیں
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
