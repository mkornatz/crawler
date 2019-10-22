import { defaults } from 'lodash';

const defaultMeta = {
  parentUrl: null,
  depth: null,
};

export default class Task {
  constructor(url, meta) {
    this.url = url;
    this.meta = defaults(meta, defaultMeta);
  }
  run(crawler, next) {
    next();
  }
}
