// build/dev/javascript/prelude.mjs
var CustomType = class {
  withFields(fields) {
    let properties = Object.keys(this).map(
      (label2) => label2 in fields ? fields[label2] : this[label2]
    );
    return new this.constructor(...properties);
  }
};
var List = class {
  static fromArray(array3, tail) {
    let t = tail || new Empty();
    for (let i = array3.length - 1; i >= 0; --i) {
      t = new NonEmpty(array3[i], t);
    }
    return t;
  }
  [Symbol.iterator]() {
    return new ListIterator(this);
  }
  toArray() {
    return [...this];
  }
  // @internal
  atLeastLength(desired) {
    let current = this;
    while (desired-- > 0 && current) current = current.tail;
    return current !== void 0;
  }
  // @internal
  hasLength(desired) {
    let current = this;
    while (desired-- > 0 && current) current = current.tail;
    return desired === -1 && current instanceof Empty;
  }
  // @internal
  countLength() {
    let current = this;
    let length4 = 0;
    while (current) {
      current = current.tail;
      length4++;
    }
    return length4 - 1;
  }
};
function prepend(element4, tail) {
  return new NonEmpty(element4, tail);
}
function toList(elements, tail) {
  return List.fromArray(elements, tail);
}
var ListIterator = class {
  #current;
  constructor(current) {
    this.#current = current;
  }
  next() {
    if (this.#current instanceof Empty) {
      return { done: true };
    } else {
      let { head: head2, tail } = this.#current;
      this.#current = tail;
      return { value: head2, done: false };
    }
  }
};
var Empty = class extends List {
};
var NonEmpty = class extends List {
  constructor(head2, tail) {
    super();
    this.head = head2;
    this.tail = tail;
  }
};
var BitArray = class {
  /**
   * The size in bits of this bit array's data.
   *
   * @type {number}
   */
  bitSize;
  /**
   * The size in bytes of this bit array's data. If this bit array doesn't store
   * a whole number of bytes then this value is rounded up.
   *
   * @type {number}
   */
  byteSize;
  /**
   * The number of unused high bits in the first byte of this bit array's
   * buffer prior to the start of its data. The value of any unused high bits is
   * undefined.
   *
   * The bit offset will be in the range 0-7.
   *
   * @type {number}
   */
  bitOffset;
  /**
   * The raw bytes that hold this bit array's data.
   *
   * If `bitOffset` is not zero then there are unused high bits in the first
   * byte of this buffer.
   *
   * If `bitOffset + bitSize` is not a multiple of 8 then there are unused low
   * bits in the last byte of this buffer.
   *
   * @type {Uint8Array}
   */
  rawBuffer;
  /**
   * Constructs a new bit array from a `Uint8Array`, an optional size in
   * bits, and an optional bit offset.
   *
   * If no bit size is specified it is taken as `buffer.length * 8`, i.e. all
   * bytes in the buffer make up the new bit array's data.
   *
   * If no bit offset is specified it defaults to zero, i.e. there are no unused
   * high bits in the first byte of the buffer.
   *
   * @param {Uint8Array} buffer
   * @param {number} [bitSize]
   * @param {number} [bitOffset]
   */
  constructor(buffer, bitSize, bitOffset) {
    if (!(buffer instanceof Uint8Array)) {
      throw globalThis.Error(
        "BitArray can only be constructed from a Uint8Array"
      );
    }
    this.bitSize = bitSize ?? buffer.length * 8;
    this.byteSize = Math.trunc((this.bitSize + 7) / 8);
    this.bitOffset = bitOffset ?? 0;
    if (this.bitSize < 0) {
      throw globalThis.Error(`BitArray bit size is invalid: ${this.bitSize}`);
    }
    if (this.bitOffset < 0 || this.bitOffset > 7) {
      throw globalThis.Error(
        `BitArray bit offset is invalid: ${this.bitOffset}`
      );
    }
    if (buffer.length !== Math.trunc((this.bitOffset + this.bitSize + 7) / 8)) {
      throw globalThis.Error("BitArray buffer length is invalid");
    }
    this.rawBuffer = buffer;
  }
  /**
   * Returns a specific byte in this bit array. If the byte index is out of
   * range then `undefined` is returned.
   *
   * When returning the final byte of a bit array with a bit size that's not a
   * multiple of 8, the content of the unused low bits are undefined.
   *
   * @param {number} index
   * @returns {number | undefined}
   */
  byteAt(index5) {
    if (index5 < 0 || index5 >= this.byteSize) {
      return void 0;
    }
    return bitArrayByteAt(this.rawBuffer, this.bitOffset, index5);
  }
  /** @internal */
  equals(other) {
    if (this.bitSize !== other.bitSize) {
      return false;
    }
    const wholeByteCount = Math.trunc(this.bitSize / 8);
    if (this.bitOffset === 0 && other.bitOffset === 0) {
      for (let i = 0; i < wholeByteCount; i++) {
        if (this.rawBuffer[i] !== other.rawBuffer[i]) {
          return false;
        }
      }
      const trailingBitsCount = this.bitSize % 8;
      if (trailingBitsCount) {
        const unusedLowBitCount = 8 - trailingBitsCount;
        if (this.rawBuffer[wholeByteCount] >> unusedLowBitCount !== other.rawBuffer[wholeByteCount] >> unusedLowBitCount) {
          return false;
        }
      }
    } else {
      for (let i = 0; i < wholeByteCount; i++) {
        const a2 = bitArrayByteAt(this.rawBuffer, this.bitOffset, i);
        const b = bitArrayByteAt(other.rawBuffer, other.bitOffset, i);
        if (a2 !== b) {
          return false;
        }
      }
      const trailingBitsCount = this.bitSize % 8;
      if (trailingBitsCount) {
        const a2 = bitArrayByteAt(
          this.rawBuffer,
          this.bitOffset,
          wholeByteCount
        );
        const b = bitArrayByteAt(
          other.rawBuffer,
          other.bitOffset,
          wholeByteCount
        );
        const unusedLowBitCount = 8 - trailingBitsCount;
        if (a2 >> unusedLowBitCount !== b >> unusedLowBitCount) {
          return false;
        }
      }
    }
    return true;
  }
  /**
   * Returns this bit array's internal buffer.
   *
   * @deprecated Use `BitArray.byteAt()` or `BitArray.rawBuffer` instead.
   *
   * @returns {Uint8Array}
   */
  get buffer() {
    bitArrayPrintDeprecationWarning(
      "buffer",
      "Use BitArray.byteAt() or BitArray.rawBuffer instead"
    );
    if (this.bitOffset !== 0 || this.bitSize % 8 !== 0) {
      throw new globalThis.Error(
        "BitArray.buffer does not support unaligned bit arrays"
      );
    }
    return this.rawBuffer;
  }
  /**
   * Returns the length in bytes of this bit array's internal buffer.
   *
   * @deprecated Use `BitArray.bitSize` or `BitArray.byteSize` instead.
   *
   * @returns {number}
   */
  get length() {
    bitArrayPrintDeprecationWarning(
      "length",
      "Use BitArray.bitSize or BitArray.byteSize instead"
    );
    if (this.bitOffset !== 0 || this.bitSize % 8 !== 0) {
      throw new globalThis.Error(
        "BitArray.length does not support unaligned bit arrays"
      );
    }
    return this.rawBuffer.length;
  }
};
function bitArrayByteAt(buffer, bitOffset, index5) {
  if (bitOffset === 0) {
    return buffer[index5] ?? 0;
  } else {
    const a2 = buffer[index5] << bitOffset & 255;
    const b = buffer[index5 + 1] >> 8 - bitOffset;
    return a2 | b;
  }
}
var UtfCodepoint = class {
  constructor(value3) {
    this.value = value3;
  }
};
var isBitArrayDeprecationMessagePrinted = {};
function bitArrayPrintDeprecationWarning(name2, message) {
  if (isBitArrayDeprecationMessagePrinted[name2]) {
    return;
  }
  console.warn(
    `Deprecated BitArray.${name2} property used in JavaScript FFI code. ${message}.`
  );
  isBitArrayDeprecationMessagePrinted[name2] = true;
}
function bitArraySlice(bitArray, start4, end) {
  end ??= bitArray.bitSize;
  bitArrayValidateRange(bitArray, start4, end);
  if (start4 === end) {
    return new BitArray(new Uint8Array());
  }
  if (start4 === 0 && end === bitArray.bitSize) {
    return bitArray;
  }
  start4 += bitArray.bitOffset;
  end += bitArray.bitOffset;
  const startByteIndex = Math.trunc(start4 / 8);
  const endByteIndex = Math.trunc((end + 7) / 8);
  const byteLength = endByteIndex - startByteIndex;
  let buffer;
  if (startByteIndex === 0 && byteLength === bitArray.rawBuffer.byteLength) {
    buffer = bitArray.rawBuffer;
  } else {
    buffer = new Uint8Array(
      bitArray.rawBuffer.buffer,
      bitArray.rawBuffer.byteOffset + startByteIndex,
      byteLength
    );
  }
  return new BitArray(buffer, end - start4, start4 % 8);
}
function toBitArray(segments) {
  if (segments.length === 0) {
    return new BitArray(new Uint8Array());
  }
  if (segments.length === 1) {
    const segment = segments[0];
    if (segment instanceof BitArray) {
      return segment;
    }
    if (segment instanceof Uint8Array) {
      return new BitArray(segment);
    }
    return new BitArray(new Uint8Array(
      /** @type {number[]} */
      segments
    ));
  }
  let bitSize = 0;
  let areAllSegmentsNumbers = true;
  for (const segment of segments) {
    if (segment instanceof BitArray) {
      bitSize += segment.bitSize;
      areAllSegmentsNumbers = false;
    } else if (segment instanceof Uint8Array) {
      bitSize += segment.byteLength * 8;
      areAllSegmentsNumbers = false;
    } else {
      bitSize += 8;
    }
  }
  if (areAllSegmentsNumbers) {
    return new BitArray(new Uint8Array(
      /** @type {number[]} */
      segments
    ));
  }
  const buffer = new Uint8Array(Math.trunc((bitSize + 7) / 8));
  let cursor = 0;
  for (let segment of segments) {
    const isCursorByteAligned = cursor % 8 === 0;
    if (segment instanceof BitArray) {
      if (isCursorByteAligned && segment.bitOffset === 0) {
        buffer.set(segment.rawBuffer, cursor / 8);
        cursor += segment.bitSize;
        const trailingBitsCount = segment.bitSize % 8;
        if (trailingBitsCount !== 0) {
          const lastByteIndex = Math.trunc(cursor / 8);
          buffer[lastByteIndex] >>= 8 - trailingBitsCount;
          buffer[lastByteIndex] <<= 8 - trailingBitsCount;
        }
      } else {
        appendUnalignedBits(
          segment.rawBuffer,
          segment.bitSize,
          segment.bitOffset
        );
      }
    } else if (segment instanceof Uint8Array) {
      if (isCursorByteAligned) {
        buffer.set(segment, cursor / 8);
        cursor += segment.byteLength * 8;
      } else {
        appendUnalignedBits(segment, segment.byteLength * 8, 0);
      }
    } else {
      if (isCursorByteAligned) {
        buffer[cursor / 8] = segment;
        cursor += 8;
      } else {
        appendUnalignedBits(new Uint8Array([segment]), 8, 0);
      }
    }
  }
  function appendUnalignedBits(unalignedBits, size2, offset) {
    if (size2 === 0) {
      return;
    }
    const byteSize = Math.trunc(size2 + 7 / 8);
    const highBitsCount = cursor % 8;
    const lowBitsCount = 8 - highBitsCount;
    let byteIndex = Math.trunc(cursor / 8);
    for (let i = 0; i < byteSize; i++) {
      let byte = bitArrayByteAt(unalignedBits, offset, i);
      if (size2 < 8) {
        byte >>= 8 - size2;
        byte <<= 8 - size2;
      }
      buffer[byteIndex] |= byte >> highBitsCount;
      let appendedBitsCount = size2 - Math.max(0, size2 - lowBitsCount);
      size2 -= appendedBitsCount;
      cursor += appendedBitsCount;
      if (size2 === 0) {
        break;
      }
      buffer[++byteIndex] = byte << lowBitsCount;
      appendedBitsCount = size2 - Math.max(0, size2 - highBitsCount);
      size2 -= appendedBitsCount;
      cursor += appendedBitsCount;
    }
  }
  return new BitArray(buffer, bitSize);
}
function bitArrayValidateRange(bitArray, start4, end) {
  if (start4 < 0 || start4 > bitArray.bitSize || end < start4 || end > bitArray.bitSize) {
    const msg = `Invalid bit array slice: start = ${start4}, end = ${end}, bit size = ${bitArray.bitSize}`;
    throw new globalThis.Error(msg);
  }
}
var utf8Encoder;
function stringBits(string6) {
  utf8Encoder ??= new TextEncoder();
  return utf8Encoder.encode(string6);
}
var Result = class _Result extends CustomType {
  // @internal
  static isResult(data) {
    return data instanceof _Result;
  }
};
var Ok = class extends Result {
  constructor(value3) {
    super();
    this[0] = value3;
  }
  // @internal
  isOk() {
    return true;
  }
};
var Error = class extends Result {
  constructor(detail) {
    super();
    this[0] = detail;
  }
  // @internal
  isOk() {
    return false;
  }
};
function isEqual(x, y) {
  let values3 = [x, y];
  while (values3.length) {
    let a2 = values3.pop();
    let b = values3.pop();
    if (a2 === b) continue;
    if (!isObject(a2) || !isObject(b)) return false;
    let unequal = !structurallyCompatibleObjects(a2, b) || unequalDates(a2, b) || unequalBuffers(a2, b) || unequalArrays(a2, b) || unequalMaps(a2, b) || unequalSets(a2, b) || unequalRegExps(a2, b);
    if (unequal) return false;
    const proto = Object.getPrototypeOf(a2);
    if (proto !== null && typeof proto.equals === "function") {
      try {
        if (a2.equals(b)) continue;
        else return false;
      } catch {
      }
    }
    let [keys2, get3] = getters(a2);
    const ka = keys2(a2);
    const kb = keys2(b);
    if (ka.length !== kb.length) return false;
    for (let k of ka) {
      values3.push(get3(a2, k), get3(b, k));
    }
  }
  return true;
}
function getters(object4) {
  if (object4 instanceof Map) {
    return [(x) => x.keys(), (x, y) => x.get(y)];
  } else {
    let extra = object4 instanceof globalThis.Error ? ["message"] : [];
    return [(x) => [...extra, ...Object.keys(x)], (x, y) => x[y]];
  }
}
function unequalDates(a2, b) {
  return a2 instanceof Date && (a2 > b || a2 < b);
}
function unequalBuffers(a2, b) {
  return !(a2 instanceof BitArray) && a2.buffer instanceof ArrayBuffer && a2.BYTES_PER_ELEMENT && !(a2.byteLength === b.byteLength && a2.every((n, i) => n === b[i]));
}
function unequalArrays(a2, b) {
  return Array.isArray(a2) && a2.length !== b.length;
}
function unequalMaps(a2, b) {
  return a2 instanceof Map && a2.size !== b.size;
}
function unequalSets(a2, b) {
  return a2 instanceof Set && (a2.size != b.size || [...a2].some((e) => !b.has(e)));
}
function unequalRegExps(a2, b) {
  return a2 instanceof RegExp && (a2.source !== b.source || a2.flags !== b.flags);
}
function isObject(a2) {
  return typeof a2 === "object" && a2 !== null;
}
function structurallyCompatibleObjects(a2, b) {
  if (typeof a2 !== "object" && typeof b !== "object" && (!a2 || !b))
    return false;
  let nonstructural = [Promise, WeakSet, WeakMap, Function];
  if (nonstructural.some((c) => a2 instanceof c)) return false;
  return a2.constructor === b.constructor;
}
function remainderInt(a2, b) {
  if (b === 0) {
    return 0;
  } else {
    return a2 % b;
  }
}
function divideInt(a2, b) {
  return Math.trunc(divideFloat(a2, b));
}
function divideFloat(a2, b) {
  if (b === 0) {
    return 0;
  } else {
    return a2 / b;
  }
}
function makeError(variant, file, module, line, fn, message, extra) {
  let error = new globalThis.Error(message);
  error.gleam_error = variant;
  error.file = file;
  error.module = module;
  error.line = line;
  error.function = fn;
  error.fn = fn;
  for (let k in extra) error[k] = extra[k];
  return error;
}

// build/dev/javascript/gleam_stdlib/gleam/option.mjs
var Some = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var None = class extends CustomType {
};
function is_some(option2) {
  return !isEqual(option2, new None());
}
function is_none(option2) {
  return isEqual(option2, new None());
}
function to_result(option2, e) {
  if (option2 instanceof Some) {
    let a2 = option2[0];
    return new Ok(a2);
  } else {
    return new Error(e);
  }
}
function unwrap(option2, default$) {
  if (option2 instanceof Some) {
    let x = option2[0];
    return x;
  } else {
    return default$;
  }
}
function map(option2, fun) {
  if (option2 instanceof Some) {
    let x = option2[0];
    return new Some(fun(x));
  } else {
    return option2;
  }
}
function then$(option2, fun) {
  if (option2 instanceof Some) {
    let x = option2[0];
    return fun(x);
  } else {
    return option2;
  }
}
function or(first2, second) {
  if (first2 instanceof Some) {
    return first2;
  } else {
    return second;
  }
}

// build/dev/javascript/gleam_stdlib/dict.mjs
var referenceMap = /* @__PURE__ */ new WeakMap();
var tempDataView = /* @__PURE__ */ new DataView(
  /* @__PURE__ */ new ArrayBuffer(8)
);
var referenceUID = 0;
function hashByReference(o) {
  const known = referenceMap.get(o);
  if (known !== void 0) {
    return known;
  }
  const hash = referenceUID++;
  if (referenceUID === 2147483647) {
    referenceUID = 0;
  }
  referenceMap.set(o, hash);
  return hash;
}
function hashMerge(a2, b) {
  return a2 ^ b + 2654435769 + (a2 << 6) + (a2 >> 2) | 0;
}
function hashString(s) {
  let hash = 0;
  const len = s.length;
  for (let i = 0; i < len; i++) {
    hash = Math.imul(31, hash) + s.charCodeAt(i) | 0;
  }
  return hash;
}
function hashNumber(n) {
  tempDataView.setFloat64(0, n);
  const i = tempDataView.getInt32(0);
  const j = tempDataView.getInt32(4);
  return Math.imul(73244475, i >> 16 ^ i) ^ j;
}
function hashBigInt(n) {
  return hashString(n.toString());
}
function hashObject(o) {
  const proto = Object.getPrototypeOf(o);
  if (proto !== null && typeof proto.hashCode === "function") {
    try {
      const code2 = o.hashCode(o);
      if (typeof code2 === "number") {
        return code2;
      }
    } catch {
    }
  }
  if (o instanceof Promise || o instanceof WeakSet || o instanceof WeakMap) {
    return hashByReference(o);
  }
  if (o instanceof Date) {
    return hashNumber(o.getTime());
  }
  let h = 0;
  if (o instanceof ArrayBuffer) {
    o = new Uint8Array(o);
  }
  if (Array.isArray(o) || o instanceof Uint8Array) {
    for (let i = 0; i < o.length; i++) {
      h = Math.imul(31, h) + getHash(o[i]) | 0;
    }
  } else if (o instanceof Set) {
    o.forEach((v) => {
      h = h + getHash(v) | 0;
    });
  } else if (o instanceof Map) {
    o.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
  } else {
    const keys2 = Object.keys(o);
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      const v = o[k];
      h = h + hashMerge(getHash(v), hashString(k)) | 0;
    }
  }
  return h;
}
function getHash(u) {
  if (u === null) return 1108378658;
  if (u === void 0) return 1108378659;
  if (u === true) return 1108378657;
  if (u === false) return 1108378656;
  switch (typeof u) {
    case "number":
      return hashNumber(u);
    case "string":
      return hashString(u);
    case "bigint":
      return hashBigInt(u);
    case "object":
      return hashObject(u);
    case "symbol":
      return hashByReference(u);
    case "function":
      return hashByReference(u);
    default:
      return 0;
  }
}
var SHIFT = 5;
var BUCKET_SIZE = Math.pow(2, SHIFT);
var MASK = BUCKET_SIZE - 1;
var MAX_INDEX_NODE = BUCKET_SIZE / 2;
var MIN_ARRAY_NODE = BUCKET_SIZE / 4;
var ENTRY = 0;
var ARRAY_NODE = 1;
var INDEX_NODE = 2;
var COLLISION_NODE = 3;
var EMPTY = {
  type: INDEX_NODE,
  bitmap: 0,
  array: []
};
function mask(hash, shift) {
  return hash >>> shift & MASK;
}
function bitpos(hash, shift) {
  return 1 << mask(hash, shift);
}
function bitcount(x) {
  x -= x >> 1 & 1431655765;
  x = (x & 858993459) + (x >> 2 & 858993459);
  x = x + (x >> 4) & 252645135;
  x += x >> 8;
  x += x >> 16;
  return x & 127;
}
function index(bitmap, bit) {
  return bitcount(bitmap & bit - 1);
}
function cloneAndSet(arr, at, val) {
  const len = arr.length;
  const out = new Array(len);
  for (let i = 0; i < len; ++i) {
    out[i] = arr[i];
  }
  out[at] = val;
  return out;
}
function spliceIn(arr, at, val) {
  const len = arr.length;
  const out = new Array(len + 1);
  let i = 0;
  let g = 0;
  while (i < at) {
    out[g++] = arr[i++];
  }
  out[g++] = val;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function spliceOut(arr, at) {
  const len = arr.length;
  const out = new Array(len - 1);
  let i = 0;
  let g = 0;
  while (i < at) {
    out[g++] = arr[i++];
  }
  ++i;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function createNode(shift, key1, val1, key2hash, key2, val2) {
  const key1hash = getHash(key1);
  if (key1hash === key2hash) {
    return {
      type: COLLISION_NODE,
      hash: key1hash,
      array: [
        { type: ENTRY, k: key1, v: val1 },
        { type: ENTRY, k: key2, v: val2 }
      ]
    };
  }
  const addedLeaf = { val: false };
  return assoc(
    assocIndex(EMPTY, shift, key1hash, key1, val1, addedLeaf),
    shift,
    key2hash,
    key2,
    val2,
    addedLeaf
  );
}
function assoc(root3, shift, hash, key2, val, addedLeaf) {
  switch (root3.type) {
    case ARRAY_NODE:
      return assocArray(root3, shift, hash, key2, val, addedLeaf);
    case INDEX_NODE:
      return assocIndex(root3, shift, hash, key2, val, addedLeaf);
    case COLLISION_NODE:
      return assocCollision(root3, shift, hash, key2, val, addedLeaf);
  }
}
function assocArray(root3, shift, hash, key2, val, addedLeaf) {
  const idx = mask(hash, shift);
  const node = root3.array[idx];
  if (node === void 0) {
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root3.size + 1,
      array: cloneAndSet(root3.array, idx, { type: ENTRY, k: key2, v: val })
    };
  }
  if (node.type === ENTRY) {
    if (isEqual(key2, node.k)) {
      if (val === node.v) {
        return root3;
      }
      return {
        type: ARRAY_NODE,
        size: root3.size,
        array: cloneAndSet(root3.array, idx, {
          type: ENTRY,
          k: key2,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root3.size,
      array: cloneAndSet(
        root3.array,
        idx,
        createNode(shift + SHIFT, node.k, node.v, hash, key2, val)
      )
    };
  }
  const n = assoc(node, shift + SHIFT, hash, key2, val, addedLeaf);
  if (n === node) {
    return root3;
  }
  return {
    type: ARRAY_NODE,
    size: root3.size,
    array: cloneAndSet(root3.array, idx, n)
  };
}
function assocIndex(root3, shift, hash, key2, val, addedLeaf) {
  const bit = bitpos(hash, shift);
  const idx = index(root3.bitmap, bit);
  if ((root3.bitmap & bit) !== 0) {
    const node = root3.array[idx];
    if (node.type !== ENTRY) {
      const n = assoc(node, shift + SHIFT, hash, key2, val, addedLeaf);
      if (n === node) {
        return root3;
      }
      return {
        type: INDEX_NODE,
        bitmap: root3.bitmap,
        array: cloneAndSet(root3.array, idx, n)
      };
    }
    const nodeKey = node.k;
    if (isEqual(key2, nodeKey)) {
      if (val === node.v) {
        return root3;
      }
      return {
        type: INDEX_NODE,
        bitmap: root3.bitmap,
        array: cloneAndSet(root3.array, idx, {
          type: ENTRY,
          k: key2,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: INDEX_NODE,
      bitmap: root3.bitmap,
      array: cloneAndSet(
        root3.array,
        idx,
        createNode(shift + SHIFT, nodeKey, node.v, hash, key2, val)
      )
    };
  } else {
    const n = root3.array.length;
    if (n >= MAX_INDEX_NODE) {
      const nodes = new Array(32);
      const jdx = mask(hash, shift);
      nodes[jdx] = assocIndex(EMPTY, shift + SHIFT, hash, key2, val, addedLeaf);
      let j = 0;
      let bitmap = root3.bitmap;
      for (let i = 0; i < 32; i++) {
        if ((bitmap & 1) !== 0) {
          const node = root3.array[j++];
          nodes[i] = node;
        }
        bitmap = bitmap >>> 1;
      }
      return {
        type: ARRAY_NODE,
        size: n + 1,
        array: nodes
      };
    } else {
      const newArray = spliceIn(root3.array, idx, {
        type: ENTRY,
        k: key2,
        v: val
      });
      addedLeaf.val = true;
      return {
        type: INDEX_NODE,
        bitmap: root3.bitmap | bit,
        array: newArray
      };
    }
  }
}
function assocCollision(root3, shift, hash, key2, val, addedLeaf) {
  if (hash === root3.hash) {
    const idx = collisionIndexOf(root3, key2);
    if (idx !== -1) {
      const entry = root3.array[idx];
      if (entry.v === val) {
        return root3;
      }
      return {
        type: COLLISION_NODE,
        hash,
        array: cloneAndSet(root3.array, idx, { type: ENTRY, k: key2, v: val })
      };
    }
    const size2 = root3.array.length;
    addedLeaf.val = true;
    return {
      type: COLLISION_NODE,
      hash,
      array: cloneAndSet(root3.array, size2, { type: ENTRY, k: key2, v: val })
    };
  }
  return assoc(
    {
      type: INDEX_NODE,
      bitmap: bitpos(root3.hash, shift),
      array: [root3]
    },
    shift,
    hash,
    key2,
    val,
    addedLeaf
  );
}
function collisionIndexOf(root3, key2) {
  const size2 = root3.array.length;
  for (let i = 0; i < size2; i++) {
    if (isEqual(key2, root3.array[i].k)) {
      return i;
    }
  }
  return -1;
}
function find(root3, shift, hash, key2) {
  switch (root3.type) {
    case ARRAY_NODE:
      return findArray(root3, shift, hash, key2);
    case INDEX_NODE:
      return findIndex(root3, shift, hash, key2);
    case COLLISION_NODE:
      return findCollision(root3, key2);
  }
}
function findArray(root3, shift, hash, key2) {
  const idx = mask(hash, shift);
  const node = root3.array[idx];
  if (node === void 0) {
    return void 0;
  }
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key2);
  }
  if (isEqual(key2, node.k)) {
    return node;
  }
  return void 0;
}
function findIndex(root3, shift, hash, key2) {
  const bit = bitpos(hash, shift);
  if ((root3.bitmap & bit) === 0) {
    return void 0;
  }
  const idx = index(root3.bitmap, bit);
  const node = root3.array[idx];
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key2);
  }
  if (isEqual(key2, node.k)) {
    return node;
  }
  return void 0;
}
function findCollision(root3, key2) {
  const idx = collisionIndexOf(root3, key2);
  if (idx < 0) {
    return void 0;
  }
  return root3.array[idx];
}
function without(root3, shift, hash, key2) {
  switch (root3.type) {
    case ARRAY_NODE:
      return withoutArray(root3, shift, hash, key2);
    case INDEX_NODE:
      return withoutIndex(root3, shift, hash, key2);
    case COLLISION_NODE:
      return withoutCollision(root3, key2);
  }
}
function withoutArray(root3, shift, hash, key2) {
  const idx = mask(hash, shift);
  const node = root3.array[idx];
  if (node === void 0) {
    return root3;
  }
  let n = void 0;
  if (node.type === ENTRY) {
    if (!isEqual(node.k, key2)) {
      return root3;
    }
  } else {
    n = without(node, shift + SHIFT, hash, key2);
    if (n === node) {
      return root3;
    }
  }
  if (n === void 0) {
    if (root3.size <= MIN_ARRAY_NODE) {
      const arr = root3.array;
      const out = new Array(root3.size - 1);
      let i = 0;
      let j = 0;
      let bitmap = 0;
      while (i < idx) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      ++i;
      while (i < arr.length) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      return {
        type: INDEX_NODE,
        bitmap,
        array: out
      };
    }
    return {
      type: ARRAY_NODE,
      size: root3.size - 1,
      array: cloneAndSet(root3.array, idx, n)
    };
  }
  return {
    type: ARRAY_NODE,
    size: root3.size,
    array: cloneAndSet(root3.array, idx, n)
  };
}
function withoutIndex(root3, shift, hash, key2) {
  const bit = bitpos(hash, shift);
  if ((root3.bitmap & bit) === 0) {
    return root3;
  }
  const idx = index(root3.bitmap, bit);
  const node = root3.array[idx];
  if (node.type !== ENTRY) {
    const n = without(node, shift + SHIFT, hash, key2);
    if (n === node) {
      return root3;
    }
    if (n !== void 0) {
      return {
        type: INDEX_NODE,
        bitmap: root3.bitmap,
        array: cloneAndSet(root3.array, idx, n)
      };
    }
    if (root3.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root3.bitmap ^ bit,
      array: spliceOut(root3.array, idx)
    };
  }
  if (isEqual(key2, node.k)) {
    if (root3.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root3.bitmap ^ bit,
      array: spliceOut(root3.array, idx)
    };
  }
  return root3;
}
function withoutCollision(root3, key2) {
  const idx = collisionIndexOf(root3, key2);
  if (idx < 0) {
    return root3;
  }
  if (root3.array.length === 1) {
    return void 0;
  }
  return {
    type: COLLISION_NODE,
    hash: root3.hash,
    array: spliceOut(root3.array, idx)
  };
}
function forEach(root3, fn) {
  if (root3 === void 0) {
    return;
  }
  const items = root3.array;
  const size2 = items.length;
  for (let i = 0; i < size2; i++) {
    const item = items[i];
    if (item === void 0) {
      continue;
    }
    if (item.type === ENTRY) {
      fn(item.v, item.k);
      continue;
    }
    forEach(item, fn);
  }
}
var Dict = class _Dict {
  /**
   * @template V
   * @param {Record<string,V>} o
   * @returns {Dict<string,V>}
   */
  static fromObject(o) {
    const keys2 = Object.keys(o);
    let m = _Dict.new();
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      m = m.set(k, o[k]);
    }
    return m;
  }
  /**
   * @template K,V
   * @param {Map<K,V>} o
   * @returns {Dict<K,V>}
   */
  static fromMap(o) {
    let m = _Dict.new();
    o.forEach((v, k) => {
      m = m.set(k, v);
    });
    return m;
  }
  static new() {
    return new _Dict(void 0, 0);
  }
  /**
   * @param {undefined | Node<K,V>} root
   * @param {number} size
   */
  constructor(root3, size2) {
    this.root = root3;
    this.size = size2;
  }
  /**
   * @template NotFound
   * @param {K} key
   * @param {NotFound} notFound
   * @returns {NotFound | V}
   */
  get(key2, notFound) {
    if (this.root === void 0) {
      return notFound;
    }
    const found = find(this.root, 0, getHash(key2), key2);
    if (found === void 0) {
      return notFound;
    }
    return found.v;
  }
  /**
   * @param {K} key
   * @param {V} val
   * @returns {Dict<K,V>}
   */
  set(key2, val) {
    const addedLeaf = { val: false };
    const root3 = this.root === void 0 ? EMPTY : this.root;
    const newRoot = assoc(root3, 0, getHash(key2), key2, val, addedLeaf);
    if (newRoot === this.root) {
      return this;
    }
    return new _Dict(newRoot, addedLeaf.val ? this.size + 1 : this.size);
  }
  /**
   * @param {K} key
   * @returns {Dict<K,V>}
   */
  delete(key2) {
    if (this.root === void 0) {
      return this;
    }
    const newRoot = without(this.root, 0, getHash(key2), key2);
    if (newRoot === this.root) {
      return this;
    }
    if (newRoot === void 0) {
      return _Dict.new();
    }
    return new _Dict(newRoot, this.size - 1);
  }
  /**
   * @param {K} key
   * @returns {boolean}
   */
  has(key2) {
    if (this.root === void 0) {
      return false;
    }
    return find(this.root, 0, getHash(key2), key2) !== void 0;
  }
  /**
   * @returns {[K,V][]}
   */
  entries() {
    if (this.root === void 0) {
      return [];
    }
    const result = [];
    this.forEach((v, k) => result.push([k, v]));
    return result;
  }
  /**
   *
   * @param {(val:V,key:K)=>void} fn
   */
  forEach(fn) {
    forEach(this.root, fn);
  }
  hashCode() {
    let h = 0;
    this.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
    return h;
  }
  /**
   * @param {unknown} o
   * @returns {boolean}
   */
  equals(o) {
    if (!(o instanceof _Dict) || this.size !== o.size) {
      return false;
    }
    try {
      this.forEach((v, k) => {
        if (!isEqual(o.get(k, !v), v)) {
          throw unequalDictSymbol;
        }
      });
      return true;
    } catch (e) {
      if (e === unequalDictSymbol) {
        return false;
      }
      throw e;
    }
  }
};
var unequalDictSymbol = /* @__PURE__ */ Symbol();

// build/dev/javascript/gleam_stdlib/gleam/order.mjs
var Lt = class extends CustomType {
};
var Eq = class extends CustomType {
};
var Gt = class extends CustomType {
};

// build/dev/javascript/gleam_stdlib/gleam/float.mjs
function negate(x) {
  return -1 * x;
}
function round2(x) {
  let $ = x >= 0;
  if ($) {
    return round(x);
  } else {
    return 0 - round(negate(x));
  }
}

// build/dev/javascript/gleam_stdlib/gleam/int.mjs
function remainder(dividend, divisor) {
  if (divisor === 0) {
    return new Error(void 0);
  } else {
    let divisor$1 = divisor;
    return new Ok(remainderInt(dividend, divisor$1));
  }
}

// build/dev/javascript/gleam_stdlib/gleam/list.mjs
var Ascending = class extends CustomType {
};
var Descending = class extends CustomType {
};
function length_loop(loop$list, loop$count) {
  while (true) {
    let list4 = loop$list;
    let count = loop$count;
    if (list4 instanceof Empty) {
      return count;
    } else {
      let list$1 = list4.tail;
      loop$list = list$1;
      loop$count = count + 1;
    }
  }
}
function length(list4) {
  return length_loop(list4, 0);
}
function reverse_and_prepend(loop$prefix, loop$suffix) {
  while (true) {
    let prefix = loop$prefix;
    let suffix = loop$suffix;
    if (prefix instanceof Empty) {
      return suffix;
    } else {
      let first$1 = prefix.head;
      let rest$1 = prefix.tail;
      loop$prefix = rest$1;
      loop$suffix = prepend(first$1, suffix);
    }
  }
}
function reverse(list4) {
  return reverse_and_prepend(list4, toList([]));
}
function first(list4) {
  if (list4 instanceof Empty) {
    return new Error(void 0);
  } else {
    let first$1 = list4.head;
    return new Ok(first$1);
  }
}
function filter_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list4 instanceof Empty) {
      return reverse(acc);
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      let _block;
      let $ = fun(first$1);
      if ($) {
        _block = prepend(first$1, acc);
      } else {
        _block = acc;
      }
      let new_acc = _block;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = new_acc;
    }
  }
}
function filter(list4, predicate) {
  return filter_loop(list4, predicate, toList([]));
}
function map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list4 instanceof Empty) {
      return reverse(acc);
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = prepend(fun(first$1), acc);
    }
  }
}
function map2(list4, fun) {
  return map_loop(list4, fun, toList([]));
}
function index_map_loop(loop$list, loop$fun, loop$index, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let fun = loop$fun;
    let index5 = loop$index;
    let acc = loop$acc;
    if (list4 instanceof Empty) {
      return reverse(acc);
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      let acc$1 = prepend(fun(first$1, index5), acc);
      loop$list = rest$1;
      loop$fun = fun;
      loop$index = index5 + 1;
      loop$acc = acc$1;
    }
  }
}
function index_map(list4, fun) {
  return index_map_loop(list4, fun, 0, toList([]));
}
function append_loop(loop$first, loop$second) {
  while (true) {
    let first2 = loop$first;
    let second = loop$second;
    if (first2 instanceof Empty) {
      return second;
    } else {
      let first$1 = first2.head;
      let rest$1 = first2.tail;
      loop$first = rest$1;
      loop$second = prepend(first$1, second);
    }
  }
}
function append(first2, second) {
  return append_loop(reverse(first2), second);
}
function prepend2(list4, item) {
  return prepend(item, list4);
}
function fold(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list4 = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list4 instanceof Empty) {
      return initial;
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      loop$list = rest$1;
      loop$initial = fun(initial, first$1);
      loop$fun = fun;
    }
  }
}
function sequences(loop$list, loop$compare, loop$growing, loop$direction, loop$prev, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let compare5 = loop$compare;
    let growing = loop$growing;
    let direction = loop$direction;
    let prev = loop$prev;
    let acc = loop$acc;
    let growing$1 = prepend(prev, growing);
    if (list4 instanceof Empty) {
      if (direction instanceof Ascending) {
        return prepend(reverse(growing$1), acc);
      } else {
        return prepend(growing$1, acc);
      }
    } else {
      let new$1 = list4.head;
      let rest$1 = list4.tail;
      let $ = compare5(prev, new$1);
      if (direction instanceof Ascending) {
        if ($ instanceof Lt) {
          loop$list = rest$1;
          loop$compare = compare5;
          loop$growing = growing$1;
          loop$direction = direction;
          loop$prev = new$1;
          loop$acc = acc;
        } else if ($ instanceof Eq) {
          loop$list = rest$1;
          loop$compare = compare5;
          loop$growing = growing$1;
          loop$direction = direction;
          loop$prev = new$1;
          loop$acc = acc;
        } else {
          let _block;
          if (direction instanceof Ascending) {
            _block = prepend(reverse(growing$1), acc);
          } else {
            _block = prepend(growing$1, acc);
          }
          let acc$1 = _block;
          if (rest$1 instanceof Empty) {
            return prepend(toList([new$1]), acc$1);
          } else {
            let next = rest$1.head;
            let rest$2 = rest$1.tail;
            let _block$1;
            let $1 = compare5(new$1, next);
            if ($1 instanceof Lt) {
              _block$1 = new Ascending();
            } else if ($1 instanceof Eq) {
              _block$1 = new Ascending();
            } else {
              _block$1 = new Descending();
            }
            let direction$1 = _block$1;
            loop$list = rest$2;
            loop$compare = compare5;
            loop$growing = toList([new$1]);
            loop$direction = direction$1;
            loop$prev = next;
            loop$acc = acc$1;
          }
        }
      } else if ($ instanceof Lt) {
        let _block;
        if (direction instanceof Ascending) {
          _block = prepend(reverse(growing$1), acc);
        } else {
          _block = prepend(growing$1, acc);
        }
        let acc$1 = _block;
        if (rest$1 instanceof Empty) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next = rest$1.head;
          let rest$2 = rest$1.tail;
          let _block$1;
          let $1 = compare5(new$1, next);
          if ($1 instanceof Lt) {
            _block$1 = new Ascending();
          } else if ($1 instanceof Eq) {
            _block$1 = new Ascending();
          } else {
            _block$1 = new Descending();
          }
          let direction$1 = _block$1;
          loop$list = rest$2;
          loop$compare = compare5;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next;
          loop$acc = acc$1;
        }
      } else if ($ instanceof Eq) {
        let _block;
        if (direction instanceof Ascending) {
          _block = prepend(reverse(growing$1), acc);
        } else {
          _block = prepend(growing$1, acc);
        }
        let acc$1 = _block;
        if (rest$1 instanceof Empty) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next = rest$1.head;
          let rest$2 = rest$1.tail;
          let _block$1;
          let $1 = compare5(new$1, next);
          if ($1 instanceof Lt) {
            _block$1 = new Ascending();
          } else if ($1 instanceof Eq) {
            _block$1 = new Ascending();
          } else {
            _block$1 = new Descending();
          }
          let direction$1 = _block$1;
          loop$list = rest$2;
          loop$compare = compare5;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next;
          loop$acc = acc$1;
        }
      } else {
        loop$list = rest$1;
        loop$compare = compare5;
        loop$growing = growing$1;
        loop$direction = direction;
        loop$prev = new$1;
        loop$acc = acc;
      }
    }
  }
}
function merge_ascendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list22 = loop$list2;
    let compare5 = loop$compare;
    let acc = loop$acc;
    if (list1 instanceof Empty) {
      let list4 = list22;
      return reverse_and_prepend(list4, acc);
    } else if (list22 instanceof Empty) {
      let list4 = list1;
      return reverse_and_prepend(list4, acc);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first2 = list22.head;
      let rest2 = list22.tail;
      let $ = compare5(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare5;
        loop$acc = prepend(first1, acc);
      } else if ($ instanceof Eq) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare5;
        loop$acc = prepend(first2, acc);
      } else {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare5;
        loop$acc = prepend(first2, acc);
      }
    }
  }
}
function merge_ascending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare5 = loop$compare;
    let acc = loop$acc;
    if (sequences2 instanceof Empty) {
      return reverse(acc);
    } else {
      let $ = sequences2.tail;
      if ($ instanceof Empty) {
        let sequence = sequences2.head;
        return reverse(prepend(reverse(sequence), acc));
      } else {
        let ascending1 = sequences2.head;
        let ascending2 = $.head;
        let rest$1 = $.tail;
        let descending = merge_ascendings(
          ascending1,
          ascending2,
          compare5,
          toList([])
        );
        loop$sequences = rest$1;
        loop$compare = compare5;
        loop$acc = prepend(descending, acc);
      }
    }
  }
}
function merge_descendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list22 = loop$list2;
    let compare5 = loop$compare;
    let acc = loop$acc;
    if (list1 instanceof Empty) {
      let list4 = list22;
      return reverse_and_prepend(list4, acc);
    } else if (list22 instanceof Empty) {
      let list4 = list1;
      return reverse_and_prepend(list4, acc);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first2 = list22.head;
      let rest2 = list22.tail;
      let $ = compare5(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare5;
        loop$acc = prepend(first2, acc);
      } else if ($ instanceof Eq) {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare5;
        loop$acc = prepend(first1, acc);
      } else {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare5;
        loop$acc = prepend(first1, acc);
      }
    }
  }
}
function merge_descending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare5 = loop$compare;
    let acc = loop$acc;
    if (sequences2 instanceof Empty) {
      return reverse(acc);
    } else {
      let $ = sequences2.tail;
      if ($ instanceof Empty) {
        let sequence = sequences2.head;
        return reverse(prepend(reverse(sequence), acc));
      } else {
        let descending1 = sequences2.head;
        let descending2 = $.head;
        let rest$1 = $.tail;
        let ascending = merge_descendings(
          descending1,
          descending2,
          compare5,
          toList([])
        );
        loop$sequences = rest$1;
        loop$compare = compare5;
        loop$acc = prepend(ascending, acc);
      }
    }
  }
}
function merge_all(loop$sequences, loop$direction, loop$compare) {
  while (true) {
    let sequences2 = loop$sequences;
    let direction = loop$direction;
    let compare5 = loop$compare;
    if (sequences2 instanceof Empty) {
      return sequences2;
    } else if (direction instanceof Ascending) {
      let $ = sequences2.tail;
      if ($ instanceof Empty) {
        let sequence = sequences2.head;
        return sequence;
      } else {
        let sequences$1 = merge_ascending_pairs(sequences2, compare5, toList([]));
        loop$sequences = sequences$1;
        loop$direction = new Descending();
        loop$compare = compare5;
      }
    } else {
      let $ = sequences2.tail;
      if ($ instanceof Empty) {
        let sequence = sequences2.head;
        return reverse(sequence);
      } else {
        let sequences$1 = merge_descending_pairs(sequences2, compare5, toList([]));
        loop$sequences = sequences$1;
        loop$direction = new Ascending();
        loop$compare = compare5;
      }
    }
  }
}
function sort(list4, compare5) {
  if (list4 instanceof Empty) {
    return list4;
  } else {
    let $ = list4.tail;
    if ($ instanceof Empty) {
      return list4;
    } else {
      let x = list4.head;
      let y = $.head;
      let rest$1 = $.tail;
      let _block;
      let $1 = compare5(x, y);
      if ($1 instanceof Lt) {
        _block = new Ascending();
      } else if ($1 instanceof Eq) {
        _block = new Ascending();
      } else {
        _block = new Descending();
      }
      let direction = _block;
      let sequences$1 = sequences(
        rest$1,
        compare5,
        toList([x]),
        direction,
        y,
        toList([])
      );
      return merge_all(sequences$1, new Ascending(), compare5);
    }
  }
}

