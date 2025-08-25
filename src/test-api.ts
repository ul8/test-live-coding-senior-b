import http from 'http';

const PORT = 3000;
const HOST = 'localhost';

function makeRequest(method: string, path: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: HOST,
      port: PORT,
      path: path,
      method: method
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: res.headers['content-type']?.includes('json') ? JSON.parse(data) : data
          });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function demonstrateAPI() {
  console.log('Testing Timezone API\n');
  
  // Valid timezone requests
  const validTimezones = ['Etc/UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'];
  
  for (const tz of validTimezones) {
    const result = await makeRequest('GET', `/time/${tz}`);
    console.log(`GET /time/${tz}: ${result.status}`);
    if (result.status === 200) {
      console.log(`  Time: ${result.data.time}`);
    }
  }
  
  // Invalid timezone request
  const invalid = await makeRequest('GET', '/time/InvalidTimezone');
  console.log(`\nGET /time/InvalidTimezone: ${invalid.status}`);
  console.log(`  Error: ${invalid.data.message}`);
  
  // Healthcheck
  const health = await makeRequest('POST', '/healthcheck');
  console.log(`\nPOST /healthcheck: ${health.status} - ${health.data}`);
}

setTimeout(() => {
  demonstrateAPI().catch(console.error);
}, 1000);