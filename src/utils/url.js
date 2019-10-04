import Url from 'url';
import UrlParser from 'url-parse';

/**
 * Resolves an absolute or relative URL into an absolute URL
 *
 * @param {string} url An absolute or relative url
 * @param {string} foundAtUrl The url at which this URL was found
 */
export function absoluteUrl(options) {
  if (!options.url) {
    throw new Error('A URL parameter is required to resolve.');
  }

  let parsedUrl;

  // If the url is relative, use the parent's url to resolve
  if (options.url.indexOf('http') === 0) {
    parsedUrl = new UrlParser(options.url);
  } else if (options.baseHref) {
    parsedUrl = new UrlParser(Url.resolve(options.baseHref, options.url));
  } else if (options.foundAtUrl) {
    parsedUrl = new UrlParser(Url.resolve(options.foundAtUrl, options.url));
  } else {
    throw new Error('Could not resolve to absolute URL');
  }

  // To normalize URLs like https://example.com and https://example.com/
  if (parsedUrl.pathname === '') {
    parsedUrl.pathname = '/';
  }

  return [parsedUrl.protocol, '//', parsedUrl.host, parsedUrl.pathname, parsedUrl.query].join('');
}

/**
 * Gets only the domain (a.k.a host) part of the URL
 * @param {string} url
 * @return {string}
 */
export function getDomainFromUrl(url) {
  const parsedUrl = new UrlParser(url);
  return parsedUrl.host;
}
