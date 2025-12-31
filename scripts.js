document.addEventListener('DOMContentLoaded', function() {
    console.log('Site carregado!');

    // Function to run Python code
    async function runCode() {
        const code = editor.getValue(); // Get the code from the editor
        try {
            const response = await fetch('/run_python', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code: code })
            });
            const result = await response.text();
            document.getElementById('output').innerText = result; // Display the result in the output div
        } catch (error) {
            document.getElementById('output').innerText = "Erro ao executar o código: " + error;
        }
    }

    // Menu toggle
    const toggleBtn = document.querySelector('.toggle-submenu');
    const submenu = document.querySelector('.social-submenu');

    if (toggleBtn && submenu) {
        toggleBtn.addEventListener('click', function() {
            submenu.classList.toggle('minimized');
            toggleBtn.classList.toggle('minimized');
        });
    }

    // Sistema de reprodução automática
    const audioPlayer = document.getElementById('bgMusic'); // Ensure this references the audio player directly without a container

    if (audioPlayer) {
        // Forçar reprodução automática
        const playAudio = () => {
            const playPromise = audioPlayer.play();
            if (playPromise !== undefined) {
                playPromise.then(_ => {
                    // Reprodução iniciada com sucesso
                    localStorage.setItem('audioPlaying', 'true');
                    localStorage.setItem('audioTime', audioPlayer.currentTime);
                })
                .catch(error => {
                    // Tentar novamente após interação do usuário
                    document.addEventListener('click', function tryPlayAgain() {
                        audioPlayer.play();
                        document.removeEventListener('click', tryPlayAgain);
                    }, { once: true });
                });
            }
        };

        // Tentar reproduzir imediatamente e definir o volume para 50%
        audioPlayer.volume = 0.5;

        playAudio();

        // Garantir que o áudio continue após navegação
        window.addEventListener('pageshow', () => {
            if (localStorage.getItem('audioPlaying') === 'true') {
                playAudio();
            }
        });
    }

    // Sistema de reprodução contínua entre páginas
    if (audioPlayer) {
        // Configuração inicial do player
        audioPlayer.addEventListener('loadedmetadata', () => {
            const lastTime = parseFloat(localStorage.getItem('audioTime')) || 0;
            audioPlayer.currentTime = lastTime;
            
            if (localStorage.getItem('audioPlaying') === 'true') {
                const playPromise = audioPlayer.play().catch(error => {
                    console.log("Erro ao reproduzir áudio:", error);
                });
            }
        });

        // Eventos para manter estado entre páginas
        ['play', 'pause', 'timeupdate'].forEach(event => {
            audioPlayer.addEventListener(event, () => {
                localStorage.setItem('audioPlaying', !audioPlayer.paused);
                localStorage.setItem('audioTime', audioPlayer.currentTime);
            });
        });

        // Prevenir pausa durante navegação
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && localStorage.getItem('audioPlaying') === 'true') {
                audioPlayer.play();
            }
        });

        // Gerenciar navegação entre páginas
        window.addEventListener('beforeunload', () => {
            localStorage.setItem('audioTime', audioPlayer.currentTime);
            localStorage.setItem('audioPlaying', !audioPlayer.paused);
        });

        // Restaurar volume
        const savedVolume = localStorage.getItem('audioVolume');
        if (savedVolume !== null) {
            audioPlayer.volume = parseFloat(savedVolume);
        }

        // Salvar volume
        audioPlayer.addEventListener('volumechange', () => {
            localStorage.setItem('audioVolume', audioPlayer.volume);
        });
    }

    // Sistema de reprodução sincronizada
    if (audioPlayer) {
        // Sincronizar reprodução entre páginas
        const sync = () => {
            const currentTime = parseFloat(localStorage.getItem('audioTime')) || 0;
            const isPlaying = localStorage.getItem('audioPlaying') === 'true';
            
            // Ajustar tempo com precisão
            if (Math.abs(audioPlayer.currentTime - currentTime) > 0.5) {
                audioPlayer.currentTime = currentTime;
            }

            if (isPlaying && audioPlayer.paused) {
                const playPromise = audioPlayer.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => console.log("Erro ao sincronizar:", error));
                }
            } else if (!isPlaying && !audioPlayer.paused) {
                audioPlayer.pause();
            }
        };

        // Sincronizar a cada segundo
        setInterval(sync, 1000);

        // Eventos para salvar estado
        ['play', 'pause', 'timeupdate'].forEach(event => {
            audioPlayer.addEventListener(event, () => {
                localStorage.setItem('audioPlaying', !audioPlayer.paused);
                localStorage.setItem('audioTime', audioPlayer.currentTime);
            });
        });

        // Sincronizar ao carregar a página
        sync();

        // Restaurar volume
        const savedVolume = localStorage.getItem('audioVolume');
        if (savedVolume !== null) {
            audioPlayer.volume = parseFloat(savedVolume);
        }

        // Salvar volume
        audioPlayer.addEventListener('volumechange', () => {
            localStorage.setItem('audioVolume', audioPlayer.volume);
        });
    }


    // Galeria de Imagens - Lightbox
    const images = document.querySelectorAll('.image-gallery img'); // Seleciona todas as imagens na galeria
    let currentImageIndex = 0;
    let isEnlarged = false;
    let overlay;
    let enlargedImg; // Variável para a imagem ampliada
    let closeButton; // Variável para o botão de fechar
    let prevButton; // Variável para o botão anterior
    let nextButton; // Variável para o botão seguinte

    // Keyboard navigation handler
    function handleKeyDown(event) {
        if (!isEnlarged) return;
        if (event.key === 'ArrowLeft') {
            currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
            updateEnlargedImage();
        } else if (event.key === 'ArrowRight') {
            currentImageIndex = (currentImageIndex + 1) % images.length;
            updateEnlargedImage();
        } else if (event.key === 'Escape') {
            closeEnlargedView();
        }
    }

    images.forEach((image, index) => {
        image.addEventListener('dblclick', function() {
            currentImageIndex = index; // Define o índice da imagem clicada
            if (isEnlarged && overlay) {
                // If overlay is already open, just update the image source
                updateEnlargedImage();
            } else {
                enlargeImage();
            }
        });
    });

    function enlargeImage() {
        isEnlarged = true;

        // Criar o overlay
        overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
        overlay.style.zIndex = '999';
        document.body.appendChild(overlay);

        // Criar a imagem ampliada
        enlargedImg = document.createElement('img');
        enlargedImg.src = images[currentImageIndex].src;
        enlargedImg.style.maxWidth = '90%';
        enlargedImg.style.maxHeight = '90%';
        enlargedImg.style.position = 'absolute';
        enlargedImg.style.top = '50%';
        enlargedImg.style.left = '50%';
        enlargedImg.style.transform = 'translate(-50%, -50%)';
        enlargedImg.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';
        enlargedImg.style.borderRadius = '10px';
        overlay.appendChild(enlargedImg);

        // Criar o botão de fechar
        closeButton = document.createElement('button');
        closeButton.innerHTML = 'X';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px';
        closeButton.style.right = '10px';
        closeButton.style.background = 'rgba(0,0,0,0.5)';
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.padding = '10px 20px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.fontSize = '20px';
        overlay.appendChild(closeButton);

        // Adicionar evento de clique ao botão de fechar
        closeButton.addEventListener('click', closeEnlargedView);

        // Criar botões de navegação
        prevButton = createNavigationButton('←', 'left');
        nextButton = createNavigationButton('→', 'right');
        overlay.appendChild(prevButton);
        overlay.appendChild(nextButton);

        // Adicionar eventos de clique aos botões de navegação
        prevButton.addEventListener('click', () => {
            currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
            updateEnlargedImage(); // Atualiza a imagem ampliada
        });

        nextButton.addEventListener('click', () => {
            currentImageIndex = (currentImageIndex + 1) % images.length;
            updateEnlargedImage(); // Atualiza a imagem ampliada
        });

        // Add keyboard event listener
        document.addEventListener('keydown', handleKeyDown);
    }

    function closeEnlargedView() {
        isEnlarged = false;
        if (overlay) {
            document.body.removeChild(overlay);
            overlay = null;
            enlargedImg = null; // Limpa a referência à imagem ampliada
            closeButton = null; // Limpa a referência ao botão de fechar
            prevButton = null; // Limpa a referência ao botão anterior
            nextButton = null; // Limpa a referência ao botão seguinte
        }
        // Remove keyboard event listener
        document.removeEventListener('keydown', handleKeyDown);
    }

    function updateEnlargedImage() {
        if (enlargedImg) {
            enlargedImg.src = images[currentImageIndex].src; // Atualiza a fonte da imagem ampliada
        }
    }

    function createNavigationButton(text, side) {
        const button = document.createElement('button');
        button.innerHTML = text;
        button.style.position = 'absolute';
        button.style.top = '50%';
        button.style[side] = '10px';
        button.style.transform = 'translateY(-50%)';
        button.style.background = 'rgba(255,0,255,0.5)'; // Cor rosa
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.padding = '10px 20px';
        button.style.cursor = 'pointer';
        button.style.fontSize = '20px';
        return button;
    }
});
