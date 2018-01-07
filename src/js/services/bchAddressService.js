'use strict';

angular.module('copayApp.services').factory('bchAddressService', function($log) {
  var root = {};

  $scope.parseAndConvertCashAddress = function(prefix, payloadString) {
  	var payloadUnparsed = [];
    var CHARSET_MAP = {"q": 0, "p": 1, "z": 2, "r": 3, "y": 4, "9": 5, "x": 6, "8": 7, "g": 8, "f": 9, "2": 10, "t": 11,
    "v": 12, "d": 13, "w": 14, "0": 15, "s": 16, "3": 17, "j": 18, "n": 19, "5": 20, "4": 21, "k": 22, "h": 23,
    "c": 24, "e": 25, "6": 26, "m": 27, "u": 28, "a": 29, "7": 30, "l": 31};

    for (var i = 0; i < payloadString.length; i++) {
      payloadUnparsed.push(CHARSET_MAP[payloadString[i]]);
    }

  	var expandPrefix = [];
  	var netType = true;
  	if (prefix == "bitcoincash") {
  		expandPrefix = [2, 9, 20, 3, 15, 9, 14, 3, 1, 19, 8, 0];
  	} else if (prefix == "bchtest") {
  		expandPrefix = [2, 3, 8, 20, 5, 19, 20, 0];
  		netType = false;
  	} else {
  		return null;
  	}

    var polymodInput = expandPrefix.concat(payloadUnparsed);
    var polymodResult = polyMod(polymodInput);
    for (var i = 0; i < polymodResult.length; i++) {
      if (polymodResult[i] != 0) {
        return null;
      }
    }

  	var payload = convertBits(payloadUnparsed.slice(0,-8), 5, 8, false);
  	if (payload.length == 0) {
  		return null;
  	}
  	var addressType = payload[0] >> 3; // 0 or 1
  	craftOldAddress(addressType, payload.slice(1,21), netType);
  }

  function craftOldAddress(kind, addressHash, netType) {
  	if (netType) {
  		if (kind == 0) {
  			CheckEncodeBase58(addressHash, 0x00);
  		} else {
  			CheckEncodeBase58(addressHash, 0x05);
  		}
  	} else {
  		if (kind == 0) {
  			CheckEncodeBase58(addressHash, 0x6f);
  		} else {
  			CheckEncodeBase58(addressHash, 0xc4);
  		}
  	}
  }

  function CheckEncodeBase58(input, version) {
    var b = [];
  	b.push(version);
  	b = b.concat(input);
  	var h = sha256(Uint8Array.from(b));
  	var h2 = sha256(h);
    b = b.concat(Array.from(h2).slice(0,4));
    return EncodeBase58Simplified(b);;
  }

  function EncodeBase58Simplified(b) {
  	var alphabetIdx0 = 0;
  	var alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  	var digits = [0];
    for (var i = 0; i < b.length; i++) {
  		for (var j = 0, carry = b[i]; j < digits.length; j++) {
  			carry += digits[j] << 8;
  			digits[j] = carry % 58;
  			carry = (carry / 58) | 0;
  		}
  		while (carry > 0) {
        digits.push(carry%58);
  			carry = (carry / 58) | 0;
  		}
  	}
  	var answer = "";

    // leading zero bytes
    for (var i = 0; i < b.length; i++) {
      if (b[i] != 0) {
        break;
      }

      answer = answer.concat("1");
    }

    // reverse
  	for (var t = digits.length - 1; t >= 0; t--) {
      answer = answer.concat(alphabet[digits[t]]);
  	}

    return answer;
  }

  function parseAndConvertOldAddress(oldAddress) {
var ALPHABET_MAP = {"1": 0, "2": 1, "3": 2, "4": 3, "5": 4, "6": 5, "7": 6,
  "8": 7, "9": 8, "A": 9, "B": 10, "C": 11, "D": 12, "E": 13, "F": 14, "G": 15,
  "H": 16, "J": 17, "K": 18, "L": 19, "M": 20, "N": 21, "P": 22, "Q": 23, "R": 24,
  "S": 25, "T": 26, "U": 27, "V": 28, "W": 29, "X": 30, "Y": 31, "Z": 32, "a": 33,
  "b": 34, "c": 35, "d": 36, "e": 37, "f": 38, "g": 39, "h": 40, "i": 41, "j": 42,
  "k": 43, "m": 44, "n": 45, "o": 46, "p": 47, "q": 48, "r": 49, "s": 50, "t": 51,
"u": 52, "v": 53, "w": 54, "x": 55, "y": 56, "z": 57}

  	var bytes = [0]
  	for (var i = 0; i < oldAddress.length; i++) {
  		var value = ALPHABET_MAP[oldAddress[i]]
  		if (value == undefined) {
  			return null;
  		}
  		var carry = value
  		for (var j = 0; j < bytes.length; j++) {
  			carry += bytes[j] * 58
  			bytes[j] = carry & 0xff
  			carry = carry >> 8
  		}
  		while (carry > 0) {
  			bytes.push(carry&0xff)
  			carry = carry >> 8
  		}
  	}

  	for (var i = 0; i < oldAddress.length; i++) {
  		if (oldAddress[numZeros] != '1') {
  			break
  		}
      bytes.push(0)
  	}
  	bytes = bytes.reverse()

  	if (bytes.length < 5) {
      return null;
  	}

  	var version = bytes[0]
  	var h = sha256(Uint8Array.from(bytes.slice(0,-4)))
  	var h2 = sha256(h)
  	if (h2[0] != bytes[bytes.length-4] || h2[1] != bytes[bytes.length-3] || h2[2] != bytes[bytes.length-2] || h2[3] != bytes[bytes.length-1]) {
      return null;
  	}
  	var payload = bytes.slice(1, -4)
  	if (version == 0x00) {
  		craftCashAddress(0, payload, true)
  	} else if (version == 0x05) {
  		craftCashAddress(1, payload, true)
  	} else if (version == 0x6f) {
  		craftCashAddress(0, payload, false)
  	} else if (version == 0xc4) {
  		craftCashAddress(1, payload, false)
  	} else {
  		return null;
  	}
  }

  function packCashAddressData(addressType, addressHash) {
  	// Pack addr data with version byte.
  	var versionByte = addressType << 3
  	var encodedSize = (addressHash.length - 20) / 4
  	if ((addressHash.length-20)%4 != 0) {
  		return []
  	}
  	if (encodedSize < 0 || encodedSize > 8) {
  		return []
  	}
  	versionByte |= encodedSize
  	var addressHashUint = []
    for (var i = 0; i < addressHash.length; i++) {
      addressHashUint.push(addressHash[i])
    }
    var data = [versionByte].concat(addressHashUint)
  	return convertBits(data, 8, 5, true)
  }

  function convertBits(data, fromBits, tobits, pad) {
  	// General power-of-2 base conversion.
  	var acc = 0
  	var bits = 0
  	var ret = []
  	var maxv = (1 << tobits) - 1
  	var maxAcc = (1 << (fromBits + tobits - 1)) - 1
    for (var i = 0; i < data.length; i++) {
      var value = data[i]
      if (value < 0 || (value >> fromBits) !== 0) {
        return [];
      }
      acc = ((acc << fromBits) | value) & maxAcc
      bits += fromBits
      while (bits >= tobits) {
        bits -= tobits
        ret.push((acc>>bits)&maxv)
      }
    }
  	if (pad) {
  		if (bits > 0) {
        ret.push((acc<<(tobits-bits))&maxv)
  		}
  	} else if (bits >= fromBits || ((acc<<(tobits-bits))&maxv) != 0) {
  		return []
  	}
  	return ret
  }

  function craftCashAddress(kind, addressHash, netType) {
  	var payload = packCashAddressData(kind, addressHash)
  	if (payload.length == 0) {
  		cleanResultAddress()
  		return
  	}
  	var expandPrefix = []
  	if (netType == true) {
  		expandPrefix = [2, 9, 20, 3, 15, 9, 14, 3, 1, 19, 8, 0]
  	} else {
  		expandPrefix = [2, 3, 8, 20, 5, 19, 20, 0]
  	}
    var enc = expandPrefix.concat(payload)
    var mod = polyMod(enc.concat([0,0,0,0,0,0,0,0]))
    var retChecksum = []
    for (var i = 0; i < 8; i++) {
      retChecksum[i] = getAs5bitArray((rShift(mod, 5*(7-i))).slice(-5))[0]
    }
  	var combined = payload.concat(retChecksum)
  	var ret = ""
  	if (netType == true) {
  		ret = "bitcoincash:"
  	} else {
  		ret = "bchtest:"
  	}
    for (var i = 0; i < combined.length; i++) {
      ret = ret.concat(CHARSET[combined[i]])
    }
    // Currently the addresses should be as long as 50 (testnet) or 54 characters,
    // Longer addresses are not in use currently
  	if (ret.length == 54 || ret.length == 50) {
      return ret
  	} else {
  		return null
  	}
  }

  function xor(a, b) {
    var t = a.length - b.length
    var c = []
    if (t > 0) {
      b = Array(t).fill(0).concat(b)
    } else if (t < 0) {
      a = Array(-t).fill(0).concat(a)
    }
    for (var i = 0; i < a.length; i++) {
      c.push(a[i] != b[i] ? 1 : 0)
    }
    return c
  }

  function rShift(a, b) {
    if (a.length <= b) {
      return [0]
    }
    if (b == 0) {
      return a
    }
    return a.slice(0, -b)
  }

  function getAs5bitArray(a) {
    var c = []
    for (var i = 0; i < a.length; i += 5) {
      c.push(16 * a[i] + 8 * a[i + 1] + 4 * a[i + 2] + 2 * a[i + 3] + a[i + 4])
    }
    return c
  }

  function getAsBitArray(v) {
    return [v >> 4, (v >> 3)&1, (v >> 2)&1, (v >> 1)&1, v&1]
  }

  function polyMod(v) {
    var c = [1]
    var c0 = []
    for (var i = 0; i < v.length; i++) {
      c0 = rShift(c, 35)
      c = xor(c.slice(-35).concat([0,0,0,0,0]), getAsBitArray(v[i]))

      if (c0.length < 5) {
        c0 = Array(5-c0.length).fill(0).concat(c0)
      }
      if (c0[4] != 0) {
        c = xor(c, [1,0,0,1,1,0,0,0,1,1,1,1,0,0,1,0,1,0,1,1,1,1,0,0,1,0,0,0,1,1,1,0,0,1,1,0,0,0,0,1])
      }
      if (c0[3] != 0) {
        c = xor(c, [1,1,1,1,0,0,1,1,0,1,1,0,1,1,1,0,1,1,0,1,1,0,1,1,0,0,1,1,0,0,1,1,1,1,0,0,0,1,0])
      }
      if (c0[2] != 0) {
        c = xor(c, [1,1,1,1,0,0,1,1,0,0,1,1,1,1,1,0,0,1,0,1,1,1,1,1,1,0,1,1,0,0,1,1,1,1,0,0,0,1,0,0])
      }
      if (c0[1] != 0) {
        c = xor(c, [1,0,1,0,1,1,1,0,0,0,1,0,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,0,0,0,1,0,1,0,1,0,1,0,0,0])
      }
      if (c0[0] != 0) {
        c = xor(c, [1,1,1,1,0,0,1,0,0,1,1,1,1,0,1,0,0,0,0,1,1,1,1,1,0,0,1,0,0,0,1,1,1,0,0,0,0])
      }
    }
    return xor(c, [1])
  }

  return root;
});
