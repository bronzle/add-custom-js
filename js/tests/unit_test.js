(function() {
  var window = this;
  UnitTest = {
    TEST: true,
    assert: function(exp, y, n) {
      if (exp === true) {
        y();
      } else {
        n();
      }
      return UnitTest;
    },
    files: function() {
      if (!window.TEST) return;
      var s
      for(var i, len = arguments.length; i < len; i++) {
        s = window.document.createElement('script');
        s.src = '/js/tests/' + arguments[i] + '.js';
        window.document.body.appendChild(s);
      }
      return UnitTest;
    },
    error: function(msg) {
      console.log(msg);
    }
  };
  window.UnitTest = UnitTest;
}).call(this);