// build/dev/javascript/gleam_stdlib/gleam/string.mjs
function compare3(a2, b) {
  let $ = a2 === b;
  if ($) {
    return new Eq();
  } else {
    let $1 = less_than(a2, b);
    if ($1) {
      return new Lt();
    } else {
      return new Gt();
    }
  }
}
function slice(string6, idx, len) {
  let $ = len < 0;
  if ($) {
    return "";
  } else {
    let $1 = idx < 0;
    if ($1) {
      let translated_idx = string_length(string6) + idx;
      let $2 = translated_idx < 0;
      if ($2) {
        return "";
      } else {
        return string_slice(string6, translated_idx, len);
      }
    } else {
      return string_slice(string6, idx, len);
    }
  }
}
function concat_loop(loop$strings, loop$accumulator) {
  while (true) {
    let strings = loop$strings;
    let accumulator = loop$accumulator;
    if (strings instanceof Empty) {
      return accumulator;
    } else {
      let string6 = strings.head;
      let strings$1 = strings.tail;
      loop$strings = strings$1;
      loop$accumulator = accumulator + string6;
    }
  }
}
function concat2(strings) {
  return concat_loop(strings, "");
}
function join_loop(loop$strings, loop$separator, loop$accumulator) {
  while (true) {
    let strings = loop$strings;
    let separator = loop$separator;
    let accumulator = loop$accumulator;
    if (strings instanceof Empty) {
      return accumulator;
    } else {
      let string6 = strings.head;
      let strings$1 = strings.tail;
      loop$strings = strings$1;
      loop$separator = separator;
      loop$accumulator = accumulator + separator + string6;
    }
  }
}
function join(strings, separator) {
  if (strings instanceof Empty) {
    return "";
  } else {
    let first$1 = strings.head;
    let rest = strings.tail;
    return join_loop(rest, separator, first$1);
  }
}
function trim(string6) {
  let _pipe = string6;
  let _pipe$1 = trim_start(_pipe);
  return trim_end(_pipe$1);
}
function split2(x, substring) {
  if (substring === "") {
    return graphemes(x);
  } else {
    let _pipe = x;
    let _pipe$1 = identity(_pipe);
    let _pipe$2 = split(_pipe$1, substring);
    return map2(_pipe$2, identity);
  }
}
function do_to_utf_codepoints(string6) {
  let _pipe = string6;
  let _pipe$1 = string_to_codepoint_integer_list(_pipe);
  return map2(_pipe$1, codepoint);
}
function to_utf_codepoints(string6) {
  return do_to_utf_codepoints(string6);
}
function inspect2(term) {
  let _pipe = inspect(term);
  return identity(_pipe);
}

// build/dev/javascript/gleam_stdlib/gleam/dynamic/decode.mjs
var DecodeError = class extends CustomType {
  constructor(expected, found, path) {
    super();
    this.expected = expected;
    this.found = found;
    this.path = path;
  }
};
var Decoder = class extends CustomType {
  constructor(function$) {
    super();
    this.function = function$;
  }
};
function run(data, decoder) {
  let $ = decoder.function(data);
  let maybe_invalid_data;
  let errors;
  maybe_invalid_data = $[0];
  errors = $[1];
  if (errors instanceof Empty) {
    return new Ok(maybe_invalid_data);
  } else {
    return new Error(errors);
  }
}
function success(data) {
  return new Decoder((_) => {
    return [data, toList([])];
  });
}
function map3(decoder, transformer) {
  return new Decoder(
    (d) => {
      let $ = decoder.function(d);
      let data;
      let errors;
      data = $[0];
      errors = $[1];
      return [transformer(data), errors];
    }
  );
}
function then$2(decoder, next) {
  return new Decoder(
    (dynamic_data) => {
      let $ = decoder.function(dynamic_data);
      let data;
      let errors;
      data = $[0];
      errors = $[1];
      let decoder$1 = next(data);
      let $1 = decoder$1.function(dynamic_data);
      let layer;
      let data$1;
      layer = $1;
      data$1 = $1[0];
      if (errors instanceof Empty) {
        return layer;
      } else {
        return [data$1, errors];
      }
    }
  );
}
function run_decoders(loop$data, loop$failure, loop$decoders) {
  while (true) {
    let data = loop$data;
    let failure2 = loop$failure;
    let decoders = loop$decoders;
    if (decoders instanceof Empty) {
      return failure2;
    } else {
      let decoder = decoders.head;
      let decoders$1 = decoders.tail;
      let $ = decoder.function(data);
      let layer;
      let errors;
      layer = $;
      errors = $[1];
      if (errors instanceof Empty) {
        return layer;
      } else {
        loop$data = data;
        loop$failure = failure2;
        loop$decoders = decoders$1;
      }
    }
  }
}
function one_of(first2, alternatives) {
  return new Decoder(
    (dynamic_data) => {
      let $ = first2.function(dynamic_data);
      let layer;
      let errors;
      layer = $;
      errors = $[1];
      if (errors instanceof Empty) {
        return layer;
      } else {
        return run_decoders(dynamic_data, layer, alternatives);
      }
    }
  );
}
function optional(inner) {
  return new Decoder(
    (data) => {
      let $ = is_null(data);
      if ($) {
        return [new None(), toList([])];
      } else {
        let $1 = inner.function(data);
        let data$1;
        let errors;
        data$1 = $1[0];
        errors = $1[1];
        return [new Some(data$1), errors];
      }
    }
  );
}
function decode_error(expected, found) {
  return toList([
    new DecodeError(expected, classify_dynamic(found), toList([]))
  ]);
}
function run_dynamic_function(data, name2, f) {
  let $ = f(data);
  if ($ instanceof Ok) {
    let data$1 = $[0];
    return [data$1, toList([])];
  } else {
    let zero = $[0];
    return [
      zero,
      toList([new DecodeError(name2, classify_dynamic(data), toList([]))])
    ];
  }
}
function decode_bool(data) {
  let $ = isEqual(identity(true), data);
  if ($) {
    return [true, toList([])];
  } else {
    let $1 = isEqual(identity(false), data);
    if ($1) {
      return [false, toList([])];
    } else {
      return [false, decode_error("Bool", data)];
    }
  }
}
function decode_int(data) {
  return run_dynamic_function(data, "Int", int);
}
function failure(zero, expected) {
  return new Decoder((d) => {
    return [zero, decode_error(expected, d)];
  });
}
function new_primitive_decoder(name2, decoding_function) {
  return new Decoder(
    (d) => {
      let $ = decoding_function(d);
      if ($ instanceof Ok) {
        let t = $[0];
        return [t, toList([])];
      } else {
        let zero = $[0];
        return [
          zero,
          toList([new DecodeError(name2, classify_dynamic(d), toList([]))])
        ];
      }
    }
  );
}
var bool = /* @__PURE__ */ new Decoder(decode_bool);
var int2 = /* @__PURE__ */ new Decoder(decode_int);
function decode_string(data) {
  return run_dynamic_function(data, "String", string2);
}
var string3 = /* @__PURE__ */ new Decoder(decode_string);
function list2(inner) {
  return new Decoder(
    (data) => {
      return list(
        data,
        inner.function,
        (p2, k) => {
          return push_path(p2, toList([k]));
        },
        0,
        toList([])
      );
    }
  );
}
function push_path(layer, path) {
  let decoder = one_of(
    string3,
    toList([
      (() => {
        let _pipe = int2;
        return map3(_pipe, to_string);
      })()
    ])
  );
  let path$1 = map2(
    path,
    (key2) => {
      let key$1 = identity(key2);
      let $ = run(key$1, decoder);
      if ($ instanceof Ok) {
        let key$2 = $[0];
        return key$2;
      } else {
        return "<" + classify_dynamic(key$1) + ">";
      }
    }
  );
  let errors = map2(
    layer[1],
    (error) => {
      return new DecodeError(
        error.expected,
        error.found,
        append(path$1, error.path)
      );
    }
  );
  return [layer[0], errors];
}
function index3(loop$path, loop$position, loop$inner, loop$data, loop$handle_miss) {
  while (true) {
    let path = loop$path;
    let position = loop$position;
    let inner = loop$inner;
    let data = loop$data;
    let handle_miss = loop$handle_miss;
    if (path instanceof Empty) {
      let _pipe = inner(data);
      return push_path(_pipe, reverse(position));
    } else {
      let key2 = path.head;
      let path$1 = path.tail;
      let $ = index2(data, key2);
      if ($ instanceof Ok) {
        let $1 = $[0];
        if ($1 instanceof Some) {
          let data$1 = $1[0];
          loop$path = path$1;
          loop$position = prepend(key2, position);
          loop$inner = inner;
          loop$data = data$1;
          loop$handle_miss = handle_miss;
        } else {
          return handle_miss(data, prepend(key2, position));
        }
      } else {
        let kind = $[0];
        let $1 = inner(data);
        let default$;
        default$ = $1[0];
        let _pipe = [
          default$,
          toList([new DecodeError(kind, classify_dynamic(data), toList([]))])
        ];
        return push_path(_pipe, reverse(position));
      }
    }
  }
}
function subfield(field_path, field_decoder, next) {
  return new Decoder(
    (data) => {
      let $ = index3(
        field_path,
        toList([]),
        field_decoder.function,
        data,
        (data2, position) => {
          let $12 = field_decoder.function(data2);
          let default$;
          default$ = $12[0];
          let _pipe = [
            default$,
            toList([new DecodeError("Field", "Nothing", toList([]))])
          ];
          return push_path(_pipe, reverse(position));
        }
      );
      let out;
      let errors1;
      out = $[0];
      errors1 = $[1];
      let $1 = next(out).function(data);
      let out$1;
      let errors2;
      out$1 = $1[0];
      errors2 = $1[1];
      return [out$1, append(errors1, errors2)];
    }
  );
}
function field(field_name, field_decoder, next) {
  return subfield(toList([field_name]), field_decoder, next);
}

// build/dev/javascript/gleam_stdlib/gleam_stdlib.mjs
var Nil = void 0;
var NOT_FOUND = {};
function identity(x) {
  return x;
}
function to_string(term) {
  return term.toString();
}
function string_length(string6) {
  if (string6 === "") {
    return 0;
  }
  const iterator = graphemes_iterator(string6);
  if (iterator) {
    let i = 0;
    for (const _ of iterator) {
      i++;
    }
    return i;
  } else {
    return string6.match(/./gsu).length;
  }
}
function graphemes(string6) {
  const iterator = graphemes_iterator(string6);
  if (iterator) {
    return List.fromArray(Array.from(iterator).map((item) => item.segment));
  } else {
    return List.fromArray(string6.match(/./gsu));
  }
}
var segmenter = void 0;
function graphemes_iterator(string6) {
  if (globalThis.Intl && Intl.Segmenter) {
    segmenter ||= new Intl.Segmenter();
    return segmenter.segment(string6)[Symbol.iterator]();
  }
}
function pop_codeunit(str) {
  return [str.charCodeAt(0) | 0, str.slice(1)];
}
function lowercase(string6) {
  return string6.toLowerCase();
}
function less_than(a2, b) {
  return a2 < b;
}
function split(xs, pattern) {
  return List.fromArray(xs.split(pattern));
}
function string_slice(string6, idx, len) {
  if (len <= 0 || idx >= string6.length) {
    return "";
  }
  const iterator = graphemes_iterator(string6);
  if (iterator) {
    while (idx-- > 0) {
      iterator.next();
    }
    let result = "";
    while (len-- > 0) {
      const v = iterator.next().value;
      if (v === void 0) {
        break;
      }
      result += v.segment;
    }
    return result;
  } else {
    return string6.match(/./gsu).slice(idx, idx + len).join("");
  }
}
function string_codeunit_slice(str, from2, length4) {
  return str.slice(from2, from2 + length4);
}
function contains_string(haystack, needle) {
  return haystack.indexOf(needle) >= 0;
}
function starts_with(haystack, needle) {
  return haystack.startsWith(needle);
}
var unicode_whitespaces = [
  " ",
  // Space
  "	",
  // Horizontal tab
  "\n",
  // Line feed
  "\v",
  // Vertical tab
  "\f",
  // Form feed
  "\r",
  // Carriage return
  "\x85",
  // Next line
  "\u2028",
  // Line separator
  "\u2029"
  // Paragraph separator
].join("");
var trim_start_regex = /* @__PURE__ */ new RegExp(
  `^[${unicode_whitespaces}]*`
);
var trim_end_regex = /* @__PURE__ */ new RegExp(`[${unicode_whitespaces}]*$`);
function trim_start(string6) {
  return string6.replace(trim_start_regex, "");
}
function trim_end(string6) {
  return string6.replace(trim_end_regex, "");
}
function bit_array_from_string(string6) {
  return toBitArray([stringBits(string6)]);
}
function round(float2) {
  return Math.round(float2);
}
function codepoint(int5) {
  return new UtfCodepoint(int5);
}
function string_to_codepoint_integer_list(string6) {
  return List.fromArray(Array.from(string6).map((item) => item.codePointAt(0)));
}
function utf_codepoint_to_int(utf_codepoint) {
  return utf_codepoint.value;
}
function new_map() {
  return Dict.new();
}
function map_size(map6) {
  return map6.size;
}
function map_get(map6, key2) {
  const value3 = map6.get(key2, NOT_FOUND);
  if (value3 === NOT_FOUND) {
    return new Error(Nil);
  }
  return new Ok(value3);
}
function map_insert(key2, value3, map6) {
  return map6.set(key2, value3);
}
function classify_dynamic(data) {
  if (typeof data === "string") {
    return "String";
  } else if (typeof data === "boolean") {
    return "Bool";
  } else if (data instanceof Result) {
    return "Result";
  } else if (data instanceof List) {
    return "List";
  } else if (data instanceof BitArray) {
    return "BitArray";
  } else if (data instanceof Dict) {
    return "Dict";
  } else if (Number.isInteger(data)) {
    return "Int";
  } else if (Array.isArray(data)) {
    return `Array`;
  } else if (typeof data === "number") {
    return "Float";
  } else if (data === null) {
    return "Nil";
  } else if (data === void 0) {
    return "Nil";
  } else {
    const type = typeof data;
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
}
function inspect(v) {
  return new Inspector().inspect(v);
}
function float_to_string(float2) {
  const string6 = float2.toString().replace("+", "");
  if (string6.indexOf(".") >= 0) {
    return string6;
  } else {
    const index5 = string6.indexOf("e");
    if (index5 >= 0) {
      return string6.slice(0, index5) + ".0" + string6.slice(index5);
    } else {
      return string6 + ".0";
    }
  }
}
var Inspector = class {
  #references = /* @__PURE__ */ new Set();
  inspect(v) {
    const t = typeof v;
    if (v === true) return "True";
    if (v === false) return "False";
    if (v === null) return "//js(null)";
    if (v === void 0) return "Nil";
    if (t === "string") return this.#string(v);
    if (t === "bigint" || Number.isInteger(v)) return v.toString();
    if (t === "number") return float_to_string(v);
    if (v instanceof UtfCodepoint) return this.#utfCodepoint(v);
    if (v instanceof BitArray) return this.#bit_array(v);
    if (v instanceof RegExp) return `//js(${v})`;
    if (v instanceof Date) return `//js(Date("${v.toISOString()}"))`;
    if (v instanceof globalThis.Error) return `//js(${v.toString()})`;
    if (v instanceof Function) {
      const args = [];
      for (const i of Array(v.length).keys())
        args.push(String.fromCharCode(i + 97));
      return `//fn(${args.join(", ")}) { ... }`;
    }
    if (this.#references.size === this.#references.add(v).size) {
      return "//js(circular reference)";
    }
    let printed;
    if (Array.isArray(v)) {
      printed = `#(${v.map((v2) => this.inspect(v2)).join(", ")})`;
    } else if (v instanceof List) {
      printed = this.#list(v);
    } else if (v instanceof CustomType) {
      printed = this.#customType(v);
    } else if (v instanceof Dict) {
      printed = this.#dict(v);
    } else if (v instanceof Set) {
      return `//js(Set(${[...v].map((v2) => this.inspect(v2)).join(", ")}))`;
    } else {
      printed = this.#object(v);
    }
    this.#references.delete(v);
    return printed;
  }
  #object(v) {
    const name2 = Object.getPrototypeOf(v)?.constructor?.name || "Object";
    const props = [];
    for (const k of Object.keys(v)) {
      props.push(`${this.inspect(k)}: ${this.inspect(v[k])}`);
    }
    const body2 = props.length ? " " + props.join(", ") + " " : "";
    const head2 = name2 === "Object" ? "" : name2 + " ";
    return `//js(${head2}{${body2}})`;
  }
  #dict(map6) {
    let body2 = "dict.from_list([";
    let first2 = true;
    map6.forEach((value3, key2) => {
      if (!first2) body2 = body2 + ", ";
      body2 = body2 + "#(" + this.inspect(key2) + ", " + this.inspect(value3) + ")";
      first2 = false;
    });
    return body2 + "])";
  }
  #customType(record) {
    const props = Object.keys(record).map((label2) => {
      const value3 = this.inspect(record[label2]);
      return isNaN(parseInt(label2)) ? `${label2}: ${value3}` : value3;
    }).join(", ");
    return props ? `${record.constructor.name}(${props})` : record.constructor.name;
  }
  #list(list4) {
    if (list4 instanceof Empty) {
      return "[]";
    }
    let char_out = 'charlist.from_string("';
    let list_out = "[";
    let current = list4;
    while (current instanceof NonEmpty) {
      let element4 = current.head;
      current = current.tail;
      if (list_out !== "[") {
        list_out += ", ";
      }
      list_out += this.inspect(element4);
      if (char_out) {
        if (Number.isInteger(element4) && element4 >= 32 && element4 <= 126) {
          char_out += String.fromCharCode(element4);
        } else {
          char_out = null;
        }
      }
    }
    if (char_out) {
      return char_out + '")';
    } else {
      return list_out + "]";
    }
  }
  #string(str) {
    let new_str = '"';
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      switch (char) {
        case "\n":
          new_str += "\\n";
          break;
        case "\r":
          new_str += "\\r";
          break;
        case "	":
          new_str += "\\t";
          break;
        case "\f":
          new_str += "\\f";
          break;
        case "\\":
          new_str += "\\\\";
          break;
        case '"':
          new_str += '\\"';
          break;
        default:
          if (char < " " || char > "~" && char < "\xA0") {
            new_str += "\\u{" + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0") + "}";
          } else {
            new_str += char;
          }
      }
    }
    new_str += '"';
    return new_str;
  }
  #utfCodepoint(codepoint2) {
    return `//utfcodepoint(${String.fromCodePoint(codepoint2.value)})`;
  }
  #bit_array(bits) {
    if (bits.bitSize === 0) {
      return "<<>>";
    }
    let acc = "<<";
    for (let i = 0; i < bits.byteSize - 1; i++) {
      acc += bits.byteAt(i).toString();
      acc += ", ";
    }
    if (bits.byteSize * 8 === bits.bitSize) {
      acc += bits.byteAt(bits.byteSize - 1).toString();
    } else {
      const trailingBitsCount = bits.bitSize % 8;
      acc += bits.byteAt(bits.byteSize - 1) >> 8 - trailingBitsCount;
      acc += `:size(${trailingBitsCount})`;
    }
    acc += ">>";
    return acc;
  }
};
function index2(data, key2) {
  if (data instanceof Dict || data instanceof WeakMap || data instanceof Map) {
    const token = {};
    const entry = data.get(key2, token);
    if (entry === token) return new Ok(new None());
    return new Ok(new Some(entry));
  }
  const key_is_int = Number.isInteger(key2);
  if (key_is_int && key2 >= 0 && key2 < 8 && data instanceof List) {
    let i = 0;
    for (const value3 of data) {
      if (i === key2) return new Ok(new Some(value3));
      i++;
    }
    return new Error("Indexable");
  }
  if (key_is_int && Array.isArray(data) || data && typeof data === "object" || data && Object.getPrototypeOf(data) === Object.prototype) {
    if (key2 in data) return new Ok(new Some(data[key2]));
    return new Ok(new None());
  }
  return new Error(key_is_int ? "Indexable" : "Dict");
}
function list(data, decode2, pushPath, index5, emptyList) {
  if (!(data instanceof List || Array.isArray(data))) {
    const error = new DecodeError("List", classify_dynamic(data), emptyList);
    return [emptyList, List.fromArray([error])];
  }
  const decoded = [];
  for (const element4 of data) {
    const layer = decode2(element4);
    const [out, errors] = layer;
    if (errors instanceof NonEmpty) {
      const [_, errors2] = pushPath(layer, index5.toString());
      return [emptyList, errors2];
    }
    decoded.push(out);
    index5++;
  }
  return [List.fromArray(decoded), emptyList];
}
function int(data) {
  if (Number.isInteger(data)) return new Ok(data);
  return new Error(0);
}
function string2(data) {
  if (typeof data === "string") return new Ok(data);
  return new Error("");
}
function is_null(data) {
  return data === null || data === void 0;
}

// build/dev/javascript/gleam_stdlib/gleam/dict.mjs
function insert(dict3, key2, value3) {
  return map_insert(key2, value3, dict3);
}
function from_list_loop(loop$list, loop$initial) {
  while (true) {
    let list4 = loop$list;
    let initial = loop$initial;
    if (list4 instanceof Empty) {
      return initial;
    } else {
      let rest = list4.tail;
      let key2 = list4.head[0];
      let value3 = list4.head[1];
      loop$list = rest;
      loop$initial = insert(initial, key2, value3);
    }
  }
}
function from_list(list4) {
  return from_list_loop(list4, new_map());
}

// build/dev/javascript/gleam_stdlib/gleam/result.mjs
function map_error(result, fun) {
  if (result instanceof Ok) {
    return result;
  } else {
    let error = result[0];
    return new Error(fun(error));
  }
}
function try$(result, fun) {
  if (result instanceof Ok) {
    let x = result[0];
    return fun(x);
  } else {
    return result;
  }
}
function then$3(result, fun) {
  return try$(result, fun);
}
function unwrap2(result, default$) {
  if (result instanceof Ok) {
    let v = result[0];
    return v;
  } else {
    return default$;
  }
}

// build/dev/javascript/gleam_stdlib/gleam/bool.mjs
function to_string2(bool4) {
  if (bool4) {
    return "True";
  } else {
    return "False";
  }
}
function guard(requirement, consequence, alternative) {
  if (requirement) {
    return consequence;
  } else {
    return alternative();
  }
}

// build/dev/javascript/gleam_stdlib/gleam/function.mjs
function identity2(x) {
  return x;
}

// build/dev/javascript/gleam_json/gleam_json_ffi.mjs
function identity3(x) {
  return x;
}
function decode(string6) {
  try {
    const result = JSON.parse(string6);
    return new Ok(result);
  } catch (err) {
    return new Error(getJsonDecodeError(err, string6));
  }
}
function getJsonDecodeError(stdErr, json2) {
  if (isUnexpectedEndOfInput(stdErr)) return new UnexpectedEndOfInput();
  return toUnexpectedByteError(stdErr, json2);
}
function isUnexpectedEndOfInput(err) {
  const unexpectedEndOfInputRegex = /((unexpected (end|eof))|(end of data)|(unterminated string)|(json( parse error|\.parse)\: expected '(\:|\}|\])'))/i;
  return unexpectedEndOfInputRegex.test(err.message);
}
function toUnexpectedByteError(err, json2) {
  let converters = [
    v8UnexpectedByteError,
    oldV8UnexpectedByteError,
    jsCoreUnexpectedByteError,
    spidermonkeyUnexpectedByteError
  ];
  for (let converter of converters) {
    let result = converter(err, json2);
    if (result) return result;
  }
  return new UnexpectedByte("", 0);
}
function v8UnexpectedByteError(err) {
  const regex = /unexpected token '(.)', ".+" is not valid JSON/i;
  const match = regex.exec(err.message);
  if (!match) return null;
  const byte = toHex(match[1]);
  return new UnexpectedByte(byte, -1);
}
function oldV8UnexpectedByteError(err) {
  const regex = /unexpected token (.) in JSON at position (\d+)/i;
  const match = regex.exec(err.message);
  if (!match) return null;
  const byte = toHex(match[1]);
  const position = Number(match[2]);
  return new UnexpectedByte(byte, position);
}
function spidermonkeyUnexpectedByteError(err, json2) {
  const regex = /(unexpected character|expected .*) at line (\d+) column (\d+)/i;
  const match = regex.exec(err.message);
  if (!match) return null;
  const line = Number(match[2]);
  const column = Number(match[3]);
  const position = getPositionFromMultiline(line, column, json2);
  const byte = toHex(json2[position]);
  return new UnexpectedByte(byte, position);
}
function jsCoreUnexpectedByteError(err) {
  const regex = /unexpected (identifier|token) "(.)"/i;
  const match = regex.exec(err.message);
  if (!match) return null;
  const byte = toHex(match[2]);
  return new UnexpectedByte(byte, 0);
}
function toHex(char) {
  return "0x" + char.charCodeAt(0).toString(16).toUpperCase();
}
function getPositionFromMultiline(line, column, string6) {
  if (line === 1) return column - 1;
  let currentLn = 1;
  let position = 0;
  string6.split("").find((char, idx) => {
    if (char === "\n") currentLn += 1;
    if (currentLn === line) {
      position = idx + column;
      return true;
    }
    return false;
  });
  return position;
}

// build/dev/javascript/gleam_json/gleam/json.mjs
var UnexpectedEndOfInput = class extends CustomType {
};
var UnexpectedByte = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var UnexpectedSequence = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var UnableToDecode = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
function do_parse(json2, decoder) {
  return try$(
    decode(json2),
    (dynamic_value) => {
      let _pipe = run(dynamic_value, decoder);
      return map_error(
        _pipe,
        (var0) => {
          return new UnableToDecode(var0);
        }
      );
    }
  );
}
function parse(json2, decoder) {
  return do_parse(json2, decoder);
}
function bool2(input2) {
  return identity3(input2);
}

// build/dev/javascript/lustre/lustre/internals/constants.ffi.mjs
var document2 = () => globalThis?.document;
var NAMESPACE_HTML = "http://www.w3.org/1999/xhtml";
var ELEMENT_NODE = 1;
var TEXT_NODE = 3;
var SUPPORTS_MOVE_BEFORE = !!globalThis.HTMLElement?.prototype?.moveBefore;

// build/dev/javascript/lustre/lustre/internals/constants.mjs
var empty_list = /* @__PURE__ */ toList([]);
var option_none = /* @__PURE__ */ new None();

// build/dev/javascript/lustre/lustre/vdom/vattr.ffi.mjs
var GT = /* @__PURE__ */ new Gt();
var LT = /* @__PURE__ */ new Lt();
var EQ = /* @__PURE__ */ new Eq();
function compare4(a2, b) {
  if (a2.name === b.name) {
    return EQ;
  } else if (a2.name < b.name) {
    return LT;
  } else {
    return GT;
  }
}

