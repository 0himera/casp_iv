// Origin uses the existing psychaos.art certificate on a dedicated HTTPS port.
export default {
  async fetch(request) {
    const target = new URL(request.url);
    target.protocol = 'https:';
    target.hostname = 'psychaos.art';
    target.port = '18443';
    return fetch(new Request(target, request), { redirect: 'manual' });
  },
};
