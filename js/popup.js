(function() {
  var _elements = {}, $el, $n2a, mkArray, removeClass, addClass, escapeRegExp, unEscapeRegExp, sibligs, parent, activate, addRemoveClass, animate, saveChange, clearSave, getValue, getLocalStorage, setLocalStorage, domReady;

  /*
   * This is for util functions
   */
  $el = function(klass) {
    if (!_elements[klass]) _elements[klass] = document.getElementById(klass);
    return _elements[klass];
  };
  
  $n2a = function(nl) {
    var ret = [];
    for (var i = 0, len = nl.length; i < len; i++) {
      ret.push(nl.item(i));
    }
    return ret;
  };
  
  mkArray = function(itemy) {
    if (!(itemy instanceof Array)) itemy = [itemy];
    return itemy;
  };

  removeClass = function(els, klass) {
    els = mkArray(els);
    for(var i = 0, len = els.length; i < len; i++) {
      var el = els[i];
      el.className = el.className.replace(new RegExp('\\b' + klass + '\\b'), '').replace(/\s+/g,' ').replace(/^\s*(.*)\s*$/, '$1');
    }
  };

  addClass = function(els, klass) {
    els = mkArray(els);
    for(var i = 0, len = els.length; i < len; i++) {
      var el = els[i];
      if (!el.className.match(new RegExp('\\b' + klass + '\\b'))) {
        el.className = el.className + ' ' + klass
      }
    }
  };
  
  escapeRegExp = function (str) { // From, http://stackoverflow.com/a/6969486/407678
    return str.replace(/[-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  };
  
  unEscapeRegExp = function(str) {
    return str.replace(/\\([-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|])/g, '$1')
  };
  
  // From jQuery, I think...
  siblings = function(elem, ignore) {
		var ret = [];
    elem = elem.parentNode.firstChild;
		for (; elem; elem = elem.nextSibling) {
			if (elem.nodeType === 1 && elem !== ignore) {
				ret.push(elem);
			}
		}
		return ret;
	};
  
  parent = function(elem) {
    elem = elem.parentNode;
		for (; elem; elem = elem.parentNode) {
			if (elem.nodeType === 1) {
				return elem;
			}
		}
    return null;
  };
  
  activate = function(elem, fn, klass) {
    var i, len;
    if (!klass) klass = 'active';
    elem = mkArray(elem);
    for (var i = 0, len = elem.length; i < len; i++) {
      (function(self) {
        self.addEventListener('click', function() {
          addRemoveClass(self, siblings(self, self));
          if (fn) fn(self);
        }, false);
      })(elem[i]);
    }
  };
  
  addRemoveClass = function(add, remove, klass) {
    if (!klass) klass = 'active'
    addClass(add, klass);
    removeClass(remove, klass);
  };
  
  
  animate = function(speed, renderFn) {
    var loop, startTime = +new Date;
    (loop = function(time) {
      var d = +new Date - startTime;
      if (d >= speed) {
        renderFn(1);
        return;
      }
      renderFn(d / speed);
      // webkitRequestAnimationFrame(loop);
      setTimeout(loop, speed / 13);
    })(+new Date);
  };
  
  saveChange = function(key, value) {
    var settings = {};
    settings = JSON.parse((localStorage.popupLastSettings || '{}'));
    settings[key] = value;
    localStorage.popupLastSettings = JSON.stringify(settings);
  };
  
  clearSave = function() {
    var keys = ['js', 'css', 'page', 'exec-on-page-load', 'include-jquery', 'tab'];
    if (arguments.length) {
      keys = arguments;
    }
    var settings = JSON.parse(localStorage.popupLastSettings);
    for (var i = 0, len = keys.length; i < len; i++) {
      settings[keys[i]] = undefined;
    }
    localStorage.popupLastSettings = JSON.stringify(settings);
  };
  
  getValue = function(key, def) {
    var settings;
    settings = JSON.parse((localStorage.popupLastSettings || '{}'));
    if (settings[key]) {
      return settings[key]
    }
    return def;
  };
  
  getLocalStorage = function(key, def) {
    var keys = key.split('.'),
        currentLevel;
    if (keys.length) {
      currentLevel = JSON.parse(localStorage[keys[0]]);
      for (var i = 1, len = keys.length; i < len; i++) {
        if (!currentLevel[keys[i]]) {
          return def;
        }
        currentLevel = currentLevel[keys[i]];
      }
      return currentLevel;
    }
    return def;
  };

  setLocalStorage = function(key, value) {
    var keys = key.split('.'),
        currentLevel;
    if (keys.length) {
      currentLevel = JSON.parse(localStorage[keys[0]]);
      for (var i = 0, len = keys.length; i < len; i++) {
        if (!currentLevel[keys[i]]) {
          currentLevel[keys[i]] = {};
        }
        currentLevel = currentLevel[keys[i]];
      }
      currentLevel = JSON.stringify(value);
    }
  };
  
  domReady = function(fn) {
    if (document.readyState === "complete") {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn, false);
    }
  };
  


  /*
   * This is for Chrome extension tasks
   */
  /*
  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    var bgPage = chrome.extension.getBackgroundPage();
    bgPage.retrieveContent(tab.url, function(result, error) {
      $el('js-for-this-page').value = result || '';
    });
  });
  */

  /*
   * This is for DOM listening and such,
   */
  document.addEventListener('DOMContentLoaded', function() {
  
    var jseditor, csseditor, JavaScriptMode, CSSMode, currentUrl = null;
  
    chrome.tabs.query({
      currentWindow: true,
      active: true
    }, function(tabs) {
      if (tabs.length === 1) {
        currentUrl = tabs[0].url;
      }
    });
    
    activate($el('js-edit-button'), function(self) {
      saveChange('tab', 'js-edit-button');
      addRemoveClass($el('js-for-this-page'), siblings($el('js-for-this-page'), $el('js-for-this-page')));
      jseditor.focus();
    });
    if (getValue('tab') == $el('js-edit-button').getAttribute('id') || getValue('tab') === undefined) {
      addRemoveClass($el('js-for-this-page'), siblings($el('js-for-this-page'), $el('js-for-this-page')));
      addRemoveClass($el('js-edit-button'), siblings($el('js-edit-button'), $el('js-edit-button')));
    }

    activate($el('css-edit-button'), function(self) {
      saveChange('tab', 'css-edit-button');
      addRemoveClass($el('css-for-this-page'), siblings($el('css-for-this-page'), $el('css-for-this-page')));
      csseditor.focus();
    });
    if (getValue('tab') == $el('css-edit-button').getAttribute('id')) {
      addRemoveClass($el('css-for-this-page'), siblings($el('css-for-this-page'), $el('css-for-this-page')));
      addRemoveClass($el('css-edit-button'), siblings($el('css-edit-button'), $el('css-edit-button')));
    }
    
    activate($el('js-regex-input'), function(self) {
      saveChange('tab', 'js-regex-input');
      addRemoveClass($el('regex-holder'), siblings($el('regex-holder'), $el('regex-holder')));
    });
    if (getValue('tab') == $el('js-regex-input').getAttribute('id')) {
      addRemoveClass($el('regex-holder'), siblings($el('regex-holder'), $el('regex-holder')));
      addRemoveClass($el('js-regex-input'), siblings($el('js-regex-input'), $el('js-regex-input')));
    }
    
    activate($el('js-save-list-button'), function(self) {
      saveChange('tab', 'js-save-list-button');
      addRemoveClass($el('js-save-list-container'), siblings($el('js-save-list-container'), $el('js-save-list-container')));
    });
    if (getValue('tab') == $el('js-save-list-button').getAttribute('id')) {
      addRemoveClass($el('js-save-list-container'), siblings($el('js-save-list-container'), $el('js-save-list-container')));
      addRemoveClass($el('js-save-list-button'), siblings($el('js-save-list-button'), $el('js-save-list-button')));
    }
    
    activate($n2a($el('regex-holder').querySelectorAll('.check')), function(self) {
      saveChange('page', self.getAttribute('data-which'));
    });
    
    var checks = $el('regex-holder').querySelectorAll('.check');
    for (var i = 0, len = checks.length; i < len; i++) {
      var check = checks.item(i);
      if (getValue('page', 'page') == check.getAttribute('data-which')) {
        addClass(check, 'active');
      }
    }
    
    $el('include-jquery').addEventListener('click', function(e) {
      saveChange('include-jquery', this.checked);
    })
    $el('include-jquery').checked = getValue('include-jquery', false);
    
    $el('exec-on-page-load').addEventListener('click', function(e) {
      saveChange('exec-on-page-load', this.checked);
    })
    $el('exec-on-page-load').checked = getValue('exec-on-page-load', false);
    
    function populatePopup(item) {
      jseditor.getSession().setValue(item['js']);
      csseditor.getSession().setValue(item['css']);
      var checks = $n2a($el('regex-holder').querySelectorAll('.check'));
      for (var i = 0, len = checks.length; i < len; i++) {
        if (checks[i].getAttribute('data-which') === item['matcher-name']) {
          addRemoveClass(checks[i], siblings(checks[i], checks[i]));
          break;
        }
      }
      if (item['matcher-name'] === 'regex') {
        $el('regex-content').value = item['regex'];
      } else {
        $el('regex-content').value = '';
      }
      $el('exec-on-page-load').checked = item['exec-on-page-load'];
      $el('include-jquery').checked = item['include-jquery'];
      $el('js-title').value = item['title'];
      $el('js-uuid').value = item['uuid'];
    }
    
    function buildList () {
      chrome.extension.getBackgroundPage().getSaveList(function(list) {
        $el('js-save-list').innerHTML = '';
        for(var i = 0, len = list.length; i < len; i++) {
          var li, a, del;
          a = document.createElement('a');
          a.setAttribute('href', '#');
          a.addEventListener('click', function(e) {
            e.preventDefault();
            var li = parent(this), uuid = li.getAttribute('data-uuid');
            chrome.extension.getBackgroundPage().getStuff(uuid, function(item, error) {
              if (!error) {
                populatePopup(item);
              } else {
                // error handling!
              }
            });
          }, false);
          a.appendChild(document.createTextNode(list[i]['title']));
          li = document.createElement('li');
          li.setAttribute('data-uuid', list[i]['uuid']);
          li.appendChild(a);
          del = document.createElement('a');
          del.setAttribute('href', '#');
          del.insertBefore(document.createTextNode('X'), null);
          del.addEventListener('click', function(e) {
            e.preventDefault();
            var li = parent(this), uuid = li.getAttribute('data-uuid');
            chrome.extension.getBackgroundPage().removeItem(uuid, function() {
              if (uuid === $el('js-uuid')) {
                resetValues(true);
              }
              li.parentNode.removeChild(li);  
            });
          }, false);
          li.appendChild(del)
          $el('js-save-list').insertBefore(li, null);
        }
      });
    };
    buildList();
    
    // $el('css-regex-input').addEventListener('click', function(e) {
    //   var elem = $el('regex-holder'),
    //       invert = parseInt($el('regex-holder').style.height) == 33 ? true : false;
    //   
    //   animate(400, function(m) {
    //     var height;
    //     if (invert) {
    //       height = (new Number(33 * (1 - m))).toFixed();
    //     } else {
    //       height = (new Number(m * 33)).toFixed();
    //     }
    //     console.log(m + ' -- ' + height);
    //     elem.style.height = height + "px";
    //   });
    // }, false);

    function resetValues(keepTabs) {
      jseditor.getSession().setValue('');
      csseditor.getSession().setValue('');
      $el('exec-on-page-load').checked = false;
      $el('include-jquery').checked = false;
      $el('js-title').value = '';
      if (!keepTabs) {
        addRemoveClass($el('js-for-this-page'), siblings($el('js-for-this-page'), $el('js-for-this-page')));
        addRemoveClass($el('js-edit-button'), siblings($el('js-edit-button'), $el('js-edit-button')));
      }
      $el('js-uuid').value = '';
    }
    
    var closeErrorHandler = function(e) {
      e.preventDefault();
      removeClass($el('js-error-container'), 'active');
    };
    
    $el('js-error-container').addEventListener('click', closeErrorHandler, false);
    $el('js-error-container').addEventListener('click', closeErrorHandler, false);

    $el('js-save-button').addEventListener('click', function(e) {
      var regex, which = $el('regex-holder').querySelector('.check.active').getAttribute('data-which');
      
      // error checking
      if ($el('js-title').value.match(/^\s*$/)) {
        addClass($el('js-error-container'), 'active');
        $el('js-error').innerText = 'Invalid Title';
        return;
      }
      
      switch(which) {
        case 'domain':
          regex = escapeRegExp(currentUrl.replace(/^(https?:\/\/[^\/]+).*/i, '$1'));
        break;
        case 'page':
          regex = escapeRegExp(currentUrl);
        break;
        case 'regex':
          regex = $el('regex-content').value;
          try {
            new RegExp(regex);
          } catch(e) {
            //error
          }
        break;
      }
      
      var data = {
        'js': jseditor.getSession().getValue(),
        'css': csseditor.getSession().getValue(),
        'exec-on-page-load': $el('exec-on-page-load').checked,
        'include-jquery': $el('include-jquery').checked,
        'regex': regex,
        'title': $el('js-title').value,
        'uuid': $el('js-uuid').value === '' ? null : $el('js-uuid').value,
        'matcher-name': which
      };
      
      chrome.extension.getBackgroundPage().setContent(data, function(success, error) {
        // console.log(success + ' -- ' + error);
        buildList();
      });
      clearSave();
      resetValues(true);
    });
    
    $el('js-clear-button').addEventListener('click', function(e) {
      clearSave();
      resetValues(true);
    });
    
    // Ace keeps all the editor state (selection, scroll position, etc.) in editor.session which is very useful for making tabbed editor
    //
    //
    // var EditSession = require("ace/edit_session").EditSession
    // var js = new EditSession("some js code")
    // var css = new EditSession(["some", "css", "code here"])
    // // and then to load document into editor just call
    // editor.setSession(js)
    
    jseditor = ace.edit('js-for-this-page');
    JavaScriptMode = require("ace/mode/javascript").Mode;
    jseditor.getSession().setMode(new JavaScriptMode());
    jseditor.getSession().setTabSize(2);
    jseditor.getSession().setUseSoftTabs(true);
    jseditor.setShowPrintMargin(false);
    jseditor.getSession().setValue(getValue('js', ''));
    jseditor.getSession().on('change', function() {
      saveChange('js', jseditor.getSession().getValue());
    });
    
    csseditor = ace.edit('css-for-this-page');
    CSSMode = require("ace/mode/css").Mode;
    csseditor.getSession().setMode(new CSSMode());
    csseditor.getSession().setTabSize(2);
    csseditor.getSession().setUseSoftTabs(true);
    csseditor.setShowPrintMargin(false);
    csseditor.getSession().setValue(getValue('css', ''));
    csseditor.getSession().on('change', function() {
      saveChange('css', csseditor.getSession().getValue());
    });
  
    setTimeout(function() {
      jseditor.focus();
    }, 10);
  }, false);
}).call(this);