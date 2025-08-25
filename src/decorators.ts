import 'reflect-metadata';

// Enable getting parameter types at runtime
export function enableServiceInjection(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
  const paramTypes = Reflect.getMetadata('design:paramtypes', target, propertyKey) || [];
  const key = `${target.constructor.name}.${String(propertyKey)}`;
  
  if (!paramsMap.has(key)) {
    paramsMap.set(key, []);
  }
  
  const existingParams = paramsMap.get(key)!;
  
  // Check each parameter type and mark services for injection
  paramTypes.forEach((paramType: any, index: number) => {
    // Skip if already has a decorator (like @Param)
    const alreadyDecorated = existingParams.some(p => p.index === index);
    if (!alreadyDecorated && paramType && paramType.name && paramType.name.endsWith('Service')) {
      existingParams.push({
        index,
        type: 'service',
        serviceClass: paramType
      });
    }
  });
}

interface RouteDefinition {
  method: string;
  path: string;
  methodName: string;
}

interface ParamDefinition {
  index: number;
  type: 'param' | 'service';
  name?: string;
  serviceClass?: any;
}

const routesMap = new Map<any, RouteDefinition[]>();
const paramsMap = new Map<string, ParamDefinition[]>();

export function Controller(): ClassDecorator {
  return (target: any) => {
    // Just marks the class as a controller, no extra logic needed for our use case
  };
}

export function Get(path: string): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    if (!routesMap.has(target.constructor)) {
      routesMap.set(target.constructor, []);
    }
    const routes = routesMap.get(target.constructor)!;
    routes.push({
      method: 'GET',
      path,
      methodName: propertyKey as string
    });
    
    // Enable automatic service injection
    enableServiceInjection(target, propertyKey, descriptor);
  };
}

export function Post(path: string): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    if (!routesMap.has(target.constructor)) {
      routesMap.set(target.constructor, []);
    }
    const routes = routesMap.get(target.constructor)!;
    routes.push({
      method: 'POST',
      path,
      methodName: propertyKey as string
    });
    
    // Enable automatic service injection
    enableServiceInjection(target, propertyKey, descriptor);
  };
}

export function Param(paramName: string): ParameterDecorator {
  return (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    const key = `${target.constructor.name}.${String(propertyKey)}`;
    if (!paramsMap.has(key)) {
      paramsMap.set(key, []);
    }
    const params = paramsMap.get(key)!;
    params.push({
      index: parameterIndex,
      type: 'param',
      name: paramName
    });
  };
}

export function getRoutes() {
  return routesMap;
}

export function getParams() {
  return paramsMap;
}

export function parsePathParams(routePath: string, actualPath: string): Record<string, string> | null {
  const routeParts = routePath.split('/').filter(p => p);
  const actualParts = actualPath.split('/').filter(p => p);
  
  if (routeParts.length === 0 && actualParts.length === 0) {
    return {};
  }
  
  const params: Record<string, string> = {};
  let routeIndex = 0;
  let actualIndex = 0;
  
  while (routeIndex < routeParts.length && actualIndex < actualParts.length) {
    const routePart = routeParts[routeIndex];
    
    if (routePart.startsWith(':')) {
      const paramName = routePart;
      
      // For the last route part, capture everything remaining (for paths like /time/America/New_York)
      if (routeIndex === routeParts.length - 1) {
        const remainingParts = actualParts.slice(actualIndex);
        params[paramName] = decodeURIComponent(remainingParts.join('/'));
        actualIndex = actualParts.length;
      } else {
        params[paramName] = decodeURIComponent(actualParts[actualIndex]);
        actualIndex++;
      }
      routeIndex++;
    } else if (routePart === actualParts[actualIndex]) {
      routeIndex++;
      actualIndex++;
    } else {
      return null;
    }
  }
  
  // Check if we consumed all parts
  if (routeIndex !== routeParts.length || actualIndex !== actualParts.length) {
    return null;
  }
  
  return params;
}

export interface RouteMatch {
  controller: any;
  method: string;
  handler: string;
  params: Record<string, string>;
}

// Service registry
const servicesMap = new Map<any, any>();

export function Service(): ClassDecorator {
  return (target: any) => {
    // Services are registered when instantiated
  };
}

export function registerService(serviceClass: any, instance: any) {
  servicesMap.set(serviceClass, instance);
}

export function getService(serviceClass: any): any {
  return servicesMap.get(serviceClass);
}

export function matchRoute(method: string, path: string): RouteMatch | null {
  for (const [controllerClass, routes] of routesMap) {
    for (const route of routes) {
      if (route.method !== method) continue;
      
      const params = parsePathParams(route.path, path);
      if (params !== null) {
        return {
          controller: controllerClass,
          method: route.method,
          handler: route.methodName,
          params
        };
      }
    }
  }
  return null;
}