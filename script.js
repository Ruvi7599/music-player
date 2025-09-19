/**
 * Modern Music Player with Advanced Features
 * Features: Audio visualizer, theme switching, drag & drop, keyboard shortcuts, etc.
 */

class ModernMusicPlayer {
    constructor() {
        // Audio and state management
        this.audioPlayer = document.getElementById('audioPlayer');
        this.playlist = [];
        this.filteredPlaylist = [];
        this.currentTrackIndex = 0;
        this.isPlaying = false;
        this.isShuffling = false;
        this.repeatMode = 0; // 0: no repeat, 1: repeat all, 2: repeat one
        this.volume = 0.7;
        this.isDragging = false;
        this.currentTheme = localStorage.getItem('musicPlayerTheme') || 'dark';
        
        // Initialize components
        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
        this.setupVisualizer();
        this.initializeDefaultPlaylist();
        
        // Apply saved theme
        this.applyTheme();
        
        console.log('Modern Music Player initialized');
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.elements = {
            // Controls
            playBtn: document.getElementById('playBtn'),
            prevBtn: document.getElementById('prevBtn'),
            nextBtn: document.getElementById('nextBtn'),
            shuffleBtn: document.getElementById('shuffleBtn'),
            repeatBtn: document.getElementById('repeatBtn'),
            
            // Play icon
            playIcon: document.getElementById('playIcon'),
            
            // Progress
            progressBar: document.getElementById('progressBar'),
            progressFill: document.getElementById('progressFill'),
            progressHandle: document.getElementById('progressHandle'),
            currentTime: document.getElementById('currentTime'),
            totalTime: document.getElementById('totalTime'),
            
            // Volume
            volumeBtn: document.getElementById('volumeBtn'),
            volumeSlider: document.getElementById('volumeSlider'),
            volumeFill: document.getElementById('volumeFill'),
            volumeIcon: document.getElementById('volumeIcon'),
            volumePercentage: document.getElementById('volumePercentage'),
            
            // Song info
            albumArt: document.getElementById('albumArt'),
            songTitle: document.getElementById('songTitle'),
            songArtist: document.getElementById('songArtist'),
            songAlbum: document.getElementById('songAlbum'),
            
            // Playlist
            playlist: document.getElementById('playlist'),
            searchInput: document.getElementById('searchInput'),
            clearPlaylistBtn: document.getElementById('clearPlaylistBtn'),
            emptyPlaylist: document.getElementById('emptyPlaylist'),
            
            // File upload
            fileInput: document.getElementById('fileInput'),
            addMusicBtn: document.getElementById('addMusicBtn'),
            
            // Theme and UI
            themeToggle: document.getElementById('themeToggle'),
            themeIcon: document.getElementById('themeIcon'),
            audioVisualizer: document.getElementById('audioVisualizer'),
            vinylOverlay: document.querySelector('.vinyl-overlay'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            toastContainer: document.getElementById('toastContainer')
        };
    }

    /**
     * Bind all event listeners
     */
    bindEvents() {
        // Playback controls
        this.elements.playBtn.addEventListener('click', () => this.togglePlay());
        this.elements.prevBtn.addEventListener('click', () => this.previousTrack());
        this.elements.nextBtn.addEventListener('click', () => this.nextTrack());
        this.elements.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        this.elements.repeatBtn.addEventListener('click', () => this.toggleRepeat());

        // Audio events
        this.audioPlayer.addEventListener('loadedmetadata', () => this.onLoadedMetadata());
        this.audioPlayer.addEventListener('timeupdate', () => this.onTimeUpdate());
        this.audioPlayer.addEventListener('ended', () => this.onTrackEnded());
        this.audioPlayer.addEventListener('error', (e) => this.onAudioError(e));
        this.audioPlayer.addEventListener('loadstart', () => this.showLoading());
        this.audioPlayer.addEventListener('canplaythrough', () => this.hideLoading());

        // Progress bar events (mouse and touch)
        this.elements.progressBar.addEventListener('mousedown', (e) => this.onProgressMouseDown(e));
        this.elements.progressBar.addEventListener('touchstart', (e) => this.onProgressTouchStart(e), { passive: false });
        this.elements.progressBar.addEventListener('mousemove', (e) => this.onProgressMouseMove(e));
        this.elements.progressBar.addEventListener('touchmove', (e) => this.onProgressTouchMove(e), { passive: false });
        this.elements.progressBar.addEventListener('mouseup', () => this.onProgressMouseUp());
        this.elements.progressBar.addEventListener('touchend', () => this.onProgressTouchEnd());
        this.elements.progressBar.addEventListener('mouseleave', () => this.onProgressMouseUp());
        this.elements.progressBar.addEventListener('click', (e) => this.onProgressClick(e));

        // Volume controls
        this.elements.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
        this.elements.volumeBtn.addEventListener('click', () => this.toggleMute());

        // File upload
        this.elements.addMusicBtn.addEventListener('click', () => this.elements.fileInput.click());
        this.elements.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));

