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
function prepend(element2, tail) {
  return new NonEmpty(element2, tail);
}
function toList(elements2, tail) {
  return List.fromArray(elements2, tail);
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
  constructor(value4) {
    this.value = value4;
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
function bitArraySlice(bitArray, start3, end) {
  end ??= bitArray.bitSize;
  bitArrayValidateRange(bitArray, start3, end);
  if (start3 === end) {
    return new BitArray(new Uint8Array());
  }
  if (start3 === 0 && end === bitArray.bitSize) {
    return bitArray;
  }
  start3 += bitArray.bitOffset;
  end += bitArray.bitOffset;
  const startByteIndex = Math.trunc(start3 / 8);
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
  return new BitArray(buffer, end - start3, start3 % 8);
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
  function appendUnalignedBits(unalignedBits, size, offset) {
    if (size === 0) {
      return;
    }
    const byteSize = Math.trunc(size + 7 / 8);
    const highBitsCount = cursor % 8;
    const lowBitsCount = 8 - highBitsCount;
    let byteIndex = Math.trunc(cursor / 8);
    for (let i = 0; i < byteSize; i++) {
      let byte = bitArrayByteAt(unalignedBits, offset, i);
      if (size < 8) {
        byte >>= 8 - size;
        byte <<= 8 - size;
      }
      buffer[byteIndex] |= byte >> highBitsCount;
      let appendedBitsCount = size - Math.max(0, size - lowBitsCount);
      size -= appendedBitsCount;
      cursor += appendedBitsCount;
      if (size === 0) {
        break;
      }
      buffer[++byteIndex] = byte << lowBitsCount;
      appendedBitsCount = size - Math.max(0, size - highBitsCount);
      size -= appendedBitsCount;
      cursor += appendedBitsCount;
    }
  }
  return new BitArray(buffer, bitSize);
}
function bitArrayValidateRange(bitArray, start3, end) {
  if (start3 < 0 || start3 > bitArray.bitSize || end < start3 || end > bitArray.bitSize) {
    const msg = `Invalid bit array slice: start = ${start3}, end = ${end}, bit size = ${bitArray.bitSize}`;
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
  constructor(value4) {
    super();
    this[0] = value4;
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
  let values2 = [x, y];
  while (values2.length) {
    let a2 = values2.pop();
    let b = values2.pop();
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
    let [keys2, get2] = getters(a2);
    for (let k of keys2(a2)) {
      values2.push(get2(a2, k), get2(b, k));
    }
  }
  return true;
}
function getters(object3) {
  if (object3 instanceof Map) {
    return [(x) => x.keys(), (x, y) => x.get(y)];
  } else {
    let extra = object3 instanceof globalThis.Error ? ["message"] : [];
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
function makeError(variant, module, line, fn, message, extra) {
  let error = new globalThis.Error(message);
  error.gleam_error = variant;
  error.module = module;
  error.line = line;
  error.function = fn;
  error.fn = fn;
  for (let k in extra) error[k] = extra[k];
  return error;
}

// build/dev/javascript/gleam_stdlib/gleam/order.mjs
var Lt = class extends CustomType {
};
var Eq = class extends CustomType {
};
var Gt = class extends CustomType {
};

// build/dev/javascript/gleam_stdlib/gleam/option.mjs
var Some = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
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
    return new None();
  }
}
function or(first3, second) {
  if (first3 instanceof Some) {
    return first3;
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
function assoc(root, shift, hash, key2, val, addedLeaf) {
  switch (root.type) {
    case ARRAY_NODE:
      return assocArray(root, shift, hash, key2, val, addedLeaf);
    case INDEX_NODE:
      return assocIndex(root, shift, hash, key2, val, addedLeaf);
    case COLLISION_NODE:
      return assocCollision(root, shift, hash, key2, val, addedLeaf);
  }
}
function assocArray(root, shift, hash, key2, val, addedLeaf) {
  const idx = mask(hash, shift);
  const node = root.array[idx];
  if (node === void 0) {
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root.size + 1,
      array: cloneAndSet(root.array, idx, { type: ENTRY, k: key2, v: val })
    };
  }
  if (node.type === ENTRY) {
    if (isEqual(key2, node.k)) {
      if (val === node.v) {
        return root;
      }
      return {
        type: ARRAY_NODE,
        size: root.size,
        array: cloneAndSet(root.array, idx, {
          type: ENTRY,
          k: key2,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root.size,
      array: cloneAndSet(
        root.array,
        idx,
        createNode(shift + SHIFT, node.k, node.v, hash, key2, val)
      )
    };
  }
  const n = assoc(node, shift + SHIFT, hash, key2, val, addedLeaf);
  if (n === node) {
    return root;
  }
  return {
    type: ARRAY_NODE,
    size: root.size,
    array: cloneAndSet(root.array, idx, n)
  };
}
function assocIndex(root, shift, hash, key2, val, addedLeaf) {
  const bit = bitpos(hash, shift);
  const idx = index(root.bitmap, bit);
  if ((root.bitmap & bit) !== 0) {
    const node = root.array[idx];
    if (node.type !== ENTRY) {
      const n = assoc(node, shift + SHIFT, hash, key2, val, addedLeaf);
      if (n === node) {
        return root;
      }
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, n)
      };
    }
    const nodeKey = node.k;
    if (isEqual(key2, nodeKey)) {
      if (val === node.v) {
        return root;
      }
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, {
          type: ENTRY,
          k: key2,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: INDEX_NODE,
      bitmap: root.bitmap,
      array: cloneAndSet(
        root.array,
        idx,
        createNode(shift + SHIFT, nodeKey, node.v, hash, key2, val)
      )
    };
  } else {
    const n = root.array.length;
    if (n >= MAX_INDEX_NODE) {
      const nodes = new Array(32);
      const jdx = mask(hash, shift);
      nodes[jdx] = assocIndex(EMPTY, shift + SHIFT, hash, key2, val, addedLeaf);
      let j = 0;
      let bitmap = root.bitmap;
      for (let i = 0; i < 32; i++) {
        if ((bitmap & 1) !== 0) {
          const node = root.array[j++];
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
      const newArray = spliceIn(root.array, idx, {
        type: ENTRY,
        k: key2,
        v: val
      });
      addedLeaf.val = true;
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap | bit,
        array: newArray
      };
    }
  }
}
function assocCollision(root, shift, hash, key2, val, addedLeaf) {
  if (hash === root.hash) {
    const idx = collisionIndexOf(root, key2);
    if (idx !== -1) {
      const entry = root.array[idx];
      if (entry.v === val) {
        return root;
      }
      return {
        type: COLLISION_NODE,
        hash,
        array: cloneAndSet(root.array, idx, { type: ENTRY, k: key2, v: val })
      };
    }
    const size = root.array.length;
    addedLeaf.val = true;
    return {
      type: COLLISION_NODE,
      hash,
      array: cloneAndSet(root.array, size, { type: ENTRY, k: key2, v: val })
    };
  }
  return assoc(
    {
      type: INDEX_NODE,
      bitmap: bitpos(root.hash, shift),
      array: [root]
    },
    shift,
    hash,
    key2,
    val,
    addedLeaf
  );
}
function collisionIndexOf(root, key2) {
  const size = root.array.length;
  for (let i = 0; i < size; i++) {
    if (isEqual(key2, root.array[i].k)) {
      return i;
    }
  }
  return -1;
}
function find(root, shift, hash, key2) {
  switch (root.type) {
    case ARRAY_NODE:
      return findArray(root, shift, hash, key2);
    case INDEX_NODE:
      return findIndex(root, shift, hash, key2);
    case COLLISION_NODE:
      return findCollision(root, key2);
  }
}
function findArray(root, shift, hash, key2) {
  const idx = mask(hash, shift);
  const node = root.array[idx];
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
function findIndex(root, shift, hash, key2) {
  const bit = bitpos(hash, shift);
  if ((root.bitmap & bit) === 0) {
    return void 0;
  }
  const idx = index(root.bitmap, bit);
  const node = root.array[idx];
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key2);
  }
  if (isEqual(key2, node.k)) {
    return node;
  }
  return void 0;
}
function findCollision(root, key2) {
  const idx = collisionIndexOf(root, key2);
  if (idx < 0) {
    return void 0;
  }
  return root.array[idx];
}
function without(root, shift, hash, key2) {
  switch (root.type) {
    case ARRAY_NODE:
      return withoutArray(root, shift, hash, key2);
    case INDEX_NODE:
      return withoutIndex(root, shift, hash, key2);
    case COLLISION_NODE:
      return withoutCollision(root, key2);
  }
}
function withoutArray(root, shift, hash, key2) {
  const idx = mask(hash, shift);
  const node = root.array[idx];
  if (node === void 0) {
    return root;
  }
  let n = void 0;
  if (node.type === ENTRY) {
    if (!isEqual(node.k, key2)) {
      return root;
    }
  } else {
    n = without(node, shift + SHIFT, hash, key2);
    if (n === node) {
      return root;
    }
  }
  if (n === void 0) {
    if (root.size <= MIN_ARRAY_NODE) {
      const arr = root.array;
      const out = new Array(root.size - 1);
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
      size: root.size - 1,
      array: cloneAndSet(root.array, idx, n)
    };
  }
  return {
    type: ARRAY_NODE,
    size: root.size,
    array: cloneAndSet(root.array, idx, n)
  };
}
function withoutIndex(root, shift, hash, key2) {
  const bit = bitpos(hash, shift);
  if ((root.bitmap & bit) === 0) {
    return root;
  }
  const idx = index(root.bitmap, bit);
  const node = root.array[idx];
  if (node.type !== ENTRY) {
    const n = without(node, shift + SHIFT, hash, key2);
    if (n === node) {
      return root;
    }
    if (n !== void 0) {
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, n)
      };
    }
    if (root.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root.bitmap ^ bit,
      array: spliceOut(root.array, idx)
    };
  }
  if (isEqual(key2, node.k)) {
    if (root.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root.bitmap ^ bit,
      array: spliceOut(root.array, idx)
    };
  }
  return root;
}
function withoutCollision(root, key2) {
  const idx = collisionIndexOf(root, key2);
  if (idx < 0) {
    return root;
  }
  if (root.array.length === 1) {
    return void 0;
  }
  return {
    type: COLLISION_NODE,
    hash: root.hash,
    array: spliceOut(root.array, idx)
  };
}
function forEach(root, fn) {
  if (root === void 0) {
    return;
  }
  const items = root.array;
  const size = items.length;
  for (let i = 0; i < size; i++) {
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
  constructor(root, size) {
    this.root = root;
    this.size = size;
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
    const root = this.root === void 0 ? EMPTY : this.root;
    const newRoot = assoc(root, 0, getHash(key2), key2, val, addedLeaf);
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

// build/dev/javascript/gleam_stdlib/gleam_stdlib.mjs
var Nil = void 0;
var NOT_FOUND = {};
function identity(x) {
  return x;
}
function to_string(term) {
  return term.toString();
}
function float_to_string(float4) {
  const string6 = float4.toString().replace("+", "");
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
function pop_grapheme(string6) {
  let first3;
  const iterator = graphemes_iterator(string6);
  if (iterator) {
    first3 = iterator.next().value?.segment;
  } else {
    first3 = string6.match(/./su)?.[0];
  }
  if (first3) {
    return new Ok([first3, string6.slice(first3.length)]);
  } else {
    return new Error(Nil);
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
function concat(xs) {
  let result = "";
  for (const x of xs) {
    result = result + x;
  }
  return result;
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
function round(float4) {
  return Math.round(float4);
}
function codepoint(int4) {
  return new UtfCodepoint(int4);
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
function map_size(map7) {
  return map7.size;
}
function map_to_list(map7) {
  return List.fromArray(map7.entries());
}
function map_get(map7, key2) {
  const value4 = map7.get(key2, NOT_FOUND);
  if (value4 === NOT_FOUND) {
    return new Error(Nil);
  }
  return new Ok(value4);
}
function map_insert(key2, value4, map7) {
  return map7.set(key2, value4);
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
    return `Tuple of ${data.length} elements`;
  } else if (typeof data === "number") {
    return "Float";
  } else if (data === null) {
    return "Null";
  } else if (data === void 0) {
    return "Nil";
  } else {
    const type = typeof data;
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
}
function decoder_error(expected, got) {
  return decoder_error_no_classify(expected, classify_dynamic(got));
}
function decoder_error_no_classify(expected, got) {
  return new Error(
    List.fromArray([new DecodeError(expected, got, List.fromArray([]))])
  );
}
function decode_string(data) {
  return typeof data === "string" ? new Ok(data) : decoder_error("String", data);
}
function decode_int(data) {
  return Number.isInteger(data) ? new Ok(data) : decoder_error("Int", data);
}
function decode_bool(data) {
  return typeof data === "boolean" ? new Ok(data) : decoder_error("Bool", data);
}
function decode_field(value4, name2) {
  const not_a_map_error = () => decoder_error("Dict", value4);
  if (value4 instanceof Dict || value4 instanceof WeakMap || value4 instanceof Map) {
    const entry = map_get(value4, name2);
    return new Ok(entry.isOk() ? new Some(entry[0]) : new None());
  } else if (value4 === null) {
    return not_a_map_error();
  } else if (Object.getPrototypeOf(value4) == Object.prototype) {
    return try_get_field(value4, name2, () => new Ok(new None()));
  } else {
    return try_get_field(value4, name2, not_a_map_error);
  }
}
function try_get_field(value4, field3, or_else) {
  try {
    return field3 in value4 ? new Ok(new Some(value4[field3])) : or_else();
  } catch {
    return or_else();
  }
}
function inspect(v) {
  const t = typeof v;
  if (v === true) return "True";
  if (v === false) return "False";
  if (v === null) return "//js(null)";
  if (v === void 0) return "Nil";
  if (t === "string") return inspectString(v);
  if (t === "bigint" || Number.isInteger(v)) return v.toString();
  if (t === "number") return float_to_string(v);
  if (Array.isArray(v)) return `#(${v.map(inspect).join(", ")})`;
  if (v instanceof List) return inspectList(v);
  if (v instanceof UtfCodepoint) return inspectUtfCodepoint(v);
  if (v instanceof BitArray) return `<<${bit_array_inspect(v, "")}>>`;
  if (v instanceof CustomType) return inspectCustomType(v);
  if (v instanceof Dict) return inspectDict(v);
  if (v instanceof Set) return `//js(Set(${[...v].map(inspect).join(", ")}))`;
  if (v instanceof RegExp) return `//js(${v})`;
  if (v instanceof Date) return `//js(Date("${v.toISOString()}"))`;
  if (v instanceof Function) {
    const args = [];
    for (const i of Array(v.length).keys())
      args.push(String.fromCharCode(i + 97));
    return `//fn(${args.join(", ")}) { ... }`;
  }
  return inspectObject(v);
}
function inspectString(str) {
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
function inspectDict(map7) {
  let body2 = "dict.from_list([";
  let first3 = true;
  map7.forEach((value4, key2) => {
    if (!first3) body2 = body2 + ", ";
    body2 = body2 + "#(" + inspect(key2) + ", " + inspect(value4) + ")";
    first3 = false;
  });
  return body2 + "])";
}
function inspectObject(v) {
  const name2 = Object.getPrototypeOf(v)?.constructor?.name || "Object";
  const props = [];
  for (const k of Object.keys(v)) {
    props.push(`${inspect(k)}: ${inspect(v[k])}`);
  }
  const body2 = props.length ? " " + props.join(", ") + " " : "";
  const head2 = name2 === "Object" ? "" : name2 + " ";
  return `//js(${head2}{${body2}})`;
}
function inspectCustomType(record) {
  const props = Object.keys(record).map((label2) => {
    const value4 = inspect(record[label2]);
    return isNaN(parseInt(label2)) ? `${label2}: ${value4}` : value4;
  }).join(", ");
  return props ? `${record.constructor.name}(${props})` : record.constructor.name;
}
function inspectList(list3) {
  return `[${list3.toArray().map(inspect).join(", ")}]`;
}
function inspectUtfCodepoint(codepoint2) {
  return `//utfcodepoint(${String.fromCodePoint(codepoint2.value)})`;
}
function bit_array_inspect(bits, acc) {
  if (bits.bitSize === 0) {
    return acc;
  }
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
  return acc;
}

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

// build/dev/javascript/gleam_stdlib/gleam/dict.mjs
function insert(dict2, key2, value4) {
  return map_insert(key2, value4, dict2);
}
function from_list_loop(loop$list, loop$initial) {
  while (true) {
    let list3 = loop$list;
    let initial = loop$initial;
    if (list3.hasLength(0)) {
      return initial;
    } else {
      let key2 = list3.head[0];
      let value4 = list3.head[1];
      let rest = list3.tail;
      loop$list = rest;
      loop$initial = insert(initial, key2, value4);
    }
  }
}
function from_list(list3) {
  return from_list_loop(list3, new_map());
}
function reverse_and_concat(loop$remaining, loop$accumulator) {
  while (true) {
    let remaining = loop$remaining;
    let accumulator = loop$accumulator;
    if (remaining.hasLength(0)) {
      return accumulator;
    } else {
      let first3 = remaining.head;
      let rest = remaining.tail;
      loop$remaining = rest;
      loop$accumulator = prepend(first3, accumulator);
    }
  }
}
function do_keys_loop(loop$list, loop$acc) {
  while (true) {
    let list3 = loop$list;
    let acc = loop$acc;
    if (list3.hasLength(0)) {
      return reverse_and_concat(acc, toList([]));
    } else {
      let key2 = list3.head[0];
      let rest = list3.tail;
      loop$list = rest;
      loop$acc = prepend(key2, acc);
    }
  }
}
function keys(dict2) {
  return do_keys_loop(map_to_list(dict2), toList([]));
}

// build/dev/javascript/gleam_stdlib/gleam/list.mjs
var Ascending = class extends CustomType {
};
var Descending = class extends CustomType {
};
function length_loop(loop$list, loop$count) {
  while (true) {
    let list3 = loop$list;
    let count = loop$count;
    if (list3.atLeastLength(1)) {
      let list$1 = list3.tail;
      loop$list = list$1;
      loop$count = count + 1;
    } else {
      return count;
    }
  }
}
function length(list3) {
  return length_loop(list3, 0);
}
function reverse_and_prepend(loop$prefix, loop$suffix) {
  while (true) {
    let prefix = loop$prefix;
    let suffix = loop$suffix;
    if (prefix.hasLength(0)) {
      return suffix;
    } else {
      let first$1 = prefix.head;
      let rest$1 = prefix.tail;
      loop$prefix = rest$1;
      loop$suffix = prepend(first$1, suffix);
    }
  }
}
function reverse(list3) {
  return reverse_and_prepend(list3, toList([]));
}
function first(list3) {
  if (list3.hasLength(0)) {
    return new Error(void 0);
  } else {
    let first$1 = list3.head;
    return new Ok(first$1);
  }
}
function filter_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list3 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list3.hasLength(0)) {
      return reverse(acc);
    } else {
      let first$1 = list3.head;
      let rest$1 = list3.tail;
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
function filter(list3, predicate) {
  return filter_loop(list3, predicate, toList([]));
}
function map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list3 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list3.hasLength(0)) {
      return reverse(acc);
    } else {
      let first$1 = list3.head;
      let rest$1 = list3.tail;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = prepend(fun(first$1), acc);
    }
  }
}
function map2(list3, fun) {
  return map_loop(list3, fun, toList([]));
}
function index_map_loop(loop$list, loop$fun, loop$index, loop$acc) {
  while (true) {
    let list3 = loop$list;
    let fun = loop$fun;
    let index5 = loop$index;
    let acc = loop$acc;
    if (list3.hasLength(0)) {
      return reverse(acc);
    } else {
      let first$1 = list3.head;
      let rest$1 = list3.tail;
      let acc$1 = prepend(fun(first$1, index5), acc);
      loop$list = rest$1;
      loop$fun = fun;
      loop$index = index5 + 1;
      loop$acc = acc$1;
    }
  }
}
function index_map(list3, fun) {
  return index_map_loop(list3, fun, 0, toList([]));
}
function append_loop(loop$first, loop$second) {
  while (true) {
    let first3 = loop$first;
    let second = loop$second;
    if (first3.hasLength(0)) {
      return second;
    } else {
      let first$1 = first3.head;
      let rest$1 = first3.tail;
      loop$first = rest$1;
      loop$second = prepend(first$1, second);
    }
  }
}
function append(first3, second) {
  return append_loop(reverse(first3), second);
}
function prepend2(list3, item) {
  return prepend(item, list3);
}
function fold(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list3 = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list3.hasLength(0)) {
      return initial;
    } else {
      let first$1 = list3.head;
      let rest$1 = list3.tail;
      loop$list = rest$1;
      loop$initial = fun(initial, first$1);
      loop$fun = fun;
    }
  }
}
function index_fold_loop(loop$over, loop$acc, loop$with, loop$index) {
  while (true) {
    let over = loop$over;
    let acc = loop$acc;
    let with$ = loop$with;
    let index5 = loop$index;
    if (over.hasLength(0)) {
      return acc;
    } else {
      let first$1 = over.head;
      let rest$1 = over.tail;
      loop$over = rest$1;
      loop$acc = with$(acc, first$1, index5);
      loop$with = with$;
      loop$index = index5 + 1;
    }
  }
}
function index_fold(list3, initial, fun) {
  return index_fold_loop(list3, initial, fun, 0);
}
function sequences(loop$list, loop$compare, loop$growing, loop$direction, loop$prev, loop$acc) {
  while (true) {
    let list3 = loop$list;
    let compare4 = loop$compare;
    let growing = loop$growing;
    let direction = loop$direction;
    let prev = loop$prev;
    let acc = loop$acc;
    let growing$1 = prepend(prev, growing);
    if (list3.hasLength(0)) {
      if (direction instanceof Ascending) {
        return prepend(reverse(growing$1), acc);
      } else {
        return prepend(growing$1, acc);
      }
    } else {
      let new$1 = list3.head;
      let rest$1 = list3.tail;
      let $ = compare4(prev, new$1);
      if ($ instanceof Gt && direction instanceof Descending) {
        loop$list = rest$1;
        loop$compare = compare4;
        loop$growing = growing$1;
        loop$direction = direction;
        loop$prev = new$1;
        loop$acc = acc;
      } else if ($ instanceof Lt && direction instanceof Ascending) {
        loop$list = rest$1;
        loop$compare = compare4;
        loop$growing = growing$1;
        loop$direction = direction;
        loop$prev = new$1;
        loop$acc = acc;
      } else if ($ instanceof Eq && direction instanceof Ascending) {
        loop$list = rest$1;
        loop$compare = compare4;
        loop$growing = growing$1;
        loop$direction = direction;
        loop$prev = new$1;
        loop$acc = acc;
      } else if ($ instanceof Gt && direction instanceof Ascending) {
        let _block;
        if (direction instanceof Ascending) {
          _block = prepend(reverse(growing$1), acc);
        } else {
          _block = prepend(growing$1, acc);
        }
        let acc$1 = _block;
        if (rest$1.hasLength(0)) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next = rest$1.head;
          let rest$2 = rest$1.tail;
          let _block$1;
          let $1 = compare4(new$1, next);
          if ($1 instanceof Lt) {
            _block$1 = new Ascending();
          } else if ($1 instanceof Eq) {
            _block$1 = new Ascending();
          } else {
            _block$1 = new Descending();
          }
          let direction$1 = _block$1;
          loop$list = rest$2;
          loop$compare = compare4;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next;
          loop$acc = acc$1;
        }
      } else if ($ instanceof Lt && direction instanceof Descending) {
        let _block;
        if (direction instanceof Ascending) {
          _block = prepend(reverse(growing$1), acc);
        } else {
          _block = prepend(growing$1, acc);
        }
        let acc$1 = _block;
        if (rest$1.hasLength(0)) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next = rest$1.head;
          let rest$2 = rest$1.tail;
          let _block$1;
          let $1 = compare4(new$1, next);
          if ($1 instanceof Lt) {
            _block$1 = new Ascending();
          } else if ($1 instanceof Eq) {
            _block$1 = new Ascending();
          } else {
            _block$1 = new Descending();
          }
          let direction$1 = _block$1;
          loop$list = rest$2;
          loop$compare = compare4;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next;
          loop$acc = acc$1;
        }
      } else {
        let _block;
        if (direction instanceof Ascending) {
          _block = prepend(reverse(growing$1), acc);
        } else {
          _block = prepend(growing$1, acc);
        }
        let acc$1 = _block;
        if (rest$1.hasLength(0)) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next = rest$1.head;
          let rest$2 = rest$1.tail;
          let _block$1;
          let $1 = compare4(new$1, next);
          if ($1 instanceof Lt) {
            _block$1 = new Ascending();
          } else if ($1 instanceof Eq) {
            _block$1 = new Ascending();
          } else {
            _block$1 = new Descending();
          }
          let direction$1 = _block$1;
          loop$list = rest$2;
          loop$compare = compare4;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next;
          loop$acc = acc$1;
        }
      }
    }
  }
}
function merge_ascendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list22 = loop$list2;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (list1.hasLength(0)) {
      let list3 = list22;
      return reverse_and_prepend(list3, acc);
    } else if (list22.hasLength(0)) {
      let list3 = list1;
      return reverse_and_prepend(list3, acc);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first22 = list22.head;
      let rest2 = list22.tail;
      let $ = compare4(first1, first22);
      if ($ instanceof Lt) {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare4;
        loop$acc = prepend(first1, acc);
      } else if ($ instanceof Gt) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare4;
        loop$acc = prepend(first22, acc);
      } else {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare4;
        loop$acc = prepend(first22, acc);
      }
    }
  }
}
function merge_ascending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (sequences2.hasLength(0)) {
      return reverse(acc);
    } else if (sequences2.hasLength(1)) {
      let sequence = sequences2.head;
      return reverse(prepend(reverse(sequence), acc));
    } else {
      let ascending1 = sequences2.head;
      let ascending2 = sequences2.tail.head;
      let rest$1 = sequences2.tail.tail;
      let descending = merge_ascendings(
        ascending1,
        ascending2,
        compare4,
        toList([])
      );
      loop$sequences = rest$1;
      loop$compare = compare4;
      loop$acc = prepend(descending, acc);
    }
  }
}
function merge_descendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list22 = loop$list2;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (list1.hasLength(0)) {
      let list3 = list22;
      return reverse_and_prepend(list3, acc);
    } else if (list22.hasLength(0)) {
      let list3 = list1;
      return reverse_and_prepend(list3, acc);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first22 = list22.head;
      let rest2 = list22.tail;
      let $ = compare4(first1, first22);
      if ($ instanceof Lt) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare4;
        loop$acc = prepend(first22, acc);
      } else if ($ instanceof Gt) {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare4;
        loop$acc = prepend(first1, acc);
      } else {
        loop$list1 = rest1;
        loop$list2 = list22;
        loop$compare = compare4;
        loop$acc = prepend(first1, acc);
      }
    }
  }
}
function merge_descending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences2 = loop$sequences;
    let compare4 = loop$compare;
    let acc = loop$acc;
    if (sequences2.hasLength(0)) {
      return reverse(acc);
    } else if (sequences2.hasLength(1)) {
      let sequence = sequences2.head;
      return reverse(prepend(reverse(sequence), acc));
    } else {
      let descending1 = sequences2.head;
      let descending2 = sequences2.tail.head;
      let rest$1 = sequences2.tail.tail;
      let ascending = merge_descendings(
        descending1,
        descending2,
        compare4,
        toList([])
      );
      loop$sequences = rest$1;
      loop$compare = compare4;
      loop$acc = prepend(ascending, acc);
    }
  }
}
function merge_all(loop$sequences, loop$direction, loop$compare) {
  while (true) {
    let sequences2 = loop$sequences;
    let direction = loop$direction;
    let compare4 = loop$compare;
    if (sequences2.hasLength(0)) {
      return toList([]);
    } else if (sequences2.hasLength(1) && direction instanceof Ascending) {
      let sequence = sequences2.head;
      return sequence;
    } else if (sequences2.hasLength(1) && direction instanceof Descending) {
      let sequence = sequences2.head;
      return reverse(sequence);
    } else if (direction instanceof Ascending) {
      let sequences$1 = merge_ascending_pairs(sequences2, compare4, toList([]));
      loop$sequences = sequences$1;
      loop$direction = new Descending();
      loop$compare = compare4;
    } else {
      let sequences$1 = merge_descending_pairs(sequences2, compare4, toList([]));
      loop$sequences = sequences$1;
      loop$direction = new Ascending();
      loop$compare = compare4;
    }
  }
}
function sort(list3, compare4) {
  if (list3.hasLength(0)) {
    return toList([]);
  } else if (list3.hasLength(1)) {
    let x = list3.head;
    return toList([x]);
  } else {
    let x = list3.head;
    let y = list3.tail.head;
    let rest$1 = list3.tail.tail;
    let _block;
    let $ = compare4(x, y);
    if ($ instanceof Lt) {
      _block = new Ascending();
    } else if ($ instanceof Eq) {
      _block = new Ascending();
    } else {
      _block = new Descending();
    }
    let direction = _block;
    let sequences$1 = sequences(
      rest$1,
      compare4,
      toList([x]),
      direction,
      y,
      toList([])
    );
    return merge_all(sequences$1, new Ascending(), compare4);
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
    if (strings.atLeastLength(1)) {
      let string6 = strings.head;
      let strings$1 = strings.tail;
      loop$strings = strings$1;
      loop$accumulator = accumulator + string6;
    } else {
      return accumulator;
    }
  }
}
function concat2(strings) {
  return concat_loop(strings, "");
}
function repeat_loop(loop$string, loop$times, loop$acc) {
  while (true) {
    let string6 = loop$string;
    let times = loop$times;
    let acc = loop$acc;
    let $ = times <= 0;
    if ($) {
      return acc;
    } else {
      loop$string = string6;
      loop$times = times - 1;
      loop$acc = acc + string6;
    }
  }
}
function repeat(string6, times) {
  return repeat_loop(string6, times, "");
}
function join_loop(loop$strings, loop$separator, loop$accumulator) {
  while (true) {
    let strings = loop$strings;
    let separator = loop$separator;
    let accumulator = loop$accumulator;
    if (strings.hasLength(0)) {
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
  if (strings.hasLength(0)) {
    return "";
  } else {
    let first$1 = strings.head;
    let rest = strings.tail;
    return join_loop(rest, separator, first$1);
  }
}
function padding(size, pad_string) {
  let pad_string_length = string_length(pad_string);
  let num_pads = divideInt(size, pad_string_length);
  let extra = remainderInt(size, pad_string_length);
  return repeat(pad_string, num_pads) + slice(pad_string, 0, extra);
}
function pad_end(string6, desired_length, pad_string) {
  let current_length = string_length(string6);
  let to_pad_length = desired_length - current_length;
  let $ = to_pad_length <= 0;
  if ($) {
    return string6;
  } else {
    return string6 + padding(to_pad_length, pad_string);
  }
}
function trim(string6) {
  let _pipe = string6;
  let _pipe$1 = trim_start(_pipe);
  return trim_end(_pipe$1);
}
function drop_start(loop$string, loop$num_graphemes) {
  while (true) {
    let string6 = loop$string;
    let num_graphemes = loop$num_graphemes;
    let $ = num_graphemes > 0;
    if (!$) {
      return string6;
    } else {
      let $1 = pop_grapheme(string6);
      if ($1.isOk()) {
        let string$1 = $1[0][1];
        loop$string = string$1;
        loop$num_graphemes = num_graphemes - 1;
      } else {
        return string6;
      }
    }
  }
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

// build/dev/javascript/gleam_stdlib/gleam/result.mjs
function map3(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return new Ok(fun(x));
  } else {
    let e = result[0];
    return new Error(e);
  }
}
function map_error(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return new Ok(x);
  } else {
    let error = result[0];
    return new Error(fun(error));
  }
}
function try$(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return fun(x);
  } else {
    let e = result[0];
    return new Error(e);
  }
}
function then$(result, fun) {
  return try$(result, fun);
}
function unwrap2(result, default$) {
  if (result.isOk()) {
    let v = result[0];
    return v;
  } else {
    return default$;
  }
}