// build/dev/javascript/lustre/lustre/vdom/vattr.mjs
var Attribute = class extends CustomType {
  constructor(kind, name2, value3) {
    super();
    this.kind = kind;
    this.name = name2;
    this.value = value3;
  }
};
var Property = class extends CustomType {
  constructor(kind, name2, value3) {
    super();
    this.kind = kind;
    this.name = name2;
    this.value = value3;
  }
};
var Event2 = class extends CustomType {
  constructor(kind, name2, handler, include, prevent_default, stop_propagation, immediate2, debounce, throttle) {
    super();
    this.kind = kind;
    this.name = name2;
    this.handler = handler;
    this.include = include;
    this.prevent_default = prevent_default;
    this.stop_propagation = stop_propagation;
    this.immediate = immediate2;
    this.debounce = debounce;
    this.throttle = throttle;
  }
};
var Handler = class extends CustomType {
  constructor(prevent_default, stop_propagation, message) {
    super();
    this.prevent_default = prevent_default;
    this.stop_propagation = stop_propagation;
    this.message = message;
  }
};
var Never = class extends CustomType {
  constructor(kind) {
    super();
    this.kind = kind;
  }
};
function merge(loop$attributes, loop$merged) {
  while (true) {
    let attributes = loop$attributes;
    let merged = loop$merged;
    if (attributes instanceof Empty) {
      return merged;
    } else {
      let $ = attributes.head;
      if ($ instanceof Attribute) {
        let $1 = $.name;
        if ($1 === "") {
          let rest = attributes.tail;
          loop$attributes = rest;
          loop$merged = merged;
        } else if ($1 === "class") {
          let $2 = $.value;
          if ($2 === "") {
            let rest = attributes.tail;
            loop$attributes = rest;
            loop$merged = merged;
          } else {
            let $3 = attributes.tail;
            if ($3 instanceof Empty) {
              let attribute$1 = $;
              let rest = $3;
              loop$attributes = rest;
              loop$merged = prepend(attribute$1, merged);
            } else {
              let $4 = $3.head;
              if ($4 instanceof Attribute) {
                let $5 = $4.name;
                if ($5 === "class") {
                  let kind = $.kind;
                  let class1 = $2;
                  let rest = $3.tail;
                  let class2 = $4.value;
                  let value3 = class1 + " " + class2;
                  let attribute$1 = new Attribute(kind, "class", value3);
                  loop$attributes = prepend(attribute$1, rest);
                  loop$merged = merged;
                } else {
                  let attribute$1 = $;
                  let rest = $3;
                  loop$attributes = rest;
                  loop$merged = prepend(attribute$1, merged);
                }
              } else {
                let attribute$1 = $;
                let rest = $3;
                loop$attributes = rest;
                loop$merged = prepend(attribute$1, merged);
              }
            }
          }
        } else if ($1 === "style") {
          let $2 = $.value;
          if ($2 === "") {
            let rest = attributes.tail;
            loop$attributes = rest;
            loop$merged = merged;
          } else {
            let $3 = attributes.tail;
            if ($3 instanceof Empty) {
              let attribute$1 = $;
              let rest = $3;
              loop$attributes = rest;
              loop$merged = prepend(attribute$1, merged);
            } else {
              let $4 = $3.head;
              if ($4 instanceof Attribute) {
                let $5 = $4.name;
                if ($5 === "style") {
                  let kind = $.kind;
                  let style1 = $2;
                  let rest = $3.tail;
                  let style2 = $4.value;
                  let value3 = style1 + ";" + style2;
                  let attribute$1 = new Attribute(kind, "style", value3);
                  loop$attributes = prepend(attribute$1, rest);
                  loop$merged = merged;
                } else {
                  let attribute$1 = $;
                  let rest = $3;
                  loop$attributes = rest;
                  loop$merged = prepend(attribute$1, merged);
                }
              } else {
                let attribute$1 = $;
                let rest = $3;
                loop$attributes = rest;
                loop$merged = prepend(attribute$1, merged);
              }
            }
          }
        } else {
          let attribute$1 = $;
          let rest = attributes.tail;
          loop$attributes = rest;
          loop$merged = prepend(attribute$1, merged);
        }
      } else {
        let attribute$1 = $;
        let rest = attributes.tail;
        loop$attributes = rest;
        loop$merged = prepend(attribute$1, merged);
      }
    }
  }
}
function prepare(attributes) {
  if (attributes instanceof Empty) {
    return attributes;
  } else {
    let $ = attributes.tail;
    if ($ instanceof Empty) {
      return attributes;
    } else {
      let _pipe = attributes;
      let _pipe$1 = sort(_pipe, (a2, b) => {
        return compare4(b, a2);
      });
      return merge(_pipe$1, empty_list);
    }
  }
}
var attribute_kind = 0;
function attribute(name2, value3) {
  return new Attribute(attribute_kind, name2, value3);
}
var property_kind = 1;
function property(name2, value3) {
  return new Property(property_kind, name2, value3);
}
var event_kind = 2;
function event(name2, handler, include, prevent_default, stop_propagation, immediate2, debounce, throttle) {
  return new Event2(
    event_kind,
    name2,
    handler,
    include,
    prevent_default,
    stop_propagation,
    immediate2,
    debounce,
    throttle
  );
}
var never_kind = 0;
var never = /* @__PURE__ */ new Never(never_kind);
var always_kind = 2;

// build/dev/javascript/lustre/lustre/attribute.mjs
function attribute2(name2, value3) {
  return attribute(name2, value3);
}
function property2(name2, value3) {
  return property(name2, value3);
}
function boolean_attribute(name2, value3) {
  if (value3) {
    return attribute2(name2, "");
  } else {
    return property2(name2, bool2(false));
  }
}
function class$(name2) {
  return attribute2("class", name2);
}
function id(value3) {
  return attribute2("id", value3);
}
function do_styles(loop$properties, loop$styles) {
  while (true) {
    let properties = loop$properties;
    let styles2 = loop$styles;
    if (properties instanceof Empty) {
      return styles2;
    } else {
      let $ = properties.head[0];
      if ($ === "") {
        let rest = properties.tail;
        loop$properties = rest;
        loop$styles = styles2;
      } else {
        let $1 = properties.head[1];
        if ($1 === "") {
          let rest = properties.tail;
          loop$properties = rest;
          loop$styles = styles2;
        } else {
          let rest = properties.tail;
          let name$1 = $;
          let value$1 = $1;
          loop$properties = rest;
          loop$styles = styles2 + name$1 + ":" + value$1 + ";";
        }
      }
    }
  }
}
function styles(properties) {
  return attribute2("style", do_styles(properties, ""));
}
function href(url) {
  return attribute2("href", url);
}
function target(value3) {
  return attribute2("target", value3);
}
function autocomplete(value3) {
  return attribute2("autocomplete", value3);
}
function checked(is_checked) {
  return boolean_attribute("checked", is_checked);
}
function disabled(is_disabled) {
  return boolean_attribute("disabled", is_disabled);
}
function for$(id2) {
  return attribute2("for", id2);
}
function name(element_name) {
  return attribute2("name", element_name);
}
function placeholder(text4) {
  return attribute2("placeholder", text4);
}
function selected(is_selected) {
  return boolean_attribute("selected", is_selected);
}
function type_(control_type) {
  return attribute2("type", control_type);
}
function value(control_value) {
  return attribute2("value", control_value);
}

// build/dev/javascript/lustre/lustre/effect.mjs
var Effect = class extends CustomType {
  constructor(synchronous, before_paint2, after_paint) {
    super();
    this.synchronous = synchronous;
    this.before_paint = before_paint2;
    this.after_paint = after_paint;
  }
};
var empty = /* @__PURE__ */ new Effect(
  /* @__PURE__ */ toList([]),
  /* @__PURE__ */ toList([]),
  /* @__PURE__ */ toList([])
);
function none() {
  return empty;
}
function from(effect) {
  let task = (actions) => {
    let dispatch = actions.dispatch;
    return effect(dispatch);
  };
  return new Effect(toList([task]), empty.before_paint, empty.after_paint);
}

// build/dev/javascript/lustre/lustre/internals/mutable_map.ffi.mjs
function empty2() {
  return null;
}
function get(map6, key2) {
  const value3 = map6?.get(key2);
  if (value3 != null) {
    return new Ok(value3);
  } else {
    return new Error(void 0);
  }
}
function has_key2(map6, key2) {
  return map6 && map6.has(key2);
}
function insert2(map6, key2, value3) {
  map6 ??= /* @__PURE__ */ new Map();
  map6.set(key2, value3);
  return map6;
}
function remove(map6, key2) {
  map6?.delete(key2);
  return map6;
}

// build/dev/javascript/lustre/lustre/vdom/path.mjs
var Root = class extends CustomType {
};
var Key = class extends CustomType {
  constructor(key2, parent) {
    super();
    this.key = key2;
    this.parent = parent;
  }
};
var Index = class extends CustomType {
  constructor(index5, parent) {
    super();
    this.index = index5;
    this.parent = parent;
  }
};
function do_matches(loop$path, loop$candidates) {
  while (true) {
    let path = loop$path;
    let candidates = loop$candidates;
    if (candidates instanceof Empty) {
      return false;
    } else {
      let candidate = candidates.head;
      let rest = candidates.tail;
      let $ = starts_with(path, candidate);
      if ($) {
        return $;
      } else {
        loop$path = path;
        loop$candidates = rest;
      }
    }
  }
}
function add2(parent, index5, key2) {
  if (key2 === "") {
    return new Index(index5, parent);
  } else {
    return new Key(key2, parent);
  }
}
var root2 = /* @__PURE__ */ new Root();
var separator_element = "	";
function do_to_string(loop$path, loop$acc) {
  while (true) {
    let path = loop$path;
    let acc = loop$acc;
    if (path instanceof Root) {
      if (acc instanceof Empty) {
        return "";
      } else {
        let segments = acc.tail;
        return concat2(segments);
      }
    } else if (path instanceof Key) {
      let key2 = path.key;
      let parent = path.parent;
      loop$path = parent;
      loop$acc = prepend(separator_element, prepend(key2, acc));
    } else {
      let index5 = path.index;
      let parent = path.parent;
      loop$path = parent;
      loop$acc = prepend(
        separator_element,
        prepend(to_string(index5), acc)
      );
    }
  }
}
function to_string3(path) {
  return do_to_string(path, toList([]));
}
function matches(path, candidates) {
  if (candidates instanceof Empty) {
    return false;
  } else {
    return do_matches(to_string3(path), candidates);
  }
}
var separator_event = "\n";
function event2(path, event4) {
  return do_to_string(path, toList([separator_event, event4]));
}

// build/dev/javascript/lustre/lustre/vdom/vnode.mjs
var Fragment = class extends CustomType {
  constructor(kind, key2, mapper, children, keyed_children) {
    super();
    this.kind = kind;
    this.key = key2;
    this.mapper = mapper;
    this.children = children;
    this.keyed_children = keyed_children;
  }
};
var Element2 = class extends CustomType {
  constructor(kind, key2, mapper, namespace, tag, attributes, children, keyed_children, self_closing, void$) {
    super();
    this.kind = kind;
    this.key = key2;
    this.mapper = mapper;
    this.namespace = namespace;
    this.tag = tag;
    this.attributes = attributes;
    this.children = children;
    this.keyed_children = keyed_children;
    this.self_closing = self_closing;
    this.void = void$;
  }
};
var Text = class extends CustomType {
  constructor(kind, key2, mapper, content) {
    super();
    this.kind = kind;
    this.key = key2;
    this.mapper = mapper;
    this.content = content;
  }
};
var UnsafeInnerHtml = class extends CustomType {
  constructor(kind, key2, mapper, namespace, tag, attributes, inner_html) {
    super();
    this.kind = kind;
    this.key = key2;
    this.mapper = mapper;
    this.namespace = namespace;
    this.tag = tag;
    this.attributes = attributes;
    this.inner_html = inner_html;
  }
};
function is_void_element(tag, namespace) {
  if (namespace === "") {
    if (tag === "area") {
      return true;
    } else if (tag === "base") {
      return true;
    } else if (tag === "br") {
      return true;
    } else if (tag === "col") {
      return true;
    } else if (tag === "embed") {
      return true;
    } else if (tag === "hr") {
      return true;
    } else if (tag === "img") {
      return true;
    } else if (tag === "input") {
      return true;
    } else if (tag === "link") {
      return true;
    } else if (tag === "meta") {
      return true;
    } else if (tag === "param") {
      return true;
    } else if (tag === "source") {
      return true;
    } else if (tag === "track") {
      return true;
    } else if (tag === "wbr") {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}
function to_keyed(key2, node) {
  if (node instanceof Fragment) {
    return new Fragment(
      node.kind,
      key2,
      node.mapper,
      node.children,
      node.keyed_children
    );
  } else if (node instanceof Element2) {
    return new Element2(
      node.kind,
      key2,
      node.mapper,
      node.namespace,
      node.tag,
      node.attributes,
      node.children,
      node.keyed_children,
      node.self_closing,
      node.void
    );
  } else if (node instanceof Text) {
    return new Text(node.kind, key2, node.mapper, node.content);
  } else {
    return new UnsafeInnerHtml(
      node.kind,
      key2,
      node.mapper,
      node.namespace,
      node.tag,
      node.attributes,
      node.inner_html
    );
  }
}
var fragment_kind = 0;
function fragment(key2, mapper, children, keyed_children) {
  return new Fragment(fragment_kind, key2, mapper, children, keyed_children);
}
var element_kind = 1;
function element(key2, mapper, namespace, tag, attributes, children, keyed_children, self_closing, void$) {
  return new Element2(
    element_kind,
    key2,
    mapper,
    namespace,
    tag,
    prepare(attributes),
    children,
    keyed_children,
    self_closing,
    void$ || is_void_element(tag, namespace)
  );
}
var text_kind = 2;
function text(key2, mapper, content) {
  return new Text(text_kind, key2, mapper, content);
}
var unsafe_inner_html_kind = 3;

// build/dev/javascript/lustre/lustre/internals/equals.ffi.mjs
var isReferenceEqual = (a2, b) => a2 === b;
var isEqual2 = (a2, b) => {
  if (a2 === b) {
    return true;
  }
  if (a2 == null || b == null) {
    return false;
  }
  const type = typeof a2;
  if (type !== typeof b) {
    return false;
  }
  if (type !== "object") {
    return false;
  }
  const ctor = a2.constructor;
  if (ctor !== b.constructor) {
    return false;
  }
  if (Array.isArray(a2)) {
    return areArraysEqual(a2, b);
  }
  return areObjectsEqual(a2, b);
};
var areArraysEqual = (a2, b) => {
  let index5 = a2.length;
  if (index5 !== b.length) {
    return false;
  }
  while (index5--) {
    if (!isEqual2(a2[index5], b[index5])) {
      return false;
    }
  }
  return true;
};
var areObjectsEqual = (a2, b) => {
  const properties = Object.keys(a2);
  let index5 = properties.length;
  if (Object.keys(b).length !== index5) {
    return false;
  }
  while (index5--) {
    const property3 = properties[index5];
    if (!Object.hasOwn(b, property3)) {
      return false;
    }
    if (!isEqual2(a2[property3], b[property3])) {
      return false;
    }
  }
  return true;
};

// build/dev/javascript/lustre/lustre/vdom/events.mjs
var Events = class extends CustomType {
  constructor(handlers, dispatched_paths, next_dispatched_paths) {
    super();
    this.handlers = handlers;
    this.dispatched_paths = dispatched_paths;
    this.next_dispatched_paths = next_dispatched_paths;
  }
};
function new$3() {
  return new Events(
    empty2(),
    empty_list,
    empty_list
  );
}
function tick(events) {
  return new Events(
    events.handlers,
    events.next_dispatched_paths,
    empty_list
  );
}
function do_remove_event(handlers, path, name2) {
  return remove(handlers, event2(path, name2));
}
function remove_event(events, path, name2) {
  let handlers = do_remove_event(events.handlers, path, name2);
  return new Events(
    handlers,
    events.dispatched_paths,
    events.next_dispatched_paths
  );
}
function remove_attributes(handlers, path, attributes) {
  return fold(
    attributes,
    handlers,
    (events, attribute3) => {
      if (attribute3 instanceof Event2) {
        let name2 = attribute3.name;
        return do_remove_event(events, path, name2);
      } else {
        return events;
      }
    }
  );
}
function handle(events, path, name2, event4) {
  let next_dispatched_paths = prepend(path, events.next_dispatched_paths);
  let events$1 = new Events(
    events.handlers,
    events.dispatched_paths,
    next_dispatched_paths
  );
  let $ = get(
    events$1.handlers,
    path + separator_event + name2
  );
  if ($ instanceof Ok) {
    let handler = $[0];
    return [events$1, run(event4, handler)];
  } else {
    return [events$1, new Error(toList([]))];
  }
}
function has_dispatched_events(events, path) {
  return matches(path, events.dispatched_paths);
}
function do_add_event(handlers, mapper, path, name2, handler) {
  return insert2(
    handlers,
    event2(path, name2),
    map3(
      handler,
      (handler2) => {
        return new Handler(
          handler2.prevent_default,
          handler2.stop_propagation,
          identity2(mapper)(handler2.message)
        );
      }
    )
  );
}
function add_event(events, mapper, path, name2, handler) {
  let handlers = do_add_event(events.handlers, mapper, path, name2, handler);
  return new Events(
    handlers,
    events.dispatched_paths,
    events.next_dispatched_paths
  );
}
function add_attributes(handlers, mapper, path, attributes) {
  return fold(
    attributes,
    handlers,
    (events, attribute3) => {
      if (attribute3 instanceof Event2) {
        let name2 = attribute3.name;
        let handler = attribute3.handler;
        return do_add_event(events, mapper, path, name2, handler);
      } else {
        return events;
      }
    }
  );
}
function compose_mapper(mapper, child_mapper) {
  let $ = isReferenceEqual(mapper, identity2);
  let $1 = isReferenceEqual(child_mapper, identity2);
  if ($1) {
    return mapper;
  } else if ($) {
    return child_mapper;
  } else {
    return (msg) => {
      return mapper(child_mapper(msg));
    };
  }
}
function do_remove_children(loop$handlers, loop$path, loop$child_index, loop$children) {
  while (true) {
    let handlers = loop$handlers;
    let path = loop$path;
    let child_index = loop$child_index;
    let children = loop$children;
    if (children instanceof Empty) {
      return handlers;
    } else {
      let child = children.head;
      let rest = children.tail;
      let _pipe = handlers;
      let _pipe$1 = do_remove_child(_pipe, path, child_index, child);
      loop$handlers = _pipe$1;
      loop$path = path;
      loop$child_index = child_index + 1;
      loop$children = rest;
    }
  }
}
function do_remove_child(handlers, parent, child_index, child) {
  if (child instanceof Fragment) {
    let children = child.children;
    let path = add2(parent, child_index, child.key);
    return do_remove_children(handlers, path, 0, children);
  } else if (child instanceof Element2) {
    let attributes = child.attributes;
    let children = child.children;
    let path = add2(parent, child_index, child.key);
    let _pipe = handlers;
    let _pipe$1 = remove_attributes(_pipe, path, attributes);
    return do_remove_children(_pipe$1, path, 0, children);
  } else if (child instanceof Text) {
    return handlers;
  } else {
    let attributes = child.attributes;
    let path = add2(parent, child_index, child.key);
    return remove_attributes(handlers, path, attributes);
  }
}
function remove_child(events, parent, child_index, child) {
  let handlers = do_remove_child(events.handlers, parent, child_index, child);
  return new Events(
    handlers,
    events.dispatched_paths,
    events.next_dispatched_paths
  );
}
function do_add_children(loop$handlers, loop$mapper, loop$path, loop$child_index, loop$children) {
  while (true) {
    let handlers = loop$handlers;
    let mapper = loop$mapper;
    let path = loop$path;
    let child_index = loop$child_index;
    let children = loop$children;
    if (children instanceof Empty) {
      return handlers;
    } else {
      let child = children.head;
      let rest = children.tail;
      let _pipe = handlers;
      let _pipe$1 = do_add_child(_pipe, mapper, path, child_index, child);
      loop$handlers = _pipe$1;
      loop$mapper = mapper;
      loop$path = path;
      loop$child_index = child_index + 1;
      loop$children = rest;
    }
  }
}
function do_add_child(handlers, mapper, parent, child_index, child) {
  if (child instanceof Fragment) {
    let children = child.children;
    let path = add2(parent, child_index, child.key);
    let composed_mapper = compose_mapper(mapper, child.mapper);
    return do_add_children(handlers, composed_mapper, path, 0, children);
  } else if (child instanceof Element2) {
    let attributes = child.attributes;
    let children = child.children;
    let path = add2(parent, child_index, child.key);
    let composed_mapper = compose_mapper(mapper, child.mapper);
    let _pipe = handlers;
    let _pipe$1 = add_attributes(_pipe, composed_mapper, path, attributes);
    return do_add_children(_pipe$1, composed_mapper, path, 0, children);
  } else if (child instanceof Text) {
    return handlers;
  } else {
    let attributes = child.attributes;
    let path = add2(parent, child_index, child.key);
    let composed_mapper = compose_mapper(mapper, child.mapper);
    return add_attributes(handlers, composed_mapper, path, attributes);
  }
}
function add_child(events, mapper, parent, index5, child) {
  let handlers = do_add_child(events.handlers, mapper, parent, index5, child);
  return new Events(
    handlers,
    events.dispatched_paths,
    events.next_dispatched_paths
  );
}
function add_children(events, mapper, path, child_index, children) {
  let handlers = do_add_children(
    events.handlers,
    mapper,
    path,
    child_index,
    children
  );
  return new Events(
    handlers,
    events.dispatched_paths,
    events.next_dispatched_paths
  );
}

// build/dev/javascript/lustre/lustre/element.mjs
function element2(tag, attributes, children) {
  return element(
    "",
    identity2,
    "",
    tag,
    attributes,
    children,
    empty2(),
    false,
    false
  );
}
function text2(content) {
  return text("", identity2, content);
}
function none2() {
  return text("", identity2, "");
}

// build/dev/javascript/lustre/lustre/element/html.mjs
function text3(content) {
  return text2(content);
}
function nav(attrs, children) {
  return element2("nav", attrs, children);
}
function div(attrs, children) {
  return element2("div", attrs, children);
}
function p(attrs, children) {
  return element2("p", attrs, children);
}
function pre(attrs, children) {
  return element2("pre", attrs, children);
}
function a(attrs, children) {
  return element2("a", attrs, children);
}
function span(attrs, children) {
  return element2("span", attrs, children);
}
function button(attrs, children) {
  return element2("button", attrs, children);
}
function input(attrs) {
  return element2("input", attrs, empty_list);
}
function label(attrs, children) {
  return element2("label", attrs, children);
}
function option(attrs, label2) {
  return element2("option", attrs, toList([text2(label2)]));
}
function select(attrs, children) {
  return element2("select", attrs, children);
}

// build/dev/javascript/lustre/lustre/vdom/patch.mjs
var Patch = class extends CustomType {
  constructor(index5, removed, changes, children) {
    super();
    this.index = index5;
    this.removed = removed;
    this.changes = changes;
    this.children = children;
  }
};
var ReplaceText = class extends CustomType {
  constructor(kind, content) {
    super();
    this.kind = kind;
    this.content = content;
  }
};
var ReplaceInnerHtml = class extends CustomType {
  constructor(kind, inner_html) {
    super();
    this.kind = kind;
    this.inner_html = inner_html;
  }
};
var Update = class extends CustomType {
  constructor(kind, added, removed) {
    super();
    this.kind = kind;
    this.added = added;
    this.removed = removed;
  }
};
var Move = class extends CustomType {
  constructor(kind, key2, before) {
    super();
    this.kind = kind;
    this.key = key2;
    this.before = before;
  }
};
var Replace = class extends CustomType {
  constructor(kind, index5, with$) {
    super();
    this.kind = kind;
    this.index = index5;
    this.with = with$;
  }
};
var Remove = class extends CustomType {
  constructor(kind, index5) {
    super();
    this.kind = kind;
    this.index = index5;
  }
};
var Insert = class extends CustomType {
  constructor(kind, children, before) {
    super();
    this.kind = kind;
    this.children = children;
    this.before = before;
  }
};
function new$5(index5, removed, changes, children) {
  return new Patch(index5, removed, changes, children);
}
var replace_text_kind = 0;
function replace_text(content) {
  return new ReplaceText(replace_text_kind, content);
}
var replace_inner_html_kind = 1;
function replace_inner_html(inner_html) {
  return new ReplaceInnerHtml(replace_inner_html_kind, inner_html);
}
var update_kind = 2;
function update(added, removed) {
  return new Update(update_kind, added, removed);
}
var move_kind = 3;
function move(key2, before) {
  return new Move(move_kind, key2, before);
}
var remove_kind = 4;
function remove2(index5) {
  return new Remove(remove_kind, index5);
}
var replace_kind = 5;
function replace2(index5, with$) {
  return new Replace(replace_kind, index5, with$);
}
var insert_kind = 6;
function insert3(children, before) {
  return new Insert(insert_kind, children, before);
}

// build/dev/javascript/lustre/lustre/vdom/diff.mjs
var Diff = class extends CustomType {
  constructor(patch, events) {
    super();
    this.patch = patch;
    this.events = events;
  }
};
var AttributeChange = class extends CustomType {
  constructor(added, removed, events) {
    super();
    this.added = added;
    this.removed = removed;
    this.events = events;
  }
};
function is_controlled(events, namespace, tag, path) {
  if (tag === "input" && namespace === "") {
    return has_dispatched_events(events, path);
  } else if (tag === "select" && namespace === "") {
    return has_dispatched_events(events, path);
  } else if (tag === "textarea" && namespace === "") {
    return has_dispatched_events(events, path);
  } else {
    return false;
  }
}
function diff_attributes(loop$controlled, loop$path, loop$mapper, loop$events, loop$old, loop$new, loop$added, loop$removed) {
  while (true) {
    let controlled = loop$controlled;
    let path = loop$path;
    let mapper = loop$mapper;
    let events = loop$events;
    let old = loop$old;
    let new$8 = loop$new;
    let added = loop$added;
    let removed = loop$removed;
    if (new$8 instanceof Empty) {
      if (old instanceof Empty) {
        return new AttributeChange(added, removed, events);
      } else {
        let $ = old.head;
        if ($ instanceof Event2) {
          let prev = $;
          let old$1 = old.tail;
          let name2 = $.name;
          let removed$1 = prepend(prev, removed);
          let events$1 = remove_event(events, path, name2);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events$1;
          loop$old = old$1;
          loop$new = new$8;
          loop$added = added;
          loop$removed = removed$1;
        } else {
          let prev = $;
          let old$1 = old.tail;
          let removed$1 = prepend(prev, removed);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events;
          loop$old = old$1;
          loop$new = new$8;
          loop$added = added;
          loop$removed = removed$1;
        }
      }
    } else if (old instanceof Empty) {
      let $ = new$8.head;
      if ($ instanceof Event2) {
        let next = $;
        let new$1 = new$8.tail;
        let name2 = $.name;
        let handler = $.handler;
        let added$1 = prepend(next, added);
        let events$1 = add_event(events, mapper, path, name2, handler);
        loop$controlled = controlled;
        loop$path = path;
        loop$mapper = mapper;
        loop$events = events$1;
        loop$old = old;
        loop$new = new$1;
        loop$added = added$1;
        loop$removed = removed;
      } else {
        let next = $;
        let new$1 = new$8.tail;
        let added$1 = prepend(next, added);
        loop$controlled = controlled;
        loop$path = path;
        loop$mapper = mapper;
        loop$events = events;
        loop$old = old;
        loop$new = new$1;
        loop$added = added$1;
        loop$removed = removed;
      }
    } else {
      let next = new$8.head;
      let remaining_new = new$8.tail;
      let prev = old.head;
      let remaining_old = old.tail;
      let $ = compare4(prev, next);
      if ($ instanceof Lt) {
        if (prev instanceof Event2) {
          let name2 = prev.name;
          let removed$1 = prepend(prev, removed);
          let events$1 = remove_event(events, path, name2);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events$1;
          loop$old = remaining_old;
          loop$new = new$8;
          loop$added = added;
          loop$removed = removed$1;
        } else {
          let removed$1 = prepend(prev, removed);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events;
          loop$old = remaining_old;
          loop$new = new$8;
          loop$added = added;
          loop$removed = removed$1;
        }
      } else if ($ instanceof Eq) {
        if (next instanceof Attribute) {
          if (prev instanceof Attribute) {
            let _block;
            let $1 = next.name;
            if ($1 === "value") {
              _block = controlled || prev.value !== next.value;
            } else if ($1 === "checked") {
              _block = controlled || prev.value !== next.value;
            } else if ($1 === "selected") {
              _block = controlled || prev.value !== next.value;
            } else {
              _block = prev.value !== next.value;
            }
            let has_changes = _block;
            let _block$1;
            if (has_changes) {
              _block$1 = prepend(next, added);
            } else {
              _block$1 = added;
            }
            let added$1 = _block$1;
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed;
          } else if (prev instanceof Event2) {
            let name2 = prev.name;
            let added$1 = prepend(next, added);
            let removed$1 = prepend(prev, removed);
            let events$1 = remove_event(events, path, name2);
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events$1;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed$1;
          } else {
            let added$1 = prepend(next, added);
            let removed$1 = prepend(prev, removed);
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed$1;
          }
        } else if (next instanceof Property) {
          if (prev instanceof Property) {
            let _block;
            let $1 = next.name;
            if ($1 === "scrollLeft") {
              _block = true;
            } else if ($1 === "scrollRight") {
              _block = true;
            } else if ($1 === "value") {
              _block = controlled || !isEqual2(
                prev.value,
                next.value
              );
            } else if ($1 === "checked") {
              _block = controlled || !isEqual2(
                prev.value,
                next.value
              );
            } else if ($1 === "selected") {
              _block = controlled || !isEqual2(
                prev.value,
                next.value
              );
            } else {
              _block = !isEqual2(prev.value, next.value);
            }
            let has_changes = _block;
            let _block$1;
            if (has_changes) {
              _block$1 = prepend(next, added);
            } else {
              _block$1 = added;
            }
            let added$1 = _block$1;
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed;
          } else if (prev instanceof Event2) {
            let name2 = prev.name;
            let added$1 = prepend(next, added);
            let removed$1 = prepend(prev, removed);
            let events$1 = remove_event(events, path, name2);
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events$1;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed$1;
          } else {
            let added$1 = prepend(next, added);
            let removed$1 = prepend(prev, removed);
            loop$controlled = controlled;
            loop$path = path;
            loop$mapper = mapper;
            loop$events = events;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed$1;
          }
        } else if (prev instanceof Event2) {
          let name2 = next.name;
          let handler = next.handler;
          let has_changes = prev.prevent_default.kind !== next.prevent_default.kind || prev.stop_propagation.kind !== next.stop_propagation.kind || prev.immediate !== next.immediate || prev.debounce !== next.debounce || prev.throttle !== next.throttle;
          let _block;
          if (has_changes) {
            _block = prepend(next, added);
          } else {
            _block = added;
          }
          let added$1 = _block;
          let events$1 = add_event(events, mapper, path, name2, handler);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events$1;
          loop$old = remaining_old;
          loop$new = remaining_new;
          loop$added = added$1;
          loop$removed = removed;
        } else {
          let name2 = next.name;
          let handler = next.handler;
          let added$1 = prepend(next, added);
          let removed$1 = prepend(prev, removed);
          let events$1 = add_event(events, mapper, path, name2, handler);
          loop$controlled = controlled;
          loop$path = path;
          loop$mapper = mapper;
          loop$events = events$1;
          loop$old = remaining_old;
          loop$new = remaining_new;
          loop$added = added$1;
          loop$removed = removed$1;
        }
      } else if (next instanceof Event2) {
        let name2 = next.name;
        let handler = next.handler;
        let added$1 = prepend(next, added);
        let events$1 = add_event(events, mapper, path, name2, handler);
        loop$controlled = controlled;
        loop$path = path;
        loop$mapper = mapper;
        loop$events = events$1;
        loop$old = old;
        loop$new = remaining_new;
        loop$added = added$1;
        loop$removed = removed;
      } else {
        let added$1 = prepend(next, added);
        loop$controlled = controlled;
        loop$path = path;
        loop$mapper = mapper;
        loop$events = events;
        loop$old = old;
        loop$new = remaining_new;
        loop$added = added$1;
        loop$removed = removed;
      }
    }
  }
}
function do_diff(loop$old, loop$old_keyed, loop$new, loop$new_keyed, loop$moved, loop$moved_offset, loop$removed, loop$node_index, loop$patch_index, loop$path, loop$changes, loop$children, loop$mapper, loop$events) {
  while (true) {
    let old = loop$old;
    let old_keyed = loop$old_keyed;
    let new$8 = loop$new;
    let new_keyed = loop$new_keyed;
    let moved = loop$moved;
    let moved_offset = loop$moved_offset;
    let removed = loop$removed;
    let node_index = loop$node_index;
    let patch_index = loop$patch_index;
    let path = loop$path;
    let changes = loop$changes;
    let children = loop$children;
    let mapper = loop$mapper;
    let events = loop$events;
    if (new$8 instanceof Empty) {
      if (old instanceof Empty) {
        return new Diff(
          new Patch(patch_index, removed, changes, children),
          events
        );
      } else {
        let prev = old.head;
        let old$1 = old.tail;
        let _block;
        let $ = prev.key === "" || !has_key2(moved, prev.key);
        if ($) {
          _block = removed + 1;
        } else {
          _block = removed;
        }
        let removed$1 = _block;
        let events$1 = remove_child(events, path, node_index, prev);
        loop$old = old$1;
        loop$old_keyed = old_keyed;
        loop$new = new$8;
        loop$new_keyed = new_keyed;
        loop$moved = moved;
        loop$moved_offset = moved_offset;
        loop$removed = removed$1;
        loop$node_index = node_index;
        loop$patch_index = patch_index;
        loop$path = path;
        loop$changes = changes;
        loop$children = children;
        loop$mapper = mapper;
        loop$events = events$1;
      }
    } else if (old instanceof Empty) {
      let events$1 = add_children(
        events,
        mapper,
        path,
        node_index,
        new$8
      );
      let insert4 = insert3(new$8, node_index - moved_offset);
      let changes$1 = prepend(insert4, changes);
      return new Diff(
        new Patch(patch_index, removed, changes$1, children),
        events$1
      );
    } else {
      let next = new$8.head;
      let prev = old.head;
      if (prev.key !== next.key) {
        let new_remaining = new$8.tail;
        let old_remaining = old.tail;
        let next_did_exist = get(old_keyed, next.key);
        let prev_does_exist = has_key2(new_keyed, prev.key);
        if (next_did_exist instanceof Ok) {
          if (prev_does_exist) {
            let match = next_did_exist[0];
            let $ = has_key2(moved, prev.key);
            if ($) {
              loop$old = old_remaining;
              loop$old_keyed = old_keyed;
              loop$new = new$8;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset - 1;
              loop$removed = removed;
              loop$node_index = node_index;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = changes;
              loop$children = children;
              loop$mapper = mapper;
              loop$events = events;
            } else {
              let before = node_index - moved_offset;
              let changes$1 = prepend(
                move(next.key, before),
                changes
              );
              let moved$1 = insert2(moved, next.key, void 0);
              let moved_offset$1 = moved_offset + 1;
              loop$old = prepend(match, old);
              loop$old_keyed = old_keyed;
              loop$new = new$8;
              loop$new_keyed = new_keyed;
              loop$moved = moved$1;
              loop$moved_offset = moved_offset$1;
              loop$removed = removed;
              loop$node_index = node_index;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = changes$1;
              loop$children = children;
              loop$mapper = mapper;
              loop$events = events;
            }
          } else {
            let index5 = node_index - moved_offset;
            let changes$1 = prepend(remove2(index5), changes);
            let events$1 = remove_child(events, path, node_index, prev);
            let moved_offset$1 = moved_offset - 1;
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new$8;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset$1;
            loop$removed = removed;
            loop$node_index = node_index;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = changes$1;
            loop$children = children;
            loop$mapper = mapper;
            loop$events = events$1;
          }
        } else if (prev_does_exist) {
          let before = node_index - moved_offset;
          let events$1 = add_child(
            events,
            mapper,
            path,
            node_index,
            next
          );
          let insert4 = insert3(toList([next]), before);
          let changes$1 = prepend(insert4, changes);
          loop$old = old;
          loop$old_keyed = old_keyed;
          loop$new = new_remaining;
          loop$new_keyed = new_keyed;
          loop$moved = moved;
          loop$moved_offset = moved_offset + 1;
          loop$removed = removed;
          loop$node_index = node_index + 1;
          loop$patch_index = patch_index;
          loop$path = path;
          loop$changes = changes$1;
          loop$children = children;
          loop$mapper = mapper;
          loop$events = events$1;
        } else {
          let change = replace2(node_index - moved_offset, next);
          let _block;
          let _pipe = events;
          let _pipe$1 = remove_child(_pipe, path, node_index, prev);
          _block = add_child(_pipe$1, mapper, path, node_index, next);
          let events$1 = _block;
          loop$old = old_remaining;
          loop$old_keyed = old_keyed;
          loop$new = new_remaining;
          loop$new_keyed = new_keyed;
          loop$moved = moved;
          loop$moved_offset = moved_offset;
          loop$removed = removed;
          loop$node_index = node_index + 1;
          loop$patch_index = patch_index;
          loop$path = path;
          loop$changes = prepend(change, changes);
          loop$children = children;
          loop$mapper = mapper;
          loop$events = events$1;
        }
      } else {
        let $ = old.head;
        if ($ instanceof Fragment) {
          let $1 = new$8.head;
          if ($1 instanceof Fragment) {
            let next$1 = $1;
            let new$1 = new$8.tail;
            let prev$1 = $;
            let old$1 = old.tail;
            let composed_mapper = compose_mapper(mapper, next$1.mapper);
            let child_path = add2(path, node_index, next$1.key);
            let child = do_diff(
              prev$1.children,
              prev$1.keyed_children,
              next$1.children,
              next$1.keyed_children,
              empty2(),
              0,
              0,
              0,
              node_index,
              child_path,
              empty_list,
              empty_list,
              composed_mapper,
              events
            );
            let _block;
            let $2 = child.patch;
            let $3 = $2.children;
            if ($3 instanceof Empty) {
              let $4 = $2.changes;
              if ($4 instanceof Empty) {
                let $5 = $2.removed;
                if ($5 === 0) {
                  _block = children;
                } else {
                  _block = prepend(child.patch, children);
                }
              } else {
                _block = prepend(child.patch, children);
              }
            } else {
              _block = prepend(child.patch, children);
            }
            let children$1 = _block;
            loop$old = old$1;
            loop$old_keyed = old_keyed;
            loop$new = new$1;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = changes;
            loop$children = children$1;
            loop$mapper = mapper;
            loop$events = child.events;
          } else {
            let next$1 = $1;
            let new_remaining = new$8.tail;
            let prev$1 = $;
            let old_remaining = old.tail;
            let change = replace2(node_index - moved_offset, next$1);
            let _block;
            let _pipe = events;
            let _pipe$1 = remove_child(_pipe, path, node_index, prev$1);
            _block = add_child(
              _pipe$1,
              mapper,
              path,
              node_index,
              next$1
            );
            let events$1 = _block;
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$mapper = mapper;
            loop$events = events$1;
          }
        } else if ($ instanceof Element2) {
          let $1 = new$8.head;
          if ($1 instanceof Element2) {
            let next$1 = $1;
            let prev$1 = $;
            if (prev$1.namespace === next$1.namespace && prev$1.tag === next$1.tag) {
              let new$1 = new$8.tail;
              let old$1 = old.tail;
              let composed_mapper = compose_mapper(
                mapper,
                next$1.mapper
              );
              let child_path = add2(path, node_index, next$1.key);
              let controlled = is_controlled(
                events,
                next$1.namespace,
                next$1.tag,
                child_path
              );
              let $2 = diff_attributes(
                controlled,
                child_path,
                composed_mapper,
                events,
                prev$1.attributes,
                next$1.attributes,
                empty_list,
                empty_list
              );
              let added_attrs;
              let removed_attrs;
              let events$1;
              added_attrs = $2.added;
              removed_attrs = $2.removed;
              events$1 = $2.events;
              let _block;
              if (removed_attrs instanceof Empty && added_attrs instanceof Empty) {
                _block = empty_list;
              } else {
                _block = toList([update(added_attrs, removed_attrs)]);
              }
              let initial_child_changes = _block;
              let child = do_diff(
                prev$1.children,
                prev$1.keyed_children,
                next$1.children,
                next$1.keyed_children,
                empty2(),
                0,
                0,
                0,
                node_index,
                child_path,
                initial_child_changes,
                empty_list,
                composed_mapper,
                events$1
              );
              let _block$1;
              let $3 = child.patch;
              let $4 = $3.children;
              if ($4 instanceof Empty) {
                let $5 = $3.changes;
                if ($5 instanceof Empty) {
                  let $6 = $3.removed;
                  if ($6 === 0) {
                    _block$1 = children;
                  } else {
                    _block$1 = prepend(child.patch, children);
                  }
                } else {
                  _block$1 = prepend(child.patch, children);
                }
              } else {
                _block$1 = prepend(child.patch, children);
              }
              let children$1 = _block$1;
              loop$old = old$1;
              loop$old_keyed = old_keyed;
              loop$new = new$1;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = changes;
              loop$children = children$1;
              loop$mapper = mapper;
              loop$events = child.events;
            } else {
              let next$2 = $1;
              let new_remaining = new$8.tail;
              let prev$2 = $;
              let old_remaining = old.tail;
              let change = replace2(node_index - moved_offset, next$2);
              let _block;
              let _pipe = events;
              let _pipe$1 = remove_child(
                _pipe,
                path,
                node_index,
                prev$2
              );
              _block = add_child(
                _pipe$1,
                mapper,
                path,
                node_index,
                next$2
              );
              let events$1 = _block;
              loop$old = old_remaining;
              loop$old_keyed = old_keyed;
              loop$new = new_remaining;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = prepend(change, changes);
              loop$children = children;
              loop$mapper = mapper;
              loop$events = events$1;
            }
          } else {
            let next$1 = $1;
            let new_remaining = new$8.tail;
            let prev$1 = $;
            let old_remaining = old.tail;
            let change = replace2(node_index - moved_offset, next$1);
            let _block;
            let _pipe = events;
            let _pipe$1 = remove_child(_pipe, path, node_index, prev$1);
            _block = add_child(
              _pipe$1,
              mapper,
              path,
              node_index,
              next$1
            );
            let events$1 = _block;
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$mapper = mapper;
            loop$events = events$1;
          }
        } else if ($ instanceof Text) {
          let $1 = new$8.head;
          if ($1 instanceof Text) {
            let next$1 = $1;
            let prev$1 = $;
            if (prev$1.content === next$1.content) {
              let new$1 = new$8.tail;
              let old$1 = old.tail;
              loop$old = old$1;
              loop$old_keyed = old_keyed;
              loop$new = new$1;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = changes;
              loop$children = children;
              loop$mapper = mapper;
              loop$events = events;
            } else {
              let next$2 = $1;
              let new$1 = new$8.tail;
              let old$1 = old.tail;
              let child = new$5(
                node_index,
                0,
                toList([replace_text(next$2.content)]),
                empty_list
              );
              loop$old = old$1;
              loop$old_keyed = old_keyed;
              loop$new = new$1;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$path = path;
              loop$changes = changes;
              loop$children = prepend(child, children);
              loop$mapper = mapper;
              loop$events = events;
            }
          } else {
            let next$1 = $1;
            let new_remaining = new$8.tail;
            let prev$1 = $;
            let old_remaining = old.tail;
            let change = replace2(node_index - moved_offset, next$1);
            let _block;
            let _pipe = events;
            let _pipe$1 = remove_child(_pipe, path, node_index, prev$1);
            _block = add_child(
              _pipe$1,
              mapper,
              path,
              node_index,
              next$1
            );
            let events$1 = _block;
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$mapper = mapper;
            loop$events = events$1;
          }
        } else {
          let $1 = new$8.head;
          if ($1 instanceof UnsafeInnerHtml) {
            let next$1 = $1;
            let new$1 = new$8.tail;
            let prev$1 = $;
            let old$1 = old.tail;
            let composed_mapper = compose_mapper(mapper, next$1.mapper);
            let child_path = add2(path, node_index, next$1.key);
            let $2 = diff_attributes(
              false,
              child_path,
              composed_mapper,
              events,
              prev$1.attributes,
              next$1.attributes,
              empty_list,
              empty_list
            );
            let added_attrs;
            let removed_attrs;
            let events$1;
            added_attrs = $2.added;
            removed_attrs = $2.removed;
            events$1 = $2.events;
            let _block;
            if (removed_attrs instanceof Empty && added_attrs instanceof Empty) {
              _block = empty_list;
            } else {
              _block = toList([update(added_attrs, removed_attrs)]);
            }
            let child_changes = _block;
            let _block$1;
            let $3 = prev$1.inner_html === next$1.inner_html;
            if ($3) {
              _block$1 = child_changes;
            } else {
              _block$1 = prepend(
                replace_inner_html(next$1.inner_html),
                child_changes
              );
            }
            let child_changes$1 = _block$1;
            let _block$2;
            if (child_changes$1 instanceof Empty) {
              _block$2 = children;
            } else {
              _block$2 = prepend(
                new$5(node_index, 0, child_changes$1, toList([])),
                children
              );
            }
            let children$1 = _block$2;
            loop$old = old$1;
            loop$old_keyed = old_keyed;
            loop$new = new$1;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = changes;
            loop$children = children$1;
            loop$mapper = mapper;
            loop$events = events$1;
          } else {
            let next$1 = $1;
            let new_remaining = new$8.tail;
            let prev$1 = $;
            let old_remaining = old.tail;
            let change = replace2(node_index - moved_offset, next$1);
            let _block;
            let _pipe = events;
            let _pipe$1 = remove_child(_pipe, path, node_index, prev$1);
            _block = add_child(
              _pipe$1,
              mapper,
              path,
              node_index,
              next$1
            );
            let events$1 = _block;
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$path = path;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$mapper = mapper;
            loop$events = events$1;
          }
        }
      }
    }
  }
}
function diff(events, old, new$8) {
  return do_diff(
    toList([old]),
    empty2(),
    toList([new$8]),
    empty2(),
    empty2(),
    0,
    0,
    0,
    0,
    root2,
    empty_list,
    empty_list,
    identity2,
    tick(events)
  );
}

// build/dev/javascript/lustre/lustre/vdom/reconciler.ffi.mjs
var setTimeout = globalThis.setTimeout;
var clearTimeout = globalThis.clearTimeout;
var createElementNS = (ns, name2) => document2().createElementNS(ns, name2);
var createTextNode = (data) => document2().createTextNode(data);
var createDocumentFragment = () => document2().createDocumentFragment();
var insertBefore = (parent, node, reference) => parent.insertBefore(node, reference);
var moveBefore = SUPPORTS_MOVE_BEFORE ? (parent, node, reference) => parent.moveBefore(node, reference) : insertBefore;
var removeChild = (parent, child) => parent.removeChild(child);
var getAttribute = (node, name2) => node.getAttribute(name2);
var setAttribute = (node, name2, value3) => node.setAttribute(name2, value3);
var removeAttribute = (node, name2) => node.removeAttribute(name2);
var addEventListener = (node, name2, handler, options) => node.addEventListener(name2, handler, options);
var removeEventListener = (node, name2, handler) => node.removeEventListener(name2, handler);
var setInnerHtml = (node, innerHtml) => node.innerHTML = innerHtml;
var setData = (node, data) => node.data = data;
var meta = Symbol("lustre");
var MetadataNode = class {
  constructor(kind, parent, node, key2) {
    this.kind = kind;
    this.key = key2;
    this.parent = parent;
    this.children = [];
    this.node = node;
    this.handlers = /* @__PURE__ */ new Map();
    this.throttles = /* @__PURE__ */ new Map();
    this.debouncers = /* @__PURE__ */ new Map();
  }
  get parentNode() {
    return this.kind === fragment_kind ? this.node.parentNode : this.node;
  }
};
var insertMetadataChild = (kind, parent, node, index5, key2) => {
  const child = new MetadataNode(kind, parent, node, key2);
  node[meta] = child;
  parent?.children.splice(index5, 0, child);
  return child;
};
var getPath = (node) => {
  let path = "";
  for (let current = node[meta]; current.parent; current = current.parent) {
    if (current.key) {
      path = `${separator_element}${current.key}${path}`;
    } else {
      const index5 = current.parent.children.indexOf(current);
      path = `${separator_element}${index5}${path}`;
    }
  }
  return path.slice(1);
};
var Reconciler = class {
  #root = null;
  #dispatch = () => {
  };
  #useServerEvents = false;
  #exposeKeys = false;
  constructor(root3, dispatch, { useServerEvents = false, exposeKeys = false } = {}) {
    this.#root = root3;
    this.#dispatch = dispatch;
    this.#useServerEvents = useServerEvents;
    this.#exposeKeys = exposeKeys;
  }
  mount(vdom) {
    insertMetadataChild(element_kind, null, this.#root, 0, null);
    this.#insertChild(this.#root, null, this.#root[meta], 0, vdom);
  }
  push(patch) {
    this.#stack.push({ node: this.#root[meta], patch });
    this.#reconcile();
  }
  // PATCHING ------------------------------------------------------------------
  #stack = [];
  #reconcile() {
    const stack = this.#stack;
    while (stack.length) {
      const { node, patch } = stack.pop();
      const { children: childNodes } = node;
      const { changes, removed, children: childPatches } = patch;
      iterate(changes, (change) => this.#patch(node, change));
      if (removed) {
        this.#removeChildren(node, childNodes.length - removed, removed);
      }
      iterate(childPatches, (childPatch) => {
        const child = childNodes[childPatch.index | 0];
        this.#stack.push({ node: child, patch: childPatch });
      });
    }
  }
  #patch(node, change) {
    switch (change.kind) {
      case replace_text_kind:
        this.#replaceText(node, change);
        break;
      case replace_inner_html_kind:
        this.#replaceInnerHtml(node, change);
        break;
      case update_kind:
        this.#update(node, change);
        break;
      case move_kind:
        this.#move(node, change);
        break;
      case remove_kind:
        this.#remove(node, change);
        break;
      case replace_kind:
        this.#replace(node, change);
        break;
      case insert_kind:
        this.#insert(node, change);
        break;
    }
  }
  // CHANGES -------------------------------------------------------------------
  #insert(parent, { children, before }) {
    const fragment3 = createDocumentFragment();
    const beforeEl = this.#getReference(parent, before);
    this.#insertChildren(fragment3, null, parent, before | 0, children);
    insertBefore(parent.parentNode, fragment3, beforeEl);
  }
  #replace(parent, { index: index5, with: child }) {
    this.#removeChildren(parent, index5 | 0, 1);
    const beforeEl = this.#getReference(parent, index5);
    this.#insertChild(parent.parentNode, beforeEl, parent, index5 | 0, child);
  }
  #getReference(node, index5) {
    index5 = index5 | 0;
    const { children } = node;
    const childCount = children.length;
    if (index5 < childCount) {
      return children[index5].node;
    }
    let lastChild = children[childCount - 1];
    if (!lastChild && node.kind !== fragment_kind) return null;
    if (!lastChild) lastChild = node;
    while (lastChild.kind === fragment_kind && lastChild.children.length) {
      lastChild = lastChild.children[lastChild.children.length - 1];
    }
    return lastChild.node.nextSibling;
  }
  #move(parent, { key: key2, before }) {
    before = before | 0;
    const { children, parentNode } = parent;
    const beforeEl = children[before].node;
    let prev = children[before];
    for (let i = before + 1; i < children.length; ++i) {
      const next = children[i];
      children[i] = prev;
      prev = next;
      if (next.key === key2) {
        children[before] = next;
        break;
      }
    }
    const { kind, node, children: prevChildren } = prev;
    moveBefore(parentNode, node, beforeEl);
    if (kind === fragment_kind) {
      this.#moveChildren(parentNode, prevChildren, beforeEl);
    }
  }
  #moveChildren(domParent, children, beforeEl) {
    for (let i = 0; i < children.length; ++i) {
      const { kind, node, children: nestedChildren } = children[i];
      moveBefore(domParent, node, beforeEl);
      if (kind === fragment_kind) {
        this.#moveChildren(domParent, nestedChildren, beforeEl);
      }
    }
  }
  #remove(parent, { index: index5 }) {
    this.#removeChildren(parent, index5, 1);
  }
  #removeChildren(parent, index5, count) {
    const { children, parentNode } = parent;
    const deleted = children.splice(index5, count);
    for (let i = 0; i < deleted.length; ++i) {
      const { kind, node, children: nestedChildren } = deleted[i];
      removeChild(parentNode, node);
      this.#removeDebouncers(deleted[i]);
      if (kind === fragment_kind) {
        deleted.push(...nestedChildren);
      }
    }
  }
  #removeDebouncers(node) {
    const { debouncers, children } = node;
    for (const { timeout } of debouncers.values()) {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
    debouncers.clear();
    iterate(children, (child) => this.#removeDebouncers(child));
  }
  #update({ node, handlers, throttles, debouncers }, { added, removed }) {
    iterate(removed, ({ name: name2 }) => {
      if (handlers.delete(name2)) {
        removeEventListener(node, name2, handleEvent);
        this.#updateDebounceThrottle(throttles, name2, 0);
        this.#updateDebounceThrottle(debouncers, name2, 0);
      } else {
        removeAttribute(node, name2);
        SYNCED_ATTRIBUTES[name2]?.removed?.(node, name2);
      }
    });
    iterate(added, (attribute3) => this.#createAttribute(node, attribute3));
  }
  #replaceText({ node }, { content }) {
    setData(node, content ?? "");
  }
  #replaceInnerHtml({ node }, { inner_html }) {
    setInnerHtml(node, inner_html ?? "");
  }
  // INSERT --------------------------------------------------------------------
  #insertChildren(domParent, beforeEl, metaParent, index5, children) {
    iterate(
      children,
      (child) => this.#insertChild(domParent, beforeEl, metaParent, index5++, child)
    );
  }
  #insertChild(domParent, beforeEl, metaParent, index5, vnode) {
    switch (vnode.kind) {
      case element_kind: {
        const node = this.#createElement(metaParent, index5, vnode);
        this.#insertChildren(node, null, node[meta], 0, vnode.children);
        insertBefore(domParent, node, beforeEl);
        break;
      }
      case text_kind: {
        const node = this.#createTextNode(metaParent, index5, vnode);
        insertBefore(domParent, node, beforeEl);
        break;
      }
      case fragment_kind: {
        const head2 = this.#createTextNode(metaParent, index5, vnode);
        insertBefore(domParent, head2, beforeEl);
        this.#insertChildren(
          domParent,
          beforeEl,
          head2[meta],
          0,
          vnode.children
        );
        break;
      }
      case unsafe_inner_html_kind: {
        const node = this.#createElement(metaParent, index5, vnode);
        this.#replaceInnerHtml({ node }, vnode);
        insertBefore(domParent, node, beforeEl);
        break;
      }
    }
  }
  #createElement(parent, index5, { kind, key: key2, tag, namespace, attributes }) {
    const node = createElementNS(namespace || NAMESPACE_HTML, tag);
    insertMetadataChild(kind, parent, node, index5, key2);
    if (this.#exposeKeys && key2) {
      setAttribute(node, "data-lustre-key", key2);
    }
    iterate(attributes, (attribute3) => this.#createAttribute(node, attribute3));
    return node;
  }
  #createTextNode(parent, index5, { kind, key: key2, content }) {
    const node = createTextNode(content ?? "");
    insertMetadataChild(kind, parent, node, index5, key2);
    return node;
  }
  #createAttribute(node, attribute3) {
    const { debouncers, handlers, throttles } = node[meta];
    const {
      kind,
      name: name2,
      value: value3,
      prevent_default: prevent,
      debounce: debounceDelay,
      throttle: throttleDelay
    } = attribute3;
    switch (kind) {
      case attribute_kind: {
        const valueOrDefault = value3 ?? "";
        if (name2 === "virtual:defaultValue") {
          node.defaultValue = valueOrDefault;
          return;
        }
        if (valueOrDefault !== getAttribute(node, name2)) {
          setAttribute(node, name2, valueOrDefault);
        }
        SYNCED_ATTRIBUTES[name2]?.added?.(node, valueOrDefault);
        break;
      }
      case property_kind:
        node[name2] = value3;
        break;
      case event_kind: {
        if (handlers.has(name2)) {
          removeEventListener(node, name2, handleEvent);
        }
        const passive = prevent.kind === never_kind;
        addEventListener(node, name2, handleEvent, { passive });
        this.#updateDebounceThrottle(throttles, name2, throttleDelay);
        this.#updateDebounceThrottle(debouncers, name2, debounceDelay);
        handlers.set(name2, (event4) => this.#handleEvent(attribute3, event4));
        break;
      }
    }
  }
  #updateDebounceThrottle(map6, name2, delay) {
    const debounceOrThrottle = map6.get(name2);
    if (delay > 0) {
      if (debounceOrThrottle) {
        debounceOrThrottle.delay = delay;
      } else {
        map6.set(name2, { delay });
      }
    } else if (debounceOrThrottle) {
      const { timeout } = debounceOrThrottle;
      if (timeout) {
        clearTimeout(timeout);
      }
      map6.delete(name2);
    }
  }
  #handleEvent(attribute3, event4) {
    const { currentTarget: currentTarget2, type } = event4;
    const { debouncers, throttles } = currentTarget2[meta];
    const path = getPath(currentTarget2);
    const {
      prevent_default: prevent,
      stop_propagation: stop,
      include,
      immediate: immediate2
    } = attribute3;
    if (prevent.kind === always_kind) event4.preventDefault();
    if (stop.kind === always_kind) event4.stopPropagation();
    if (type === "submit") {
      event4.detail ??= {};
      event4.detail.formData = [...new FormData(event4.target).entries()];
    }
    const data = this.#useServerEvents ? createServerEvent(event4, include ?? []) : event4;
    const throttle = throttles.get(type);
    if (throttle) {
      const now = Date.now();
      const last = throttle.last || 0;
      if (now > last + throttle.delay) {
        throttle.last = now;
        throttle.lastEvent = event4;
        this.#dispatch(data, path, type, immediate2);
      }
    }
    const debounce = debouncers.get(type);
    if (debounce) {
      clearTimeout(debounce.timeout);
      debounce.timeout = setTimeout(() => {
        if (event4 === throttles.get(type)?.lastEvent) return;
        this.#dispatch(data, path, type, immediate2);
      }, debounce.delay);
    }
    if (!throttle && !debounce) {
      this.#dispatch(data, path, type, immediate2);
    }
  }
};
var iterate = (list4, callback) => {
  if (Array.isArray(list4)) {
    for (let i = 0; i < list4.length; i++) {
      callback(list4[i]);
    }
  } else if (list4) {
    for (list4; list4.head; list4 = list4.tail) {
      callback(list4.head);
    }
  }
};
var handleEvent = (event4) => {
  const { currentTarget: currentTarget2, type } = event4;
  const handler = currentTarget2[meta].handlers.get(type);
  handler(event4);
};
var createServerEvent = (event4, include = []) => {
  const data = {};
  if (event4.type === "input" || event4.type === "change") {
    include.push("target.value");
  }
  if (event4.type === "submit") {
    include.push("detail.formData");
  }
  for (const property3 of include) {
    const path = property3.split(".");
    for (let i = 0, input2 = event4, output = data; i < path.length; i++) {
      if (i === path.length - 1) {
        output[path[i]] = input2[path[i]];
        break;
      }
      output = output[path[i]] ??= {};
      input2 = input2[path[i]];
    }
  }
  return data;
};
var syncedBooleanAttribute = /* @__NO_SIDE_EFFECTS__ */ (name2) => {
  return {
    added(node) {
      node[name2] = true;
    },
    removed(node) {
      node[name2] = false;
    }
  };
};
var syncedAttribute = /* @__NO_SIDE_EFFECTS__ */ (name2) => {
  return {
    added(node, value3) {
      node[name2] = value3;
    }
  };
};
var SYNCED_ATTRIBUTES = {
  checked: /* @__PURE__ */ syncedBooleanAttribute("checked"),
  selected: /* @__PURE__ */ syncedBooleanAttribute("selected"),
  value: /* @__PURE__ */ syncedAttribute("value"),
  autofocus: {
    added(node) {
      queueMicrotask(() => {
        node.focus?.();
      });
    }
  },
  autoplay: {
    added(node) {
      try {
        node.play?.();
      } catch (e) {
        console.error(e);
      }
    }
  }
};

