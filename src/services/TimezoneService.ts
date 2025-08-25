export class TimezoneService {
  isValidTimezone(tz: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      return true;
    } catch (ex) {
      return false;
    }
  }
  
  getCurrentTimeInTimezone(timezone: string): string {
    const now = new Date();
    
    const options: Intl.DateTimeFormatOptions = {
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
    
    const dateComponents: Record<string, string> = {};
    parts.forEach(part => {
      if (part.type !== 'literal') {
        dateComponents[part.type] = part.value;
      }
    });
    
    const isoString = `${dateComponents.year}-${dateComponents.month}-${dateComponents.day}T${dateComponents.hour}:${dateComponents.minute}:${dateComponents.second}.${dateComponents.fractionalSecond || '000'}`;
    
    // Calculate timezone offset
    const tzOffsetDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const offsetMinutes = Math.round((tzOffsetDate.getTime() - utcDate.getTime()) / 60000);
    const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
    const offsetMins = Math.abs(offsetMinutes) % 60;
    const offsetSign = offsetMinutes >= 0 ? '+' : '-';
    const offset = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;
    
    return `${isoString}${offset}`;
  }
}