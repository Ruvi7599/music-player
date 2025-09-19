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
    this.currentTrackIndex = -1; // -1 means no active track yet
    this.isPlaying = false;
    this.isShuffling = false;
    this.repeatMode = 0; // 0: no repeat, 1: repeat all, 2: repeat one
    this.volume = 0.7;
    this.isDragging = false;
    this.currentTheme = localStorage.getItem('musicPlayerTheme') || 'dark';

    // Cancellation / in-flight markers
    this.isCancelling = false;
    this._loadCanPlayHandler = null;

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
      loadingCancelBtn: document.getElementById('loadingCancelBtn'),
      toastContainer: document.getElementById('toastContainer'),

      // Reset button
      resetBtn: document.getElementById('resetBtn')
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
   // Audio events
this.audioPlayer.addEventListener('loadstart', () => {
  // Ignore fake loads (reset/cancel) or when nothing is selected
  if (this.isCancelling) return;
  if (!this.audioPlayer.src || this.currentTrackIndex === -1) return;
  this.showLoading();
});
this.audioPlayer.addEventListener('canplaythrough', () => this.hideLoading());

    this.audioPlayer.addEventListener('canplaythrough', () => this.hideLoading());

    // Progress bar events (mouse and touch)
    this.elements.progressBar.addEventListener('mousedown', (e) => this.onProgressMouseDown(e));
    this.elements.progressBar.addEventListener('mousemove', (e) => this.onProgressMouseMove(e));
    this.elements.progressBar.addEventListener('mouseup', () => this.onProgressMouseUp());
    this.elements.progressBar.addEventListener('mouseleave', () => this.onProgressMouseUp());
    this.elements.progressBar.addEventListener('click', (e) => this.onProgressClick(e));
    this.elements.progressBar.addEventListener('touchstart', (e) => this.onProgressTouchStart(e), { passive: false });
    this.elements.progressBar.addEventListener('touchmove', (e) => this.onProgressTouchMove(e), { passive: false });
    this.elements.progressBar.addEventListener('touchend', () => this.onProgressTouchEnd());

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


    // Reset button
      this.elements.resetBtn.addEventListener('click', () => this.fullReset());


    // Loading cancel button
    this.elements.loadingCancelBtn.addEventListener('click', () => this.cancelLoading());

    // Keyboard shortcuts (desktop only)
    if (!this.isMobileDevice()) {
      document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    // Drag & Drop
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => {
      e.preventDefault();
      this.handleFileDrop(e);
    });

    // Responsive tweaks
    window.addEventListener('resize', () => this.handleResize());
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
    if (this.isPlaying) this.updateVisualizer();

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
  fullReset() {
  // Guard against autoplay-on-ready
  this.isCancelling = true;
  if (this._loadCanPlayHandler) {
    this.audioPlayer.removeEventListener('canplaythrough', this._loadCanPlayHandler);
    this._loadCanPlayHandler = null;
  }

  // Stop everything + UI back to defaults
  this.resetPlayer(); // does: pause, clear UI, clear active track, stop visualizer, clear src

  // Clear playlist + UI
  this.playlist.forEach(track => { if (track.src?.startsWith('blob:')) URL.revokeObjectURL(track.src); });
  this.playlist = [];
  this.filteredPlaylist = [];
  this.renderPlaylist();            // refresh playlist UI
  this.savePlaylist();              // persists empty list

  // Clear saved settings/state (optional – keeps theme)
  localStorage.removeItem('musicPlayerCurrentTrack');
  localStorage.removeItem('musicPlayerShuffle');
  localStorage.removeItem('musicPlayerRepeat');
  // If you also want to reset volume to default (70%), uncomment next two lines:
  // localStorage.removeItem('musicPlayerVolume');
  // this.setVolume(70), this.elements.volumeSlider.value = 70;

  // Ensure loading UI is hidden
  this.hideLoading();

  // Bring the primary UI back (titles/buttons already set by resetPlayer)
  this.showPlayerInterface();

  this.showToast('Player reset', 'success', 1400);
  queueMicrotask(() => (this.isCancelling = false));
}


  /**
   * Progress bar mouse events
   */
  onProgressMouseDown(e) {
    if (this.isMobileDevice()) return;
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
   * Set progress based on absolute clientX
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
   * Initialize default playlist with a demo track
   */
  initializeDefaultPlaylist() {
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

    const savedPlaylist = localStorage.getItem('musicPlayerPlaylist');
    if (!savedPlaylist) {
      this.playlist = defaultTracks;
      this.filteredPlaylist = [...this.playlist];
      this.renderPlaylist();
      this.showToast('Welcome! Add your music files to get started.', 'success', 2500);
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
   * Generate a very short demo audio (placeholder)
   */
  generateDemoAudio(_duration) {
    // Tiny wav data URI—good enough to demo
    return 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
  }

  /**
   * Visualizer setup
   */
  setupVisualizer() {
    this.visualizerBars = document.querySelectorAll('.visualizer-bar');
    this.visualizerInterval = null;
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
  }

  startVisualizer() {
    this.elements.audioVisualizer.classList.add('active');
    if (!this.visualizerInterval) {
      this.visualizerInterval = setInterval(() => this.updateVisualizer(), 150);
    }
  }
  stopVisualizer() {
    this.elements.audioVisualizer.classList.remove('active');
    if (this.visualizerInterval) {
      clearInterval(this.visualizerInterval);
      this.visualizerInterval = null;
    }
  }
  updateVisualizer() {
    if (!this.isPlaying) return;
    this.visualizerBars.forEach((bar) => {
      const h = Math.random() * 40 + 10;
      bar.style.height = h + 'px';
      bar.style.opacity = (h / 50) + 0.3;
    });
  }

  /**
   * Toggle play/pause
   */
  togglePlay() {
    if (this.playlist.length === 0) {
      this.showToast('No songs in playlist. Add some music first!', 'warning', 2200);
      return;
    }
    if (this.audioPlayer.paused) this.play();
    else this.pause();
  }

  async play() {
    try {
      await this.audioPlayer.play();
      this.isPlaying = true;
      this.elements.playIcon.className = 'fas fa-pause';
      this.elements.albumArt.classList.add('playing');
      this.elements.vinylOverlay.classList.add('spinning');
      this.startVisualizer();
      this.updateMediaSession();
    } catch (error) {
      console.error('Error playing audio:', error);
      this.showToast('Error playing audio. Please try another file.', 'error');
    }
  }

  pause() {
    this.audioPlayer.pause();
    this.isPlaying = false;
    this.elements.playIcon.className = 'fas fa-play';
    this.elements.albumArt.classList.remove('playing');
    this.elements.vinylOverlay.classList.remove('spinning');
    this.stopVisualizer();
  }

  /**
   * LOAD a track and optionally autoplay
   */
  loadTrack(index, autoPlay = false) {
    if (index < 0 || index >= this.filteredPlaylist.length) return;

    const track = this.filteredPlaylist[index];
    if (!track) return;

    // Remove any previous once-handlers
    if (this._loadCanPlayHandler) {
      this.audioPlayer.removeEventListener('canplaythrough', this._loadCanPlayHandler);
      this._loadCanPlayHandler = null;
    }

    this.currentTrackIndex = index;

    // Update UI labels
    this.elements.songTitle.textContent = track.title;
    this.elements.songArtist.textContent = track.artist;
    this.elements.songAlbum.textContent = track.album;
    this.elements.albumArt.src = track.cover || this.getDefaultAlbumArt();

    // Load the audio source
    this.audioPlayer.src = track.src;
    this.audioPlayer.load();

    // Visual active state in playlist
    this.updateActiveTrack(index);

    // Autoplay when ready (guard against later cancellation)
    if (autoPlay) {
      this._loadCanPlayHandler = () => {
        if (!this.isCancelling) this.play();
      };
      this.audioPlayer.addEventListener('canplaythrough', this._loadCanPlayHandler, { once: true });
    }

    // Save current track index (only if it exists in full playlist)
    localStorage.setItem('musicPlayerCurrentTrack', index.toString());
  }

  /**
   * Default album art (SVG data URI)
   */
  getDefaultAlbumArt() {
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%236366f1'/%3E%3Cstop offset='100%25' stop-color='%23ec4899'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grad)'/%3E%3Ccircle cx='150' cy='150' r='20' fill='%23ffffff' opacity='0.3'/%3E%3Ctext x='150' y='160' text-anchor='middle' fill='%23ffffff' font-family='Arial' font-size='20' font-weight='bold'%3E%E2%99%AA%3C/text%3E%3C/svg%3E";
  }

  /**
   * Next/Previous
   */
  nextTrack() {
    if (this.filteredPlaylist.length === 0) return;
    let nextIndex;
    if (this.isShuffling) nextIndex = this.getRandomTrackIndex();
    else if (this.currentTrackIndex < this.filteredPlaylist.length - 1) nextIndex = this.currentTrackIndex + 1;
    else nextIndex = 0;
    this.loadTrack(nextIndex, true);
  }
  previousTrack() {
    if (this.filteredPlaylist.length === 0) return;
    let prevIndex;
    if (this.currentTrackIndex > 0) prevIndex = this.currentTrackIndex - 1;
    else prevIndex = this.filteredPlaylist.length - 1;
    this.loadTrack(prevIndex, true);
  }

  toggleShuffle() {
    this.isShuffling = !this.isShuffling;
    this.elements.shuffleBtn.classList.toggle('active', this.isShuffling);
    this.showToast(`Shuffle ${this.isShuffling ? 'enabled' : 'disabled'}`, 'success', 1500);
    localStorage.setItem('musicPlayerShuffle', this.isShuffling.toString());
  }

  toggleRepeat() {
    this.repeatMode = (this.repeatMode + 1) % 3;
    this.elements.repeatBtn.classList.remove('active');

    if (this.repeatMode === 0) this.showToast('Repeat off', 'success', 1200);
    if (this.repeatMode === 1) { this.elements.repeatBtn.classList.add('active'); this.showToast('Repeat all', 'success', 1200); }
    if (this.repeatMode === 2) { this.elements.repeatBtn.classList.add('active'); this.showToast('Repeat one', 'success', 1200); }

    localStorage.setItem('musicPlayerRepeat', this.repeatMode.toString());
  }

  getRandomTrackIndex() {
    if (this.filteredPlaylist.length <= 1) return 0;
    let r;
    do { r = Math.floor(Math.random() * this.filteredPlaylist.length); }
    while (r === this.currentTrackIndex);
    return r;
  }

  /**
   * File handling
   */
  handleFileUpload(event) {
    const files = Array.from(event.target.files);
    this.addFilesToPlaylist(files);
    event.target.value = '';
  }
  handleFileDrop(event) {
    const files = Array.from(event.dataTransfer.files);
    const audioFiles = files.filter(f => f.type.startsWith('audio/'));
    if (audioFiles.length > 0) this.addFilesToPlaylist(audioFiles);
    else this.showToast('Please drop audio files only', 'warning', 2000);
  }

  async addFilesToPlaylist(files) {
    if (files.length === 0) return;
    this.showLoading();
    try {
      for (const file of files) {
        if (file.type.startsWith('audio/')) {
          const track = await this.createTrackFromFile(file);
          this.playlist.push(track);
        }
      }
      this.filteredPlaylist = [...this.playlist];
      this.renderPlaylist();
      this.savePlaylist();

      const msg = files.length === 1
        ? `Added "${files[0].name}" to playlist`
        : `Added ${files.length} songs to playlist`;
      this.showToast(msg, 'success', 1800);

      // If this is the first set of files and nothing is loaded, select the first
      if (this.currentTrackIndex === -1 && this.playlist.length > 0) {
        this.loadTrack(0, false);
      }
    } finally {
      this.hideLoading();
    }
  }

  async createTrackFromFile(file) {
    const url = URL.createObjectURL(file);
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    const metadata = await this.extractMetadata(file);
    return {
      id: this.generateId(),
      title: metadata.title || fileName,
      artist: metadata.artist || 'Unknown Artist',
      album: metadata.album || 'Unknown Album',
      duration: metadata.duration || '0:00',
      src: url,
      cover: metadata.cover || null,
      file
    };
  }

  async extractMetadata(file) {
    return new Promise((resolve) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);

      const cleanup = () => {
        URL.revokeObjectURL(url);
        audio.src = '';
        audio.load();
      };

      audio.addEventListener('loadedmetadata', () => {
        const duration = this.formatTime(audio.duration);
        cleanup();
        resolve({ duration, title: null, artist: null, album: null, cover: null });
      });

      audio.addEventListener('error', () => {
        cleanup();
        resolve({ duration: '0:00', title: null, artist: null, album: null, cover: null });
      });

      audio.src = url;
    });
  }

  /**
   * Playlist rendering & actions
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

      li.addEventListener('click', (e) => {
        if (!e.target.closest('.track-action-btn')) {
          this.loadTrack(index, true);
        }
      });

      const removeBtn = li.querySelector('[data-action="remove"]');
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeTrack(index);
      });

      playlistElement.appendChild(li);
    });

    this.updateActiveTrack(this.currentTrackIndex);
  }

  updateActiveTrack(index) {
    const items = this.elements.playlist.querySelectorAll('.playlist-item');
    items.forEach(item => item.classList.remove('active'));
    if (index >= 0) {
      const activeItem = this.elements.playlist.querySelector(`[data-index="${index}"]`);
      if (activeItem) activeItem.classList.add('active');
    }
  }

  removeTrack(index) {
    if (index < 0 || index >= this.filteredPlaylist.length) return;
    const track = this.filteredPlaylist[index];

    const originalIndex = this.playlist.findIndex(t => t.id === track.id);
    if (originalIndex !== -1) {
      if (track.src && track.src.startsWith('blob:')) {
        URL.revokeObjectURL(track.src);
      }
      this.playlist.splice(originalIndex, 1);
    }

    this.filteredPlaylist.splice(index, 1);

    // Adjust selection if needed
    if (this.currentTrackIndex === index) {
      if (this.filteredPlaylist.length > 0) {
        const newIndex = Math.min(index, this.filteredPlaylist.length - 1);
        this.loadTrack(newIndex, this.isPlaying);
      } else {
        this.pause();
        this.resetPlayer();
      }
    } else if (this.currentTrackIndex > index) {
      this.currentTrackIndex--;
    }

    this.renderPlaylist();
    this.savePlaylist();
    this.showToast(`Removed "${track.title}"`, 'success', 1500);
  }

  searchPlaylist(query) {
    const q = (query || '').toLowerCase().trim();
    if (!q) this.filteredPlaylist = [...this.playlist];
    else {
      this.filteredPlaylist = this.playlist.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
      );
    }
    this.renderPlaylist();
  }

  clearPlaylist() {
    if (this.playlist.length === 0) return;
    if (confirm('Are you sure you want to clear the entire playlist?')) {
      this.playlist.forEach(track => {
        if (track.src && track.src.startsWith('blob:')) URL.revokeObjectURL(track.src);
      });
      this.playlist = [];
      this.filteredPlaylist = [];
      this.pause();
      this.resetPlayer();
      this.renderPlaylist();
      this.savePlaylist();
      this.showToast('Playlist cleared', 'success', 1400);
    }
  }

  /**
   * Reset player to a clean default state
   */
  resetPlayer() {
    // Cancel any pending load/play reaction
    this.isCancelling = true;
    if (this._loadCanPlayHandler) {
      this.audioPlayer.removeEventListener('canplaythrough', this._loadCanPlayHandler);
      this._loadCanPlayHandler = null;
    }

    // Stop playback/UI
    this.pause();
    this.stopVisualizer();

    // UI defaults
    this.elements.songTitle.textContent = 'Choose a song';
    this.elements.songArtist.textContent = 'Unknown Artist';
    this.elements.songAlbum.textContent = 'Unknown Album';
    this.elements.albumArt.src = this.getDefaultAlbumArt();
    this.elements.currentTime.textContent = '0:00';
    this.elements.totalTime.textContent = '0:00';
    this.elements.progressFill.style.width = '0%';
    this.elements.albumArt.classList.remove('playing');
    this.elements.vinylOverlay.classList.remove('spinning');

    // Audio reset
    this.audioPlayer.src = '';
    this.audioPlayer.load();

    // Selection
    this.currentTrackIndex = -1;
    this.updateActiveTrack(-1);

    queueMicrotask(() => (this.isCancelling = false));
  }

  /**
   * Show the player interface in a clean state (used by Cancel)
   */
  showPlayerInterface() {
    const hasTrack = this.currentTrackIndex >= 0 &&
      Array.isArray(this.filteredPlaylist) &&
      this.filteredPlaylist[this.currentTrackIndex];

    const track = hasTrack ? this.filteredPlaylist[this.currentTrackIndex] : null;

    this.elements.songTitle.textContent = track?.title ?? 'Choose a song';
    this.elements.songArtist.textContent = track?.artist ?? 'Unknown Artist';
    this.elements.songAlbum.textContent = track?.album ?? 'Unknown Album';
    this.elements.albumArt.src = track?.cover || this.getDefaultAlbumArt();

    this.elements.currentTime.textContent = '0:00';
    this.elements.totalTime.textContent = '0:00';
    this.elements.progressFill.style.width = '0%';

    this.elements.playIcon.className = 'fas fa-play';
    this.elements.albumArt.classList.remove('playing');
    this.elements.vinylOverlay.classList.remove('spinning');
    this.stopVisualizer();

    if (hasTrack) this.updateActiveTrack(this.currentTrackIndex);
  }

  /**
   * Cancel loading handler (from the loading overlay button)
   */
  cancelLoading() {
    this.isCancelling = true;

    // Remove any once listener waiting to autoplay
    if (this._loadCanPlayHandler) {
      this.audioPlayer.removeEventListener('canplaythrough', this._loadCanPlayHandler);
      this._loadCanPlayHandler = null;
    }

    // Hide loading UI
    this.hideLoading();

    // Stop any ongoing audio loading
    this.audioPlayer.src = '';
    this.audioPlayer.load();

    // Restore UI
    this.showPlayerInterface();

    // Informational toast
    this.showToast('Loading cancelled', 'info', 1500);

    queueMicrotask(() => (this.isCancelling = false));
  }

  /**
   * Set volume/mute
   */
  setVolume(value) {
    this.volume = Math.max(0, Math.min(100, value)) / 100;
    this.audioPlayer.volume = this.volume;
    this.elements.volumeFill.style.width = (this.volume * 100) + '%';
    this.elements.volumePercentage.textContent = Math.round(this.volume * 100) + '%';
    this.updateVolumeIcon();
    localStorage.setItem('musicPlayerVolume', this.volume.toString());
  }
  toggleMute() {
    this.audioPlayer.muted = !this.audioPlayer.muted;
    this.elements.volumeSlider.value = this.audioPlayer.muted ? 0 : this.volume * 100;
    this.updateVolumeIcon();
    this.elements.volumeFill.style.width = (this.audioPlayer.muted ? 0 : this.volume * 100) + '%';
    this.elements.volumePercentage.textContent = (this.audioPlayer.muted ? 0 : Math.round(this.volume * 100)) + '%';
  }
  updateVolumeIcon() {
    const icon = this.elements.volumeIcon;
    const vol = this.audioPlayer.muted ? 0 : this.volume;
    if (vol === 0) icon.className = 'fas fa-volume-mute';
    else if (vol < 0.5) icon.className = 'fas fa-volume-down';
    else icon.className = 'fas fa-volume-up';
  }

  /**
   * Theme
   */
  toggleTheme() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme();
    localStorage.setItem('musicPlayerTheme', this.currentTheme);
  }
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
      this.audioPlayer.currentTime = 0;
      this.play();
    } else if (this.repeatMode === 1 || this.currentTrackIndex < this.filteredPlaylist.length - 1) {
      this.nextTrack();
    } else {
      this.pause();
      this.audioPlayer.currentTime = 0;
    }
  }
  onAudioError(e) {
    console.error('Audio error:', e);
    if (this.isCancelling) {
      // user cancelled: keep UI calm
      return;
    }
    this.showToast('Error playing audio file', 'error', 2000);
    this.pause();
    this.showPlayerInterface();
  }

  /**
   * Keyboard shortcuts
   */
  handleKeyboardShortcuts(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    switch (e.code) {
      case 'Space':
        e.preventDefault(); this.togglePlay(); break;
      case 'ArrowRight':
        e.preventDefault();
        this.audioPlayer.currentTime = Math.min(this.audioPlayer.duration || 0, this.audioPlayer.currentTime + 10);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        this.audioPlayer.currentTime = Math.max(0, this.audioPlayer.currentTime - 10);
        break;
      case 'ArrowUp':
        e.preventDefault(); this.setVolume(Math.min(100, this.volume * 100 + 5)); break;
      case 'ArrowDown':
        e.preventDefault(); this.setVolume(Math.max(0, this.volume * 100 - 5)); break;
      case 'KeyN':
        e.preventDefault(); this.nextTrack(); break;
      case 'KeyP':
        e.preventDefault(); this.previousTrack(); break;
      case 'KeyS':
        e.preventDefault(); this.toggleShuffle(); break;
      case 'KeyR':
        e.preventDefault(); this.toggleRepeat(); break;
      case 'KeyM':
        e.preventDefault(); this.toggleMute(); break;
      case 'KeyT':
        e.preventDefault(); this.toggleTheme(); break;
    }
  }

  /**
   * Media Session API
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
   * Utilities
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

  showLoading() { this.elements.loadingOverlay.classList.add('active'); }
  hideLoading() { this.elements.loadingOverlay.classList.remove('active'); }

  /**
   * Toast notification system with optional duration
   */
  showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <i class="fas fa-${this.getToastIcon(type)}"></i>
      <span>${message}</span>
    `;
    this.elements.toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, duration);
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
    // Only persist non-blob sources
    const saveable = this.playlist.filter(t => !(t.src || '').startsWith('blob:'));
    localStorage.setItem('musicPlayerPlaylist', JSON.stringify(saveable));
  }
  loadSettings() {
    // Volume
    const savedVolume = localStorage.getItem('musicPlayerVolume');
    if (savedVolume) {
      this.setVolume(parseFloat(savedVolume) * 100);
      this.elements.volumeSlider.value = this.volume * 100;
    } else {
      this.setVolume(70);
      this.elements.volumeSlider.value = 70;
    }

    // Shuffle
    const savedShuffle = localStorage.getItem('musicPlayerShuffle');
    if (savedShuffle === 'true') {
      this.isShuffling = true;
      this.elements.shuffleBtn.classList.add('active');
    }

    // Repeat
    const savedRepeat = localStorage.getItem('musicPlayerRepeat');
    if (savedRepeat) {
      this.repeatMode = parseInt(savedRepeat);
      if (this.repeatMode > 0) this.elements.repeatBtn.classList.add('active');
    }

    // Current track index will be applied after playlist is available (handled in initializeDefaultPlaylist)
  }
}

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.musicPlayer = new ModernMusicPlayer();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.musicPlayer) {
    window.musicPlayer.playlist.forEach(track => {
      if (track.src && track.src.startsWith('blob:')) URL.revokeObjectURL(track.src);
    });
  }
});