// build/dev/javascript/lustre/lustre/element/keyed.mjs
function do_extract_keyed_children(loop$key_children_pairs, loop$keyed_children, loop$children) {
  while (true) {
    let key_children_pairs = loop$key_children_pairs;
    let keyed_children = loop$keyed_children;
    let children = loop$children;
    if (key_children_pairs instanceof Empty) {
      return [keyed_children, reverse(children)];
    } else {
      let rest = key_children_pairs.tail;
      let key2 = key_children_pairs.head[0];
      let element$1 = key_children_pairs.head[1];
      let keyed_element = to_keyed(key2, element$1);
      let _block;
      if (key2 === "") {
        _block = keyed_children;
      } else {
        _block = insert2(keyed_children, key2, keyed_element);
      }
      let keyed_children$1 = _block;
      let children$1 = prepend(keyed_element, children);
      loop$key_children_pairs = rest;
      loop$keyed_children = keyed_children$1;
      loop$children = children$1;
    }
  }
}
function extract_keyed_children(children) {
  return do_extract_keyed_children(
    children,
    empty2(),
    empty_list
  );
}
function element3(tag, attributes, children) {
  let $ = extract_keyed_children(children);
  let keyed_children;
  let children$1;
  keyed_children = $[0];
  children$1 = $[1];
  return element(
    "",
    identity2,
    "",
    tag,
    attributes,
    children$1,
    keyed_children,
    false,
    false
  );
}
function namespaced2(namespace, tag, attributes, children) {
  let $ = extract_keyed_children(children);
  let keyed_children;
  let children$1;
  keyed_children = $[0];
  children$1 = $[1];
  return element(
    "",
    identity2,
    namespace,
    tag,
    attributes,
    children$1,
    keyed_children,
    false,
    false
  );
}
function fragment2(children) {
  let $ = extract_keyed_children(children);
  let keyed_children;
  let children$1;
  keyed_children = $[0];
  children$1 = $[1];
  return fragment("", identity2, children$1, keyed_children);
}

// build/dev/javascript/lustre/lustre/vdom/virtualise.ffi.mjs
var virtualise = (root3) => {
  const rootMeta = insertMetadataChild(element_kind, null, root3, 0, null);
  let virtualisableRootChildren = 0;
  for (let child = root3.firstChild; child; child = child.nextSibling) {
    if (canVirtualiseNode(child)) virtualisableRootChildren += 1;
  }
  if (virtualisableRootChildren === 0) {
    const placeholder2 = document2().createTextNode("");
    insertMetadataChild(text_kind, rootMeta, placeholder2, 0, null);
    root3.replaceChildren(placeholder2);
    return none2();
  }
  if (virtualisableRootChildren === 1) {
    const children2 = virtualiseChildNodes(rootMeta, root3);
    return children2.head[1];
  }
  const fragmentHead = document2().createTextNode("");
  const fragmentMeta = insertMetadataChild(fragment_kind, rootMeta, fragmentHead, 0, null);
  const children = virtualiseChildNodes(fragmentMeta, root3);
  root3.insertBefore(fragmentHead, root3.firstChild);
  return fragment2(children);
};
var canVirtualiseNode = (node) => {
  switch (node.nodeType) {
    case ELEMENT_NODE:
      return true;
    case TEXT_NODE:
      return !!node.data;
    default:
      return false;
  }
};
var virtualiseNode = (meta2, node, key2, index5) => {
  if (!canVirtualiseNode(node)) {
    return null;
  }
  switch (node.nodeType) {
    case ELEMENT_NODE: {
      const childMeta = insertMetadataChild(element_kind, meta2, node, index5, key2);
      const tag = node.localName;
      const namespace = node.namespaceURI;
      const isHtmlElement = !namespace || namespace === NAMESPACE_HTML;
      if (isHtmlElement && INPUT_ELEMENTS.includes(tag)) {
        virtualiseInputEvents(tag, node);
      }
      const attributes = virtualiseAttributes(node);
      const children = virtualiseChildNodes(childMeta, node);
      const vnode = isHtmlElement ? element3(tag, attributes, children) : namespaced2(namespace, tag, attributes, children);
      return vnode;
    }
    case TEXT_NODE:
      insertMetadataChild(text_kind, meta2, node, index5, null);
      return text2(node.data);
    default:
      return null;
  }
};
var INPUT_ELEMENTS = ["input", "select", "textarea"];
var virtualiseInputEvents = (tag, node) => {
  const value3 = node.value;
  const checked2 = node.checked;
  if (tag === "input" && node.type === "checkbox" && !checked2) return;
  if (tag === "input" && node.type === "radio" && !checked2) return;
  if (node.type !== "checkbox" && node.type !== "radio" && !value3) return;
  queueMicrotask(() => {
    node.value = value3;
    node.checked = checked2;
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
    if (document2().activeElement !== node) {
      node.dispatchEvent(new Event("blur", { bubbles: true }));
    }
  });
};
var virtualiseChildNodes = (meta2, node) => {
  let children = null;
  let child = node.firstChild;
  let ptr = null;
  let index5 = 0;
  while (child) {
    const key2 = child.nodeType === ELEMENT_NODE ? child.getAttribute("data-lustre-key") : null;
    if (key2 != null) {
      child.removeAttribute("data-lustre-key");
    }
    const vnode = virtualiseNode(meta2, child, key2, index5);
    const next = child.nextSibling;
    if (vnode) {
      const list_node = new NonEmpty([key2 ?? "", vnode], null);
      if (ptr) {
        ptr = ptr.tail = list_node;
      } else {
        ptr = children = list_node;
      }
      index5 += 1;
    } else {
      node.removeChild(child);
    }
    child = next;
  }
  if (!ptr) return empty_list;
  ptr.tail = empty_list;
  return children;
};
var virtualiseAttributes = (node) => {
  let index5 = node.attributes.length;
  let attributes = empty_list;
  while (index5-- > 0) {
    const attr = node.attributes[index5];
    if (attr.name === "xmlns") {
      continue;
    }
    attributes = new NonEmpty(virtualiseAttribute(attr), attributes);
  }
  return attributes;
};
var virtualiseAttribute = (attr) => {
  const name2 = attr.localName;
  const value3 = attr.value;
  return attribute2(name2, value3);
};

