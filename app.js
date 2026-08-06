document.addEventListener('DOMContentLoaded', () => {

    // --- NUEVA FUNCIÓN AUXILIAR DE PiP ---
    // --- NUEVA FUNCIÓN AUXILIAR DE PiP (Adaptada para React Native) ---
function updatePiPStatus(allowPiP) {
    // Verificamos si estamos dentro del WebView de React Native
    if (window.ReactNativeWebView) {
        // Enviamos un mensaje a React Native con el estado deseado
        window.ReactNativeWebView.postMessage(JSON.stringify({
            action: 'setPiP',
            value: allowPiP
        }));
        console.log("PiP Status enviado a React Native:", allowPiP);
    } 
    // Mantenemos el código anterior por si sigues usando tu vieja app nativa de prueba
    else if (window.AndroidPiP && typeof window.AndroidPiP.setCanEnterPip === 'function') {
        window.AndroidPiP.setCanEnterPip(allowPiP);
    }
}

    // --- VARIABLES GLOBALES ---
    let noticiasData = [];
    let vistaAnterior = 'view-inicio'; 

    // --- LÓGICA DE NAVEGACIÓN INFERIOR (TABS) ---
    const navItems = document.querySelectorAll('.nav-item');
    const viewSections = document.querySelectorAll('.view-section');

    window.cambiarPestaña = function(targetId) {
        navItems.forEach(nav => {
            if(nav.getAttribute('data-target') === targetId) {
                nav.classList.add('active');
            } else {
                nav.classList.remove('active');
            }
        });

        viewSections.forEach(section => section.classList.remove('active'));
        document.getElementById(targetId).classList.add('active');
        
        // --- CONTROL DE PiP ---
        updatePiPStatus(targetId === 'view-inicio');
        
        if(targetId !== 'view-articulo') {
            vistaAnterior = targetId;
            window.scrollTo(0,0);
        }
    };

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetId = item.getAttribute('data-target');
            cambiarPestaña(targetId);
        });
    });

    // --- LÓGICA DEL REPRODUCTOR DE RADIO ---
    const playRadioBtnHome = document.getElementById('play-radio-btn');
    const playRadioBtnFull = document.getElementById('play-radio-btn-full');
    const radioAudio = document.getElementById('radio-audio');
    const playerStatusHome = document.getElementById('player-status');
    const playerStatusFull = document.getElementById('player-status-full');
    const muteBtnHome = document.getElementById('mute-btn');
    const muteBtnFull = document.getElementById('mute-btn-full');
    let isPlaying = false;

    function updateRadioUI(state, text) {
        const icon = state === 'playing' ? '⏸' : '▶';
        if (playRadioBtnHome) playRadioBtnHome.innerHTML = icon;
        if (playRadioBtnFull) playRadioBtnFull.innerHTML = icon;
        
        if (text) {
            if (playerStatusHome) playerStatusHome.textContent = text;
            if (playerStatusFull) playerStatusFull.textContent = text;
        }
    }

    function playStream() {
        updateRadioUI('loading', 'Cargando señal...');
        const currentSrc = radioAudio.src;
        radioAudio.src = '';
        radioAudio.src = currentSrc;
        radioAudio.load();
        
        radioAudio.play().then(() => {
            isPlaying = true;
            updateRadioUI('playing', 'Escuchando en vivo');
            updateMediaSessionState('playing');
        }).catch(error => {
            console.error("Error al reproducir audio:", error);
            isPlaying = false;
            updateRadioUI('paused', 'Error: Señal no disponible');
            updateMediaSessionState('none');
        });
    }

    function pauseStream() {
        radioAudio.pause();
        isPlaying = false;
        updateRadioUI('paused', 'Streaming en pausa');
        updateMediaSessionState('paused');
    }

    function togglePlay() {
        isPlaying ? pauseStream() : playStream();
    }

    const containerHome = document.querySelector('.audio-player');
    if (containerHome) {
        containerHome.addEventListener('click', () => {
            togglePlay();
            if (playRadioBtnHome) playRadioBtnHome.style.animation = 'none';
        });
    }

    const containerFull = document.querySelector('.radio-card-full .audio-player'); 
    if (containerFull) containerFull.addEventListener('click', togglePlay);
    if (playRadioBtnFull) playRadioBtnFull.addEventListener('click', togglePlay);

    function toggleMute() {
        radioAudio.muted = !radioAudio.muted;
        const icon = radioAudio.muted ? '🔇' : '🔊';
        if (muteBtnHome) muteBtnHome.innerHTML = icon;
        if (muteBtnFull) muteBtnFull.innerHTML = icon;
    }

    if (muteBtnHome) muteBtnHome.addEventListener('click', toggleMute);
    if (muteBtnFull) muteBtnFull.addEventListener('click', toggleMute);

    // --- FUNCION PARA RECARGAR LA TV ---
    window.recargarTV = function() {
        const btn = document.querySelector('.btn-recargar');
        const textOrig = btn.innerHTML;
        btn.innerHTML = '⏳ Recargando...';
        
        const iframeHome = document.getElementById('tv-iframe');
        if(iframeHome) iframeHome.src = iframeHome.src;
        
        const iframeFull = document.getElementById('tv-iframe-full');
        if(iframeFull) iframeFull.src = iframeFull.src;
        
        setTimeout(() => { btn.innerHTML = textOrig; }, 1500);
    };

    // --- MEDIA SESSION API ---
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: 'Radio Valle Viejo en Vivo',
            artist: 'Valle Viejo',
            album: 'Transmisión Oficial',
            artwork: [{ src: 'assets/logo.webp', sizes: '192x192', type: 'image/webp' }]
        });
        navigator.mediaSession.setActionHandler('play', playStream);
        navigator.mediaSession.setActionHandler('pause', pauseStream);
    }

    function updateMediaSessionState(state) {
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = state;
    }

    // --- LÓGICA ARRASTRAR CATEGORÍAS ---
    const sliderCategorias = document.querySelector('.category-filters');
    let isDown = false;
    let startX, scrollLeft;

    if (sliderCategorias) {
        sliderCategorias.addEventListener('mousedown', (e) => {
            isDown = true;
            startX = e.pageX - sliderCategorias.offsetLeft;
            scrollLeft = sliderCategorias.scrollLeft;
        });
        sliderCategorias.addEventListener('mouseleave', () => { isDown = false; });
        sliderCategorias.addEventListener('mouseup', () => { isDown = false; });
        sliderCategorias.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - sliderCategorias.offsetLeft;
            const walk = (x - startX) * 2;
            sliderCategorias.scrollLeft = scrollLeft - walk;
        });
    }

    // --- LÓGICA DE NOTICIAS ---
    let categoriasWP = {};

    function initNoticias() {
        fetch('https://radiovalleviejo.com/wp-json/wp/v2/categories?per_page=100')
            .then(res => res.json())
            .then(cats => {
                cats.forEach(c => {
                    const slugLimpio = c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    categoriasWP[slugLimpio] = c.id;
                    categoriasWP[c.slug.toLowerCase()] = c.id;
                });
            })
            .catch(err => console.log("Error cargando categorías:", err));

        cargarNoticiasHome();
        cargarNoticiasFeed('todas');
    }

    function cargarNoticiasHome() {
        const homeList = document.getElementById('home-news-list');
        if (!homeList) return;
        homeList.innerHTML = "<p style='text-align:center; padding: 20px;'>Conectando...</p>";
        fetch('https://radiovalleviejo.com/wp-json/wp/v2/posts?_embed&per_page=3')
            .then(res => res.json())
            .then(posts => {
                homeList.innerHTML = "";
                posts.forEach(post => {
                    if(!noticiasData.some(p => p.id === post.id)) noticiasData.push(post);
                    homeList.appendChild(generarTarjetaDOM(post));
                });
            });
    }

    function cargarNoticiasFeed(termino) {
        const fullList = document.getElementById('full-news-list');
        if (!fullList) return;
        fullList.innerHTML = "<p style='text-align:center; padding: 20px;'>Buscando...</p>";
        let urlAPI = 'https://radiovalleviejo.com/wp-json/wp/v2/posts?_embed&per_page=10';
        if (termino && termino !== 'todas') {
            const catId = buscarCategoriaId(termino);
            urlAPI += catId ? `&categories=${catId}` : `&search=${termino}`;
        }
        fetch(urlAPI)
            .then(res => res.json())
            .then(posts => {
                fullList.innerHTML = "";
                posts.forEach(post => {
                    if(!noticiasData.some(p => p.id === post.id)) noticiasData.push(post);
                    fullList.appendChild(generarTarjetaDOM(post));
                });
            });
    }

    function buscarCategoriaId(term) {
        if (categoriasWP[term]) return categoriasWP[term];
        for (let key in categoriasWP) {
            if (key.includes(term) || term.includes(key)) return categoriasWP[key];
        }
        return null;
    }

    const catBtns = document.querySelectorAll('.cat-btn');
    catBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            catBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            cargarNoticiasFeed(btn.getAttribute('data-cat'));
        });
    });

    function generarTarjetaDOM(post) {
        const title = post.title.rendered;
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = post.excerpt.rendered;
        const excerpt = tempDiv.textContent || tempDiv.innerText || "";
        const date = new Date(post.date).toLocaleDateString("es-AR", { day: '2-digit', month: 'long', year: 'numeric' });
        let imageUrl = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || "";
        const newsCard = document.createElement("div");
        newsCard.className = "news-card"; 
        newsCard.innerHTML = `${imageUrl ? `<img src="${imageUrl}" alt="Noticia" class="news-img" loading="lazy">` : ""}
            <div class="news-content">
                <small class="news-date">🗓️ ${date}</small>
                <h3 class="news-title">${title}</h3>
                <p class="news-excerpt">${excerpt}</p>
                <button onclick="abrirArticulo(${post.id})" class="read-more-btn">Leer nota completa</button>
            </div>`;
        return newsCard;
    }

    window.abrirArticulo = function(id) {
        const post = noticiasData.find(p => p.id === id);
        if (!post) return;
        updatePiPStatus(false); 
        const date = new Date(post.date).toLocaleDateString("es-AR", { day: '2-digit', month: 'long', year: 'numeric' });
        const contentContainer = document.getElementById('articulo-content');
        let imageUrl = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || "";
        contentContainer.innerHTML = `<h1>${post.title.rendered}</h1>
            <small class="art-date">Publicado el ${date}</small>
            ${imageUrl ? `<img src="${imageUrl}" alt="Portada">` : ""}
            <div>${post.content.rendered}</div>`;
        viewSections.forEach(section => section.classList.remove('active'));
        document.getElementById('view-articulo').classList.add('active');
        window.scrollTo(0,0);
    };

    window.cerrarArticulo = function() {
        document.getElementById('articulo-content').innerHTML = "";
        updatePiPStatus(vistaAnterior === 'view-inicio');
        cambiarPestaña(vistaAnterior);
    };

    // --- NOTIFICACIONES ---
    function registrarServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js')
                .catch(err => console.error('Error SW', err));
        }
    }

    // 1. Botón que pide permisos con mensajes de confirmación
