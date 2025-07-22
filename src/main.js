import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, push, onValue } from 'firebase/database';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  bootstrapCameraKit,
  createMediaStreamSource,
} from '@snap/camera-kit';

// Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyAv5H0-jgze_z1dvT8mHFRwusYXAiTSJgw",
//   authDomain: "digitalrakhi-f8060.firebaseapp.com",
//   databaseURL: "https://digitalrakhi-f8060-default-rtdb.firebaseio.com",
//   projectId: "digitalrakhi-f8060",
//   storageBucket: "digitalrakhi-f8060.appspot.com",
//   messagingSenderId: "360526523502",
//   appId: "1:360526523502:web:3e1af0fd17e9bb1ca5ca7f",
//   measurementId: "G-FPJ5LHJEVS"
// };

const firebaseConfig = {
  apiKey: "AIzaSyAC-DP2RYDI-McBGCOKM-u0wxcy-PPnoK4",
  authDomain: "fir-7d7e0.firebaseapp.com",
  databaseURL: "https://fir-7d7e0-default-rtdb.firebaseio.com",
  projectId: "fir-7d7e0",
  storageBucket: "fir-7d7e0.firebasestorage.app",
  messagingSenderId: "27046342061",
  appId: "1:27046342061:web:90d9050919b217f1b8c524",
  measurementId: "G-DY0JWSZ4LW"
};


// Initialize Firebase and Analytics
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const analytics = getAnalytics(app);
const storage = getStorage(app);

document.addEventListener('DOMContentLoaded', function() {

  const maxMobileWidth = 500;

    if (window.innerWidth > maxMobileWidth) {
        window.location.href = '/mobile-only.html'; 
        return; // Stop further execution since this is a non-mobile device
    }


  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  let pageSessionStart = Date.now(); // Track session start for both main and token pages

  if (token) {
    logEvent(analytics, 'token_page_visit', { token });

    window.addEventListener('beforeunload', () => {
      const sessionDuration = Date.now() - pageSessionStart;
      logEvent(analytics, 'token_page_session_duration', { duration_seconds: Math.floor(sessionDuration / 1000) });
    });

    showReceiverSide(token);
  } else {
    logEvent(analytics, 'main_page_visit');

    window.addEventListener('beforeunload', () => {
      const sessionDuration = Date.now() - pageSessionStart;
      logEvent(analytics, 'main_page_session_duration', { duration_seconds: Math.floor(sessionDuration / 1000) });
    });

    setupForm();
  }
});

function setupForm() {
  const form = document.getElementById('rakhiForm');
  let lastAudioBlob = null;
  // Patch: capture audio blob after recording
  const audioPlayback = document.getElementById('audioPlayback');
  if (audioPlayback) {
    audioPlayback.addEventListener('loadedmetadata', () => {
      // Try to fetch the blob from the audio src if possible
      fetch(audioPlayback.src)
        .then(res => res.blob())
        .then(blob => { lastAudioBlob = blob; })
        .catch(() => { lastAudioBlob = null; });
    });
  }

  if (form) {
    form.addEventListener('submit', async function(event) {
      event.preventDefault();

      const sisterName = document.getElementById('sisterName').value.trim();
      const brotherName = document.getElementById('brotherName').value.trim();
      const termsAccepted = document.getElementById('terms').checked;
console.log('loggin', sisterName, brotherName, termsAccepted)
      if (!sisterName || !brotherName || !termsAccepted) {
        alert('Please fill out all fields and accept the terms.');
        return;
      }

      const token = generateRandomToken();
      let audioURL = null;

      try {
        // If there is a recording, upload it to Firebase Storage
        if (lastAudioBlob && lastAudioBlob.size > 0) {
          const audioStorageRef = storageRef(storage, `recordings/${token}.webm`);
          await uploadBytes(audioStorageRef, lastAudioBlob);
          audioURL = await getDownloadURL(audioStorageRef);
        }

        const newPostRef = push(ref(database, 'rakhis'));
        await set(newPostRef, {
          sisterName,
          brotherName,
          token,
          audioURL: audioURL || null,
          createdAt: new Date().toISOString()
        });

        const uniqueLink = `${window.location.origin}${window.location.pathname}?token=${token}`;
          await handleSharing(uniqueLink);

        // Redirect to the thank you page after sharing
        window.location.href = 'thank-you.html';
      } catch (error) {
        console.error('Error saving data or generating link:', error);
        alert('Failed to process your request. Please try again.');
      }
    });
  }
}

