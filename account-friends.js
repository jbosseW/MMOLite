// account-friends.js
// Friend system: requests, accept/reject, block/unblock, friend list enrichment.
// Extracted from accounts.js — accounts.js re-exports all names for backward compatibility.

var loadAccount, saveAccount, getPublicProfile, _keyHash, keyHashMap;

function init(deps) {
  loadAccount = deps.loadAccount;
  saveAccount = deps.saveAccount;
  getPublicProfile = deps.getPublicProfile;
  _keyHash = deps._keyHash;
  keyHashMap = deps.keyHashMap;
}

var MAX_FRIENDS = 100;
var MAX_FRIEND_REQUESTS = 50;
var MAX_BLOCKED = 200;

function _ensureFriendsData(account) {
  if (!account.friends) account.friends = [];
  if (!account.friendRequests) account.friendRequests = { incoming: [], outgoing: [] };
  if (!account.blocked) account.blocked = [];
}

// Compare a stored key (which may be a SHA-256 hash placeholder after restart)
// against a real key. Returns true if they match directly or via hash.
function _keyMatches(storedKey, realKey) {
  if (storedKey === realKey) return true;
  // If storedKey is a 64-char hex hash, compare against hash of realKey
  if (storedKey && storedKey.length === 64 && /^[a-f0-9]{64}$/.test(storedKey)) {
    return storedKey === _keyHash(realKey);
  }
  return false;
}

// Clean up stale hash entries: replace hash placeholders with real keys in friend data.
// Called after acceptFriendRequest/sendFriendRequest to fix hash-based entries.
function _resolveHashEntries(account, realKey) {
  var hash = _keyHash(realKey);
  if (account.friends) {
    for (var i = 0; i < account.friends.length; i++) {
      if (account.friends[i].key === hash) account.friends[i].key = realKey;
    }
  }
  if (account.friendRequests) {
    if (account.friendRequests.incoming) {
      for (var j = 0; j < account.friendRequests.incoming.length; j++) {
        if (account.friendRequests.incoming[j].fromKey === hash) account.friendRequests.incoming[j].fromKey = realKey;
      }
    }
    if (account.friendRequests.outgoing) {
      for (var k = 0; k < account.friendRequests.outgoing.length; k++) {
        if (account.friendRequests.outgoing[k].toKey === hash) account.friendRequests.outgoing[k].toKey = realKey;
      }
    }
  }
  if (account.blocked) {
    for (var b = 0; b < account.blocked.length; b++) {
      if (account.blocked[b] === hash) account.blocked[b] = realKey;
    }
  }
}

function sendFriendRequest(fromKey, toKey) {
  if (fromKey === toKey) return { error: 'Cannot friend yourself' };

  var fromAcc = loadAccount(fromKey);
  var toAcc = loadAccount(toKey);
  if (!fromAcc || !toAcc) return { error: 'Account not found' };
  if (fromAcc.temp || toAcc.temp) return { error: 'Permanent account required' };

  _ensureFriendsData(fromAcc);
  _ensureFriendsData(toAcc);

  // Resolve any hash placeholders now that we have both real keys
  _resolveHashEntries(fromAcc, toKey);
  _resolveHashEntries(toAcc, fromKey);

  // Check blocks (bidirectional)
  if (fromAcc.blocked.some(function(b) { return _keyMatches(b, toKey); })) return { error: 'User is blocked' };
  if (toAcc.blocked.some(function(b) { return _keyMatches(b, fromKey); })) return { error: 'Cannot send request' };

  // Already friends?
  if (fromAcc.friends.some(function(f) { return _keyMatches(f.key, toKey); })) return { error: 'Already friends' };

  // Already pending?
  if (fromAcc.friendRequests.outgoing.some(function(r) { return _keyMatches(r.toKey, toKey); })) return { error: 'Request already sent' };

  // Check limits
  if (fromAcc.friends.length >= MAX_FRIENDS) return { error: 'Your friend list is full' };
  if (fromAcc.friendRequests.outgoing.length >= MAX_FRIEND_REQUESTS) return { error: 'Too many pending requests' };

  // If target already sent us a request, auto-accept
  if (toAcc.friendRequests.outgoing.some(function(r) { return _keyMatches(r.toKey, fromKey); })) {
    return acceptFriendRequest(fromKey, toKey);
  }

  // Add to sender's outgoing
  fromAcc.friendRequests.outgoing.push({ toKey: toKey, sentAt: Date.now() });
  saveAccount(fromAcc);

  // Add to receiver's incoming
  toAcc.friendRequests.incoming.push({ fromKey: fromKey, fromUsername: fromAcc.username, sentAt: Date.now() });
  saveAccount(toAcc);

  return { success: true };
}

