import { WebSocket, Param } from '../decorators.js';
import { TimezoneService } from '../services/TimezoneService.js';
import WebSocketClient from 'ws';

export interface Client {
  send(data: string): void;
  close(): void;
  on(event: string, callback: (...args: any[]) => void): void;
}

@WebSocket("/time/live/:timezone")
class TimezoneWebSocket {
  private interval: NodeJS.Timeout | null = null;
  
  constructor(
    private timezoneService: TimezoneService,
    @Param(":timezone") private timezone: string
  ) {
  }
  
  onConnect(client: Client) {
    console.log(`WebSocket connected for timezone: ${this.timezone}`);
    
    // Validate timezone
    if (!this.timezoneService.isValidTimezone(this.timezone)) {
      client.send(JSON.stringify({
        error: 'Invalid timezone',
        message: `'${this.timezone}' is not a valid timezone identifier`
      }));
      client.close();
      return;
    }
    
    // Send initial time
    this.sendTime(client);
    
    // Send time every second
    this.interval = setInterval(() => {
      this.sendTime(client);
    }, 1000);
    
    // Handle client disconnect
    client.on('close', () => {
      console.log(`WebSocket disconnected for timezone: ${this.timezone}`);
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
    });
    
    // Handle errors
    client.on('error', (error: any) => {
      console.error(`WebSocket error for timezone ${this.timezone}:`, error);
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
    });
  }
  
  private sendTime(client: Client) {
    try {
      const time = this.timezoneService.getCurrentTimeInTimezone(this.timezone);
      client.send(JSON.stringify({
        timezone: this.timezone,
        time: time,
        timestamp: new Date().toISOString()
      }));
    } catch (error: any) {
      client.send(JSON.stringify({
        error: 'Failed to get time',
        message: error.message
      }));
    }
  }
}

export default TimezoneWebSocket;