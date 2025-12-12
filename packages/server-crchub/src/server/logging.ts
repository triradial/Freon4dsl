import * as Koa from "koa";
import { ParsedUrlQuery } from "querystring";
import { config } from "./config.js";

// ANSI Color Codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    underscore: '\x1b[4m',
    blink: '\x1b[5m',
    reverse: '\x1b[7m',
    hidden: '\x1b[8m',
    
    // Foreground colors
    fg: {
        black: '\x1b[30m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',
        gray: '\x1b[90m'
    },
    
    // Background colors
    bg: {
        black: '\x1b[40m',
        red: '\x1b[41m',
        green: '\x1b[42m',
        yellow: '\x1b[43m',
        blue: '\x1b[44m',
        magenta: '\x1b[45m',
        cyan: '\x1b[46m',
        white: '\x1b[47m'
    }
};

// Color utility functions
function colorize(text: string, color: string): string {
    return `${color}${text}${colors.reset}`;
}

function isColorSupported(): boolean {
    // Check if colors are supported (not in CI/CD environments typically)
    return process.stdout.isTTY && !process.env.NO_COLOR && !process.env.CI;
}

// Helper function for console logging
export function consoleLogInfo(operation: string, message: string) {
    const icon = "ℹ️";
    const timestamp = "[" + formatShortTimestamp(new Date()) + "]";
    const coloredMessage = isColorSupported() 
        ? `${colorize(icon, colors.fg.blue)}  ${colorize(timestamp, colors.fg.gray)} ${colorize(operation, colors.fg.blue)}: ${message}`
        : `${icon}  ${timestamp} ${operation}: ${message}`;
    console.log(coloredMessage);
}

export function consoleLogSuccess(operation: string, message: string) {
    const icon = "✅";
    const timestamp = "[" + formatShortTimestamp(new Date()) + "]";
    const coloredMessage = isColorSupported() 
        ? `${colorize(icon, colors.fg.green)} ${colorize(timestamp, colors.fg.gray)} ${colorize(operation, colors.fg.green)}: ${message}`
        : `${icon} ${timestamp} ${operation}: ${message}`;
    console.log(coloredMessage);
}

export function consoleLogError(operation: string, message: string) {
    const icon = "❌";
    const timestamp = "[" + formatShortTimestamp(new Date()) + "]";
    const coloredMessage = isColorSupported() 
        ? `${colorize(icon, colors.fg.red)} ${colorize(timestamp, colors.fg.gray)} ${colorize(operation, colors.fg.red)}: ${message}`
        : `${icon} ${timestamp} ${operation}: ${message}`;
    console.error(coloredMessage);
}

export function consoleLogWarning(operation: string, message: string) {
    const icon = "⚠️";
    const timestamp = "[" + formatShortTimestamp(new Date()) + "]";
    const coloredMessage = isColorSupported() 
        ? `${colorize(icon, colors.fg.yellow)} ${colorize(timestamp, colors.fg.gray)} ${colorize(operation, colors.fg.yellow)}: ${message}`
        : `${icon} ${timestamp} ${operation}: ${message}`;
    console.log(coloredMessage);
}

export function consoleLogRaw(message: string) {
    console.log(message);
}

// Additional colored logging functions
export function consoleLogDebug(message: string) {
    const icon = "🔍";
    const timestamp = "[" + formatShortTimestamp(new Date()) + "]";
    const coloredMessage = isColorSupported()   
        ? `${colorize(icon, colors.fg.magenta)} ${colorize(timestamp, colors.fg.gray)} ${colorize(message, colors.fg.magenta)}`
        : `${icon} ${timestamp} ${message}`;
    console.log(coloredMessage);
}

export function consoleLogWithColor(message: string, color: 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white') {
    const coloredMessage = isColorSupported() 
        ? colorize(message, colors.fg[color])
        : message;
    console.log(coloredMessage);
}

// Format: 09-FEB 01:03pm (no year, no seconds)
function formatShortTimestamp(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const months = [
        'JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'
    ];
    const month = months[date.getMonth()];
    const hours24 = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const hourStr = String(hours24).padStart(2, '0');
    return `${day}-${month} ${hourStr}:${minutes}:${seconds}`;
}

// Existing logger middleware (preserved for compatibility)
interface ILogData {
    method: string;
    url: string;
    query: ParsedUrlQuery;
    remoteAddress: string;
    host: string;
    userAgent: string;
    statusCode: number;
    errorMessage: string;
    errorStack: string;
    data: any;
    responseTime: number;
}

function outputLog(data: Partial<ILogData>, thrownError: any) {
    if (config.prettyLog) {
        console.log(`${data.statusCode} ${data.method} ${data.url} - ${data.responseTime}ms`);
        if (thrownError) {
            console.error(thrownError);
        }
    } else if (data.statusCode < 400) {
        process.stdout.write(JSON.stringify(data) + "\n");
    } else {
        process.stderr.write(JSON.stringify(data) + "\n");
    }
}

export async function logger(ctx: Koa.Context, next: () => Promise<any>) {
    const start = new Date().getMilliseconds();

    const logData: Partial<ILogData> = {
        method: ctx.method,
        url: ctx.url,
        query: ctx.query,
        remoteAddress: ctx.request.ip,
        host: ctx.headers["host"],
        userAgent: ctx.headers["user-agent"],
    };

    let errorThrown: any = null;
    try {
        await next();
        logData.statusCode = ctx.status;
    } catch (e) {
        errorThrown = e;
        if (e instanceof Error) {
            logData.errorMessage = e.message;
            logData.errorStack = e.stack;
            logData.statusCode = (e as any).status || 500;
            if ((e as any).data) {
                logData.data = (e as any).data;
            }
        } else {
            logData.errorMessage = String(e);
            logData.errorStack = undefined;
            logData.statusCode = 500;
        }
    }

    logData.responseTime = new Date().getMilliseconds() - start;
    outputLog(logData, errorThrown);

    if (errorThrown) {
        throw errorThrown;
    }
}
