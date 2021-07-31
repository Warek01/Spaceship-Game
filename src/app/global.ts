declare global {
  interface Array<T> {
    has(item: T): boolean;
  }
}

Array.prototype.has = function <T>(toFind: T) {
  return this.findIndex((item) => item === toFind) >= 0;
};

export default {};
