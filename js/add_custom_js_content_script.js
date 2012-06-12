(function() {
  var injectJs, injectCss, port, requests = {};
  
  injectJs = function(contents) {
    var s = document.createElement('script')
    s.appendChild(document.createTextNode(contents));
    document.body.appendChild(s);
  };
  
  injectCss = function(contents) {
    var s = document.createElement('style');
    s.appendChild(document.createTextNode(contents));
    document.querySelector('head').appendChild(s);
  };
  
  port = chrome.extension.connect({name: 'add-custom-script-handshake'});
  port.onDisconnect.addListener(function(event) {
    // Do nothing
    // console.log('content script got disconnect');
  });
  port.onMessage.addListener(function(msg) {
    if (msg.action === 'content-for-page' && msg.data && window.location.toString() === msg.loc && msg.data) {
      injectJs(msg.data.js);
      injectCss(msg.data.css);
    } else {
      console.log('error occured');
    }
  });
  port.postMessage({action: 'get-content-for-page', loc: window.location.href});
}).call(this);