function acceptFriendRequest(accepterKey, requesterKey) {
  var accepter = loadAccount(accepterKey);
  var requester = loadAccount(requesterKey);
  if (!accepter || !requester) return { error: 'Account not found' };

  _ensureFriendsData(accepter);
  _ensureFriendsData(requester);

  // Resolve hash placeholders now that we have both real keys
  _resolveHashEntries(accepter, requesterKey);
  _resolveHashEntries(requester, accepterKey);

  // Verify request exists (incoming on accepter or outgoing on requester)
  var hasIncoming = accepter.friendRequests.incoming.some(function(r) { return r.fromKey === requesterKey; });
  var hasOutgoing = requester.friendRequests.outgoing.some(function(r) { return r.toKey === accepterKey; });
  if (!hasIncoming && !hasOutgoing) return { error: 'No pending request' };

  // Check limits
  if (accepter.friends.length >= MAX_FRIENDS) return { error: 'Your friend list is full' };
  if (requester.friends.length >= MAX_FRIENDS) return { error: 'Their friend list is full' };

  var now = Date.now();
  // Add to both friends lists (prevent duplicates)
  if (!accepter.friends.some(function(f) { return f.key === requesterKey; })) {
    accepter.friends.push({ key: requesterKey, addedAt: now });
  }
  if (!requester.friends.some(function(f) { return f.key === accepterKey; })) {
    requester.friends.push({ key: accepterKey, addedAt: now });
  }

  // Remove from all pending requests (both directions)
  accepter.friendRequests.incoming = accepter.friendRequests.incoming.filter(function(r) { return r.fromKey !== requesterKey; });
  accepter.friendRequests.outgoing = accepter.friendRequests.outgoing.filter(function(r) { return r.toKey !== requesterKey; });
  requester.friendRequests.outgoing = requester.friendRequests.outgoing.filter(function(r) { return r.toKey !== accepterKey; });
  requester.friendRequests.incoming = requester.friendRequests.incoming.filter(function(r) { return r.fromKey !== accepterKey; });

  saveAccount(accepter);
  saveAccount(requester);

  return { success: true, accepterName: accepter.username, requesterName: requester.username };
}

function rejectFriendRequest(rejecterKey, requesterKey) {
  var rejecter = loadAccount(rejecterKey);
  if (!rejecter) return { error: 'Account not found' };

  _ensureFriendsData(rejecter);
  _resolveHashEntries(rejecter, requesterKey);
  rejecter.friendRequests.incoming = rejecter.friendRequests.incoming.filter(function(r) { return r.fromKey !== requesterKey; });
  saveAccount(rejecter);

  var requester = loadAccount(requesterKey);
  if (requester) {
    _ensureFriendsData(requester);
    _resolveHashEntries(requester, rejecterKey);
    requester.friendRequests.outgoing = requester.friendRequests.outgoing.filter(function(r) { return r.toKey !== rejecterKey; });
    saveAccount(requester);
  }

  return { success: true };
}

function removeFriend(removerKey, friendKey) {
  var remover = loadAccount(removerKey);
  if (!remover) return { error: 'Account not found' };

  _ensureFriendsData(remover);
  _resolveHashEntries(remover, friendKey);
  remover.friends = remover.friends.filter(function(f) { return f.key !== friendKey; });
  saveAccount(remover);

  var friend = loadAccount(friendKey);
  if (friend) {
    _ensureFriendsData(friend);
    _resolveHashEntries(friend, removerKey);
    friend.friends = friend.friends.filter(function(f) { return f.key !== removerKey; });
    saveAccount(friend);
  }

  return { success: true };
}

function blockUser(blockerKey, targetKey) {
  if (blockerKey === targetKey) return { error: 'Cannot block yourself' };
  var blocker = loadAccount(blockerKey);
  if (!blocker) return { error: 'Account not found' };

  _ensureFriendsData(blocker);
  _resolveHashEntries(blocker, targetKey);

  if (blocker.blocked.includes(targetKey)) return { error: 'Already blocked' };
  if (blocker.blocked.length >= MAX_BLOCKED) return { error: 'Block list full' };

  blocker.blocked.push(targetKey);

  // Remove from friends if they were friends
  blocker.friends = blocker.friends.filter(function(f) { return f.key !== targetKey; });
  // Cancel any pending requests
  blocker.friendRequests.incoming = blocker.friendRequests.incoming.filter(function(r) { return r.fromKey !== targetKey; });
  blocker.friendRequests.outgoing = blocker.friendRequests.outgoing.filter(function(r) { return r.toKey !== targetKey; });
  saveAccount(blocker);

  // Remove from the other side too
  var target = loadAccount(targetKey);
  if (target) {
    _ensureFriendsData(target);
    _resolveHashEntries(target, blockerKey);
    target.friends = target.friends.filter(function(f) { return f.key !== blockerKey; });
    target.friendRequests.incoming = target.friendRequests.incoming.filter(function(r) { return r.fromKey !== blockerKey; });
    target.friendRequests.outgoing = target.friendRequests.outgoing.filter(function(r) { return r.toKey !== blockerKey; });
    saveAccount(target);
  }

  return { success: true };
}

