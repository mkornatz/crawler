import { isObject, isArray } from 'util';

export default class Store {
  constructor(initialVals = {}) {
    this.store = initialVals;
    this.mutexes = {};
  }
  incr(key, incrVal = 1) {
    this.store[key] += incrVal;
  }
  decr(key, decrVal = 1) {
    this.store[key] -= decrVal;
  }
  set(key, val) {
    this.store[key] = val;
  }
  get(key) {
    return this.store[key];
  }
  push(key, val) {
    if (!isArray(this.store[key])) {
      throw new Error('The storage value is not an array.');
    }
    return this.store[key].push(val);
  }
  /**
   * Determines if the storage var contains a given value
   * @param {string} key
   * @param {mixed} val
   */
  contains(key, val) {
    if (!isArray(this.store[key]) || !isObject(this.store[key])) {
      throw new Error('The storage value is not an array or object.');
    }
    return this.store[key].indexOf(val) >= 0;
  }
  doesNotContain(key, val) {
    return !this.contains(key, val);
  }
  setMutexFlag(key) {
    this.mutexes[key] = 1;
  }
  clearMutexFlag(key) {
    delete this.mutexes[key];
  }
  mutexIsSet(key) {
    return this.mutexes[key] === 1;
  }
}
