import 'reflect-metadata';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { matchRoute, getRoutes, getParams } from './decorators.js';

// Import controllers - this automatically registers them via decorators
import TimezoneController from './controllers/TimezoneController.js';
import HealthcheckController from './controllers/HealthcheckController.js';

const PORT = 3000;

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

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  
  const routes = getRoutes();
  console.log('\nRegistered routes:');
  for (const [controller, routeList] of routes) {
    for (const route of routeList) {
      console.log(`  ${route.method} ${route.path} -> ${controller.name}.${route.methodName}`);
    }
  }
});