// build/dev/javascript/lustre/lustre/runtime/client/runtime.ffi.mjs
var is_browser = () => !!document2();
var Runtime = class {
  constructor(root3, [model, effects], view2, update3) {
    this.root = root3;
    this.#model = model;
    this.#view = view2;
    this.#update = update3;
    this.root.addEventListener("context-request", (event4) => {
      if (!(event4.context && event4.callback)) return;
      if (!this.#contexts.has(event4.context)) return;
      event4.stopImmediatePropagation();
      const context = this.#contexts.get(event4.context);
      if (event4.subscribe) {
        const callbackRef = new WeakRef(event4.callback);
        const unsubscribe = () => {
          context.subscribers = context.subscribers.filter(
            (subscriber) => subscriber !== callbackRef
          );
        };
        context.subscribers.push([callbackRef, unsubscribe]);
        event4.callback(context.value, unsubscribe);
      } else {
        event4.callback(context.value);
      }
    });
    this.#reconciler = new Reconciler(this.root, (event4, path, name2) => {
      const [events, result] = handle(this.#events, path, name2, event4);
      this.#events = events;
      if (result.isOk()) {
        const handler = result[0];
        if (handler.stop_propagation) event4.stopPropagation();
        if (handler.prevent_default) event4.preventDefault();
        this.dispatch(handler.message, false);
      }
    });
    this.#vdom = virtualise(this.root);
    this.#events = new$3();
    this.#shouldFlush = true;
    this.#tick(effects);
  }
  // PUBLIC API ----------------------------------------------------------------
  root = null;
  dispatch(msg, immediate2 = false) {
    this.#shouldFlush ||= immediate2;
    if (this.#shouldQueue) {
      this.#queue.push(msg);
    } else {
      const [model, effects] = this.#update(this.#model, msg);
      this.#model = model;
      this.#tick(effects);
    }
  }
  emit(event4, data) {
    const target3 = this.root.host ?? this.root;
    target3.dispatchEvent(
      new CustomEvent(event4, {
        detail: data,
        bubbles: true,
        composed: true
      })
    );
  }
  // Provide a context value for any child nodes that request it using the given
  // key. If the key already exists, any existing subscribers will be notified
  // of the change. Otherwise, we store the value and wait for any `context-request`
  // events to come in.
  provide(key2, value3) {
    if (!this.#contexts.has(key2)) {
      this.#contexts.set(key2, { value: value3, subscribers: [] });
    } else {
      const context = this.#contexts.get(key2);
      context.value = value3;
      for (let i = context.subscribers.length - 1; i >= 0; i--) {
        const [subscriberRef, unsubscribe] = context.subscribers[i];
        const subscriber = subscriberRef.deref();
        if (!subscriber) {
          context.subscribers.splice(i, 1);
          continue;
        }
        subscriber(value3, unsubscribe);
      }
    }
  }
  // PRIVATE API ---------------------------------------------------------------
  #model;
  #view;
  #update;
  #vdom;
  #events;
  #reconciler;
  #contexts = /* @__PURE__ */ new Map();
  #shouldQueue = false;
  #queue = [];
  #beforePaint = empty_list;
  #afterPaint = empty_list;
  #renderTimer = null;
  #shouldFlush = false;
  #actions = {
    dispatch: (msg, immediate2) => this.dispatch(msg, immediate2),
    emit: (event4, data) => this.emit(event4, data),
    select: () => {
    },
    root: () => this.root,
    provide: (key2, value3) => this.provide(key2, value3)
  };
  // A `#tick` is where we process effects and trigger any synchronous updates.
  // Once a tick has been processed a render will be scheduled if none is already.
  // p0
  #tick(effects) {
    this.#shouldQueue = true;
    while (true) {
      for (let list4 = effects.synchronous; list4.tail; list4 = list4.tail) {
        list4.head(this.#actions);
      }
      this.#beforePaint = listAppend(this.#beforePaint, effects.before_paint);
      this.#afterPaint = listAppend(this.#afterPaint, effects.after_paint);
      if (!this.#queue.length) break;
      [this.#model, effects] = this.#update(this.#model, this.#queue.shift());
    }
    this.#shouldQueue = false;
    if (this.#shouldFlush) {
      cancelAnimationFrame(this.#renderTimer);
      this.#render();
    } else if (!this.#renderTimer) {
      this.#renderTimer = requestAnimationFrame(() => {
        this.#render();
      });
    }
  }
  #render() {
    this.#shouldFlush = false;
    this.#renderTimer = null;
    const next = this.#view(this.#model);
    const { patch, events } = diff(this.#events, this.#vdom, next);
    this.#events = events;
    this.#vdom = next;
    this.#reconciler.push(patch);
    if (this.#beforePaint instanceof NonEmpty) {
      const effects = makeEffect(this.#beforePaint);
      this.#beforePaint = empty_list;
      queueMicrotask(() => {
        this.#shouldFlush = true;
        this.#tick(effects);
      });
    }
    if (this.#afterPaint instanceof NonEmpty) {
      const effects = makeEffect(this.#afterPaint);
      this.#afterPaint = empty_list;
      requestAnimationFrame(() => {
        this.#shouldFlush = true;
        this.#tick(effects);
      });
    }
  }
};
function makeEffect(synchronous) {
  return {
    synchronous,
    after_paint: empty_list,
    before_paint: empty_list
  };
}
function listAppend(a2, b) {
  if (a2 instanceof Empty) {
    return b;
  } else if (b instanceof Empty) {
    return a2;
  } else {
    return append(a2, b);
  }
}

// build/dev/javascript/lustre/lustre/runtime/server/runtime.mjs
var EffectDispatchedMessage = class extends CustomType {
  constructor(message) {
    super();
    this.message = message;
  }
};
var EffectEmitEvent = class extends CustomType {
  constructor(name2, data) {
    super();
    this.name = name2;
    this.data = data;
  }
};
var SystemRequestedShutdown = class extends CustomType {
};

// build/dev/javascript/lustre/lustre/component.mjs
var Config2 = class extends CustomType {
  constructor(open_shadow_root, adopt_styles, delegates_focus, attributes, properties, contexts, is_form_associated, on_form_autofill, on_form_reset, on_form_restore) {
    super();
    this.open_shadow_root = open_shadow_root;
    this.adopt_styles = adopt_styles;
    this.delegates_focus = delegates_focus;
    this.attributes = attributes;
    this.properties = properties;
    this.contexts = contexts;
    this.is_form_associated = is_form_associated;
    this.on_form_autofill = on_form_autofill;
    this.on_form_reset = on_form_reset;
    this.on_form_restore = on_form_restore;
  }
};
function new$6(options) {
  let init2 = new Config2(
    true,
    true,
    false,
    empty_list,
    empty_list,
    empty_list,
    false,
    option_none,
    option_none,
    option_none
  );
  return fold(
    options,
    init2,
    (config, option2) => {
      return option2.apply(config);
    }
  );
}

// build/dev/javascript/lustre/lustre/runtime/client/spa.ffi.mjs
var Spa = class {
  #runtime;
  constructor(root3, [init2, effects], update3, view2) {
    this.#runtime = new Runtime(root3, [init2, effects], view2, update3);
  }
  send(message) {
    switch (message.constructor) {
      case EffectDispatchedMessage: {
        this.dispatch(message.message, false);
        break;
      }
      case EffectEmitEvent: {
        this.emit(message.name, message.data);
        break;
      }
      case SystemRequestedShutdown:
        break;
    }
  }
  dispatch(msg, immediate2) {
    this.#runtime.dispatch(msg, immediate2);
  }
  emit(event4, data) {
    this.#runtime.emit(event4, data);
  }
};
var start = ({ init: init2, update: update3, view: view2 }, selector, flags) => {
  if (!is_browser()) return new Error(new NotABrowser());
  const root3 = selector instanceof HTMLElement ? selector : document2().querySelector(selector);
  if (!root3) return new Error(new ElementNotFound(selector));
  return new Ok(new Spa(root3, init2(flags), update3, view2));
};

// build/dev/javascript/lustre/lustre.mjs
var App = class extends CustomType {
  constructor(init2, update3, view2, config) {
    super();
    this.init = init2;
    this.update = update3;
    this.view = view2;
    this.config = config;
  }
};
var ElementNotFound = class extends CustomType {
  constructor(selector) {
    super();
    this.selector = selector;
  }
};
var NotABrowser = class extends CustomType {
};
function application(init2, update3, view2) {
  return new App(init2, update3, view2, new$6(empty_list));
}
function start3(app, selector, start_args) {
  return guard(
    !is_browser(),
    new Error(new NotABrowser()),
    () => {
      return start(app, selector, start_args);
    }
  );
}

// build/dev/javascript/ghx/ghx/constants.mjs
var public$ = false;
var head = "HEAD";

// build/dev/javascript/gleam_stdlib/gleam/uri.mjs
var Uri = class extends CustomType {
  constructor(scheme, userinfo, host, port, path, query, fragment3) {
    super();
    this.scheme = scheme;
    this.userinfo = userinfo;
    this.host = host;
    this.port = port;
    this.path = path;
    this.query = query;
    this.fragment = fragment3;
  }
};
function is_valid_host_within_brackets_char(char) {
  return 48 >= char && char <= 57 || 65 >= char && char <= 90 || 97 >= char && char <= 122 || char === 58 || char === 46;
}
function parse_fragment(rest, pieces) {
  return new Ok(
    new Uri(
      pieces.scheme,
      pieces.userinfo,
      pieces.host,
      pieces.port,
      pieces.path,
      pieces.query,
      new Some(rest)
    )
  );
}
function parse_query_with_question_mark_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size2 = loop$size;
    if (uri_string.startsWith("#")) {
      if (size2 === 0) {
        let rest = uri_string.slice(1);
        return parse_fragment(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let query = string_codeunit_slice(original, 0, size2);
        let pieces$1 = new Uri(
          pieces.scheme,
          pieces.userinfo,
          pieces.host,
          pieces.port,
          pieces.path,
          new Some(query),
          pieces.fragment
        );
        return parse_fragment(rest, pieces$1);
      }
    } else if (uri_string === "") {
      return new Ok(
        new Uri(
          pieces.scheme,
          pieces.userinfo,
          pieces.host,
          pieces.port,
          pieces.path,
          new Some(original),
          pieces.fragment
        )
      );
    } else {
      let $ = pop_codeunit(uri_string);
      let rest;
      rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size2 + 1;
    }
  }
}
function parse_query_with_question_mark(uri_string, pieces) {
  return parse_query_with_question_mark_loop(uri_string, uri_string, pieces, 0);
}
function parse_path_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size2 = loop$size;
    if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let path = string_codeunit_slice(original, 0, size2);
      let pieces$1 = new Uri(
        pieces.scheme,
        pieces.userinfo,
        pieces.host,
        pieces.port,
        path,
        pieces.query,
        pieces.fragment
      );
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let path = string_codeunit_slice(original, 0, size2);
      let pieces$1 = new Uri(
        pieces.scheme,
        pieces.userinfo,
        pieces.host,
        pieces.port,
        path,
        pieces.query,
        pieces.fragment
      );
      return parse_fragment(rest, pieces$1);
    } else if (uri_string === "") {
      return new Ok(
        new Uri(
          pieces.scheme,
          pieces.userinfo,
          pieces.host,
          pieces.port,
          original,
          pieces.query,
          pieces.fragment
        )
      );
    } else {
      let $ = pop_codeunit(uri_string);
      let rest;
      rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size2 + 1;
    }
  }
}
function parse_path(uri_string, pieces) {
  return parse_path_loop(uri_string, uri_string, pieces, 0);
}
function parse_port_loop(loop$uri_string, loop$pieces, loop$port) {
  while (true) {
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let port = loop$port;
    if (uri_string.startsWith("0")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10;
    } else if (uri_string.startsWith("1")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 1;
    } else if (uri_string.startsWith("2")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 2;
    } else if (uri_string.startsWith("3")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 3;
    } else if (uri_string.startsWith("4")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 4;
    } else if (uri_string.startsWith("5")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 5;
    } else if (uri_string.startsWith("6")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 6;
    } else if (uri_string.startsWith("7")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 7;
    } else if (uri_string.startsWith("8")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 8;
    } else if (uri_string.startsWith("9")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 9;
    } else if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let pieces$1 = new Uri(
        pieces.scheme,
        pieces.userinfo,
        pieces.host,
        new Some(port),
        pieces.path,
        pieces.query,
        pieces.fragment
      );
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let pieces$1 = new Uri(
        pieces.scheme,
        pieces.userinfo,
        pieces.host,
        new Some(port),
        pieces.path,
        pieces.query,
        pieces.fragment
      );
      return parse_fragment(rest, pieces$1);
    } else if (uri_string.startsWith("/")) {
      let pieces$1 = new Uri(
        pieces.scheme,
        pieces.userinfo,
        pieces.host,
        new Some(port),
        pieces.path,
        pieces.query,
        pieces.fragment
      );
      return parse_path(uri_string, pieces$1);
    } else if (uri_string === "") {
      return new Ok(
        new Uri(
          pieces.scheme,
          pieces.userinfo,
          pieces.host,
          new Some(port),
          pieces.path,
          pieces.query,
          pieces.fragment
        )
      );
    } else {
      return new Error(void 0);
    }
  }
}
function parse_port(uri_string, pieces) {
  if (uri_string.startsWith(":0")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 0);
  } else if (uri_string.startsWith(":1")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 1);
  } else if (uri_string.startsWith(":2")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 2);
  } else if (uri_string.startsWith(":3")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 3);
  } else if (uri_string.startsWith(":4")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 4);
  } else if (uri_string.startsWith(":5")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 5);
  } else if (uri_string.startsWith(":6")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 6);
  } else if (uri_string.startsWith(":7")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 7);
  } else if (uri_string.startsWith(":8")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 8);
  } else if (uri_string.startsWith(":9")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 9);
  } else if (uri_string.startsWith(":")) {
    return new Error(void 0);
  } else if (uri_string.startsWith("?")) {
    let rest = uri_string.slice(1);
    return parse_query_with_question_mark(rest, pieces);
  } else if (uri_string.startsWith("#")) {
    let rest = uri_string.slice(1);
    return parse_fragment(rest, pieces);
  } else if (uri_string.startsWith("/")) {
    return parse_path(uri_string, pieces);
  } else if (uri_string === "") {
    return new Ok(pieces);
  } else {
    return new Error(void 0);
  }
}
function parse_host_outside_of_brackets_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size2 = loop$size;
    if (uri_string === "") {
      return new Ok(
        new Uri(
          pieces.scheme,
          pieces.userinfo,
          new Some(original),
          pieces.port,
          pieces.path,
          pieces.query,
          pieces.fragment
        )
      );
    } else if (uri_string.startsWith(":")) {
      let host = string_codeunit_slice(original, 0, size2);
      let pieces$1 = new Uri(
        pieces.scheme,
        pieces.userinfo,
        new Some(host),
        pieces.port,
        pieces.path,
        pieces.query,
        pieces.fragment
      );
      return parse_port(uri_string, pieces$1);
    } else if (uri_string.startsWith("/")) {
      let host = string_codeunit_slice(original, 0, size2);
      let pieces$1 = new Uri(
        pieces.scheme,
        pieces.userinfo,
        new Some(host),
        pieces.port,
        pieces.path,
        pieces.query,
        pieces.fragment
      );
      return parse_path(uri_string, pieces$1);
    } else if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size2);
      let pieces$1 = new Uri(
        pieces.scheme,
        pieces.userinfo,
        new Some(host),
        pieces.port,
        pieces.path,
        pieces.query,
        pieces.fragment
      );
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size2);
      let pieces$1 = new Uri(
        pieces.scheme,
        pieces.userinfo,
        new Some(host),
        pieces.port,
        pieces.path,
        pieces.query,
        pieces.fragment
      );
      return parse_fragment(rest, pieces$1);
    } else {
      let $ = pop_codeunit(uri_string);
      let rest;
      rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size2 + 1;
    }
  }
}
function parse_host_within_brackets_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size2 = loop$size;
    if (uri_string === "") {
      return new Ok(
        new Uri(
          pieces.scheme,
          pieces.userinfo,
          new Some(uri_string),
          pieces.port,
          pieces.path,
          pieces.query,
          pieces.fragment
        )
      );
    } else if (uri_string.startsWith("]")) {
      if (size2 === 0) {
        let rest = uri_string.slice(1);
        return parse_port(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let host = string_codeunit_slice(original, 0, size2 + 1);
        let pieces$1 = new Uri(
          pieces.scheme,
          pieces.userinfo,
          new Some(host),
          pieces.port,
          pieces.path,
          pieces.query,
          pieces.fragment
        );
        return parse_port(rest, pieces$1);
      }
    } else if (uri_string.startsWith("/")) {
      if (size2 === 0) {
        return parse_path(uri_string, pieces);
      } else {
        let host = string_codeunit_slice(original, 0, size2);
        let pieces$1 = new Uri(
          pieces.scheme,
          pieces.userinfo,
          new Some(host),
          pieces.port,
          pieces.path,
          pieces.query,
          pieces.fragment
        );
        return parse_path(uri_string, pieces$1);
      }
    } else if (uri_string.startsWith("?")) {
      if (size2 === 0) {
        let rest = uri_string.slice(1);
        return parse_query_with_question_mark(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let host = string_codeunit_slice(original, 0, size2);
        let pieces$1 = new Uri(
          pieces.scheme,
          pieces.userinfo,
          new Some(host),
          pieces.port,
          pieces.path,
          pieces.query,
          pieces.fragment
        );
        return parse_query_with_question_mark(rest, pieces$1);
      }
    } else if (uri_string.startsWith("#")) {
      if (size2 === 0) {
        let rest = uri_string.slice(1);
        return parse_fragment(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let host = string_codeunit_slice(original, 0, size2);
        let pieces$1 = new Uri(
          pieces.scheme,
          pieces.userinfo,
          new Some(host),
          pieces.port,
          pieces.path,
          pieces.query,
          pieces.fragment
        );
        return parse_fragment(rest, pieces$1);
      }
    } else {
      let $ = pop_codeunit(uri_string);
      let char;
      let rest;
      char = $[0];
      rest = $[1];
      let $1 = is_valid_host_within_brackets_char(char);
      if ($1) {
        loop$original = original;
        loop$uri_string = rest;
        loop$pieces = pieces;
        loop$size = size2 + 1;
      } else {
        return parse_host_outside_of_brackets_loop(
          original,
          original,
          pieces,
          0
        );
      }
    }
  }
}
function parse_host_within_brackets(uri_string, pieces) {
  return parse_host_within_brackets_loop(uri_string, uri_string, pieces, 0);
}
function parse_host_outside_of_brackets(uri_string, pieces) {
  return parse_host_outside_of_brackets_loop(uri_string, uri_string, pieces, 0);
}
function parse_host(uri_string, pieces) {
  if (uri_string.startsWith("[")) {
    return parse_host_within_brackets(uri_string, pieces);
  } else if (uri_string.startsWith(":")) {
    let pieces$1 = new Uri(
      pieces.scheme,
      pieces.userinfo,
      new Some(""),
      pieces.port,
      pieces.path,
      pieces.query,
      pieces.fragment
    );
    return parse_port(uri_string, pieces$1);
  } else if (uri_string === "") {
    return new Ok(
      new Uri(
        pieces.scheme,
        pieces.userinfo,
        new Some(""),
        pieces.port,
        pieces.path,
        pieces.query,
        pieces.fragment
      )
    );
  } else {
    return parse_host_outside_of_brackets(uri_string, pieces);
  }
}
function parse_userinfo_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size2 = loop$size;
    if (uri_string.startsWith("@")) {
      if (size2 === 0) {
        let rest = uri_string.slice(1);
        return parse_host(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let userinfo = string_codeunit_slice(original, 0, size2);
        let pieces$1 = new Uri(
          pieces.scheme,
          new Some(userinfo),
          pieces.host,
          pieces.port,
          pieces.path,
          pieces.query,
          pieces.fragment
        );
        return parse_host(rest, pieces$1);
      }
    } else if (uri_string === "") {
      return parse_host(original, pieces);
    } else if (uri_string.startsWith("/")) {
      return parse_host(original, pieces);
    } else if (uri_string.startsWith("?")) {
      return parse_host(original, pieces);
    } else if (uri_string.startsWith("#")) {
      return parse_host(original, pieces);
    } else {
      let $ = pop_codeunit(uri_string);
      let rest;
      rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size2 + 1;
    }
  }
}
function parse_authority_pieces(string6, pieces) {
  return parse_userinfo_loop(string6, string6, pieces, 0);
}
function parse_authority_with_slashes(uri_string, pieces) {
  if (uri_string === "//") {
    return new Ok(
      new Uri(
        pieces.scheme,
        pieces.userinfo,
        new Some(""),
        pieces.port,
        pieces.path,
        pieces.query,
        pieces.fragment
      )
    );
  } else if (uri_string.startsWith("//")) {
    let rest = uri_string.slice(2);
    return parse_authority_pieces(rest, pieces);
  } else {
    return parse_path(uri_string, pieces);
  }
}
function parse_scheme_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size2 = loop$size;
    if (uri_string.startsWith("/")) {
      if (size2 === 0) {
        return parse_authority_with_slashes(uri_string, pieces);
      } else {
        let scheme = string_codeunit_slice(original, 0, size2);
        let pieces$1 = new Uri(
          new Some(lowercase(scheme)),
          pieces.userinfo,
          pieces.host,
          pieces.port,
          pieces.path,
          pieces.query,
          pieces.fragment
        );
        return parse_authority_with_slashes(uri_string, pieces$1);
      }
    } else if (uri_string.startsWith("?")) {
      if (size2 === 0) {
        let rest = uri_string.slice(1);
        return parse_query_with_question_mark(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let scheme = string_codeunit_slice(original, 0, size2);
        let pieces$1 = new Uri(
          new Some(lowercase(scheme)),
          pieces.userinfo,
          pieces.host,
          pieces.port,
          pieces.path,
          pieces.query,
          pieces.fragment
        );
        return parse_query_with_question_mark(rest, pieces$1);
      }
    } else if (uri_string.startsWith("#")) {
      if (size2 === 0) {
        let rest = uri_string.slice(1);
        return parse_fragment(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let scheme = string_codeunit_slice(original, 0, size2);
        let pieces$1 = new Uri(
          new Some(lowercase(scheme)),
          pieces.userinfo,
          pieces.host,
          pieces.port,
          pieces.path,
          pieces.query,
          pieces.fragment
        );
        return parse_fragment(rest, pieces$1);
      }
    } else if (uri_string.startsWith(":")) {
      if (size2 === 0) {
        return new Error(void 0);
      } else {
        let rest = uri_string.slice(1);
        let scheme = string_codeunit_slice(original, 0, size2);
        let pieces$1 = new Uri(
          new Some(lowercase(scheme)),
          pieces.userinfo,
          pieces.host,
          pieces.port,
          pieces.path,
          pieces.query,
          pieces.fragment
        );
        return parse_authority_with_slashes(rest, pieces$1);
      }
    } else if (uri_string === "") {
      return new Ok(
        new Uri(
          pieces.scheme,
          pieces.userinfo,
          pieces.host,
          pieces.port,
          original,
          pieces.query,
          pieces.fragment
        )
      );
    } else {
      let $ = pop_codeunit(uri_string);
      let rest;
      rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size2 + 1;
    }
  }
}
function to_string5(uri) {
  let _block;
  let $ = uri.fragment;
  if ($ instanceof Some) {
    let fragment3 = $[0];
    _block = toList(["#", fragment3]);
  } else {
    _block = toList([]);
  }
  let parts = _block;
  let _block$1;
  let $1 = uri.query;
  if ($1 instanceof Some) {
    let query = $1[0];
    _block$1 = prepend("?", prepend(query, parts));
  } else {
    _block$1 = parts;
  }
  let parts$1 = _block$1;
  let parts$2 = prepend(uri.path, parts$1);
  let _block$2;
  let $2 = uri.host;
  let $3 = starts_with(uri.path, "/");
  if (!$3 && $2 instanceof Some) {
    let host = $2[0];
    if (host !== "") {
      _block$2 = prepend("/", parts$2);
    } else {
      _block$2 = parts$2;
    }
  } else {
    _block$2 = parts$2;
  }
  let parts$3 = _block$2;
  let _block$3;
  let $4 = uri.host;
  let $5 = uri.port;
  if ($5 instanceof Some && $4 instanceof Some) {
    let port = $5[0];
    _block$3 = prepend(":", prepend(to_string(port), parts$3));
  } else {
    _block$3 = parts$3;
  }
  let parts$4 = _block$3;
  let _block$4;
  let $6 = uri.scheme;
  let $7 = uri.userinfo;
  let $8 = uri.host;
  if ($8 instanceof Some) {
    if ($7 instanceof Some) {
      if ($6 instanceof Some) {
        let h = $8[0];
        let u = $7[0];
        let s = $6[0];
        _block$4 = prepend(
          s,
          prepend(
            "://",
            prepend(u, prepend("@", prepend(h, parts$4)))
          )
        );
      } else {
        _block$4 = parts$4;
      }
    } else if ($6 instanceof Some) {
      let h = $8[0];
      let s = $6[0];
      _block$4 = prepend(s, prepend("://", prepend(h, parts$4)));
    } else {
      let h = $8[0];
      _block$4 = prepend("//", prepend(h, parts$4));
    }
  } else if ($7 instanceof Some) {
    if ($6 instanceof Some) {
      let s = $6[0];
      _block$4 = prepend(s, prepend(":", parts$4));
    } else {
      _block$4 = parts$4;
    }
  } else if ($6 instanceof Some) {
    let s = $6[0];
    _block$4 = prepend(s, prepend(":", parts$4));
  } else {
    _block$4 = parts$4;
  }
  let parts$5 = _block$4;
  return concat2(parts$5);
}
var empty3 = /* @__PURE__ */ new Uri(
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None(),
  "",
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None()
);
function parse2(uri_string) {
  return parse_scheme_loop(uri_string, uri_string, empty3, 0);
}

// build/dev/javascript/gleam_http/gleam/http.mjs
var Get = class extends CustomType {
};
var Post = class extends CustomType {
};
var Head = class extends CustomType {
};
var Put = class extends CustomType {
};
var Delete = class extends CustomType {
};
var Trace = class extends CustomType {
};
var Connect = class extends CustomType {
};
var Options = class extends CustomType {
};
var Patch2 = class extends CustomType {
};
var Http = class extends CustomType {
};
var Https = class extends CustomType {
};
function method_to_string(method) {
  if (method instanceof Get) {
    return "GET";
  } else if (method instanceof Post) {
    return "POST";
  } else if (method instanceof Head) {
    return "HEAD";
  } else if (method instanceof Put) {
    return "PUT";
  } else if (method instanceof Delete) {
    return "DELETE";
  } else if (method instanceof Trace) {
    return "TRACE";
  } else if (method instanceof Connect) {
    return "CONNECT";
  } else if (method instanceof Options) {
    return "OPTIONS";
  } else if (method instanceof Patch2) {
    return "PATCH";
  } else {
    let s = method[0];
    return s;
  }
}
function scheme_to_string(scheme) {
  if (scheme instanceof Http) {
    return "http";
  } else {
    return "https";
  }
}
function scheme_from_string(scheme) {
  let $ = lowercase(scheme);
  if ($ === "http") {
    return new Ok(new Http());
  } else if ($ === "https") {
    return new Ok(new Https());
  } else {
    return new Error(void 0);
  }
}

// build/dev/javascript/gleam_http/gleam/http/request.mjs
var Request = class extends CustomType {
  constructor(method, headers, body2, scheme, host, port, path, query) {
    super();
    this.method = method;
    this.headers = headers;
    this.body = body2;
    this.scheme = scheme;
    this.host = host;
    this.port = port;
    this.path = path;
    this.query = query;
  }
};
function to_uri(request) {
  return new Uri(
    new Some(scheme_to_string(request.scheme)),
    new None(),
    new Some(request.host),
    request.port,
    request.path,
    request.query,
    new None()
  );
}
function from_uri(uri) {
  return try$(
    (() => {
      let _pipe = uri.scheme;
      let _pipe$1 = unwrap(_pipe, "");
      return scheme_from_string(_pipe$1);
    })(),
    (scheme) => {
      return try$(
        (() => {
          let _pipe = uri.host;
          return to_result(_pipe, void 0);
        })(),
        (host) => {
          let req = new Request(
            new Get(),
            toList([]),
            "",
            scheme,
            host,
            uri.port,
            uri.path,
            uri.query
          );
          return new Ok(req);
        }
      );
    }
  );
}
function to(url) {
  let _pipe = url;
  let _pipe$1 = parse2(_pipe);
  return try$(_pipe$1, from_uri);
}

// build/dev/javascript/gleam_http/gleam/http/response.mjs
var Response = class extends CustomType {
  constructor(status, headers, body2) {
    super();
    this.status = status;
    this.headers = headers;
    this.body = body2;
  }
};

// build/dev/javascript/gleam_javascript/gleam_javascript_ffi.mjs
var PromiseLayer = class _PromiseLayer {
  constructor(promise) {
    this.promise = promise;
  }
  static wrap(value3) {
    return value3 instanceof Promise ? new _PromiseLayer(value3) : value3;
  }
  static unwrap(value3) {
    return value3 instanceof _PromiseLayer ? value3.promise : value3;
  }
};
function resolve(value3) {
  return Promise.resolve(PromiseLayer.wrap(value3));
}
function then_await(promise, fn) {
  return promise.then((value3) => fn(PromiseLayer.unwrap(value3)));
}
function map_promise(promise, fn) {
  return promise.then(
    (value3) => PromiseLayer.wrap(fn(PromiseLayer.unwrap(value3)))
  );
}
function rescue(promise, fn) {
  return promise.catch((error) => fn(error));
}

// build/dev/javascript/gleam_javascript/gleam/javascript/promise.mjs
function tap(promise, callback) {
  let _pipe = promise;
  return map_promise(
    _pipe,
    (a2) => {
      callback(a2);
      return a2;
    }
  );
}
function try_await(promise, callback) {
  let _pipe = promise;
  return then_await(
    _pipe,
    (result) => {
      if (result instanceof Ok) {
        let a2 = result[0];
        return callback(a2);
      } else {
        let e = result[0];
        return resolve(new Error(e));
      }
    }
  );
}

// build/dev/javascript/gleam_fetch/gleam_fetch_ffi.mjs
async function raw_send(request) {
  try {
    return new Ok(await fetch(request));
  } catch (error) {
    return new Error(new NetworkError(error.toString()));
  }
}
function from_fetch_response(response) {
  return new Response(
    response.status,
    List.fromArray([...response.headers]),
    response
  );
}
function request_common(request) {
  let url = to_string5(to_uri(request));
  let method = method_to_string(request.method).toUpperCase();
  let options = {
    headers: make_headers(request.headers),
    method
  };
  return [url, options];
}
function to_fetch_request(request) {
  let [url, options] = request_common(request);
  if (options.method !== "GET" && options.method !== "HEAD") options.body = request.body;
  return new globalThis.Request(url, options);
}
function make_headers(headersList) {
  let headers = new globalThis.Headers();
  for (let [k, v] of headersList) headers.append(k.toLowerCase(), v);
  return headers;
}
async function read_text_body(response) {
  let body2;
  try {
    body2 = await response.body.text();
  } catch (error) {
    return new Error(new UnableToReadBody());
  }
  return new Ok(response.withFields({ body: body2 }));
}

// build/dev/javascript/gleam_fetch/gleam/fetch.mjs
var NetworkError = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var UnableToReadBody = class extends CustomType {
};
function send2(request) {
  let _pipe = request;
  let _pipe$1 = to_fetch_request(_pipe);
  let _pipe$2 = raw_send(_pipe$1);
  return try_await(
    _pipe$2,
    (resp) => {
      return resolve(new Ok(from_fetch_response(resp)));
    }
  );
}

// build/dev/javascript/lustre_http/lustre_http.mjs
var BadUrl = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var InternalServerError = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var JsonError = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var NetworkError2 = class extends CustomType {
};
var NotFound = class extends CustomType {
};
var OtherError = class extends CustomType {
  constructor($0, $1) {
    super();
    this[0] = $0;
    this[1] = $1;
  }
};
var Unauthorized = class extends CustomType {
};
var ExpectTextResponse = class extends CustomType {
  constructor(run2) {
    super();
    this.run = run2;
  }
};
function do_send(req, expect, dispatch) {
  let _pipe = send2(req);
  let _pipe$1 = try_await(_pipe, read_text_body);
  let _pipe$2 = map_promise(
    _pipe$1,
    (response) => {
      if (response instanceof Ok) {
        let res = response[0];
        return expect.run(new Ok(res));
      } else {
        return expect.run(new Error(new NetworkError2()));
      }
    }
  );
  let _pipe$3 = rescue(
    _pipe$2,
    (_) => {
      return expect.run(new Error(new NetworkError2()));
    }
  );
  tap(_pipe$3, dispatch);
  return void 0;
}
function get2(url, expect) {
  return from(
    (dispatch) => {
      let $ = to(url);
      if ($ instanceof Ok) {
        let req = $[0];
        return do_send(req, expect, dispatch);
      } else {
        return dispatch(expect.run(new Error(new BadUrl(url))));
      }
    }
  );
}
function response_to_result(response) {
  let status = response.status;
  if (200 <= status && status <= 299) {
    let body2 = response.body;
    return new Ok(body2);
  } else {
    let $ = response.status;
    if ($ === 401) {
      return new Error(new Unauthorized());
    } else if ($ === 404) {
      return new Error(new NotFound());
    } else if ($ === 500) {
      let body2 = response.body;
      return new Error(new InternalServerError(body2));
    } else {
      let code2 = $;
      let body2 = response.body;
      return new Error(new OtherError(code2, body2));
    }
  }
}
function expect_json(decoder, to_msg) {
  return new ExpectTextResponse(
    (response) => {
      let _pipe = response;
      let _pipe$1 = then$3(_pipe, response_to_result);
      let _pipe$2 = then$3(
        _pipe$1,
        (body2) => {
          let $ = parse(body2, decoder);
          if ($ instanceof Ok) {
            return $;
          } else {
            let json_error = $[0];
            return new Error(new JsonError(json_error));
          }
        }
      );
      return to_msg(_pipe$2);
    }
  );
}

// build/dev/javascript/plinth/document_ffi.mjs
function getElementById(id2) {
  let found = document.getElementById(id2);
  if (!found) {
    return new Error();
  }
  return new Ok(found);
}

// build/dev/javascript/plinth/window_ffi.mjs
function self() {
  return globalThis;
}
function alert(message) {
  window.alert(message);
}
function prompt(message, defaultValue) {
  let text4 = window.prompt(message, defaultValue);
  if (text4 !== null) {
    return new Ok(text4);
  } else {
    return new Error();
  }
}
function addEventListener4(type, listener) {
  return window.addEventListener(type, listener);
}
function document3(window2) {
  return window2.document;
}
async function requestWakeLock() {
  try {
    return new Ok(await window.navigator.wakeLock.request("screen"));
  } catch (error) {
    return new Error(error.toString());
  }
}
function location() {
  return window.location.href;
}
function locationOf(w) {
  try {
    return new Ok(w.location.href);
  } catch (error) {
    return new Error(error.toString());
  }
}
function setLocation(w, url) {
  w.location.href = url;
}
function origin() {
  return window.location.origin;
}
function pathname() {
  return window.location.pathname;
}
function reload() {
  return window.location.reload();
}
function reloadOf(w) {
  return w.location.reload();
}
function focus2(w) {
  return w.focus();
}
function getHash2() {
  const hash = window.location.hash;
  if (hash == "") {
    return new Error();
  }
  return new Ok(decodeURIComponent(hash.slice(1)));
}
function getSearch() {
  const search = window.location.search;
  if (search == "") {
    return new Error();
  }
  return new Ok(decodeURIComponent(search.slice(1)));
}
function innerHeight(w) {
  return w.innerHeight;
}
function innerWidth(w) {
  return w.innerWidth;
}
function outerHeight(w) {
  return w.outerHeight;
}
function outerWidth(w) {
  return w.outerWidth;
}
function screenX(w) {
  return w.screenX;
}
function screenY(w) {
  return w.screenY;
}
function screenTop(w) {
  return w.screenTop;
}
function screenLeft(w) {
  return w.screenLeft;
}
function scrollX(w) {
  return w.scrollX;
}
function scrollY(w) {
  return w.scrollY;
}
function open(url, target3, features) {
  try {
    return new Ok(window.open(url, target3, features));
  } catch (error) {
    return new Error(error.toString());
  }
}
function close(w) {
  w.close();
}
function closed(w) {
  return w.closed;
}
function queueMicrotask2(callback) {
  return window.queueMicrotask(callback);
}
function requestAnimationFrame2(callback) {
  return window.requestAnimationFrame(callback);
}
function cancelAnimationFrame2(callback) {
  return window.cancelAnimationFrame(callback);
}
function eval_(string) {
  try {
    return new Ok(eval(string));
  } catch (error) {
    return new Error(error.toString());
  }
}
async function import_(string6) {
  try {
    return new Ok(await import(string6));
  } catch (error) {
    return new Error(error.toString());
  }
}

// build/dev/javascript/plinth/global_ffi.mjs
function setTimeout2(delay, callback) {
  return globalThis.setTimeout(callback, delay);
}

// build/dev/javascript/gleam_time/gleam/time/duration.mjs
var Duration = class extends CustomType {
  constructor(seconds2, nanoseconds2) {
    super();
    this.seconds = seconds2;
    this.nanoseconds = nanoseconds2;
  }
};
function normalise(duration) {
  let multiplier = 1e9;
  let nanoseconds$1 = remainderInt(duration.nanoseconds, multiplier);
  let overflow = duration.nanoseconds - nanoseconds$1;
  let seconds$1 = duration.seconds + divideInt(overflow, multiplier);
  let $ = nanoseconds$1 >= 0;
  if ($) {
    return new Duration(seconds$1, nanoseconds$1);
  } else {
    return new Duration(seconds$1 - 1, multiplier + nanoseconds$1);
  }
}
function add4(left, right) {
  let _pipe = new Duration(
    left.seconds + right.seconds,
    left.nanoseconds + right.nanoseconds
  );
  return normalise(_pipe);
}
function seconds(amount) {
  return new Duration(amount, 0);
}
function nanoseconds(amount) {
  let _pipe = new Duration(0, amount);
  return normalise(_pipe);
}
function to_seconds(duration) {
  let seconds$1 = identity(duration.seconds);
  let nanoseconds$1 = identity(duration.nanoseconds);
  return seconds$1 + nanoseconds$1 / 1e9;
}

// build/dev/javascript/gleam_time/gleam_time_ffi.mjs
function system_time() {
  const now = Date.now();
  const milliseconds = now % 1e3;
  const nanoseconds2 = milliseconds * 1e6;
  const seconds2 = (now - milliseconds) / 1e3;
  return [seconds2, nanoseconds2];
}

