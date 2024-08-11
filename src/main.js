import {
  bootstrapCameraKit,
  createMediaStreamSource,
} from '@snap/camera-kit';

document.addEventListener('DOMContentLoaded', async function() {
  await startCameraKit();
});

async function startCameraKit() {
  try {
    const cameraKit = await bootstrapCameraKit({
      apiToken: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzA2NzExNzk4LCJzdWIiOiJhNWQ0ZjU2NC0yZTM0LTQyN2EtODI1Ni03OGE2NTFhODc0ZTR-U1RBR0lOR35mMzBjN2JmNy1lNjhjLTRhNzUtOWFlNC05NmJjOTNkOGIyOGYifQ.xLriKo1jpzUBAc1wfGpLVeQ44Ewqncblby-wYE1vRu0'
    });

    const session = await cameraKit.createSession();

    const canvasElement = document.getElementById('canvas');
    if (canvasElement) {
      document.body.appendChild(session.output.live);

      const { lenses } = await cameraKit.lensRepository.loadLensGroups(['fdd0879f-c570-490e-9dfc-cba0f122699f']);
      session.applyLens(lenses[0]);

      let mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: window.innerWidth, height: window.innerHeight, facingMode: 'environment' }
      });

      const source = createMediaStreamSource(mediaStream, { cameraType: 'back' });
      await session.setSource(source);
      session.source.setRenderSize(window.innerWidth, window.innerHeight);
      session.play();
    } else {
      console.error('Canvas element not found');
    }
  } catch (error) {
    console.error('Error initializing camera kit or session:', error);
  }
}

import {
  bootstrapCameraKit,
  createMediaStreamSource,
} from '@snap/camera-kit';

document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  if (token) {
    startCameraKit();
  } else {
    setupForm();
  }
});

function setupForm() {
  const form = document.getElementById('rakhiForm');

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
    const uniqueLink = `${window.location.origin}${window.location.pathname}?token=${token}`;
    handleSharing(uniqueLink);
  });
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


    const session = await cameraKit.createSession();

    const canvasElement = document.getElementById('canvas');
    if (canvasElement) {
      document.body.appendChild(session.output.live);

      const { lenses } = await cameraKit.lensRepository.loadLensGroups(['fdd0879f-c570-490e-9dfc-cba0f122699f']);
      session.applyLens(lenses[0]);

      let mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: window.innerWidth, height: window.innerHeight, facingMode: 'environment' }
      });

      const source = createMediaStreamSource(mediaStream, { cameraType: 'back' });
      await session.setSource(source);
      session.source.setRenderSize(window.innerWidth, window.innerHeight);
      session.play();
    } else {
      console.error('Canvas element not found');
    }
  } catch (error) {
    console.error('Error initializing camera kit or session:', error);
  }
}
