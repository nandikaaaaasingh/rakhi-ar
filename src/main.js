import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, push, onValue } from 'firebase/database';
import { getAnalytics, logEvent } from 'firebase/analytics';
import {
  bootstrapCameraKit,
  createMediaStreamSource,
} from '@snap/camera-kit';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAv5H0-jgze_z1dvT8mHFRwusYXAiTSJgw",
  authDomain: "digitalrakhi-f8060.firebaseapp.com",
  databaseURL: "https://digitalrakhi-f8060-default-rtdb.firebaseio.com",
  projectId: "digitalrakhi-f8060",
  storageBucket: "digitalrakhi-f8060.appspot.com",
  messagingSenderId: "360526523502",
  appId: "1:360526523502:web:3e1af0fd17e9bb1ca5ca7f",
  measurementId: "G-FPJ5LHJEVS"
};

// Initialize Firebase and Analytics
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const analytics = getAnalytics(app);

document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  let pageSessionStart = Date.now(); // Track session start for both main and token pages

  if (token) {
    logEvent(analytics, 'token_page_visit', { token });

    window.addEventListener('beforeunload', () => {
      const sessionDuration = Date.now() - pageSessionStart;
      logEvent(analytics, 'token_page_session', { duration_ms: sessionDuration });
    });

    showReceiverSide(token);
  } else {
    logEvent(analytics, 'main_page_visit');

    window.addEventListener('beforeunload', () => {
      const sessionDuration = Date.now() - pageSessionStart;
      logEvent(analytics, 'main_page_session', { duration_ms: sessionDuration });
    });

    setupForm();
  }
});

// The rest of your main.js code should follow here...


function setupForm() {
  const form = document.getElementById('rakhiForm');

  if (form) {
    form.style.display = 'block';
    const receiverMessage = document.getElementById('receiverMessage');
    receiverMessage.style.display = 'none';

    form.addEventListener('submit', async function(event) {
      event.preventDefault();

      const sisterName = document.getElementById('sisterName').value.trim();
      const brotherName = document.getElementById('brotherName').value.trim();
      const email = document.getElementById('email').value.trim();
      const mobile = document.getElementById('mobile').value.trim();
      const termsAccepted = document.getElementById('terms').checked;

      if (!sisterName || !brotherName || !email || !mobile || !termsAccepted) {
        alert('Please fill out all fields and accept the terms.');
        return;
      }

      const token = generateToken(sisterName, email, mobile);

      try {
        const newPostRef = push(ref(database, 'rakhis'));
        await set(newPostRef, {
          sisterName,
          brotherName,
          email,
          mobile,
          token,
          createdAt: new Date().toISOString()
        });

        logEvent(analytics, 'form_submission', {
          sisterName,
          brotherName,
          email,
          mobile
        });

        const uniqueLink = `${window.location.origin}${window.location.pathname}?token=${token}`;
        handleSharing(uniqueLink);
      } catch (error) {
        console.error('Error saving data or generating link:', error);
        alert('Failed to process your request. Please try again.');
      }
    });
  } else {
    console.error('Form element not found');
  }
}

function showReceiverSide(token) {
  const senderContainer = document.getElementById('senderContainer');
  const receiverContainer = document.getElementById('receiverContainer');
  const cameraContainer = document.getElementById('camera-container');

  senderContainer.style.display = 'none';
  receiverContainer.style.display = 'flex';

  const rakhiRef = ref(database, 'rakhis');
  onValue(rakhiRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const rakhiData = Object.values(data).find((entry) => entry.token === token);
      if (rakhiData) {
        document.getElementById('greeting').innerText = `${rakhiData.sisterName} sent this Digital Rakhi to ${rakhiData.brotherName} with love`;
        document.getElementById('greeting-overlay').innerText = `${rakhiData.sisterName} sent this Digital Rakhi to ${rakhiData.brotherName} with love`;

        receiverContainer.addEventListener('click', () => handleTap(receiverContainer, cameraContainer));
      } else {
        document.getElementById('greeting').innerText = 'No Rakhi information found.';
        document.getElementById('greeting-overlay').innerText = 'No Rakhi information found.';
      }
    }
  }, (error) => {
    console.error('Error fetching data:', error);
    document.getElementById('greeting').innerText = 'Failed to retrieve Rakhi information.';
    document.getElementById('greeting-overlay').innerText = 'Failed to retrieve Rakhi information.';
  });
}