function showReceiverSide(token) {
  const senderContainer = document.getElementById('senderContainer');
  const receiverContainer = document.getElementById('receiverContainer');
  const cameraContainer = document.getElementById('camera-container');
  const playVoiceMsg = document.getElementById('playVoiceMsg');
  const playVoiceBtn = document.getElementById('playVoiceBtn');
  const playVoiceWrapper = document.getElementById('playVoiceWrapper');
  let audio = null;

  senderContainer.style.display = 'none';
  receiverContainer.style.display = 'flex';

  // Always show play icon and message
  if (playVoiceWrapper) playVoiceWrapper.style.display = 'flex';

  // Play local audio if available
  // if (playVoiceBtn) {
  //   playVoiceBtn.onclick = () => {
  //     // Try to fetch the last audio blob from localStorage
  //     const audioDataUrl = localStorage.getItem('lastAudioBlob');
  //     if (audioDataUrl) {
  //       if (audio) { audio.pause(); audio.currentTime = 0; }
  //       audio = new Audio(audioDataUrl);
  //       audio.play();
  //     } else {
  //       alert('No local recording found.');
  //     }
  //   };
  // }

  const rakhiRef = ref(database, 'rakhis');
  onValue(rakhiRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const rakhiData = Object.values(data).find((entry) => entry.token === token);
      if (rakhiData) {
        document.getElementById('greeting').innerHTML = `
          <span class="greeting-title">HEY </span><br>
          <span class="greeting-title">${rakhiData.brotherName}!</span><br>
          <span class="greeting-message"> your sibling has sent you a special digital rakhi to celebrate the bond you share.</span>
        `;

        document.getElementById('greeting-overlay').innerHTML = `
          <span class="greeting-title">HEY</span><br>
          <span class="greeting-message">${rakhiData.brotherName}! your sibling has sent you a special digital rakhi to celebrate the bond you share.</span>
        `;

        // Always show play icon and message
        if (playVoiceMsg && playVoiceBtn) {
          playVoiceMsg.style.display = 'block';
          audio = new Audio(rakhiData.audioURL);
          playVoiceBtn.onclick = () => {
            audio.currentTime = 0;
            audio.play();
          };
        }

        receiverContainer.addEventListener('click', () => handleTap(receiverContainer, cameraContainer, rakhiData));
      } else {
        document.getElementById('greeting').innerText = 'No Rakhi information found.';
        document.getElementById('greeting-overlay').innerText = 'No Rakhi information found.';
        if (playVoiceMsg) playVoiceMsg.style.display = 'none';
      }
    }
  }, (error) => {
    console.error('Error fetching data:', error);
    document.getElementById('greeting').innerText = 'Failed to retrieve Rakhi information.';
    document.getElementById('greeting-overlay').innerText = 'Failed to retrieve Rakhi information.';
    if (playVoiceMsg) playVoiceMsg.style.display = 'none';
  });
}


async function handleTap(receiverContainer, cameraContainer, rakhiData) {
  try {
    await startCameraKit(rakhiData);

    cameraContainer.style.display = 'flex';
    receiverContainer.style.opacity = 0;
    cameraContainer.style.opacity = 1;
    setTimeout(() => {
      receiverContainer.style.display = 'none';
    }, 1000);

  } catch (error) {
    console.error('Error initializing camera:', error);
  }
}


function generateRandomToken() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 16; i++) { // Generate a 16-character random token
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return token;
}

