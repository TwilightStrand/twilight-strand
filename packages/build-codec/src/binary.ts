export class BinaryWriter {
  private buf: number[] = [];

  writeVarint(n: number): void {
    n = n >>> 0;
    while (n > 0x7f) {
      this.buf.push((n & 0x7f) | 0x80);
      n >>>= 7;
    }
    this.buf.push(n & 0x7f);
  }

  writeFloat64(v: number): void {
    const ab = new ArrayBuffer(8);
    new Float64Array(ab)[0] = v;
    const bytes = new Uint8Array(ab);
    for (let i = 0; i < 8; i++) this.buf.push(bytes[i]);
  }

  writeString(s: string): void {
    const encoded = new TextEncoder().encode(s);
    this.writeVarint(encoded.length);
    for (let i = 0; i < encoded.length; i++) this.buf.push(encoded[i]);
  }

  toUint8Array(): Uint8Array {
    return new Uint8Array(this.buf);
  }
}

export class BinaryReader {
  private pos = 0;
  constructor(private data: Uint8Array) {}

  readVarint(): number {
    let result = 0;
    let shift = 0;
    while (this.pos < this.data.length) {
      const b = this.data[this.pos++];
      result |= (b & 0x7f) << shift;
      if ((b & 0x80) === 0) return result >>> 0;
      shift += 7;
    }
    return result >>> 0;
  }

  readFloat64(): number {
    const ab = new ArrayBuffer(8);
    const bytes = new Uint8Array(ab);
    for (let i = 0; i < 8; i++) bytes[i] = this.data[this.pos++];
    return new Float64Array(ab)[0];
  }

  readString(): string {
    const len = this.readVarint();
    const bytes = this.data.slice(this.pos, this.pos + len);
    this.pos += len;
    return new TextDecoder().decode(bytes);
  }
}
