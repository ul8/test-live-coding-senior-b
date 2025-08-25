import WebSocket from 'ws';

async function testWebSocket(timezone: string) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:3000/time/live/${timezone}`);
    
    let messageCount = 0;
    const maxMessages = 5;
    
    ws.on('open', () => {
      console.log(`WebSocket connected to /time/live/${timezone}`);
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      console.log(`Message ${++messageCount}:`, message);
      
      if (messageCount >= maxMessages) {
        ws.close();
        resolve(message);
      }
    });
    
    ws.on('close', () => {
      console.log(`WebSocket closed for ${timezone}`);
      resolve(null);
    });
    
    ws.on('error', (error) => {
      console.error(`WebSocket error for ${timezone}:`, error.message);
      reject(error);
    });
    
    // Close after 10 seconds max
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
        resolve(null);
      }
    }, 10000);
  });
}

async function runWebSocketTests() {
  console.log('Testing WebSocket endpoints...\n');
  
  try {
    console.log('1. Testing valid timezone (America/New_York)');
    await testWebSocket('America/New_York');
    
    console.log('\n2. Testing valid timezone (Europe/London)');
    await testWebSocket('Europe/London');
    
    console.log('\n3. Testing invalid timezone');
    await testWebSocket('InvalidTimezone');
    
  } catch (error: any) {
    console.error('Test error:', error.message);
  }
  
  console.log('\nWebSocket tests completed.');
  process.exit(0);
}

setTimeout(() => {
  runWebSocketTests();
}, 2000);