import 'reflect-metadata';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { WebSocketServer } from 'ws';
import { 
  matchRoute, 
  matchWebSocket, 
  getRoutes, 
  getWebSockets, 
  getParams, 
  getConstructorParams,
  registerService, 
  getService 
} from './decorators.js';

// Import services
import { TimezoneService } from './services/TimezoneService.js';

// Import controllers - this automatically registers them via decorators
import TimezoneController from './controllers/TimezoneController.js';
import HealthcheckController from './controllers/HealthcheckController.js';

// Import WebSocket handlers - this automatically registers them via decorators
import TimezoneWebSocket from './websockets/TimezoneWebSocket.js';

// Force WebSocket registration by referencing the class
console.log('Loading WebSocket handlers:', TimezoneWebSocket.name);

const PORT = 3000;

// Register services
registerService(TimezoneService, new TimezoneService());

// Create instances of controllers
const controllers = new Map<any, any>();
controllers.set(TimezoneController, new TimezoneController());
controllers.set(HealthcheckController, new HealthcheckController());

function extractParams(
  controller: any,
  methodName: string,
  routeParams: Record<string, string>
): any[] {
  const paramsMetadata = getParams();
  const key = `${controller.constructor.name}.${methodName}`;
  const metadata = paramsMetadata.get(key) || [];
  
  const args: any[] = [];
  metadata.forEach((paramInfo) => {
    if (paramInfo.type === 'param' && paramInfo.name) {
      args[paramInfo.index] = routeParams[paramInfo.name];
    } else if (paramInfo.type === 'service' && paramInfo.serviceClass) {
      args[paramInfo.index] = getService(paramInfo.serviceClass);
    }
  });
  
  return args;
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const pathname = url.pathname;
  const method = req.method || 'GET';
  
  const routeMatch = matchRoute(method, pathname);
  
  if (routeMatch) {
    const controllerInstance = controllers.get(routeMatch.controller);
    
    if (controllerInstance) {
      // Extract parameters
      const args = extractParams(
        controllerInstance,
        routeMatch.handler,
        routeMatch.params
      );
      
      // Call the controller method
      const result = controllerInstance[routeMatch.handler](...args);
      
      // Handle response
      const status = result.status || 200;
      const contentType = typeof result.body === 'string' ? 'text/plain' : 'application/json';
      
      res.writeHead(status, { 'Content-Type': contentType });
      
      if (typeof result.body === 'string') {
        res.end(result.body);
      } else {
        res.end(JSON.stringify(result.body));
      }
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Not found',
      message: `No route found for ${method} ${pathname}`
    }));
  }
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

function extractConstructorParams(
  webSocketClass: any,
  routeParams: Record<string, string>
): any[] {
  const constructorMetadata = getConstructorParams();
  const key = webSocketClass.name;
  const metadata = constructorMetadata.get(key) || [];
  
  const args: any[] = [];
  metadata.forEach((paramInfo) => {
    if (paramInfo.type === 'param' && paramInfo.name) {
      args[paramInfo.index] = routeParams[paramInfo.name];
    } else if (paramInfo.type === 'service' && paramInfo.serviceClass) {
      args[paramInfo.index] = getService(paramInfo.serviceClass);
    }
  });
  
  return args;
}

wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const pathname = url.pathname;
  
  console.log(`WebSocket connection attempt: ${pathname}`);
  
  const wsMatch = matchWebSocket(pathname);
  
  if (wsMatch) {
    console.log(`Matched WebSocket route: ${wsMatch.path}`);
    
    // Extract constructor parameters
    const args = extractConstructorParams(wsMatch.webSocketClass, wsMatch.params);
    
    // Create WebSocket handler instance
    const wsHandler = new wsMatch.webSocketClass(...args);
    
    // Wrap WebSocket in client interface
    const client = {
      send: (data: string) => ws.send(data),
      close: () => ws.close(),
      on: (event: string, callback: (...args: any[]) => void) => ws.on(event, callback)
    };
    
    // Call onConnect
    if (wsHandler.onConnect) {
      wsHandler.onConnect(client);
    }
  } else {
    console.log(`No WebSocket route matched for: ${pathname}`);
    ws.close();
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`WebSocket server is running on ws://localhost:${PORT}`);
  
  const routes = getRoutes();
  console.log('\nRegistered routes:');
  for (const [controller, routeList] of routes) {
    for (const route of routeList) {
      console.log(`  ${route.method} ${route.path} -> ${controller.name}.${route.methodName}`);
    }
  }
  
  const webSockets = getWebSockets();
  console.log('\nRegistered WebSocket routes:');
  for (const [wsClass, wsInfo] of webSockets) {
    console.log(`  WS ${wsInfo.path} -> ${wsInfo.className}`);
  }
});