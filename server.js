import { createServer } from 'http';
import { URL } from 'url';

const PORT = 3000;

function isValidTimezone(tz) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch (ex) {
    return false;
  }
}

function getCurrentTimeInTimezone(timezone) {
  const now = new Date();
  
  const options = {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    hour12: false
  };
  
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(now);
  
  const dateComponents = {};
  parts.forEach(part => {
    if (part.type !== 'literal') {
      dateComponents[part.type] = part.value;
    }
  });
  
  const isoString = `${dateComponents.year}-${dateComponents.month}-${dateComponents.day}T${dateComponents.hour}:${dateComponents.minute}:${dateComponents.second}.${dateComponents.fractionalSecond || '000'}`;
  
  const tzOffsetDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const offsetMinutes = Math.round((tzOffsetDate - utcDate) / 60000);
  const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
  const offsetMins = Math.abs(offsetMinutes) % 60;
  const offsetSign = offsetMinutes >= 0 ? '+' : '-';
  const offset = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;
  
  return `${isoString}${offset}`;
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;
  
  if (pathname.startsWith('/time/')) {
    const timezone = decodeURIComponent(pathname.substring(6));
    
    if (!timezone) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Timezone parameter is required',
        message: 'Usage: /time/{timezone}'
      }));
      return;
    }
    
    if (!isValidTimezone(timezone)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Invalid timezone',
        message: `'${timezone}' is not a valid timezone identifier`,
        example: 'Try: /time/America/New_York or /time/Etc/UTC'
      }));
      return;
    }
    
    try {
      const isoTime = getCurrentTimeInTimezone(timezone);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        timezone: timezone,
        time: isoTime,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }));
    }
  } else if (pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'Timezone API Server',
      usage: '/time/{timezone}',
      examples: [
        '/time/Etc/UTC',
        '/time/America/New_York',
        '/time/Europe/London',
        '/time/Asia/Tokyo'
      ]
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Not found',
      message: `Path '${pathname}' not found. Use /time/{timezone}`
    }));
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('API endpoint: /time/{timezone}');
  console.log('Example: http://localhost:3000/time/America/New_York');
});