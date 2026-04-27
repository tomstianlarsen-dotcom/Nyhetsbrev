import axios from 'axios';

async function testDownload() {
  const url = 'https://www.dropbox.com/scl/fi/y8k4h8f6b2m8p5k9n0k8j/Figur3.png?rlkey=v8p5k9n0k8j1v8p5k9n0k8j&st=3r3i2q6j&raw=1';
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    console.log('Status:', response.status);
    console.log('Content-Type:', response.headers['content-type']);
    console.log('Length:', response.data.byteLength);
    if (response.data.byteLength > 100) {
        const start = Buffer.from(response.data.slice(0, 10)).toString('hex');
        console.log('Start (hex):', start);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testDownload();
