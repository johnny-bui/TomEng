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
    if (typeof auth?.getJWTToken === 'function') {
      const token = await auth.getJWTToken();
      return typeof token === 'string' && token.trim() ? token.trim() : null;
    }
    if (typeof auth?.token === 'function') {
      const result = await auth.token();
      if (result?.error) throw result.error;
      const token = result?.data?.token;
      return typeof token === 'string' && token.trim() ? token.trim() : null;
    }
    return null;
  }
  window.TOMENG_AUTH_SESSION = Object.freeze({ resolve, getJWTToken });
})();
