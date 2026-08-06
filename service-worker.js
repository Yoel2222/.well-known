// service-worker.js
self.addEventListener('push', (event) => {
    let data = { title: "Radio Valle Viejo", body: "Hay noticias nuevas" };
    if (event.data) {
        data = event.data.json();
    }
    
    const options = {
        body: data.body,
        icon: 'assets/logo.webp', // Asegúrate de tener este logo
        badge: 'assets/logo.webp'
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});