async function handleSharing(link) {
  try {
    if (navigator.share) {
      await navigator.share({
        title: 'Send Digital Rakhi',
        text: 'Check out this digital Rakhi I sent you!',
        url: link
      });
      console.log('Thanks for sharing!');
    } else {
      // Fallback for browsers that do not support the share API
      await navigator.clipboard.writeText(link);
      alert('Link copied to clipboard! Please share manually.');
      console.log('Link copied to clipboard!');
    }
  } catch (err) {
    console.error('Error sharing or copying link:', err);
    alert('Failed to share or copy link. Please try manually.');
  } finally {
    // Redirect to the thank you page regardless of the share outcome
    window.location.href = `thank-you.html`;
  }
}

async function startCameraKit(rakhiData) {
  const cameraContainer = document.getElementById('camera-container');
  cameraContainer.style.opacity = 1;

  try {
    const cameraKit = await bootstrapCameraKit({
      apiToken: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzA2NzExNzk4LCJzdWIiOiJhNWQ0ZjU2NC0yZTM0LTQyN2EtODI1Ni03OGE2NTFhODc0ZTR-U1RBR0lOR35mMzBjN2JmNy1lNjhjLTRhNzUtOWFlNC05NmJjOTNkOGIyOGYifQ.xLriKo1jpzUBAc1wfGpLVeQ44Ewqncblby-wYE1vRu0'
    });

    let mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 2160, height: 2160, facingMode: 'environment' }
    });

    const session = await cameraKit.createSession();
    const lens = await cameraKit.lensRepository.loadLens('d5d8d026-effa-4d97-8147-64b6c6b1435e', 'fdd0879f-c570-490e-9dfc-cba0f122699f');
    await session.applyLens(lens, {
      launchParams: {
        greeting_text: `Hey ${rakhiData.brotherName}!`,
        brother_name: `${rakhiData.brotherName}`,
        message: "Share this moment with your sibling on social media!"
      }
    });

    const source = createMediaStreamSource(mediaStream, { cameraType: 'back' });
    await session.setSource(source);

    // Set the render size based on the actual screen resolution
    session.source.setRenderSize(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio);
    session.play();

    // Define liveOutput correctly from the session output
    const liveOutput = session.output.live;

    const canvas = document.getElementById('canvas');
    if (canvas) {
      drawVideoToCanvas(liveOutput, canvas);
    } else {
      cameraContainer.appendChild(liveOutput);
    }

    document.getElementById('captureButton').addEventListener('click', () => captureScreenshot(canvas));
  } catch (error) {
    console.error('Error initializing camera kit or session:', error);
  }
}

function drawVideoToCanvas(videoElement, canvas) {
  const context = canvas.getContext('2d');

  const logo = new Image();
  logo.src = 'Images/logo.png'; // Path to your logo

  // Set the canvas dimensions to match the video
  canvas.width = window.innerWidth * window.devicePixelRatio;
  canvas.height = window.innerHeight * window.devicePixelRatio;

  function drawFrame() {
    // Clear the canvas before drawing
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the video frame on the canvas
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    
   // Calculate the logo dimensions and position based on the given CSS-like properties
   const logoHeight = canvas.height * 0.08;  // 8% of canvas height
   const logoWidth = logo.naturalWidth * (logoHeight / logo.naturalHeight); // Maintain aspect ratio

   const logoX = canvas.width - logoWidth - (canvas.width * 0.01); // 1% from the right
   const logoY = canvas.height * 0.007; // 0.7% from the top

   // Draw the logo on the canvas
   context.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

    // Request the next frame
    requestAnimationFrame(drawFrame);
  }

  // Start drawing frames
  requestAnimationFrame(drawFrame);
}


