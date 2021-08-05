declare global {
  interface Array<T> {
    has(item: T): boolean;
  }
}

Array.prototype.has = function <T>(toFind: T | T[]): boolean {
  if (Array.isArray(toFind)) {
    let map: any = {};

    for (const elem of this) if (!map[elem]) map[elem] = true;
    for (const elem of toFind) if (map[elem]) return true;

    return false;
  } else return this.findIndex((item) => item === toFind) >= 0;
};

/** Returns if item is equal to at least one of parameters            
 * Alias:                              
 *       (item === arr[0] &&         
 *       item === arr[1] &&      
 *       ...                            
 *       item === arr[n])         
 */
export function equals<T>(item: T, arr: any[]): boolean {
  if (arr.length) 
    for (const elem of arr)
      if (item === elem) return true;
  return false;
}

/** Alias operator and && */
export function and(...items: any[]) {
  for (const item of items)
  if (!item) return false;
  
  return true;
}

/** Alias operator or || */
export function or(...items: any[]) {
  for (const item of items)
    if (!!item) return true;
  return false;
}

export default {};
