(() => {
  'use strict';
  function resolve(...responses) {
    let session = null;
    let user = null;
    for (const response of responses) {
      const data = response?.data || {};
      if (!session && data.session) session = data.session;
      if (!user && data.user) user = data.user;
      if (!user && data.session?.user) user = data.session.user;
    }
    return { session, user };
  }
  async function getJWTToken(auth) {
    // createAuthClient() exposes the Better Auth adapter. Its session already
    // contains the JWT; calling adapter.token() hits an unsupported route.
    if (typeof auth?.getSession === 'function') {
      const result = await auth.getSession();
      if (result?.error) throw result.error;
      const token = result?.data?.session?.token;
      return typeof token === 'string' && token.trim() ? token.trim() : null;
    }
    if (typeof auth?.getJWTToken === 'function') {
      const token = await auth.getJWTToken();
      return typeof token === 'string' && token.trim() ? token.trim() : null;
    }
    return null;
  }
  window.TOMENG_AUTH_SESSION = Object.freeze({ resolve, getJWTToken });
})();
