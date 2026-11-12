/* Oligar - service worker. Sube el número de versión si cambias la lista SHELL. */
var V = "oligar-v22-4";
var SHELL = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];
self.addEventListener("install", function(e){
  e.waitUntil(caches.open(V).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k !== V; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  var url = new URL(req.url);
  if(url.origin === self.location.origin){
    /* Archivos propios: primero la red (así llegan las actualizaciones solas); sin internet, la copia guardada. */
    e.respondWith(
      fetch(req, {cache:"no-cache"}).then(function(res){
        if(res && res.ok){ var cp = res.clone(); caches.open(V).then(function(c){ c.put(req, cp); }); }
        return res;
      }).catch(function(){
        return caches.match(req).then(function(r){ return r || caches.match("index.html") || caches.match("./"); });
      })
    );
    return;
  }
  if(url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com"){
    e.respondWith(caches.open(V).then(function(c){
      return c.match(req).then(function(hit){
        var net = fetch(req).then(function(res){ if(res && (res.ok || res.type === "opaque")) c.put(req, res.clone()); return res; }).catch(function(){ return hit; });
        return hit || net;
      });
    }));
  }
  /* Firebase, Firestore y demás servicios van directo a internet, sin tocarlos. */
});
