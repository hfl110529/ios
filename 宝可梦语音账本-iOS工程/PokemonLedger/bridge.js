(function () {
  'use strict';
  const bootstrap = __LEDGER_BOOTSTRAP__;
  function action(method, details) {
    window.webkit.messageHandlers.ledgerActions.postMessage(Object.assign({ method }, details || {}));
  }
  window.LedgerNative = Object.freeze({
    initialData: bootstrap.data,
    initialReadError: bootstrap.readError,
    save: data => window.webkit.messageHandlers.ledgerSave.postMessage(data),
    startSpeech: preferOffline => action('startSpeech', { preferOffline }),
    finishSpeech: () => action('finishSpeech'),
    cancelSpeech: () => action('cancelSpeech'),
    exportFile: (name, content, mime) => action('export', { name, content, mime })
  });
})();
