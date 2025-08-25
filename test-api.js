import http from 'http';

const PORT = 3000;
const HOST = 'localhost';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: JSON.parse(data)
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

async function runTests() {
  console.log('Testing Timezone API\n');
  console.log('=' .repeat(50));
  
  const testCases = [
    { path: '/', description: 'Root endpoint' },
    { path: '/time/Etc/UTC', description: 'UTC timezone' },
    { path: '/time/America/New_York', description: 'New York timezone' },
    { path: '/time/Europe/London', description: 'London timezone' },
    { path: '/time/Asia/Tokyo', description: 'Tokyo timezone' },
    { path: '/time/Australia/Sydney', description: 'Sydney timezone' },
    { path: '/time/Africa/Cairo', description: 'Cairo timezone' },
    { path: '/time/Pacific/Auckland', description: 'Auckland timezone' },
    { path: '/time/America/Los_Angeles', description: 'Los Angeles timezone' },
    { path: '/time/Invalid/Timezone', description: 'Invalid timezone (should fail)' },
    { path: '/time/NotATimezone', description: 'Non-existent timezone (should fail)' },
    { path: '/invalid/path', description: 'Invalid path (should return 404)' }
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`\nTest: ${testCase.description}`);
      console.log(`Request: GET ${testCase.path}`);
      
      const response = await makeRequest(testCase.path);
      console.log(`Status: ${response.statusCode}`);
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      if (response.statusCode === 200 && response.data.time) {
        const localTime = new Date().toLocaleString('en-US', { 
          timeZone: response.data.timezone,
          dateStyle: 'short',
          timeStyle: 'medium'
        });
        console.log(`Local representation: ${localTime}`);
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
    
    console.log('-'.repeat(50));
  }
}

setTimeout(() => {
  runTests().catch(console.error);
}, 1000);