function captureScreenshot(canvas) {
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  canvas.toBlob((blob) => {
    if (!blob) {
      console.error('Failed to create blob from canvas');
      return;
    }

    logEvent(analytics, 'image_capture');

    const file = new File([blob], 'digital_rakhi.png', { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({
        files: [file],
        title: 'Digital Rakhi',
        text: 'Check out this cool digital Rakhi!',
      }).then(() => {
        // Redirect to the Thank You page after sharing
        window.location.href = 'thank-your.html';
      }).catch((error) => {
        console.error('Error sharing:', error);
      });
    } else {
      downloadImage(blob);
      // Optionally, you can redirect after the download if needed
      // window.location.href = 'thank-your.html';
    }
  }, 'image/png');
}


function downloadImage(blob) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'digital_rakhi.png';
  link.click();

  // Add a delay to ensure the download is initiated before redirecting
  setTimeout(() => {
    window.location.href = 'thank-your.html'; // Redirect to the Thank You page
  }, 3000); // 1-second delay, adjust if needed
}

// Voice Recording Functionality
const recordButton = document.getElementById('recordButton');
const micIcon = document.getElementById('micIcon');
const audioPlayback = document.getElementById('audioPlayback');
const speedMenuBtn = document.getElementById('speedMenuBtn');
const speedMenu = document.getElementById('speedMenu');
let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let recordTimeout;

const recordActionRow = document.getElementById('recordActionRow');
const playPreviewBtn = document.getElementById('playPreviewBtn');
const cancelRecordBtn = document.getElementById('cancelRecordBtn');
const saveRecordBtn = document.getElementById('saveRecordBtn');
const audioPlayerWrapper = document.querySelector('.audio-player-wrapper');
const reRecordBtn = document.getElementById('reRecordBtn');

let previewAudio = null;

function setMicCircleColor(color) {
  if (micIcon) {
    const circle = micIcon.querySelector('circle');
    if (circle) circle.setAttribute('stroke', color);
  }
}

function startRecording() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('Your browser does not support audio recording.');
    return;
  }
  recordButton.disabled = true;
  setTimeout(() => { recordButton.disabled = false; }, 1100); // Prevent double-press
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };
      mediaRecorder.onstop = () => {
        clearTimeout(recordTimeout);
        recordButton.disabled = false;
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        audioPlayback.src = audioUrl;
        audioPlayback.style.display = 'block';
        speedMenuBtn.style.display = 'inline-block';
        setTimeout(() => {
          const audioControls = audioPlayback.parentElement;
          if (audioControls) {
            const downloadBtn = audioControls.querySelector('a[download]');
            if (downloadBtn) downloadBtn.style.display = 'none';
          }
        }, 100);
      };
      mediaRecorder.start();
      isRecording = true;
      setMicCircleColor('red');
      // Stop after 1 minute (60000 ms)
      recordTimeout = setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, 60000);
    })
    .catch(() => {
      alert('Could not access microphone.');
      recordButton.disabled = false;
    });
}

function stopRecording() {
  if (mediaRecorder && isRecording) {
    clearTimeout(recordTimeout);
    mediaRecorder.stop();
    isRecording = false;
    setMicCircleColor('#888');
    recordButton.disabled = false;
  }
}

function showRecordActionRow(blob) {
  if (recordButton) recordButton.style.display = 'none';
  if (audioPlayerWrapper) audioPlayerWrapper.style.display = 'none';
  if (recordActionRow) recordActionRow.style.display = 'flex';
  previewAudio = new Audio(URL.createObjectURL(blob));
}

function hideRecordActionRow() {
  if (recordActionRow) recordActionRow.style.display = 'none';
  if (recordButton) recordButton.style.display = 'flex';
}

function showAudioPlayer() {
  if (audioPlayerWrapper) audioPlayerWrapper.style.display = 'flex';
  if (recordButton) recordButton.style.display = 'flex';
  if (recordActionRow) recordActionRow.style.display = 'none';
}

function hideAudioPlayer() {
  if (audioPlayerWrapper) audioPlayerWrapper.style.display = 'none';
  if (reRecordBtn) reRecordBtn.style.display = 'none';
  if (speedMenuBtn) speedMenuBtn.style.display = 'none';
  if (speedMenu) speedMenu.style.display = 'none';
}

