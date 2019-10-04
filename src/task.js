import { defaults } from 'lodash';

const defaultMeta = {
  parentUrl: null,
  depth: null,
};

export class Task {
  constructor(url, meta) {
    this.url = url;
    this.meta = defaults(meta, defaultMeta);
  }
}
