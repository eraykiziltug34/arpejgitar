/* ==========================================================
   Arpej Klasik Gitar Akademisi - JavaScript
   Metronom, Akort Frekansları, Nota Filtresi & Etkileşimler
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Dinamik Footer Yılı
  const yearSpan = document.getElementById('current-year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // 2. Mobil Menü Toggle
  const mobileToggle = document.getElementById('mobile-toggle');
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-link, .btn-nav');

  if (mobileToggle && navbar) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = navbar.classList.toggle('open');
      mobileToggle.setAttribute('aria-expanded', isOpen);
      const icon = mobileToggle.querySelector('i');
      if (icon) {
        icon.className = isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
      }
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        navbar.classList.remove('open');
        mobileToggle.setAttribute('aria-expanded', 'false');
        const icon = mobileToggle.querySelector('i');
        if (icon) {
          icon.className = 'fa-solid fa-bars';
        }
      });
    });
  }

  // 3. Toast Bildirim Fonksiyonu
  const showToast = (message, iconClass = 'fa-solid fa-circle-check') => {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.innerHTML = `<i class="${iconClass}"></i> <span>${message}</span>`;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  };

  // ==========================================================
  // 4. Web Audio API Tabanlı Canlı Metronom
  // ==========================================================
  let audioCtx = null;
  const getAudioContext = () => {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  };

  const bpmSlider = document.getElementById('bpm-slider');
  const bpmDisplay = document.getElementById('bpm-display');
  const tempoNameDisplay = document.getElementById('tempo-name');
  const bpmPlus = document.getElementById('bpm-plus');
  const bpmMinus = document.getElementById('bpm-minus');
  const metronomeToggle = document.getElementById('metronome-toggle');
  const metroIcon = document.getElementById('metro-icon');
  const metroText = document.getElementById('metro-text');
  const beatLights = document.querySelectorAll('.beat-light');

  let isPlaying = false;
  let bpm = 100;
  let currentBeat = 0;
  let metronomeTimer = null;

  // İtalyanca Tempo İsimleri
  const getTempoName = (val) => {
    if (val < 60) return 'Largo (Çok Ağır)';
    if (val < 76) return 'Adagio (Ağır & Sakin)';
    if (val < 108) return 'Andante (Yürüyüş Hızında)';
    if (val < 120) return 'Moderato (Orta Hızda)';
    if (val < 168) return 'Allegro (Neşeli & Hızlı)';
    return 'Presto (Çok Hızlı)';
  };

  const updateBpm = (newBpm) => {
    bpm = Math.min(220, Math.max(40, newBpm));
    if (bpmSlider) bpmSlider.value = bpm;
    if (bpmDisplay) bpmDisplay.textContent = bpm;
    if (tempoNameDisplay) tempoNameDisplay.textContent = getTempoName(bpm);

    if (isPlaying) {
      clearInterval(metronomeTimer);
      startMetronomeLoop();
    }
  };

  if (bpmSlider) {
    bpmSlider.addEventListener('input', (e) => {
      updateBpm(parseInt(e.target.value, 10));
    });
  }

  if (bpmPlus) {
    bpmPlus.addEventListener('click', () => updateBpm(bpm + 1));
  }
  if (bpmMinus) {
    bpmMinus.addEventListener('click', () => updateBpm(bpm - 1));
  }

  // Tık Sesi Üretimi
  const playClick = (accent = false) => {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // 1. vuruş tiz aksan (1200Hz), diğerleri tok (800Hz)
      osc.frequency.setValueAtTime(accent ? 1200 : 800, ctx.currentTime);

      gain.gain.setValueAtTime(1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch (err) {
      console.warn('Audio context hatası:', err);
    }
  };

  const stepMetronome = () => {
    const isFirstBeat = (currentBeat === 0);
    playClick(isFirstBeat);

    // Işıkları güncelle
    beatLights.forEach((light, idx) => {
      if (idx === currentBeat) {
        light.classList.add('active');
      } else {
        light.classList.remove('active');
      }
    });

    currentBeat = (currentBeat + 1) % 4;
  };

  const startMetronomeLoop = () => {
    const intervalMs = (60 / bpm) * 1000;
    stepMetronome();
    metronomeTimer = setInterval(stepMetronome, intervalMs);
  };

  if (metronomeToggle) {
    metronomeToggle.addEventListener('click', () => {
      if (isPlaying) {
        // Durdur
        clearInterval(metronomeTimer);
        isPlaying = false;
        if (metroIcon) metroIcon.className = 'fa-solid fa-play';
        if (metroText) metroText.textContent = 'Metronomu Başlat';
        beatLights.forEach(b => b.classList.remove('active'));
        currentBeat = 0;
      } else {
        // Başlat
        getAudioContext();
        isPlaying = true;
        currentBeat = 0;
        if (metroIcon) metroIcon.className = 'fa-solid fa-pause';
        if (metroText) metroText.textContent = 'Metronomu Durdur';
        startMetronomeLoop();
      }
    });
  }

  // ==========================================================
  // 5. Klasik Gitar Akort Ton Üreticisi (Tuner Pitches)
  // ==========================================================
  let tunerOsc = null;
  let tunerGain = null;
  const stringButtons = document.querySelectorAll('.string-btn');
  const tunerStatus = document.getElementById('tuner-status');
  const tunerNoteLabel = document.getElementById('tuner-note-label');
  const tunerStopBtn = document.getElementById('tuner-stop-btn');

  const stopTuner = () => {
    if (tunerOsc) {
      try {
        tunerOsc.stop();
        tunerOsc.disconnect();
      } catch (e) {}
      tunerOsc = null;
    }
    stringButtons.forEach(btn => btn.classList.remove('playing'));
    if (tunerNoteLabel) tunerNoteLabel.textContent = 'Çalmak için bir tele tıklayın';
    if (tunerStopBtn) tunerStopBtn.style.display = 'none';
  };

  const playStringPitch = (freq, noteName) => {
    stopTuner();
    const ctx = getAudioContext();

    tunerOsc = ctx.createOscillator();
    tunerGain = ctx.createGain();

    // Zengin gitar tınısına yakın 'triangle' dalga
    tunerOsc.type = 'triangle';
    tunerOsc.frequency.setValueAtTime(freq, ctx.currentTime);

    tunerGain.gain.setValueAtTime(0.3, ctx.currentTime);

    tunerOsc.connect(tunerGain);
    tunerGain.connect(ctx.destination);

    tunerOsc.start();

    if (tunerNoteLabel) {
      tunerNoteLabel.innerHTML = `Çalıyor: <strong>${noteName}</strong> (${freq} Hz)`;
    }
    if (tunerStopBtn) {
      tunerStopBtn.style.display = 'inline-block';
    }
  };

  stringButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const freq = parseFloat(btn.getAttribute('data-freq'));
      const noteName = btn.getAttribute('data-note');

      if (btn.classList.contains('playing')) {
        stopTuner();
      } else {
        stringButtons.forEach(b => b.classList.remove('playing'));
        btn.classList.add('playing');
        playStringPitch(freq, noteName);
      }
    });
  });

  if (tunerStopBtn) {
    tunerStopBtn.addEventListener('click', stopTuner);
  }

  // ==========================================================
  // 6. Nota Kütüphanesi Filtresi
  // ==========================================================
  const libFilterBtns = document.querySelectorAll('.lib-filter-btn');
  const scoreCards = document.querySelectorAll('.score-card');

  libFilterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      libFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      scoreCards.forEach((card) => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || cat === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Nota Ön Dinleme ve PDF İndirme Butonları
  const previewBtns = document.querySelectorAll('.btn-play-preview');
  previewBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const pieceName = btn.getAttribute('data-piece');
      
      // Hoş bir gitar arpeji sentezle (E minör arpeji)
      const ctx = getAudioContext();
      const notes = [164.81, 196.00, 246.94, 329.63, 392.00, 493.88]; // E - G - B - E - G - B
      
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.15);
        gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.15 + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.15);
        osc.stop(ctx.currentTime + idx * 0.15 + 0.8);
      });

      showToast(`"${pieceName}" eseri ön dinletisi çalınıyor...`, 'fa-solid fa-guitar');
    });
  });

  const downloadBtns = document.querySelectorAll('.btn-download-pdf');
  downloadBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const title = btn.getAttribute('data-title');
      showToast(`"${title}" notasının parmak numaralı PDF baskısı hazırlandı! (Demo indirme)`, 'fa-solid fa-file-pdf');
    });
  });

  // ==========================================================
  // 7. S.S.S. Accordion Açma / Kapama
  // ==========================================================
  const accordionItems = document.querySelectorAll('.accordion-item');

  accordionItems.forEach((item) => {
    const header = item.querySelector('.accordion-header');
    if (header) {
      header.addEventListener('click', () => {
        const isOpen = item.classList.contains('active');

        // Diğerlerini kapat
        accordionItems.forEach(i => {
          i.classList.remove('active');
          const h = i.querySelector('.accordion-header');
          if (h) h.setAttribute('aria-expanded', 'false');
        });

        if (!isOpen) {
          item.classList.add('active');
          header.setAttribute('aria-expanded', 'true');
        }
      });
    }
  });

  // ==========================================================
  // 8. Kayıt & Deneme Dersi Formu Gönderimi
  // ==========================================================
  const registerForm = document.getElementById('guitar-register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('student-name').value.trim();
      const email = document.getElementById('student-email').value.trim();
      const phone = document.getElementById('student-phone').value.trim();
      const level = document.getElementById('student-level').value;
      const type = document.getElementById('lesson-type').value;

      if (!name || !email || !phone) {
        showToast('Lütfen zorunlu alanları doldurun.', 'fa-solid fa-triangle-exclamation');
        return;
      }

      const submitBtn = registerForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Randevunuz Hazırlanıyor...';

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        registerForm.reset();
        showToast(`Tebrikler ${name}! Ücretsiz deneme dersi kaydınız alındı. Sizinle en kısa sürede iletişime geçeceğiz.`);
      }, 1400);
    });
  }
});
