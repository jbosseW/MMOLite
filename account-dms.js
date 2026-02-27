// account-dms.js
// E2E Encrypted Direct Message system: key management, message storage, history.
// Extracted from accounts.js — accounts.js re-exports all names for backward compatibility.

var loadAccount, saveAccount;

function init(deps) {
  loadAccount = deps.loadAccount;
  saveAccount = deps.saveAccount;
}

var MAX_DM_CONVERSATIONS = 50;
var MAX_DM_MESSAGES = 100;

function _ensureDMData(account) {
  if (!account.dms) account.dms = { conversations: {} };
  if (!account.dms.conversations) account.dms.conversations = {};
}

function setPublicKey(key, publicKeyBase64, version) {
  var account = loadAccount(key);
  if (!account) return { error: 'Account not found' };
  if (account.temp) return { error: 'Permanent account required' };
  if (typeof publicKeyBase64 !== 'string' || publicKeyBase64.length < 20 || publicKeyBase64.length > 500) {
    return { error: 'Invalid public key' };
  }

  // Migrate legacy e2ePublicKey to new e2eKeys format if needed
  if (!account.e2eKeys && account.e2ePublicKey) {
    account.e2eKeys = {
      current: {
        key: account.e2ePublicKey,
        version: 0,
        created: account.lastSeen || Date.now()
      },
      previous: null
    };
    delete account.e2ePublicKey;
  }

  // Initialize e2eKeys if this is the first key ever set
  if (!account.e2eKeys) {
    var newVersion = (typeof version === 'number' && version > 0) ? version : 1;
    account.e2eKeys = {
      current: {
        key: publicKeyBase64,
        version: newVersion,
        created: Date.now()
      },
      previous: null
    };
    saveAccount(account);
    return { success: true, version: newVersion };
  }

  // Rotate: current becomes previous, new key becomes current
  var nextVersion = (typeof version === 'number' && version > 0)
    ? version
    : (account.e2eKeys.current ? account.e2eKeys.current.version + 1 : 1);

  // Don't rotate if the key is identical to the current one (re-registration on reconnect)
  if (account.e2eKeys.current && account.e2eKeys.current.key === publicKeyBase64) {
    saveAccount(account);
    return { success: true, version: account.e2eKeys.current.version };
  }

  account.e2eKeys.previous = account.e2eKeys.current ? {
    key: account.e2eKeys.current.key,
    version: account.e2eKeys.current.version,
    created: account.e2eKeys.current.created
  } : null;

  account.e2eKeys.current = {
    key: publicKeyBase64,
    version: nextVersion,
    created: Date.now()
  };

  // Clean up legacy field if it still exists
  if (account.e2ePublicKey) delete account.e2ePublicKey;

  saveAccount(account);
  return { success: true, version: nextVersion };
}

function getPublicKeyE2E(key) {
  var account = loadAccount(key);
  if (!account) return null;

  // New versioned format
  if (account.e2eKeys && account.e2eKeys.current) {
    var result = {
      key: account.e2eKeys.current.key,
      version: account.e2eKeys.current.version,
      previousKey: null,
      previousVersion: null
    };
    if (account.e2eKeys.previous) {
      result.previousKey = account.e2eKeys.previous.key;
      result.previousVersion = account.e2eKeys.previous.version;
    }
    return result;
  }

  // Legacy fallback: old e2ePublicKey field
  if (account.e2ePublicKey) {
    return {
      key: account.e2ePublicKey,
      version: 0,
      previousKey: null,
      previousVersion: null
    };
  }

  return null;
}

