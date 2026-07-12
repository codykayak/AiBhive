/**
 * Expo Go SDK 54+ (incl. 57) rejects self-hosted Hermes bytecode bundles.
 * Metro dev manifests advertise transform.bytecode=1 by default — Android shows
 * "java.io.IOException: Failed to download remote update".
 * @see https://expo.dev/changelog/expo-go-loading-changes-may-2026
 */

function stripBytecodeParam(url) {
  if (!url || typeof url !== 'string') return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete('transform.bytecode');
    return parsed.toString();
  } catch {
    return url
      .replace(/([?&])transform\.bytecode=1(&|$)/g, '$1')
      .replace(/[?&]$/, '');
  }
}

function patchUrlsDeep(value) {
  if (typeof value === 'string') {
    return value.includes('transform.bytecode') ? stripBytecodeParam(value) : value;
  }
  if (Array.isArray(value)) {
    return value.map(patchUrlsDeep);
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      value[key] = patchUrlsDeep(value[key]);
    }
  }
  return value;
}

function patchManifest(manifest) {
  if (manifest?.launchAsset?.url) {
    manifest.launchAsset.url = stripBytecodeParam(manifest.launchAsset.url);
  }
  if (manifest?.extra) {
    patchUrlsDeep(manifest.extra);
  }
  return manifest;
}

function expoGoManifestMiddleware(middleware) {
  return (req, res, next) => {
    const pathname = req.url?.split('?')[0] ?? '';
    const platform = req.headers['expo-platform'];
    const isManifest =
      platform && platform !== 'web' && ['/', '/manifest', '/index.exp'].includes(pathname);

    if (!isManifest) {
      return middleware(req, res, next);
    }

    const chunks = [];
    let ended = false;
    const origEnd = res.end.bind(res);

    res.write = (chunk, encoding, cb) => {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
      }
      if (typeof encoding === 'function') encoding();
      else if (cb) cb();
      return true;
    };

    res.end = (chunk, encoding, cb) => {
      if (ended) return origEnd(chunk, encoding, cb);
      ended = true;
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
      }

      const raw = Buffer.concat(chunks).toString('utf8');
      try {
        const out = JSON.stringify(patchManifest(JSON.parse(raw)));
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Length', Buffer.byteLength(out));
        return origEnd(out);
      } catch {
        return origEnd(Buffer.concat(chunks));
      }
    };

    return middleware(req, res, next);
  };
}

module.exports = { expoGoManifestMiddleware, stripBytecodeParam };
