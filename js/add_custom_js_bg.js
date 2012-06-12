var retrieveContent, setContent, guidGenerator, getLocalStorage, setLocalStorage, getSaveList, getClass, merge, removeItem, removeFile, removeSingleFile, removeUnusedFiles, getStuff;

window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder;

uuidGenerator = function () {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
};

getClass = function(obj) {
  return Object.prototype.toString.call(obj).match(/^\[object\s(.*)\]$/)[1];
};

merge = function() {
  var into;
  if (arguments.length === 0) {
    return {};
  } else if (arguments.length === 1) {
    return arguments[0];
  } else {
    into = arguments[0]
    for (var i = 1, len = arguments.length; i < len; i++) {
      for (key in arguments[i]) {
        if (arguments[i].hasOwnProperty(key)) {
          into[key] = arguments[i][key];
        }
      }
    }
    return into;
  }
};

getLocalStorage = function(key, def) {
  var keys = key.split('.'),
      currentLevel;
  if (keys.length) {
    currentLevel = JSON.parse((localStorage[keys[0]] || '{}'));
    for (var i = 1, len = keys.length; i < len; i++) {
      if (!currentLevel[keys[i]]) {
        if (i == len - 1) {
          currentLevel[keys[i]] = def;
        }
        return def;
      }
      currentLevel = currentLevel[keys[i]];
    }
    return currentLevel;
  }
  return def;
};

setLocalStorage = function(key, value, empty, replace) {
  var existingValue = localStorage.getItem(key);
  existingJSONValue = JSON.parse(existingValue);
  if (existingValue === null || getClass(existingJSONValue) !== getClass(empty)) {
    existingValue = empty;
  } else {
    existingValue = existingJSONValue;
  }
  if (replace) {
    existingValue = value;
  } else {
    switch(getClass(existingValue)) {
      case 'Array':
        existingValue.push(value);
      break;
      case 'Object':
        existingValue = merge(existingValue, value);
      break;
      default:
        existingValue = value;
      break;
    }
  }
  existingValue = JSON.stringify(existingValue);
  localStorage.setItem(key, existingValue);
};

setContent = function(data, fn) {
  var possibleLocations = getLocalStorage('locations', []);

  // allows multiple per page, just check if we have one with the same UUID to overwrite
  if (!data['uuid']) {
    var usedGUID = false;
    do {
      var i, len, loc;
      data['uuid'] = uuidGenerator();
      for (i = 0, len = possibleLocations.length; i < len; i++) {
        loc = possibleLocations[i];
        if (data['uuid'] == loc['uuid']) {
          usedGUID = true;
        }
      }
    } while(usedGUID);
  } else {
    for (var i = 0, len = possibleLocations.length; i < len; i++) {
      if (possibleLocations[i]['uuid'] === data['uuid']) {
        possibleLocations.splice(i, 1);
        setLocalStorage('locations', possibleLocations, [], true);
        break;
      }
    }
  }
  window.requestFileSystem(PERSISTENT, 1024*1024, function(fs) {
    fs.root.getFile(data['uuid'], {create: true}, function(file) {
      file.createWriter(function(writer) {
        writer.onerror = function(e) {
          fn(null, 'write error')
        };
        
        writer.onwriteend = function(e) {
          var bb = new BlobBuilder();
          bb.append(JSON.stringify(data));
          writer.onwriteend = function(e) {
            setLocalStorage('locations', {
              uuid: data['uuid'],
              regex: data['regex'],
              title: data['title']
            }, []);
            fn(true, null);
          };
          writer.write(bb.getBlob());
        }
        writer.truncate(0);
      }, function(error) {
        fn(null, 'create writer error')
      });

    }, function(error) {
      fn(null, 'get file error');
    });
  }, function(error) {
    fn(null, 'request file system error');
  });
}



retrieveContent = function(loc, fn) {
  var i, len, _loc, possibleLocations = getLocalStorage('locations', []);
  for (i = 0, len = possibleLocations.length; i < len; i++) {
    _loc = possibleLocations[i];
    if (loc.match(_loc['regex'])) {
      getStuff(_loc['uuid'], fn);
      return;
    }
  }
  fn(null, true);
};

getSaveList = function(fn) {
  var locations = getLocalStorage('locations', []);
  fn(locations);
};