// build/dev/javascript/gleam_stdlib/gleam/dynamic.mjs
var DecodeError = class extends CustomType {
  constructor(expected, found, path) {
    super();
    this.expected = expected;
    this.found = found;
    this.path = path;
  }
};
function map_errors(result, f) {
  return map_error(
    result,
    (_capture) => {
      return map2(_capture, f);
    }
  );
}
function string2(data) {
  return decode_string(data);
}
function bool(data) {
  return decode_bool(data);
}
function do_any(decoders) {
  return (data) => {
    if (decoders.hasLength(0)) {
      return new Error(
        toList([new DecodeError("another type", classify_dynamic(data), toList([]))])
      );
    } else {
      let decoder = decoders.head;
      let decoders$1 = decoders.tail;
      let $ = decoder(data);
      if ($.isOk()) {
        let decoded = $[0];
        return new Ok(decoded);
      } else {
        return do_any(decoders$1)(data);
      }
    }
  };
}
function push_path(error, name2) {
  let name$1 = identity(name2);
  let decoder = do_any(
    toList([
      decode_string,
      (x) => {
        return map3(decode_int(x), to_string);
      }
    ])
  );
  let _block;
  let $ = decoder(name$1);
  if ($.isOk()) {
    let name$22 = $[0];
    _block = name$22;
  } else {
    let _pipe = toList(["<", classify_dynamic(name$1), ">"]);
    let _pipe$1 = concat(_pipe);
    _block = identity(_pipe$1);
  }
  let name$2 = _block;
  let _record = error;
  return new DecodeError(
    _record.expected,
    _record.found,
    prepend(name$2, error.path)
  );
}
function field(name2, inner_type) {
  return (value4) => {
    let missing_field_error = new DecodeError("field", "nothing", toList([]));
    return try$(
      decode_field(value4, name2),
      (maybe_inner) => {
        let _pipe = maybe_inner;
        let _pipe$1 = to_result(_pipe, toList([missing_field_error]));
        let _pipe$2 = try$(_pipe$1, inner_type);
        return map_errors(
          _pipe$2,
          (_capture) => {
            return push_path(_capture, name2);
          }
        );
      }
    );
  };
}

