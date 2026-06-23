import { EventEmitter } from 'events';
import type { ReadStream } from 'tty';

export type KeyEvent =
  | { type: 'arrow'; dir: 'up' | 'down' | 'left' | 'right' }
  | { type: 'char'; char: string }
  | { type: 'ctrl'; char: string }
  | { type: 'enter' }
  | { type: 'backspace' };

export class Keyboard extends EventEmitter {
  private stdin: ReadStream;
  private rawMode = false;

  constructor() {
    super();
    this.stdin = process.stdin as ReadStream;
  }

  start(): void {
    if (!this.stdin.isTTY) return;
    this.stdin.setRawMode(true);
    this.stdin.resume();
    this.stdin.setEncoding('utf8');
    this.rawMode = true;

    this.stdin.on('data', (data: string) => {
      this.handleData(data);
    });
  }

  stop(): void {
    if (this.rawMode && this.stdin.isTTY) {
      this.stdin.setRawMode(false);
      this.stdin.pause();
    }
  }

  private handleData(data: string): void {
    // Ctrl+C or Ctrl+D
    if (data === '\x03' || data === '\x04') {
      this.emit('key', { type: 'ctrl', char: data === '\x03' ? 'c' : 'd' });
      return;
    }

    // Arrow keys (escape sequences)
    if (data === '\x1b[A') { this.emit('key', { type: 'arrow', dir: 'up' }); return; }
    if (data === '\x1b[B') { this.emit('key', { type: 'arrow', dir: 'down' }); return; }
    if (data === '\x1b[C') { this.emit('key', { type: 'arrow', dir: 'right' }); return; }
    if (data === '\x1b[D') { this.emit('key', { type: 'arrow', dir: 'left' }); return; }

    // Enter
    if (data === '\r' || data === '\n') {
      this.emit('key', { type: 'enter' });
      return;
    }

    // Backspace
    if (data === '\x7f' || data === '\x08') {
      this.emit('key', { type: 'backspace' });
      return;
    }

    // Printable characters
    if (data.length === 1 && data >= ' ') {
      this.emit('key', { type: 'char', char: data.toLowerCase() });
      return;
    }

    // Multi-char sequences we don't handle
  }
}