        // Playlist controls
        this.elements.searchInput.addEventListener('input', (e) => this.searchPlaylist(e.target.value));
        this.elements.clearPlaylistBtn.addEventListener('click', () => this.clearPlaylist());

        // Theme toggle
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Keyboard shortcuts (only on desktop)
        if (!this.isMobileDevice()) {
            document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        }

        // Prevent default drag behavior on document
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => {
            e.preventDefault();
            this.handleFileDrop(e);
        });

        // Handle window resize for better responsiveness
        window.addEventListener('resize', () => this.handleResize());
        
        // Handle orientation change on mobile
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleResize(), 100);
        });
    }

    /**
     * Check if device is mobile
     */
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
            || ('ontouchstart' in window) 
            || (navigator.maxTouchPoints > 0);
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Update visualizer if needed
        if (this.isPlaying) {
            this.updateVisualizer();
        }
        
        // Adjust layout if in landscape mode on mobile
        if (this.isMobileDevice() && window.innerHeight < 500) {
            document.body.classList.add('landscape-mobile');
        } else {
            document.body.classList.remove('landscape-mobile');
        }
    }

    /**
     * Touch event handlers for progress bar
     */
    onProgressTouchStart(e) {
        e.preventDefault();
        this.isDragging = true;
        this.elements.progressBar.classList.add('dragging');
        const touch = e.touches[0];
        this.setProgressFromPosition(touch.clientX);
    }

    onProgressTouchMove(e) {
        if (this.isDragging) {
            e.preventDefault();
            const touch = e.touches[0];
            this.setProgressFromPosition(touch.clientX);
        }
    }

    onProgressTouchEnd() {
        this.isDragging = false;
        this.elements.progressBar.classList.remove('dragging');
    }

    /**
     * Progress bar mouse events
     */
    onProgressMouseDown(e) {
        if (this.isMobileDevice()) return; // Use touch events on mobile
        this.isDragging = true;
        this.elements.progressBar.classList.add('dragging');
        this.setProgressFromPosition(e.clientX);
    }

    onProgressMouseMove(e) {
        if (this.isDragging && !this.isMobileDevice()) {
            this.setProgressFromPosition(e.clientX);
        }
    }

    onProgressMouseUp() {
        if (!this.isMobileDevice()) {
            this.isDragging = false;
            this.elements.progressBar.classList.remove('dragging');
        }
    }

    onProgressClick(e) {
        if (!this.isDragging) {
            this.setProgressFromPosition(e.clientX);
        }
    }

    /**
     * Set progress based on position
     */
    setProgressFromPosition(clientX) {
        if (!this.audioPlayer.duration) return;

        const rect = this.elements.progressBar.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const time = percent * this.audioPlayer.duration;
        
        this.audioPlayer.currentTime = time;
        this.elements.progressFill.style.width = (percent * 100) + '%';
        this.elements.currentTime.textContent = this.formatTime(time);
    }

    /**
     * Set progress based on click/drag position (legacy method)
     */
    setProgress(e) {
        this.setProgressFromPosition(e.clientX);
    }

    /**
     * Initialize default playlist with demo tracks
     */
    initializeDefaultPlaylist() {
        // Note: In a real application, you would load actual audio files
        const defaultTracks = [
            {
                id: this.generateId(),
                title: "Welcome Song",
                artist: "Music Player",
                album: "Demo Album",
                duration: "0:30",
                src: this.generateDemoAudio(30), // 30 seconds demo
                cover: null
            }
        ];

        // Only add default if no saved playlist exists
        const savedPlaylist = localStorage.getItem('musicPlayerPlaylist');
        if (!savedPlaylist) {
            this.playlist = defaultTracks;
            this.filteredPlaylist = [...this.playlist];
            this.renderPlaylist();
            this.showToast('Welcome! Add your music files to get started.', 'success');
        } else {
            try {
                this.playlist = JSON.parse(savedPlaylist);
                this.filteredPlaylist = [...this.playlist];
                this.renderPlaylist();
                if (this.playlist.length > 0) {
                    this.loadTrack(0, false);
                }
            } catch (error) {
                console.error('Error loading saved playlist:', error);
                this.playlist = defaultTracks;
                this.filteredPlaylist = [...this.playlist];
                this.renderPlaylist();
            }
        }
    }

    /**
     * Generate a simple demo audio (silence) for demonstration
     */
    generateDemoAudio(duration) {
        // Create a very short silent audio data URL
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const sampleRate = audioContext.sampleRate;
        const numSamples = duration * sampleRate;
        const buffer = audioContext.createBuffer(2, numSamples, sampleRate);
        
        // Fill with very quiet sine wave for demo
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < numSamples; i++) {
                channelData[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.1;
            }
        }

        // Convert to WAV (simplified - in reality you'd use a proper WAV encoder)
        return 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTaZ2O7MdCcFI3fH8N2QQAoUXrTp66hVFApGn+DyvmwhBTaZ2O7MdCcFI3fH8N2QQAoUXrTp66hVFApGn+DyvmwhBTaZ2O7MdCcFI3fH8N2QQAoUXrTp66hVFApGn+DyvmwhBTaZ2O7MdCcFI3fH8N2QQAoUXrTp66hVFApGn+DyvmwhBTaZ2O7MdCcFI3fH8N2QQAoUXrTp66hVFApGn+DyvmzhBTaZ2O7MdCcFI3fH8N2QQAoUXrTp66hVFApGn+DyvmwhBTaZ2O7MdCcFI3fH8N2QQAoUXrTp66hVFApGn+DyvmwhBTaZ2O7MdCcFI3fH8N2QQAoUXrTp66hVFApGn+DyvmwhBTaZ2O7MdCcFI3fH8N2QQAoUXrTp66hVFApGn+DyvmwhBTaZ2O7MdCcFI3fH8N2QQAoUXrTp66hVFApGn+DyvmwhBTaZ2O7MdCcFI3fH8N2QQAoUXrTp66hVFApGn+DyvmwhBTaZ2O7MdCcFI3fH8N2QQAoUXrTp66hVFApGn+DyvmwhBTaZ2O7MdCcFI3fH8N2QQAoUXrTp66hVFApGn+DyvmwhBTaZ2O7MdCcFI3fH8N2QQAoUXrTp66hVFApGn+DyvmwhBTaZ2O7MdCcFI3fH8N2QQAoUXrTp66hVFApGn+DyvmwhBTaZ2O7MdCcFI3fH8N2QQAoUXrTp66hVFApGn+DyvmwhBTaZ2O7MdCcFI3fH8N2QQAoUXrTp66hVFApGn+DyvmwhBTaZ2O7MdCcFI3fH8N2QQAoUXrTp66hVFApGn+DyvmwhBTaZ2O7MdCcFI3fH8N2QQAoUXrTp66hVFApGn+DyvmzhBTaZ2O7MdCcFI3fH8N2QQAoUXrTp66hVFApGn+DyvmwhBTaZ2O7MdCcFI';
    }

    /**
     * Setup audio visualizer
     */
    setupVisualizer() {
        this.visualizerBars = document.querySelectorAll('.visualizer-bar');
        this.visualizerInterval = null;
        
        // Create audio context for better visualization (when user interacts)
        this.audioContext = null;
        this.analyser = null;
        this.source = null;
    }

    /**
     * Start visualizer animation
     */
    startVisualizer() {
        this.elements.audioVisualizer.classList.add('active');
        
        if (!this.visualizerInterval) {
            this.visualizerInterval = setInterval(() => {
                this.updateVisualizer();
            }, 150);
        }
    }

    /**
     * Stop visualizer animation
     */
    stopVisualizer() {
        this.elements.audioVisualizer.classList.remove('active');
        
        if (this.visualizerInterval) {
            clearInterval(this.visualizerInterval);
            this.visualizerInterval = null;
        }
    }

    /**
     * Update visualizer bars with random animation (simulated)
     */
    updateVisualizer() {
        if (!this.isPlaying) return;
        
        this.visualizerBars.forEach((bar, index) => {
            const height = Math.random() * 40 + 10;
            bar.style.height = height + 'px';
            bar.style.opacity = (height / 50) + 0.3;
        });
    }

    /**
     * Toggle play/pause
     */
    togglePlay() {
        if (this.playlist.length === 0) {
            this.showToast('No songs in playlist. Add some music first!', 'warning');
            return;
        }

        if (this.audioPlayer.paused) {
            this.play();
        } else {
            this.pause();
        }
    }

    /**
     * Play current track
     */
    async play() {
        try {
            await this.audioPlayer.play();
            this.isPlaying = true;
            this.elements.playIcon.className = 'fas fa-pause';
            this.elements.albumArt.classList.add('playing');
            this.elements.vinylOverlay.classList.add('spinning');
            this.startVisualizer();
            
            // Update media session
            this.updateMediaSession();
        } catch (error) {
            console.error('Error playing audio:', error);
            this.showToast('Error playing audio. Please try another file.', 'error');
        }
    }

    /**
     * Pause current track
     */
    pause() {
        this.audioPlayer.pause();
        this.isPlaying = false;
        this.elements.playIcon.className = 'fas fa-play';
        this.elements.albumArt.classList.remove('playing');
        this.elements.vinylOverlay.classList.remove('spinning');
        this.stopVisualizer();
    }

    /**
     * Load and optionally play a track
     */
    loadTrack(index, autoPlay = false) {
        if (index < 0 || index >= this.filteredPlaylist.length) return;

        const track = this.filteredPlaylist[index];
        if (!track) return;

        this.currentTrackIndex = index;

        // Update UI
        this.elements.songTitle.textContent = track.title;
        this.elements.songArtist.textContent = track.artist;
        this.elements.songAlbum.textContent = track.album;
        
        // Update album art
        if (track.cover) {
            this.elements.albumArt.src = track.cover;
        } else {
            this.elements.albumArt.src = this.getDefaultAlbumArt();
        }

        // Load audio
        this.audioPlayer.src = track.src;
        this.audioPlayer.load();

        // Update active track in playlist
        this.updateActiveTrack(index);

        // Auto play if requested
        if (autoPlay) {
            this.audioPlayer.addEventListener('canplaythrough', () => {
                this.play();
            }, { once: true });
        }

        // Save current track
        localStorage.setItem('musicPlayerCurrentTrack', index.toString());
    }

    /**
     * Get default album art SVG
     */
    getDefaultAlbumArt() {
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%236366f1'/%3E%3Cstop offset='100%25' stop-color='%23ec4899'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grad)'/%3E%3Ccircle cx='150' cy='150' r='20' fill='%23ffffff' opacity='0.3'/%3E%3Ctext x='150' y='160' text-anchor='middle' fill='%23ffffff' font-family='Arial' font-size='20' font-weight='bold'%3E♪%3C/text%3E%3C/svg%3E";
    }

    /**
     * Play next track
     */
    nextTrack() {
        if (this.filteredPlaylist.length === 0) return;

        let nextIndex;
        
        if (this.isShuffling) {
            nextIndex = this.getRandomTrackIndex();
        } else if (this.currentTrackIndex < this.filteredPlaylist.length - 1) {
            nextIndex = this.currentTrackIndex + 1;
        } else {
            nextIndex = 0; // Loop to beginning
        }

        this.loadTrack(nextIndex, true);
    }

    /**
     * Play previous track
     */
    previousTrack() {
        if (this.filteredPlaylist.length === 0) return;

        let prevIndex;
        
        if (this.currentTrackIndex > 0) {
            prevIndex = this.currentTrackIndex - 1;
        } else {
            prevIndex = this.filteredPlaylist.length - 1; // Loop to end
        }

        this.loadTrack(prevIndex, true);
    }

    /**
     * Toggle shuffle mode
     */
    toggleShuffle() {
        this.isShuffling = !this.isShuffling;
        
        if (this.isShuffling) {
            this.elements.shuffleBtn.classList.add('active');
            this.showToast('Shuffle enabled', 'success');
        } else {
            this.elements.shuffleBtn.classList.remove('active');
            this.showToast('Shuffle disabled', 'success');
        }

        localStorage.setItem('musicPlayerShuffle', this.isShuffling.toString());
    }

    /**
     * Toggle repeat mode
     */
    toggleRepeat() {
        this.repeatMode = (this.repeatMode + 1) % 3;
        
        const modes = ['off', 'all', 'one'];
        const mode = modes[this.repeatMode];
        
        this.elements.repeatBtn.classList.remove('active');
        
        switch (this.repeatMode) {
            case 0:
                this.showToast('Repeat off', 'success');
                break;
            case 1:
                this.elements.repeatBtn.classList.add('active');
                this.showToast('Repeat all', 'success');
                break;
            case 2:
                this.elements.repeatBtn.classList.add('active');
                this.showToast('Repeat one', 'success');
                break;
        }

        localStorage.setItem('musicPlayerRepeat', this.repeatMode.toString());
    }

    /**
     * Get random track index (excluding current)
     */
    getRandomTrackIndex() {
        if (this.filteredPlaylist.length <= 1) return 0;
        
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * this.filteredPlaylist.length);
        } while (randomIndex === this.currentTrackIndex);
        
        return randomIndex;
    }

    /**
     * Handle file upload
     */
    handleFileUpload(event) {
        const files = Array.from(event.target.files);
        this.addFilesToPlaylist(files);
        event.target.value = ''; // Reset input
    }

    /**
     * Handle file drop
     */
    handleFileDrop(event) {
        const files = Array.from(event.dataTransfer.files);
        const audioFiles = files.filter(file => file.type.startsWith('audio/'));
        
        if (audioFiles.length > 0) {
            this.addFilesToPlaylist(audioFiles);
        } else {
            this.showToast('Please drop audio files only', 'warning');
        }
    }

    /**
     * Add files to playlist
     */
    async addFilesToPlaylist(files) {
        if (files.length === 0) return;

        this.showLoading();

        for (const file of files) {
            if (file.type.startsWith('audio/')) {
                const track = await this.createTrackFromFile(file);
                this.playlist.push(track);
            }
        }

        this.filteredPlaylist = [...this.playlist];
        this.renderPlaylist();
        this.savePlaylist();
        this.hideLoading();

        const message = files.length === 1 ? 
            `Added "${files[0].name}" to playlist` : 
            `Added ${files.length} songs to playlist`;
        
        this.showToast(message, 'success');

        // If this is the first song and nothing is loaded, load it
        if (this.playlist.length === files.length && !this.audioPlayer.src) {
            this.loadTrack(0);
        }
    }

    /**
     * Create track object from file
     */
    async createTrackFromFile(file) {
        const url = URL.createObjectURL(file);
        const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
        
        // Extract metadata if possible
        const metadata = await this.extractMetadata(file);
        
        return {
            id: this.generateId(),
            title: metadata.title || fileName,
            artist: metadata.artist || 'Unknown Artist',
            album: metadata.album || 'Unknown Album',
            duration: metadata.duration || '0:00',
            src: url,
            cover: metadata.cover || null,
            file: file // Keep reference for cleanup
        };
    }

    /**
     * Extract basic metadata from audio file
     */
    async extractMetadata(file) {
        return new Promise((resolve) => {
            const audio = new Audio();
            const url = URL.createObjectURL(file);
            
            audio.addEventListener('loadedmetadata', () => {
                const duration = this.formatTime(audio.duration);
                URL.revokeObjectURL(url);
                
                resolve({
                    duration: duration,
                    title: null,
                    artist: null,
                    album: null,
                    cover: null
                });
            });

            audio.addEventListener('error', () => {
                URL.revokeObjectURL(url);
                resolve({
                    duration: '0:00',
                    title: null,
                    artist: null,
                    album: null,
                    cover: null
                });
            });

            audio.src = url;
        });
    }

    /**
     * Render playlist
     */
    renderPlaylist() {
        const playlistElement = this.elements.playlist;
        const emptyElement = this.elements.emptyPlaylist;

        if (this.filteredPlaylist.length === 0) {
            playlistElement.style.display = 'none';
            emptyElement.style.display = 'flex';
            return;
        }

        playlistElement.style.display = 'block';
        emptyElement.style.display = 'none';
        playlistElement.innerHTML = '';

        this.filteredPlaylist.forEach((track, index) => {
            const li = document.createElement('li');
            li.className = 'playlist-item';
            li.dataset.index = index;

            li.innerHTML = `
                <div class="track-number">${(index + 1).toString().padStart(2, '0')}</div>
                <img class="track-cover" src="${track.cover || this.getDefaultAlbumArt()}" alt="Album cover">
                <div class="track-info">
                    <div class="track-title">${this.escapeHtml(track.title)}</div>
                    <div class="track-artist">${this.escapeHtml(track.artist)}</div>
                </div>
                <div class="track-duration">${track.duration}</div>
                <div class="track-actions">
                    <button class="track-action-btn" data-action="remove" title="Remove from playlist">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;

            // Add click event to play track
            li.addEventListener('click', (e) => {
                if (!e.target.closest('.track-action-btn')) {
                    this.loadTrack(index, true);
                }
            });

            // Add remove button event
            const removeBtn = li.querySelector('[data-action="remove"]');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeTrack(index);
            });

            playlistElement.appendChild(li);
        });

        // Update active track
        this.updateActiveTrack(this.currentTrackIndex);
    }

    /**
     * Update active track visual indicator
     */
    updateActiveTrack(index) {
        const items = this.elements.playlist.querySelectorAll('.playlist-item');
        items.forEach(item => item.classList.remove('active'));
        
        const activeItem = this.elements.playlist.querySelector(`[data-index="${index}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    /**
     * Remove track from playlist
     */
    removeTrack(index) {
        if (index < 0 || index >= this.filteredPlaylist.length) return;

        const track = this.filteredPlaylist[index];
        
        // Find original index in main playlist
        const originalIndex = this.playlist.findIndex(t => t.id === track.id);
        if (originalIndex !== -1) {
            // Revoke object URL to prevent memory leaks
            if (track.src && track.src.startsWith('blob:')) {
                URL.revokeObjectURL(track.src);
            }
            
            this.playlist.splice(originalIndex, 1);
        }

        // Update filtered playlist
        this.filteredPlaylist.splice(index, 1);

        // Adjust current track index
        if (this.currentTrackIndex === index) {
            // Current track was removed
            if (this.filteredPlaylist.length > 0) {
                const newIndex = Math.min(index, this.filteredPlaylist.length - 1);
                this.loadTrack(newIndex, this.isPlaying);
            } else {
                // No tracks left
                this.pause();
                this.resetPlayer();
            }
        } else if (this.currentTrackIndex > index) {
            this.currentTrackIndex--;
        }

        this.renderPlaylist();
        this.savePlaylist();
        this.showToast(`Removed "${track.title}"`, 'success');
    }

    /**
     * Search playlist
     */
    searchPlaylist(query) {
        const searchTerm = query.toLowerCase().trim();
        
        if (!searchTerm) {
            this.filteredPlaylist = [...this.playlist];
        } else {
            this.filteredPlaylist = this.playlist.filter(track => 
                track.title.toLowerCase().includes(searchTerm) ||
                track.artist.toLowerCase().includes(searchTerm) ||
                track.album.toLowerCase().includes(searchTerm)
            );
        }

        this.renderPlaylist();
    }

    /**
     * Clear entire playlist
     */
    clearPlaylist() {
        if (this.playlist.length === 0) return;

        if (confirm('Are you sure you want to clear the entire playlist?')) {
            // Revoke all object URLs
            this.playlist.forEach(track => {
                if (track.src && track.src.startsWith('blob:')) {
                    URL.revokeObjectURL(track.src);
                }
            });

            this.playlist = [];
            this.filteredPlaylist = [];
            this.pause();
            this.resetPlayer();
            this.renderPlaylist();
            this.savePlaylist();
            this.showToast('Playlist cleared', 'success');
        }
    }

    /**
     * Reset player to default state
     */
    resetPlayer() {
        this.elements.songTitle.textContent = 'Choose a song';
        this.elements.songArtist.textContent = 'Unknown Artist';
        this.elements.songAlbum.textContent = 'Unknown Album';
        this.elements.albumArt.src = this.getDefaultAlbumArt();
        this.elements.currentTime.textContent = '0:00';
        this.elements.totalTime.textContent = '0:00';
        this.elements.progressFill.style.width = '0%';
        this.audioPlayer.src = '';
        this.currentTrackIndex = 0;
    }

    /**
     * Set volume
     */
    setVolume(value) {
        this.volume = Math.max(0, Math.min(100, value)) / 100;
        this.audioPlayer.volume = this.volume;
        
        this.elements.volumeFill.style.width = (this.volume * 100) + '%';
        this.elements.volumePercentage.textContent = Math.round(this.volume * 100) + '%';
        
        // Update volume icon
        this.updateVolumeIcon();
        
        localStorage.setItem('musicPlayerVolume', this.volume.toString());
    }

    /**
     * Toggle mute
     */
    toggleMute() {
        if (this.audioPlayer.muted) {
            this.audioPlayer.muted = false;
            this.elements.volumeSlider.value = this.volume * 100;
        } else {
            this.audioPlayer.muted = true;
            this.elements.volumeSlider.value = 0;
        }
        
        this.updateVolumeIcon();
        this.elements.volumeFill.style.width = (this.audioPlayer.muted ? 0 : this.volume * 100) + '%';
        this.elements.volumePercentage.textContent = (this.audioPlayer.muted ? 0 : Math.round(this.volume * 100)) + '%';
    }

    /**
     * Update volume icon based on level
     */
    updateVolumeIcon() {
        const icon = this.elements.volumeIcon;
        const volume = this.audioPlayer.muted ? 0 : this.volume;
        
        if (volume === 0) {
            icon.className = 'fas fa-volume-mute';
        } else if (volume < 0.5) {
            icon.className = 'fas fa-volume-down';
        } else {
            icon.className = 'fas fa-volume-up';
        }
    }

    /**
     * Toggle theme
     */
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme();
        localStorage.setItem('musicPlayerTheme', this.currentTheme);
    }

    /**
     * Apply theme
     */
    applyTheme() {
        if (this.currentTheme === 'light') {
            document.body.classList.add('light-theme');
            this.elements.themeIcon.className = 'fas fa-moon';
        } else {
            document.body.classList.remove('light-theme');
            this.elements.themeIcon.className = 'fas fa-sun';
        }
    }

    /**
     * Progress bar mouse events
     */
    onProgressMouseDown(e) {
        this.isDragging = true;
        this.elements.progressBar.classList.add('dragging');
        this.setProgress(e);
    }

    onProgressMouseMove(e) {
        if (this.isDragging) {
            this.setProgress(e);
        }
    }

    onProgressMouseUp() {
        this.isDragging = false;
        this.elements.progressBar.classList.remove('dragging');
    }

    /**
     * Set progress based on click/drag position
     */
    setProgress(e) {
        if (!this.audioPlayer.duration) return;

        const rect = this.elements.progressBar.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const time = percent * this.audioPlayer.duration;
        
        this.audioPlayer.currentTime = time;
        this.elements.progressFill.style.width = (percent * 100) + '%';
        this.elements.currentTime.textContent = this.formatTime(time);
    }

    /**
     * Audio event handlers
     */
    onLoadedMetadata() {
        this.elements.totalTime.textContent = this.formatTime(this.audioPlayer.duration);
    }

    onTimeUpdate() {
        if (!this.isDragging && this.audioPlayer.duration) {
            const percent = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
            this.elements.progressFill.style.width = percent + '%';
            this.elements.currentTime.textContent = this.formatTime(this.audioPlayer.currentTime);
        }
    }

    onTrackEnded() {
        if (this.repeatMode === 2) {
            // Repeat one
            this.audioPlayer.currentTime = 0;
            this.play();
        } else if (this.repeatMode === 1 || this.currentTrackIndex < this.filteredPlaylist.length - 1) {
            // Repeat all or not last track
            this.nextTrack();
        } else {
            // End of playlist
            this.pause();
            this.audioPlayer.currentTime = 0;
        }
    }

    onAudioError(e) {
        console.error('Audio error:', e);
        this.showToast('Error playing audio file', 'error');
        this.pause();
    }

    /**
     * Keyboard shortcuts
     */
    handleKeyboardShortcuts(e) {
        // Don't trigger shortcuts when typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlay();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.audioPlayer.currentTime = Math.min(
                    this.audioPlayer.duration || 0,
                    this.audioPlayer.currentTime + 10
                );
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.audioPlayer.currentTime = Math.max(0, this.audioPlayer.currentTime - 10);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.setVolume(Math.min(100, this.volume * 100 + 5));
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.setVolume(Math.max(0, this.volume * 100 - 5));
                break;
            case 'KeyN':
                e.preventDefault();
                this.nextTrack();
                break;
            case 'KeyP':
                e.preventDefault();
                this.previousTrack();
                break;
            case 'KeyS':
                e.preventDefault();
                this.toggleShuffle();
                break;
            case 'KeyR':
                e.preventDefault();
                this.toggleRepeat();
                break;
            case 'KeyM':
                e.preventDefault();
                this.toggleMute();
                break;
            case 'KeyT':
                e.preventDefault();
                this.toggleTheme();
                break;
        }
    }

    /**
     * Media Session API for browser media controls
     */
    updateMediaSession() {
        if ('mediaSession' in navigator && this.filteredPlaylist[this.currentTrackIndex]) {
            const track = this.filteredPlaylist[this.currentTrackIndex];
            
            navigator.mediaSession.metadata = new MediaMetadata({
                title: track.title,
                artist: track.artist,
                album: track.album,
                artwork: track.cover ? [{ src: track.cover }] : []
            });

            navigator.mediaSession.setActionHandler('play', () => this.play());
            navigator.mediaSession.setActionHandler('pause', () => this.pause());
            navigator.mediaSession.setActionHandler('previoustrack', () => this.previousTrack());
            navigator.mediaSession.setActionHandler('nexttrack', () => this.nextTrack());
        }
    }

    /**
     * Utility functions
     */
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showLoading() {
        this.elements.loadingOverlay.classList.add('active');
    }

    hideLoading() {
        this.elements.loadingOverlay.classList.remove('active');
    }

    /**
     * Toast notification system
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${this.getToastIcon(type)}"></i>
            <span>${message}</span>
        `;

        this.elements.toastContainer.appendChild(toast);

        // Trigger show animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    getToastIcon(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            default: return 'info-circle';
        }
    }

    /**
     * Save/Load settings
     */
    savePlaylist() {
        // Only save tracks that aren't blob URLs (can't persist across sessions)
        const saveablePlaylist = this.playlist.filter(track => !track.src.startsWith('blob:'));
        localStorage.setItem('musicPlayerPlaylist', JSON.stringify(saveablePlaylist));
    }

    loadSettings() {
        // Load volume
        const savedVolume = localStorage.getItem('musicPlayerVolume');
        if (savedVolume) {
            this.setVolume(parseFloat(savedVolume) * 100);
            this.elements.volumeSlider.value = this.volume * 100;
        } else {
            this.setVolume(70);
            this.elements.volumeSlider.value = 70;
        }

        // Load shuffle state
        const savedShuffle = localStorage.getItem('musicPlayerShuffle');
        if (savedShuffle === 'true') {
            this.isShuffling = true;
            this.elements.shuffleBtn.classList.add('active');
        }

        // Load repeat mode
        const savedRepeat = localStorage.getItem('musicPlayerRepeat');
        if (savedRepeat) {
            this.repeatMode = parseInt(savedRepeat);
            if (this.repeatMode > 0) {
                this.elements.repeatBtn.classList.add('active');
            }
        }

        // Load current track
        const savedTrack = localStorage.getItem('musicPlayerCurrentTrack');
        if (savedTrack && this.playlist.length > 0) {
            const trackIndex = parseInt(savedTrack);
            if (trackIndex >= 0 && trackIndex < this.playlist.length) {
                this.loadTrack(trackIndex, false);
            }
        }
    }
}

// Initialize the music player when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.musicPlayer = new ModernMusicPlayer();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.musicPlayer) {
        // Revoke any blob URLs to prevent memory leaks
        window.musicPlayer.playlist.forEach(track => {
            if (track.src && track.src.startsWith('blob:')) {
                URL.revokeObjectURL(track.src);
            }
        });
    }
});