function unblockUser(blockerKey, targetKey) {
  var blocker = loadAccount(blockerKey);
  if (!blocker) return { error: 'Account not found' };

  _ensureFriendsData(blocker);
  blocker.blocked = blocker.blocked.filter(function(k) { return k !== targetKey; });
  saveAccount(blocker);

  return { success: true };
}

// Try to resolve a key that might be a hash placeholder back to a real key
function _tryResolveKey(keyOrHash) {
  if (!keyOrHash) return keyOrHash;
  // If it's a 64-char hex string, it's likely a hash — try keyHashMap
  if (keyOrHash.length === 64 && /^[a-f0-9]{64}$/.test(keyOrHash)) {
    return keyHashMap.has(keyOrHash) ? keyHashMap.get(keyOrHash) : keyOrHash;
  }
  return keyOrHash;
}

function getFriendsData(key) {
  var acc = loadAccount(key);
  if (!acc) return { friends: [], incoming: [], outgoing: [], blocked: [] };

  _ensureFriendsData(acc);

  // Resolve hash placeholders to real keys where possible (fixes "Unknown" after restart)
  var dirty = false;
  for (var fi = 0; fi < acc.friends.length; fi++) {
    var resolved = _tryResolveKey(acc.friends[fi].key);
    if (resolved !== acc.friends[fi].key) { acc.friends[fi].key = resolved; dirty = true; }
  }
  if (acc.friendRequests.incoming) {
    for (var ii = 0; ii < acc.friendRequests.incoming.length; ii++) {
      var rIn = _tryResolveKey(acc.friendRequests.incoming[ii].fromKey);
      if (rIn !== acc.friendRequests.incoming[ii].fromKey) { acc.friendRequests.incoming[ii].fromKey = rIn; dirty = true; }
    }
  }
  if (acc.friendRequests.outgoing) {
    for (var oi = 0; oi < acc.friendRequests.outgoing.length; oi++) {
      var rOut = _tryResolveKey(acc.friendRequests.outgoing[oi].toKey);
      if (rOut !== acc.friendRequests.outgoing[oi].toKey) { acc.friendRequests.outgoing[oi].toKey = rOut; dirty = true; }
    }
  }
  if (dirty) saveAccount(acc);

  var friends = acc.friends.map(function(f) {
    var profile = getPublicProfile(f.key);
    return {
      key: f.key,
      username: profile ? profile.username : 'Unknown',
      color: profile ? profile.color : '#999',
      chips: profile ? profile.chips : 0,
      addedAt: f.addedAt,
      online: false, // caller fills this in via socketAccountMap
    };
  });

  var incoming = acc.friendRequests.incoming.map(function(r) {
    var profile = getPublicProfile(r.fromKey);
    return {
      key: r.fromKey,
      username: profile ? profile.username : r.fromUsername || 'Unknown',
      color: profile ? profile.color : '#999',
      sentAt: r.sentAt,
    };
  });

  var outgoing = acc.friendRequests.outgoing.map(function(r) {
    var profile = getPublicProfile(r.toKey);
    return {
      key: r.toKey,
      username: profile ? profile.username : 'Unknown',
      color: profile ? profile.color : '#999',
      sentAt: r.sentAt,
    };
  });

  return { friends: friends, incoming: incoming, outgoing: outgoing, blocked: acc.blocked || [] };
}

module.exports = {
  init: init,
  MAX_FRIENDS: MAX_FRIENDS,
  MAX_FRIEND_REQUESTS: MAX_FRIEND_REQUESTS,
  MAX_BLOCKED: MAX_BLOCKED,
  sendFriendRequest: sendFriendRequest,
  acceptFriendRequest: acceptFriendRequest,
  rejectFriendRequest: rejectFriendRequest,
  removeFriend: removeFriend,
  blockUser: blockUser,
  unblockUser: unblockUser,
  getFriendsData: getFriendsData,
};