function showAudioPlayerOnly() {
  if (audioPlayerWrapper) audioPlayerWrapper.style.display = 'flex';
  if (recordButton) recordButton.style.display = 'none';
  if (recordActionRow) recordActionRow.style.display = 'none';
  if (reRecordBtn) reRecordBtn.style.display = 'flex';
  if (speedMenuBtn) speedMenuBtn.style.display = 'inline-block';
}

if (recordButton) {
  // Mouse events
  recordButton.addEventListener('mousedown', startRecording);
  recordButton.addEventListener('mouseup', stopRecording);
  recordButton.addEventListener('mouseleave', stopRecording);
  // Touch events for mobile
  recordButton.addEventListener('touchstart', (e) => { e.preventDefault(); startRecording(); });
  recordButton.addEventListener('touchend', (e) => { e.preventDefault(); stopRecording(); });
}

// Playback speed menu logic
if (speedMenuBtn && speedMenu && audioPlayback) {
  speedMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    // Position menu below the button
    const rect = speedMenuBtn.getBoundingClientRect();
    speedMenu.style.display = 'block';
    speedMenu.style.left = rect.left + 'px';
    speedMenu.style.top = (rect.bottom + window.scrollY + 4) + 'px';
  });
  // Hide menu on click outside
  document.addEventListener('click', () => {
    speedMenu.style.display = 'none';
  });
  speedMenu.addEventListener('click', (e) => {
    if (e.target.classList.contains('speed-option')) {
      const speed = parseFloat(e.target.getAttribute('data-speed'));
      audioPlayback.playbackRate = speed;
      speedMenu.style.display = 'none';
    }
  });
}

// Save the audio blob as a data URL in localStorage after recording
function saveAudioBlobToLocal(blob) {
  if (!blob) return;
  const reader = new FileReader();
  reader.onloadend = function() {
    localStorage.setItem('lastAudioBlob', reader.result);
  };
  reader.readAsDataURL(blob);
}
// Patch: after recording, show action row
if (audioPlayback) {
  audioPlayback.addEventListener('loadedmetadata', () => {
    fetch(audioPlayback.src)
      .then(res => res.blob())
      .then(blob => {
        showRecordActionRow(blob);
        // Always update previewAudio to latest
        previewAudio = new Audio(URL.createObjectURL(blob));
      })
      .catch(() => {});
  });
}

if (playPreviewBtn) {
  playPreviewBtn.onclick = () => {
    if (previewAudio) {
      previewAudio.currentTime = 0;
      previewAudio.play();
      showAudioPlayerOnly();
      if (audioPlayback) audioPlayback.style.display = 'block';
    }
  };
}
if (cancelRecordBtn) {
  cancelRecordBtn.onclick = () => {
    previewAudio = null;
    hideRecordActionRow();
    hideAudioPlayer();
    if (audioPlayback) {
      audioPlayback.src = '';
      audioPlayback.style.display = 'none';
    }
    if (recordButton) recordButton.style.display = 'flex';
  };
}
if (saveRecordBtn) {
  saveRecordBtn.onclick = () => {
    showAudioPlayerOnly();
    if (audioPlayback) audioPlayback.style.display = 'block';
  };
}
if (reRecordBtn) {
  reRecordBtn.onclick = () => {
    hideAudioPlayer();
    if (recordButton) recordButton.style.display = 'flex';
    if (audioPlayback) {
      audioPlayback.src = '';
      audioPlayback.style.display = 'none';
    }
    previewAudio = null;
  };
}
// When starting a new recording, hide audio player and action row
if (recordButton) {
  recordButton.addEventListener('mousedown', () => {
    hideAudioPlayer();
    hideRecordActionRow();
  });
  recordButton.addEventListener('touchstart', () => {
    hideAudioPlayer();
    hideRecordActionRow();
  });
}
