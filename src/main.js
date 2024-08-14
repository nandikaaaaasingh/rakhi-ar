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

function setupForm() {
  const form = document.getElementById('rakhiForm');

  if (form) {
    form.addEventListener('submit', async function(event) {
      event.preventDefault();

      const sisterName = document.getElementById('sisterName').value.trim();
      const brotherName = document.getElementById('brotherName').value.trim();
      const termsAccepted = document.getElementById('terms').checked;

      if (!sisterName || !brotherName || !termsAccepted) {
        alert('Please fill out all fields and accept the terms.');
        return;
      }

      const token = generateRandomToken();

      try {
        const newPostRef = push(ref(database, 'rakhis'));
        await set(newPostRef, {
          sisterName,
          brotherName,
          token,
          createdAt: new Date().toISOString()
        });

        const uniqueLink = `${window.location.origin}${window.location.pathname}?token=${token}`;
        await handleSharing(uniqueLink);

        // Redirect to the thank you page after sharing
        window.location.href = '/thank-you.html';
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

  senderContainer.style.display = 'none';
  receiverContainer.style.display = 'flex';

  const rakhiRef = ref(database, 'rakhis');
  onValue(rakhiRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const rakhiData = Object.values(data).find((entry) => entry.token === token);
      if (rakhiData) {
        document.getElementById('greeting').innerHTML = `
          <span class="greeting-title">HEY! ${rakhiData.brotherName}, </span><br>
          <span class="greeting-message"> your sibling has sent you a special digital rakhi to celebrate the bond you share.</span>
        `;

        document.getElementById('greeting-overlay').innerHTML = `
          <span class="greeting-title">HEY!</span><br>
          <span class="greeting-message">${rakhiData.brotherName}, your sister has sent you a special digital rakhi to celebrate the bond you share.</span>
        `;

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
    window.location.href = `${window.location.origin}/thank-you.html`;
  }
}

async function startCameraKit() {
  const cameraContainer = document.getElementById('camera-container');
  cameraContainer.style.opacity = 1;

  try {
    const cameraKit = await bootstrapCameraKit({
      apiToken: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzA2NzExNzk4LCJzdWIiOiJhNWQ0ZjU2NC0yZTM0LTQyN2EtODI1Ni03OGE2NTFhODc0ZTR-U1RBR0lOR35mMzBjN2JmNy1lNjhjLTRhNzUtOWFlNC05NmJjOTNkOGIyOGYifQ.xLriKo1jpzUBAc1wfGpLVeQ44Ewqncblby-wYE1vRu0'
    });

    // Use the actual screen resolution for video dimensions
    let mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { width: window.innerWidth, height: window.innerHeight, facingMode: 'environment' }
    });

    const session = await cameraKit.createSession();
    const liveOutput = session.output.live;

    const { lenses } = await cameraKit.lensRepository.loadLensGroups(['fdd0879f-c570-490e-9dfc-cba0f122699f']);
    session.applyLens(lenses[0]);

    const source = createMediaStreamSource(mediaStream, { cameraType: 'back' });
    await session.setSource(source);

    // Set the render size based on the actual screen dimensions, not the pixel ratio
    const renderWidth = window.innerWidth* window.devicePixelRatio;
    const renderHeight = window.innerHeight* window.devicePixelRatio;
    session.source.setRenderSize(renderWidth, renderHeight);
    session.play();

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

  // Set the canvas dimensions to match the video and screen size
  canvas.width = window.innerWidth * window.devicePixelRatio;
  canvas.height = window.innerHeight * window.devicePixelRatio;

  function drawFrame() {
    // Clear the canvas before drawing
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the video frame on the canvas
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // Draw the greeting text on top of the video
    drawGreetingText(context);

    // Request the next frame
    requestAnimationFrame(drawFrame);
  }

  // Start drawing frames
  requestAnimationFrame(drawFrame);
}

function drawGreetingText(context) {
  const canvas = context.canvas;

  const greetingElement = document.getElementById('greeting');
  if (greetingElement && greetingElement.innerText) {
    const greetingText = greetingElement.innerText.trim();

    if (greetingText) {
      // Extract "HEY!" and the rest of the message
      const lines = greetingText.split('\n');
      const heyText = lines[0] || 'HEY!';
      const messageText = lines.slice(1).join(' ') || 'Your sister has sent you a special digital rakhi to celebrate the bond you share.';

      // Draw "HEY!" with larger font size and different color
      context.font = 'bold 30px Trajan, serif'; // Adjust the font style for "HEY!"
      context.fillStyle = '#4D9952'; // Color for "HEY!"
      context.textAlign = 'center';

      const heyX = canvas.width / 2;
      const heyY = canvas.height / 8 - 30; // Adjust position as needed

      context.fillText(heyText, heyX, heyY);

      // Draw the rest of the message with a different font size and color
      context.font = '20px Trajan, serif'; // Adjust the font style for the message
      context.fillStyle = '#6D3900'; // Color for the message

      const maxWidth = canvas.width * 0.7;
      const lineHeight = 30;

      const messageLines = wrapText(context, messageText, maxWidth);
      const messageX = canvas.width / 2;
      let messageY = heyY + 40; // Position below "HEY!" text

      messageLines.forEach((line) => {
        context.fillText(line, messageX, messageY, maxWidth);
        messageY += lineHeight;
      });
    } else {
      console.error('Greeting text is empty or undefined.');
    }
  } else {
    console.error('Greeting element not found or has no text.');
  }
}

function wrapText(context, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = context.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

// Call the drawVideoToCanvas function when initializing the camera
// The canvas element should be passed to this function when initializing the camera session


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
}

function downloadImage(blob) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'digital_rakhi_screenshot.png';
  link.click();
}
