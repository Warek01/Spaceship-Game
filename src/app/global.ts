declare global {
  interface Array<T> {
    has(item: T): boolean;
  }
}

Array.prototype.has = function <T>(item: T) {
  let i = this.length;

  while (--i) if (this[i] === item) return true;

  return false;
};

export default {};