// build/dev/javascript/gleam_time/gleam/time/timestamp.mjs
var Timestamp = class extends CustomType {
  constructor(seconds2, nanoseconds2) {
    super();
    this.seconds = seconds2;
    this.nanoseconds = nanoseconds2;
  }
};
function normalise2(timestamp) {
  let multiplier = 1e9;
  let nanoseconds2 = remainderInt(timestamp.nanoseconds, multiplier);
  let overflow = timestamp.nanoseconds - nanoseconds2;
  let seconds2 = timestamp.seconds + divideInt(overflow, multiplier);
  let $ = nanoseconds2 >= 0;
  if ($) {
    return new Timestamp(seconds2, nanoseconds2);
  } else {
    return new Timestamp(seconds2 - 1, multiplier + nanoseconds2);
  }
}
function system_time2() {
  let $ = system_time();
  let seconds2;
  let nanoseconds2;
  seconds2 = $[0];
  nanoseconds2 = $[1];
  return normalise2(new Timestamp(seconds2, nanoseconds2));
}
function difference(left, right) {
  let seconds2 = seconds(right.seconds - left.seconds);
  let nanoseconds2 = nanoseconds(right.nanoseconds - left.nanoseconds);
  return add4(seconds2, nanoseconds2);
}
function is_leap_year(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
function parse_sign(bytes) {
  if (bytes.bitSize >= 8) {
    if (bytes.byteAt(0) === 43) {
      if ((bytes.bitSize - 8) % 8 === 0) {
        let remaining_bytes = bitArraySlice(bytes, 8);
        return new Ok(["+", remaining_bytes]);
      } else {
        return new Error(void 0);
      }
    } else if (bytes.byteAt(0) === 45 && (bytes.bitSize - 8) % 8 === 0) {
      let remaining_bytes = bitArraySlice(bytes, 8);
      return new Ok(["-", remaining_bytes]);
    } else {
      return new Error(void 0);
    }
  } else {
    return new Error(void 0);
  }
}
function accept_byte(bytes, value3) {
  if (bytes.bitSize >= 8 && (bytes.bitSize - 8) % 8 === 0) {
    let byte = bytes.byteAt(0);
    if (byte === value3) {
      let remaining_bytes = bitArraySlice(bytes, 8);
      return new Ok(remaining_bytes);
    } else {
      return new Error(void 0);
    }
  } else {
    return new Error(void 0);
  }
}
function accept_empty(bytes) {
  if (bytes.bitSize === 0) {
    return new Ok(void 0);
  } else {
    return new Error(void 0);
  }
}
function julian_day_from_ymd(year, month, day) {
  let adjustment = globalThis.Math.trunc((14 - month) / 12);
  let adjusted_year = year + 4800 - adjustment;
  let adjusted_month = month + 12 * adjustment - 3;
  return day + globalThis.Math.trunc((153 * adjusted_month + 2) / 5) + 365 * adjusted_year + globalThis.Math.trunc(
    adjusted_year / 4
  ) - globalThis.Math.trunc(adjusted_year / 100) + globalThis.Math.trunc(
    adjusted_year / 400
  ) - 32045;
}
var seconds_per_day = 86400;
var seconds_per_hour = 3600;
var seconds_per_minute = 60;
function offset_to_seconds(sign, hours, minutes) {
  let abs_seconds = hours * seconds_per_hour + minutes * seconds_per_minute;
  if (sign === "-") {
    return -abs_seconds;
  } else {
    return abs_seconds;
  }
}
function julian_seconds_from_parts(year, month, day, hours, minutes, seconds2) {
  let julian_day_seconds = julian_day_from_ymd(year, month, day) * seconds_per_day;
  return julian_day_seconds + hours * seconds_per_hour + minutes * seconds_per_minute + seconds2;
}
var nanoseconds_per_second = 1e9;
var byte_colon = 58;
var byte_minus = 45;
function do_parse_second_fraction_as_nanoseconds(loop$bytes, loop$acc, loop$power) {
  while (true) {
    let bytes = loop$bytes;
    let acc = loop$acc;
    let power3 = loop$power;
    let power$1 = globalThis.Math.trunc(power3 / 10);
    if (bytes.bitSize >= 8 && (bytes.bitSize - 8) % 8 === 0) {
      let byte = bytes.byteAt(0);
      if (48 <= byte && byte <= 57 && power$1 < 1) {
        let remaining_bytes = bitArraySlice(bytes, 8);
        loop$bytes = remaining_bytes;
        loop$acc = acc;
        loop$power = power$1;
      } else {
        let byte$1 = bytes.byteAt(0);
        if (48 <= byte$1 && byte$1 <= 57) {
          let remaining_bytes = bitArraySlice(bytes, 8);
          let digit = byte$1 - 48;
          loop$bytes = remaining_bytes;
          loop$acc = acc + digit * power$1;
          loop$power = power$1;
        } else {
          return new Ok([acc, bytes]);
        }
      }
    } else {
      return new Ok([acc, bytes]);
    }
  }
}
function parse_second_fraction_as_nanoseconds(bytes) {
  if (bytes.bitSize >= 8 && bytes.byteAt(0) === 46) {
    if (bytes.bitSize >= 16 && (bytes.bitSize - 16) % 8 === 0) {
      let byte = bytes.byteAt(1);
      if (48 <= byte && byte <= 57) {
        let remaining_bytes = bitArraySlice(bytes, 16);
        return do_parse_second_fraction_as_nanoseconds(
          toBitArray([byte, remaining_bytes]),
          0,
          nanoseconds_per_second
        );
      } else if ((bytes.bitSize - 8) % 8 === 0) {
        return new Error(void 0);
      } else {
        return new Ok([0, bytes]);
      }
    } else if ((bytes.bitSize - 8) % 8 === 0) {
      return new Error(void 0);
    } else {
      return new Ok([0, bytes]);
    }
  } else {
    return new Ok([0, bytes]);
  }
}
function do_parse_digits(loop$bytes, loop$count, loop$acc, loop$k) {
  while (true) {
    let bytes = loop$bytes;
    let count = loop$count;
    let acc = loop$acc;
    let k = loop$k;
    if (k >= count) {
      return new Ok([acc, bytes]);
    } else if (bytes.bitSize >= 8 && (bytes.bitSize - 8) % 8 === 0) {
      let byte = bytes.byteAt(0);
      if (48 <= byte && byte <= 57) {
        let remaining_bytes = bitArraySlice(bytes, 8);
        loop$bytes = remaining_bytes;
        loop$count = count;
        loop$acc = acc * 10 + (byte - 48);
        loop$k = k + 1;
      } else {
        return new Error(void 0);
      }
    } else {
      return new Error(void 0);
    }
  }
}
function parse_digits(bytes, count) {
  return do_parse_digits(bytes, count, 0, 0);
}
function parse_year(bytes) {
  return parse_digits(bytes, 4);
}
function parse_month(bytes) {
  return try$(
    parse_digits(bytes, 2),
    (_use0) => {
      let month;
      let bytes$1;
      month = _use0[0];
      bytes$1 = _use0[1];
      let $ = 1 <= month && month <= 12;
      if ($) {
        return new Ok([month, bytes$1]);
      } else {
        return new Error(void 0);
      }
    }
  );
}
function parse_day(bytes, year, month) {
  return try$(
    parse_digits(bytes, 2),
    (_use0) => {
      let day;
      let bytes$1;
      day = _use0[0];
      bytes$1 = _use0[1];
      return try$(
        (() => {
          if (month === 1) {
            return new Ok(31);
          } else if (month === 3) {
            return new Ok(31);
          } else if (month === 5) {
            return new Ok(31);
          } else if (month === 7) {
            return new Ok(31);
          } else if (month === 8) {
            return new Ok(31);
          } else if (month === 10) {
            return new Ok(31);
          } else if (month === 12) {
            return new Ok(31);
          } else if (month === 4) {
            return new Ok(30);
          } else if (month === 6) {
            return new Ok(30);
          } else if (month === 9) {
            return new Ok(30);
          } else if (month === 11) {
            return new Ok(30);
          } else if (month === 2) {
            let $ = is_leap_year(year);
            if ($) {
              return new Ok(29);
            } else {
              return new Ok(28);
            }
          } else {
            return new Error(void 0);
          }
        })(),
        (max_day) => {
          let $ = 1 <= day && day <= max_day;
          if ($) {
            return new Ok([day, bytes$1]);
          } else {
            return new Error(void 0);
          }
        }
      );
    }
  );
}
function parse_hours(bytes) {
  return try$(
    parse_digits(bytes, 2),
    (_use0) => {
      let hours;
      let bytes$1;
      hours = _use0[0];
      bytes$1 = _use0[1];
      let $ = 0 <= hours && hours <= 23;
      if ($) {
        return new Ok([hours, bytes$1]);
      } else {
        return new Error(void 0);
      }
    }
  );
}
function parse_minutes(bytes) {
  return try$(
    parse_digits(bytes, 2),
    (_use0) => {
      let minutes;
      let bytes$1;
      minutes = _use0[0];
      bytes$1 = _use0[1];
      let $ = 0 <= minutes && minutes <= 59;
      if ($) {
        return new Ok([minutes, bytes$1]);
      } else {
        return new Error(void 0);
      }
    }
  );
}
function parse_seconds(bytes) {
  return try$(
    parse_digits(bytes, 2),
    (_use0) => {
      let seconds2;
      let bytes$1;
      seconds2 = _use0[0];
      bytes$1 = _use0[1];
      let $ = 0 <= seconds2 && seconds2 <= 60;
      if ($) {
        return new Ok([seconds2, bytes$1]);
      } else {
        return new Error(void 0);
      }
    }
  );
}
function parse_numeric_offset(bytes) {
  return try$(
    parse_sign(bytes),
    (_use0) => {
      let sign;
      let bytes$1;
      sign = _use0[0];
      bytes$1 = _use0[1];
      return try$(
        parse_hours(bytes$1),
        (_use02) => {
          let hours;
          let bytes$2;
          hours = _use02[0];
          bytes$2 = _use02[1];
          return try$(
            accept_byte(bytes$2, byte_colon),
            (bytes2) => {
              return try$(
                parse_minutes(bytes2),
                (_use03) => {
                  let minutes;
                  let bytes$12;
                  minutes = _use03[0];
                  bytes$12 = _use03[1];
                  let offset_seconds = offset_to_seconds(sign, hours, minutes);
                  return new Ok([offset_seconds, bytes$12]);
                }
              );
            }
          );
        }
      );
    }
  );
}
function parse_offset(bytes) {
  if (bytes.bitSize >= 8) {
    if (bytes.byteAt(0) === 90) {
      if ((bytes.bitSize - 8) % 8 === 0) {
        let remaining_bytes = bitArraySlice(bytes, 8);
        return new Ok([0, remaining_bytes]);
      } else {
        return parse_numeric_offset(bytes);
      }
    } else if (bytes.byteAt(0) === 122 && (bytes.bitSize - 8) % 8 === 0) {
      let remaining_bytes = bitArraySlice(bytes, 8);
      return new Ok([0, remaining_bytes]);
    } else {
      return parse_numeric_offset(bytes);
    }
  } else {
    return parse_numeric_offset(bytes);
  }
}
function accept_date_time_separator(bytes) {
  if (bytes.bitSize >= 8 && (bytes.bitSize - 8) % 8 === 0) {
    let byte = bytes.byteAt(0);
    if (byte === 84 || byte === 116 || byte === 32) {
      let remaining_bytes = bitArraySlice(bytes, 8);
      return new Ok(remaining_bytes);
    } else {
      return new Error(void 0);
    }
  } else {
    return new Error(void 0);
  }
}
var julian_seconds_unix_epoch = 210866803200;
function from_date_time(year, month, day, hours, minutes, seconds2, second_fraction_as_nanoseconds, offset_seconds) {
  let julian_seconds = julian_seconds_from_parts(
    year,
    month,
    day,
    hours,
    minutes,
    seconds2
  );
  let julian_seconds_since_epoch = julian_seconds - julian_seconds_unix_epoch;
  let _pipe = new Timestamp(
    julian_seconds_since_epoch - offset_seconds,
    second_fraction_as_nanoseconds
  );
  return normalise2(_pipe);
}
function parse_rfc3339(input2) {
  let bytes = bit_array_from_string(input2);
  return try$(
    parse_year(bytes),
    (_use0) => {
      let year;
      let bytes$1;
      year = _use0[0];
      bytes$1 = _use0[1];
      return try$(
        accept_byte(bytes$1, byte_minus),
        (bytes2) => {
          return try$(
            parse_month(bytes2),
            (_use02) => {
              let month;
              let bytes$12;
              month = _use02[0];
              bytes$12 = _use02[1];
              return try$(
                accept_byte(bytes$12, byte_minus),
                (bytes3) => {
                  return try$(
                    parse_day(bytes3, year, month),
                    (_use03) => {
                      let day;
                      let bytes$13;
                      day = _use03[0];
                      bytes$13 = _use03[1];
                      return try$(
                        accept_date_time_separator(bytes$13),
                        (bytes4) => {
                          return try$(
                            parse_hours(bytes4),
                            (_use04) => {
                              let hours;
                              let bytes$14;
                              hours = _use04[0];
                              bytes$14 = _use04[1];
                              return try$(
                                accept_byte(bytes$14, byte_colon),
                                (bytes5) => {
                                  return try$(
                                    parse_minutes(bytes5),
                                    (_use05) => {
                                      let minutes;
                                      let bytes$15;
                                      minutes = _use05[0];
                                      bytes$15 = _use05[1];
                                      return try$(
                                        accept_byte(bytes$15, byte_colon),
                                        (bytes6) => {
                                          return try$(
                                            parse_seconds(bytes6),
                                            (_use06) => {
                                              let seconds2;
                                              let bytes$16;
                                              seconds2 = _use06[0];
                                              bytes$16 = _use06[1];
                                              return try$(
                                                parse_second_fraction_as_nanoseconds(
                                                  bytes$16
                                                ),
                                                (_use07) => {
                                                  let second_fraction_as_nanoseconds;
                                                  let bytes$2;
                                                  second_fraction_as_nanoseconds = _use07[0];
                                                  bytes$2 = _use07[1];
                                                  return try$(
                                                    parse_offset(bytes$2),
                                                    (_use08) => {
                                                      let offset_seconds;
                                                      let bytes$3;
                                                      offset_seconds = _use08[0];
                                                      bytes$3 = _use08[1];
                                                      return try$(
                                                        accept_empty(bytes$3),
                                                        (_use09) => {
                                                          return new Ok(
                                                            from_date_time(
                                                              year,
                                                              month,
                                                              day,
                                                              hours,
                                                              minutes,
                                                              seconds2,
                                                              second_fraction_as_nanoseconds,
                                                              offset_seconds
                                                            )
                                                          );
                                                        }
                                                      );
                                                    }
                                                  );
                                                }
                                              );
                                            }
                                          );
                                        }
                                      );
                                    }
                                  );
                                }
                              );
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}

// build/dev/javascript/ghx/ghx/utils.mjs
function http_error_to_string(error) {
  if (error instanceof BadUrl) {
    let u = error[0];
    return "bad url: " + u;
  } else if (error instanceof InternalServerError) {
    let e = error[0];
    return "internal server error: " + e;
  } else if (error instanceof JsonError) {
    let e = error[0];
    if (e instanceof UnexpectedEndOfInput) {
      return "unexpected end of input";
    } else if (e instanceof UnexpectedByte) {
      return "unexpected byte";
    } else if (e instanceof UnexpectedSequence) {
      return "unexpected sequence";
    } else {
      let de = e[0];
      let _pipe = de;
      let _pipe$1 = map2(
        _pipe,
        (err) => {
          let exp2 = err.expected;
          let found = err.found;
          return "couldn't decode JSON; expected: " + exp2 + ", found: " + found;
        }
      );
      return join(_pipe$1, ", ");
    }
  } else if (error instanceof NetworkError2) {
    return "network error";
  } else if (error instanceof NotFound) {
    return "not found";
  } else if (error instanceof OtherError) {
    let code2 = error[0];
    let body2 = error[1];
    return "non success HTTP response; status: " + to_string(code2) + ", body: \n" + body2;
  } else {
    return "unauthorized";
  }
}
function simple_hash(input2) {
  let _pipe = to_utf_codepoints(input2);
  let _pipe$1 = map2(_pipe, utf_codepoint_to_int);
  return fold(_pipe$1, 0, (a2, b) => {
    return a2 * 31 + b;
  });
}
function humanize_duration(dur) {
  let _block;
  let _pipe = dur;
  let _pipe$1 = to_seconds(_pipe);
  _block = round2(_pipe$1);
  let duration_secs = _block;
  let $ = duration_secs < 60;
  if ($) {
    return (() => {
      let _pipe$2 = duration_secs;
      return to_string(_pipe$2);
    })() + " seconds";
  } else {
    let duration_mins = globalThis.Math.trunc(duration_secs / 60);
    let $1 = duration_mins < 60;
    if ($1) {
      return (() => {
        let _pipe$2 = duration_mins;
        return to_string(_pipe$2);
      })() + " mins";
    } else {
      let duration_hours = globalThis.Math.trunc(duration_mins / 60);
      let $2 = duration_hours < 24;
      if ($2) {
        return (() => {
          let _pipe$2 = duration_hours;
          return to_string(_pipe$2);
        })() + " hours";
      } else {
        let duration_days = globalThis.Math.trunc(duration_hours / 24);
        return (() => {
          let _pipe$2 = duration_days;
          return to_string(_pipe$2);
        })() + " days";
      }
    }
  }
}

// build/dev/javascript/ghx/ghx/types.mjs
var User = class extends CustomType {
};
var Org = class extends CustomType {
};
var Light = class extends CustomType {
};
var Dark = class extends CustomType {
};
var InitialConfig = class extends CustomType {
  constructor(owner, owner_type, theme) {
    super();
    this.owner = owner;
    this.owner_type = owner_type;
    this.theme = theme;
  }
};
var Repo = class extends CustomType {
  constructor(id2, name2, url, description, language) {
    super();
    this.id = id2;
    this.name = name2;
    this.url = url;
    this.description = description;
    this.language = language;
  }
};
var Tag = class extends CustomType {
  constructor(name2) {
    super();
    this.name = name2;
  }
};
var Author = class extends CustomType {
  constructor(name2, email, authoring_timestamp) {
    super();
    this.name = name2;
    this.email = email;
    this.authoring_timestamp = authoring_timestamp;
  }
};
var CommitDetails = class extends CustomType {
  constructor(author, message) {
    super();
    this.author = author;
    this.message = message;
  }
};
var Added = class extends CustomType {
};
var Removed = class extends CustomType {
};
var Modified = class extends CustomType {
};
var Renamed = class extends CustomType {
};
var Copied = class extends CustomType {
};
var Changed = class extends CustomType {
};
var Unchanged = class extends CustomType {
};
var CommitFileItem = class extends CustomType {
  constructor(file_name, status, additions, deletions, blob_url) {
    super();
    this.file_name = file_name;
    this.status = status;
    this.additions = additions;
    this.deletions = deletions;
    this.blob_url = blob_url;
  }
};
var Commit = class extends CustomType {
  constructor(sha, details, html_url) {
    super();
    this.sha = sha;
    this.details = details;
    this.html_url = html_url;
  }
};
var Changes = class extends CustomType {
  constructor(commits, files) {
    super();
    this.commits = commits;
    this.files = files;
  }
};
var Config3 = class extends CustomType {
  constructor(theme) {
    super();
    this.theme = theme;
  }
};
var Initial = class extends CustomType {
};
var ConfigError = class extends CustomType {
  constructor(error) {
    super();
    this.error = error;
  }
};
var ConfigLoaded = class extends CustomType {
  constructor(user_name, owner_type, fetching_repos) {
    super();
    this.user_name = user_name;
    this.owner_type = owner_type;
    this.fetching_repos = fetching_repos;
  }
};
var WithReposError = class extends CustomType {
  constructor(user_name, owner_type, error) {
    super();
    this.user_name = user_name;
    this.owner_type = owner_type;
    this.error = error;
  }
};
var WithRepos = class extends CustomType {
  constructor(user_name, owner_type, repos, repo_filter_query, fetching_tags, selected_repo) {
    super();
    this.user_name = user_name;
    this.owner_type = owner_type;
    this.repos = repos;
    this.repo_filter_query = repo_filter_query;
    this.fetching_tags = fetching_tags;
    this.selected_repo = selected_repo;
  }
};
var WithTagsError = class extends CustomType {
  constructor(user_name, owner_type, repos, repo_filter_query, repo, error) {
    super();
    this.user_name = user_name;
    this.owner_type = owner_type;
    this.repos = repos;
    this.repo_filter_query = repo_filter_query;
    this.repo = repo;
    this.error = error;
  }
};
var WithTags = class extends CustomType {
  constructor(user_name, owner_type, repos, repo_filter_query, repo, tags, start_tag, end_tag, fetching_changes) {
    super();
    this.user_name = user_name;
    this.owner_type = owner_type;
    this.repos = repos;
    this.repo_filter_query = repo_filter_query;
    this.repo = repo;
    this.tags = tags;
    this.start_tag = start_tag;
    this.end_tag = end_tag;
    this.fetching_changes = fetching_changes;
  }
};
var WithChangesError = class extends CustomType {
  constructor(user_name, owner_type, repos, repo_filter_query, repo, tags, start_tag, end_tag, error) {
    super();
    this.user_name = user_name;
    this.owner_type = owner_type;
    this.repos = repos;
    this.repo_filter_query = repo_filter_query;
    this.repo = repo;
    this.tags = tags;
    this.start_tag = start_tag;
    this.end_tag = end_tag;
    this.error = error;
  }
};
var WithChanges = class extends CustomType {
  constructor(user_name, owner_type, repos, repo_filter_query, repo, tags, start_tag, end_tag, changes, commits_filter, files_filter) {
    super();
    this.user_name = user_name;
    this.owner_type = owner_type;
    this.repos = repos;
    this.repo_filter_query = repo_filter_query;
    this.repo = repo;
    this.tags = tags;
    this.start_tag = start_tag;
    this.end_tag = end_tag;
    this.changes = changes;
    this.commits_filter = commits_filter;
    this.files_filter = files_filter;
  }
};
var AuthorColorClasses = class extends CustomType {
  constructor(dark, light) {
    super();
    this.dark = dark;
    this.light = light;
  }
};
var DebugSection = class extends CustomType {
};
var OwnerSection = class extends CustomType {
};
var ReposSection = class extends CustomType {
};
var TagsSection = class extends CustomType {
};
var CommitsSection = class extends CustomType {
};
var FilesSection = class extends CustomType {
};
var Model = class extends CustomType {
  constructor(config, state, author_color_classes, debug) {
    super();
    this.config = config;
    this.state = state;
    this.author_color_classes = author_color_classes;
    this.debug = debug;
  }
};
var InitialConfigFetched = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var UserChangedTheme = class extends CustomType {
};
var AccountTypeChanged = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var UserEnteredUsernameInput = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var UserRequestedRepos = class extends CustomType {
};
var ReposFetched = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var UserEnteredRepoFilterQuery = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var RepoChosen = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var TagsFetched = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var StartTagChosen = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var EndTagChosen = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var UserRequestedChangelog = class extends CustomType {
};
var ChangesFetched = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var UserRequestedToGoToSection = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var UserEnteredCommitsFilterQuery = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
var UserEnteredFilesFilterQuery = class extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
};
function theme_decoder() {
  return then$2(
    string3,
    (variant) => {
      if (variant === "light") {
        return success(new Light());
      } else if (variant === "dark") {
        return success(new Dark());
      } else {
        return failure(new Dark(), "Theme");
      }
    }
  );
}
function owner_type_decoder() {
  return then$2(
    string3,
    (variant) => {
      if (variant === "user") {
        return success(new User());
      } else if (variant === "org") {
        return success(new Org());
      } else {
        return failure(new User(), "AccountType");
      }
    }
  );
}
function initial_config_decoder() {
  return field(
    "owner",
    optional(string3),
    (owner) => {
      return field(
        "owner_type",
        owner_type_decoder(),
        (owner_type) => {
          return field(
            "theme",
            theme_decoder(),
            (theme) => {
              return success(
                new InitialConfig(owner, owner_type, theme)
              );
            }
          );
        }
      );
    }
  );
}
function repo_decoder() {
  return field(
    "id",
    int2,
    (id2) => {
      return field(
        "name",
        string3,
        (name2) => {
          return field(
            "url",
            string3,
            (url) => {
              return field(
                "description",
                optional(string3),
                (description) => {
                  return field(
                    "language",
                    optional(string3),
                    (language) => {
                      return success(
                        new Repo(id2, name2, url, description, language)
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}
function repos_response_decoder() {
  let _pipe = repo_decoder();
  return list2(_pipe);
}
function tag_decoder() {
  return field(
    "name",
    string3,
    (name2) => {
      return success(new Tag(name2));
    }
  );
}
function tags_response_decoder() {
  let _pipe = tag_decoder();
  return list2(_pipe);
}
function optional_timestamp_decoder() {
  return new_primitive_decoder(
    "Timestamp",
    (data) => {
      let default$ = new None();
      let $ = run(data, string3);
      if ($ instanceof Ok) {
        let timestamp_string = $[0];
        let $1 = parse_rfc3339(timestamp_string);
        if ($1 instanceof Ok) {
          let t = $1[0];
          return new Ok(
            (() => {
              let _pipe = t;
              return new Some(_pipe);
            })()
          );
        } else {
          return new Ok(default$);
        }
      } else {
        return new Ok(default$);
      }
    }
  );
}
function author_decoder() {
  return field(
    "name",
    string3,
    (name2) => {
      return field(
        "email",
        string3,
        (email) => {
          return field(
            "date",
            optional_timestamp_decoder(),
            (authoring_timestamp) => {
              return success(
                new Author(name2, email, authoring_timestamp)
              );
            }
          );
        }
      );
    }
  );
}
function commit_details_decoder() {
  return field(
    "author",
    optional(author_decoder()),
    (author) => {
      return field(
        "message",
        string3,
        (message) => {
          return success(new CommitDetails(author, message));
        }
      );
    }
  );
}
function file_status_to_string(status) {
  if (status instanceof Added) {
    return "add";
  } else if (status instanceof Removed) {
    return "rem";
  } else if (status instanceof Modified) {
    return "mod";
  } else if (status instanceof Renamed) {
    return "ren";
  } else if (status instanceof Copied) {
    return "cop";
  } else if (status instanceof Changed) {
    return "chd";
  } else {
    return "unc";
  }
}
function changes_file_status_decoder() {
  return then$2(
    string3,
    (variant) => {
      if (variant === "added") {
        return success(new Added());
      } else if (variant === "removed") {
        return success(new Removed());
      } else if (variant === "modified") {
        return success(new Modified());
      } else if (variant === "renamed") {
        return success(new Renamed());
      } else if (variant === "copied") {
        return success(new Copied());
      } else if (variant === "changed") {
        return success(new Changed());
      } else if (variant === "unchanged") {
        return success(new Unchanged());
      } else {
        return failure(new Unchanged(), "ChangesFileStatus");
      }
    }
  );
}
function changes_file_item_decoder() {
  return field(
    "filename",
    string3,
    (file_name) => {
      return field(
        "status",
        changes_file_status_decoder(),
        (status) => {
          return field(
            "additions",
            int2,
            (additions) => {
              return field(
                "deletions",
                int2,
                (deletions) => {
                  return field(
                    "blob_url",
                    string3,
                    (blob_url) => {
                      return success(
                        new CommitFileItem(
                          file_name,
                          status,
                          additions,
                          deletions,
                          blob_url
                        )
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}
function commit_decoder() {
  return field(
    "sha",
    string3,
    (sha) => {
      return field(
        "commit",
        commit_details_decoder(),
        (details) => {
          return field(
            "html_url",
            string3,
            (html_url) => {
              return success(new Commit(sha, details, html_url));
            }
          );
        }
      );
    }
  );
}
function changes_decoder() {
  return field(
    "commits",
    list2(commit_decoder()),
    (commits) => {
      return field(
        "files",
        optional(list2(changes_file_item_decoder())),
        (files) => {
          return success(new Changes(commits, files));
        }
      );
    }
  );
}
function theme_to_string(theme) {
  if (theme instanceof Light) {
    return "\u2600\uFE0F";
  } else {
    return "\u{1F319}";
  }
}
function get_next_theme(current) {
  if (current instanceof Light) {
    return new Dark();
  } else {
    return new Light();
  }
}
function owner_types() {
  return toList([new User(), new Org()]);
}
function owner_type_to_string(owner_type) {
  if (owner_type instanceof User) {
    return "user";
  } else {
    return "org";
  }
}
function section_to_string(section) {
  if (section instanceof DebugSection) {
    return "debug";
  } else if (section instanceof OwnerSection) {
    return "owner";
  } else if (section instanceof ReposSection) {
    return "repos";
  } else if (section instanceof TagsSection) {
    return "tags";
  } else if (section instanceof CommitsSection) {
    return "commits";
  } else {
    return "files";
  }
}
function section_heading_id(section) {
  return (() => {
    let _pipe = section;
    return section_to_string(_pipe);
  })() + "-heading";
}
function section_id(section) {
  return (() => {
    let _pipe = section;
    return section_to_string(_pipe);
  })() + "-section";
}
function display_config(config) {
  return "- theme: " + (() => {
    let _pipe = config.theme;
    return theme_to_string(_pipe);
  })();
}
function display_model(model) {
  let _block;
  let $ = model.state;
  if ($ instanceof Initial) {
    _block = toList(["- state: Initial"]);
  } else if ($ instanceof ConfigError) {
    let error = $.error;
    _block = toList([
      "- error: " + (() => {
        let _pipe2 = error;
        return http_error_to_string(_pipe2);
      })()
    ]);
  } else if ($ instanceof ConfigLoaded) {
    let user_name = $.user_name;
    let owner_type = $.owner_type;
    let fetching_repos = $.fetching_repos;
    _block = toList([
      "- state: ConfigLoaded",
      "- user_name: " + (() => {
        let _pipe2 = user_name;
        return inspect2(_pipe2);
      })(),
      "- owner_type: " + (() => {
        let _pipe2 = owner_type;
        return owner_type_to_string(_pipe2);
      })(),
      "- fetching repos: " + (() => {
        let _pipe2 = fetching_repos;
        return to_string2(_pipe2);
      })()
    ]);
  } else if ($ instanceof WithReposError) {
    let user_name = $.user_name;
    let owner_type = $.owner_type;
    let error = $.error;
    _block = toList([
      "- state: WithReposError",
      "- user_name: " + user_name,
      "- owner_type: " + (() => {
        let _pipe2 = owner_type;
        return owner_type_to_string(_pipe2);
      })(),
      "- error: " + (() => {
        let _pipe2 = error;
        return http_error_to_string(_pipe2);
      })()
    ]);
  } else if ($ instanceof WithRepos) {
    let user_name = $.user_name;
    let owner_type = $.owner_type;
    let repos = $.repos;
    let repo_filter_query = $.repo_filter_query;
    let fetching_tags = $.fetching_tags;
    let selected_repo = $.selected_repo;
    _block = toList([
      "- state: WithRepos",
      "- user_name: " + user_name,
      "- owner_type: " + (() => {
        let _pipe2 = owner_type;
        return owner_type_to_string(_pipe2);
      })(),
      "- repos: " + (() => {
        let _pipe2 = repos;
        let _pipe$12 = length(_pipe2);
        return to_string(_pipe$12);
      })(),
      "- repo filter query: " + (() => {
        let _pipe2 = repo_filter_query;
        return inspect2(_pipe2);
      })(),
      "- fetching_tags: " + (() => {
        let _pipe2 = fetching_tags;
        return to_string2(_pipe2);
      })(),
      "- selected_repo: " + (() => {
        let _pipe2 = selected_repo;
        return inspect2(_pipe2);
      })()
    ]);
  } else if ($ instanceof WithTagsError) {
    let user_name = $.user_name;
    let owner_type = $.owner_type;
    let repos = $.repos;
    let repo_filter_query = $.repo_filter_query;
    let repo = $.repo;
    let error = $.error;
    _block = toList([
      "- state: WithTagsError",
      "- user_name: " + user_name,
      "- owner_type: " + (() => {
        let _pipe2 = owner_type;
        return owner_type_to_string(_pipe2);
      })(),
      "- repos: " + (() => {
        let _pipe2 = repos;
        let _pipe$12 = length(_pipe2);
        return to_string(_pipe$12);
      })(),
      "- repo filter query: " + (() => {
        let _pipe2 = repo_filter_query;
        return inspect2(_pipe2);
      })(),
      "- selected_repo: " + repo,
      "- error: " + (() => {
        let _pipe2 = error;
        return http_error_to_string(_pipe2);
      })()
    ]);
  } else if ($ instanceof WithTags) {
    let user_name = $.user_name;
    let owner_type = $.owner_type;
    let repos = $.repos;
    let repo_filter_query = $.repo_filter_query;
    let repo = $.repo;
    let tags = $.tags;
    let start_tag = $.start_tag;
    let end_tag = $.end_tag;
    let fetching_changes = $.fetching_changes;
    _block = toList([
      "- state: WithTags",
      "- user_name: " + user_name,
      "- owner_type: " + (() => {
        let _pipe2 = owner_type;
        return owner_type_to_string(_pipe2);
      })(),
      "- repos: " + (() => {
        let _pipe2 = repos;
        let _pipe$12 = length(_pipe2);
        return to_string(_pipe$12);
      })(),
      "- repo filter query: " + (() => {
        let _pipe2 = repo_filter_query;
        return inspect2(_pipe2);
      })(),
      "- selected_repo: " + repo,
      "- tags: " + (() => {
        let _pipe2 = tags;
        let _pipe$12 = length(_pipe2);
        return to_string(_pipe$12);
      })(),
      "- start_tag: " + (() => {
        let _pipe2 = start_tag;
        return inspect2(_pipe2);
      })(),
      "- end_tag: " + (() => {
        let _pipe2 = end_tag;
        return inspect2(_pipe2);
      })(),
      "- fetching_changes: " + (() => {
        let _pipe2 = fetching_changes;
        return to_string2(_pipe2);
      })()
    ]);
  } else if ($ instanceof WithChangesError) {
    let user_name = $.user_name;
    let owner_type = $.owner_type;
    let repos = $.repos;
    let repo_filter_query = $.repo_filter_query;
    let repo = $.repo;
    let tags = $.tags;
    let start_tag = $.start_tag;
    let end_tag = $.end_tag;
    let error = $.error;
    _block = toList([
      "- state: WithChangesError",
      "- user_name: " + user_name,
      "- owner_type: " + (() => {
        let _pipe2 = owner_type;
        return owner_type_to_string(_pipe2);
      })(),
      "- repos: " + (() => {
        let _pipe2 = repos;
        let _pipe$12 = length(_pipe2);
        return to_string(_pipe$12);
      })(),
      "- repo filter query: " + (() => {
        let _pipe2 = repo_filter_query;
        return inspect2(_pipe2);
      })(),
      "- selected_repo: " + repo,
      "- tags: " + (() => {
        let _pipe2 = tags;
        let _pipe$12 = length(_pipe2);
        return to_string(_pipe$12);
      })(),
      "- start_tag: " + start_tag,
      "- end_tag: " + end_tag,
      "- error: " + (() => {
        let _pipe2 = error;
        return http_error_to_string(_pipe2);
      })()
    ]);
  } else {
    let user_name = $.user_name;
    let owner_type = $.owner_type;
    let repos = $.repos;
    let repo_filter_query = $.repo_filter_query;
    let selected_repo = $.repo;
    let tags = $.tags;
    let start_tag = $.start_tag;
    let end_tag = $.end_tag;
    let changes = $.changes;
    let commits_filter = $.commits_filter;
    let files_filter = $.files_filter;
    _block = toList([
      "- state: WithChanges",
      "- user_name: " + user_name,
      "- owner_type: " + (() => {
        let _pipe2 = owner_type;
        return owner_type_to_string(_pipe2);
      })(),
      "- repos: " + (() => {
        let _pipe2 = repos;
        let _pipe$12 = length(_pipe2);
        return to_string(_pipe$12);
      })(),
      "- repo filter query: " + (() => {
        let _pipe2 = repo_filter_query;
        return inspect2(_pipe2);
      })(),
      "- selected_repo: " + selected_repo,
      "- tags: " + (() => {
        let _pipe2 = tags;
        let _pipe$12 = length(_pipe2);
        return to_string(_pipe$12);
      })(),
      "- start_tag: " + start_tag,
      "- end_tag: " + end_tag,
      "- commits: " + (() => {
        let _pipe2 = changes.commits;
        let _pipe$12 = length(_pipe2);
        return to_string(_pipe$12);
      })(),
      "- files: " + (() => {
        let _pipe2 = changes.files;
        let _pipe$12 = unwrap(_pipe2, toList([]));
        let _pipe$2 = length(_pipe$12);
        return to_string(_pipe$2);
      })(),
      "- commits_filter: " + (() => {
        let _pipe2 = commits_filter;
        return inspect2(_pipe2);
      })(),
      "- files_filter: " + (() => {
        let _pipe2 = files_filter;
        return inspect2(_pipe2);
      })()
    ]);
  }
  let state_info = _block;
  let _pipe = toList([
    (() => {
      let _pipe2 = model.config;
      return display_config(_pipe2);
    })()
  ]);
  let _pipe$1 = append(_pipe, state_info);
  return join(_pipe$1, "\n");
}
var author_colors_dark = /* @__PURE__ */ toList([
  "text-[#fd780b]",
  "text-[#a882a7]",
  "text-[#b798f0]",
  "text-[#59d412]",
  "text-[#7bcaff]",
  "text-[#ffb472]",
  "text-[#00ce48]",
  "text-[#1edacd]",
  "text-[#a0d845]",
  "text-[#a681fb]",
  "text-[#f081de]",
  "text-[#63bd8f]",
  "text-[#64d97f]",
  "text-[#90e1ef]",
  "text-[#ddd601]",
  "text-[#4896ef]",
  "text-[#e98658]",
  "text-[#b5d092]",
  "text-[#9fb9f0]",
  "text-[#ff6682]"
]);
var author_colors_light = /* @__PURE__ */ toList([
  "text-[#b34700]",
  "text-[#5b4a5e]",
  "text-[#6a4da3]",
  "text-[#3b7c0d]",
  "text-[#005b99]",
  "text-[#b35a2e]",
  "text-[#007a2b]",
  "text-[#0b8a87]",
  "text-[#6b8f2e]",
  "text-[#745aaf]",
  "text-[#a03b8c]",
  "text-[#3b7c5e]",
  "text-[#3b8a5e]",
  "text-[#4a8ca3]",
  "text-[#a39b00]",
  "text-[#2a5b99]",
  "text-[#a34a2e]",
  "text-[#6b8f5e]",
  "text-[#4a6ca3]",
  "text-[#b33a4d]"
]);
function get_author_color_classes() {
  return new AuthorColorClasses(
    (() => {
      let _pipe = author_colors_dark;
      let _pipe$1 = index_map(_pipe, (c, i) => {
        return [i, c];
      });
      return from_list(_pipe$1);
    })(),
    (() => {
      let _pipe = author_colors_light;
      let _pipe$1 = index_map(_pipe, (c, i) => {
        return [i, c];
      });
      return from_list(_pipe$1);
    })()
  );
}
function init_model() {
  let author_color_classes = get_author_color_classes();
  let $ = public$;
  if ($) {
    return new Model(
      new Config3(new Dark()),
      new ConfigLoaded(new None(), new User(), false),
      author_color_classes,
      false
    );
  } else {
    return new Model(
      new Config3(new Dark()),
      new Initial(),
      author_color_classes,
      false
    );
  }
}

// build/dev/javascript/ghx/ghx/ffi/element_ffi.mjs
function scrollIntoViewStart(element4) {
  element4.scrollIntoView({ behavior: "smooth", block: "start" });
}

// build/dev/javascript/ghx/ghx/effects.mjs
function scroll_element_into_view(id2) {
  let scroll_fn = () => {
    let $ = (() => {
      let _pipe2 = id2;
      return getElementById(_pipe2);
    })();
    if ($ instanceof Ok) {
      let e = $[0];
      let _pipe2 = e;
      return scrollIntoViewStart(_pipe2);
    } else {
      return void 0;
    }
  };
  let _pipe = (_) => {
    setTimeout2(100, scroll_fn);
    return void 0;
  };
  return from(_pipe);
}
var dev = false;
function base_url() {
  let $ = public$;
  if ($) {
    return "https://api.github.com";
  } else {
    let $1 = dev;
    if ($1) {
      return "http://127.0.0.1:9899/api";
    } else {
      return location() + "api";
    }
  }
}
function fetch_initial_config() {
  let expect = expect_json(
    initial_config_decoder(),
    (var0) => {
      return new InitialConfigFetched(var0);
    }
  );
  return get2(base_url() + "/config", expect);
}
function repos_endpoint(user_name, owner_type) {
  let _pipe = toList([
    base_url(),
    (() => {
      if (owner_type instanceof User) {
        return "users";
      } else {
        return "orgs";
      }
    })(),
    user_name,
    "repos?sort=updated&direction=desc&per_page=100&type=sources"
  ]);
  return join(_pipe, "/");
}
function fetch_repos(user_name, owner_type) {
  let expect = expect_json(
    repos_response_decoder(),
    (var0) => {
      return new ReposFetched(var0);
    }
  );
  return get2(
    (() => {
      let _pipe = user_name;
      return repos_endpoint(_pipe, owner_type);
    })(),
    expect
  );
}
function tags_endpoint(user_name, repo) {
  let _pipe = toList([base_url(), "repos", user_name, repo, "tags"]);
  return join(_pipe, "/");
}
function fetch_tags(username, repo) {
  let expect = expect_json(
    tags_response_decoder(),
    (result) => {
      return new TagsFetched([repo, result]);
    }
  );
  return get2(tags_endpoint(username, repo), expect);
}
function changelog_endpoint(user_name, repo, start_tag, end_tag) {
  let _pipe = toList([
    base_url(),
    "repos",
    user_name,
    repo,
    "compare",
    start_tag + "..." + end_tag
  ]);
  return join(_pipe, "/");
}
function fetch_changes(user_name, repo, start_tag, end_tag) {
  let expect = expect_json(
    changes_decoder(),
    (result) => {
      return new ChangesFetched([start_tag, end_tag, result]);
    }
  );
  return get2(
    changelog_endpoint(user_name, repo, start_tag, end_tag),
    expect
  );
}

// build/dev/javascript/ghx/ghx/update.mjs
function update2(model, msg) {
  let zero = [model, none()];
  let state = model.state;
  if (msg instanceof InitialConfigFetched) {
    let result = msg[0];
    if (result instanceof Ok) {
      let initial_config = result[0];
      let maybe_owner = initial_config.owner;
      let owner_type = initial_config.owner_type;
      let theme = initial_config.theme;
      return [
        new Model(
          new Config3(theme),
          new ConfigLoaded(
            maybe_owner,
            owner_type,
            (() => {
              let _pipe = maybe_owner;
              return is_some(_pipe);
            })()
          ),
          model.author_color_classes,
          model.debug
        ),
        (() => {
          if (maybe_owner instanceof Some) {
            let user_name = maybe_owner[0];
            return fetch_repos(user_name, owner_type);
          } else {
            return none();
          }
        })()
      ];
    } else {
      let e = result[0];
      return [
        new Model(
          model.config,
          new ConfigError(e),
          model.author_color_classes,
          model.debug
        ),
        none()
      ];
    }
  } else if (msg instanceof UserChangedTheme) {
    let config = model.config;
    return [
      new Model(
        new Config3(
          (() => {
            let _pipe = config.theme;
            return get_next_theme(_pipe);
          })()
        ),
        model.state,
        model.author_color_classes,
        model.debug
      ),
      none()
    ];
  } else if (msg instanceof AccountTypeChanged) {
    let owner_type = msg[0];
    if (state instanceof ConfigLoaded) {
      let user_name = state.user_name;
      return [
        new Model(
          model.config,
          new ConfigLoaded(user_name, owner_type, false),
          model.author_color_classes,
          model.debug
        ),
        none()
      ];
    } else if (state instanceof WithReposError) {
      let user_name = state.user_name;
      let owner_type$1 = state.owner_type;
      return [
        new Model(
          model.config,
          new ConfigLoaded(
            (() => {
              let _pipe = user_name;
              return new Some(_pipe);
            })(),
            owner_type$1,
            false
          ),
          model.author_color_classes,
          model.debug
        ),
        none()
      ];
    } else if (state instanceof WithRepos) {
      let user_name = state.user_name;
      let owner_type$1 = state.owner_type;
      return [
        new Model(
          model.config,
          new ConfigLoaded(
            (() => {
              let _pipe = user_name;
              return new Some(_pipe);
            })(),
            owner_type$1,
            false
          ),
          model.author_color_classes,
          model.debug
        ),
        none()
      ];
    } else if (state instanceof WithTagsError) {
      let user_name = state.user_name;
      let owner_type$1 = state.owner_type;
      return [
        new Model(
          model.config,
          new ConfigLoaded(
            (() => {
              let _pipe = user_name;
              return new Some(_pipe);
            })(),
            owner_type$1,
            false
          ),
          model.author_color_classes,
          model.debug
        ),
        none()
      ];
    } else if (state instanceof WithTags) {
      let user_name = state.user_name;
      let owner_type$1 = state.owner_type;
      return [
        new Model(
          model.config,
          new ConfigLoaded(
            (() => {
              let _pipe = user_name;
              return new Some(_pipe);
            })(),
            owner_type$1,
            false
          ),
          model.author_color_classes,
          model.debug
        ),
        none()
      ];
    } else if (state instanceof WithChangesError) {
      let user_name = state.user_name;
      let owner_type$1 = state.owner_type;
      return [
        new Model(
          model.config,
          new ConfigLoaded(
            (() => {
              let _pipe = user_name;
              return new Some(_pipe);
            })(),
            owner_type$1,
            false
          ),
          model.author_color_classes,
          model.debug
        ),
        none()
      ];
    } else if (state instanceof WithChanges) {
      let user_name = state.user_name;
      let owner_type$1 = state.owner_type;
      return [
        new Model(
          model.config,
          new ConfigLoaded(
            (() => {
              let _pipe = user_name;
              return new Some(_pipe);
            })(),
            owner_type$1,
            false
          ),
          model.author_color_classes,
          model.debug
        ),
        none()
      ];
    } else {
      return zero;
    }
  } else if (msg instanceof UserEnteredUsernameInput) {
    let uname = msg[0];
    let _block;
    let $ = (() => {
      let _pipe = uname;
      return trim(_pipe);
    })();
    if ($ === "") {
      _block = new None();
    } else if ($.startsWith("https://github.com/")) {
      let u = $.slice(19);
      let _pipe = u;
      _block = new Some(_pipe);
    } else {
      let u = $;
      let _pipe = u;
      _block = new Some(_pipe);
    }
    let user_name = _block;
    if (state instanceof Initial) {
      return zero;
    } else if (state instanceof ConfigError) {
      return zero;
    } else if (state instanceof ConfigLoaded) {
      let owner_type = state.owner_type;
      return [
        new Model(
          model.config,
          new ConfigLoaded(user_name, owner_type, false),
          model.author_color_classes,
          model.debug
        ),
        none()
      ];
    } else if (state instanceof WithReposError) {
      let owner_type = state.owner_type;
      return [
        new Model(
          model.config,
          new ConfigLoaded(user_name, owner_type, false),
          model.author_color_classes,
          model.debug
        ),
        none()
      ];
    } else if (state instanceof WithRepos) {
      let owner_type = state.owner_type;
      return [
        new Model(
          model.config,
          new ConfigLoaded(user_name, owner_type, false),
          model.author_color_classes,
          model.debug
        ),
        none()
      ];
    } else if (state instanceof WithTagsError) {
      let owner_type = state.owner_type;
      return [
        new Model(
          model.config,
          new ConfigLoaded(user_name, owner_type, false),
          model.author_color_classes,
          model.debug
        ),
        none()
      ];
    } else if (state instanceof WithTags) {
      let owner_type = state.owner_type;
      return [
        new Model(
          model.config,
          new ConfigLoaded(user_name, owner_type, false),
          model.author_color_classes,
          model.debug
        ),
        none()
      ];
    } else if (state instanceof WithChangesError) {
      let owner_type = state.owner_type;
      return [
        new Model(
          model.config,
          new ConfigLoaded(user_name, owner_type, false),
          model.author_color_classes,
          model.debug
        ),
        none()
      ];
    } else {
      let owner_type = state.owner_type;
      return [
        new Model(
          model.config,
          new ConfigLoaded(user_name, owner_type, false),
          model.author_color_classes,
          model.debug
        ),
        none()
      ];
    }
  } else if (msg instanceof UserRequestedRepos) {
    if (state instanceof Initial) {
      return zero;
    } else if (state instanceof ConfigError) {
      return zero;
    } else if (state instanceof ConfigLoaded) {
      let maybe_user_name = state.user_name;
      let owner_type = state.owner_type;
      let fetching_repos = state.fetching_repos;
      if (fetching_repos) {
        return zero;
      } else if (maybe_user_name instanceof Some) {
        let user_name = maybe_user_name[0];
        return [
          new Model(
            model.config,
            new ConfigLoaded(
              (() => {
                let _pipe = user_name;
                return new Some(_pipe);
              })(),
              owner_type,
              true
            ),
            model.author_color_classes,
            model.debug
          ),
          (() => {
            let _pipe = user_name;
            return fetch_repos(_pipe, owner_type);
          })()
        ];
      } else {
        return zero;
      }
    } else if (state instanceof WithReposError) {
      let user_name = state.user_name;
      let owner_type = state.owner_type;
      return [
        new Model(
          model.config,
          new ConfigLoaded(
            (() => {
              let _pipe = user_name;
              return new Some(_pipe);
            })(),
            owner_type,
            true
          ),
          model.author_color_classes,
          model.debug
        ),
        (() => {
          let _pipe = user_name;
          return fetch_repos(_pipe, owner_type);
        })()
      ];
    } else if (state instanceof WithRepos) {
      let user_name = state.user_name;
      let owner_type = state.owner_type;
      return [
        new Model(
          model.config,
          new ConfigLoaded(
            (() => {
              let _pipe = user_name;
              return new Some(_pipe);
            })(),
            owner_type,
            true
          ),
          model.author_color_classes,
          model.debug
        ),
        (() => {
          let _pipe = user_name;
          return fetch_repos(_pipe, owner_type);
        })()
      ];
    } else if (state instanceof WithTagsError) {
      let user_name = state.user_name;
      let owner_type = state.owner_type;
      return [
        new Model(
          model.config,
          new ConfigLoaded(
            (() => {
              let _pipe = user_name;
              return new Some(_pipe);
            })(),
            owner_type,
            true
          ),
          model.author_color_classes,
          model.debug
        ),
        (() => {
          let _pipe = user_name;
          return fetch_repos(_pipe, owner_type);
        })()
      ];
    } else if (state instanceof WithTags) {
      let user_name = state.user_name;
      let owner_type = state.owner_type;
      return [
        new Model(
          model.config,
          new ConfigLoaded(
            (() => {
              let _pipe = user_name;
              return new Some(_pipe);
            })(),
            owner_type,
            true
          ),
          model.author_color_classes,
          model.debug
        ),
        (() => {
          let _pipe = user_name;
          return fetch_repos(_pipe, owner_type);
        })()
      ];
    } else if (state instanceof WithChangesError) {
      let user_name = state.user_name;
      let owner_type = state.owner_type;
      return [
        new Model(
          model.config,
          new ConfigLoaded(
            (() => {
              let _pipe = user_name;
              return new Some(_pipe);
            })(),
            owner_type,
            true
          ),
          model.author_color_classes,
          model.debug
        ),
        (() => {
          let _pipe = user_name;
          return fetch_repos(_pipe, owner_type);
        })()
      ];
    } else {
      let user_name = state.user_name;
      let owner_type = state.owner_type;
      return [
        new Model(
          model.config,
          new ConfigLoaded(
            (() => {
              let _pipe = user_name;
              return new Some(_pipe);
            })(),
            owner_type,
            true
          ),
          model.author_color_classes,
          model.debug
        ),
        (() => {
          let _pipe = user_name;
          return fetch_repos(_pipe, owner_type);
        })()
      ];
    }
  } else if (msg instanceof ReposFetched) {
    let r = msg[0];
    if (state instanceof ConfigLoaded) {
      let maybe_user_name = state.user_name;
      let owner_type = state.owner_type;
      let fetching_repos = state.fetching_repos;
      if (fetching_repos) {
        if (maybe_user_name instanceof Some) {
          let user_name = maybe_user_name[0];
          if (r instanceof Ok) {
            let repos = r[0];
            return [
              new Model(
                model.config,
                new WithRepos(
                  user_name,
                  owner_type,
                  repos,
                  new None(),
                  false,
                  new None()
                ),
                model.author_color_classes,
                model.debug
              ),
              none()
            ];
          } else {
            let error = r[0];
            return [
              new Model(
                model.config,
                new WithReposError(user_name, owner_type, error),
                model.author_color_classes,
                model.debug
              ),
              none()
            ];
          }
        } else {
          return zero;
        }
      } else {
        return zero;
      }
    } else {
      return zero;
    }
  } else if (msg instanceof UserEnteredRepoFilterQuery) {
    let filter3 = msg[0];
    let _block;
    let $ = (() => {
      let _pipe = filter3;
      let _pipe$1 = trim(_pipe);
      return string_length(_pipe$1);
    })();
    if ($ === 0) {
      _block = new None();
    } else {
      let _pipe = filter3;
      _block = new Some(_pipe);
    }
    let query = _block;
    let _block$1;
    if (state instanceof WithRepos) {
      _block$1 = new Model(
        model.config,
        new WithRepos(
          state.user_name,
          state.owner_type,
          state.repos,
          query,
          state.fetching_tags,
          state.selected_repo
        ),
        model.author_color_classes,
        model.debug
      );
    } else if (state instanceof WithTagsError) {
      _block$1 = new Model(
        model.config,
        new WithTagsError(
          state.user_name,
          state.owner_type,
          state.repos,
          query,
          state.repo,
          state.error
        ),
        model.author_color_classes,
        model.debug
      );
    } else if (state instanceof WithTags) {
      _block$1 = new Model(
        model.config,
        new WithTags(
          state.user_name,
          state.owner_type,
          state.repos,
          query,
          state.repo,
          state.tags,
          state.start_tag,
          state.end_tag,
          state.fetching_changes
        ),
        model.author_color_classes,
        model.debug
      );
    } else if (state instanceof WithChangesError) {
      _block$1 = new Model(
        model.config,
        new WithChangesError(
          state.user_name,
          state.owner_type,
          state.repos,
          query,
          state.repo,
          state.tags,
          state.start_tag,
          state.end_tag,
          state.error
        ),
        model.author_color_classes,
        model.debug
      );
    } else if (state instanceof WithChanges) {
      _block$1 = new Model(
        model.config,
        new WithChanges(
          state.user_name,
          state.owner_type,
          state.repos,
          query,
          state.repo,
          state.tags,
          state.start_tag,
          state.end_tag,
          state.changes,
          state.commits_filter,
          state.files_filter
        ),
        model.author_color_classes,
        model.debug
      );
    } else {
      _block$1 = model;
    }
    let updated_model = _block$1;
    return [updated_model, none()];
  } else if (msg instanceof RepoChosen) {
    let repo = msg[0];
    let $ = (() => {
      let _pipe = repo;
      return string_length(_pipe);
    })();
    if ($ === 0) {
      if (state instanceof WithRepos) {
        let user_name = state.user_name;
        let owner_type = state.owner_type;
        let repos = state.repos;
        let repo_filter_query = state.repo_filter_query;
        return [
          new Model(
            model.config,
            new WithRepos(
              user_name,
              owner_type,
              repos,
              repo_filter_query,
              true,
              (() => {
                let _pipe = repo;
                return new Some(_pipe);
              })()
            ),
            model.author_color_classes,
            model.debug
          ),
          none()
        ];
      } else if (state instanceof WithTagsError) {
        let user_name = state.user_name;
        let owner_type = state.owner_type;
        let repos = state.repos;
        let repo_filter_query = state.repo_filter_query;
        return [
          new Model(
            model.config,
            new WithRepos(
              user_name,
              owner_type,
              repos,
              repo_filter_query,
              true,
              (() => {
                let _pipe = repo;
                return new Some(_pipe);
              })()
            ),
            model.author_color_classes,
            model.debug
          ),
          none()
        ];
      } else if (state instanceof WithTags) {
        let user_name = state.user_name;
        let owner_type = state.owner_type;
        let repos = state.repos;
        let repo_filter_query = state.repo_filter_query;
        return [
          new Model(
            model.config,
            new WithRepos(
              user_name,
              owner_type,
              repos,
              repo_filter_query,
              true,
              (() => {
                let _pipe = repo;
                return new Some(_pipe);
              })()
            ),
            model.author_color_classes,
            model.debug
          ),
          none()
        ];
      } else if (state instanceof WithChangesError) {
        let user_name = state.user_name;
        let owner_type = state.owner_type;
        let repos = state.repos;
        let repo_filter_query = state.repo_filter_query;
        return [
          new Model(
            model.config,
            new WithRepos(
              user_name,
              owner_type,
              repos,
              repo_filter_query,
              true,
              (() => {
                let _pipe = repo;
                return new Some(_pipe);
              })()
            ),
            model.author_color_classes,
            model.debug
          ),
          none()
        ];
      } else if (state instanceof WithChanges) {
        let user_name = state.user_name;
        let owner_type = state.owner_type;
        let repos = state.repos;
        let repo_filter_query = state.repo_filter_query;
        return [
          new Model(
            model.config,
            new WithRepos(
              user_name,
              owner_type,
              repos,
              repo_filter_query,
              true,
              (() => {
                let _pipe = repo;
                return new Some(_pipe);
              })()
            ),
            model.author_color_classes,
            model.debug
          ),
          none()
        ];
      } else {
        return zero;
      }
    } else {
      if (state instanceof WithRepos) {
        let user_name = state.user_name;
        let owner_type = state.owner_type;
        let repos = state.repos;
        let repo_filter_query = state.repo_filter_query;
        return [
          new Model(
            model.config,
            new WithRepos(
              user_name,
              owner_type,
              repos,
              repo_filter_query,
              true,
              (() => {
                let _pipe = repo;
                return new Some(_pipe);
              })()
            ),
            model.author_color_classes,
            model.debug
          ),
          fetch_tags(user_name, repo)
        ];
      } else if (state instanceof WithTagsError) {
        let user_name = state.user_name;
        let owner_type = state.owner_type;
        let repos = state.repos;
        let repo_filter_query = state.repo_filter_query;
        return [
          new Model(
            model.config,
            new WithRepos(
              user_name,
              owner_type,
              repos,
              repo_filter_query,
              true,
              (() => {
                let _pipe = repo;
                return new Some(_pipe);
              })()
            ),
            model.author_color_classes,
            model.debug
          ),
          fetch_tags(user_name, repo)
        ];
      } else if (state instanceof WithTags) {
        let user_name = state.user_name;
        let owner_type = state.owner_type;
        let repos = state.repos;
        let repo_filter_query = state.repo_filter_query;
        return [
          new Model(
            model.config,
            new WithRepos(
              user_name,
              owner_type,
              repos,
              repo_filter_query,
              true,
              (() => {
                let _pipe = repo;
                return new Some(_pipe);
              })()
            ),
            model.author_color_classes,
            model.debug
          ),
          fetch_tags(user_name, repo)
        ];
      } else if (state instanceof WithChangesError) {
        let user_name = state.user_name;
        let owner_type = state.owner_type;
        let repos = state.repos;
        let repo_filter_query = state.repo_filter_query;
        return [
          new Model(
            model.config,
            new WithRepos(
              user_name,
              owner_type,
              repos,
              repo_filter_query,
              true,
              (() => {
                let _pipe = repo;
                return new Some(_pipe);
              })()
            ),
            model.author_color_classes,
            model.debug
          ),
          fetch_tags(user_name, repo)
        ];
      } else if (state instanceof WithChanges) {
        let user_name = state.user_name;
        let owner_type = state.owner_type;
        let repos = state.repos;
        let repo_filter_query = state.repo_filter_query;
        return [
          new Model(
            model.config,
            new WithRepos(
              user_name,
              owner_type,
              repos,
              repo_filter_query,
              true,
              (() => {
                let _pipe = repo;
                return new Some(_pipe);
              })()
            ),
            model.author_color_classes,
            model.debug
          ),
          fetch_tags(user_name, repo)
        ];
      } else {
        return zero;
      }
    }
  } else if (msg instanceof TagsFetched) {
    let repo = msg[0][0];
    let result = msg[0][1];
    if (state instanceof WithRepos) {
      let user_name = state.user_name;
      let owner_type = state.owner_type;
      let repos = state.repos;
      let repo_filter_query = state.repo_filter_query;
      if (result instanceof Ok) {
        let tags = result[0];
        return [
          new Model(
            model.config,
            new WithTags(
              user_name,
              owner_type,
              repos,
              repo_filter_query,
              repo,
              tags,
              new None(),
              new None(),
              false
            ),
            model.author_color_classes,
            model.debug
          ),
          scroll_element_into_view(
            (() => {
              let _pipe = new TagsSection();
              return section_id(_pipe);
            })()
          )
        ];
      } else {
        let error = result[0];
        return [
          new Model(
            model.config,
            new WithTagsError(
              user_name,
              owner_type,
              repos,
              repo_filter_query,
              repo,
              error
            ),
            model.author_color_classes,
            model.debug
          ),
          none()
        ];
      }
    } else {
      return zero;
    }
  } else if (msg instanceof StartTagChosen) {
    let tag = msg[0];
    if (state instanceof WithTags) {
      let user_name = state.user_name;
      let owner_type = state.owner_type;
      let repos = state.repos;
      let repo_filter_query = state.repo_filter_query;
      let repo = state.repo;
      let tags = state.tags;
      let end_tag = state.end_tag;
      return [
        new Model(
          model.config,
          new WithTags(
            user_name,
            owner_type,
            repos,
            repo_filter_query,
            repo,
            tags,
            (() => {
              let $ = (() => {
                let _pipe = tag;
                return string_length(_pipe);
              })();
              if ($ === 0) {
                return new None();
              } else {
                let _pipe = tag;
                return new Some(_pipe);
              }
            })(),
            (() => {
              let _pipe = end_tag;
              return or(
                _pipe,
                (() => {
                  let _pipe$1 = head;
                  return new Some(_pipe$1);
                })()
              );
            })(),
            false
          ),
          model.author_color_classes,
          model.debug
        ),
        none()
      ];
    } else if (state instanceof WithChangesError) {
      let user_name = state.user_name;
      let owner_type = state.owner_type;
      let repos = state.repos;
      let repo_filter_query = state.repo_filter_query;
      let repo = state.repo;
      let tags = state.tags;
      let end_tag = state.end_tag;
      return [
        new Model(
          model.config,
          new WithTags(
            user_name,
            owner_type,
            repos,
            repo_filter_query,
            repo,
            tags,
            (() => {
              let $ = (() => {
                let _pipe = tag;
                return string_length(_pipe);
              })();
              if ($ === 0) {
                return new None();
              } else {
                let _pipe = tag;
                return new Some(_pipe);
              }
            })(),
            (() => {
              let _pipe = end_tag;
              return new Some(_pipe);
            })(),
            false
          ),
          model.author_color_classes,
          model.debug
        ),
        none()
      ];
    } else if (state instanceof WithChanges) {
      let user_name = state.user_name;
      let owner_type = state.owner_type;
      let repos = state.repos;
      let repo_filter_query = state.repo_filter_query;
      let repo = state.repo;
      let tags = state.tags;
      let end_tag = state.end_tag;
      return [
        new Model(
          model.config,
          new WithTags(
            user_name,
            owner_type,
            repos,
            repo_filter_query,
            repo,
            tags,
            (() => {
              let $ = (() => {
                let _pipe = tag;
                return string_length(_pipe);
              })();
              if ($ === 0) {
                return new None();
              } else {
                let _pipe = tag;
                return new Some(_pipe);
              }
            })(),
            (() => {
              let _pipe = end_tag;
              return new Some(_pipe);
            })(),
            false
          ),
          model.author_color_classes,
          model.debug
        ),
        none()
      ];
    } else {
      return zero;
    }
  } else if (msg instanceof EndTagChosen) {
    let tag = msg[0];
    if (state instanceof WithTags) {
      let user_name = state.user_name;
      let owner_type = state.owner_type;
      let repos = state.repos;
      let repo_filter_query = state.repo_filter_query;
      let repo = state.repo;
      let tags = state.tags;
      let start_tag = state.start_tag;
      return [
        new Model(
          model.config,
          new WithTags(
            user_name,
            owner_type,
            repos,
            repo_filter_query,
            repo,
            tags,
            start_tag,
            (() => {
              let $ = (() => {
                let _pipe = tag;
                return string_length(_pipe);
              })();
              if ($ === 0) {
                return new None();
              } else {
                let _pipe = tag;
                return new Some(_pipe);
              }
            })(),
            false
          ),
          model.author_color_classes,
          model.debug
        ),
        none()
      ];
    } else if (state instanceof WithChangesError) {
      let user_name = state.user_name;
      let owner_type = state.owner_type;
      let repos = state.repos;
      let repo_filter_query = state.repo_filter_query;
      let repo = state.repo;
      let tags = state.tags;
      let start_tag = state.start_tag;
      return [
        new Model(
          model.config,
          new WithTags(
            user_name,
            owner_type,
            repos,
            repo_filter_query,
            repo,
            tags,
            (() => {
              let _pipe = start_tag;
              return new Some(_pipe);
            })(),
            (() => {
              let $ = (() => {
                let _pipe = tag;
                return string_length(_pipe);
              })();
              if ($ === 0) {
                return new None();
              } else {
                let _pipe = tag;
                return new Some(_pipe);
              }
            })(),
            false
          ),
          model.author_color_classes,
          model.debug
        ),
        none()
      ];
    } else if (state instanceof WithChanges) {
      let user_name = state.user_name;
      let owner_type = state.owner_type;
      let repos = state.repos;
      let repo_filter_query = state.repo_filter_query;
      let repo = state.repo;
      let tags = state.tags;
      let start_tag = state.start_tag;
      return [
        new Model(
          model.config,
          new WithTags(
            user_name,
            owner_type,
            repos,
            repo_filter_query,
            repo,
            tags,
            (() => {
              let _pipe = start_tag;
              return new Some(_pipe);
            })(),
            (() => {
              let $ = (() => {
                let _pipe = tag;
                return string_length(_pipe);
              })();
              if ($ === 0) {
                return new None();
              } else {
                let _pipe = tag;
                return new Some(_pipe);
              }
            })(),
            false
          ),
          model.author_color_classes,
          model.debug
        ),
        none()
      ];
    } else {
      return zero;
    }
  } else if (msg instanceof UserRequestedChangelog) {
    if (state instanceof WithTags) {
      let user_name = state.user_name;
      let repo = state.repo;
      let $ = state.start_tag;
      let $1 = state.end_tag;
      if ($1 instanceof Some && $ instanceof Some) {
        let end = $1[0];
        let start4 = $[0];
        return [
          new Model(
            model.config,
            new WithTags(
              state.user_name,
              state.owner_type,
              state.repos,
              state.repo_filter_query,
              state.repo,
              state.tags,
              state.start_tag,
              state.end_tag,
              true
            ),
            model.author_color_classes,
            model.debug
          ),
          fetch_changes(user_name, repo, start4, end)
        ];
      } else {
        return zero;
      }
    } else {
      return zero;
    }
  } else if (msg instanceof ChangesFetched) {
    let start_tag = msg[0][0];
    let end_tag = msg[0][1];
    let result = msg[0][2];
    if (state instanceof WithTags) {
      let user_name = state.user_name;
      let owner_type = state.owner_type;
      let repos = state.repos;
      let repo_filter_query = state.repo_filter_query;
      let repo = state.repo;
      let tags = state.tags;
      if (result instanceof Ok) {
        let changes = result[0];
        return [
          new Model(
            model.config,
            new WithChanges(
              user_name,
              owner_type,
              repos,
              repo_filter_query,
              repo,
              tags,
              start_tag,
              end_tag,
              changes,
              new None(),
              new None()
            ),
            model.author_color_classes,
            model.debug
          ),
          scroll_element_into_view(
            (() => {
              let _pipe = new CommitsSection();
              return section_id(_pipe);
            })()
          )
        ];
      } else {
        let error = result[0];
        return [
          new Model(
            model.config,
            new WithChangesError(
              user_name,
              owner_type,
              repos,
              repo_filter_query,
              repo,
              tags,
              start_tag,
              end_tag,
              error
            ),
            model.author_color_classes,
            model.debug
          ),
          none()
        ];
      }
    } else {
      return zero;
    }
  } else if (msg instanceof UserRequestedToGoToSection) {
    let section = msg[0];
    return [
      model,
      (() => {
        let _pipe = section;
        let _pipe$1 = section_id(_pipe);
        return scroll_element_into_view(_pipe$1);
      })()
    ];
  } else if (msg instanceof UserEnteredCommitsFilterQuery) {
    let query = msg[0];
    if (state instanceof WithChanges) {
      let _block;
      let $ = (() => {
        let _pipe = query;
        return string_length(_pipe);
      })();
      if ($ === 0) {
        _block = new None();
      } else {
        let _pipe = query;
        _block = new Some(_pipe);
      }
      let filter3 = _block;
      return [
        new Model(
          model.config,
          new WithChanges(
            state.user_name,
            state.owner_type,
            state.repos,
            state.repo_filter_query,
            state.repo,
            state.tags,
            state.start_tag,
            state.end_tag,
            state.changes,
            filter3,
            state.files_filter
          ),
          model.author_color_classes,
          model.debug
        ),
        none()
      ];
    } else {
      return zero;
    }
  } else {
    let query = msg[0];
    if (state instanceof WithChanges) {
      let _block;
      let $ = (() => {
        let _pipe = query;
        return string_length(_pipe);
      })();
      if ($ === 0) {
        _block = new None();
      } else {
        let _pipe = query;
        _block = new Some(_pipe);
      }
      let filter3 = _block;
      return [
        new Model(
          model.config,
          new WithChanges(
            state.user_name,
            state.owner_type,
            state.repos,
            state.repo_filter_query,
            state.repo,
            state.tags,
            state.start_tag,
            state.end_tag,
            state.changes,
            state.commits_filter,
            filter3
          ),
          model.author_color_classes,
          model.debug
        ),
        none()
      ];
    } else {
      return zero;
    }
  }
}

// build/dev/javascript/lustre/lustre/event.mjs
function is_immediate_event(name2) {
  if (name2 === "input") {
    return true;
  } else if (name2 === "change") {
    return true;
  } else if (name2 === "focus") {
    return true;
  } else if (name2 === "focusin") {
    return true;
  } else if (name2 === "focusout") {
    return true;
  } else if (name2 === "blur") {
    return true;
  } else if (name2 === "select") {
    return true;
  } else {
    return false;
  }
}
function on(name2, handler) {
  return event(
    name2,
    map3(handler, (msg) => {
      return new Handler(false, false, msg);
    }),
    empty_list,
    never,
    never,
    is_immediate_event(name2),
    0,
    0
  );
}
function on_click(msg) {
  return on("click", success(msg));
}
function on_input(msg) {
  return on(
    "input",
    subfield(
      toList(["target", "value"]),
      string3,
      (value3) => {
        return success(msg(value3));
      }
    )
  );
}
function on_check(msg) {
  return on(
    "change",
    subfield(
      toList(["target", "checked"]),
      bool,
      (checked2) => {
        return success(msg(checked2));
      }
    )
  );
}

// build/dev/javascript/ghx/ghx/view.mjs
var Start = class extends CustomType {
};
var End = class extends CustomType {
};
function main_div_class(theme) {
  if (theme instanceof Light) {
    return "bg-[#ffffff] text-[#282828]";
  } else {
    return "bg-[#282828] text-[#fbf1c7]";
  }
}
function debug_section(model) {
  let $ = model.debug;
  if ($) {
    return div(
      toList([
        class$(
          "flex-1 overflow-y-scroll mx-4 mt-8 p-4 border-2 border-[#a594f9] border-opacity-50 border-dotted max-h-60"
        ),
        id(
          (() => {
            let _pipe = new DebugSection();
            return section_id(_pipe);
          })()
        )
      ]),
      toList([
        p(
          toList([
            class$("text-xl"),
            id(
              (() => {
                let _pipe = new DebugSection();
                return section_heading_id(_pipe);
              })()
            )
          ]),
          toList([
            (() => {
              let _pipe = "debug";
              return text2(_pipe);
            })()
          ])
        ),
        div(
          toList([]),
          toList([
            pre(
              toList([class$("mt-4 text-wrap ")]),
              toList([
                (() => {
                  let _pipe = model;
                  let _pipe$1 = display_model(_pipe);
                  return text2(_pipe$1);
                })()
              ])
            )
          ])
        )
      ])
    );
  } else {
    return none2();
  }
}
function heading(theme) {
  let _block;
  if (theme instanceof Light) {
    _block = "text-[#564592]";
  } else {
    _block = "text-[#e5d9f2]";
  }
  let heading_class = _block;
  let _block$1;
  if (theme instanceof Light) {
    _block$1 = "bg-[#282828] text-[#ffffff]";
  } else {
    _block$1 = "bg-[#e5d9f2] text-[#282828]";
  }
  let tooltip_class = _block$1;
  return div(
    toList([class$("flex gap-4 items-center")]),
    toList([
      p(
        toList([class$("text-4xl font-semibold " + heading_class)]),
        toList([
          (() => {
            let _pipe = "ghx";
            return text2(_pipe);
          })()
        ])
      ),
      (() => {
        let $ = public$;
        if ($) {
          return div(
            toList([class$("relative group")]),
            toList([
              p(
                toList([class$("text-md " + heading_class)]),
                toList([
                  (() => {
                    let _pipe = "(unauthenticated public version)";
                    return text2(_pipe);
                  })()
                ])
              ),
              div(
                toList([
                  class$(
                    "absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden w-full group-hover:block text-xs px-2 py-1 text-center " + tooltip_class
                  )
                ]),
                toList([
                  (() => {
                    let _pipe = "Github might rate limit you after a while; use the command line version of ghx to make authenticated calls or to fetch non-public data";
                    return text2(_pipe);
                  })()
                ])
              )
            ])
          );
        } else {
          return none2();
        }
      })(),
      button(
        toList([
          class$("ml-auto text-xl"),
          on_click(new UserChangedTheme())
        ]),
        toList([
          text2(
            (() => {
              let _pipe = theme;
              return theme_to_string(_pipe);
            })()
          )
        ])
      )
    ])
  );
}
function config_error_section(error, theme) {
  let _block;
  if (theme instanceof Light) {
    _block = "text-[#cc241d]";
  } else {
    _block = "text-[#fb4934]";
  }
  let error_class = _block;
  let _block$1;
  if (theme instanceof Light) {
    _block$1 = "border-[#cc241d]";
  } else {
    _block$1 = "border-[#fb4934]";
  }
  let div_class = _block$1;
  return div(
    toList([
      class$(
        "mt-4 p-2 border-2 border-opacity-75 border-dotted " + div_class
      )
    ]),
    toList([
      p(
        toList([class$(error_class)]),
        toList([
          (() => {
            let _pipe = "Error fetching initial config: ";
            return text2(_pipe);
          })()
        ])
      ),
      pre(
        toList([class$("mt-2 p-1 text-wrap")]),
        toList([
          text2(
            (() => {
              let _pipe = error;
              return http_error_to_string(_pipe);
            })()
          )
        ])
      )
    ])
  );
}
function section_bg_class(section, theme) {
  if (theme instanceof Light) {
    if (section instanceof DebugSection) {
      return "bg-[#fabd2f]";
    } else if (section instanceof OwnerSection) {
      return "bg-[#cdc1ff]";
    } else if (section instanceof ReposSection) {
      return "bg-[#ff9fb2]";
    } else if (section instanceof TagsSection) {
      return "bg-[#a4f3b3]";
    } else if (section instanceof CommitsSection) {
      return "bg-[#b370e5]";
    } else {
      return "bg-[#7ab02d]";
    }
  } else {
    if (section instanceof DebugSection) {
      return "bg-[#fabd2f]";
    } else if (section instanceof OwnerSection) {
      return "bg-[#a594f9]";
    } else if (section instanceof ReposSection) {
      return "bg-[#8caaee]";
    } else if (section instanceof TagsSection) {
      return "bg-[#80ed99]";
    } else if (section instanceof CommitsSection) {
      return "bg-[#c77dff]";
    } else {
      return "bg-[#affc41]";
    }
  }
}
function owner_type_radio(owner_type, checked2) {
  let id2 = "owner-selector-" + (() => {
    let _pipe = owner_type;
    return owner_type_to_string(_pipe);
  })();
  return div(
    toList([]),
    toList([
      input(
        toList([
          name("inline-radio-group"),
          checked(checked2),
          type_("radio"),
          id(id2),
          on_check(
            (_) => {
              return new AccountTypeChanged(owner_type);
            }
          )
        ])
      ),
      label(
        toList([class$("ms-2"), for$(id2)]),
        toList([
          text3(
            (() => {
              let _pipe = owner_type;
              return owner_type_to_string(_pipe);
            })()
          )
        ])
      )
    ])
  );
}
function owner_type_selector(owner_type) {
  return div(
    toList([class$("flex flex-wrap gap-2 items-center")]),
    (() => {
      let _pipe = owner_types();
      return map2(
        _pipe,
        (at) => {
          let _pipe$1 = at;
          return owner_type_radio(_pipe$1, isEqual(at, owner_type));
        }
      );
    })()
  );
}
function owner_selection_section(user_name, owner_type, fetching_repos, theme) {
  let input_class = (() => {
    if (theme instanceof Light) {
      return "placeholder-[#3d3d3d]";
    } else {
      return "text-[#282828] placeholder-[#3d3d3d]";
    }
  })() + " " + section_bg_class(new OwnerSection(), theme);
  let _block;
  if (theme instanceof Light) {
    _block = "bg-[#ada9fd]";
  } else {
    _block = "bg-[#817ffc] text-[#282828]";
  }
  let button_class = _block;
  let _block$1;
  if (owner_type instanceof User) {
    _block$1 = "username";
  } else {
    _block$1 = "org name";
  }
  let placeholder2 = _block$1;
  return div(
    toList([
      class$(
        "mt-8 p-4 border-2 border-[#a594f9] border-opacity-50 border-dotted"
      ),
      id(
        (() => {
          let _pipe = new OwnerSection();
          return section_id(_pipe);
        })()
      )
    ]),
    toList([
      p(
        toList([
          class$("text-xl"),
          id(
            (() => {
              let _pipe = new OwnerSection();
              return section_heading_id(_pipe);
            })()
          )
        ]),
        toList([
          (() => {
            let _pipe = "owner";
            return text2(_pipe);
          })()
        ])
      ),
      div(
        toList([class$("flex flex-wrap gap-4 items-center mt-2")]),
        toList([
          input(
            toList([
              class$(
                "px-2 py-1 my-2 font-semibold max-sm:w-full w-1/3 " + input_class
              ),
              placeholder(placeholder2),
              value(
                (() => {
                  let _pipe = user_name;
                  return unwrap(_pipe, "");
                })()
              ),
              disabled(fetching_repos),
              on_input(
                (var0) => {
                  return new UserEnteredUsernameInput(var0);
                }
              )
            ])
          ),
          (() => {
            let _pipe = owner_type;
            return owner_type_selector(_pipe);
          })(),
          button(
            toList([
              id("fetch-repos"),
              class$(
                "px-4 py-1 font-semibold disabled:bg-[#a89984] " + button_class
              ),
              disabled(
                (() => {
                  let _pipe = user_name;
                  return is_none(_pipe);
                })() || fetching_repos
              ),
              on_click(new UserRequestedRepos())
            ]),
            toList([text2("fetch repos")])
          )
        ])
      )
    ])
  );
}
function repos_error_section(error, owner_type, theme) {
  let _block;
  if (theme instanceof Light) {
    _block = "text-[#cc241d]";
  } else {
    _block = "text-[#fb4934]";
  }
  let error_class = _block;
  let _block$1;
  if (theme instanceof Light) {
    _block$1 = "border-[#cc241d]";
  } else {
    _block$1 = "border-[#fb4934]";
  }
  let div_class = _block$1;
  return div(
    toList([
      class$(
        "mt-4 p-2 border-2 border-opacity-75 border-dotted " + div_class
      )
    ]),
    toList([
      p(
        toList([class$(error_class)]),
        toList([
          (() => {
            let _pipe = "Error fetching repos for the " + (() => {
              let _pipe2 = owner_type;
              return owner_type_to_string(_pipe2);
            })() + ": ";
            return text2(_pipe);
          })()
        ])
      ),
      pre(
        toList([class$("mt-2 p-1 text-wrap")]),
        toList([
          text2(
            (() => {
              let _pipe = error;
              return http_error_to_string(_pipe);
            })()
          )
        ])
      )
    ])
  );
}
function fetching_repos_section(fetching_repos) {
  if (fetching_repos) {
    return div(
      toList([
        class$(
          "mt-4 p-4 border-2 border-[#a594f9] border-opacity-50 border-dotted"
        )
      ]),
      toList([
        p(
          toList([class$("text-xl")]),
          toList([
            (() => {
              let _pipe = "fetching repos ...";
              return text2(_pipe);
            })()
          ])
        )
      ])
    );
  } else {
    return none2();
  }
}
function repo_select_button(repo, selected2, theme) {
  let _block;
  if (theme instanceof Light) {
    _block = "text-[#282828] disabled:bg-[#ff9fb2] hover:bg-[#fbdce2]";
  } else {
    _block = "text-[#8caaee] disabled:bg-[#8caaee] disabled:text-[#282828] hover:text-[#282828] hover:bg-[#c6d0f5]";
  }
  let class$2 = _block;
  return button(
    toList([
      id("reset-filter"),
      class$(
        "max-sm:text-xs text-sm font-semibold mr-2 px-2 py-1 my-1 " + class$2
      ),
      disabled(selected2),
      on_click(new RepoChosen(repo.name))
    ]),
    toList([text2(repo.name)])
  );
}
function fetching_tags_section(fetching_tags) {
  if (fetching_tags) {
    return div(
      toList([
        class$(
          "mt-4 p-4 border-2 border-[#a594f9] border-opacity-50 border-dotted"
        )
      ]),
      toList([
        p(
          toList([class$("text-xl")]),
          toList([
            (() => {
              let _pipe = "fetching tags ...";
              return text2(_pipe);
            })()
          ])
        )
      ])
    );
  } else {
    return none2();
  }
}
function tags_error_section(error, theme) {
  let _block;
  if (theme instanceof Light) {
    _block = "text-[#cc241d]";
  } else {
    _block = "text-[#fb4934]";
  }
  let error_class = _block;
  let _block$1;
  if (theme instanceof Light) {
    _block$1 = "border-[#cc241d]";
  } else {
    _block$1 = "border-[#fb4934]";
  }
  let div_class = _block$1;
  return div(
    toList([
      class$(
        "mt-6 p-2 border-2 border-opacity-75 border-dotted " + div_class
      )
    ]),
    toList([
      p(
        toList([class$(error_class)]),
        toList([
          (() => {
            let _pipe = "Error fetching tags for the repo:";
            return text2(_pipe);
          })()
        ])
      ),
      pre(
        toList([class$("mt-2 p-1 text-wrap")]),
        toList([
          text2(
            (() => {
              let _pipe = error;
              return http_error_to_string(_pipe);
            })()
          )
        ])
      )
    ])
  );
}
function tag_option(value3, label2, selected_value) {
  let _block;
  let _pipe = selected_value;
  let _pipe$1 = map(_pipe, (s) => {
    return s === value3;
  });
  _block = unwrap(_pipe$1, false);
  let is_selected = _block;
  return option(
    toList([
      value(value3),
      (() => {
        let _pipe$2 = is_selected;
        return selected(_pipe$2);
      })()
    ]),
    label2
  );
}
function tag_select(tags, tag_type, selected2, theme) {
  let _block;
  if (theme instanceof Light) {
    _block = "bg-[#9bb1ff] text-[#282828]";
  } else {
    _block = "bg-[#788bff] text-[#282828]";
  }
  let select_class = _block;
  return select(
    toList([
      class$("py-1 px-2 font-semibold " + select_class),
      name("tags"),
      on_input(
        (() => {
          if (tag_type instanceof Start) {
            return (var0) => {
              return new StartTagChosen(var0);
            };
          } else {
            return (var0) => {
              return new EndTagChosen(var0);
            };
          }
        })()
      )
    ]),
    (() => {
      let _pipe = tags;
      let _pipe$1 = map2(
        _pipe,
        (t) => {
          return tag_option(t.name, t.name, selected2);
        }
      );
      let _pipe$2 = prepend2(
        _pipe$1,
        tag_option(head, head, selected2)
      );
      return prepend2(
        _pipe$2,
        tag_option(
          "",
          (() => {
            if (tag_type instanceof Start) {
              return "-- choose start tag --";
            } else {
              return "-- choose end tag --";
            }
          })(),
          selected2
        )
      );
    })()
  );
}
function tags_select_section(tags, start_tag, end_tag, fetching_changelog, theme) {
  return div(
    toList([
      class$(
        "mt-4 p-4 border-2 border-[#a594f9] border-opacity-50 border-dotted"
      ),
      id(
        (() => {
          let _pipe = new TagsSection();
          return section_id(_pipe);
        })()
      )
    ]),
    (() => {
      let $ = (() => {
        let _pipe = tags;
        return length(_pipe);
      })();
      if ($ === 0) {
        return toList([
          p(
            toList([class$("text-xl")]),
            toList([
              (() => {
                let _pipe = "repo has no tags";
                return text2(_pipe);
              })()
            ])
          )
        ]);
      } else {
        return toList([
          p(
            toList([
              class$("text-xl"),
              id(
                (() => {
                  let _pipe = new TagsSection();
                  return section_heading_id(_pipe);
                })()
              )
            ]),
            toList([
              (() => {
                let _pipe = "tags";
                return text2(_pipe);
              })()
            ])
          ),
          div(
            toList([class$("mt-4 flex flex-wrap gap-2 items-center")]),
            (() => {
              if (start_tag instanceof Some) {
                if (end_tag instanceof Some) {
                  let button_class = "text-[#282828] " + section_bg_class(
                    new TagsSection(),
                    theme
                  );
                  return toList([
                    (() => {
                      let _pipe = tags;
                      return tag_select(_pipe, new Start(), start_tag, theme);
                    })(),
                    (() => {
                      let _pipe = tags;
                      return tag_select(_pipe, new End(), end_tag, theme);
                    })(),
                    button(
                      toList([
                        id("fetch-changes"),
                        class$(
                          "px-4 py-1 font-semibold disabled:bg-[#a89984] " + button_class
                        ),
                        disabled(fetching_changelog),
                        on_click(new UserRequestedChangelog())
                      ]),
                      toList([text2("fetch changes")])
                    )
                  ]);
                } else {
                  return toList([
                    (() => {
                      let _pipe = tags;
                      return tag_select(_pipe, new Start(), start_tag, theme);
                    })(),
                    (() => {
                      let _pipe = tags;
                      return tag_select(_pipe, new End(), end_tag, theme);
                    })()
                  ]);
                }
              } else {
                return toList([
                  (() => {
                    let _pipe = tags;
                    return tag_select(_pipe, new Start(), start_tag, theme);
                  })()
                ]);
              }
            })()
          )
        ]);
      }
    })()
  );
}
function changes_error_section(error, theme) {
  let _block;
  if (theme instanceof Light) {
    _block = "text-[#cc241d]";
  } else {
    _block = "text-[#fb4934]";
  }
  let error_class = _block;
  let _block$1;
  if (theme instanceof Light) {
    _block$1 = "border-[#cc241d]";
  } else {
    _block$1 = "border-[#fb4934]";
  }
  let div_class = _block$1;
  return div(
    toList([
      class$(
        "mt-4 p-2 border-2 border-opacity-75 border-dotted " + div_class
      )
    ]),
    toList([
      p(
        toList([class$(error_class)]),
        toList([
          (() => {
            let _pipe = "Error fetching changes between the tags:";
            return text2(_pipe);
          })()
        ])
      ),
      pre(
        toList([class$("mt-2 p-1 text-wrap")]),
        toList([
          text2(
            (() => {
              let _pipe = error;
              return http_error_to_string(_pipe);
            })()
          )
        ])
      )
    ])
  );
}
function filter_commit_predicate(query) {
  return (commit) => {
    return (() => {
      let _pipe = commit.details.message;
      let _pipe$1 = lowercase(_pipe);
      return contains_string(
        _pipe$1,
        (() => {
          let _pipe$2 = query;
          return lowercase(_pipe$2);
        })()
      );
    })() || (() => {
      let $ = commit.details.author;
      if ($ instanceof Some) {
        let author = $[0];
        return (() => {
          let _pipe = author.name;
          let _pipe$1 = lowercase(_pipe);
          return contains_string(
            _pipe$1,
            (() => {
              let _pipe$2 = query;
              return lowercase(_pipe$2);
            })()
          );
        })() || (() => {
          let _pipe = author.email;
          let _pipe$1 = lowercase(_pipe);
          return contains_string(
            _pipe$1,
            (() => {
              let _pipe$2 = query;
              return lowercase(_pipe$2);
            })()
          );
        })();
      } else {
        return false;
      }
    })();
  };
}
function author_color_class(maybe_author, colors, fallback) {
  if (maybe_author instanceof Some) {
    let author = maybe_author[0];
    let hash = simple_hash(author.name);
    let _block;
    let _pipe = colors;
    _block = map_size(_pipe);
    let num_colors = _block;
    let _block$1;
    let _pipe$1 = hash;
    let _pipe$2 = remainder(_pipe$1, num_colors);
    _block$1 = unwrap2(_pipe$2, 0);
    let index5 = _block$1;
    let _pipe$3 = colors;
    let _pipe$4 = map_get(_pipe$3, index5);
    return unwrap2(_pipe$4, fallback);
  } else {
    return fallback;
  }
}
function get_commit_relative_time(ts, now) {
  return (() => {
    let _pipe = difference(ts, now);
    return humanize_duration(_pipe);
  })() + " ago";
}
function commit_details(commit, author_color_class_store, theme) {
  let _block;
  if (theme instanceof Light) {
    _block = [
      "text-[#995f6a]",
      (() => {
        let _pipe2 = commit.details.author;
        return author_color_class(
          _pipe2,
          author_color_class_store,
          "text-[#941b0c]"
        );
      })(),
      "text-[#2ec0f9]"
    ];
  } else {
    _block = [
      "text-[#c77dff]",
      (() => {
        let _pipe2 = commit.details.author;
        return author_color_class(
          _pipe2,
          author_color_class_store,
          "text-[#ff9500]"
        );
      })(),
      "text-[#ff6d44]"
    ];
  }
  let $ = _block;
  let sha_class;
  let author_class;
  let timestamp_class;
  sha_class = $[0];
  author_class = $[1];
  timestamp_class = $[2];
  let _block$1;
  let $1 = (() => {
    let _pipe2 = commit.sha;
    return string_length(_pipe2);
  })();
  let n = $1;
  if (n >= 8) {
    let _pipe2 = commit.sha;
    _block$1 = slice(_pipe2, 0, 8);
  } else {
    _block$1 = commit.sha;
  }
  let commit_hash = _block$1;
  let now = system_time2();
  let _block$2;
  let _pipe = commit.details.message;
  let _pipe$1 = split2(_pipe, "\n");
  let _pipe$2 = first(_pipe$1);
  _block$2 = unwrap2(_pipe$2, " ");
  let commit_message_heading = _block$2;
  return p(
    toList([class$("flex gap-6 items-center whitespace-nowrap mt-2")]),
    toList([
      a(
        toList([href(commit.html_url), target("_blank")]),
        toList([
          span(
            toList([class$(sha_class)]),
            toList([
              (() => {
                let _pipe$3 = commit_hash;
                return text2(_pipe$3);
              })()
            ])
          )
        ])
      ),
      span(
        toList([]),
        toList([
          (() => {
            let _pipe$3 = commit_message_heading;
            return text2(_pipe$3);
          })()
        ])
      ),
      (() => {
        let _pipe$3 = commit.details.author;
        let _pipe$4 = map(
          _pipe$3,
          (author) => {
            return span(
              toList([class$(author_class)]),
              toList([
                (() => {
                  let _pipe$42 = author.name;
                  return text2(_pipe$42);
                })()
              ])
            );
          }
        );
        return unwrap(_pipe$4, none2());
      })(),
      (() => {
        let _pipe$3 = commit.details.author;
        let _pipe$4 = then$(
          _pipe$3,
          (author) => {
            let _pipe$42 = author.authoring_timestamp;
            return map(
              _pipe$42,
              (ts) => {
                return span(
                  toList([class$(timestamp_class)]),
                  toList([
                    (() => {
                      let _pipe$5 = ts;
                      let _pipe$6 = get_commit_relative_time(_pipe$5, now);
                      return text2(_pipe$6);
                    })()
                  ])
                );
              }
            );
          }
        );
        return unwrap(_pipe$4, none2());
      })()
    ])
  );
}
function commits_section(commits, commits_filter_query, start_tag, end_tag, author_color_class_store, theme) {
  let $ = (() => {
    let _pipe = commits;
    return length(_pipe);
  })();
  if ($ === 0) {
    return none2();
  } else {
    return div(
      toList([
        class$(
          "mt-4 p-4 border-2 border-[#a594f9] border-opacity-50 border-dotted"
        ),
        id(
          (() => {
            let _pipe = new CommitsSection();
            return section_id(_pipe);
          })()
        )
      ]),
      toList([
        p(
          toList([
            class$("text-xl"),
            id(
              (() => {
                let _pipe = new CommitsSection();
                return section_heading_id(_pipe);
              })()
            )
          ]),
          toList([
            (() => {
              let _pipe = "commits " + start_tag + "..." + end_tag;
              return text2(_pipe);
            })()
          ])
        ),
        input(
          toList([
            class$(
              "mt-4 font-semibold h-8 text-[#232634] placeholder-[#3d3d3d] pl-2 max-sm:w-full w-1/3 " + section_bg_class(
                new CommitsSection(),
                theme
              )
            ),
            autocomplete("off"),
            id("filter-commits"),
            type_("text"),
            placeholder("filter commits"),
            value(
              (() => {
                let _pipe = commits_filter_query;
                return unwrap(_pipe, "");
              })()
            ),
            on_input(
              (var0) => {
                return new UserEnteredCommitsFilterQuery(var0);
              }
            )
          ])
        ),
        div(
          toList([class$("mt-4 overflow-x-auto max-sm:text-xs")]),
          (() => {
            let _block;
            if (commits_filter_query instanceof Some) {
              let q = commits_filter_query[0];
              let _pipe2 = commits;
              _block = filter(_pipe2, filter_commit_predicate(q));
            } else {
              _block = commits;
            }
            let _pipe = _block;
            return map2(
              _pipe,
              (commit) => {
                return commit_details(commit, author_color_class_store, theme);
              }
            );
          })()
        )
      ])
    );
  }
}
function scrollbar_color(theme) {
  if (theme instanceof Light) {
    return "#a594f940 #ffffff";
  } else {
    return "#a594f940 #282828";
  }
}
function repo_selection_section(repos, maybe_filter_query, maybe_selected_repo, theme) {
  let _block;
  let _pipe = new ReposSection();
  _block = section_bg_class(_pipe, theme);
  let filter_class = _block;
  return div(
    toList([
      class$(
        "mt-4 p-4 border-2 border-[#a594f9] border-opacity-50 border-dotted"
      ),
      id(
        (() => {
          let _pipe$1 = new ReposSection();
          return section_id(_pipe$1);
        })()
      )
    ]),
    toList([
      p(
        toList([
          class$("text-xl"),
          id(
            (() => {
              let _pipe$1 = new ReposSection();
              return section_heading_id(_pipe$1);
            })()
          )
        ]),
        toList([
          (() => {
            let _pipe$1 = "repos";
            return text2(_pipe$1);
          })()
        ])
      ),
      input(
        toList([
          class$(
            "mt-4 font-semibold h-8 text-[#282828] placeholder-[#3d3d3d] pl-2\n          max-sm:w-full w-1/3 " + filter_class
          ),
          autocomplete("off"),
          id("filter-repos"),
          type_("text"),
          placeholder("filter repos"),
          value(
            (() => {
              let _pipe$1 = maybe_filter_query;
              return unwrap(_pipe$1, "");
            })()
          ),
          on_input(
            (var0) => {
              return new UserEnteredRepoFilterQuery(var0);
            }
          )
        ])
      ),
      div(
        toList([
          class$("flex-wrap mt-2 overflow-y-scroll max-h-60"),
          styles(
            toList([
              [
                "scrollbar-color",
                (() => {
                  let _pipe$1 = theme;
                  return scrollbar_color(_pipe$1);
                })()
              ],
              ["scrollbar-width", "thin"]
            ])
          )
        ]),
        (() => {
          let _block$1;
          if (maybe_filter_query instanceof Some) {
            let filter_query = maybe_filter_query[0];
            let _pipe$12 = repos;
            _block$1 = filter(
              _pipe$12,
              (repo) => {
                let _pipe$22 = repo.name;
                let _pipe$3 = lowercase(_pipe$22);
                return contains_string(
                  _pipe$3,
                  (() => {
                    let _pipe$4 = filter_query;
                    return lowercase(_pipe$4);
                  })()
                );
              }
            );
          } else {
            _block$1 = repos;
          }
          let _pipe$1 = _block$1;
          let _pipe$2 = sort(
            _pipe$1,
            (a2, b) => {
              return compare3(a2.name, b.name);
            }
          );
          return map2(
            _pipe$2,
            (repo) => {
              return repo_select_button(
                repo,
                (() => {
                  let _pipe$3 = maybe_selected_repo;
                  let _pipe$4 = map(
                    _pipe$3,
                    (r) => {
                      return r === repo.name;
                    }
                  );
                  return unwrap(_pipe$4, false);
                })(),
                theme
              );
            }
          );
        })()
      )
    ])
  );
}
function filter_file_predicate(query) {
  return (file) => {
    let _pipe = file.file_name;
    let _pipe$1 = lowercase(_pipe);
    return contains_string(
      _pipe$1,
      (() => {
        let _pipe$2 = query;
        return lowercase(_pipe$2);
      })()
    );
  };
}
function file_status(status, theme) {
  let _block;
  if (theme instanceof Light) {
    if (status instanceof Added) {
      _block = "bg-[#a3f0b9]";
    } else if (status instanceof Removed) {
      _block = "bg-[#ff8ea2]";
    } else if (status instanceof Modified) {
      _block = "bg-[#ffe17f]";
    } else if (status instanceof Renamed) {
      _block = "bg-[#ebcacb]";
    } else if (status instanceof Copied) {
      _block = "bg-[#def7e7]";
    } else if (status instanceof Changed) {
      _block = "bg-[#fdc9c6]";
    } else {
      _block = "bg-[#efe8f7]";
    }
  } else {
    if (status instanceof Added) {
      _block = "bg-[#7cea9c]";
    } else if (status instanceof Removed) {
      _block = "bg-[#ff4365]";
    } else if (status instanceof Modified) {
      _block = "bg-[#ffc300]";
    } else if (status instanceof Renamed) {
      _block = "bg-[#dfa8a9]";
    } else if (status instanceof Copied) {
      _block = "bg-[#d0f4de]";
    } else if (status instanceof Changed) {
      _block = "bg-[#fdb3ae]";
    } else {
      _block = "bg-[#e5d9f2]";
    }
  }
  let class$2 = _block;
  return span(
    toList([
      class$(
        "px-2 py-1 text-[#282828] text-xs font-semibold " + class$2
      )
    ]),
    toList([
      (() => {
        let _pipe = status;
        let _pipe$1 = file_status_to_string(_pipe);
        return text2(_pipe$1);
      })()
    ])
  );
}
function file_change_stats(additions, deletions, theme) {
  let _block;
  if (additions === 0) {
    _block = "";
  } else {
    let n = additions;
    _block = "+" + (() => {
      let _pipe = n;
      return to_string(_pipe);
    })();
  }
  let additions_text = _block;
  let _block$1;
  if (deletions === 0) {
    _block$1 = "";
  } else {
    let n = deletions;
    _block$1 = "-" + (() => {
      let _pipe = n;
      return to_string(_pipe);
    })();
  }
  let deletions_text = _block$1;
  let _block$2;
  if (theme instanceof Light) {
    _block$2 = ["text-[#068360]", "text-[#cc3550]"];
  } else {
    _block$2 = ["text-[#affc41]", "text-[#ff4365]"];
  }
  let $ = _block$2;
  let additions_class;
  let deletions_class;
  additions_class = $[0];
  deletions_class = $[1];
  return div(
    toList([class$("flex gap-2")]),
    toList([
      span(
        toList([
          class$(
            "px-2 py-1 max-sm:text-xs text-sm font-semibold max-sm:w-8 w-16 " + additions_class
          )
        ]),
        toList([
          (() => {
            let _pipe = additions_text;
            return text2(_pipe);
          })()
        ])
      ),
      span(
        toList([
          class$(
            "px-2 py-1 max-sm:text-xs text-sm font-semibold max-sm:w-8 w-16 " + deletions_class
          )
        ]),
        toList([
          (() => {
            let _pipe = deletions_text;
            return text2(_pipe);
          })()
        ])
      )
    ])
  );
}
function file_details(file, theme) {
  return p(
    toList([class$("flex gap-4 items-center whitespace-nowrap mt-2")]),
    toList([
      (() => {
        let _pipe = file.status;
        return file_status(_pipe, theme);
      })(),
      file_change_stats(file.additions, file.deletions, theme),
      a(
        toList([href(file.blob_url), target("_blank")]),
        toList([
          span(
            toList([]),
            toList([
              (() => {
                let _pipe = file.file_name;
                return text2(_pipe);
              })()
            ])
          )
        ])
      )
    ])
  );
}
function files_section(maybe_files, files_filter_query, theme) {
  if (maybe_files instanceof Some) {
    let $ = maybe_files[0];
    if ($ instanceof Empty) {
      return none2();
    } else {
      let files = $;
      return div(
        toList([
          class$(
            "mt-4 p-4 border-2 border-[#a594f9] border-opacity-50 border-dotted"
          ),
          styles(
            toList([
              [
                "scrollbar-color",
                (() => {
                  let _pipe = theme;
                  return scrollbar_color(_pipe);
                })()
              ],
              ["scrollbar-width", "thin"]
            ])
          ),
          id(
            (() => {
              let _pipe = new FilesSection();
              return section_id(_pipe);
            })()
          )
        ]),
        toList([
          p(
            toList([
              class$("text-xl"),
              id(
                (() => {
                  let _pipe = new FilesSection();
                  return section_heading_id(_pipe);
                })()
              )
            ]),
            toList([
              (() => {
                let _pipe = "files";
                return text2(_pipe);
              })()
            ])
          ),
          input(
            toList([
              class$(
                "mt-4 font-semibold h-8 text-[#282828] placeholder-[#3d3d3d] pl-2 max-sm:w-full w-1/3 " + section_bg_class(
                  new FilesSection(),
                  theme
                )
              ),
              autocomplete("off"),
              id("filter-files"),
              type_("text"),
              placeholder("filter files"),
              value(
                (() => {
                  let _pipe = files_filter_query;
                  return unwrap(_pipe, "");
                })()
              ),
              on_input(
                (var0) => {
                  return new UserEnteredFilesFilterQuery(var0);
                }
              )
            ])
          ),
          div(
            toList([class$("mt-4 overflow-x-auto max-sm:text-xs")]),
            (() => {
              let _block;
              if (files_filter_query instanceof Some) {
                let q = files_filter_query[0];
                let _pipe2 = files;
                _block = filter(_pipe2, filter_file_predicate(q));
              } else {
                _block = files;
              }
              let _pipe = _block;
              return map2(
                _pipe,
                (file) => {
                  return file_details(file, theme);
                }
              );
            })()
          )
        ])
      );
    }
  } else {
    return none2();
  }
}
function main_section(model) {
  let theme = model.config.theme;
  return div(
    toList([
      class$("flex-1 overflow-y-scroll pt-8 px-4"),
      styles(
        toList([
          [
            "scrollbar-color",
            (() => {
              let _pipe = theme;
              return scrollbar_color(_pipe);
            })()
          ],
          ["scrollbar-width", "thin"]
        ])
      )
    ]),
    (() => {
      let $ = model.state;
      if ($ instanceof Initial) {
        return toList([
          (() => {
            let _pipe = theme;
            return heading(_pipe);
          })()
        ]);
      } else if ($ instanceof ConfigError) {
        let error = $.error;
        return toList([
          (() => {
            let _pipe = theme;
            return heading(_pipe);
          })(),
          (() => {
            let _pipe = error;
            return config_error_section(_pipe, theme);
          })()
        ]);
      } else if ($ instanceof ConfigLoaded) {
        let maybe_user_name = $.user_name;
        let owner_type = $.owner_type;
        let fetching_repos = $.fetching_repos;
        return toList([
          (() => {
            let _pipe = theme;
            return heading(_pipe);
          })(),
          owner_selection_section(
            maybe_user_name,
            owner_type,
            fetching_repos,
            theme
          ),
          (() => {
            let _pipe = fetching_repos;
            return fetching_repos_section(_pipe);
          })()
        ]);
      } else if ($ instanceof WithReposError) {
        let user_name = $.user_name;
        let owner_type = $.owner_type;
        let error = $.error;
        return toList([
          (() => {
            let _pipe = theme;
            return heading(_pipe);
          })(),
          owner_selection_section(
            (() => {
              let _pipe = user_name;
              return new Some(_pipe);
            })(),
            owner_type,
            false,
            theme
          ),
          (() => {
            let _pipe = error;
            return repos_error_section(_pipe, owner_type, theme);
          })()
        ]);
      } else if ($ instanceof WithRepos) {
        let user_name = $.user_name;
        let owner_type = $.owner_type;
        let repos = $.repos;
        let repo_filter_query = $.repo_filter_query;
        let fetching_tags = $.fetching_tags;
        let maybe_selected_repo = $.selected_repo;
        return toList([
          (() => {
            let _pipe = theme;
            return heading(_pipe);
          })(),
          owner_selection_section(
            (() => {
              let _pipe = user_name;
              return new Some(_pipe);
            })(),
            owner_type,
            false,
            theme
          ),
          repo_selection_section(
            repos,
            repo_filter_query,
            maybe_selected_repo,
            theme
          ),
          (() => {
            let _pipe = fetching_tags;
            return fetching_tags_section(_pipe);
          })()
        ]);
      } else if ($ instanceof WithTagsError) {
        let user_name = $.user_name;
        let owner_type = $.owner_type;
        let repos = $.repos;
        let repo_filter_query = $.repo_filter_query;
        let selected_repo = $.repo;
        let error = $.error;
        return toList([
          (() => {
            let _pipe = theme;
            return heading(_pipe);
          })(),
          owner_selection_section(
            (() => {
              let _pipe = user_name;
              return new Some(_pipe);
            })(),
            owner_type,
            false,
            theme
          ),
          repo_selection_section(
            repos,
            repo_filter_query,
            (() => {
              let _pipe = selected_repo;
              return new Some(_pipe);
            })(),
            theme
          ),
          (() => {
            let _pipe = error;
            return tags_error_section(_pipe, theme);
          })()
        ]);
      } else if ($ instanceof WithTags) {
        let user_name = $.user_name;
        let owner_type = $.owner_type;
        let repos = $.repos;
        let repo_filter_query = $.repo_filter_query;
        let selected_repo = $.repo;
        let tags = $.tags;
        let start_tag = $.start_tag;
        let end_tag = $.end_tag;
        let fetching_changelog = $.fetching_changes;
        return toList([
          (() => {
            let _pipe = theme;
            return heading(_pipe);
          })(),
          owner_selection_section(
            (() => {
              let _pipe = user_name;
              return new Some(_pipe);
            })(),
            owner_type,
            false,
            theme
          ),
          repo_selection_section(
            repos,
            repo_filter_query,
            (() => {
              let _pipe = selected_repo;
              return new Some(_pipe);
            })(),
            theme
          ),
          tags_select_section(
            tags,
            start_tag,
            end_tag,
            fetching_changelog,
            theme
          )
        ]);
      } else if ($ instanceof WithChangesError) {
        let user_name = $.user_name;
        let owner_type = $.owner_type;
        let repos = $.repos;
        let repo_filter_query = $.repo_filter_query;
        let selected_repo = $.repo;
        let tags = $.tags;
        let start_tag = $.start_tag;
        let end_tag = $.end_tag;
        let error = $.error;
        return toList([
          (() => {
            let _pipe = theme;
            return heading(_pipe);
          })(),
          owner_selection_section(
            (() => {
              let _pipe = user_name;
              return new Some(_pipe);
            })(),
            owner_type,
            false,
            theme
          ),
          repo_selection_section(
            repos,
            repo_filter_query,
            (() => {
              let _pipe = selected_repo;
              return new Some(_pipe);
            })(),
            theme
          ),
          tags_select_section(
            tags,
            (() => {
              let _pipe = start_tag;
              return new Some(_pipe);
            })(),
            (() => {
              let _pipe = end_tag;
              return new Some(_pipe);
            })(),
            false,
            theme
          ),
          (() => {
            let _pipe = error;
            return changes_error_section(_pipe, theme);
          })()
        ]);
      } else {
        let user_name = $.user_name;
        let owner_type = $.owner_type;
        let repos = $.repos;
        let repo_filter_query = $.repo_filter_query;
        let selected_repo = $.repo;
        let tags = $.tags;
        let start_tag = $.start_tag;
        let end_tag = $.end_tag;
        let changes = $.changes;
        let commits_filter = $.commits_filter;
        let files_filter = $.files_filter;
        return toList([
          (() => {
            let _pipe = theme;
            return heading(_pipe);
          })(),
          owner_selection_section(
            (() => {
              let _pipe = user_name;
              return new Some(_pipe);
            })(),
            owner_type,
            false,
            theme
          ),
          repo_selection_section(
            repos,
            repo_filter_query,
            (() => {
              let _pipe = selected_repo;
              return new Some(_pipe);
            })(),
            theme
          ),
          tags_select_section(
            tags,
            (() => {
              let _pipe = start_tag;
              return new Some(_pipe);
            })(),
            (() => {
              let _pipe = end_tag;
              return new Some(_pipe);
            })(),
            false,
            theme
          ),
          (() => {
            let _pipe = changes.commits;
            return commits_section(
              _pipe,
              commits_filter,
              start_tag,
              end_tag,
              (() => {
                if (theme instanceof Light) {
                  return model.author_color_classes.light;
                } else {
                  return model.author_color_classes.dark;
                }
              })(),
              theme
            );
          })(),
          (() => {
            let _pipe = changes.files;
            return files_section(_pipe, files_filter, theme);
          })()
        ]);
      }
    })()
  );
}
function navigation_button(section, theme, enabled) {
  return button(
    toList([
      class$(
        section_bg_class(section, theme) + " disabled:bg-[#a89984] px-2 py-1"
      ),
      disabled(!enabled),
      on_click(new UserRequestedToGoToSection(section))
    ]),
    toList([
      (() => {
        let _pipe = section;
        let _pipe$1 = section_to_string(_pipe);
        return text2(_pipe$1);
      })()
    ])
  );
}
function navigation_bar(state, theme) {
  let _block;
  if (state instanceof Initial) {
    _block = [false, false, false, false, false];
  } else if (state instanceof ConfigError) {
    _block = [false, false, false, false, false];
  } else if (state instanceof ConfigLoaded) {
    _block = [true, false, false, false, false];
  } else if (state instanceof WithReposError) {
    _block = [true, false, false, false, false];
  } else if (state instanceof WithRepos) {
    _block = [true, true, false, false, false];
  } else if (state instanceof WithTagsError) {
    _block = [true, true, false, false, false];
  } else if (state instanceof WithTags) {
    _block = [true, true, true, false, false];
  } else if (state instanceof WithChangesError) {
    _block = [true, true, true, false, false];
  } else {
    let changes = state.changes;
    let $1 = changes.commits;
    let $2 = changes.files;
    if ($2 instanceof Some) {
      let $3 = $2[0];
      if ($3 instanceof Empty) {
        if ($1 instanceof Empty) {
          _block = [true, true, true, false, false];
        } else {
          _block = [true, true, true, true, false];
        }
      } else if ($1 instanceof Empty) {
        _block = [true, true, true, false, true];
      } else {
        _block = [true, true, true, true, true];
      }
    } else if ($1 instanceof Empty) {
      _block = [true, true, true, false, false];
    } else {
      _block = [true, true, true, true, false];
    }
  }
  let $ = _block;
  let o;
  let r;
  let t;
  let c;
  let f;
  o = $[0];
  r = $[1];
  t = $[2];
  c = $[3];
  f = $[4];
  let _block$1;
  if (theme instanceof Light) {
    _block$1 = "bg-[#ffffff]";
  } else {
    _block$1 = "bg-[#282828]";
  }
  let footer_class = _block$1;
  return nav(
    toList([
      class$(
        "flex px-4 pt-4 font-semibold text-[#282828] max-sm:hidden " + footer_class
      )
    ]),
    toList([
      div(
        toList([class$("flex gap-2")]),
        (() => {
          let _pipe = toList([
            [new OwnerSection(), o],
            [new ReposSection(), r],
            [new TagsSection(), t],
            [new CommitsSection(), c],
            [new FilesSection(), f]
          ]);
          return map2(
            _pipe,
            (data) => {
              let section;
              let enabled;
              section = data[0];
              enabled = data[1];
              return navigation_button(section, theme, enabled);
            }
          );
        })()
      )
    ])
  );
}
function view(model) {
  return div(
    toList([
      class$(
        (() => {
          let _pipe = model.config.theme;
          return main_div_class(_pipe);
        })()
      )
    ]),
    toList([
      div(
        toList([
          class$("flex flex-col h-screen sm:w-full md:w-4/5 mx-auto")
        ]),
        toList([
          (() => {
            let _pipe = model;
            return debug_section(_pipe);
          })(),
          (() => {
            let _pipe = model;
            return main_section(_pipe);
          })(),
          (() => {
            let _pipe = model.state;
            return navigation_bar(_pipe, model.config.theme);
          })()
        ])
      )
    ])
  );
}

// build/dev/javascript/ghx/ghx.mjs
var FILEPATH = "src/ghx.gleam";
function init(_) {
  let _block;
  let $ = public$;
  if ($) {
    _block = none();
  } else {
    _block = fetch_initial_config();
  }
  let init_effect = _block;
  return [init_model(), init_effect];
}
function main() {
  let app = application(init, update2, view);
  let $ = start3(app, "#app", void 0);
  if (!($ instanceof Ok)) {
    throw makeError(
      "let_assert",
      FILEPATH,
      "ghx",
      11,
      "main",
      "Pattern match failed, no pattern matched the value.",
      { value: $, start: 243, end: 292, pattern_start: 254, pattern_end: 259 }
    );
  }
  return $;
}

// build/.lustre/entry.mjs
main();