// build/dev/javascript/gleam_stdlib/gleam_stdlib_decode_ffi.mjs
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
    for (const value4 of data) {
      if (i === key2) return new Ok(new Some(value4));
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
    const error = new DecodeError2("List", classify_dynamic(data), emptyList);
    return [emptyList, List.fromArray([error])];
  }
  const decoded = [];
  for (const element2 of data) {
    const layer = decode2(element2);
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
function string3(data) {
  if (typeof data === "string") return new Ok(data);
  return new Error("");
}
function is_null(data) {
  return data === null || data === void 0;
}

// build/dev/javascript/gleam_stdlib/gleam/dynamic/decode.mjs
var DecodeError2 = class extends CustomType {
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
  let maybe_invalid_data = $[0];
  let errors = $[1];
  if (errors.hasLength(0)) {
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
function map4(decoder, transformer) {
  return new Decoder(
    (d) => {
      let $ = decoder.function(d);
      let data = $[0];
      let errors = $[1];
      return [transformer(data), errors];
    }
  );
}
function then$2(decoder, next) {
  return new Decoder(
    (dynamic_data) => {
      let $ = decoder.function(dynamic_data);
      let data = $[0];
      let errors = $[1];
      let decoder$1 = next(data);
      let $1 = decoder$1.function(dynamic_data);
      let layer = $1;
      let data$1 = $1[0];
      if (errors.hasLength(0)) {
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
    if (decoders.hasLength(0)) {
      return failure2;
    } else {
      let decoder = decoders.head;
      let decoders$1 = decoders.tail;
      let $ = decoder.function(data);
      let layer = $;
      let errors = $[1];
      if (errors.hasLength(0)) {
        return layer;
      } else {
        loop$data = data;
        loop$failure = failure2;
        loop$decoders = decoders$1;
      }
    }
  }
}
function one_of(first3, alternatives) {
  return new Decoder(
    (dynamic_data) => {
      let $ = first3.function(dynamic_data);
      let layer = $;
      let errors = $[1];
      if (errors.hasLength(0)) {
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
        let data$1 = $1[0];
        let errors = $1[1];
        return [new Some(data$1), errors];
      }
    }
  );
}
function decode_error(expected, found) {
  return toList([
    new DecodeError2(expected, classify_dynamic(found), toList([]))
  ]);
}
function run_dynamic_function(data, name2, f) {
  let $ = f(data);
  if ($.isOk()) {
    let data$1 = $[0];
    return [data$1, toList([])];
  } else {
    let zero = $[0];
    return [
      zero,
      toList([new DecodeError2(name2, classify_dynamic(data), toList([]))])
    ];
  }
}
function decode_int2(data) {
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
      if ($.isOk()) {
        let t = $[0];
        return [t, toList([])];
      } else {
        let zero = $[0];
        return [
          zero,
          toList([new DecodeError2(name2, classify_dynamic(d), toList([]))])
        ];
      }
    }
  );
}
var int2 = /* @__PURE__ */ new Decoder(decode_int2);
function decode_string2(data) {
  return run_dynamic_function(data, "String", string3);
}
var string4 = /* @__PURE__ */ new Decoder(decode_string2);
function list2(inner) {
  return new Decoder(
    (data) => {
      return list(
        data,
        inner.function,
        (p2, k) => {
          return push_path2(p2, toList([k]));
        },
        0,
        toList([])
      );
    }
  );
}
function push_path2(layer, path) {
  let decoder = one_of(
    string4,
    toList([
      (() => {
        let _pipe = int2;
        return map4(_pipe, to_string);
      })()
    ])
  );
  let path$1 = map2(
    path,
    (key2) => {
      let key$1 = identity(key2);
      let $ = run(key$1, decoder);
      if ($.isOk()) {
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
      let _record = error;
      return new DecodeError2(
        _record.expected,
        _record.found,
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
    if (path.hasLength(0)) {
      let _pipe = inner(data);
      return push_path2(_pipe, reverse(position));
    } else {
      let key2 = path.head;
      let path$1 = path.tail;
      let $ = index2(data, key2);
      if ($.isOk() && $[0] instanceof Some) {
        let data$1 = $[0][0];
        loop$path = path$1;
        loop$position = prepend(key2, position);
        loop$inner = inner;
        loop$data = data$1;
        loop$handle_miss = handle_miss;
      } else if ($.isOk() && $[0] instanceof None) {
        return handle_miss(data, prepend(key2, position));
      } else {
        let kind = $[0];
        let $1 = inner(data);
        let default$ = $1[0];
        let _pipe = [
          default$,
          toList([new DecodeError2(kind, classify_dynamic(data), toList([]))])
        ];
        return push_path2(_pipe, reverse(position));
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
          let default$ = $12[0];
          let _pipe = [
            default$,
            toList([new DecodeError2("Field", "Nothing", toList([]))])
          ];
          return push_path2(_pipe, reverse(position));
        }
      );
      let out = $[0];
      let errors1 = $[1];
      let $1 = next(out).function(data);
      let out$1 = $1[0];
      let errors2 = $1[1];
      return [out$1, append(errors1, errors2)];
    }
  );
}
function field2(field_name, field_decoder, next) {
  return subfield(toList([field_name]), field_decoder, next);
}

// build/dev/javascript/gleam_stdlib/gleam/bool.mjs
function to_string2(bool3) {
  if (!bool3) {
    return "False";
  } else {
    return "True";
  }
}
function guard(requirement, consequence, alternative) {
  if (requirement) {
    return consequence;
  } else {
    return alternative();
  }
}

// build/dev/javascript/gleam_json/gleam_json_ffi.mjs
function decode(string6) {
  try {
    const result = JSON.parse(string6);
    return new Ok(result);
  } catch (err) {
    return new Error(getJsonDecodeError(err, string6));
  }
}
function getJsonDecodeError(stdErr, json) {
  if (isUnexpectedEndOfInput(stdErr)) return new UnexpectedEndOfInput();
  return toUnexpectedByteError(stdErr, json);
}
function isUnexpectedEndOfInput(err) {
  const unexpectedEndOfInputRegex = /((unexpected (end|eof))|(end of data)|(unterminated string)|(json( parse error|\.parse)\: expected '(\:|\}|\])'))/i;
  return unexpectedEndOfInputRegex.test(err.message);
}
function toUnexpectedByteError(err, json) {
  let converters = [
    v8UnexpectedByteError,
    oldV8UnexpectedByteError,
    jsCoreUnexpectedByteError,
    spidermonkeyUnexpectedByteError
  ];
  for (let converter of converters) {
    let result = converter(err, json);
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
function spidermonkeyUnexpectedByteError(err, json) {
  const regex = /(unexpected character|expected .*) at line (\d+) column (\d+)/i;
  const match = regex.exec(err.message);
  if (!match) return null;
  const line = Number(match[2]);
  const column = Number(match[3]);
  const position = getPositionFromMultiline(line, column, json);
  const byte = toHex(json[position]);
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
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UnexpectedFormat = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UnableToDecode = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
function do_parse(json, decoder) {
  return then$(
    decode(json),
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
function parse(json, decoder) {
  return do_parse(json, decoder);
}

// build/dev/javascript/lustre/lustre/effect.mjs
var Effect = class extends CustomType {
  constructor(all) {
    super();
    this.all = all;
  }
};
function custom(run2) {
  return new Effect(
    toList([
      (actions) => {
        return run2(actions.dispatch, actions.emit, actions.select, actions.root);
      }
    ])
  );
}
function from(effect) {
  return custom((dispatch, _, _1, _2) => {
    return effect(dispatch);
  });
}
function none() {
  return new Effect(toList([]));
}

// build/dev/javascript/lustre/lustre/internals/vdom.mjs
var Text = class extends CustomType {
  constructor(content) {
    super();
    this.content = content;
  }
};
var Element2 = class extends CustomType {
  constructor(key2, namespace, tag, attrs, children2, self_closing, void$) {
    super();
    this.key = key2;
    this.namespace = namespace;
    this.tag = tag;
    this.attrs = attrs;
    this.children = children2;
    this.self_closing = self_closing;
    this.void = void$;
  }
};
var Map2 = class extends CustomType {
  constructor(subtree) {
    super();
    this.subtree = subtree;
  }
};
var Attribute = class extends CustomType {
  constructor(x0, x1, as_property) {
    super();
    this[0] = x0;
    this[1] = x1;
    this.as_property = as_property;
  }
};
var Event2 = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
function attribute_to_event_handler(attribute2) {
  if (attribute2 instanceof Attribute) {
    return new Error(void 0);
  } else {
    let name2 = attribute2[0];
    let handler = attribute2[1];
    let name$1 = drop_start(name2, 2);
    return new Ok([name$1, handler]);
  }
}
function do_element_list_handlers(elements2, handlers2, key2) {
  return index_fold(
    elements2,
    handlers2,
    (handlers3, element2, index5) => {
      let key$1 = key2 + "-" + to_string(index5);
      return do_handlers(element2, handlers3, key$1);
    }
  );
}
function do_handlers(loop$element, loop$handlers, loop$key) {
  while (true) {
    let element2 = loop$element;
    let handlers2 = loop$handlers;
    let key2 = loop$key;
    if (element2 instanceof Text) {
      return handlers2;
    } else if (element2 instanceof Map2) {
      let subtree = element2.subtree;
      loop$element = subtree();
      loop$handlers = handlers2;
      loop$key = key2;
    } else {
      let attrs = element2.attrs;
      let children2 = element2.children;
      let handlers$1 = fold(
        attrs,
        handlers2,
        (handlers3, attr) => {
          let $ = attribute_to_event_handler(attr);
          if ($.isOk()) {
            let name2 = $[0][0];
            let handler = $[0][1];
            return insert(handlers3, key2 + "-" + name2, handler);
          } else {
            return handlers3;
          }
        }
      );
      return do_element_list_handlers(children2, handlers$1, key2);
    }
  }
}
function handlers(element2) {
  return do_handlers(element2, new_map(), "0");
}

// build/dev/javascript/lustre/lustre/attribute.mjs
function attribute(name2, value4) {
  return new Attribute(name2, identity(value4), false);
}
function property(name2, value4) {
  return new Attribute(name2, identity(value4), true);
}
function on(name2, handler) {
  return new Event2("on" + name2, handler);
}
function style(properties) {
  return attribute(
    "style",
    fold(
      properties,
      "",
      (styles, _use1) => {
        let name$1 = _use1[0];
        let value$1 = _use1[1];
        return styles + name$1 + ":" + value$1 + ";";
      }
    )
  );
}
function class$(name2) {
  return attribute("class", name2);
}
function id(name2) {
  return attribute("id", name2);
}
function type_(name2) {
  return attribute("type", name2);
}
function value(val) {
  return attribute("value", val);
}
function checked(is_checked) {
  return property("checked", is_checked);
}
function placeholder(text3) {
  return attribute("placeholder", text3);
}
function selected(is_selected) {
  return property("selected", is_selected);
}
function autocomplete(name2) {
  return attribute("autocomplete", name2);
}
function disabled(is_disabled) {
  return property("disabled", is_disabled);
}
function name(name2) {
  return attribute("name", name2);
}
function for$(id2) {
  return attribute("for", id2);
}
function href(uri) {
  return attribute("href", uri);
}
function target(target3) {
  return attribute("target", target3);
}

// build/dev/javascript/lustre/lustre/element.mjs
function element(tag, attrs, children2) {
  if (tag === "area") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "base") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "br") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "col") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "embed") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "hr") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "img") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "input") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "link") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "meta") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "param") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "source") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "track") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "wbr") {
    return new Element2("", "", tag, attrs, toList([]), false, true);
  } else {
    return new Element2("", "", tag, attrs, children2, false, false);
  }
}
function text(content) {
  return new Text(content);
}
function none2() {
  return new Text("");
}

// build/dev/javascript/gleam_stdlib/gleam/set.mjs
var Set2 = class extends CustomType {
  constructor(dict2) {
    super();
    this.dict = dict2;
  }
};
function new$2() {
  return new Set2(new_map());
}

// build/dev/javascript/lustre/lustre/internals/patch.mjs
var Diff = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Emit = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Init = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
function is_empty_element_diff(diff2) {
  return isEqual(diff2.created, new_map()) && isEqual(
    diff2.removed,
    new$2()
  ) && isEqual(diff2.updated, new_map());
}

// build/dev/javascript/lustre/lustre/internals/runtime.mjs
var Attrs = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Batch = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Debug = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Dispatch = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Emit2 = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Event3 = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Shutdown = class extends CustomType {
};
var Subscribe = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Unsubscribe = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var ForceModel = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};

// build/dev/javascript/lustre/vdom.ffi.mjs
if (globalThis.customElements && !globalThis.customElements.get("lustre-fragment")) {
  globalThis.customElements.define(
    "lustre-fragment",
    class LustreFragment extends HTMLElement {
      constructor() {
        super();
      }
    }
  );
}
function morph(prev, next, dispatch) {
  let out;
  let stack = [{ prev, next, parent: prev.parentNode }];
  while (stack.length) {
    let { prev: prev2, next: next2, parent } = stack.pop();
    while (next2.subtree !== void 0) next2 = next2.subtree();
    if (next2.content !== void 0) {
      if (!prev2) {
        const created = document.createTextNode(next2.content);
        parent.appendChild(created);
        out ??= created;
      } else if (prev2.nodeType === Node.TEXT_NODE) {
        if (prev2.textContent !== next2.content) prev2.textContent = next2.content;
        out ??= prev2;
      } else {
        const created = document.createTextNode(next2.content);
        parent.replaceChild(created, prev2);
        out ??= created;
      }
    } else if (next2.tag !== void 0) {
      const created = createElementNode({
        prev: prev2,
        next: next2,
        dispatch,
        stack
      });
      if (!prev2) {
        parent.appendChild(created);
      } else if (prev2 !== created) {
        parent.replaceChild(created, prev2);
      }
      out ??= created;
    }
  }
  return out;
}
function createElementNode({ prev, next, dispatch, stack }) {
  const namespace = next.namespace || "http://www.w3.org/1999/xhtml";
  const canMorph = prev && prev.nodeType === Node.ELEMENT_NODE && prev.localName === next.tag && prev.namespaceURI === (next.namespace || "http://www.w3.org/1999/xhtml");
  const el = canMorph ? prev : namespace ? document.createElementNS(namespace, next.tag) : document.createElement(next.tag);
  let handlersForEl;
  if (!registeredHandlers.has(el)) {
    const emptyHandlers = /* @__PURE__ */ new Map();
    registeredHandlers.set(el, emptyHandlers);
    handlersForEl = emptyHandlers;
  } else {
    handlersForEl = registeredHandlers.get(el);
  }
  const prevHandlers = canMorph ? new Set(handlersForEl.keys()) : null;
  const prevAttributes = canMorph ? new Set(Array.from(prev.attributes, (a2) => a2.name)) : null;
  let className = null;
  let style2 = null;
  let innerHTML = null;
  if (canMorph && next.tag === "textarea") {
    const innertText = next.children[Symbol.iterator]().next().value?.content;
    if (innertText !== void 0) el.value = innertText;
  }
  const delegated = [];
  for (const attr of next.attrs) {
    const name2 = attr[0];
    const value4 = attr[1];
    if (attr.as_property) {
      if (el[name2] !== value4) el[name2] = value4;
      if (canMorph) prevAttributes.delete(name2);
    } else if (name2.startsWith("on")) {
      const eventName = name2.slice(2);
      const callback = dispatch(value4, eventName === "input");
      if (!handlersForEl.has(eventName)) {
        el.addEventListener(eventName, lustreGenericEventHandler);
      }
      handlersForEl.set(eventName, callback);
      if (canMorph) prevHandlers.delete(eventName);
    } else if (name2.startsWith("data-lustre-on-")) {
      const eventName = name2.slice(15);
      const callback = dispatch(lustreServerEventHandler);
      if (!handlersForEl.has(eventName)) {
        el.addEventListener(eventName, lustreGenericEventHandler);
      }
      handlersForEl.set(eventName, callback);
      el.setAttribute(name2, value4);
      if (canMorph) {
        prevHandlers.delete(eventName);
        prevAttributes.delete(name2);
      }
    } else if (name2.startsWith("delegate:data-") || name2.startsWith("delegate:aria-")) {
      el.setAttribute(name2, value4);
      delegated.push([name2.slice(10), value4]);
    } else if (name2 === "class") {
      className = className === null ? value4 : className + " " + value4;
    } else if (name2 === "style") {
      style2 = style2 === null ? value4 : style2 + value4;
    } else if (name2 === "dangerous-unescaped-html") {
      innerHTML = value4;
    } else {
      if (el.getAttribute(name2) !== value4) el.setAttribute(name2, value4);
      if (name2 === "value" || name2 === "selected") el[name2] = value4;
      if (canMorph) prevAttributes.delete(name2);
    }
  }
  if (className !== null) {
    el.setAttribute("class", className);
    if (canMorph) prevAttributes.delete("class");
  }
  if (style2 !== null) {
    el.setAttribute("style", style2);
    if (canMorph) prevAttributes.delete("style");
  }
  if (canMorph) {
    for (const attr of prevAttributes) {
      el.removeAttribute(attr);
    }
    for (const eventName of prevHandlers) {
      handlersForEl.delete(eventName);
      el.removeEventListener(eventName, lustreGenericEventHandler);
    }
  }
  if (next.tag === "slot") {
    window.queueMicrotask(() => {
      for (const child of el.assignedElements()) {
        for (const [name2, value4] of delegated) {
          if (!child.hasAttribute(name2)) {
            child.setAttribute(name2, value4);
          }
        }
      }
    });
  }
  if (next.key !== void 0 && next.key !== "") {
    el.setAttribute("data-lustre-key", next.key);
  } else if (innerHTML !== null) {
    el.innerHTML = innerHTML;
    return el;
  }
  let prevChild = el.firstChild;
  let seenKeys = null;
  let keyedChildren = null;
  let incomingKeyedChildren = null;
  let firstChild = children(next).next().value;
  if (canMorph && firstChild !== void 0 && // Explicit checks are more verbose but truthy checks force a bunch of comparisons
  // we don't care about: it's never gonna be a number etc.
  firstChild.key !== void 0 && firstChild.key !== "") {
    seenKeys = /* @__PURE__ */ new Set();
    keyedChildren = getKeyedChildren(prev);
    incomingKeyedChildren = getKeyedChildren(next);
    for (const child of children(next)) {
      prevChild = diffKeyedChild(
        prevChild,
        child,
        el,
        stack,
        incomingKeyedChildren,
        keyedChildren,
        seenKeys
      );
    }
  } else {
    for (const child of children(next)) {
      stack.unshift({ prev: prevChild, next: child, parent: el });
      prevChild = prevChild?.nextSibling;
    }
  }
  while (prevChild) {
    const next2 = prevChild.nextSibling;
    el.removeChild(prevChild);
    prevChild = next2;
  }
  return el;
}
var registeredHandlers = /* @__PURE__ */ new WeakMap();
function lustreGenericEventHandler(event2) {
  const target3 = event2.currentTarget;
  if (!registeredHandlers.has(target3)) {
    target3.removeEventListener(event2.type, lustreGenericEventHandler);
    return;
  }
  const handlersForEventTarget = registeredHandlers.get(target3);
  if (!handlersForEventTarget.has(event2.type)) {
    target3.removeEventListener(event2.type, lustreGenericEventHandler);
    return;
  }
  handlersForEventTarget.get(event2.type)(event2);
}
function lustreServerEventHandler(event2) {
  const el = event2.currentTarget;
  const tag = el.getAttribute(`data-lustre-on-${event2.type}`);
  const data = JSON.parse(el.getAttribute("data-lustre-data") || "{}");
  const include = JSON.parse(el.getAttribute("data-lustre-include") || "[]");
  switch (event2.type) {
    case "input":
    case "change":
      include.push("target.value");
      break;
  }
  return {
    tag,
    data: include.reduce(
      (data2, property2) => {
        const path = property2.split(".");
        for (let i = 0, o = data2, e = event2; i < path.length; i++) {
          if (i === path.length - 1) {
            o[path[i]] = e[path[i]];
          } else {
            o[path[i]] ??= {};
            e = e[path[i]];
            o = o[path[i]];
          }
        }
        return data2;
      },
      { data }
    )
  };
}
function getKeyedChildren(el) {
  const keyedChildren = /* @__PURE__ */ new Map();
  if (el) {
    for (const child of children(el)) {
      const key2 = child?.key || child?.getAttribute?.("data-lustre-key");
      if (key2) keyedChildren.set(key2, child);
    }
  }
  return keyedChildren;
}
function diffKeyedChild(prevChild, child, el, stack, incomingKeyedChildren, keyedChildren, seenKeys) {
  while (prevChild && !incomingKeyedChildren.has(prevChild.getAttribute("data-lustre-key"))) {
    const nextChild = prevChild.nextSibling;
    el.removeChild(prevChild);
    prevChild = nextChild;
  }
  if (keyedChildren.size === 0) {
    stack.unshift({ prev: prevChild, next: child, parent: el });
    prevChild = prevChild?.nextSibling;
    return prevChild;
  }
  if (seenKeys.has(child.key)) {
    console.warn(`Duplicate key found in Lustre vnode: ${child.key}`);
    stack.unshift({ prev: null, next: child, parent: el });
    return prevChild;
  }
  seenKeys.add(child.key);
  const keyedChild = keyedChildren.get(child.key);
  if (!keyedChild && !prevChild) {
    stack.unshift({ prev: null, next: child, parent: el });
    return prevChild;
  }
  if (!keyedChild && prevChild !== null) {
    const placeholder2 = document.createTextNode("");
    el.insertBefore(placeholder2, prevChild);
    stack.unshift({ prev: placeholder2, next: child, parent: el });
    return prevChild;
  }
  if (!keyedChild || keyedChild === prevChild) {
    stack.unshift({ prev: prevChild, next: child, parent: el });
    prevChild = prevChild?.nextSibling;
    return prevChild;
  }
  el.insertBefore(keyedChild, prevChild);
  stack.unshift({ prev: keyedChild, next: child, parent: el });
  return prevChild;
}
function* children(element2) {
  for (const child of element2.children) {
    yield* forceChild(child);
  }
}
function* forceChild(element2) {
  if (element2.subtree !== void 0) {
    yield* forceChild(element2.subtree());
  } else {
    yield element2;
  }
}

