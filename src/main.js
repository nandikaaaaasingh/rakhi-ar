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

        receiverContainer.addEventListener('click', () => handleTap(receiverContainer));
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

async function handleTap(receiverContainer) {
  try {
    await startCameraKit();

    receiverContainer.style.opacity = 0;
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
  try {
    const cameraKit = await bootstrapCameraKit({
      apiToken: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzA2NzExNzk4LCJzdWIiOiJhNWQ0ZjU2NC0yZTM0LTQyN2EtODI1Ni03OGE2NTFhODc0ZTR-U1RBR0lOR35mMzBjN2JmNy1lNjhjLTRhNzUtOWFlNC05NmJjOTNkOGIyOGYifQ.xLriKo1jpzUBAc1wfGpLVeQ44Ewqncblby-wYE1vRu0'
    });

    const session = await cameraKit.createSession({
      cameraResolution: '1080p'
    });

    const canvasElement = document.getElementById('canvas');
    if (canvasElement) {
      canvasElement.replaceWith(session.output.live);

      const { lenses } = await cameraKit.lensRepository.loadLensGroups(['f6ec2d36-229a-49c7-ba9d-847d7f287515']);
      session.applyLens(lenses[0]);

      let mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1920, height: 1080, facingMode: 'environment' }
      });

      const source = createMediaStreamSource(mediaStream, { cameraType: 'back' });
      await session.setSource(source);
      session.source.setRenderSize(window.innerWidth, window.innerHeight);
      session.play();

      document.getElementById('captureButton').addEventListener('click', () => logEvent(analytics, 'capture_button_clicked'));
    } else {
      console.error('Canvas element not found');
    }
  } catch (error) {
    console.error('Error initializing camera kit or session:', error);
  }
}