async function handleTap(receiverContainer, cameraContainer) {
  try {
    await startCameraKit();

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

function generateToken(name, email, mobile) {
  return btoa(`${name.slice(0, 3)}${mobile.slice(-4)}`);
}

function handleSharing(link) {
  if (navigator.share) {
    navigator.share({
      title: 'Send Digital Rakhi',
      text: 'Check out this digital Rakhi I sent you!',
      url: link
    }).then(() => console.log('Thanks for sharing!'))
    .catch(err => console.error('Error sharing:', err));
  } else {
    navigator.clipboard.writeText(link)
    .then(() => {
      alert('Link copied to clipboard! Please share manually.');
      console.log('Link copied to clipboard!');
    })
    .catch(err => {
      console.error('Failed to copy link:', err);
      alert('Failed to copy link. Please try manually.');
    });
  }
}

async function startCameraKit() {
  const cameraContainer = document.getElementById('camera-container');
  cameraContainer.style.opacity = 1;

  try {
    const cameraKit = await bootstrapCameraKit({
      apiToken: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzA2NzExNzk4LCJzdWIiOiJhNWQ0ZjU2NC0yZTM0LTQyN2EtODI1Ni03OGE2NTFhODc0ZTR-U1RBR0lOR35mMzBjN2JmNy1lNjhjLTRhNzUtOWFlNC05NmJjOTNkOGIyOGYifQ.xLriKo1jpzUBAc1wfGpLVeQ44Ewqncblby-wYE1vRu0'
    });

    const session = await cameraKit.createSession();
    const canvasElement = document.getElementById('canvas');
    if (canvasElement) {
      canvasElement.replaceWith(session.output.live);
      session.output.live.style.transform = 'scaleX(1)';

      const { lenses } = await cameraKit.lensRepository.loadLensGroups(['fdd0879f-c570-490e-9dfc-cba0f122699f']);
      session.applyLens(lenses[0]);

      let mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: window.innerWidth, max: 1920 },
          height: { ideal: window.innerHeight, max: 1080 }
        }
      });

      const source = createMediaStreamSource(mediaStream, { cameraType: 'back' });
      await session.setSource(source);
      session.source.setRenderSize(window.innerWidth, window.innerHeight);
      session.play();

      document.getElementById('captureButton').addEventListener('click', () => captureScreenshot(session));
    } else {
      console.error('Canvas element not found');
    }
  } catch (error) {
    console.error('Error initializing camera kit or session:', error);
  }
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
  var words = text.split(' ');
  var line = '';

  for(var n = 0; n < words.length; n++) {
      var testLine = line + words[n] + ' ';
      var metrics = context.measureText(testLine);
      var testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
          context.fillText(line, x, y);
          line = words[n] + ' ';
          y += lineHeight;
      } else {
          line = testLine;
      }
  }
  context.fillText(line, x, y);
}

function captureScreenshot(session) {
const cameraContainer = document.getElementById('camera-container');
const liveOutput = session.output.live;
const overlayMessage = document.querySelector('.overlay-message');

if (liveOutput && overlayMessage && cameraContainer) {
  const tempCanvas = document.createElement('canvas');
  const context = tempCanvas.getContext('2d');
  tempCanvas.width = cameraContainer.clientWidth;
  tempCanvas.height = cameraContainer.clientHeight;

  context.drawImage(liveOutput, 0, 0, tempCanvas.width, tempCanvas.height);

  // Adjust font size based on the height of the canvas
  const fontSize = 3 * (tempCanvas.height / 100); // 1.4vh
  context.font = `${fontSize}px Arial, sans-serif`;
  context.fillStyle = 'white';
  context.textAlign = 'center';  // Ensure the text is centered
  context.textBaseline = 'top';
  context.shadowColor = 'black';
  context.shadowBlur = 10; 

  // Define maximum width for the text
  const maxTextWidth = tempCanvas.width * 0.8;
  const textX = tempCanvas.width / 2;  // Center position of the canvas
  const textY = tempCanvas.height * 0.05;  // 5% from the top of the canvas

  wrapText(context, overlayMessage.textContent, textX, textY, maxTextWidth, fontSize * 1.4);

  tempCanvas.toBlob((blob) => {
    if (!blob) {
      console.error('Failed to create blob from canvas');
      return;
    }

    logEvent(analytics, 'image_capture'); // Log the image capture event

    const file = new File([blob], 'digital_rakhi_screenshot.png', { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({
        files: [file],
        title: 'Digital Rakhi',
        text: 'Check out this cool digital Rakhi!',
      }).catch((error) => console.error('Error sharing:', error));
    } else {
      downloadImage(blob);
    }
  }, 'image/png');
} else {
  console.error('Camera output or overlay is not available');
}
}

function downloadImage(blob) {
const link = document.createElement('a');
link.href = URL.createObjectURL(blob);
link.download = 'digital_rakhi_screenshot.png';
link.click();
}
