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
  window.TOMENG_AUTH_SESSION = Object.freeze({ resolve });
})();