removeUnusedFiles = function() {
  var locations = getLocalStorage('locations', []);
  window.requestFileSystem(PERSISTENT, 1024*1024, function(fs) {
    fs.root.createReader().readEntries(function(entries) {
      
      for(var i = 0, len = entries.length; i < len; i++) {
        var uuid = entries[i].name;
        var found = false;
        for (var j = 0, count = locations.length; j < count; j++) {
          if (locations[j]['uuid'] === uuid) {
            found = true;
            break;
          }
        }
        if (found === false) {
          // soo much async going on here
          entries[i].remove(function() {
            // error handling here?!
          }, function() {
            // error handling here?!
          });
        }
      }
    }, function() {
    });
  });
};

removeFile = function(uuid, fn) {
  window.requestFileSystem(PERSISTENT, 1024*1024, function(fs) {
    fs.root.getFile(uuid, null, function(file) {
      file.remove(function() {
        fn(true);
      }, function() {
        fn(false);
      });
    });
  });
}

removeSingleFile = function(uuid, idx, fn) {
  var locations = getLocalStorage('locations', []);
  removeFile(uuid, function(success) {
    if (success) {
      locations.splice(idx, 1);
      setLocalStorage('locations', locations, [], true);
    }
    fn(success);
  });
};

removeItem = function(uuid, fn) {
  var locations = getLocalStorage('locations', []);
  for (var i = 0, len = locations.length; i < len; i++) {
    if (locations[i]['uuid'] === uuid) {
      removeSingleFile(uuid, i, function(success) {
        fn(success);
      });
      break;
    }
  }
};

getStuff = function(uuid, fn) {
  window.requestFileSystem(PERSISTENT, 1024*1024, function(fs) {
    fs.root.getFile(uuid, {}, function(fileEntry) {
      
      fileEntry.file(function(file) {
        var reader = new FileReader();

        reader.onloadend = function(e) {
          fn(JSON.parse(this.result), null);
        };
        reader.onerror = function(e) {
          fn(null, 'file read error');
        };

        reader.readAsText(file);
        
      });

    }, function(error) {
      fn(null, 'get file error');
    });
  }, function(error) {
    fn(null, 'request file system error');
  });
    
};

// chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
//   retrieveContent(tab.url, function(data) {
//     var jsBegin, jsEnd;
//     if (data['include-jquery'] == true) {
//       jsBegin = 'addCustomJSjQuery(function($) {';
//       jsEnd = '});'
//     } else {
//       jsBegin = '(function(){';
//       jsEnd = '})();';
//     }
//     // chrome.tabs.insertCSS(tabId, {code: data['css']}, function() {  });
//     // chrome.tabs.executeScript(tabId, {code: jsBegin + data['js'] + jsEnd}, function() {  });
//   });
// });

var intervalID = setInterval(function() {
  chrome.idle.queryState(10 * 1000, function(state) {
    if (state === 'idle') {
      removeUnusedFiles();
      clearInterval(intervalID);
    }
  });
}, 5 * 60 * 1000);

chrome.extension.onConnect.addListener(function(port) {
  if (port.name !== 'add-custom-script-handshake') return;
  port.onDisconnect.addListener(function() {
    // Do Nothing
    console.log('disconnecting! :(')
  });
  port.onMessage.addListener(function(msg) {
    console.log('got message');
    if (msg.action === 'get-content-for-page' && msg.loc) {
      retrieveContent(msg.loc, function(data, error) {
        port.postMessage({action: 'content-for-page', data: data, loc: msg.loc, error: error});
      });
    }
  });
});


var locations = getLocalStorage('locations', []);
window.requestFileSystem(PERSISTENT, 1024*1024, function(fs) {
  var reader = fs.root.createReader()
  reader.readEntries(function(entries) {
      
    for(var i = 0, len = entries.length; i < len; i++) {
      var uuid = entries[i].name;
      var found = false;
      for (var j = 0, count = locations.length; j < count; j++) {
        if (locations[j]['uuid'] === uuid) {
          found = true;
          break;
        }
      }
      if (found === false) {
        entries[i].remove(function() {
          // error handling here?!
          //console.log('deleted: ' + uuid);
        }, function() {
          // error handling here?!
          //console.log('could not delete: ' + uuid);
        });
      } else {
        // console.log('did not delete: ' + uuid);
      }
    }
  }, function() {
  });
});