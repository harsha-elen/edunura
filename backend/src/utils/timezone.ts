import SystemSetting from '../models/SystemSetting';

/**
 * Mapping from GMT offset format (used in system settings dropdown)
 * to IANA timezone names (used by Zoom API and standard libraries).
 * Each entry corresponds to a representative city from the Settings dropdown.
 */
const GMT_TO_IANA: Record<string, string> = {
    'GMT-12:00': 'Etc/GMT+12',
    'GMT-11:00': 'Pacific/Midway',
    'GMT-10:00': 'Pacific/Honolulu',
    'GMT-09:00': 'America/Anchorage',
    'GMT-08:00': 'America/Los_Angeles',
    'GMT-07:00': 'America/Denver',
    'GMT-06:00': 'America/Chicago',
    'GMT-05:00': 'America/New_York',
    'GMT-04:00': 'America/Halifax',
    'GMT-03:30': 'America/St_Johns',
    'GMT-03:00': 'America/Sao_Paulo',
    'GMT-02:00': 'Atlantic/South_Georgia',
    'GMT-01:00': 'Atlantic/Azores',
    'GMT+00:00': 'Europe/London',
    'GMT+01:00': 'Europe/Paris',
    'GMT+02:00': 'Europe/Helsinki',
    'GMT+03:00': 'Europe/Moscow',
    'GMT+03:30': 'Asia/Tehran',
    'GMT+04:00': 'Asia/Dubai',
    'GMT+04:30': 'Asia/Kabul',
    'GMT+05:00': 'Asia/Karachi',
    'GMT+05:30': 'Asia/Kolkata',
    'GMT+05:45': 'Asia/Kathmandu',
    'GMT+06:00': 'Asia/Dhaka',
    'GMT+06:30': 'Asia/Yangon',
    'GMT+07:00': 'Asia/Bangkok',
    'GMT+08:00': 'Asia/Shanghai',
    'GMT+09:00': 'Asia/Tokyo',
    'GMT+09:30': 'Australia/Adelaide',
    'GMT+10:00': 'Australia/Sydney',
    'GMT+11:00': 'Pacific/Guadalcanal',
    'GMT+12:00': 'Pacific/Auckland',
    'GMT+13:00': 'Pacific/Tongatapu',
    'GMT+14:00': 'Pacific/Kiritimati',
};

/**
 * Parse a GMT offset string like "GMT+05:30" to offset in minutes.
 * Positive = east of UTC, Negative = west of UTC.
 * Returns 0 if the string is malformed.
 */
export function parseGmtOffset(gmtString: string): number {
    const match = gmtString.match(/GMT([+-])(\d{2}):(\d{2})/);
    if (!match) return 0;
    const sign = match[1] === '+' ? 1 : -1;
    const hours = parseInt(match[2]);
    const mins = parseInt(match[3]);
    return sign * (hours * 60 + mins);
}

/**
 * Convert a GMT offset string to an IANA timezone name for Zoom API.
 * Falls back to 'Asia/Kolkata' if no mapping found.
 */
export function gmtToIana(gmtString: string): string {
    return GMT_TO_IANA[gmtString] || 'Asia/Kolkata';
}

/**
 * Parse a naive datetime string (from <input type="datetime-local">) as being
 * in the specified GMT offset timezone. Returns a proper UTC Date object.
 *
 * Example: parseNaiveDateInTimezone("2026-02-14T15:30", "GMT+05:30")
 *   → Date representing 2026-02-14T10:00:00Z (15:30 IST = 10:00 UTC)
 *
 * Example: parseNaiveDateInTimezone("2026-02-14T15:30", "GMT-05:00")
 *   → Date representing 2026-02-14T20:30:00Z (15:30 EST = 20:30 UTC)
 */
export function parseNaiveDateInTimezone(naiveDatetime: string, gmtTimezone: string): Date {
    const offsetMinutes = parseGmtOffset(gmtTimezone);
    // Treat the naive datetime as if it were UTC, then subtract the timezone
    // offset to get the actual UTC time.
    // e.g. "15:30" in GMT+05:30 → UTC is 15:30 - 5:30 = 10:00
    const asUtc = new Date(naiveDatetime + 'Z');
    return new Date(asUtc.getTime() - offsetMinutes * 60000);
}

/**
 * Convert a UTC Date to a naive local time string for a given GMT offset timezone.
 * Used when we need to send local time to Zoom API.
 *
 * Example: utcToNaiveLocal(new Date("2026-02-14T10:00:00Z"), "GMT+05:30")
 *   → "2026-02-14T15:30:00"
 */
export function utcToNaiveLocal(utcDate: Date, gmtTimezone: string): string {
    const offsetMinutes = parseGmtOffset(gmtTimezone);
    const localMs = utcDate.getTime() + offsetMinutes * 60000;
    return new Date(localMs).toISOString().slice(0, 19);
}

/**
 * Fetch the system timezone configuration from database settings.
 * Returns the IANA timezone name, offset in minutes, and raw GMT string.
 * Defaults to 'GMT+05:30' (Asia/Kolkata) if not configured.
 */
export async function getSystemTimezone(): Promise<{
    iana: string;
    offsetMinutes: number;
    gmtString: string;
}> {
    const setting = await SystemSetting.findOne({ where: { key: 'localization_timezone' } });
    const gmtString = setting?.value || 'GMT+05:30';
    return {
        iana: gmtToIana(gmtString),
        offsetMinutes: parseGmtOffset(gmtString),
        gmtString,
    };
}