window.solicitarNotificaciones = function() {
    if (!("Notification" in window)) {
        alert("Tu dispositivo no soporta notificaciones web.");
        return;
    }

    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            alert("¡Notificaciones activadas! Te avisaremos cuando publiquemos algo nuevo.");
            iniciarMonitoreoNoticias();
        } else if (permission === 'denied') {
            alert("Has denegado las notificaciones. Para activarlas, debes hacerlo desde los ajustes de la aplicación en tu celular.");
        }
    });
};

    function iniciarMonitoreoNoticias() {
        fetch('https://radiovalleviejo.com/wp-json/wp/v2/posts?per_page=1')
            .then(res => res.json())
            .then(posts => { if(posts.length > 0) window.ultimoIdNoticia = posts[0].id; });

        setInterval(() => {
            if (Notification.permission !== "granted") return;
            fetch('https://radiovalleviejo.com/wp-json/wp/v2/posts?_embed&per_page=1')
                .then(res => res.json())
                .then(posts => {
                    if (posts.length > 0 && window.ultimoIdNoticia !== posts[0].id) {
                        window.ultimoIdNoticia = posts[0].id;
                        mostrarNotificacion(posts[0]);
                        cargarNoticiasHome();
                    }
                });
        }, 60000);
    }

    function mostrarNotificacion(post) {
        const notificacion = new Notification("NUEVA NOTICIA: " + post.title.rendered, {
            body: "Toca aquí para leer la nota completa.",
            icon: "assets/icons/launchericon-192x192.png"
        });
        notificacion.onclick = () => { abrirArticulo(post.id); };
    }

    // --- INICIALIZACIÓN ---
    initNoticias();
    registrarServiceWorker();
    if ("Notification" in window && Notification.permission === "granted") iniciarMonitoreoNoticias();

    // --- FORZAR ESTADO INICIAL PiP (ESPERA A QUE LA APP CARGUE) ---
    setTimeout(() => {
        updatePiPStatus(true);
    }, 800);
    
});
window.abrirEnlace = function(url) {
    // Esto fuerza a que el enlace se abra fuera del WebView (en la app correspondiente o navegador)
    window.open(url, '_system');
};