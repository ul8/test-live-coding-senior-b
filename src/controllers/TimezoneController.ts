import { Controller, Get, Param } from '../decorators.js';
import { TimezoneService } from '../services/TimezoneService.js';

interface ApiResponse {
  status: number;
  body: any;
}

@Controller()
class TimezoneController {
  @Get("/time/:timezone")
  getTimezone(
    @Param(":timezone") timezone: string,
    timezoneService: TimezoneService
  ): ApiResponse {
    if (!timezoneService.isValidTimezone(timezone)) {
      return {
        status: 400,
        body: {
          error: 'Invalid timezone',
          message: `'${timezone}' is not a valid timezone identifier`,
          example: 'Try: /time/America/New_York or /time/Etc/UTC'
        }
      };
    }
    
    try {
      const isoTime = timezoneService.getCurrentTimeInTimezone(timezone);
      return {
        status: 200,
        body: {
          timezone: timezone,
          time: isoTime,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      return {
        status: 500,
        body: {
          error: 'Internal server error',
          message: error.message
        }
      };
    }
  }

  // Demonstrate parameter order flexibility - service first, then param
  @Get("/timecheck/:timezone")
  getTimezoneAlternate(
    timezoneService: TimezoneService,
    @Param(":timezone") timezone: string
  ): ApiResponse {
    // Same logic, different parameter order
    if (!timezoneService.isValidTimezone(timezone)) {
      return {
        status: 400,
        body: {
          error: 'Invalid timezone',
          message: `'${timezone}' is not a valid timezone identifier`,
          note: 'Parameter order changed - service first, param second, but still works!'
        }
      };
    }
    
    const isoTime = timezoneService.getCurrentTimeInTimezone(timezone);
    return {
      status: 200,
      body: {
        timezone: timezone,
        time: isoTime,
        timestamp: new Date().toISOString(),
        note: 'Service injected first, parameter second - order doesn\'t matter!'
      }
    };
  }
}

export default TimezoneController;