function storeDM(fromKey, toKey, messageObj) {
  var fromAcc = loadAccount(fromKey);
  var toAcc = loadAccount(toKey);
  if (!fromAcc || !toAcc) return { error: 'Account not found' };
  if (fromAcc.temp || toAcc.temp) return { error: 'Permanent account required' };

  _ensureDMData(fromAcc);
  _ensureDMData(toAcc);

  // Store on sender's account
  var fromConvos = fromAcc.dms.conversations;
  if (!fromConvos[toKey]) {
    var fromConvoKeys = Object.keys(fromConvos);
    if (fromConvoKeys.length >= MAX_DM_CONVERSATIONS) {
      var oldest = null;
      var oldestTime = Infinity;
      for (var i = 0; i < fromConvoKeys.length; i++) {
        var la = fromConvos[fromConvoKeys[i]].lastActivity || 0;
        if (la < oldestTime) { oldestTime = la; oldest = fromConvoKeys[i]; }
      }
      if (oldest) delete fromConvos[oldest];
    }
    fromConvos[toKey] = { messages: [], lastActivity: 0 };
  }
  fromConvos[toKey].messages.push(messageObj);
  if (fromConvos[toKey].messages.length > MAX_DM_MESSAGES) {
    fromConvos[toKey].messages = fromConvos[toKey].messages.slice(-MAX_DM_MESSAGES);
  }
  fromConvos[toKey].lastActivity = messageObj.timestamp || Date.now();
  saveAccount(fromAcc);

  // Store on recipient's account
  var toConvos = toAcc.dms.conversations;
  if (!toConvos[fromKey]) {
    var toConvoKeys = Object.keys(toConvos);
    if (toConvoKeys.length >= MAX_DM_CONVERSATIONS) {
      var oldestTo = null;
      var oldestTimeTo = Infinity;
      for (var j = 0; j < toConvoKeys.length; j++) {
        var laTo = toConvos[toConvoKeys[j]].lastActivity || 0;
        if (laTo < oldestTimeTo) { oldestTimeTo = laTo; oldestTo = toConvoKeys[j]; }
      }
      if (oldestTo) delete toConvos[oldestTo];
    }
    toConvos[fromKey] = { messages: [], lastActivity: 0 };
  }
  toConvos[fromKey].messages.push(messageObj);
  if (toConvos[fromKey].messages.length > MAX_DM_MESSAGES) {
    toConvos[fromKey].messages = toConvos[fromKey].messages.slice(-MAX_DM_MESSAGES);
  }
  toConvos[fromKey].lastActivity = messageObj.timestamp || Date.now();
  saveAccount(toAcc);

  return { success: true };
}

function getDMHistory(key, otherKey, limit) {
  var account = loadAccount(key);
  if (!account) return [];
  _ensureDMData(account);
  var convo = account.dms.conversations[otherKey];
  if (!convo || !convo.messages) return [];
  var lim = (typeof limit === 'number' && limit > 0) ? Math.min(limit, MAX_DM_MESSAGES) : 50;
  return convo.messages.slice(-lim);
}

function getDMConversations(key) {
  var account = loadAccount(key);
  if (!account) return [];
  _ensureDMData(account);
  var convos = account.dms.conversations;
  var keys = Object.keys(convos);
  var result = [];
  for (var i = 0; i < keys.length; i++) {
    var otherKey = keys[i];
    var convo = convos[otherKey];
    result.push({
      key: otherKey,
      lastActivity: convo.lastActivity || 0,
      messageCount: convo.messages ? convo.messages.length : 0,
    });
  }
  result.sort(function(a, b) { return b.lastActivity - a.lastActivity; });
  return result;
}

function deleteDMMessage(myKey, otherKey, messageId) {
  if (!myKey || !otherKey || !messageId) return false;
  var account = loadAccount(myKey);
  if (!account) return false;
  _ensureDMData(account);
  var convo = account.dms.conversations[otherKey];
  if (!convo || !convo.messages || convo.messages.length === 0) return false;
  var originalLen = convo.messages.length;
  convo.messages = convo.messages.filter(function(m) { return m.id !== messageId; });
  if (convo.messages.length === originalLen) return false;
  if (convo.messages.length === 0) {
    delete account.dms.conversations[otherKey];
  }
  saveAccount(account);
  return true;
}

function clearDMs(key) {
  var account = loadAccount(key);
  if (!account) return;
  if (account.dms) {
    account.dms = { conversations: {} };
    saveAccount(account);
  }
}

module.exports = {
  init: init,
  MAX_DM_CONVERSATIONS: MAX_DM_CONVERSATIONS,
  MAX_DM_MESSAGES: MAX_DM_MESSAGES,
  setPublicKey: setPublicKey,
  getPublicKey: getPublicKeyE2E,
  storeDM: storeDM,
  getDMHistory: getDMHistory,
  getDMConversations: getDMConversations,
  deleteDMMessage: deleteDMMessage,
  clearDMs: clearDMs,
};
