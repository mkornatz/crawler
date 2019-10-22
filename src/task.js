import { defaults } from 'lodash';

const defaultMeta = {
  parentUrl: null,
  depth: 1,
};

export default class Task {
  constructor(url, meta) {
    this.url = url;
    this.meta = defaults(meta, defaultMeta);
  }
  async run(/*crawler*/) {}
}
