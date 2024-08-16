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

  senderContainer.style.display = 'none';
  receiverContainer.style.display = 'flex';

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

        receiverContainer.addEventListener('click', () => handleTap(receiverContainer, cameraContainer, rakhiData));
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
    const message = `Dear ${rakhiData.brotherName},\n\nI'm sending you this digital Rakhi as a symbol of my love. Let’s celebrate the bond that unites us. A promise of lifelong bond – an initiative by Chandak Group.`;

    if (navigator.share) {
      // Log before attempting to share
      console.log('Attempting to share:', { title: 'Send Digital Rakhi', text: message, url: link });

      await navigator.share({
        title: 'Send Digital Rakhi',
        text: message,
        url: link
      });
      console.log('Thanks for sharing!');
    } else {
      // Fallback for browsers that do not support the share API
      console.log('Navigator share not supported, attempting to copy link.');
      
      await navigator.clipboard.writeText(`${message}\n\nLink: ${link}`);
      alert('Link copied to clipboard! Please share manually.');
      console.log('Link copied to clipboard!');
    }
  } catch (err) {
    // Log specific error messages
    console.error('Error during sharing or copying:', err);
    alert('Failed to share or copy link. Please try manually.');
  } finally {
    // Redirect to the thank you page regardless of the share outcome
    window.location.href = 'thank-you.html';
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
