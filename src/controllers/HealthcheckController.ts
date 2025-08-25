import { Controller, Post } from '../decorators.js';

interface ApiResponse {
  status: number;
  body: any;
}

@Controller()
class HealthcheckController {
  @Post("/healthcheck")
  healthcheck(): ApiResponse {
    return {
      status: 200,
      body: "OK"
    };
  }
}

export default HealthcheckController;