// build/dev/javascript/lustre/lustre.ffi.mjs
var LustreClientApplication = class _LustreClientApplication {
  /**
   * @template Flags
   *
   * @param {object} app
   * @param {(flags: Flags) => [Model, Lustre.Effect<Msg>]} app.init
   * @param {(msg: Msg, model: Model) => [Model, Lustre.Effect<Msg>]} app.update
   * @param {(model: Model) => Lustre.Element<Msg>} app.view
   * @param {string | HTMLElement} selector
   * @param {Flags} flags
   *
   * @returns {Gleam.Ok<(action: Lustre.Action<Lustre.Client, Msg>>) => void>}
   */
  static start({ init: init3, update: update2, view: view2 }, selector, flags) {
    if (!is_browser()) return new Error(new NotABrowser());
    const root = selector instanceof HTMLElement ? selector : document.querySelector(selector);
    if (!root) return new Error(new ElementNotFound(selector));
    const app = new _LustreClientApplication(root, init3(flags), update2, view2);
    return new Ok((action) => app.send(action));
  }
  /**
   * @param {Element} root
   * @param {[Model, Lustre.Effect<Msg>]} init
   * @param {(model: Model, msg: Msg) => [Model, Lustre.Effect<Msg>]} update
   * @param {(model: Model) => Lustre.Element<Msg>} view
   *
   * @returns {LustreClientApplication}
   */
  constructor(root, [init3, effects], update2, view2) {
    this.root = root;
    this.#model = init3;
    this.#update = update2;
    this.#view = view2;
    this.#tickScheduled = window.setTimeout(
      () => this.#tick(effects.all.toArray(), true),
      0
    );
  }
  /** @type {Element} */
  root;
  /**
   * @param {Lustre.Action<Lustre.Client, Msg>} action
   *
   * @returns {void}
   */
  send(action) {
    if (action instanceof Debug) {
      if (action[0] instanceof ForceModel) {
        this.#tickScheduled = window.clearTimeout(this.#tickScheduled);
        this.#queue = [];
        this.#model = action[0][0];
        const vdom = this.#view(this.#model);
        const dispatch = (handler, immediate = false) => (event2) => {
          const result = handler(event2);
          if (result instanceof Ok) {
            this.send(new Dispatch(result[0], immediate));
          }
        };
        const prev = this.root.firstChild ?? this.root.appendChild(document.createTextNode(""));
        morph(prev, vdom, dispatch);
      }
    } else if (action instanceof Dispatch) {
      const msg = action[0];
      const immediate = action[1] ?? false;
      this.#queue.push(msg);
      if (immediate) {
        this.#tickScheduled = window.clearTimeout(this.#tickScheduled);
        this.#tick();
      } else if (!this.#tickScheduled) {
        this.#tickScheduled = window.setTimeout(() => this.#tick());
      }
    } else if (action instanceof Emit2) {
      const event2 = action[0];
      const data = action[1];
      this.root.dispatchEvent(
        new CustomEvent(event2, {
          detail: data,
          bubbles: true,
          composed: true
        })
      );
    } else if (action instanceof Shutdown) {
      this.#tickScheduled = window.clearTimeout(this.#tickScheduled);
      this.#model = null;
      this.#update = null;
      this.#view = null;
      this.#queue = null;
      while (this.root.firstChild) {
        this.root.firstChild.remove();
      }
    }
  }
  /** @type {Model} */
  #model;
  /** @type {(model: Model, msg: Msg) => [Model, Lustre.Effect<Msg>]} */
  #update;
  /** @type {(model: Model) => Lustre.Element<Msg>} */
  #view;
  /** @type {Array<Msg>} */
  #queue = [];
  /** @type {number | undefined} */
  #tickScheduled;
  /**
   * @param {Lustre.Effect<Msg>[]} effects
   */
  #tick(effects = []) {
    this.#tickScheduled = void 0;
    this.#flush(effects);
    const vdom = this.#view(this.#model);
    const dispatch = (handler, immediate = false) => (event2) => {
      const result = handler(event2);
      if (result instanceof Ok) {
        this.send(new Dispatch(result[0], immediate));
      }
    };
    const prev = this.root.firstChild ?? this.root.appendChild(document.createTextNode(""));
    morph(prev, vdom, dispatch);
  }
  #flush(effects = []) {
    while (this.#queue.length > 0) {
      const msg = this.#queue.shift();
      const [next, effect] = this.#update(this.#model, msg);
      effects = effects.concat(effect.all.toArray());
      this.#model = next;
    }
    while (effects.length > 0) {
      const effect = effects.shift();
      const dispatch = (msg) => this.send(new Dispatch(msg));
      const emit2 = (event2, data) => this.root.dispatchEvent(
        new CustomEvent(event2, {
          detail: data,
          bubbles: true,
          composed: true
        })
      );
      const select2 = () => {
      };
      const root = this.root;
      effect({ dispatch, emit: emit2, select: select2, root });
    }
    if (this.#queue.length > 0) {
      this.#flush(effects);
    }
  }
};
var start = LustreClientApplication.start;
var LustreServerApplication = class _LustreServerApplication {
  static start({ init: init3, update: update2, view: view2, on_attribute_change }, flags) {
    const app = new _LustreServerApplication(
      init3(flags),
      update2,
      view2,
      on_attribute_change
    );
    return new Ok((action) => app.send(action));
  }
  constructor([model, effects], update2, view2, on_attribute_change) {
    this.#model = model;
    this.#update = update2;
    this.#view = view2;
    this.#html = view2(model);
    this.#onAttributeChange = on_attribute_change;
    this.#renderers = /* @__PURE__ */ new Map();
    this.#handlers = handlers(this.#html);
    this.#tick(effects.all.toArray());
  }
  send(action) {
    if (action instanceof Attrs) {
      for (const attr of action[0]) {
        const decoder = this.#onAttributeChange.get(attr[0]);
        if (!decoder) continue;
        const msg = decoder(attr[1]);
        if (msg instanceof Error) continue;
        this.#queue.push(msg);
      }
      this.#tick();
    } else if (action instanceof Batch) {
      this.#queue = this.#queue.concat(action[0].toArray());
      this.#tick(action[1].all.toArray());
    } else if (action instanceof Debug) {
    } else if (action instanceof Dispatch) {
      this.#queue.push(action[0]);
      this.#tick();
    } else if (action instanceof Emit2) {
      const event2 = new Emit(action[0], action[1]);
      for (const [_, renderer] of this.#renderers) {
        renderer(event2);
      }
    } else if (action instanceof Event3) {
      const handler = this.#handlers.get(action[0]);
      if (!handler) return;
      const msg = handler(action[1]);
      if (msg instanceof Error) return;
      this.#queue.push(msg[0]);
      this.#tick();
    } else if (action instanceof Subscribe) {
      const attrs = keys(this.#onAttributeChange);
      const patch = new Init(attrs, this.#html);
      this.#renderers = this.#renderers.set(action[0], action[1]);
      action[1](patch);
    } else if (action instanceof Unsubscribe) {
      this.#renderers = this.#renderers.delete(action[0]);
    }
  }
  #model;
  #update;
  #queue;
  #view;
  #html;
  #renderers;
  #handlers;
  #onAttributeChange;
  #tick(effects = []) {
    this.#flush(effects);
    const vdom = this.#view(this.#model);
    const diff2 = elements(this.#html, vdom);
    if (!is_empty_element_diff(diff2)) {
      const patch = new Diff(diff2);
      for (const [_, renderer] of this.#renderers) {
        renderer(patch);
      }
    }
    this.#html = vdom;
    this.#handlers = diff2.handlers;
  }
  #flush(effects = []) {
    while (this.#queue.length > 0) {
      const msg = this.#queue.shift();
      const [next, effect] = this.#update(this.#model, msg);
      effects = effects.concat(effect.all.toArray());
      this.#model = next;
    }
    while (effects.length > 0) {
      const effect = effects.shift();
      const dispatch = (msg) => this.send(new Dispatch(msg));
      const emit2 = (event2, data) => this.root.dispatchEvent(
        new CustomEvent(event2, {
          detail: data,
          bubbles: true,
          composed: true
        })
      );
      const select2 = () => {
      };
      const root = null;
      effect({ dispatch, emit: emit2, select: select2, root });
    }
    if (this.#queue.length > 0) {
      this.#flush(effects);
    }
  }
};
var start_server_application = LustreServerApplication.start;
var is_browser = () => globalThis.window && window.document;

// build/dev/javascript/lustre/lustre.mjs
var App = class extends CustomType {
  constructor(init3, update2, view2, on_attribute_change) {
    super();
    this.init = init3;
    this.update = update2;
    this.view = view2;
    this.on_attribute_change = on_attribute_change;
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
function application(init3, update2, view2) {
  return new App(init3, update2, view2, new None());
}
function start2(app, selector, flags) {
  return guard(
    !is_browser(),
    new Error(new NotABrowser()),
    () => {
      return start(app, selector, flags);
    }
  );
}

// build/dev/javascript/ghch/constants.mjs
var public$ = false;
var head = "HEAD";

// build/dev/javascript/gleam_stdlib/gleam/uri.mjs
var Uri = class extends CustomType {
  constructor(scheme, userinfo, host, port, path, query, fragment) {
    super();
    this.scheme = scheme;
    this.userinfo = userinfo;
    this.host = host;
    this.port = port;
    this.path = path;
    this.query = query;
    this.fragment = fragment;
  }
};
function is_valid_host_within_brackets_char(char) {
  return 48 >= char && char <= 57 || 65 >= char && char <= 90 || 97 >= char && char <= 122 || char === 58 || char === 46;
}
function parse_fragment(rest, pieces) {
  return new Ok(
    (() => {
      let _record = pieces;
      return new Uri(
        _record.scheme,
        _record.userinfo,
        _record.host,
        _record.port,
        _record.path,
        _record.query,
        new Some(rest)
      );
    })()
  );
}
function parse_query_with_question_mark_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size = loop$size;
    if (uri_string.startsWith("#") && size === 0) {
      let rest = uri_string.slice(1);
      return parse_fragment(rest, pieces);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let query = string_codeunit_slice(original, 0, size);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        _record.host,
        _record.port,
        _record.path,
        new Some(query),
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_fragment(rest, pieces$1);
    } else if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            _record.host,
            _record.port,
            _record.path,
            new Some(original),
            _record.fragment
          );
        })()
      );
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size + 1;
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
    let size = loop$size;
    if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let path = string_codeunit_slice(original, 0, size);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        _record.host,
        _record.port,
        path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let path = string_codeunit_slice(original, 0, size);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        _record.host,
        _record.port,
        path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_fragment(rest, pieces$1);
    } else if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            _record.host,
            _record.port,
            original,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size + 1;
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
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        _record.host,
        new Some(port),
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        _record.host,
        new Some(port),
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_fragment(rest, pieces$1);
    } else if (uri_string.startsWith("/")) {
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        _record.host,
        new Some(port),
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_path(uri_string, pieces$1);
    } else if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            _record.host,
            new Some(port),
            _record.path,
            _record.query,
            _record.fragment
          );
        })()
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
    let size = loop$size;
    if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            new Some(original),
            _record.port,
            _record.path,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else if (uri_string.startsWith(":")) {
      let host = string_codeunit_slice(original, 0, size);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        new Some(host),
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_port(uri_string, pieces$1);
    } else if (uri_string.startsWith("/")) {
      let host = string_codeunit_slice(original, 0, size);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        new Some(host),
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_path(uri_string, pieces$1);
    } else if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        new Some(host),
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        new Some(host),
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_fragment(rest, pieces$1);
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size + 1;
    }
  }
}
function parse_host_within_brackets_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size = loop$size;
    if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            new Some(uri_string),
            _record.port,
            _record.path,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else if (uri_string.startsWith("]") && size === 0) {
      let rest = uri_string.slice(1);
      return parse_port(rest, pieces);
    } else if (uri_string.startsWith("]")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size + 1);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        new Some(host),
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_port(rest, pieces$1);
    } else if (uri_string.startsWith("/") && size === 0) {
      return parse_path(uri_string, pieces);
    } else if (uri_string.startsWith("/")) {
      let host = string_codeunit_slice(original, 0, size);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        new Some(host),
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_path(uri_string, pieces$1);
    } else if (uri_string.startsWith("?") && size === 0) {
      let rest = uri_string.slice(1);
      return parse_query_with_question_mark(rest, pieces);
    } else if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        new Some(host),
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#") && size === 0) {
      let rest = uri_string.slice(1);
      return parse_fragment(rest, pieces);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        _record.userinfo,
        new Some(host),
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_fragment(rest, pieces$1);
    } else {
      let $ = pop_codeunit(uri_string);
      let char = $[0];
      let rest = $[1];
      let $1 = is_valid_host_within_brackets_char(char);
      if ($1) {
        loop$original = original;
        loop$uri_string = rest;
        loop$pieces = pieces;
        loop$size = size + 1;
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
    let _block;
    let _record = pieces;
    _block = new Uri(
      _record.scheme,
      _record.userinfo,
      new Some(""),
      _record.port,
      _record.path,
      _record.query,
      _record.fragment
    );
    let pieces$1 = _block;
    return parse_port(uri_string, pieces$1);
  } else if (uri_string === "") {
    return new Ok(
      (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(""),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })()
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
    let size = loop$size;
    if (uri_string.startsWith("@") && size === 0) {
      let rest = uri_string.slice(1);
      return parse_host(rest, pieces);
    } else if (uri_string.startsWith("@")) {
      let rest = uri_string.slice(1);
      let userinfo = string_codeunit_slice(original, 0, size);
      let _block;
      let _record = pieces;
      _block = new Uri(
        _record.scheme,
        new Some(userinfo),
        _record.host,
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_host(rest, pieces$1);
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
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size + 1;
    }
  }
}
function parse_authority_pieces(string6, pieces) {
  return parse_userinfo_loop(string6, string6, pieces, 0);
}
function parse_authority_with_slashes(uri_string, pieces) {
  if (uri_string === "//") {
    return new Ok(
      (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(""),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })()
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
    let size = loop$size;
    if (uri_string.startsWith("/") && size === 0) {
      return parse_authority_with_slashes(uri_string, pieces);
    } else if (uri_string.startsWith("/")) {
      let scheme = string_codeunit_slice(original, 0, size);
      let _block;
      let _record = pieces;
      _block = new Uri(
        new Some(lowercase(scheme)),
        _record.userinfo,
        _record.host,
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_authority_with_slashes(uri_string, pieces$1);
    } else if (uri_string.startsWith("?") && size === 0) {
      let rest = uri_string.slice(1);
      return parse_query_with_question_mark(rest, pieces);
    } else if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let scheme = string_codeunit_slice(original, 0, size);
      let _block;
      let _record = pieces;
      _block = new Uri(
        new Some(lowercase(scheme)),
        _record.userinfo,
        _record.host,
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#") && size === 0) {
      let rest = uri_string.slice(1);
      return parse_fragment(rest, pieces);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let scheme = string_codeunit_slice(original, 0, size);
      let _block;
      let _record = pieces;
      _block = new Uri(
        new Some(lowercase(scheme)),
        _record.userinfo,
        _record.host,
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_fragment(rest, pieces$1);
    } else if (uri_string.startsWith(":") && size === 0) {
      return new Error(void 0);
    } else if (uri_string.startsWith(":")) {
      let rest = uri_string.slice(1);
      let scheme = string_codeunit_slice(original, 0, size);
      let _block;
      let _record = pieces;
      _block = new Uri(
        new Some(lowercase(scheme)),
        _record.userinfo,
        _record.host,
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
      let pieces$1 = _block;
      return parse_authority_with_slashes(rest, pieces$1);
    } else if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            _record.host,
            _record.port,
            original,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size + 1;
    }
  }
}
function to_string3(uri) {
  let _block;
  let $ = uri.fragment;
  if ($ instanceof Some) {
    let fragment = $[0];
    _block = toList(["#", fragment]);
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
  if ($2 instanceof Some && !$3 && $2[0] !== "") {
    let host = $2[0];
    _block$2 = prepend("/", parts$2);
  } else {
    _block$2 = parts$2;
  }
  let parts$3 = _block$2;
  let _block$3;
  let $4 = uri.host;
  let $5 = uri.port;
  if ($4 instanceof Some && $5 instanceof Some) {
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
  if ($6 instanceof Some && $7 instanceof Some && $8 instanceof Some) {
    let s = $6[0];
    let u = $7[0];
    let h = $8[0];
    _block$4 = prepend(
      s,
      prepend(
        "://",
        prepend(u, prepend("@", prepend(h, parts$4)))
      )
    );
  } else if ($6 instanceof Some && $7 instanceof None && $8 instanceof Some) {
    let s = $6[0];
    let h = $8[0];
    _block$4 = prepend(s, prepend("://", prepend(h, parts$4)));
  } else if ($6 instanceof Some && $7 instanceof Some && $8 instanceof None) {
    let s = $6[0];
    _block$4 = prepend(s, prepend(":", parts$4));
  } else if ($6 instanceof Some && $7 instanceof None && $8 instanceof None) {
    let s = $6[0];
    _block$4 = prepend(s, prepend(":", parts$4));
  } else if ($6 instanceof None && $7 instanceof None && $8 instanceof Some) {
    let h = $8[0];
    _block$4 = prepend("//", prepend(h, parts$4));
  } else {
    _block$4 = parts$4;
  }
  let parts$5 = _block$4;
  return concat2(parts$5);
}
var empty = /* @__PURE__ */ new Uri(
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None(),
  "",
  /* @__PURE__ */ new None(),
  /* @__PURE__ */ new None()
);
function parse2(uri_string) {
  return parse_scheme_loop(uri_string, uri_string, empty, 0);
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
var Patch = class extends CustomType {
};
var Http = class extends CustomType {
};
var Https = class extends CustomType {
};
function method_to_string(method) {
  if (method instanceof Connect) {
    return "connect";
  } else if (method instanceof Delete) {
    return "delete";
  } else if (method instanceof Get) {
    return "get";
  } else if (method instanceof Head) {
    return "head";
  } else if (method instanceof Options) {
    return "options";
  } else if (method instanceof Patch) {
    return "patch";
  } else if (method instanceof Post) {
    return "post";
  } else if (method instanceof Put) {
    return "put";
  } else if (method instanceof Trace) {
    return "trace";
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
  return then$(
    (() => {
      let _pipe = uri.scheme;
      let _pipe$1 = unwrap(_pipe, "");
      return scheme_from_string(_pipe$1);
    })(),
    (scheme) => {
      return then$(
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
  return then$(_pipe$1, from_uri);
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
  static wrap(value4) {
    return value4 instanceof Promise ? new _PromiseLayer(value4) : value4;
  }
  static unwrap(value4) {
    return value4 instanceof _PromiseLayer ? value4.promise : value4;
  }
};
function resolve(value4) {
  return Promise.resolve(PromiseLayer.wrap(value4));
}
function then_await(promise, fn) {
  return promise.then((value4) => fn(PromiseLayer.unwrap(value4)));
}
function map_promise(promise, fn) {
  return promise.then(
    (value4) => PromiseLayer.wrap(fn(PromiseLayer.unwrap(value4)))
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
      if (result.isOk()) {
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
  let url = to_string3(to_uri(request));
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
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UnableToReadBody = class extends CustomType {
};
function send(request) {
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
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var InternalServerError = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var JsonError = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var NetworkError2 = class extends CustomType {
};
var NotFound = class extends CustomType {
};
var OtherError = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
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
  let _pipe = send(req);
  let _pipe$1 = try_await(_pipe, read_text_body);
  let _pipe$2 = map_promise(
    _pipe$1,
    (response) => {
      if (response.isOk()) {
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
function get(url, expect) {
  return from(
    (dispatch) => {
      let $ = to(url);
      if ($.isOk()) {
        let req = $[0];
        return do_send(req, expect, dispatch);
      } else {
        return dispatch(expect.run(new Error(new BadUrl(url))));
      }
    }
  );
}
function response_to_result(response) {
  if (response instanceof Response && (200 <= response.status && response.status <= 299)) {
    let status = response.status;
    let body2 = response.body;
    return new Ok(body2);
  } else if (response instanceof Response && response.status === 401) {
    return new Error(new Unauthorized());
  } else if (response instanceof Response && response.status === 404) {
    return new Error(new NotFound());
  } else if (response instanceof Response && response.status === 500) {
    let body2 = response.body;
    return new Error(new InternalServerError(body2));
  } else {
    let code2 = response.status;
    let body2 = response.body;
    return new Error(new OtherError(code2, body2));
  }
}
function expect_json(decoder, to_msg) {
  return new ExpectTextResponse(
    (response) => {
      let _pipe = response;
      let _pipe$1 = then$(_pipe, response_to_result);
      let _pipe$2 = then$(
        _pipe$1,
        (body2) => {
          let $ = parse(body2, decoder);
          if ($.isOk()) {
            let json = $[0];
            return new Ok(json);
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

// build/dev/javascript/plinth/element_ffi.mjs
function scrollIntoView(element2) {
  element2.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// build/dev/javascript/plinth/window_ffi.mjs
function self() {
  return globalThis;
}
function alert(message) {
  window.alert(message);
}
function prompt(message, defaultValue) {
  let text3 = window.prompt(message, defaultValue);
  if (text3 !== null) {
    return new Ok(text3);
  } else {
    return new Error();
  }
}
function addEventListener3(type, listener) {
  return window.addEventListener(type, listener);
}
function document2(window2) {
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
function queueMicrotask(callback) {
  return window.queueMicrotask(callback);
}
function requestAnimationFrame(callback) {
  return window.requestAnimationFrame(callback);
}
function cancelAnimationFrame(callback) {
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
function setTimeout(delay, callback) {
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
function add3(left, right) {
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
  return seconds$1 + divideFloat(nanoseconds$1, 1e9);
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
  let seconds2 = $[0];
  let nanoseconds2 = $[1];
  return normalise2(new Timestamp(seconds2, nanoseconds2));
}
function difference(left, right) {
  let seconds2 = seconds(right.seconds - left.seconds);
  let nanoseconds2 = nanoseconds(right.nanoseconds - left.nanoseconds);
  return add3(seconds2, nanoseconds2);
}
function is_leap_year(year) {
  return remainderInt(year, 4) === 0 && (remainderInt(year, 100) !== 0 || remainderInt(
    year,
    400
  ) === 0);
}
function parse_sign(bytes) {
  if (bytes.byteAt(0) === 43 && (bytes.bitSize >= 8 && (bytes.bitSize - 8) % 8 === 0)) {
    let remaining_bytes = bitArraySlice(bytes, 8);
    return new Ok(["+", remaining_bytes]);
  } else if (bytes.byteAt(0) === 45 && (bytes.bitSize >= 8 && (bytes.bitSize - 8) % 8 === 0)) {
    let remaining_bytes = bitArraySlice(bytes, 8);
    return new Ok(["-", remaining_bytes]);
  } else {
    return new Error(void 0);
  }
}
function accept_byte(bytes, value4) {
  if (bytes.bitSize >= 8 && (bytes.bitSize - 8) % 8 === 0 && bytes.byteAt(0) === value4) {
    let byte = bytes.byteAt(0);
    let remaining_bytes = bitArraySlice(bytes, 8);
    return new Ok(remaining_bytes);
  } else {
    return new Error(void 0);
  }
}
function accept_empty(bytes) {
  if (bytes.bitSize == 0) {
    return new Ok(void 0);
  } else {
    return new Error(void 0);
  }
}
function julian_day_from_ymd(year, month, day) {
  let adjustment = divideInt(14 - month, 12);
  let adjusted_year = year + 4800 - adjustment;
  let adjusted_month = month + 12 * adjustment - 3;
  return day + divideInt(153 * adjusted_month + 2, 5) + 365 * adjusted_year + divideInt(
    adjusted_year,
    4
  ) - divideInt(adjusted_year, 100) + divideInt(adjusted_year, 400) - 32045;
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
    let power$1 = divideInt(power3, 10);
    if (bytes.bitSize >= 8 && (bytes.bitSize - 8) % 8 === 0 && (48 <= bytes.byteAt(0) && bytes.byteAt(0) <= 57 && power$1 < 1)) {
      let byte = bytes.byteAt(0);
      let remaining_bytes = bitArraySlice(bytes, 8);
      loop$bytes = remaining_bytes;
      loop$acc = acc;
      loop$power = power$1;
    } else if (bytes.bitSize >= 8 && (bytes.bitSize - 8) % 8 === 0 && (48 <= bytes.byteAt(0) && bytes.byteAt(0) <= 57)) {
      let byte = bytes.byteAt(0);
      let remaining_bytes = bitArraySlice(bytes, 8);
      let digit = byte - 48;
      loop$bytes = remaining_bytes;
      loop$acc = acc + digit * power$1;
      loop$power = power$1;
    } else {
      return new Ok([acc, bytes]);
    }
  }
}
function parse_second_fraction_as_nanoseconds(bytes) {
  if (bytes.byteAt(0) === 46 && (bytes.bitSize >= 16 && (bytes.bitSize - 16) % 8 === 0) && (48 <= bytes.byteAt(1) && bytes.byteAt(1) <= 57)) {
    let byte = bytes.byteAt(1);
    let remaining_bytes = bitArraySlice(bytes, 16);
    return do_parse_second_fraction_as_nanoseconds(
      toBitArray([byte, remaining_bytes]),
      0,
      nanoseconds_per_second
    );
  } else if (bytes.byteAt(0) === 46 && (bytes.bitSize >= 8 && (bytes.bitSize - 8) % 8 === 0)) {
    return new Error(void 0);
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
    } else if (bytes.bitSize >= 8 && (bytes.bitSize - 8) % 8 === 0 && (48 <= bytes.byteAt(0) && bytes.byteAt(0) <= 57)) {
      let byte = bytes.byteAt(0);
      let remaining_bytes = bitArraySlice(bytes, 8);
      loop$bytes = remaining_bytes;
      loop$count = count;
      loop$acc = acc * 10 + (byte - 48);
      loop$k = k + 1;
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
      let month = _use0[0];
      let bytes$1 = _use0[1];
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
      let day = _use0[0];
      let bytes$1 = _use0[1];
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
      let hours = _use0[0];
      let bytes$1 = _use0[1];
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
      let minutes = _use0[0];
      let bytes$1 = _use0[1];
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
      let seconds2 = _use0[0];
      let bytes$1 = _use0[1];
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
      let sign = _use0[0];
      let bytes$1 = _use0[1];
      return try$(
        parse_hours(bytes$1),
        (_use02) => {
          let hours = _use02[0];
          let bytes$2 = _use02[1];
          return try$(
            accept_byte(bytes$2, byte_colon),
            (bytes2) => {
              return try$(
                parse_minutes(bytes2),
                (_use03) => {
                  let minutes = _use03[0];
                  let bytes$12 = _use03[1];
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
  if (bytes.byteAt(0) === 90 && (bytes.bitSize >= 8 && (bytes.bitSize - 8) % 8 === 0)) {
    let remaining_bytes = bitArraySlice(bytes, 8);
    return new Ok([0, remaining_bytes]);
  } else if (bytes.byteAt(0) === 122 && (bytes.bitSize >= 8 && (bytes.bitSize - 8) % 8 === 0)) {
    let remaining_bytes = bitArraySlice(bytes, 8);
    return new Ok([0, remaining_bytes]);
  } else {
    return parse_numeric_offset(bytes);
  }
}
function accept_date_time_separator(bytes) {
  if (bytes.bitSize >= 8 && (bytes.bitSize - 8) % 8 === 0 && (bytes.byteAt(0) === 84 || bytes.byteAt(0) === 116)) {
    let byte = bytes.byteAt(0);
    let remaining_bytes = bitArraySlice(bytes, 8);
    return new Ok(remaining_bytes);
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
      let year = _use0[0];
      let bytes$1 = _use0[1];
      return try$(
        accept_byte(bytes$1, byte_minus),
        (bytes2) => {
          return try$(
            parse_month(bytes2),
            (_use02) => {
              let month = _use02[0];
              let bytes$12 = _use02[1];
              return try$(
                accept_byte(bytes$12, byte_minus),
                (bytes3) => {
                  return try$(
                    parse_day(bytes3, year, month),
                    (_use03) => {
                      let day = _use03[0];
                      let bytes$13 = _use03[1];
                      return try$(
                        accept_date_time_separator(bytes$13),
                        (bytes4) => {
                          return try$(
                            parse_hours(bytes4),
                            (_use04) => {
                              let hours = _use04[0];
                              let bytes$14 = _use04[1];
                              return try$(
                                accept_byte(bytes$14, byte_colon),
                                (bytes5) => {
                                  return try$(
                                    parse_minutes(bytes5),
                                    (_use05) => {
                                      let minutes = _use05[0];
                                      let bytes$15 = _use05[1];
                                      return try$(
                                        accept_byte(bytes$15, byte_colon),
                                        (bytes6) => {
                                          return try$(
                                            parse_seconds(bytes6),
                                            (_use06) => {
                                              let seconds2 = _use06[0];
                                              let bytes$16 = _use06[1];
                                              return try$(
                                                parse_second_fraction_as_nanoseconds(
                                                  bytes$16
                                                ),
                                                (_use07) => {
                                                  let second_fraction_as_nanoseconds = _use07[0];
                                                  let bytes$2 = _use07[1];
                                                  return try$(
                                                    parse_offset(bytes$2),
                                                    (_use08) => {
                                                      let offset_seconds = _use08[0];
                                                      let bytes$3 = _use08[1];
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

// build/dev/javascript/ghch/utils.mjs
function http_error_to_string(error) {
  if (error instanceof BadUrl) {
    let u = error[0];
    return "bad url: " + u;
  } else if (error instanceof InternalServerError) {
    let e = error[0];
    return "internal server error: " + e;
  } else if (error instanceof JsonError) {
    let e = error[0];
    if (e instanceof UnableToDecode) {
      let de = e[0];
      let _pipe = de;
      let _pipe$1 = map2(
        _pipe,
        (err) => {
          {
            let exp2 = err.expected;
            let found = err.found;
            return "couldn't decode JSON; expected: " + exp2 + ", found: " + found;
          }
        }
      );
      return join(_pipe$1, ", ");
    } else if (e instanceof UnexpectedByte) {
      return "unexpected byte";
    } else if (e instanceof UnexpectedEndOfInput) {
      return "unexpected end of input";
    } else if (e instanceof UnexpectedFormat) {
      return "unexpected format";
    } else {
      return "unexpected sequence";
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
    let duration_mins = divideInt(duration_secs, 60);
    let $1 = duration_mins < 60;
    if ($1) {
      return (() => {
        let _pipe$2 = duration_mins;
        return to_string(_pipe$2);
      })() + " mins";
    } else {
      let duration_hours = divideInt(duration_mins, 60);
      let $2 = duration_hours < 24;
      if ($2) {
        return (() => {
          let _pipe$2 = duration_hours;
          return to_string(_pipe$2);
        })() + " hours";
      } else {
        let duration_days = divideInt(duration_hours, 24);
        return (() => {
          let _pipe$2 = duration_days;
          return to_string(_pipe$2);
        })() + " days";
      }
    }
  }
}

// build/dev/javascript/ghch/types.mjs
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
var Commit = class extends CustomType {
  constructor(sha) {
    super();
    this.sha = sha;
  }
};
var Tag = class extends CustomType {
  constructor(name2, commit) {
    super();
    this.name = name2;
    this.commit = commit;
  }
};
var ChangelogCommitAuthor = class extends CustomType {
  constructor(name2, email, authoring_timestamp) {
    super();
    this.name = name2;
    this.email = email;
    this.authoring_timestamp = authoring_timestamp;
  }
};
var ChangelogCommitDetails = class extends CustomType {
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
var ChangelogCommit = class extends CustomType {
  constructor(sha, details, html_url) {
    super();
    this.sha = sha;
    this.details = details;
    this.html_url = html_url;
  }
};
var ChangelogResponse = class extends CustomType {
  constructor(commits, files) {
    super();
    this.commits = commits;
    this.files = files;
  }
};
var Config = class extends CustomType {
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
var Model2 = class extends CustomType {
  constructor(config, state, author_color_classes, debug) {
    super();
    this.config = config;
    this.state = state;
    this.author_color_classes = author_color_classes;
    this.debug = debug;
  }
};
var InitialConfigFetched = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UserChangedTheme = class extends CustomType {
};
var AccountTypeChanged = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UserEnteredUsernameInput = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UserRequestedRepos = class extends CustomType {
};
var ReposFetched = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UserEnteredRepoFilterQuery = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var RepoChosen = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var TagsFetched = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var StartTagChosen = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var EndTagChosen = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UserRequestedChangelog = class extends CustomType {
};
var ChangesFetched = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UserRequestedToGoToSection = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UserEnteredCommitsFilterQuery = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UserEnteredFilesFilterQuery = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
function theme_decoder() {
  return then$2(
    string4,
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
    string4,
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
  return field2(
    "owner",
    optional(string4),
    (owner) => {
      return field2(
        "owner_type",
        owner_type_decoder(),
        (owner_type) => {
          return field2(
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
  return field2(
    "id",
    int2,
    (id2) => {
      return field2(
        "name",
        string4,
        (name2) => {
          return field2(
            "url",
            string4,
            (url) => {
              return field2(
                "description",
                optional(string4),
                (description) => {
                  return field2(
                    "language",
                    optional(string4),
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
function commit_decoder() {
  return field2(
    "sha",
    string4,
    (sha) => {
      return success(new Commit(sha));
    }
  );
}
function tag_decoder() {
  return field2(
    "name",
    string4,
    (name2) => {
      return field2(
        "commit",
        commit_decoder(),
        (commit) => {
          return success(new Tag(name2, commit));
        }
      );
    }
  );
}
function tags_response_decoder() {
  let _pipe = tag_decoder();
  return list2(_pipe);
}
function timestamp_decoder() {
  return new_primitive_decoder(
    "Timestamp",
    (data) => {
      let default$ = new None();
      let $ = run(identity(data), string4);
      if (!$.isOk()) {
        return new Ok(default$);
      } else {
        let timestamp_string = $[0];
        let $1 = parse_rfc3339(timestamp_string);
        if (!$1.isOk()) {
          return new Ok(default$);
        } else {
          let t = $1[0];
          return new Ok(
            (() => {
              let _pipe = t;
              return new Some(_pipe);
            })()
          );
        }
      }
    }
  );
}
function changelog_commit_author_decoder() {
  return field2(
    "name",
    string4,
    (name2) => {
      return field2(
        "email",
        string4,
        (email) => {
          return field2(
            "date",
            timestamp_decoder(),
            (authoring_timestamp) => {
              return success(
                new ChangelogCommitAuthor(name2, email, authoring_timestamp)
              );
            }
          );
        }
      );
    }
  );
}
function changelog_commit_details_decoder() {
  return field2(
    "author",
    changelog_commit_author_decoder(),
    (author) => {
      return field2(
        "message",
        string4,
        (message) => {
          return success(new ChangelogCommitDetails(author, message));
        }
      );
    }
  );
}
function file_status_to_string(status) {
  let _block;
  if (status instanceof Added) {
    _block = "added";
  } else if (status instanceof Changed) {
    _block = "changed";
  } else if (status instanceof Copied) {
    _block = "copied";
  } else if (status instanceof Modified) {
    _block = "modified";
  } else if (status instanceof Removed) {
    _block = "removed";
  } else if (status instanceof Renamed) {
    _block = "renamed";
  } else {
    _block = "unchangd";
  }
  let _pipe = _block;
  return pad_end(_pipe, 8, ".");
}
function changes_file_status_decoder() {
  return then$2(
    string4,
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
  return field2(
    "filename",
    string4,
    (file_name) => {
      return field2(
        "status",
        changes_file_status_decoder(),
        (status) => {
          return field2(
            "additions",
            int2,
            (additions) => {
              return field2(
                "deletions",
                int2,
                (deletions) => {
                  return field2(
                    "blob_url",
                    string4,
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
function changelog_commit_decoder() {
  return field2(
    "sha",
    string4,
    (sha) => {
      return field2(
        "commit",
        changelog_commit_details_decoder(),
        (details) => {
          return field2(
            "html_url",
            string4,
            (html_url) => {
              return success(
                new ChangelogCommit(sha, details, html_url)
              );
            }
          );
        }
      );
    }
  );
}
function changes_response_decoder() {
  return field2(
    "commits",
    list2(changelog_commit_decoder()),
    (commits) => {
      return field2(
        "files",
        optional(list2(changes_file_item_decoder())),
        (files) => {
          return success(new ChangelogResponse(commits, files));
        }
      );
    }
  );
}
function theme_to_string(theme) {
  if (theme instanceof Dark) {
    return "\u{1F319}";
  } else {
    return "\u2600\uFE0F";
  }
}
function get_next_theme(current) {
  if (current instanceof Dark) {
    return new Light();
  } else {
    return new Dark();
  }
}
function owner_types() {
  return toList([new User(), new Org()]);
}
function owner_type_to_string(owner_type) {
  if (owner_type instanceof Org) {
    return "org";
  } else {
    return "user";
  }
}
function section_to_string(section) {
  if (section instanceof OwnerSection) {
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
  if (!$) {
    return new Model2(
      new Config(new Dark()),
      new Initial(),
      author_color_classes,
      false
    );
  } else {
    return new Model2(
      new Config(new Dark()),
      new ConfigLoaded(
        (() => {
          let _pipe = "dhth";
          return new Some(_pipe);
        })(),
        new User(),
        true
      ),
      author_color_classes,
      false
    );
  }
}

// build/dev/javascript/ghch/effects.mjs
function scroll_element_into_view(id2) {
  let scroll_fn = () => {
    let $ = (() => {
      let _pipe2 = id2;
      return getElementById(_pipe2);
    })();
    if (!$.isOk()) {
      return void 0;
    } else {
      let e = $[0];
      let _pipe2 = e;
      return scrollIntoView(_pipe2);
    }
  };
  let _pipe = (_) => {
    setTimeout(100, scroll_fn);
    return void 0;
  };
  return from(_pipe);
}
var dev = true;
function base_url() {
  let $ = public$;
  if (!$) {
    let $1 = dev;
    if (!$1) {
      return location() + "api";
    } else {
      return "http://127.0.0.1:9899/api";
    }
  } else {
    return "https://api.github.com";
  }
}
function fetch_initial_config() {
  let expect = expect_json(
    initial_config_decoder(),
    (var0) => {
      return new InitialConfigFetched(var0);
    }
  );
  return get(base_url() + "/config", expect);
}
function repos_endpoint(user_name, owner_type) {
  let _pipe = toList([
    base_url(),
    (() => {
      if (owner_type instanceof Org) {
        return "orgs";
      } else {
        return "users";
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
  return get(
    (() => {
      let _pipe = user_name;
      return repos_endpoint(_pipe, owner_type);
    })(),
    expect
  );
}
function fetch_repos_for_public_version() {
  return fetch_repos("dhth", new User());
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
  return get(tags_endpoint(username, repo), expect);
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
    changes_response_decoder(),
    (result) => {
      return new ChangesFetched([start_tag, end_tag, result]);
    }
  );
  return get(
    changelog_endpoint(user_name, repo, start_tag, end_tag),
    expect
  );
}

// build/dev/javascript/ghch/update.mjs
function update(model, msg) {
  let zero = [model, none()];
  let state = model.state;
  if (msg instanceof InitialConfigFetched) {
    let result = msg[0];
    if (!result.isOk()) {
      let e = result[0];
      return [
        (() => {
          let _record = model;
          return new Model2(
            _record.config,
            new ConfigError(e),
            _record.author_color_classes,
            _record.debug
          );
        })(),
        none()
      ];
    } else {
      let initial_config = result[0];
      {
        let maybe_owner = initial_config.owner;
        let owner_type = initial_config.owner_type;
        let theme = initial_config.theme;
        return [
          (() => {
            let _record = model;
            return new Model2(
              new Config(theme),
              new ConfigLoaded(
                maybe_owner,
                owner_type,
                (() => {
                  let _pipe = maybe_owner;
                  return is_some(_pipe);
                })()
              ),
              _record.author_color_classes,
              _record.debug
            );
          })(),
          (() => {
            if (maybe_owner instanceof None) {
              return none();
            } else {
              let user_name = maybe_owner[0];
              return fetch_repos(user_name, owner_type);
            }
          })()
        ];
      }
    }
  } else if (msg instanceof UserChangedTheme) {
    let config = model.config;
    return [
      (() => {
        let _record = model;
        return new Model2(
          new Config(
            (() => {
              let _pipe = config.theme;
              return get_next_theme(_pipe);
            })()
          ),
          _record.state,
          _record.author_color_classes,
          _record.debug
        );
      })(),
      none()
    ];
  } else if (msg instanceof AccountTypeChanged) {
    let owner_type = msg[0];
    if (state instanceof ConfigLoaded) {
      let user_name = state.user_name;
      return [
        (() => {
          let _record = model;
          return new Model2(
            _record.config,
            new ConfigLoaded(user_name, owner_type, false),
            _record.author_color_classes,
            _record.debug
          );
        })(),
        none()
      ];
    } else if (state instanceof WithChanges) {
      let user_name = state.user_name;
      let owner_type$1 = state.owner_type;
      return [
        (() => {
          let _record = model;
          return new Model2(
            _record.config,
            new ConfigLoaded(
              (() => {
                let _pipe = user_name;
                return new Some(_pipe);
              })(),
              owner_type$1,
              false
            ),
            _record.author_color_classes,
            _record.debug
          );
        })(),
        none()
      ];
    } else if (state instanceof WithChangesError) {
      let user_name = state.user_name;
      let owner_type$1 = state.owner_type;
      return [
        (() => {
          let _record = model;
          return new Model2(
            _record.config,
            new ConfigLoaded(
              (() => {
                let _pipe = user_name;
                return new Some(_pipe);
              })(),
              owner_type$1,
              false
            ),
            _record.author_color_classes,
            _record.debug
          );
        })(),
        none()
      ];
    } else if (state instanceof WithRepos) {
      let user_name = state.user_name;
      let owner_type$1 = state.owner_type;
      return [
        (() => {
          let _record = model;
          return new Model2(
            _record.config,
            new ConfigLoaded(
              (() => {
                let _pipe = user_name;
                return new Some(_pipe);
              })(),
              owner_type$1,
              false
            ),
            _record.author_color_classes,
            _record.debug
          );
        })(),
        none()
      ];
    } else if (state instanceof WithReposError) {
      let user_name = state.user_name;
      let owner_type$1 = state.owner_type;
      return [
        (() => {
          let _record = model;
          return new Model2(
            _record.config,
            new ConfigLoaded(
              (() => {
                let _pipe = user_name;
                return new Some(_pipe);
              })(),
              owner_type$1,
              false
            ),
            _record.author_color_classes,
            _record.debug
          );
        })(),
        none()
      ];
    } else if (state instanceof WithTags) {
      let user_name = state.user_name;
      let owner_type$1 = state.owner_type;
      return [
        (() => {
          let _record = model;
          return new Model2(
            _record.config,
            new ConfigLoaded(
              (() => {
                let _pipe = user_name;
                return new Some(_pipe);
              })(),
              owner_type$1,
              false
            ),
            _record.author_color_classes,
            _record.debug
          );
        })(),
        none()
      ];
    } else if (state instanceof WithTagsError) {
      let user_name = state.user_name;
      let owner_type$1 = state.owner_type;
      return [
        (() => {
          let _record = model;
          return new Model2(
            _record.config,
            new ConfigLoaded(
              (() => {
                let _pipe = user_name;
                return new Some(_pipe);
              })(),
              owner_type$1,
              false
            ),
            _record.author_color_classes,
            _record.debug
          );
        })(),
        none()
      ];
    } else {
      return zero;
    }
  } else if (msg instanceof UserEnteredUsernameInput) {
    let uname = msg[0];
    let _block;
    if (uname.startsWith("https://github.com/")) {
      let u = uname.slice(19);
      _block = u;
    } else {
      let u = uname;
      _block = u;
    }
    let user_name = _block;
    if (state instanceof ConfigLoaded) {
      let owner_type = state.owner_type;
      return [
        (() => {
          let _record = model;
          return new Model2(
            _record.config,
            new ConfigLoaded(
              (() => {
                let _pipe = user_name;
                return new Some(_pipe);
              })(),
              owner_type,
              false
            ),
            _record.author_color_classes,
            _record.debug
          );
        })(),
        none()
      ];
    } else if (state instanceof WithChanges) {
      let owner_type = state.owner_type;
      return [
        (() => {
          let _record = model;
          return new Model2(
            _record.config,
            new ConfigLoaded(
              (() => {
                let _pipe = user_name;
                return new Some(_pipe);
              })(),
              owner_type,
              false
            ),
            _record.author_color_classes,
            _record.debug
          );
        })(),
        none()
      ];
    } else if (state instanceof WithChangesError) {
      let owner_type = state.owner_type;
      return [
        (() => {
          let _record = model;
          return new Model2(
            _record.config,
            new ConfigLoaded(
              (() => {
                let _pipe = user_name;
                return new Some(_pipe);
              })(),
              owner_type,
              false
            ),
            _record.author_color_classes,
            _record.debug
          );
        })(),
        none()
      ];
    } else if (state instanceof WithRepos) {
      let owner_type = state.owner_type;
      return [
        (() => {
          let _record = model;
          return new Model2(
            _record.config,
            new ConfigLoaded(
              (() => {
                let _pipe = user_name;
                return new Some(_pipe);
              })(),
              owner_type,
              false
            ),
            _record.author_color_classes,
            _record.debug
          );
        })(),
        none()
      ];
    } else if (state instanceof WithReposError) {
      let owner_type = state.owner_type;
      return [
        (() => {
          let _record = model;
          return new Model2(
            _record.config,
            new ConfigLoaded(
              (() => {
                let _pipe = user_name;
                return new Some(_pipe);
              })(),
              owner_type,
              false
            ),
            _record.author_color_classes,
            _record.debug
          );
        })(),
        none()
      ];
    } else if (state instanceof WithTags) {
      let owner_type = state.owner_type;
      return [
        (() => {
          let _record = model;
          return new Model2(
            _record.config,
            new ConfigLoaded(
              (() => {
                let _pipe = user_name;
                return new Some(_pipe);
              })(),
              owner_type,
              false
            ),
            _record.author_color_classes,
            _record.debug
          );
        })(),
        none()
      ];
    } else if (state instanceof WithTagsError) {
      let owner_type = state.owner_type;
      return [
        (() => {
          let _record = model;
          return new Model2(
            _record.config,
            new ConfigLoaded(
              (() => {
                let _pipe = user_name;
                return new Some(_pipe);
              })(),
              owner_type,
              false
            ),
            _record.author_color_classes,
            _record.debug
          );
        })(),
        none()
      ];
    } else if (state instanceof Initial) {
      return zero;
    } else {
      return zero;
    }
  } else if (msg instanceof UserRequestedRepos) {
    if (state instanceof ConfigLoaded) {
      let maybe_user_name = state.user_name;
      let owner_type = state.owner_type;
      let fetching_repos = state.fetching_repos;
      if (fetching_repos) {
        return zero;
      } else if (maybe_user_name instanceof None) {
        return zero;
      } else {
        let user_name = maybe_user_name[0];
        return [
          (() => {
            let _record = model;
            return new Model2(
              _record.config,
              new ConfigLoaded(
                (() => {
                  let _pipe = user_name;
                  return new Some(_pipe);
                })(),
                owner_type,
                true
              ),
              _record.author_color_classes,
              _record.debug
            );
          })(),
          (() => {
            let _pipe = user_name;
            return fetch_repos(_pipe, owner_type);
          })()
        ];
      }
    } else if (state instanceof WithChanges) {
      let user_name = state.user_name;
      let owner_type = state.owner_type;
      return [
        (() => {
          let _record = model;
          return new Model2(
            _record.config,
            new ConfigLoaded(
              (() => {
                let _pipe = user_name;
                return new Some(_pipe);
              })(),
              owner_type,
              true
            ),
            _record.author_color_classes,
            _record.debug
          );
        })(),
        (() => {
          let _pipe = user_name;
          return fetch_repos(_pipe, owner_type);
        })()
      ];
    } else if (state instanceof WithChangesError) {
      let user_name = state.user_name;
      let owner_type = state.owner_type;
      return [
        (() => {
          let _record = model;
          return new Model2(
            _record.config,
            new ConfigLoaded(
              (() => {
                let _pipe = user_name;
                return new Some(_pipe);
              })(),
              owner_type,
              true
            ),
            _record.author_color_classes,
            _record.debug
          );
        })(),
        (() => {
          let _pipe = user_name;
          return fetch_repos(_pipe, owner_type);
        })()
      ];
    } else if (state instanceof WithRepos) {
      let user_name = state.user_name;
      let owner_type = state.owner_type;
      return [
        (() => {
          let _record = model;
          return new Model2(
            _record.config,
            new ConfigLoaded(
              (() => {
                let _pipe = user_name;
                return new Some(_pipe);
              })(),
              owner_type,
              true
            ),
            _record.author_color_classes,
            _record.debug
          );
        })(),
        (() => {
          let _pipe = user_name;
          return fetch_repos(_pipe, owner_type);
        })()
      ];
    } else if (state instanceof WithReposError) {
      let user_name = state.user_name;
      let owner_type = state.owner_type;
      return [
        (() => {
          let _record = model;
          return new Model2(
            _record.config,
            new ConfigLoaded(
              (() => {
                let _pipe = user_name;
                return new Some(_pipe);
              })(),
              owner_type,
              true
            ),
            _record.author_color_classes,
            _record.debug
          );
        })(),
        (() => {
          let _pipe = user_name;
          return fetch_repos(_pipe, owner_type);
        })()
      ];
    } else if (state instanceof WithTags) {
      let user_name = state.user_name;
      let owner_type = state.owner_type;
      return [
        (() => {
          let _record = model;
          return new Model2(
            _record.config,
            new ConfigLoaded(
              (() => {
                let _pipe = user_name;
                return new Some(_pipe);
              })(),
              owner_type,
              true
            ),
            _record.author_color_classes,
            _record.debug
          );
        })(),
        (() => {
          let _pipe = user_name;
          return fetch_repos(_pipe, owner_type);
        })()
      ];
    } else if (state instanceof WithTagsError) {
      let user_name = state.user_name;
      let owner_type = state.owner_type;
      return [
        (() => {
          let _record = model;
          return new Model2(
            _record.config,
            new ConfigLoaded(
              (() => {
                let _pipe = user_name;
                return new Some(_pipe);
              })(),
              owner_type,
              true
            ),
            _record.author_color_classes,
            _record.debug
          );
        })(),
        (() => {
          let _pipe = user_name;
          return fetch_repos(_pipe, owner_type);
        })()
      ];
    } else if (state instanceof ConfigError) {
      return zero;
    } else {
      return zero;
    }
  } else if (msg instanceof ReposFetched) {
    let r = msg[0];
    if (state instanceof ConfigLoaded) {
      let maybe_user_name = state.user_name;
      let owner_type = state.owner_type;
      let fetching_repos = state.fetching_repos;
      if (!fetching_repos) {
        return zero;
      } else if (maybe_user_name instanceof None) {
        return zero;
      } else {
        let user_name = maybe_user_name[0];
        if (!r.isOk()) {
          let error = r[0];
          return [
            (() => {
              let _record = model;
              return new Model2(
                _record.config,
                new WithReposError(user_name, owner_type, error),
                _record.author_color_classes,
                _record.debug
              );
            })(),
            none()
          ];
        } else {
          let repos = r[0];
          return [
            (() => {
              let _record = model;
              return new Model2(
                _record.config,
                new WithRepos(
                  user_name,
                  owner_type,
                  repos,
                  new None(),
                  false,
                  new None()
                ),
                _record.author_color_classes,
                _record.debug
              );
            })(),
            none()
          ];
        }
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
      let _record = model;
      _block$1 = new Model2(
        _record.config,
        (() => {
          let _record$1 = state;
          return new WithRepos(
            _record$1.user_name,
            _record$1.owner_type,
            _record$1.repos,
            query,
            _record$1.fetching_tags,
            _record$1.selected_repo
          );
        })(),
        _record.author_color_classes,
        _record.debug
      );
    } else if (state instanceof WithTagsError) {
      let _record = model;
      _block$1 = new Model2(
        _record.config,
        (() => {
          let _record$1 = state;
          return new WithTagsError(
            _record$1.user_name,
            _record$1.owner_type,
            _record$1.repos,
            query,
            _record$1.repo,
            _record$1.error
          );
        })(),
        _record.author_color_classes,
        _record.debug
      );
    } else if (state instanceof WithTags) {
      let _record = model;
      _block$1 = new Model2(
        _record.config,
        (() => {
          let _record$1 = state;
          return new WithTags(
            _record$1.user_name,
            _record$1.owner_type,
            _record$1.repos,
            query,
            _record$1.repo,
            _record$1.tags,
            _record$1.start_tag,
            _record$1.end_tag,
            _record$1.fetching_changes
          );
        })(),
        _record.author_color_classes,
        _record.debug
      );
    } else if (state instanceof WithChangesError) {
      let _record = model;
      _block$1 = new Model2(
        _record.config,
        (() => {
          let _record$1 = state;
          return new WithChangesError(
            _record$1.user_name,
            _record$1.owner_type,
            _record$1.repos,
            query,
            _record$1.repo,
            _record$1.tags,
            _record$1.start_tag,
            _record$1.end_tag,
            _record$1.error
          );
        })(),
        _record.author_color_classes,
        _record.debug
      );
    } else if (state instanceof WithChanges) {
      let _record = model;
      _block$1 = new Model2(
        _record.config,
        (() => {
          let _record$1 = state;
          return new WithChanges(
            _record$1.user_name,
            _record$1.owner_type,
            _record$1.repos,
            query,
            _record$1.repo,
            _record$1.tags,
            _record$1.start_tag,
            _record$1.end_tag,
            _record$1.changes,
            _record$1.commits_filter,
            _record$1.files_filter
          );
        })(),
        _record.author_color_classes,
        _record.debug
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
      if (state instanceof WithChanges) {
        let user_name = state.user_name;
        let owner_type = state.owner_type;
        let repos = state.repos;
        let repo_filter_query = state.repo_filter_query;
        return [
          (() => {
            let _record = model;
            return new Model2(
              _record.config,
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
              _record.author_color_classes,
              _record.debug
            );
          })(),
          none()
        ];
      } else if (state instanceof WithChangesError) {
        let user_name = state.user_name;
        let owner_type = state.owner_type;
        let repos = state.repos;
        let repo_filter_query = state.repo_filter_query;
        return [
          (() => {
            let _record = model;
            return new Model2(
              _record.config,
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
              _record.author_color_classes,
              _record.debug
            );
          })(),
          none()
        ];
      } else if (state instanceof WithRepos) {
        let user_name = state.user_name;
        let owner_type = state.owner_type;
        let repos = state.repos;
        let repo_filter_query = state.repo_filter_query;
        return [
          (() => {
            let _record = model;
            return new Model2(
              _record.config,
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
              _record.author_color_classes,
              _record.debug
            );
          })(),
          none()
        ];
      } else if (state instanceof WithTags) {
        let user_name = state.user_name;
        let owner_type = state.owner_type;
        let repos = state.repos;
        let repo_filter_query = state.repo_filter_query;
        return [
          (() => {
            let _record = model;
            return new Model2(
              _record.config,
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
              _record.author_color_classes,
              _record.debug
            );
          })(),
          none()
        ];
      } else if (state instanceof WithTagsError) {
        let user_name = state.user_name;
        let owner_type = state.owner_type;
        let repos = state.repos;
        let repo_filter_query = state.repo_filter_query;
        return [
          (() => {
            let _record = model;
            return new Model2(
              _record.config,
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
              _record.author_color_classes,
              _record.debug
            );
          })(),
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
          (() => {
            let _record = model;
            return new Model2(
              _record.config,
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
              _record.author_color_classes,
              _record.debug
            );
          })(),
          fetch_tags(user_name, repo)
        ];
      } else if (state instanceof WithTagsError) {
        let user_name = state.user_name;
        let owner_type = state.owner_type;
        let repos = state.repos;
        let repo_filter_query = state.repo_filter_query;
        return [
          (() => {
            let _record = model;
            return new Model2(
              _record.config,
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
              _record.author_color_classes,
              _record.debug
            );
          })(),
          fetch_tags(user_name, repo)
        ];
      } else if (state instanceof WithTags) {
        let user_name = state.user_name;
        let owner_type = state.owner_type;
        let repos = state.repos;
        let repo_filter_query = state.repo_filter_query;
        return [
          (() => {
            let _record = model;
            return new Model2(
              _record.config,
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
              _record.author_color_classes,
              _record.debug
            );
          })(),
          fetch_tags(user_name, repo)
        ];
      } else if (state instanceof WithChangesError) {
        let user_name = state.user_name;
        let owner_type = state.owner_type;
        let repos = state.repos;
        let repo_filter_query = state.repo_filter_query;
        return [
          (() => {
            let _record = model;
            return new Model2(
              _record.config,
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
              _record.author_color_classes,
              _record.debug
            );
          })(),
          fetch_tags(user_name, repo)
        ];
      } else if (state instanceof WithChanges) {
        let user_name = state.user_name;
        let owner_type = state.owner_type;
        let repos = state.repos;
        let repo_filter_query = state.repo_filter_query;
        return [
          (() => {
            let _record = model;
            return new Model2(
              _record.config,
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
              _record.author_color_classes,
              _record.debug
            );
          })(),
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
      if (!result.isOk()) {
        let error = result[0];
        return [
          (() => {
            let _record = model;
            return new Model2(
              _record.config,
              new WithTagsError(
                user_name,
                owner_type,
                repos,
                repo_filter_query,
                repo,
                error
              ),
              _record.author_color_classes,
              _record.debug
            );
          })(),
          none()
        ];
      } else {
        let tags = result[0];
        return [
          (() => {
            let _record = model;
            return new Model2(
              _record.config,
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
              _record.author_color_classes,
              _record.debug
            );
          })(),
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
        (() => {
          let _record = model;
          return new Model2(
            _record.config,
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
            _record.author_color_classes,
            _record.debug
          );
        })(),
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
        (() => {
          let _record = model;
          return new Model2(
            _record.config,
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
            _record.author_color_classes,
            _record.debug
          );
        })(),
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
        (() => {
          let _record = model;
          return new Model2(
            _record.config,
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
            _record.author_color_classes,
            _record.debug
          );
        })(),
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
        (() => {
          let _record = model;
          return new Model2(
            _record.config,
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
            _record.author_color_classes,
            _record.debug
          );
        })(),
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
        (() => {
          let _record = model;
          return new Model2(
            _record.config,
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
            _record.author_color_classes,
            _record.debug
          );
        })(),
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
        (() => {
          let _record = model;
          return new Model2(
            _record.config,
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
            _record.author_color_classes,
            _record.debug
          );
        })(),
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
      if ($ instanceof Some && $1 instanceof Some) {
        let start3 = $[0];
        let end = $1[0];
        return [
          (() => {
            let _record = model;
            return new Model2(
              _record.config,
              (() => {
                let _record$1 = state;
                return new WithTags(
                  _record$1.user_name,
                  _record$1.owner_type,
                  _record$1.repos,
                  _record$1.repo_filter_query,
                  _record$1.repo,
                  _record$1.tags,
                  _record$1.start_tag,
                  _record$1.end_tag,
                  true
                );
              })(),
              _record.author_color_classes,
              _record.debug
            );
          })(),
          fetch_changes(user_name, repo, start3, end)
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
      if (!result.isOk()) {
        let error = result[0];
        return [
          (() => {
            let _record = model;
            return new Model2(
              _record.config,
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
              _record.author_color_classes,
              _record.debug
            );
          })(),
          none()
        ];
      } else {
        let changes = result[0];
        return [
          (() => {
            let _record = model;
            return new Model2(
              _record.config,
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
              _record.author_color_classes,
              _record.debug
            );
          })(),
          scroll_element_into_view(
            (() => {
              let _pipe = new CommitsSection();
              return section_id(_pipe);
            })()
          )
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
        (() => {
          let _record = model;
          return new Model2(
            _record.config,
            (() => {
              let _record$1 = state;
              return new WithChanges(
                _record$1.user_name,
                _record$1.owner_type,
                _record$1.repos,
                _record$1.repo_filter_query,
                _record$1.repo,
                _record$1.tags,
                _record$1.start_tag,
                _record$1.end_tag,
                _record$1.changes,
                filter3,
                _record$1.files_filter
              );
            })(),
            _record.author_color_classes,
            _record.debug
          );
        })(),
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
        (() => {
          let _record = model;
          return new Model2(
            _record.config,
            (() => {
              let _record$1 = state;
              return new WithChanges(
                _record$1.user_name,
                _record$1.owner_type,
                _record$1.repos,
                _record$1.repo_filter_query,
                _record$1.repo,
                _record$1.tags,
                _record$1.start_tag,
                _record$1.end_tag,
                _record$1.changes,
                _record$1.commits_filter,
                filter3
              );
            })(),
            _record.author_color_classes,
            _record.debug
          );
        })(),
        none()
      ];
    } else {
      return zero;
    }
  }
}

// build/dev/javascript/lustre/lustre/element/html.mjs
function text2(content) {
  return text(content);
}
function div(attrs, children2) {
  return element("div", attrs, children2);
}
function p(attrs, children2) {
  return element("p", attrs, children2);
}
function pre(attrs, children2) {
  return element("pre", attrs, children2);
}
function a(attrs, children2) {
  return element("a", attrs, children2);
}
function span(attrs, children2) {
  return element("span", attrs, children2);
}
function button(attrs, children2) {
  return element("button", attrs, children2);
}
function input(attrs) {
  return element("input", attrs, toList([]));
}
function label(attrs, children2) {
  return element("label", attrs, children2);
}
function option(attrs, label2) {
  return element("option", attrs, toList([text(label2)]));
}
function select(attrs, children2) {
  return element("select", attrs, children2);
}

// build/dev/javascript/lustre/lustre/event.mjs
function on2(name2, handler) {
  return on(name2, handler);
}
function on_click(msg) {
  return on2("click", (_) => {
    return new Ok(msg);
  });
}
function value3(event2) {
  let _pipe = event2;
  return field("target", field("value", string2))(
    _pipe
  );
}
function on_input(msg) {
  return on2(
    "input",
    (event2) => {
      let _pipe = value3(event2);
      return map3(_pipe, msg);
    }
  );
}
function checked2(event2) {
  let _pipe = event2;
  return field("target", field("checked", bool))(
    _pipe
  );
}
function on_check(msg) {
  return on2(
    "change",
    (event2) => {
      let _pipe = checked2(event2);
      return map3(_pipe, msg);
    }
  );
}

// build/dev/javascript/ghch/view.mjs
var Start = class extends CustomType {
};
var End = class extends CustomType {
};
function main_div_class(theme) {
  if (theme instanceof Dark) {
    return "bg-[#282828] text-[#fbf1c7]";
  } else {
    return "bg-[#ffffff] text-[#282828]";
  }
}
function debug_section(model) {
  let $ = model.debug;
  if (!$) {
    return none2();
  } else {
    let _block;
    let $1 = model.config.theme;
    if ($1 instanceof Dark) {
      _block = "border-[#fabd2f]";
    } else {
      _block = "border-[#8ec07c]";
    }
    let div_class = _block;
    return div(
      toList([
        class$("mt-8 " + div_class),
        id("debug-section")
      ]),
      toList([
        p(
          toList([class$("text-xl font-semibold")]),
          toList([
            (() => {
              let _pipe = "Debug";
              return text(_pipe);
            })()
          ])
        ),
        pre(
          toList([
            class$(
              "mt-2 p-4 border-2 border-opacity-50 text-wrap " + div_class
            ),
            id("debug-section")
          ]),
          toList([
            (() => {
              let _pipe = model;
              let _pipe$1 = display_model(_pipe);
              return text(_pipe$1);
            })()
          ])
        )
      ])
    );
  }
}
function heading(theme) {
  let _block;
  if (theme instanceof Dark) {
    _block = "text-[#e5d9f2]";
  } else {
    _block = "text-[#564592]";
  }
  let heading_class = _block;
  let _block$1;
  if (theme instanceof Dark) {
    _block$1 = "bg-[#e5d9f2] text-[#282828]";
  } else {
    _block$1 = "bg-[#282828] text-[#ffffff]";
  }
  let tooltip_class = _block$1;
  return div(
    toList([class$("flex gap-4 items-center")]),
    toList([
      p(
        toList([class$("text-4xl font-semibold " + heading_class)]),
        toList([
          (() => {
            let _pipe = "ghch";
            return text(_pipe);
          })()
        ])
      ),
      (() => {
        let $ = public$;
        if (!$) {
          return none2();
        } else {
          return div(
            toList([class$("relative group")]),
            toList([
              p(
                toList([class$("text-md " + heading_class)]),
                toList([
                  (() => {
                    let _pipe = "(unauthenticated public version)";
                    return text(_pipe);
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
                    let _pipe = "Github might rate limit you after a while; use the command line version of ghch to make authenticated calls or to fetch non-public data";
                    return text(_pipe);
                  })()
                ])
              )
            ])
          );
        }
      })()
    ])
  );
}
function config_error_section(error, theme) {
  let _block;
  if (theme instanceof Dark) {
    _block = "text-[#fb4934]";
  } else {
    _block = "text-[#cc241d]";
  }
  let error_class = _block;
  let _block$1;
  if (theme instanceof Dark) {
    _block$1 = "border-[#fb4934]";
  } else {
    _block$1 = "border-[#cc241d]";
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
            return text(_pipe);
          })()
        ])
      ),
      pre(
        toList([class$("mt-2 p-1 text-wrap")]),
        toList([
          text(
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
  if (theme instanceof Dark) {
    if (section instanceof OwnerSection) {
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
  } else {
    if (section instanceof OwnerSection) {
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
  }
}
function owner_type_radio(owner_type, checked3) {
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
          checked(checked3),
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
          text2(
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
    toList([class$("flex flex-wrap gap-2 items-center ml-2")]),
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
    if (theme instanceof Dark) {
      return "text-[#282828] placeholder-[#3d3d3d]";
    } else {
      return "placeholder-[#3d3d3d]";
    }
  })() + " " + section_bg_class(new OwnerSection(), theme);
  let _block;
  if (theme instanceof Dark) {
    _block = "bg-[#817ffc] text-[#282828]";
  } else {
    _block = "bg-[#ada9fd]";
  }
  let button_class = _block;
  let _block$1;
  if (owner_type instanceof Org) {
    _block$1 = "org name";
  } else {
    _block$1 = "username";
  }
  let placeholder2 = _block$1;
  return div(
    toList([
      class$(
        "mt-8 p-4 border-2 border-[#a594f9] border-opacity-50\n        border-dotted"
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
        toList([class$("text-xl")]),
        toList([
          (() => {
            let _pipe = "owner";
            return text(_pipe);
          })()
        ])
      ),
      div(
        toList([class$("flex flex-wrap gap-2 items-center mt-2")]),
        toList([
          input(
            toList([
              class$("px-4 py-1 my-2 font-semibold " + input_class),
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
            toList([text("fetch repos")])
          ),
          (() => {
            let _pipe = owner_type;
            return owner_type_selector(_pipe);
          })(),
          button(
            toList([
              on_click(new UserChangedTheme()),
              class$("ml-4 py-1")
            ]),
            toList([
              text(
                (() => {
                  let _pipe = theme;
                  return theme_to_string(_pipe);
                })()
              )
            ])
          )
        ])
      )
    ])
  );
}
function repos_error_section(error, owner_type, theme) {
  let _block;
  if (theme instanceof Dark) {
    _block = "text-[#fb4934]";
  } else {
    _block = "text-[#cc241d]";
  }
  let error_class = _block;
  let _block$1;
  if (theme instanceof Dark) {
    _block$1 = "border-[#fb4934]";
  } else {
    _block$1 = "border-[#cc241d]";
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
            return text(_pipe);
          })()
        ])
      ),
      pre(
        toList([class$("mt-2 p-1 text-wrap")]),
        toList([
          text(
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
  if (!fetching_repos) {
    return none2();
  } else {
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
              return text(_pipe);
            })()
          ])
        )
      ])
    );
  }
}
function repo_select_button(repo, selected2, theme) {
  let _block;
  if (theme instanceof Dark) {
    _block = "text-[#8caaee] disabled:bg-[#8caaee] disabled:text-[#282828] hover:text-[#282828] hover:bg-[#c6d0f5]";
  } else {
    _block = "text-[#282828] disabled:bg-[#ff9fb2] hover:bg-[#fbdce2]";
  }
  let class$2 = _block;
  return button(
    toList([
      id("reset-filter"),
      class$(
        "text-sm font-semibold mr-2 px-2 py-1 my-1 text-[#232634] " + class$2
      ),
      disabled(selected2),
      on_click(new RepoChosen(repo.name))
    ]),
    toList([text(repo.name)])
  );
}
function fetching_tags_section(fetching_tags) {
  if (!fetching_tags) {
    return none2();
  } else {
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
              return text(_pipe);
            })()
          ])
        )
      ])
    );
  }
}
function tags_error_section(error, theme) {
  let _block;
  if (theme instanceof Dark) {
    _block = "text-[#fb4934]";
  } else {
    _block = "text-[#cc241d]";
  }
  let error_class = _block;
  let _block$1;
  if (theme instanceof Dark) {
    _block$1 = "border-[#fb4934]";
  } else {
    _block$1 = "border-[#cc241d]";
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
            return text(_pipe);
          })()
        ])
      ),
      pre(
        toList([class$("mt-2 p-1 text-wrap")]),
        toList([
          text(
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
function tag_option(value4, label2, selected_value) {
  let _block;
  let _pipe = selected_value;
  let _pipe$1 = map(_pipe, (s) => {
    return s === value4;
  });
  _block = unwrap(_pipe$1, false);
  let is_selected = _block;
  return option(
    toList([
      value(value4),
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
  if (theme instanceof Dark) {
    _block = "bg-[#788bff] text-[#282828]";
  } else {
    _block = "bg-[#9bb1ff] text-[#282828]";
  }
  let select_class = _block;
  return select(
    toList([
      class$("py-1 px-2 font-semibold " + select_class),
      name("tags"),
      on_input(
        (() => {
          if (tag_type instanceof End) {
            return (var0) => {
              return new EndTagChosen(var0);
            };
          } else {
            return (var0) => {
              return new StartTagChosen(var0);
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
            if (tag_type instanceof End) {
              return "-- choose end tag --";
            } else {
              return "-- choose start tag --";
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
                return text(_pipe);
              })()
            ])
          )
        ]);
      } else {
        return toList([
          p(
            toList([class$("text-xl")]),
            toList([
              (() => {
                let _pipe = "tags";
                return text(_pipe);
              })()
            ])
          ),
          div(
            toList([class$("mt-4 flex flex-wrap gap-2 items-center")]),
            (() => {
              if (start_tag instanceof None) {
                return toList([
                  (() => {
                    let _pipe = tags;
                    return tag_select(_pipe, new Start(), start_tag, theme);
                  })()
                ]);
              } else if (start_tag instanceof Some && end_tag instanceof None) {
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
              } else {
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
                    toList([text("fetch changes")])
                  )
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
  if (theme instanceof Dark) {
    _block = "text-[#fb4934]";
  } else {
    _block = "text-[#cc241d]";
  }
  let error_class = _block;
  let _block$1;
  if (theme instanceof Dark) {
    _block$1 = "border-[#fb4934]";
  } else {
    _block$1 = "border-[#cc241d]";
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
            return text(_pipe);
          })()
        ])
      ),
      pre(
        toList([class$("mt-2 p-1 text-wrap")]),
        toList([
          text(
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
      let _pipe = commit.details.author.name;
      let _pipe$1 = lowercase(_pipe);
      return contains_string(
        _pipe$1,
        (() => {
          let _pipe$2 = query;
          return lowercase(_pipe$2);
        })()
      );
    })() || (() => {
      let _pipe = commit.details.author.email;
      let _pipe$1 = lowercase(_pipe);
      return contains_string(
        _pipe$1,
        (() => {
          let _pipe$2 = query;
          return lowercase(_pipe$2);
        })()
      );
    })();
  };
}
function author_color_class(input2, colors, fallback) {
  let hash = simple_hash(input2);
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
}
function get_commit_relative_time(ts, now) {
  return (() => {
    let _pipe = difference(ts, now);
    return humanize_duration(_pipe);
  })() + " ago";
}
function commit_details(commit, author_color_class_store, theme) {
  let _block;
  if (theme instanceof Dark) {
    _block = [
      "text-[#c77dff]",
      (() => {
        let _pipe2 = commit.details.author.name;
        return author_color_class(
          _pipe2,
          author_color_class_store,
          "text-[#ff9500]"
        );
      })(),
      "text-[#ff6d44]"
    ];
  } else {
    _block = [
      "text-[#995f6a]",
      (() => {
        let _pipe2 = commit.details.author.name;
        return author_color_class(
          _pipe2,
          author_color_class_store,
          "text-[#941b0c]"
        );
      })(),
      "text-[#2ec0f9]"
    ];
  }
  let $ = _block;
  let sha_class = $[0];
  let author_class = $[1];
  let timestamp_class = $[2];
  let _block$1;
  let $1 = (() => {
    let _pipe2 = commit.sha;
    return string_length(_pipe2);
  })();
  if ($1 >= 8) {
    let n = $1;
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
                return text(_pipe$3);
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
            return text(_pipe$3);
          })()
        ])
      ),
      span(
        toList([class$(author_class)]),
        toList([
          (() => {
            let _pipe$3 = commit.details.author.name;
            return text(_pipe$3);
          })()
        ])
      ),
      (() => {
        let $2 = commit.details.author.authoring_timestamp;
        if ($2 instanceof None) {
          return none2();
        } else {
          let ts = $2[0];
          return span(
            toList([class$(timestamp_class)]),
            toList([
              (() => {
                let _pipe$3 = ts;
                let _pipe$4 = get_commit_relative_time(_pipe$3, now);
                return text(_pipe$4);
              })()
            ])
          );
        }
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
    let _block;
    if (commits_filter_query instanceof None) {
      _block = commits;
    } else {
      let q = commits_filter_query[0];
      let _pipe = commits;
      _block = filter(_pipe, filter_commit_predicate(q));
    }
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
          toList([class$("text-xl")]),
          toList([
            (() => {
              let _pipe = "commits " + start_tag + "..." + end_tag;
              return text(_pipe);
            })()
          ])
        ),
        input(
          toList([
            class$(
              "mt-4 font-semibold h-8 text-[#232634] placeholder-[#3d3d3d] pl-2 " + section_bg_class(
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
          toList([class$("mt-4 overflow-x-auto")]),
          (() => {
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
  if (theme instanceof Dark) {
    return "#a594f940 #282828";
  } else {
    return "#a594f940 #ffffff";
  }
}
function repo_selection_section(repos, maybe_filter_query, maybe_selected_repo, theme) {
  let _block;
  let _pipe = new ReposSection();
  _block = section_bg_class(_pipe, theme);
  let filter_class = _block;
  let _block$1;
  if (maybe_filter_query instanceof None) {
    _block$1 = repos;
  } else {
    let filter_query = maybe_filter_query[0];
    let _pipe$1 = repos;
    _block$1 = filter(
      _pipe$1,
      (repo) => {
        let _pipe$2 = repo.name;
        let _pipe$3 = lowercase(_pipe$2);
        return contains_string(
          _pipe$3,
          (() => {
            let _pipe$4 = filter_query;
            return lowercase(_pipe$4);
          })()
        );
      }
    );
  }
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
        toList([class$("text-xl")]),
        toList([
          (() => {
            let _pipe$1 = "repos";
            return text(_pipe$1);
          })()
        ])
      ),
      input(
        toList([
          class$(
            "mt-4 font-semibold h-8 text-[#282828] placeholder-[#3d3d3d] pl-2 " + filter_class
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
          style(
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
  if (theme instanceof Dark) {
    if (status instanceof Added) {
      _block = "bg-[#7cea9c]";
    } else if (status instanceof Changed) {
      _block = "bg-[#fdb3ae]";
    } else if (status instanceof Copied) {
      _block = "bg-[#d0f4de]";
    } else if (status instanceof Modified) {
      _block = "bg-[#ffc300]";
    } else if (status instanceof Removed) {
      _block = "bg-[#ff4365]";
    } else if (status instanceof Renamed) {
      _block = "bg-[#dfa8a9]";
    } else {
      _block = "bg-[#e5d9f2]";
    }
  } else {
    if (status instanceof Added) {
      _block = "bg-[#a3f0b9]";
    } else if (status instanceof Changed) {
      _block = "bg-[#fdc9c6]";
    } else if (status instanceof Copied) {
      _block = "bg-[#def7e7]";
    } else if (status instanceof Modified) {
      _block = "bg-[#ffe17f]";
    } else if (status instanceof Removed) {
      _block = "bg-[#ff8ea2]";
    } else if (status instanceof Renamed) {
      _block = "bg-[#ebcacb]";
    } else {
      _block = "bg-[#efe8f7]";
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
        return text(_pipe$1);
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
  if (theme instanceof Dark) {
    _block$2 = ["text-[#affc41]", "text-[#ff4365]"];
  } else {
    _block$2 = ["text-[#068360]", "text-[#cc3550]"];
  }
  let $ = _block$2;
  let additions_class = $[0];
  let deletions_class = $[1];
  return div(
    toList([class$("flex gap-2")]),
    toList([
      span(
        toList([
          class$(
            "px-2 py-1 text-sm font-semibold w-16 " + additions_class
          )
        ]),
        toList([
          (() => {
            let _pipe = additions_text;
            return text(_pipe);
          })()
        ])
      ),
      span(
        toList([
          class$(
            "px-2 py-1 text-sm font-semibold w-16 " + deletions_class
          )
        ]),
        toList([
          (() => {
            let _pipe = deletions_text;
            return text(_pipe);
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
                return text(_pipe);
              })()
            ])
          )
        ])
      )
    ])
  );
}
function files_section(maybe_files, files_filter_query, theme) {
  if (maybe_files instanceof None) {
    return none2();
  } else if (maybe_files instanceof Some && maybe_files[0].hasLength(0)) {
    return none2();
  } else {
    let files = maybe_files[0];
    let _block;
    if (files_filter_query instanceof None) {
      _block = files;
    } else {
      let q = files_filter_query[0];
      let _pipe = files;
      _block = filter(_pipe, filter_file_predicate(q));
    }
    return div(
      toList([
        class$(
          "mt-4 p-4 border-2 border-[#a594f9] border-opacity-50 border-dotted"
        ),
        style(
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
          toList([class$("text-xl")]),
          toList([
            (() => {
              let _pipe = "files";
              return text(_pipe);
            })()
          ])
        ),
        input(
          toList([
            class$(
              "mt-4 font-semibold h-8 text-[#282828] placeholder-[#3d3d3d] pl-2 " + section_bg_class(
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
          toList([class$("mt-4 overflow-x-auto")]),
          (() => {
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
        return text(_pipe$1);
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
    if ($1.hasLength(0) && $2 instanceof None) {
      _block = [true, true, true, false, false];
    } else if ($1.hasLength(0) && $2 instanceof Some && $2[0].hasLength(0)) {
      _block = [true, true, true, false, false];
    } else if ($1.hasLength(0) && $2 instanceof Some) {
      _block = [true, true, true, false, true];
    } else if ($2 instanceof None) {
      _block = [true, true, true, true, false];
    } else if ($2 instanceof Some && $2[0].hasLength(0)) {
      _block = [true, true, true, true, false];
    } else {
      _block = [true, true, true, true, true];
    }
  }
  let $ = _block;
  let o = $[0];
  let r = $[1];
  let t = $[2];
  let c = $[3];
  let f = $[4];
  let _block$1;
  if (theme instanceof Dark) {
    _block$1 = "bg-[#282828]";
  } else {
    _block$1 = "bg-[#ffffff]";
  }
  let footer_class = _block$1;
  return div(
    toList([
      class$(
        "fixed bottom-0 w-full px-2 pt-4 font-semibold text-[#282828] max-sm:hidden " + footer_class
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
              let section = data[0];
              let enabled = data[1];
              return navigation_button(section, theme, enabled);
            }
          );
        })()
      )
    ])
  );
}
function main_section(model) {
  let theme = model.config.theme;
  return div(
    toList([]),
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
          })(),
          (() => {
            let _pipe = model.state;
            return navigation_bar(_pipe, theme);
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
          })(),
          (() => {
            let _pipe = model.state;
            return navigation_bar(_pipe, theme);
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
          })(),
          (() => {
            let _pipe = model.state;
            return navigation_bar(_pipe, theme);
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
          })(),
          (() => {
            let _pipe = model.state;
            return navigation_bar(_pipe, theme);
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
          ),
          (() => {
            let _pipe = model.state;
            return navigation_bar(_pipe, theme);
          })()
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
          })(),
          (() => {
            let _pipe = model.state;
            return navigation_bar(_pipe, theme);
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
                if (theme instanceof Dark) {
                  return model.author_color_classes.dark;
                } else {
                  return model.author_color_classes.light;
                }
              })(),
              theme
            );
          })(),
          (() => {
            let _pipe = changes.files;
            return files_section(_pipe, files_filter, theme);
          })(),
          (() => {
            let _pipe = model.state;
            return navigation_bar(_pipe, theme);
          })()
        ]);
      }
    })()
  );
}
function view(model) {
  return div(
    toList([
      class$(
        "min-h-screen " + (() => {
          let _pipe = model.config.theme;
          return main_div_class(_pipe);
        })()
      )
    ]),
    toList([
      div(
        toList([class$("pt-10 pb-20 w-4/5 max-sm:w-5/6 mx-auto")]),
        toList([
          (() => {
            let _pipe = model;
            return main_section(_pipe);
          })(),
          (() => {
            let _pipe = model;
            return debug_section(_pipe);
          })()
        ])
      )
    ])
  );
}

// build/dev/javascript/ghch/ghch.mjs
function init2(_) {
  let _block;
  let $ = public$;
  if (!$) {
    _block = fetch_initial_config();
  } else {
    _block = fetch_repos_for_public_version();
  }
  let init_effect = _block;
  return [init_model(), init_effect];
}
function main() {
  let app = application(init2, update, view);
  let $ = start2(app, "#app", void 0);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "ghch",
      11,
      "main",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  return $;
}

// build/.lustre/entry.mjs
main();
