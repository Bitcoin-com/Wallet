(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.bitanalytics = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

var Config = {
    DEBUG: false,
    LIB_VERSION: '2.22.4'
};

// since es6 imports are static and we run unit tests from the console, window won't be defined when importing this file
var window$1;
if (typeof(window) === 'undefined') {
    var loc = {
        hostname: ''
    };
    window$1 = {
        navigator: { userAgent: '' },
        document: {
            location: loc,
            referrer: ''
        },
        screen: { width: 0, height: 0 },
        location: loc
    };
} else {
    window$1 = window;
}



/*
 * Saved references to long variable names, so that closure compiler can
 * minimize file size.
 */

var ArrayProto = Array.prototype;
var FuncProto = Function.prototype;
var ObjProto = Object.prototype;
var slice = ArrayProto.slice;
var toString = ObjProto.toString;
var hasOwnProperty = ObjProto.hasOwnProperty;
var windowConsole = window$1.console;
var navigator$1 = window$1.navigator;
var document$1 = window$1.document;
var windowOpera = window$1.opera;
var screen = window$1.screen;
var userAgent = navigator$1.userAgent;
var nativeBind = FuncProto.bind;
var nativeForEach = ArrayProto.forEach;
var nativeIndexOf = ArrayProto.indexOf;
var nativeIsArray = Array.isArray;
var breaker = {};
var _ = {
    trim: function(str) {
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim#Polyfill
        return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
    }
};

// Console override
var console$1 = {
    /** @type {function(...[*])} */
    log: function() {
        if (Config.DEBUG && !_.isUndefined(windowConsole) && windowConsole) {
            try {
                windowConsole.log.apply(windowConsole, arguments);
            } catch (err) {
                _.each(arguments, function(arg) {
                    windowConsole.log(arg);
                });
            }
        }
    },
    /** @type {function(...[*])} */
    error: function() {
        if (Config.DEBUG && !_.isUndefined(windowConsole) && windowConsole) {
            var args = ['Mixpanel error:'].concat(_.toArray(arguments));
            try {
                windowConsole.error.apply(windowConsole, args);
            } catch (err) {
                _.each(args, function(arg) {
                    windowConsole.error(arg);
                });
            }
        }
    },
    /** @type {function(...[*])} */
    critical: function() {
        if (!_.isUndefined(windowConsole) && windowConsole) {
            var args = ['Mixpanel error:'].concat(_.toArray(arguments));
            try {
                windowConsole.error.apply(windowConsole, args);
            } catch (err) {
                _.each(args, function(arg) {
                    windowConsole.error(arg);
                });
            }
        }
    }
};


// UNDERSCORE
// Embed part of the Underscore Library
_.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) {
        return nativeBind.apply(func, slice.call(arguments, 1));
    }
    if (!_.isFunction(func)) {
        throw new TypeError();
    }
    args = slice.call(arguments, 2);
    bound = function() {
        if (!(this instanceof bound)) {
            return func.apply(context, args.concat(slice.call(arguments)));
        }
        var ctor = {};
        ctor.prototype = func.prototype;
        var self = new ctor();
        ctor.prototype = null;
        var result = func.apply(self, args.concat(slice.call(arguments)));
        if (Object(result) === result) {
            return result;
        }
        return self;
    };
    return bound;
};

_.bind_instance_methods = function(obj) {
    for (var func in obj) {
        if (typeof(obj[func]) === 'function') {
            obj[func] = _.bind(obj[func], obj);
        }
    }
};

/**
 * @param {*=} obj
 * @param {function(...[*])=} iterator
 * @param {Object=} context
 */
_.each = function(obj, iterator, context) {
    if (obj === null || obj === undefined) {
        return;
    }
    if (nativeForEach && obj.forEach === nativeForEach) {
        obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
        for (var i = 0, l = obj.length; i < l; i++) {
            if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) {
                return;
            }
        }
    } else {
        for (var key in obj) {
            if (hasOwnProperty.call(obj, key)) {
                if (iterator.call(context, obj[key], key, obj) === breaker) {
                    return;
                }
            }
        }
    }
};

_.escapeHTML = function(s) {
    var escaped = s;
    if (escaped && _.isString(escaped)) {
        escaped = escaped
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    return escaped;
};

_.extend = function(obj) {
    _.each(slice.call(arguments, 1), function(source) {
        for (var prop in source) {
            if (source[prop] !== void 0) {
                obj[prop] = source[prop];
            }
        }
    });
    return obj;
};

_.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
};

// from a comment on http://dbj.org/dbj/?p=286
// fails on only one very rare and deliberate custom object:
// var bomb = { toString : undefined, valueOf: function(o) { return "function BOMBA!"; }};
_.isFunction = function(f) {
    try {
        return /^\s*\bfunction\b/.test(f);
    } catch (x) {
        return false;
    }
};

_.isArguments = function(obj) {
    return !!(obj && hasOwnProperty.call(obj, 'callee'));
};

_.toArray = function(iterable) {
    if (!iterable) {
        return [];
    }
    if (iterable.toArray) {
        return iterable.toArray();
    }
    if (_.isArray(iterable)) {
        return slice.call(iterable);
    }
    if (_.isArguments(iterable)) {
        return slice.call(iterable);
    }
    return _.values(iterable);
};

_.keys = function(obj) {
    var results = [];
    if (obj === null) {
        return results;
    }
    _.each(obj, function(value, key) {
        results[results.length] = key;
    });
    return results;
};

_.values = function(obj) {
    var results = [];
    if (obj === null) {
        return results;
    }
    _.each(obj, function(value) {
        results[results.length] = value;
    });
    return results;
};

_.identity = function(value) {
    return value;
};

_.include = function(obj, target) {
    var found = false;
    if (obj === null) {
        return found;
    }
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) {
        return obj.indexOf(target) != -1;
    }
    _.each(obj, function(value) {
        if (found || (found = (value === target))) {
            return breaker;
        }
    });
    return found;
};

_.includes = function(str, needle) {
    return str.indexOf(needle) !== -1;
};

// Underscore Addons
_.inherit = function(subclass, superclass) {
    subclass.prototype = new superclass();
    subclass.prototype.constructor = subclass;
    subclass.superclass = superclass.prototype;
    return subclass;
};

_.isObject = function(obj) {
    return (obj === Object(obj) && !_.isArray(obj));
};

_.isEmptyObject = function(obj) {
    if (_.isObject(obj)) {
        for (var key in obj) {
            if (hasOwnProperty.call(obj, key)) {
                return false;
            }
        }
        return true;
    }
    return false;
};

_.isUndefined = function(obj) {
    return obj === void 0;
};

_.isString = function(obj) {
    return toString.call(obj) == '[object String]';
};

_.isDate = function(obj) {
    return toString.call(obj) == '[object Date]';
};

_.isNumber = function(obj) {
    return toString.call(obj) == '[object Number]';
};

_.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
};

_.encodeDates = function(obj) {
    _.each(obj, function(v, k) {
        if (_.isDate(v)) {
            obj[k] = _.formatDate(v);
        } else if (_.isObject(v)) {
            obj[k] = _.encodeDates(v); // recurse
        }
    });
    return obj;
};

_.timestamp = function() {
    Date.now = Date.now || function() {
        return +new Date;
    };
    return Date.now();
};

_.formatDate = function(d) {
    // YYYY-MM-DDTHH:MM:SS in UTC
    function pad(n) {
        return n < 10 ? '0' + n : n;
    }
    return d.getUTCFullYear() + '-' +
        pad(d.getUTCMonth() + 1) + '-' +
        pad(d.getUTCDate()) + 'T' +
        pad(d.getUTCHours()) + ':' +
        pad(d.getUTCMinutes()) + ':' +
        pad(d.getUTCSeconds());
};

_.safewrap = function(f) {
    return function() {
        try {
            return f.apply(this, arguments);
        } catch (e) {
            console$1.critical('Implementation error. Please turn on debug and contact support@mixpanel.com.');
            if (Config.DEBUG){
                console$1.critical(e);
            }
        }
    };
};

_.safewrap_class = function(klass, functions) {
    for (var i = 0; i < functions.length; i++) {
        klass.prototype[functions[i]] = _.safewrap(klass.prototype[functions[i]]);
    }
};

_.safewrap_instance_methods = function(obj) {
    for (var func in obj) {
        if (typeof(obj[func]) === 'function') {
            obj[func] = _.safewrap(obj[func]);
        }
    }
};

_.strip_empty_properties = function(p) {
    var ret = {};
    _.each(p, function(v, k) {
        if (_.isString(v) && v.length > 0) {
            ret[k] = v;
        }
    });
    return ret;
};

/*
 * this function returns a copy of object after truncating it.  If
 * passed an Array or Object it will iterate through obj and
 * truncate all the values recursively.
 */
_.truncate = function(obj, length) {
    var ret;

    if (typeof(obj) === 'string') {
        ret = obj.slice(0, length);
    } else if (_.isArray(obj)) {
        ret = [];
        _.each(obj, function(val) {
            ret.push(_.truncate(val, length));
        });
    } else if (_.isObject(obj)) {
        ret = {};
        _.each(obj, function(val, key) {
            ret[key] = _.truncate(val, length);
        });
    } else {
        ret = obj;
    }

    return ret;
};

_.JSONEncode = (function() {
    return function(mixed_val) {
        var value = mixed_val;
        var quote = function(string) {
            var escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g; // eslint-disable-line no-control-regex
            var meta = { // table of character substitutions
                '\b': '\\b',
                '\t': '\\t',
                '\n': '\\n',
                '\f': '\\f',
                '\r': '\\r',
                '"': '\\"',
                '\\': '\\\\'
            };

            escapable.lastIndex = 0;
            return escapable.test(string) ?
                '"' + string.replace(escapable, function(a) {
                    var c = meta[a];
                    return typeof c === 'string' ? c :
                        '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                }) + '"' :
                '"' + string + '"';
        };

        var str = function(key, holder) {
            var gap = '';
            var indent = '    ';
            var i = 0; // The loop counter.
            var k = ''; // The member key.
            var v = ''; // The member value.
            var length = 0;
            var mind = gap;
            var partial = [];
            var value = holder[key];

            // If the value has a toJSON method, call it to obtain a replacement value.
            if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
                value = value.toJSON(key);
            }

            // What happens next depends on the value's type.
            switch (typeof value) {
                case 'string':
                    return quote(value);

                case 'number':
                    // JSON numbers must be finite. Encode non-finite numbers as null.
                    return isFinite(value) ? String(value) : 'null';

                case 'boolean':
                case 'null':
                    // If the value is a boolean or null, convert it to a string. Note:
                    // typeof null does not produce 'null'. The case is included here in
                    // the remote chance that this gets fixed someday.

                    return String(value);

                case 'object':
                    // If the type is 'object', we might be dealing with an object or an array or
                    // null.
                    // Due to a specification blunder in ECMAScript, typeof null is 'object',
                    // so watch out for that case.
                    if (!value) {
                        return 'null';
                    }

                    // Make an array to hold the partial results of stringifying this object value.
                    gap += indent;
                    partial = [];

                    // Is the value an array?
                    if (toString.apply(value) === '[object Array]') {
                        // The value is an array. Stringify every element. Use null as a placeholder
                        // for non-JSON values.

                        length = value.length;
                        for (i = 0; i < length; i += 1) {
                            partial[i] = str(i, value) || 'null';
                        }

                        // Join all of the elements together, separated with commas, and wrap them in
                        // brackets.
                        v = partial.length === 0 ? '[]' :
                            gap ? '[\n' + gap +
                            partial.join(',\n' + gap) + '\n' +
                            mind + ']' :
                            '[' + partial.join(',') + ']';
                        gap = mind;
                        return v;
                    }

                    // Iterate through all of the keys in the object.
                    for (k in value) {
                        if (hasOwnProperty.call(value, k)) {
                            v = str(k, value);
                            if (v) {
                                partial.push(quote(k) + (gap ? ': ' : ':') + v);
                            }
                        }
                    }

                    // Join all of the member texts together, separated with commas,
                    // and wrap them in braces.
                    v = partial.length === 0 ? '{}' :
                        gap ? '{' + partial.join(',') + '' +
                        mind + '}' : '{' + partial.join(',') + '}';
                    gap = mind;
                    return v;
            }
        };

        // Make a fake root object containing our value under the key of ''.
        // Return the result of stringifying the value.
        return str('', {
            '': value
        });
    };
})();

/**
 * From https://github.com/douglascrockford/JSON-js/blob/master/json_parse.js
 * Slightly modified to throw a real Error rather than a POJO
 */
_.JSONDecode = (function() {
    var at, // The index of the current character
        ch, // The current character
        escapee = {
            '"': '"',
            '\\': '\\',
            '/': '/',
            'b': '\b',
            'f': '\f',
            'n': '\n',
            'r': '\r',
            't': '\t'
        },
        text,
        error = function(m) {
            var e = new SyntaxError(m);
            e.at = at;
            e.text = text;
            throw e;
        },
        next = function(c) {
            // If a c parameter is provided, verify that it matches the current character.
            if (c && c !== ch) {
                error('Expected \'' + c + '\' instead of \'' + ch + '\'');
            }
            // Get the next character. When there are no more characters,
            // return the empty string.
            ch = text.charAt(at);
            at += 1;
            return ch;
        },
        number = function() {
            // Parse a number value.
            var number,
                string = '';

            if (ch === '-') {
                string = '-';
                next('-');
            }
            while (ch >= '0' && ch <= '9') {
                string += ch;
                next();
            }
            if (ch === '.') {
                string += '.';
                while (next() && ch >= '0' && ch <= '9') {
                    string += ch;
                }
            }
            if (ch === 'e' || ch === 'E') {
                string += ch;
                next();
                if (ch === '-' || ch === '+') {
                    string += ch;
                    next();
                }
                while (ch >= '0' && ch <= '9') {
                    string += ch;
                    next();
                }
            }
            number = +string;
            if (!isFinite(number)) {
                error('Bad number');
            } else {
                return number;
            }
        },

        string = function() {
            // Parse a string value.
            var hex,
                i,
                string = '',
                uffff;
            // When parsing for string values, we must look for " and \ characters.
            if (ch === '"') {
                while (next()) {
                    if (ch === '"') {
                        next();
                        return string;
                    }
                    if (ch === '\\') {
                        next();
                        if (ch === 'u') {
                            uffff = 0;
                            for (i = 0; i < 4; i += 1) {
                                hex = parseInt(next(), 16);
                                if (!isFinite(hex)) {
                                    break;
                                }
                                uffff = uffff * 16 + hex;
                            }
                            string += String.fromCharCode(uffff);
                        } else if (typeof escapee[ch] === 'string') {
                            string += escapee[ch];
                        } else {
                            break;
                        }
                    } else {
                        string += ch;
                    }
                }
            }
            error('Bad string');
        },
        white = function() {
            // Skip whitespace.
            while (ch && ch <= ' ') {
                next();
            }
        },
        word = function() {
            // true, false, or null.
            switch (ch) {
                case 't':
                    next('t');
                    next('r');
                    next('u');
                    next('e');
                    return true;
                case 'f':
                    next('f');
                    next('a');
                    next('l');
                    next('s');
                    next('e');
                    return false;
                case 'n':
                    next('n');
                    next('u');
                    next('l');
                    next('l');
                    return null;
            }
            error('Unexpected "' + ch + '"');
        },
        value, // Placeholder for the value function.
        array = function() {
            // Parse an array value.
            var array = [];

            if (ch === '[') {
                next('[');
                white();
                if (ch === ']') {
                    next(']');
                    return array; // empty array
                }
                while (ch) {
                    array.push(value());
                    white();
                    if (ch === ']') {
                        next(']');
                        return array;
                    }
                    next(',');
                    white();
                }
            }
            error('Bad array');
        },
        object = function() {
            // Parse an object value.
            var key,
                object = {};

            if (ch === '{') {
                next('{');
                white();
                if (ch === '}') {
                    next('}');
                    return object; // empty object
                }
                while (ch) {
                    key = string();
                    white();
                    next(':');
                    if (Object.hasOwnProperty.call(object, key)) {
                        error('Duplicate key "' + key + '"');
                    }
                    object[key] = value();
                    white();
                    if (ch === '}') {
                        next('}');
                        return object;
                    }
                    next(',');
                    white();
                }
            }
            error('Bad object');
        };

    value = function() {
        // Parse a JSON value. It could be an object, an array, a string,
        // a number, or a word.
        white();
        switch (ch) {
            case '{':
                return object();
            case '[':
                return array();
            case '"':
                return string();
            case '-':
                return number();
            default:
                return ch >= '0' && ch <= '9' ? number() : word();
        }
    };

    // Return the json_parse function. It will have access to all of the
    // above functions and variables.
    return function(source) {
        var result;

        text = source;
        at = 0;
        ch = ' ';
        result = value();
        white();
        if (ch) {
            error('Syntax error');
        }

        return result;
    };
})();

_.base64Encode = function(data) {
    var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
        ac = 0,
        enc = '',
        tmp_arr = [];

    if (!data) {
        return data;
    }

    data = _.utf8Encode(data);

    do { // pack three octets into four hexets
        o1 = data.charCodeAt(i++);
        o2 = data.charCodeAt(i++);
        o3 = data.charCodeAt(i++);

        bits = o1 << 16 | o2 << 8 | o3;

        h1 = bits >> 18 & 0x3f;
        h2 = bits >> 12 & 0x3f;
        h3 = bits >> 6 & 0x3f;
        h4 = bits & 0x3f;

        // use hexets to index into b64, and append result to encoded string
        tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
    } while (i < data.length);

    enc = tmp_arr.join('');

    switch (data.length % 3) {
        case 1:
            enc = enc.slice(0, -2) + '==';
            break;
        case 2:
            enc = enc.slice(0, -1) + '=';
            break;
    }

    return enc;
};

_.utf8Encode = function(string) {
    string = (string + '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    var utftext = '',
        start,
        end;
    var stringl = 0,
        n;

    start = end = 0;
    stringl = string.length;

    for (n = 0; n < stringl; n++) {
        var c1 = string.charCodeAt(n);
        var enc = null;

        if (c1 < 128) {
            end++;
        } else if ((c1 > 127) && (c1 < 2048)) {
            enc = String.fromCharCode((c1 >> 6) | 192, (c1 & 63) | 128);
        } else {
            enc = String.fromCharCode((c1 >> 12) | 224, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128);
        }
        if (enc !== null) {
            if (end > start) {
                utftext += string.substring(start, end);
            }
            utftext += enc;
            start = end = n + 1;
        }
    }

    if (end > start) {
        utftext += string.substring(start, string.length);
    }

    return utftext;
};

_.UUID = (function() {

    // Time/ticks information
    // 1*new Date() is a cross browser version of Date.now()
    var T = function() {
        var d = 1 * new Date(),
            i = 0;

        // this while loop figures how many browser ticks go by
        // before 1*new Date() returns a new number, ie the amount
        // of ticks that go by per millisecond
        while (d == 1 * new Date()) {
            i++;
        }

        return d.toString(16) + i.toString(16);
    };

    // Math.Random entropy
    var R = function() {
        return Math.random().toString(16).replace('.', '');
    };

    // User agent entropy
    // This function takes the user agent string, and then xors
    // together each sequence of 8 bytes.  This produces a final
    // sequence of 8 bytes which it returns as hex.
    var UA = function() {
        var ua = userAgent,
            i, ch, buffer = [],
            ret = 0;

        function xor(result, byte_array) {
            var j, tmp = 0;
            for (j = 0; j < byte_array.length; j++) {
                tmp |= (buffer[j] << j * 8);
            }
            return result ^ tmp;
        }

        for (i = 0; i < ua.length; i++) {
            ch = ua.charCodeAt(i);
            buffer.unshift(ch & 0xFF);
            if (buffer.length >= 4) {
                ret = xor(ret, buffer);
                buffer = [];
            }
        }

        if (buffer.length > 0) {
            ret = xor(ret, buffer);
        }

        return ret.toString(16);
    };

    return function() {
        var se = (screen.height * screen.width).toString(16);
        return (T() + '-' + R() + '-' + UA() + '-' + se + '-' + T());
    };
})();

// _.isBlockedUA()
// This is to block various web spiders from executing our JS and
// sending false tracking data
_.isBlockedUA = function(ua) {
    if (/(google web preview|baiduspider|yandexbot|bingbot|googlebot|yahoo! slurp)/i.test(ua)) {
        return true;
    }
    return false;
};

/**
 * @param {Object=} formdata
 * @param {string=} arg_separator
 */
_.HTTPBuildQuery = function(formdata, arg_separator) {
    var use_val, use_key, tmp_arr = [];

    if (_.isUndefined(arg_separator)) {
        arg_separator = '&';
    }

    _.each(formdata, function(val, key) {
        use_val = encodeURIComponent(val.toString());
        use_key = encodeURIComponent(key);
        tmp_arr[tmp_arr.length] = use_key + '=' + use_val;
    });

    return tmp_arr.join(arg_separator);
};

_.getQueryParam = function(url, param) {
    // Expects a raw URL

    param = param.replace(/[\[]/, '\\\[').replace(/[\]]/, '\\\]');
    var regexS = '[\\?&]' + param + '=([^&#]*)',
        regex = new RegExp(regexS),
        results = regex.exec(url);
    if (results === null || (results && typeof(results[1]) !== 'string' && results[1].length)) {
        return '';
    } else {
        return decodeURIComponent(results[1]).replace(/\+/g, ' ');
    }
};

_.getHashParam = function(hash, param) {
    var matches = hash.match(new RegExp(param + '=([^&]*)'));
    return matches ? matches[1] : null;
};

// _.cookie
// Methods partially borrowed from quirksmode.org/js/cookies.html
_.cookie = {
    get: function(name) {
        var nameEQ = name + '=';
        var ca = document$1.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEQ) === 0) {
                return decodeURIComponent(c.substring(nameEQ.length, c.length));
            }
        }
        return null;
    },

    parse: function(name) {
        var cookie;
        try {
            cookie = _.JSONDecode(_.cookie.get(name)) || {};
        } catch (err) {
            // noop
        }
        return cookie;
    },

    set_seconds: function(name, value, seconds, cross_subdomain, is_secure) {
        var cdomain = '',
            expires = '',
            secure = '';

        if (cross_subdomain) {
            var matches = document$1.location.hostname.match(/[a-z0-9][a-z0-9\-]+\.[a-z\.]{2,6}$/i),
                domain = matches ? matches[0] : '';

            cdomain = ((domain) ? '; domain=.' + domain : '');
        }

        if (seconds) {
            var date = new Date();
            date.setTime(date.getTime() + (seconds * 1000));
            expires = '; expires=' + date.toGMTString();
        }

        if (is_secure) {
            secure = '; secure';
        }

        document$1.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/' + cdomain + secure;
    },

    set: function(name, value, days, cross_subdomain, is_secure) {
        var cdomain = '', expires = '', secure = '';

        if (cross_subdomain) {
            var matches = document$1.location.hostname.match(/[a-z0-9][a-z0-9\-]+\.[a-z\.]{2,6}$/i),
                domain = matches ? matches[0] : '';

            cdomain   = ((domain) ? '; domain=.' + domain : '');
        }

        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toGMTString();
        }

        if (is_secure) {
            secure = '; secure';
        }

        var new_cookie_val = name + '=' + encodeURIComponent(value) + expires + '; path=/' + cdomain + secure;
        document$1.cookie = new_cookie_val;
        return new_cookie_val;
    },

    remove: function(name, cross_subdomain) {
        _.cookie.set(name, '', -1, cross_subdomain);
    }
};

// _.localStorage
var _localStorage_supported = null;
_.localStorage = {
    is_supported: function() {
        if (_localStorage_supported !== null) {
            return _localStorage_supported;
        }

        var supported = true;
        try {
            var key = '__mplssupport__',
                val = 'xyz';
            _.localStorage.set(key, val);
            if (_.localStorage.get(key) !== val) {
                supported = false;
            }
            _.localStorage.remove(key);
        } catch (err) {
            supported = false;
        }
        if (!supported) {
            console$1.error('localStorage unsupported; falling back to cookie store');
        }

        _localStorage_supported = supported;
        return supported;
    },

    error: function(msg) {
        console$1.error('localStorage error: ' + msg);
    },

    get: function(name) {
        try {
            return window.localStorage.getItem(name);
        } catch (err) {
            _.localStorage.error(err);
        }
        return null;
    },

    parse: function(name) {
        try {
            return _.JSONDecode(_.localStorage.get(name)) || {};
        } catch (err) {
            // noop
        }
        return null;
    },

    set: function(name, value) {
        try {
            window.localStorage.setItem(name, value);
        } catch (err) {
            _.localStorage.error(err);
        }
    },

    remove: function(name) {
        try {
            window.localStorage.removeItem(name);
        } catch (err) {
            _.localStorage.error(err);
        }
    }
};

_.register_event = (function() {
    // written by Dean Edwards, 2005
    // with input from Tino Zijdel - crisp@xs4all.nl
    // with input from Carl Sverre - mail@carlsverre.com
    // with input from Mixpanel
    // http://dean.edwards.name/weblog/2005/10/add-event/
    // https://gist.github.com/1930440

    /**
     * @param {Object} element
     * @param {string} type
     * @param {function(...[*])} handler
     * @param {boolean=} oldSchool
     * @param {boolean=} useCapture
     */
    var register_event = function(element, type, handler, oldSchool, useCapture) {
        if (!element) {
            console$1.error('No valid element provided to register_event');
            return;
        }

        if (element.addEventListener && !oldSchool) {
            element.addEventListener(type, handler, !!useCapture);
        } else {
            var ontype = 'on' + type;
            var old_handler = element[ontype]; // can be undefined
            element[ontype] = makeHandler(element, handler, old_handler);
        }
    };

    function makeHandler(element, new_handler, old_handlers) {
        var handler = function(event) {
            event = event || fixEvent(window.event);

            // this basically happens in firefox whenever another script
            // overwrites the onload callback and doesn't pass the event
            // object to previously defined callbacks.  All the browsers
            // that don't define window.event implement addEventListener
            // so the dom_loaded handler will still be fired as usual.
            if (!event) {
                return undefined;
            }

            var ret = true;
            var old_result, new_result;

            if (_.isFunction(old_handlers)) {
                old_result = old_handlers(event);
            }
            new_result = new_handler.call(element, event);

            if ((false === old_result) || (false === new_result)) {
                ret = false;
            }

            return ret;
        };

        return handler;
    }

    function fixEvent(event) {
        if (event) {
            event.preventDefault = fixEvent.preventDefault;
            event.stopPropagation = fixEvent.stopPropagation;
        }
        return event;
    }
    fixEvent.preventDefault = function() {
        this.returnValue = false;
    };
    fixEvent.stopPropagation = function() {
        this.cancelBubble = true;
    };

    return register_event;
})();

_.dom_query = (function() {
    /* document.getElementsBySelector(selector)
    - returns an array of element objects from the current document
    matching the CSS selector. Selectors can contain element names,
    class names and ids and can be nested. For example:

    elements = document.getElementsBySelector('div#main p a.external')

    Will return an array of all 'a' elements with 'external' in their
    class attribute that are contained inside 'p' elements that are
    contained inside the 'div' element which has id="main"

    New in version 0.4: Support for CSS2 and CSS3 attribute selectors:
    See http://www.w3.org/TR/css3-selectors/#attribute-selectors

    Version 0.4 - Simon Willison, March 25th 2003
    -- Works in Phoenix 0.5, Mozilla 1.3, Opera 7, Internet Explorer 6, Internet Explorer 5 on Windows
    -- Opera 7 fails

    Version 0.5 - Carl Sverre, Jan 7th 2013
    -- Now uses jQuery-esque `hasClass` for testing class name
    equality.  This fixes a bug related to '-' characters being
    considered not part of a 'word' in regex.
    */

    function getAllChildren(e) {
        // Returns all children of element. Workaround required for IE5/Windows. Ugh.
        return e.all ? e.all : e.getElementsByTagName('*');
    }

    var bad_whitespace = /[\t\r\n]/g;

    function hasClass(elem, selector) {
        var className = ' ' + selector + ' ';
        return ((' ' + elem.className + ' ').replace(bad_whitespace, ' ').indexOf(className) >= 0);
    }

    function getElementsBySelector(selector) {
        // Attempt to fail gracefully in lesser browsers
        if (!document$1.getElementsByTagName) {
            return [];
        }
        // Split selector in to tokens
        var tokens = selector.split(' ');
        var token, bits, tagName, found, foundCount, i, j, k, elements, currentContextIndex;
        var currentContext = [document$1];
        for (i = 0; i < tokens.length; i++) {
            token = tokens[i].replace(/^\s+/, '').replace(/\s+$/, '');
            if (token.indexOf('#') > -1) {
                // Token is an ID selector
                bits = token.split('#');
                tagName = bits[0];
                var id = bits[1];
                var element = document$1.getElementById(id);
                if (!element || (tagName && element.nodeName.toLowerCase() != tagName)) {
                    // element not found or tag with that ID not found, return false
                    return [];
                }
                // Set currentContext to contain just this element
                currentContext = [element];
                continue; // Skip to next token
            }
            if (token.indexOf('.') > -1) {
                // Token contains a class selector
                bits = token.split('.');
                tagName = bits[0];
                var className = bits[1];
                if (!tagName) {
                    tagName = '*';
                }
                // Get elements matching tag, filter them for class selector
                found = [];
                foundCount = 0;
                for (j = 0; j < currentContext.length; j++) {
                    if (tagName == '*') {
                        elements = getAllChildren(currentContext[j]);
                    } else {
                        elements = currentContext[j].getElementsByTagName(tagName);
                    }
                    for (k = 0; k < elements.length; k++) {
                        found[foundCount++] = elements[k];
                    }
                }
                currentContext = [];
                currentContextIndex = 0;
                for (j = 0; j < found.length; j++) {
                    if (found[j].className &&
                        _.isString(found[j].className) && // some SVG elements have classNames which are not strings
                        hasClass(found[j], className)
                    ) {
                        currentContext[currentContextIndex++] = found[j];
                    }
                }
                continue; // Skip to next token
            }
            // Code to deal with attribute selectors
            var token_match = token.match(/^(\w*)\[(\w+)([=~\|\^\$\*]?)=?"?([^\]"]*)"?\]$/);
            if (token_match) {
                tagName = token_match[1];
                var attrName = token_match[2];
                var attrOperator = token_match[3];
                var attrValue = token_match[4];
                if (!tagName) {
                    tagName = '*';
                }
                // Grab all of the tagName elements within current context
                found = [];
                foundCount = 0;
                for (j = 0; j < currentContext.length; j++) {
                    if (tagName == '*') {
                        elements = getAllChildren(currentContext[j]);
                    } else {
                        elements = currentContext[j].getElementsByTagName(tagName);
                    }
                    for (k = 0; k < elements.length; k++) {
                        found[foundCount++] = elements[k];
                    }
                }
                currentContext = [];
                currentContextIndex = 0;
                var checkFunction; // This function will be used to filter the elements
                switch (attrOperator) {
                    case '=': // Equality
                        checkFunction = function(e) {
                            return (e.getAttribute(attrName) == attrValue);
                        };
                        break;
                    case '~': // Match one of space seperated words
                        checkFunction = function(e) {
                            return (e.getAttribute(attrName).match(new RegExp('\\b' + attrValue + '\\b')));
                        };
                        break;
                    case '|': // Match start with value followed by optional hyphen
                        checkFunction = function(e) {
                            return (e.getAttribute(attrName).match(new RegExp('^' + attrValue + '-?')));
                        };
                        break;
                    case '^': // Match starts with value
                        checkFunction = function(e) {
                            return (e.getAttribute(attrName).indexOf(attrValue) === 0);
                        };
                        break;
                    case '$': // Match ends with value - fails with "Warning" in Opera 7
                        checkFunction = function(e) {
                            return (e.getAttribute(attrName).lastIndexOf(attrValue) == e.getAttribute(attrName).length - attrValue.length);
                        };
                        break;
                    case '*': // Match ends with value
                        checkFunction = function(e) {
                            return (e.getAttribute(attrName).indexOf(attrValue) > -1);
                        };
                        break;
                    default:
                        // Just test for existence of attribute
                        checkFunction = function(e) {
                            return e.getAttribute(attrName);
                        };
                }
                currentContext = [];
                currentContextIndex = 0;
                for (j = 0; j < found.length; j++) {
                    if (checkFunction(found[j])) {
                        currentContext[currentContextIndex++] = found[j];
                    }
                }
                // alert('Attribute Selector: '+tagName+' '+attrName+' '+attrOperator+' '+attrValue);
                continue; // Skip to next token
            }
            // If we get here, token is JUST an element (not a class or ID selector)
            tagName = token;
            found = [];
            foundCount = 0;
            for (j = 0; j < currentContext.length; j++) {
                elements = currentContext[j].getElementsByTagName(tagName);
                for (k = 0; k < elements.length; k++) {
                    found[foundCount++] = elements[k];
                }
            }
            currentContext = found;
        }
        return currentContext;
    }

    return function(query) {
        if (_.isElement(query)) {
            return [query];
        } else if (_.isObject(query) && !_.isUndefined(query.length)) {
            return query;
        } else {
            return getElementsBySelector.call(this, query);
        }
    };
})();

_.info = {
    campaignParams: function() {
        var campaign_keywords = 'utm_source utm_medium utm_campaign utm_content utm_term'.split(' '),
            kw = '',
            params = {};
        _.each(campaign_keywords, function(kwkey) {
            kw = _.getQueryParam(document$1.URL, kwkey);
            if (kw.length) {
                params[kwkey] = kw;
            }
        });

        return params;
    },

    searchEngine: function(referrer) {
        if (referrer.search('https?://(.*)google.([^/?]*)') === 0) {
            return 'google';
        } else if (referrer.search('https?://(.*)bing.com') === 0) {
            return 'bing';
        } else if (referrer.search('https?://(.*)yahoo.com') === 0) {
            return 'yahoo';
        } else if (referrer.search('https?://(.*)duckduckgo.com') === 0) {
            return 'duckduckgo';
        } else {
            return null;
        }
    },

    searchInfo: function(referrer) {
        var search = _.info.searchEngine(referrer),
            param = (search != 'yahoo') ? 'q' : 'p',
            ret = {};

        if (search !== null) {
            ret['$search_engine'] = search;

            var keyword = _.getQueryParam(referrer, param);
            if (keyword.length) {
                ret['mp_keyword'] = keyword;
            }
        }

        return ret;
    },

    /**
     * This function detects which browser is running this script.
     * The order of the checks are important since many user agents
     * include key words used in later checks.
     */
    browser: function(user_agent, vendor, opera) {
        vendor = vendor || ''; // vendor is undefined for at least IE9
        if (opera || _.includes(user_agent, ' OPR/')) {
            if (_.includes(user_agent, 'Mini')) {
                return 'Opera Mini';
            }
            return 'Opera';
        } else if (/(BlackBerry|PlayBook|BB10)/i.test(user_agent)) {
            return 'BlackBerry';
        } else if (_.includes(user_agent, 'IEMobile') || _.includes(user_agent, 'WPDesktop')) {
            return 'Internet Explorer Mobile';
        } else if (_.includes(user_agent, 'Edge')) {
            return 'Microsoft Edge';
        } else if (_.includes(user_agent, 'FBIOS')) {
            return 'Facebook Mobile';
        } else if (_.includes(user_agent, 'Chrome')) {
            return 'Chrome';
        } else if (_.includes(user_agent, 'CriOS')) {
            return 'Chrome iOS';
        } else if (_.includes(user_agent, 'UCWEB') || _.includes(user_agent, 'UCBrowser')) {
            return 'UC Browser';
        } else if (_.includes(user_agent, 'FxiOS')) {
            return 'Firefox iOS';
        } else if (_.includes(vendor, 'Apple')) {
            if (_.includes(user_agent, 'Mobile')) {
                return 'Mobile Safari';
            }
            return 'Safari';
        } else if (_.includes(user_agent, 'Android')) {
            return 'Android Mobile';
        } else if (_.includes(user_agent, 'Konqueror')) {
            return 'Konqueror';
        } else if (_.includes(user_agent, 'Firefox')) {
            return 'Firefox';
        } else if (_.includes(user_agent, 'MSIE') || _.includes(user_agent, 'Trident/')) {
            return 'Internet Explorer';
        } else if (_.includes(user_agent, 'Gecko')) {
            return 'Mozilla';
        } else {
            return '';
        }
    },

    /**
     * This function detects which browser version is running this script,
     * parsing major and minor version (e.g., 42.1). User agent strings from:
     * http://www.useragentstring.com/pages/useragentstring.php
     */
    browserVersion: function(userAgent, vendor, opera) {
        var browser = _.info.browser(userAgent, vendor, opera);
        var versionRegexs = {
            'Internet Explorer Mobile': /rv:(\d+(\.\d+)?)/,
            'Microsoft Edge': /Edge\/(\d+(\.\d+)?)/,
            'Chrome': /Chrome\/(\d+(\.\d+)?)/,
            'Chrome iOS': /CriOS\/(\d+(\.\d+)?)/,
            'UC Browser' : /(UCBrowser|UCWEB)\/(\d+(\.\d+)?)/,
            'Safari': /Version\/(\d+(\.\d+)?)/,
            'Mobile Safari': /Version\/(\d+(\.\d+)?)/,
            'Opera': /(Opera|OPR)\/(\d+(\.\d+)?)/,
            'Firefox': /Firefox\/(\d+(\.\d+)?)/,
            'Firefox iOS': /FxiOS\/(\d+(\.\d+)?)/,
            'Konqueror': /Konqueror:(\d+(\.\d+)?)/,
            'BlackBerry': /BlackBerry (\d+(\.\d+)?)/,
            'Android Mobile': /android\s(\d+(\.\d+)?)/,
            'Internet Explorer': /(rv:|MSIE )(\d+(\.\d+)?)/,
            'Mozilla': /rv:(\d+(\.\d+)?)/
        };
        var regex = versionRegexs[browser];
        if (regex === undefined) {
            return null;
        }
        var matches = userAgent.match(regex);
        if (!matches) {
            return null;
        }
        return parseFloat(matches[matches.length - 2]);
    },

    os: function() {
        var a = userAgent;
        if (/Windows/i.test(a)) {
            if (/Phone/.test(a) || /WPDesktop/.test(a)) {
                return 'Windows Phone';
            }
            return 'Windows';
        } else if (/(iPhone|iPad|iPod)/.test(a)) {
            return 'iOS';
        } else if (/Android/.test(a)) {
            return 'Android';
        } else if (/(BlackBerry|PlayBook|BB10)/i.test(a)) {
            return 'BlackBerry';
        } else if (/Mac/i.test(a)) {
            return 'Mac OS X';
        } else if (/Linux/.test(a)) {
            return 'Linux';
        } else if (/CrOS/.test(a)) {
            return 'Chrome OS';
        } else {
            return '';
        }
    },

    device: function(user_agent) {
        if (/Windows Phone/i.test(user_agent) || /WPDesktop/.test(user_agent)) {
            return 'Windows Phone';
        } else if (/iPad/.test(user_agent)) {
            return 'iPad';
        } else if (/iPod/.test(user_agent)) {
            return 'iPod Touch';
        } else if (/iPhone/.test(user_agent)) {
            return 'iPhone';
        } else if (/(BlackBerry|PlayBook|BB10)/i.test(user_agent)) {
            return 'BlackBerry';
        } else if (/Android/.test(user_agent)) {
            return 'Android';
        } else {
            return '';
        }
    },

    referringDomain: function(referrer) {
        var split = referrer.split('/');
        if (split.length >= 3) {
            return split[2];
        }
        return '';
    },

    properties: function() {
        return _.extend(_.strip_empty_properties({
            '$os': _.info.os(),
            '$browser': _.info.browser(userAgent, navigator$1.vendor, windowOpera),
            '$referrer': document$1.referrer,
            '$referring_domain': _.info.referringDomain(document$1.referrer),
            '$device': _.info.device(userAgent)
        }), {
            '$current_url': window$1.location.href,
            '$browser_version': _.info.browserVersion(userAgent, navigator$1.vendor, windowOpera),
            '$screen_height': screen.height,
            '$screen_width': screen.width,
            'mp_lib': 'web',
            '$lib_version': Config.LIB_VERSION
        });
    },

    people_properties: function() {
        return _.extend(_.strip_empty_properties({
            '$os': _.info.os(),
            '$browser': _.info.browser(userAgent, navigator$1.vendor, windowOpera)
        }), {
            '$browser_version': _.info.browserVersion(userAgent, navigator$1.vendor, windowOpera)
        });
    },

    pageviewInfo: function(page) {
        return _.strip_empty_properties({
            'mp_page': page,
            'mp_referrer': document$1.referrer,
            'mp_browser': _.info.browser(userAgent, navigator$1.vendor, windowOpera),
            'mp_platform': _.info.os()
        });
    }
};

// EXPORTS (for closure compiler)
_['toArray']            = _.toArray;
_['isObject']           = _.isObject;
_['JSONEncode']         = _.JSONEncode;
_['JSONDecode']         = _.JSONDecode;
_['isBlockedUA']        = _.isBlockedUA;
_['isEmptyObject']      = _.isEmptyObject;
_['info']               = _.info;
_['info']['device']     = _.info.device;
_['info']['browser']    = _.info.browser;
_['info']['properties'] = _.info.properties;

/*
 * Get the className of an element, accounting for edge cases where element.className is an object
 * @param {Element} el - element to get the className of
 * @returns {string} the element's class
 */
function getClassName(el) {
    switch(typeof el.className) {
        case 'string':
            return el.className;
        case 'object': // handle cases where className might be SVGAnimatedString or some other type
            return el.className.baseVal || el.getAttribute('class') || '';
        default: // future proof
            return '';
    }
}

/*
 * Get the direct text content of an element, protecting against sensitive data collection.
 * Concats textContent of each of the element's text node children; this avoids potential
 * collection of sensitive data that could happen if we used element.textContent and the
 * element had sensitive child elements, since element.textContent includes child content.
 * Scrubs values that look like they could be sensitive (i.e. cc or ssn number).
 * @param {Element} el - element to get the text of
 * @returns {string} the element's direct text content
 */
function getSafeText(el) {
    var elText = '';

    if (shouldTrackElement(el) && el.childNodes && el.childNodes.length) {
        _.each(el.childNodes, function(child) {
            if (isTextNode(child) && child.textContent) {
                elText += _.trim(child.textContent)
                    // scrub potentially sensitive values
                    .split(/(\s+)/).filter(shouldTrackValue).join('')
                    // normalize whitespace
                    .replace(/[\r\n]/g, ' ').replace(/[ ]+/g, ' ')
                    // truncate
                    .substring(0, 255);
            }
        });
    }

    return _.trim(elText);
}

/*
 * Check whether an element has nodeType Node.ELEMENT_NODE
 * @param {Element} el - element to check
 * @returns {boolean} whether el is of the correct nodeType
 */
function isElementNode(el) {
    return el && el.nodeType === 1; // Node.ELEMENT_NODE - use integer constant for browser portability
}

/*
 * Check whether an element is of a given tag type.
 * Due to potential reference discrepancies (such as the webcomponents.js polyfill),
 * we want to match tagNames instead of specific references because something like
 * element === document.body won't always work because element might not be a native
 * element.
 * @param {Element} el - element to check
 * @param {string} tag - tag name (e.g., "div")
 * @returns {boolean} whether el is of the given tag type
 */
function isTag(el, tag) {
    return el && el.tagName && el.tagName.toLowerCase() === tag.toLowerCase();
}

/*
 * Check whether an element has nodeType Node.TEXT_NODE
 * @param {Element} el - element to check
 * @returns {boolean} whether el is of the correct nodeType
 */
function isTextNode(el) {
    return el && el.nodeType === 3; // Node.TEXT_NODE - use integer constant for browser portability
}

/*
 * Check whether a DOM event should be "tracked" or if it may contain sentitive data
 * using a variety of heuristics.
 * @param {Element} el - element to check
 * @param {Event} event - event to check
 * @returns {boolean} whether the event should be tracked
 */
function shouldTrackDomEvent(el, event) {
    if (!el || isTag(el, 'html') || !isElementNode(el)) {
        return false;
    }
    var tag = el.tagName.toLowerCase();
    switch (tag) {
        case 'html':
            return false;
        case 'form':
            return event.type === 'submit';
        case 'input':
            if (['button', 'submit'].indexOf(el.getAttribute('type')) === -1) {
                return event.type === 'change';
            } else {
                return event.type === 'click';
            }
        case 'select':
        case 'textarea':
            return event.type === 'change';
        default:
            return event.type === 'click';
    }
}

/*
 * Check whether a DOM element should be "tracked" or if it may contain sentitive data
 * using a variety of heuristics.
 * @param {Element} el - element to check
 * @returns {boolean} whether the element should be tracked
 */
function shouldTrackElement(el) {
    for (var curEl = el; curEl.parentNode && !isTag(curEl, 'body'); curEl = curEl.parentNode) {
        var classes = getClassName(curEl).split(' ');
        if (_.includes(classes, 'mp-sensitive') || _.includes(classes, 'mp-no-track')) {
            return false;
        }
    }

    if (_.includes(getClassName(el).split(' '), 'mp-include')) {
        return true;
    }

    // don't send data from inputs or similar elements since there will always be
    // a risk of clientside javascript placing sensitive data in attributes
    if (
        isTag(el, 'input') ||
        isTag(el, 'select') ||
        isTag(el, 'textarea') ||
        el.getAttribute('contenteditable') === 'true'
    ) {
        return false;
    }

    // don't include hidden or password fields
    var type = el.type || '';
    if (typeof type === 'string') { // it's possible for el.type to be a DOM element if el is a form with a child input[name="type"]
        switch(type.toLowerCase()) {
            case 'hidden':
                return false;
            case 'password':
                return false;
        }
    }

    // filter out data from fields that look like sensitive fields
    var name = el.name || el.id || '';
    if (typeof name === 'string') { // it's possible for el.name or el.id to be a DOM element if el is a form with a child input[name="name"]
        var sensitiveNameRegex = /^cc|cardnum|ccnum|creditcard|csc|cvc|cvv|exp|pass|pwd|routing|seccode|securitycode|securitynum|socialsec|socsec|ssn/i;
        if (sensitiveNameRegex.test(name.replace(/[^a-zA-Z0-9]/g, ''))) {
            return false;
        }
    }

    return true;
}

/*
 * Check whether a string value should be "tracked" or if it may contain sentitive data
 * using a variety of heuristics.
 * @param {string} value - string value to check
 * @returns {boolean} whether the element should be tracked
 */
function shouldTrackValue(value) {
    if (value === null || _.isUndefined(value)) {
        return false;
    }

    if (typeof value === 'string') {
        value = _.trim(value);

        // check to see if input value looks like a credit card number
        // see: https://www.safaribooksonline.com/library/view/regular-expressions-cookbook/9781449327453/ch04s20.html
        var ccRegex = /^(?:(4[0-9]{12}(?:[0-9]{3})?)|(5[1-5][0-9]{14})|(6(?:011|5[0-9]{2})[0-9]{12})|(3[47][0-9]{13})|(3(?:0[0-5]|[68][0-9])[0-9]{11})|((?:2131|1800|35[0-9]{3})[0-9]{11}))$/;
        if (ccRegex.test((value || '').replace(/[\- ]/g, ''))) {
            return false;
        }

        // check to see if input value looks like a social security number
        var ssnRegex = /(^\d{3}-?\d{2}-?\d{4}$)/;
        if (ssnRegex.test(value)) {
            return false;
        }
    }

    return true;
}

var autotrack = {
    _initializedTokens: [],

    _previousElementSibling: function(el) {
        if (el.previousElementSibling) {
            return el.previousElementSibling;
        } else {
            do {
                el = el.previousSibling;
            } while (el && !isElementNode(el));
            return el;
        }
    },

    _loadScript: function(scriptUrlToLoad, callback) {
        var scriptTag = document.createElement('script');
        scriptTag.type = 'text/javascript';
        scriptTag.src = scriptUrlToLoad;
        scriptTag.onload = callback;

        var scripts = document.getElementsByTagName('script');
        if (scripts.length > 0) {
            scripts[0].parentNode.insertBefore(scriptTag, scripts[0]);
        } else {
            document.body.appendChild(scriptTag);
        }
    },

    _getPropertiesFromElement: function(elem) {
        var props = {
            'classes': getClassName(elem).split(' '),
            'tag_name': elem.tagName.toLowerCase()
        };

        if (shouldTrackElement(elem)) {
            _.each(elem.attributes, function(attr) {
                if (shouldTrackValue(attr.value)) {
                    props['attr__' + attr.name] = attr.value;
                }
            });
        }

        var nthChild = 1;
        var nthOfType = 1;
        var currentElem = elem;
        while (currentElem = this._previousElementSibling(currentElem)) { // eslint-disable-line no-cond-assign
            nthChild++;
            if (currentElem.tagName === elem.tagName) {
                nthOfType++;
            }
        }
        props['nth_child'] = nthChild;
        props['nth_of_type'] = nthOfType;

        return props;
    },

    _getDefaultProperties: function(eventType) {
        return {
            '$event_type': eventType,
            '$ce_version': 1,
            '$host': window.location.host,
            '$pathname': window.location.pathname
        };
    },

    _extractCustomPropertyValue: function(customProperty) {
        var propValues = [];
        _.each(document.querySelectorAll(customProperty['css_selector']), function(matchedElem) {
            var value;

            if (['input', 'select'].indexOf(matchedElem.tagName.toLowerCase()) > -1) {
                value = matchedElem['value'];
            } else if (matchedElem['textContent']) {
                value = matchedElem['textContent'];
            }

            if (shouldTrackValue(value)) {
                propValues.push(value);
            }
        });
        return propValues.join(', ');
    },

    _getCustomProperties: function(targetElementList) {
        var props = {};
        _.each(this._customProperties, function(customProperty) {
            _.each(customProperty['event_selectors'], function(eventSelector) {
                var eventElements = document.querySelectorAll(eventSelector);
                _.each(eventElements, function(eventElement) {
                    if (_.includes(targetElementList, eventElement) && shouldTrackElement(eventElement)) {
                        props[customProperty['name']] = this._extractCustomPropertyValue(customProperty);
                    }
                }, this);
            }, this);
        }, this);
        return props;
    },

    _getEventTarget: function(e) {
        // https://developer.mozilla.org/en-US/docs/Web/API/Event/target#Compatibility_notes
        if (typeof e.target === 'undefined') {
            return e.srcElement;
        } else {
            return e.target;
        }
    },

    _trackEvent: function(e, instance) {
        /*** Don't mess with this code without running IE8 tests on it ***/
        var target = this._getEventTarget(e);
        if (isTextNode(target)) { // defeat Safari bug (see: http://www.quirksmode.org/js/events_properties.html)
            target = target.parentNode;
        }

        if (shouldTrackDomEvent(target, e)) {
            var targetElementList = [target];
            var curEl = target;
            while (curEl.parentNode && !isTag(curEl, 'body')) {
                targetElementList.push(curEl.parentNode);
                curEl = curEl.parentNode;
            }

            var elementsJson = [];
            var href, explicitNoTrack = false;
            _.each(targetElementList, function(el) {
                var shouldTrackEl = shouldTrackElement(el);

                // if the element or a parent element is an anchor tag
                // include the href as a property
                if (el.tagName.toLowerCase() === 'a') {
                    href = el.getAttribute('href');
                    href = shouldTrackEl && shouldTrackValue(href) && href;
                }

                // allow users to programatically prevent tracking of elements by adding class 'mp-no-track'
                var classes = getClassName(el).split(' ');
                if (_.includes(classes, 'mp-no-track')) {
                    explicitNoTrack = true;
                }

                elementsJson.push(this._getPropertiesFromElement(el));
            }, this);

            if (explicitNoTrack) {
                return false;
            }

            // only populate text content from target element (not parents)
            // to prevent text within a sensitive element from being collected
            // as part of a parent's el.textContent
            var elementText;
            var safeElementText = getSafeText(target);
            if (safeElementText && safeElementText.length) {
                elementText = safeElementText;
            }

            var props = _.extend(
                this._getDefaultProperties(e.type),
                {
                    '$elements':  elementsJson,
                    '$el_attr__href': href,
                    '$el_text': elementText
                },
                this._getCustomProperties(targetElementList)
            );

            instance.track('$web_event', props);
            return true;
        }
    },

    // only reason is to stub for unit tests
    // since you can't override window.location props
    _navigate: function(href) {
        window.location.href = href;
    },

    _addDomEventHandlers: function(instance) {
        var handler = _.bind(function(e) {
            e = e || window.event;
            this._trackEvent(e, instance);
        }, this);
        _.register_event(document, 'submit', handler, false, true);
        _.register_event(document, 'change', handler, false, true);
        _.register_event(document, 'click', handler, false, true);
    },

    _customProperties: {},
    init: function(instance) {
        if (!(document && document.body)) {
            console.log('document not ready yet, trying again in 500 milliseconds...');
            var that = this;
            setTimeout(function() { that.init(instance); }, 500);
            return;
        }

        var token = instance.get_config('token');
        if (this._initializedTokens.indexOf(token) > -1) {
            console.log('autotrack already initialized for token "' + token + '"');
            return;
        }
        this._initializedTokens.push(token);

        if (!this._maybeLoadEditor(instance)) { // don't autotrack actions when the editor is enabled
            var parseDecideResponse = _.bind(function(response) {
                if (response && response['config'] && response['config']['enable_collect_everything'] === true) {

                    if (response['custom_properties']) {
                        this._customProperties = response['custom_properties'];
                    }

                    instance.track('$web_event', _.extend({
                        '$title': document.title
                    }, this._getDefaultProperties('pageview')));

                    this._addDomEventHandlers(instance);

                } else {
                    instance['__autotrack_enabled'] = false;
                }
            }, this);

            instance._send_request(
                instance.get_config('api_host') + '/decide/', {
                    'verbose': true,
                    'version': '1',
                    'lib': 'web',
                    'token': token
                },
                instance._prepare_callback(parseDecideResponse)
            );
        }
    },

    _editorParamsFromHash: function(instance, hash) {
        var editorParams;
        try {
            var state = _.getHashParam(hash, 'state');
            state = JSON.parse(decodeURIComponent(state));
            var expiresInSeconds = _.getHashParam(hash, 'expires_in');
            editorParams = {
                'accessToken': _.getHashParam(hash, 'access_token'),
                'accessTokenExpiresAt': (new Date()).getTime() + (Number(expiresInSeconds) * 1000),
                'bookmarkletMode': !!state['bookmarkletMode'],
                'projectId': state['projectId'],
                'projectOwnerId': state['projectOwnerId'],
                'projectToken': state['token'],
                'readOnly': state['readOnly'],
                'userFlags': state['userFlags'],
                'userId': state['userId']
            };
            window.sessionStorage.setItem('editorParams', JSON.stringify(editorParams));

            if (state['desiredHash']) {
                window.location.hash = state['desiredHash'];
            } else if (window.history) {
                history.replaceState('', document.title, window.location.pathname + window.location.search); // completely remove hash
            } else {
                window.location.hash = ''; // clear hash (but leaves # unfortunately)
            }
        } catch (e) {
            console.error('Unable to parse data from hash', e);
        }
        return editorParams;
    },

    /**
     * To load the visual editor, we need an access token and other state. That state comes from one of three places:
     * 1. In the URL hash params if the customer is using an old snippet
     * 2. From session storage under the key `_mpcehash` if the snippet already parsed the hash
     * 3. From session storage under the key `editorParams` if the editor was initialized on a previous page
     */
    _maybeLoadEditor: function(instance) {
        try {
            var parseFromUrl = false;
            if (_.getHashParam(window.location.hash, 'state')) {
                var state = _.getHashParam(window.location.hash, 'state');
                state = JSON.parse(decodeURIComponent(state));
                parseFromUrl = state['action'] === 'mpeditor';
            }
            var parseFromStorage = !!window.sessionStorage.getItem('_mpcehash');
            var editorParams;

            if (parseFromUrl) { // happens if they are initializing the editor using an old snippet
                editorParams = this._editorParamsFromHash(instance, window.location.hash);
            } else if (parseFromStorage) { // happens if they are initialized the editor and using the new snippet
                editorParams = this._editorParamsFromHash(instance, window.sessionStorage.getItem('_mpcehash'));
                window.sessionStorage.removeItem('_mpcehash');
            } else { // get credentials from sessionStorage from a previous initialzation
                editorParams = JSON.parse(window.sessionStorage.getItem('editorParams') || '{}');
            }

            if (editorParams['projectToken'] && instance.get_config('token') === editorParams['projectToken']) {
                this._loadEditor(instance, editorParams);
                return true;
            } else {
                return false;
            }
        } catch (e) {
            return false;
        }
    },

    _loadEditor: function(instance, editorParams) {
        if (!window['_mpEditorLoaded']) { // only load the codeless event editor once, even if there are multiple instances of MixpanelLib
            window['_mpEditorLoaded'] = true;
            var editorUrl = instance.get_config('app_host')
              + '/js-bundle/reports/collect-everything/editor.js?_ts='
              + (new Date()).getTime();
            this._loadScript(editorUrl, function() {
                window['mp_load_editor'](editorParams);
            });
            return true;
        }
        return false;
    },

    // this is a mechanism to ramp up CE with no server-side interaction.
    // when CE is active, every page load results in a decide request. we
    // need to gently ramp this up so we don't overload decide. this decides
    // deterministically if CE is enabled for this project by modding the char
    // value of the project token.
    enabledForProject: function(token, numBuckets, numEnabledBuckets) {
        numBuckets = !_.isUndefined(numBuckets) ? numBuckets : 10;
        numEnabledBuckets = !_.isUndefined(numEnabledBuckets) ? numEnabledBuckets : 10;
        var charCodeSum = 0;
        for (var i = 0; i < token.length; i++) {
            charCodeSum += token.charCodeAt(i);
        }
        return (charCodeSum % numBuckets) < numEnabledBuckets;
    },

    isBrowserSupported: function() {
        return _.isFunction(document.querySelectorAll);
    }
};

_.bind_instance_methods(autotrack);
_.safewrap_instance_methods(autotrack);

/**
 * A function used to track a Mixpanel event (e.g. MixpanelLib.track)
 * @callback trackFunction
 * @param {String} event_name The name of the event. This can be anything the user does - 'Button Click', 'Sign Up', 'Item Purchased', etc.
 * @param {Object} [properties] A set of properties to include with the event you're sending. These describe the user who did the event or details about the event itself.
 * @param {Function} [callback] If provided, the callback function will be called after tracking the event.
 */

/** Public **/

var GDPR_DEFAULT_PERSISTENCE_PREFIX = '__mp_opt_in_out_';

/**
 * Opt the user in to data tracking and cookies/localstorage for the given token
 * @param {string} token - Mixpanel project tracking token
 * @param {Object} [options]
 * @param {trackFunction} [options.track] - function used for tracking a Mixpanel event to record the opt-in action
 * @param {string} [options.trackEventName] - event name to be used for tracking the opt-in action
 * @param {Object} [options.trackProperties] - set of properties to be tracked along with the opt-in action
 * @param {string} [options.persistenceType] Persistence mechanism used - cookie or localStorage
 * @param {string} [options.persistencePrefix=__mp_opt_in_out] - custom prefix to be used in the cookie/localstorage name
 * @param {Number} [options.cookieExpiration] - number of days until the opt-in cookie expires
 * @param {boolean} [options.crossSubdomainCookie] - whether the opt-in cookie is set as cross-subdomain or not
 * @param {boolean} [options.secureCookie] - whether the opt-in cookie is set as secure or not
 */
function optIn(token, options) {
    _optInOut(true, token, options);
}

/**
 * Opt the user out of data tracking and cookies/localstorage for the given token
 * @param {string} token - Mixpanel project tracking token
 * @param {Object} [options]
 * @param {string} [options.persistenceType] Persistence mechanism used - cookie or localStorage
 * @param {string} [options.persistencePrefix=__mp_opt_in_out] - custom prefix to be used in the cookie/localstorage name
 * @param {Number} [options.cookieExpiration] - number of days until the opt-out cookie expires
 * @param {boolean} [options.crossSubdomainCookie] - whether the opt-out cookie is set as cross-subdomain or not
 * @param {boolean} [options.secureCookie] - whether the opt-out cookie is set as secure or not
 */
function optOut(token, options) {
    _optInOut(false, token, options);
}

/**
 * Check whether the user has opted in to data tracking and cookies/localstorage for the given token
 * @param {string} token - Mixpanel project tracking token
 * @param {Object} [options]
 * @param {string} [options.persistenceType] Persistence mechanism used - cookie or localStorage
 * @param {string} [options.persistencePrefix=__mp_opt_in_out] - custom prefix to be used in the cookie/localstorage name
 * @returns {boolean} whether the user has opted in to the given opt type
 */
function hasOptedIn(token, options) {
    return _getStorageValue(token, options) === '1';
}

/**
 * Check whether the user has opted out of data tracking and cookies/localstorage for the given token
 * @param {string} token - Mixpanel project tracking token
 * @param {Object} [options]
 * @param {string} [options.persistenceType] Persistence mechanism used - cookie or localStorage
 * @param {string} [options.persistencePrefix=__mp_opt_in_out] - custom prefix to be used in the cookie/localstorage name
 * @returns {boolean} whether the user has opted out of the given opt type
 */
function hasOptedOut(token, options) {
    if (_hasDoNotTrackFlagOn()) {
        return true;
    }
    return _getStorageValue(token, options) === '0';
}

/**
 * Wrap a MixpanelLib method with a check for whether the user is opted out of data tracking and cookies/localstorage for the given token
 * If the user has opted out, return early instead of executing the method.
 * If a callback argument was provided, execute it passing the 0 error code.
 * @param {function} method - wrapped method to be executed if the user has not opted out
 * @returns {*} the result of executing method OR undefined if the user has opted out
 */
function addOptOutCheckMixpanelLib(method) {
    return _addOptOutCheck(method, function(name) {
        return this.get_config(name);
    });
}

/**
 * Wrap a MixpanelPeople method with a check for whether the user is opted out of data tracking and cookies/localstorage for the given token
 * If the user has opted out, return early instead of executing the method.
 * If a callback argument was provided, execute it passing the 0 error code.
 * @param {function} method - wrapped method to be executed if the user has not opted out
 * @returns {*} the result of executing method OR undefined if the user has opted out
 */
function addOptOutCheckMixpanelPeople(method) {
    return _addOptOutCheck(method, function(name) {
        return this._get_config(name);
    });
}

/**
 * Clear the user's opt in/out status of data tracking and cookies/localstorage for the given token
 * @param {string} token - Mixpanel project tracking token
 * @param {Object} [options]
 * @param {string} [options.persistenceType] Persistence mechanism used - cookie or localStorage
 * @param {string} [options.persistencePrefix=__mp_opt_in_out] - custom prefix to be used in the cookie/localstorage name
 * @param {Number} [options.cookieExpiration] - number of days until the opt-in cookie expires
 * @param {boolean} [options.crossSubdomainCookie] - whether the opt-in cookie is set as cross-subdomain or not
 * @param {boolean} [options.secureCookie] - whether the opt-in cookie is set as secure or not
 */
function clearOptInOut(token, options) {
    options = options || {};
    _getStorage(options).remove(_getStorageKey(token, options), !!options.crossSubdomainCookie);
}

/** Private **/

/**
 * Get storage util
 * @param {Object} [options]
 * @param {string} [options.persistenceType]
 * @returns {object} either _.cookie or _.localstorage
 */
function _getStorage(options) {
    options = options || {};
    return options.persistenceType === 'localStorage' ? _.localStorage : _.cookie;
}

/**
 * Get the name of the cookie that is used for the given opt type (tracking, cookie, etc.)
 * @param {string} token - Mixpanel project tracking token
 * @param {Object} [options]
 * @param {string} [options.persistencePrefix=__mp_opt_in_out] - custom prefix to be used in the cookie/localstorage name
 * @returns {string} the name of the cookie for the given opt type
 */
function _getStorageKey(token, options) {
    options = options || {};
    return (options.persistencePrefix || GDPR_DEFAULT_PERSISTENCE_PREFIX) + token;
}

/**
 * Get the value of the cookie that is used for the given opt type (tracking, cookie, etc.)
 * @param {string} token - Mixpanel project tracking token
 * @param {Object} [options]
 * @param {string} [options.persistencePrefix=__mp_opt_in_out] - custom prefix to be used in the cookie/localstorage name
 * @returns {string} the value of the cookie for the given opt type
 */
function _getStorageValue(token, options) {
    return _getStorage(options).get(_getStorageKey(token, options));
}

/**
 * Check whether the user has set the DNT/doNotTrack setting to true in their browser
 * @returns {boolean} whether the DNT setting is true
 */
function _hasDoNotTrackFlagOn() {
    return !!(window$1.navigator && window$1.navigator.doNotTrack === '1');
}

/**
 * Set cookie/localstorage for the user indicating that they are opted in or out for the given opt type
 * @param {boolean} optValue - whether to opt the user in or out for the given opt type
 * @param {string} token - Mixpanel project tracking token
 * @param {Object} [options]
 * @param {trackFunction} [options.track] - function used for tracking a Mixpanel event to record the opt-in action
 * @param {string} [options.trackEventName] - event name to be used for tracking the opt-in action
 * @param {Object} [options.trackProperties] - set of properties to be tracked along with the opt-in action
 * @param {string} [options.persistencePrefix=__mp_opt_in_out] - custom prefix to be used in the cookie/localstorage name
 * @param {Number} [options.cookieExpiration] - number of days until the opt-in cookie expires
 * @param {boolean} [options.crossSubdomainCookie] - whether the opt-in cookie is set as cross-subdomain or not
 * @param {boolean} [options.secureCookie] - whether the opt-in cookie is set as secure or not
 */
function _optInOut(optValue, token, options) {
    if (!_.isString(token) || !token.length) {
        console.error('gdpr.' + (optValue ? 'optIn' : 'optOut') + ' called with an invalid token');
        return;
    }

    options = options || {};

    _getStorage(options).set(
        _getStorageKey(token, options),
        optValue ? 1 : 0,
        _.isNumber(options.cookieExpiration) ? options.cookieExpiration : null,
        !!options.crossSubdomainCookie,
        !!options.secureCookie
    );

    if (options.track && optValue) { // only track event if opting in (optValue=true)
        options.track(options.trackEventName || '$opt_in', options.trackProperties);
    }
}

/**
 * Wrap a method with a check for whether the user is opted out of data tracking and cookies/localstorage for the given token
 * If the user has opted out, return early instead of executing the method.
 * If a callback argument was provided, execute it passing the 0 error code.
 * @param {function} method - wrapped method to be executed if the user has not opted out
 * @param {function} getConfigValue - getter function for the Mixpanel API token and other options to be used with opt-out check
 * @returns {*} the result of executing method OR undefined if the user has opted out
 */
function _addOptOutCheck(method, getConfigValue) {
    return function() {
        var optedOut = false;

        try {
            var token = getConfigValue.call(this, 'token');
            var persistenceType = getConfigValue.call(this, 'opt_out_tracking_persistence_type');
            var persistencePrefix = getConfigValue.call(this, 'opt_out_tracking_cookie_prefix');

            if (token) { // if there was an issue getting the token, continue method execution as normal
                optedOut = hasOptedOut(token, {
                    persistenceType: persistenceType,
                    persistencePrefix: persistencePrefix
                });
            }
        } catch(err) {
            console.error('Unexpected error when checking tracking opt-out status: ' + err);
        }

        if (!optedOut) {
            return method.apply(this, arguments);
        }

        var callback = arguments[arguments.length - 1];
        if (typeof(callback) === 'function') {
            callback(0);
        }

        return;
    };
}

/*
 * Mixpanel JS Library
 *
 * Copyright 2012, Mixpanel, Inc. All Rights Reserved
 * http://mixpanel.com/
 *
 * Includes portions of Underscore.js
 * http://documentcloud.github.com/underscore/
 * (c) 2011 Jeremy Ashkenas, DocumentCloud Inc.
 * Released under the MIT License.
 */

// ==ClosureCompiler==
// @compilation_level ADVANCED_OPTIMIZATIONS
// @output_file_name mixpanel-2.8.min.js
// ==/ClosureCompiler==

/*
SIMPLE STYLE GUIDE:

this.x === public function
this._x === internal - only use within this file
this.__x === private - only use within the class

Globals should be all caps
*/

var init_type;       // MODULE or SNIPPET loader
var mixpanel_master; // main mixpanel instance / object
var INIT_MODULE  = 0;
var INIT_SNIPPET = 1;

/*
 * Constants
 */
/** @const */   var PRIMARY_INSTANCE_NAME     = 'mixpanel';
/** @const */   var SET_QUEUE_KEY             = '__mps';
/** @const */   var SET_ONCE_QUEUE_KEY        = '__mpso';
/** @const */   var UNSET_QUEUE_KEY           = '__mpus';
/** @const */   var ADD_QUEUE_KEY             = '__mpa';
/** @const */   var APPEND_QUEUE_KEY          = '__mpap';
/** @const */   var UNION_QUEUE_KEY           = '__mpu';
/** @const */   var SET_ACTION                = '$set';
/** @const */   var SET_ONCE_ACTION           = '$set_once';
/** @const */   var UNSET_ACTION              = '$unset';
/** @const */   var ADD_ACTION                = '$add';
/** @const */   var APPEND_ACTION             = '$append';
/** @const */   var UNION_ACTION              = '$union';
// This key is deprecated, but we want to check for it to see whether aliasing is allowed.
/** @const */   var PEOPLE_DISTINCT_ID_KEY    = '$people_distinct_id';
/** @const */   var ALIAS_ID_KEY              = '__alias';
/** @const */   var CAMPAIGN_IDS_KEY          = '__cmpns';
/** @const */   var EVENT_TIMERS_KEY          = '__timers';
/** @const */   var RESERVED_PROPERTIES       = [
    SET_QUEUE_KEY,
    SET_ONCE_QUEUE_KEY,
    UNSET_QUEUE_KEY,
    ADD_QUEUE_KEY,
    APPEND_QUEUE_KEY,
    UNION_QUEUE_KEY,
    PEOPLE_DISTINCT_ID_KEY,
    ALIAS_ID_KEY,
    CAMPAIGN_IDS_KEY,
    EVENT_TIMERS_KEY
];

/*
 * Dynamic... constants? Is that an oxymoron?
 */
    // http://hacks.mozilla.org/2009/07/cross-site-xmlhttprequest-with-cors/
    // https://developer.mozilla.org/en-US/docs/DOM/XMLHttpRequest#withCredentials
var USE_XHR = (window$1.XMLHttpRequest && 'withCredentials' in new XMLHttpRequest());

    // IE<10 does not support cross-origin XHR's but script tags
    // with defer won't block window.onload; ENQUEUE_REQUESTS
    // should only be true for Opera<12
var ENQUEUE_REQUESTS = !USE_XHR && (userAgent.indexOf('MSIE') === -1) && (userAgent.indexOf('Mozilla') === -1);

/*
 * Module-level globals
 */
var DEFAULT_CONFIG = {
    'api_host':                          'https://api.mixpanel.com',
    'app_host':                          'https://mixpanel.com',
    'autotrack':                         true,
    'cdn':                               'https://cdn.mxpnl.com',
    'cross_subdomain_cookie':            true,
    'persistence':                       'cookie',
    'persistence_name':                  '',
    'cookie_name':                       '',
    'loaded':                            function() {},
    'store_google':                      true,
    'save_referrer':                     true,
    'test':                              false,
    'verbose':                           false,
    'img':                               false,
    'track_pageview':                    true,
    'debug':                             false,
    'track_links_timeout':               300,
    'cookie_expiration':                 365,
    'upgrade':                           false,
    'disable_persistence':               false,
    'disable_cookie':                    false,
    'secure_cookie':                     false,
    'ip':                                true,
    'opt_out_tracking_by_default':       false,
    'opt_out_tracking_persistence_type': 'localStorage',
    'opt_out_tracking_cookie_prefix':    null,
    'property_blacklist':                [],
    'xhr_headers':                       {} // { header: value, header2: value }
};

var DOM_LOADED = false;

/**
 * DomTracker Object
 * @constructor
 */
var DomTracker = function() {};

// interface
DomTracker.prototype.create_properties = function() {};
DomTracker.prototype.event_handler = function() {};
DomTracker.prototype.after_track_handler = function() {};

DomTracker.prototype.init = function(mixpanel_instance) {
    this.mp = mixpanel_instance;
    return this;
};

/**
 * @param {Object|string} query
 * @param {string} event_name
 * @param {Object=} properties
 * @param {function(...[*])=} user_callback
 */
DomTracker.prototype.track = function(query, event_name, properties, user_callback) {
    var that = this;
    var elements = _.dom_query(query);

    if (elements.length === 0) {
        console$1.error('The DOM query (' + query + ') returned 0 elements');
        return;
    }

    _.each(elements, function(element) {
        _.register_event(element, this.override_event, function(e) {
            var options = {};
            var props = that.create_properties(properties, this);
            var timeout = that.mp.get_config('track_links_timeout');

            that.event_handler(e, this, options);

            // in case the mixpanel servers don't get back to us in time
            window$1.setTimeout(that.track_callback(user_callback, props, options, true), timeout);

            // fire the tracking event
            that.mp.track(event_name, props, that.track_callback(user_callback, props, options));
        });
    }, this);

    return true;
};

/**
 * @param {function(...[*])} user_callback
 * @param {Object} props
 * @param {boolean=} timeout_occured
 */
DomTracker.prototype.track_callback = function(user_callback, props, options, timeout_occured) {
    timeout_occured = timeout_occured || false;
    var that = this;

    return function() {
        // options is referenced from both callbacks, so we can have
        // a 'lock' of sorts to ensure only one fires
        if (options.callback_fired) { return; }
        options.callback_fired = true;

        if (user_callback && user_callback(timeout_occured, props) === false) {
            // user can prevent the default functionality by
            // returning false from their callback
            return;
        }

        that.after_track_handler(props, options, timeout_occured);
    };
};

DomTracker.prototype.create_properties = function(properties, element) {
    var props;

    if (typeof(properties) === 'function') {
        props = properties(element);
    } else {
        props = _.extend({}, properties);
    }

    return props;
};

/**
 * LinkTracker Object
 * @constructor
 * @extends DomTracker
 */
var LinkTracker = function() {
    this.override_event = 'click';
};
_.inherit(LinkTracker, DomTracker);

LinkTracker.prototype.create_properties = function(properties, element) {
    var props = LinkTracker.superclass.create_properties.apply(this, arguments);

    if (element.href) { props['url'] = element.href; }

    return props;
};

LinkTracker.prototype.event_handler = function(evt, element, options) {
    options.new_tab = (
        evt.which === 2 ||
        evt.metaKey ||
        evt.ctrlKey ||
        element.target === '_blank'
    );
    options.href = element.href;

    if (!options.new_tab) {
        evt.preventDefault();
    }
};

LinkTracker.prototype.after_track_handler = function(props, options) {
    if (options.new_tab) { return; }

    setTimeout(function() {
        window$1.location = options.href;
    }, 0);
};

/**
 * FormTracker Object
 * @constructor
 * @extends DomTracker
 */
var FormTracker = function() {
    this.override_event = 'submit';
};
_.inherit(FormTracker, DomTracker);

FormTracker.prototype.event_handler = function(evt, element, options) {
    options.element = element;
    evt.preventDefault();
};

FormTracker.prototype.after_track_handler = function(props, options) {
    setTimeout(function() {
        options.element.submit();
    }, 0);
};

/**
 * Mixpanel Persistence Object
 * @constructor
 */
var MixpanelPersistence = function(config) {
    this['props'] = {};
    this.campaign_params_saved = false;

    if (config['persistence_name']) {
        this.name = 'mp_' + config['persistence_name'];
    } else {
        this.name = 'mp_' + config['token'] + '_mixpanel';
    }

    var storage_type = config['persistence'];
    if (storage_type !== 'cookie' && storage_type !== 'localStorage') {
        console$1.critical('Unknown persistence type ' + storage_type + '; falling back to cookie');
        storage_type = config['persistence'] = 'cookie';
    }

    if (storage_type === 'localStorage' && _.localStorage.is_supported()) {
        this.storage = _.localStorage;
    } else {
        this.storage = _.cookie;
    }

    this.load();
    this.update_config(config);
    this.upgrade(config);
    this.save();
};

MixpanelPersistence.prototype.properties = function() {
    var p = {};
    // Filter out reserved properties
    _.each(this['props'], function(v, k) {
        if (!_.include(RESERVED_PROPERTIES, k)) {
            p[k] = v;
        }
    });
    return p;
};

MixpanelPersistence.prototype.load = function() {
    if (this.disabled) { return; }

    var entry = this.storage.parse(this.name);

    if (entry) {
        this['props'] = _.extend({}, entry);
    }
};

MixpanelPersistence.prototype.upgrade = function(config) {
    var upgrade_from_old_lib = config['upgrade'],
        old_cookie_name,
        old_cookie;

    if (upgrade_from_old_lib) {
        old_cookie_name = 'mp_super_properties';
        // Case where they had a custom cookie name before.
        if (typeof(upgrade_from_old_lib) === 'string') {
            old_cookie_name = upgrade_from_old_lib;
        }

        old_cookie = this.storage.parse(old_cookie_name);

        // remove the cookie
        this.storage.remove(old_cookie_name);
        this.storage.remove(old_cookie_name, true);

        if (old_cookie) {
            this['props'] = _.extend(
                this['props'],
                old_cookie['all'],
                old_cookie['events']
            );
        }
    }

    if (!config['cookie_name'] && config['name'] !== 'mixpanel') {
        // special case to handle people with cookies of the form
        // mp_TOKEN_INSTANCENAME from the first release of this library
        old_cookie_name = 'mp_' + config['token'] + '_' + config['name'];
        old_cookie = this.storage.parse(old_cookie_name);

        if (old_cookie) {
            this.storage.remove(old_cookie_name);
            this.storage.remove(old_cookie_name, true);

            // Save the prop values that were in the cookie from before -
            // this should only happen once as we delete the old one.
            this.register_once(old_cookie);
        }
    }

    if (this.storage === _.localStorage) {
        old_cookie = _.cookie.parse(this.name);

        _.cookie.remove(this.name);
        _.cookie.remove(this.name, true);

        if (old_cookie) {
            this.register_once(old_cookie);
        }
    }
};

MixpanelPersistence.prototype.save = function() {
    if (this.disabled) { return; }
    this._expire_notification_campaigns();
    this.storage.set(
        this.name,
        _.JSONEncode(this['props']),
        this.expire_days,
        this.cross_subdomain,
        this.secure
    );
};

MixpanelPersistence.prototype.remove = function() {
    // remove both domain and subdomain cookies
    this.storage.remove(this.name, false);
    this.storage.remove(this.name, true);
};

// removes the storage entry and deletes all loaded data
// forced name for tests
MixpanelPersistence.prototype.clear = function() {
    this.remove();
    this['props'] = {};
};

/**
 * @param {Object} props
 * @param {*=} default_value
 * @param {number=} days
 */
MixpanelPersistence.prototype.register_once = function(props, default_value, days) {
    if (_.isObject(props)) {
        if (typeof(default_value) === 'undefined') { default_value = 'None'; }
        this.expire_days = (typeof(days) === 'undefined') ? this.default_expiry : days;

        _.each(props, function(val, prop) {
            if (!this['props'].hasOwnProperty(prop) || this['props'][prop] === default_value) {
                this['props'][prop] = val;
            }
        }, this);

        this.save();

        return true;
    }
    return false;
};

/**
 * @param {Object} props
 * @param {number=} days
 */
MixpanelPersistence.prototype.register = function(props, days) {
    if (_.isObject(props)) {
        this.expire_days = (typeof(days) === 'undefined') ? this.default_expiry : days;

        _.extend(this['props'], props);

        this.save();

        return true;
    }
    return false;
};

MixpanelPersistence.prototype.unregister = function(prop) {
    if (prop in this['props']) {
        delete this['props'][prop];
        this.save();
    }
};

MixpanelPersistence.prototype._expire_notification_campaigns = _.safewrap(function() {
    var campaigns_shown = this['props'][CAMPAIGN_IDS_KEY],
        EXPIRY_TIME = Config.DEBUG ? 60 * 1000 : 60 * 60 * 1000; // 1 minute (Config.DEBUG) / 1 hour (PDXN)
    if (!campaigns_shown) {
        return;
    }
    for (var campaign_id in campaigns_shown) {
        if (1 * new Date() - campaigns_shown[campaign_id] > EXPIRY_TIME) {
            delete campaigns_shown[campaign_id];
        }
    }
    if (_.isEmptyObject(campaigns_shown)) {
        delete this['props'][CAMPAIGN_IDS_KEY];
    }
});

MixpanelPersistence.prototype.update_campaign_params = function() {
    if (!this.campaign_params_saved) {
        this.register_once(_.info.campaignParams());
        this.campaign_params_saved = true;
    }
};

MixpanelPersistence.prototype.update_search_keyword = function(referrer) {
    this.register(_.info.searchInfo(referrer));
};

// EXPORTED METHOD, we test this directly.
MixpanelPersistence.prototype.update_referrer_info = function(referrer) {
    // If referrer doesn't exist, we want to note the fact that it was type-in traffic.
    this.register_once({
        '$initial_referrer': referrer || '$direct',
        '$initial_referring_domain': _.info.referringDomain(referrer) || '$direct'
    }, '');
};

MixpanelPersistence.prototype.get_referrer_info = function() {
    return _.strip_empty_properties({
        '$initial_referrer': this['props']['$initial_referrer'],
        '$initial_referring_domain': this['props']['$initial_referring_domain']
    });
};

// safely fills the passed in object with stored properties,
// does not override any properties defined in both
// returns the passed in object
MixpanelPersistence.prototype.safe_merge = function(props) {
    _.each(this['props'], function(val, prop) {
        if (!(prop in props)) {
            props[prop] = val;
        }
    });

    return props;
};

MixpanelPersistence.prototype.update_config = function(config) {
    this.default_expiry = this.expire_days = config['cookie_expiration'];
    this.set_disabled(config['disable_persistence']);
    this.set_cross_subdomain(config['cross_subdomain_cookie']);
    this.set_secure(config['secure_cookie']);
};

MixpanelPersistence.prototype.set_disabled = function(disabled) {
    this.disabled = disabled;
    if (this.disabled) {
        this.remove();
    } else {
        this.save();
    }
};

MixpanelPersistence.prototype.set_cross_subdomain = function(cross_subdomain) {
    if (cross_subdomain !== this.cross_subdomain) {
        this.cross_subdomain = cross_subdomain;
        this.remove();
        this.save();
    }
};

MixpanelPersistence.prototype.get_cross_subdomain = function() {
    return this.cross_subdomain;
};

MixpanelPersistence.prototype.set_secure = function(secure) {
    if (secure !== this.secure) {
        this.secure = secure ? true : false;
        this.remove();
        this.save();
    }
};

MixpanelPersistence.prototype._add_to_people_queue = function(queue, data) {
    var q_key = this._get_queue_key(queue),
        q_data = data[queue],
        set_q = this._get_or_create_queue(SET_ACTION),
        set_once_q = this._get_or_create_queue(SET_ONCE_ACTION),
        unset_q = this._get_or_create_queue(UNSET_ACTION),
        add_q = this._get_or_create_queue(ADD_ACTION),
        union_q = this._get_or_create_queue(UNION_ACTION),
        append_q = this._get_or_create_queue(APPEND_ACTION, []);

    if (q_key === SET_QUEUE_KEY) {
        // Update the set queue - we can override any existing values
        _.extend(set_q, q_data);
        // if there was a pending increment, override it
        // with the set.
        this._pop_from_people_queue(ADD_ACTION, q_data);
        // if there was a pending union, override it
        // with the set.
        this._pop_from_people_queue(UNION_ACTION, q_data);
        this._pop_from_people_queue(UNSET_ACTION, q_data);
    } else if (q_key === SET_ONCE_QUEUE_KEY) {
        // only queue the data if there is not already a set_once call for it.
        _.each(q_data, function(v, k) {
            if (!(k in set_once_q)) {
                set_once_q[k] = v;
            }
        });
        this._pop_from_people_queue(UNSET_ACTION, q_data);
    } else if (q_key === UNSET_QUEUE_KEY) {
        _.each(q_data, function(prop) {

            // undo previously-queued actions on this key
            _.each([set_q, set_once_q, add_q, union_q], function(enqueued_obj) {
                if (prop in enqueued_obj) {
                    delete enqueued_obj[prop];
                }
            });
            _.each(append_q, function(append_obj) {
                if (prop in append_obj) {
                    delete append_obj[prop];
                }
            });

            unset_q[prop] = true;

        });
    } else if (q_key === ADD_QUEUE_KEY) {
        _.each(q_data, function(v, k) {
            // If it exists in the set queue, increment
            // the value
            if (k in set_q) {
                set_q[k] += v;
            } else {
                // If it doesn't exist, update the add
                // queue
                if (!(k in add_q)) {
                    add_q[k] = 0;
                }
                add_q[k] += v;
            }
        }, this);
        this._pop_from_people_queue(UNSET_ACTION, q_data);
    } else if (q_key === UNION_QUEUE_KEY) {
        _.each(q_data, function(v, k) {
            if (_.isArray(v)) {
                if (!(k in union_q)) {
                    union_q[k] = [];
                }
                // We may send duplicates, the server will dedup them.
                union_q[k] = union_q[k].concat(v);
            }
        });
        this._pop_from_people_queue(UNSET_ACTION, q_data);
    } else if (q_key === APPEND_QUEUE_KEY) {
        append_q.push(q_data);
        this._pop_from_people_queue(UNSET_ACTION, q_data);
    }

    console$1.log('MIXPANEL PEOPLE REQUEST (QUEUED, PENDING IDENTIFY):');
    console$1.log(data);

    this.save();
};

MixpanelPersistence.prototype._pop_from_people_queue = function(queue, data) {
    var q = this._get_queue(queue);
    if (!_.isUndefined(q)) {
        _.each(data, function(v, k) {
            delete q[k];
        }, this);

        this.save();
    }
};

MixpanelPersistence.prototype._get_queue_key = function(queue) {
    if (queue === SET_ACTION) {
        return SET_QUEUE_KEY;
    } else if (queue === SET_ONCE_ACTION) {
        return SET_ONCE_QUEUE_KEY;
    } else if (queue === UNSET_ACTION) {
        return UNSET_QUEUE_KEY;
    } else if (queue === ADD_ACTION) {
        return ADD_QUEUE_KEY;
    } else if (queue === APPEND_ACTION) {
        return APPEND_QUEUE_KEY;
    } else if (queue === UNION_ACTION) {
        return UNION_QUEUE_KEY;
    } else {
        console$1.error('Invalid queue:', queue);
    }
};

MixpanelPersistence.prototype._get_queue = function(queue) {
    return this['props'][this._get_queue_key(queue)];
};
MixpanelPersistence.prototype._get_or_create_queue = function(queue, default_val) {
    var key = this._get_queue_key(queue);
    default_val = _.isUndefined(default_val) ? {} : default_val;

    return this['props'][key] || (this['props'][key] = default_val);
};

MixpanelPersistence.prototype.set_event_timer = function(event_name, timestamp) {
    var timers = this['props'][EVENT_TIMERS_KEY] || {};
    timers[event_name] = timestamp;
    this['props'][EVENT_TIMERS_KEY] = timers;
    this.save();
};

MixpanelPersistence.prototype.remove_event_timer = function(event_name) {
    var timers = this['props'][EVENT_TIMERS_KEY] || {};
    var timestamp = timers[event_name];
    if (!_.isUndefined(timestamp)) {
        delete this['props'][EVENT_TIMERS_KEY][event_name];
        this.save();
    }
    return timestamp;
};

/**
 * Mixpanel Library Object
 * @constructor
 */
var MixpanelLib = function() {};

/**
 * Mixpanel People Object
 * @constructor
 */
var MixpanelPeople = function() {};

var MPNotif;

/**
 * create_mplib(token:string, config:object, name:string)
 *
 * This function is used by the init method of MixpanelLib objects
 * as well as the main initializer at the end of the JSLib (that
 * initializes document.mixpanel as well as any additional instances
 * declared before this file has loaded).
 */
var create_mplib = function(token, config, name) {
    var instance,
        target = (name === PRIMARY_INSTANCE_NAME) ? mixpanel_master : mixpanel_master[name];

    if (target && init_type === INIT_MODULE) {
        instance = target;
    } else {
        if (target && !_.isArray(target)) {
            console$1.error('You have already initialized ' + name);
            return;
        }
        instance = new MixpanelLib();
    }

    instance._init(token, config, name);

    instance['people'] = new MixpanelPeople();
    instance['people']._init(instance);

    // if any instance on the page has debug = true, we set the
    // global debug to be true
    Config.DEBUG = Config.DEBUG || instance.get_config('debug');

    instance['__autotrack_enabled'] = instance.get_config('autotrack');
    if (instance.get_config('autotrack')) {
        var num_buckets = 100;
        var num_enabled_buckets = 100;
        if (!autotrack.enabledForProject(instance.get_config('token'), num_buckets, num_enabled_buckets)) {
            instance['__autotrack_enabled'] = false;
            console$1.log('Not in active bucket: disabling Automatic Event Collection.');
        } else if (!autotrack.isBrowserSupported()) {
            instance['__autotrack_enabled'] = false;
            console$1.log('Disabling Automatic Event Collection because this browser is not supported');
        } else {
            autotrack.init(instance);
        }
    }

    // if target is not defined, we called init after the lib already
    // loaded, so there won't be an array of things to execute
    if (!_.isUndefined(target) && _.isArray(target)) {
        // Crunch through the people queue first - we queue this data up &
        // flush on identify, so it's better to do all these operations first
        instance._execute_array.call(instance['people'], target['people']);
        instance._execute_array(target);
    }

    return instance;
};

// Initialization methods

/**
 * This function initializes a new instance of the Mixpanel tracking object.
 * All new instances are added to the main mixpanel object as sub properties (such as
 * mixpanel.library_name) and also returned by this function. To define a
 * second instance on the page, you would call:
 *
 *     mixpanel.init('new token', { your: 'config' }, 'library_name');
 *
 * and use it like so:
 *
 *     mixpanel.library_name.track(...);
 *
 * @param {String} token   Your Mixpanel API token
 * @param {Object} [config]  A dictionary of config options to override. <a href="https://github.com/mixpanel/mixpanel-js/blob/8b2e1f7b/src/mixpanel-core.js#L87-L110">See a list of default config options</a>.
 * @param {String} [name]    The name for the new mixpanel instance that you want created
 */
MixpanelLib.prototype.init = function (token, config, name) {
    if (_.isUndefined(name)) {
        console$1.error('You must name your new library: init(token, config, name)');
        return;
    }
    if (name === PRIMARY_INSTANCE_NAME) {
        console$1.error('You must initialize the main mixpanel object right after you include the Mixpanel js snippet');
        return;
    }

    var instance = create_mplib(token, config, name);
    mixpanel_master[name] = instance;
    instance._loaded();

    return instance;
};

// mixpanel._init(token:string, config:object, name:string)
//
// This function sets up the current instance of the mixpanel
// library.  The difference between this method and the init(...)
// method is this one initializes the actual instance, whereas the
// init(...) method sets up a new library and calls _init on it.
//
MixpanelLib.prototype._init = function(token, config, name) {
    this['__loaded'] = true;
    this['config'] = {};

    this.set_config(_.extend({}, DEFAULT_CONFIG, config, {
        'name': name,
        'token': token,
        'callback_fn': ((name === PRIMARY_INSTANCE_NAME) ? name : PRIMARY_INSTANCE_NAME + '.' + name) + '._jsc'
    }));

    this['_jsc'] = function() {};

    this.__dom_loaded_queue = [];
    this.__request_queue = [];
    this.__disabled_events = [];
    this._flags = {
        'disable_all_events': false,
        'identify_called': false
    };

    this['persistence'] = this['cookie'] = new MixpanelPersistence(this['config']);
    this._init_gdpr_persistence();

    this.register_once({'distinct_id': _.UUID()}, '');
};

// Private methods

MixpanelLib.prototype._update_persistence = function() {
    var disablePersistence = this.get_config('disable_persistence') || this.has_opted_out_tracking();
    if (this['persistence'].disabled !== disablePersistence) {
        this['persistence'].set_disabled(disablePersistence);
    }
};

MixpanelLib.prototype._loaded = function() {
    this.get_config('loaded')(this);

    // this happens after so a user can call identify/name_tag in
    // the loaded callback
    if (this.get_config('track_pageview')) {
        this.track_pageview();
    }
};

MixpanelLib.prototype._dom_loaded = function() {
    _.each(this.__dom_loaded_queue, function(item) {
        this._track_dom.apply(this, item);
    }, this);

    if (!this.has_opted_out_tracking()) {
        _.each(this.__request_queue, function(item) {
            this._send_request.apply(this, item);
        }, this);
    }

    delete this.__dom_loaded_queue;
    delete this.__request_queue;
};

MixpanelLib.prototype._track_dom = function(DomClass, args) {
    if (this.get_config('img')) {
        console$1.error('You can\'t use DOM tracking functions with img = true.');
        return false;
    }

    if (!DOM_LOADED) {
        this.__dom_loaded_queue.push([DomClass, args]);
        return false;
    }

    var dt = new DomClass().init(this);
    return dt.track.apply(dt, args);
};

/**
 * _prepare_callback() should be called by callers of _send_request for use
 * as the callback argument.
 *
 * If there is no callback, this returns null.
 * If we are going to make XHR/XDR requests, this returns a function.
 * If we are going to use script tags, this returns a string to use as the
 * callback GET param.
 */
MixpanelLib.prototype._prepare_callback = function(callback, data) {
    if (_.isUndefined(callback)) {
        return null;
    }

    if (USE_XHR) {
        var callback_function = function(response) {
            callback(response, data);
        };
        return callback_function;
    } else {
        // if the user gives us a callback, we store as a random
        // property on this instances jsc function and update our
        // callback string to reflect that.
        var jsc = this['_jsc'];
        var randomized_cb = '' + Math.floor(Math.random() * 100000000);
        var callback_string = this.get_config('callback_fn') + '[' + randomized_cb + ']';
        jsc[randomized_cb] = function(response) {
            delete jsc[randomized_cb];
            callback(response, data);
        };
        return callback_string;
    }
};

MixpanelLib.prototype._send_request = function(url, data, callback) {
    if (ENQUEUE_REQUESTS) {
        this.__request_queue.push(arguments);
        return;
    }

    // needed to correctly format responses
    var verbose_mode = this.get_config('verbose');
    if (data['verbose']) { verbose_mode = true; }

    if (this.get_config('test')) { data['test'] = 1; }
    if (verbose_mode) { data['verbose'] = 1; }
    if (this.get_config('img')) { data['img'] = 1; }
    if (!USE_XHR) {
        if (callback) {
            data['callback'] = callback;
        } else if (verbose_mode || this.get_config('test')) {
            // Verbose output (from verbose mode, or an error in test mode) is a json blob,
            // which by itself is not valid javascript. Without a callback, this verbose output will
            // cause an error when returned via jsonp, so we force a no-op callback param.
            // See the ECMA script spec: http://www.ecma-international.org/ecma-262/5.1/#sec-12.4
            data['callback'] = '(function(){})';
        }
    }

    data['ip'] = this.get_config('ip')?1:0;
    data['_'] = new Date().getTime().toString();
    url += '?' + _.HTTPBuildQuery(data);

    if ('img' in data) {
        var img = document$1.createElement('img');
        img.src = url;
        document$1.body.appendChild(img);
    } else if (USE_XHR) {
        try {
            var req = new XMLHttpRequest();
            req.open('GET', url, true);

            var headers = this.get_config('xhr_headers');
            _.each(headers, function(headerValue, headerName) {
                req.setRequestHeader(headerName, headerValue);
            });

            // send the mp_optout cookie
            // withCredentials cannot be modified until after calling .open on Android and Mobile Safari
            req.withCredentials = true;
            req.onreadystatechange = function () {
                if (req.readyState === 4) { // XMLHttpRequest.DONE == 4, except in safari 4
                    if (req.status === 200) {
                        if (callback) {
                            if (verbose_mode) {
                                var response;
                                try {
                                    response = _.JSONDecode(req.responseText);
                                } catch (e) {
                                    console$1.error(e);
                                    return;
                                }
                                callback(response);
                            } else {
                                callback(Number(req.responseText));
                            }
                        }
                    } else {
                        var error = 'Bad HTTP status: ' + req.status + ' ' + req.statusText;
                        console$1.error(error);
                        if (callback) {
                            if (verbose_mode) {
                                callback({status: 0, error: error});
                            } else {
                                callback(0);
                            }
                        }
                    }
                }
            };
            req.send(null);
        } catch (e) {
            console$1.error(e);
        }
    } else {
        var script = document$1.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.defer = true;
        script.src = url;
        var s = document$1.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(script, s);
    }
};

/**
 * _execute_array() deals with processing any mixpanel function
 * calls that were called before the Mixpanel library were loaded
 * (and are thus stored in an array so they can be called later)
 *
 * Note: we fire off all the mixpanel function calls && user defined
 * functions BEFORE we fire off mixpanel tracking calls. This is so
 * identify/register/set_config calls can properly modify early
 * tracking calls.
 *
 * @param {Array} array
 */
MixpanelLib.prototype._execute_array = function(array) {
    var fn_name, alias_calls = [], other_calls = [], tracking_calls = [];
    _.each(array, function(item) {
        if (item) {
            fn_name = item[0];
            if (typeof(item) === 'function') {
                item.call(this);
            } else if (_.isArray(item) && fn_name === 'alias') {
                alias_calls.push(item);
            } else if (_.isArray(item) && fn_name.indexOf('track') !== -1 && typeof(this[fn_name]) === 'function') {
                tracking_calls.push(item);
            } else {
                other_calls.push(item);
            }
        }
    }, this);

    var execute = function(calls, context) {
        _.each(calls, function(item) {
            this[item[0]].apply(this, item.slice(1));
        }, context);
    };

    execute(alias_calls, this);
    execute(other_calls, this);
    execute(tracking_calls, this);
};

/**
 * push() keeps the standard async-array-push
 * behavior around after the lib is loaded.
 * This is only useful for external integrations that
 * do not wish to rely on our convenience methods
 * (created in the snippet).
 *
 * ### Usage:
 *     mixpanel.push(['register', { a: 'b' }]);
 *
 * @param {Array} item A [function_name, args...] array to be executed
 */
MixpanelLib.prototype.push = function(item) {
    this._execute_array([item]);
};

/**
 * Disable events on the Mixpanel object. If passed no arguments,
 * this function disables tracking of any event. If passed an
 * array of event names, those events will be disabled, but other
 * events will continue to be tracked.
 *
 * Note: this function does not stop other mixpanel functions from
 * firing, such as register() or people.set().
 *
 * @param {Array} [events] An array of event names to disable
 */
MixpanelLib.prototype.disable = function(events) {
    if (typeof(events) === 'undefined') {
        this._flags.disable_all_events = true;
    } else {
        this.__disabled_events = this.__disabled_events.concat(events);
    }
};

/**
 * Track an event. This is the most important and
 * frequently used Mixpanel function.
 *
 * ### Usage:
 *
 *     // track an event named 'Registered'
 *     mixpanel.track('Registered', {'Gender': 'Male', 'Age': 21});
 *
 * To track link clicks or form submissions, see track_links() or track_forms().
 *
 * @param {String} event_name The name of the event. This can be anything the user does - 'Button Click', 'Sign Up', 'Item Purchased', etc.
 * @param {Object} [properties] A set of properties to include with the event you're sending. These describe the user who did the event or details about the event itself.
 * @param {Function} [callback] If provided, the callback function will be called after tracking the event.
 */
MixpanelLib.prototype.track = addOptOutCheckMixpanelLib(function(event_name, properties, callback) {
    if (typeof(callback) !== 'function') {
        callback = function() {};
    }

    if (_.isUndefined(event_name)) {
        console$1.error('No event name provided to mixpanel.track');
        return;
    }

    if (this._event_is_disabled(event_name)) {
        callback(0);
        return;
    }

    // set defaults
    properties = properties || {};
    properties['token'] = this.get_config('token');

    // set $duration if time_event was previously called for this event
    var start_timestamp = this['persistence'].remove_event_timer(event_name);
    if (!_.isUndefined(start_timestamp)) {
        var duration_in_ms = new Date().getTime() - start_timestamp;
        properties['$duration'] = parseFloat((duration_in_ms / 1000).toFixed(3));
    }

    // update persistence
    this['persistence'].update_search_keyword(document$1.referrer);

    if (this.get_config('store_google')) { this['persistence'].update_campaign_params(); }
    if (this.get_config('save_referrer')) { this['persistence'].update_referrer_info(document$1.referrer); }

    // note: extend writes to the first object, so lets make sure we
    // don't write to the persistence properties object and info
    // properties object by passing in a new object

    // update properties with pageview info and super-properties
    properties = _.extend(
        {},
        _.info.properties(),
        this['persistence'].properties(),
        properties
    );

    var property_blacklist = this.get_config('property_blacklist');
    if (_.isArray(property_blacklist)) {
        _.each(property_blacklist, function(blacklisted_prop) {
            delete properties[blacklisted_prop];
        });
    } else {
        console$1.error('Invalid value for property_blacklist config: ' + property_blacklist);
    }

    var data = {
        'event': event_name,
        'properties': properties
    };

    var truncated_data = _.truncate(data, 255);
    var json_data      = _.JSONEncode(truncated_data);
    var encoded_data   = _.base64Encode(json_data);

    console$1.log('MIXPANEL REQUEST:');
    console$1.log(truncated_data);

    this._send_request(
        this.get_config('api_host') + '/track/',
        { 'data': encoded_data },
        this._prepare_callback(callback, truncated_data)
    );

    return truncated_data;
});

/**
 * Track a page view event, which is currently ignored by the server.
 * This function is called by default on page load unless the
 * track_pageview configuration variable is false.
 *
 * @param {String} [page] The url of the page to record. If you don't include this, it defaults to the current url.
 * @api private
 */
MixpanelLib.prototype.track_pageview = function(page) {
    if (_.isUndefined(page)) {
        page = document$1.location.href;
    }
    this.track('mp_page_view', _.info.pageviewInfo(page));
};

/**
 * Track clicks on a set of document elements. Selector must be a
 * valid query. Elements must exist on the page at the time track_links is called.
 *
 * ### Usage:
 *
 *     // track click for link id #nav
 *     mixpanel.track_links('#nav', 'Clicked Nav Link');
 *
 * ### Notes:
 *
 * This function will wait up to 300 ms for the Mixpanel
 * servers to respond. If they have not responded by that time
 * it will head to the link without ensuring that your event
 * has been tracked.  To configure this timeout please see the
 * set_config() documentation below.
 *
 * If you pass a function in as the properties argument, the
 * function will receive the DOMElement that triggered the
 * event as an argument.  You are expected to return an object
 * from the function; any properties defined on this object
 * will be sent to mixpanel as event properties.
 *
 * @type {Function}
 * @param {Object|String} query A valid DOM query, element or jQuery-esque list
 * @param {String} event_name The name of the event to track
 * @param {Object|Function} [properties] A properties object or function that returns a dictionary of properties when passed a DOMElement
 */
MixpanelLib.prototype.track_links = function() {
    return this._track_dom.call(this, LinkTracker, arguments);
};

/**
 * Track form submissions. Selector must be a valid query.
 *
 * ### Usage:
 *
 *     // track submission for form id 'register'
 *     mixpanel.track_forms('#register', 'Created Account');
 *
 * ### Notes:
 *
 * This function will wait up to 300 ms for the mixpanel
 * servers to respond, if they have not responded by that time
 * it will head to the link without ensuring that your event
 * has been tracked.  To configure this timeout please see the
 * set_config() documentation below.
 *
 * If you pass a function in as the properties argument, the
 * function will receive the DOMElement that triggered the
 * event as an argument.  You are expected to return an object
 * from the function; any properties defined on this object
 * will be sent to mixpanel as event properties.
 *
 * @type {Function}
 * @param {Object|String} query A valid DOM query, element or jQuery-esque list
 * @param {String} event_name The name of the event to track
 * @param {Object|Function} [properties] This can be a set of properties, or a function that returns a set of properties after being passed a DOMElement
 */
MixpanelLib.prototype.track_forms = function() {
    return this._track_dom.call(this, FormTracker, arguments);
};

/**
 * Time an event by including the time between this call and a
 * later 'track' call for the same event in the properties sent
 * with the event.
 *
 * ### Usage:
 *
 *     // time an event named 'Registered'
 *     mixpanel.time_event('Registered');
 *     mixpanel.track('Registered', {'Gender': 'Male', 'Age': 21});
 *
 * When called for a particular event name, the next track call for that event
 * name will include the elapsed time between the 'time_event' and 'track'
 * calls. This value is stored as seconds in the '$duration' property.
 *
 * @param {String} event_name The name of the event.
 */
MixpanelLib.prototype.time_event = function(event_name) {
    if (_.isUndefined(event_name)) {
        console$1.error('No event name provided to mixpanel.time_event');
        return;
    }

    if (this._event_is_disabled(event_name)) {
        return;
    }

    this['persistence'].set_event_timer(event_name,  new Date().getTime());
};

/**
 * Register a set of super properties, which are included with all
 * events. This will overwrite previous super property values.
 *
 * ### Usage:
 *
 *     // register 'Gender' as a super property
 *     mixpanel.register({'Gender': 'Female'});
 *
 *     // register several super properties when a user signs up
 *     mixpanel.register({
 *         'Email': 'jdoe@example.com',
 *         'Account Type': 'Free'
 *     });
 *
 * @param {Object} properties An associative array of properties to store about the user
 * @param {Number} [days] How many days since the user's last visit to store the super properties
 */
MixpanelLib.prototype.register = function(props, days) {
    this['persistence'].register(props, days);
};

/**
 * Register a set of super properties only once. This will not
 * overwrite previous super property values, unlike register().
 *
 * ### Usage:
 *
 *     // register a super property for the first time only
 *     mixpanel.register_once({
 *         'First Login Date': new Date().toISOString()
 *     });
 *
 * ### Notes:
 *
 * If default_value is specified, current super properties
 * with that value will be overwritten.
 *
 * @param {Object} properties An associative array of properties to store about the user
 * @param {*} [default_value] Value to override if already set in super properties (ex: 'False') Default: 'None'
 * @param {Number} [days] How many days since the users last visit to store the super properties
 */
MixpanelLib.prototype.register_once = function(props, default_value, days) {
    this['persistence'].register_once(props, default_value, days);
};

/**
 * Delete a super property stored with the current user.
 *
 * @param {String} property The name of the super property to remove
 */
MixpanelLib.prototype.unregister = function(property) {
    this['persistence'].unregister(property);
};

MixpanelLib.prototype._register_single = function(prop, value) {
    var props = {};
    props[prop] = value;
    this.register(props);
};

/**
 * Identify a user with a unique ID instead of a Mixpanel
 * randomly generated distinct_id. If the method is never called,
 * then unique visitors will be identified by a UUID generated
 * the first time they visit the site.
 *
 * ### Notes:
 *
 * You can call this function to overwrite a previously set
 * unique ID for the current user. Mixpanel cannot translate
 * between IDs at this time, so when you change a user's ID
 * they will appear to be a new user.
 *
 * When used alone, mixpanel.identify will change the user's
 * distinct_id to the unique ID provided. When used in tandem
 * with mixpanel.alias, it will allow you to identify based on
 * unique ID and map that back to the original, anonymous
 * distinct_id given to the user upon her first arrival to your
 * site (thus connecting anonymous pre-signup activity to
 * post-signup activity). Though the two work together, do not
 * call identify() at the same time as alias(). Calling the two
 * at the same time can cause a race condition, so it is best
 * practice to call identify on the original, anonymous ID
 * right after you've aliased it.
 * <a href="https://mixpanel.com/help/questions/articles/how-should-i-handle-my-user-identity-with-the-mixpanel-javascript-library">Learn more about how mixpanel.identify and mixpanel.alias can be used</a>.
 *
 * @param {String} [unique_id] A string that uniquely identifies a user. If not provided, the distinct_id currently in the persistent store (cookie or localStorage) will be used.
 */
MixpanelLib.prototype.identify = function(
    unique_id, _set_callback, _add_callback, _append_callback, _set_once_callback, _union_callback, _unset_callback
) {
    // Optional Parameters
    //  _set_callback:function  A callback to be run if and when the People set queue is flushed
    //  _add_callback:function  A callback to be run if and when the People add queue is flushed
    //  _append_callback:function  A callback to be run if and when the People append queue is flushed
    //  _set_once_callback:function  A callback to be run if and when the People set_once queue is flushed
    //  _union_callback:function  A callback to be run if and when the People union queue is flushed
    //  _unset_callback:function  A callback to be run if and when the People unset queue is flushed

    // identify only changes the distinct id if it doesn't match either the existing or the alias;
    // if it's new, blow away the alias as well.
    if (unique_id !== this.get_distinct_id() && unique_id !== this.get_property(ALIAS_ID_KEY)) {
        this.unregister(ALIAS_ID_KEY);
        this._register_single('distinct_id', unique_id);
    }
    this._check_and_handle_notifications(this.get_distinct_id());
    this._flags.identify_called = true;
    // Flush any queued up people requests
    this['people']._flush(_set_callback, _add_callback, _append_callback, _set_once_callback, _union_callback, _unset_callback);
};

/**
 * Clears super properties and generates a new random distinct_id for this instance.
 * Useful for clearing data when a user logs out.
 */
MixpanelLib.prototype.reset = function() {
    this['persistence'].clear();
    this._flags.identify_called = false;
    this.register_once({'distinct_id': _.UUID()}, '');
};

/**
 * Returns the current distinct id of the user. This is either the id automatically
 * generated by the library or the id that has been passed by a call to identify().
 *
 * ### Notes:
 *
 * get_distinct_id() can only be called after the Mixpanel library has finished loading.
 * init() has a loaded function available to handle this automatically. For example:
 *
 *     // set distinct_id after the mixpanel library has loaded
 *     mixpanel.init('YOUR PROJECT TOKEN', {
 *         loaded: function(mixpanel) {
 *             distinct_id = mixpanel.get_distinct_id();
 *         }
 *     });
 */
MixpanelLib.prototype.get_distinct_id = function() {
    return this.get_property('distinct_id');
};

/**
 * Create an alias, which Mixpanel will use to link two distinct_ids going forward (not retroactively).
 * Multiple aliases can map to the same original ID, but not vice-versa. Aliases can also be chained - the
 * following is a valid scenario:
 *
 *     mixpanel.alias('new_id', 'existing_id');
 *     ...
 *     mixpanel.alias('newer_id', 'new_id');
 *
 * If the original ID is not passed in, we will use the current distinct_id - probably the auto-generated GUID.
 *
 * ### Notes:
 *
 * The best practice is to call alias() when a unique ID is first created for a user
 * (e.g., when a user first registers for an account and provides an email address).
 * alias() should never be called more than once for a given user, except to
 * chain a newer ID to a previously new ID, as described above.
 *
 * @param {String} alias A unique identifier that you want to use for this user in the future.
 * @param {String} [original] The current identifier being used for this user.
 */
MixpanelLib.prototype.alias = function(alias, original) {
    // If the $people_distinct_id key exists in persistence, there has been a previous
    // mixpanel.people.identify() call made for this user. It is VERY BAD to make an alias with
    // this ID, as it will duplicate users.
    if (alias === this.get_property(PEOPLE_DISTINCT_ID_KEY)) {
        console$1.critical('Attempting to create alias for existing People user - aborting.');
        return -2;
    }

    var _this = this;
    if (_.isUndefined(original)) {
        original = this.get_distinct_id();
    }
    if (alias !== original) {
        this._register_single(ALIAS_ID_KEY, alias);
        return this.track('$create_alias', { 'alias': alias, 'distinct_id': original }, function() {
            // Flush the people queue
            _this.identify(alias);
        });
    } else {
        console$1.error('alias matches current distinct_id - skipping api call.');
        this.identify(alias);
        return -1;
    }
};

/**
 * Provide a string to recognize the user by. The string passed to
 * this method will appear in the Mixpanel Streams product rather
 * than an automatically generated name. Name tags do not have to
 * be unique.
 *
 * This value will only be included in Streams data.
 *
 * @param {String} name_tag A human readable name for the user
 * @api private
 */
MixpanelLib.prototype.name_tag = function(name_tag) {
    this._register_single('mp_name_tag', name_tag);
};

/**
 * Update the configuration of a mixpanel library instance.
 *
 * The default config is:
 *
 *     {
 *       // super properties cookie expiration (in days)
 *       cookie_expiration: 365
 *
 *       // super properties span subdomains
 *       cross_subdomain_cookie: true
 *
 *       // debug mode
 *       debug: false
 *
 *       // if this is true, the mixpanel cookie or localStorage entry
 *       // will be deleted, and no user persistence will take place
 *       disable_persistence: false
 *
 *       // if this is true, Mixpanel will automatically determine
 *       // City, Region and Country data using the IP address of
 *       //the client
 *       ip: true
 *
 *       // opt users out of tracking by this Mixpanel instance by default
 *       opt_out_tracking_by_default: false
 *
 *       // persistence mechanism used by opt-in/opt-out methods - cookie
 *       // or localStorage - falls back to cookie if localStorage is unavailable
 *       opt_out_tracking_persistence_type: 'localStorage'
 *
 *       // customize the name of cookie/localStorage set by opt-in/opt-out methods
 *       opt_out_tracking_cookie_prefix: null
 *
 *       // type of persistent store for super properties (cookie/
 *       // localStorage) if set to 'localStorage', any existing
 *       // mixpanel cookie value with the same persistence_name
 *       // will be transferred to localStorage and deleted
 *       persistence: 'cookie'
 *
 *       // name for super properties persistent store
 *       persistence_name: ''
 *
 *       // names of properties/superproperties which should never
 *       // be sent with track() calls
 *       property_blacklist: []
 *
 *       // if this is true, mixpanel cookies will be marked as
 *       // secure, meaning they will only be transmitted over https
 *       secure_cookie: false
 *
 *       // the amount of time track_links will
 *       // wait for Mixpanel's servers to respond
 *       track_links_timeout: 300
 *
 *       // should we track a page view on page load
 *       track_pageview: true
 *
 *       // if you set upgrade to be true, the library will check for
 *       // a cookie from our old js library and import super
 *       // properties from it, then the old cookie is deleted
 *       // The upgrade config option only works in the initialization,
 *       // so make sure you set it when you create the library.
 *       upgrade: false
 *
 *       // extra HTTP request headers to set for each API request, in
 *       // the format {'Header-Name': value}
 *       xhr_headers: {}
 *     }
 *
 *
 * @param {Object} config A dictionary of new configuration values to update
 */
MixpanelLib.prototype.set_config = function(config) {
    if (_.isObject(config)) {
        _.extend(this['config'], config);

        if (!this.get_config('persistence_name')) {
            this['config']['persistence_name'] = this['config']['cookie_name'];
        }
        if (!this.get_config('disable_persistence')) {
            this['config']['disable_persistence'] = this['config']['disable_cookie'];
        }

        if (this['persistence']) {
            this['persistence'].update_config(this['config']);
        }
        Config.DEBUG = Config.DEBUG || this.get_config('debug');
    }
};

/**
 * returns the current config object for the library.
 */
MixpanelLib.prototype.get_config = function(prop_name) {
    return this['config'][prop_name];
};

/**
 * Returns the value of the super property named property_name. If no such
 * property is set, get_property() will return the undefined value.
 *
 * ### Notes:
 *
 * get_property() can only be called after the Mixpanel library has finished loading.
 * init() has a loaded function available to handle this automatically. For example:
 *
 *     // grab value for 'user_id' after the mixpanel library has loaded
 *     mixpanel.init('YOUR PROJECT TOKEN', {
 *         loaded: function(mixpanel) {
 *             user_id = mixpanel.get_property('user_id');
 *         }
 *     });
 *
 * @param {String} property_name The name of the super property you want to retrieve
 */
MixpanelLib.prototype.get_property = function(property_name) {
    return this['persistence']['props'][property_name];
};

MixpanelLib.prototype.toString = function() {
    var name = this.get_config('name');
    if (name !== PRIMARY_INSTANCE_NAME) {
        name = PRIMARY_INSTANCE_NAME + '.' + name;
    }
    return name;
};

MixpanelLib.prototype._event_is_disabled = function(event_name) {
    return _.isBlockedUA(userAgent) ||
        this._flags.disable_all_events ||
        _.include(this.__disabled_events, event_name);
};

MixpanelLib.prototype._check_and_handle_notifications = addOptOutCheckMixpanelLib(function(distinct_id) {
    if (
        !distinct_id ||
        this._flags.identify_called ||
        this.get_config('disable_notifications')
    ) {
        return;
    }

    console$1.log('MIXPANEL NOTIFICATION CHECK');

    var data = {
        'verbose':     true,
        'version':     '2',
        'lib':         'web',
        'token':       this.get_config('token'),
        'distinct_id': distinct_id
    };
    var self = this;
    this._send_request(
        this.get_config('api_host') + '/decide/',
        data,
        this._prepare_callback(function(r) {
            if (r['notifications'] && r['notifications'].length > 0) {
                self._show_notification.call(self, r['notifications'][0]);
            }
        })
    );
});

MixpanelLib.prototype._show_notification = function(notification_data) {
    var notification = new MPNotif(notification_data, this);
    notification.show();
};

// perform some housekeeping around GDPR persistence of opt-in/out state
MixpanelLib.prototype._init_gdpr_persistence = function() {
    var is_localStorage_requested = this.get_config('opt_out_tracking_persistence_type') === 'localStorage';

    // try to convert opt-in/out cookies to localStorage if possible
    if (is_localStorage_requested && _.localStorage.is_supported()) {
        if (!this.has_opted_in_tracking() && this.has_opted_in_tracking({'persistence_type': 'cookie'})) {
            this.opt_in_tracking();
        }
        if (!this.has_opted_out_tracking() && this.has_opted_out_tracking({'persistence_type': 'cookie'})) {
            this.opt_out_tracking();
        }
        this.clear_opt_in_out_tracking({'persistence_type': 'cookie'});
    }

    // check whether we should opt out by default and update persistence accordingly
    if (this.get_config('opt_out_tracking_by_default') || _.cookie.get('mp_optout')) {
        _.cookie.remove('mp_optout');
        this.opt_out_tracking();
    }
    this._update_persistence();
};

// call a base gdpr function after constructing the appropriate token and options args
MixpanelLib.prototype._call_gdpr_func = function(func, options) {
    options = _.extend({
        'track': _.bind(this.track, this),
        'persistence_type': this.get_config('opt_out_tracking_persistence_type'),
        'cookie_prefix': this.get_config('opt_out_tracking_cookie_prefix'),
        'cookie_expiration': this.get_config('cookie_expiration'),
        'cross_subdomain_cookie': this.get_config('cross_subdomain_cookie'),
        'secure_cookie': this.get_config('secure_cookie')
    }, options);

    // check if localStorage can be used for recording opt out status, fall back to cookie if not
    if (!_.localStorage.is_supported()) {
        options['persistence_type'] = 'cookie';
    }

    return func(this.get_config('token'), {
        track: options['track'],
        trackEventName: options['track_event_name'],
        trackProperties: options['track_properties'],
        persistenceType: options['persistence_type'],
        persistencePrefix: options['cookie_prefix'],
        cookieExpiration: options['cookie_expiration'],
        crossSubdomainCookie: options['cross_subdomain_cookie'],
        secureCookie: options['secure_cookie']
    });
};

/**
 * Opt the user in to data tracking and cookies/localstorage for this Mixpanel instance
 *
 * ### Usage
 *
 *     // opt user in
 *     mixpanel.opt_in_tracking();
 *
 *     // opt user in with specific event name, properties, cookie configuration
 *     mixpanel.opt_in_tracking({
 *         track_event_name: 'User opted in',
 *         track_event_properties: {
 *             'Email': 'jdoe@example.com'
 *         },
 *         cookie_expiration: 30,
 *         secure_cookie: true
 *     });
 *
 * @param {Object} [options] A dictionary of config options to override
 * @param {function} [options.track] Function used for tracking a Mixpanel event to record the opt-in action (default is this Mixpanel instance's track method)
 * @param {string} [options.track_event_name=$opt_in] Event name to be used for tracking the opt-in action
 * @param {Object} [options.track_properties] Set of properties to be tracked along with the opt-in action
 * @param {string} [options.persistence_type=localStorage] Persistence mechanism used - cookie or localStorage - falls back to cookie if localStorage is unavailable
 * @param {string} [options.cookie_prefix=__mp_opt_in_out] Custom prefix to be used in the cookie/localstorage name
 * @param {Number} [options.cookie_expiration] Number of days until the opt-in cookie expires (overrides value specified in this Mixpanel instance's config)
 * @param {boolean} [options.cross_subdomain_cookie] Whether the opt-in cookie is set as cross-subdomain or not (overrides value specified in this Mixpanel instance's config)
 * @param {boolean} [options.secure_cookie] Whether the opt-in cookie is set as secure or not (overrides value specified in this Mixpanel instance's config)
 */
MixpanelLib.prototype.opt_in_tracking = function(options) {
    this._call_gdpr_func(optIn, options);
    this._update_persistence();
};

/**
 * Opt the user out of data tracking and cookies/localstorage for this Mixpanel instance
 *
 * ### Usage
 *
 *     // opt user out
 *     mixpanel.opt_out_tracking();
 *
 *     // opt user out with different cookie configuration from Mixpanel instance
 *     mixpanel.opt_out_tracking({
 *         cookie_expiration: 30,
 *         secure_cookie: true
 *     });
 *
 * @param {Object} [options] A dictionary of config options to override
 * @param {boolean} [options.delete_user=true] If true, will delete the currently identified user's profile and clear all charges after opting the user out
 * @param {string} [options.persistence_type=localStorage] Persistence mechanism used - cookie or localStorage - falls back to cookie if localStorage is unavailable
 * @param {string} [options.cookie_prefix=__mp_opt_in_out] Custom prefix to be used in the cookie/localstorage name
 * @param {Number} [options.cookie_expiration] Number of days until the opt-in cookie expires (overrides value specified in this Mixpanel instance's config)
 * @param {boolean} [options.cross_subdomain_cookie] Whether the opt-in cookie is set as cross-subdomain or not (overrides value specified in this Mixpanel instance's config)
 * @param {boolean} [options.secure_cookie] Whether the opt-in cookie is set as secure or not (overrides value specified in this Mixpanel instance's config)
 */
MixpanelLib.prototype.opt_out_tracking = function(options) {
    // delete use and clear charges since these methods may be disabled by opt-out
    options = _.extend({'delete_user': true}, options);
    if (options['delete_user'] && this['people'] && this['people']._identify_called()) {
        this['people'].delete_user();
        this['people'].clear_charges();
    }

    this._call_gdpr_func(optOut, options);
    this._update_persistence();
};

/**
 * Check whether the user has opted in to data tracking and cookies/localstorage for this Mixpanel instance
 *
 * ### Usage
 *
 *     var has_opted_in = mixpanel.has_opted_in_tracking();
 *     // use has_opted_in value
 *
 * @param {Object} [options] A dictionary of config options to override
 * @param {string} [options.persistence_type=localStorage] Persistence mechanism used - cookie or localStorage - falls back to cookie if localStorage is unavailable
 * @param {string} [options.cookie_prefix=__mp_opt_in_out] Custom prefix to be used in the cookie/localstorage name
 * @returns {boolean} current opt-in status
 */
MixpanelLib.prototype.has_opted_in_tracking = function(options) {
    return this._call_gdpr_func(hasOptedIn, options);
};

/**
 * Check whether the user has opted out of data tracking and cookies/localstorage for this Mixpanel instance
 *
 * ### Usage
 *
 *     var has_opted_out = mixpanel.has_opted_out_tracking();
 *     // use has_opted_out value
 *
 * @param {Object} [options] A dictionary of config options to override
 * @param {string} [options.persistence_type=localStorage] Persistence mechanism used - cookie or localStorage - falls back to cookie if localStorage is unavailable
 * @param {string} [options.cookie_prefix=__mp_opt_in_out] Custom prefix to be used in the cookie/localstorage name
 * @returns {boolean} current opt-out status
 */
MixpanelLib.prototype.has_opted_out_tracking = function(options) {
    return this._call_gdpr_func(hasOptedOut, options);
};

/**
 * Clear the user's opt in/out status of data tracking and cookies/localstorage for this Mixpanel instance
 *
 * ### Usage
 *
 *     // clear user's opt-in/out status
 *     mixpanel.clear_opt_in_out_tracking();
 *
 *     // clear user's opt-in/out status with specific cookie configuration - should match
 *     // configuration used when opt_in_tracking/opt_out_tracking methods were called.
 *     mixpanel.clear_opt_in_out_tracking({
 *         cookie_expiration: 30,
 *         secure_cookie: true
 *     });
 *
 * @param {Object} [options] A dictionary of config options to override
 * @param {string} [options.persistence_type=localStorage] Persistence mechanism used - cookie or localStorage - falls back to cookie if localStorage is unavailable
 * @param {string} [options.cookie_prefix=__mp_opt_in_out] Custom prefix to be used in the cookie/localstorage name
 * @param {Number} [options.cookie_expiration] Number of days until the opt-in cookie expires (overrides value specified in this Mixpanel instance's config)
 * @param {boolean} [options.cross_subdomain_cookie] Whether the opt-in cookie is set as cross-subdomain or not (overrides value specified in this Mixpanel instance's config)
 * @param {boolean} [options.secure_cookie] Whether the opt-in cookie is set as secure or not (overrides value specified in this Mixpanel instance's config)
 */
MixpanelLib.prototype.clear_opt_in_out_tracking = function(options) {
    this._call_gdpr_func(clearOptInOut, options);
    this._update_persistence();
};


MixpanelPeople.prototype._init = function(mixpanel_instance) {
    this._mixpanel = mixpanel_instance;
};

/*
 * Set properties on a user record.
 *
 * ### Usage:
 *
 *     mixpanel.people.set('gender', 'm');
 *
 *     // or set multiple properties at once
 *     mixpanel.people.set({
 *         'Company': 'Acme',
 *         'Plan': 'Premium',
 *         'Upgrade date': new Date()
 *     });
 *     // properties can be strings, integers, dates, or lists
 *
 * @param {Object|String} prop If a string, this is the name of the property. If an object, this is an associative array of names and values.
 * @param {*} [to] A value to set on the given property name
 * @param {Function} [callback] If provided, the callback will be called after the tracking event
 */
MixpanelPeople.prototype.set = addOptOutCheckMixpanelPeople(function(prop, to, callback) {
    var data = {};
    var $set = {};
    if (_.isObject(prop)) {
        _.each(prop, function(v, k) {
            if (!this._is_reserved_property(k)) {
                $set[k] = v;
            }
        }, this);
        callback = to;
    } else {
        $set[prop] = to;
    }

    // make sure that the referrer info has been updated and saved
    if (this._get_config('save_referrer')) {
        this._mixpanel['persistence'].update_referrer_info(document$1.referrer);
    }

    // update $set object with default people properties
    $set = _.extend(
        {},
        _.info.people_properties(),
        this._mixpanel['persistence'].get_referrer_info(),
        $set
    );

    data[SET_ACTION] = $set;

    return this._send_request(data, callback);
});

/*
 * Set properties on a user record, only if they do not yet exist.
 * This will not overwrite previous people property values, unlike
 * people.set().
 *
 * ### Usage:
 *
 *     mixpanel.people.set_once('First Login Date', new Date());
 *
 *     // or set multiple properties at once
 *     mixpanel.people.set_once({
 *         'First Login Date': new Date(),
 *         'Starting Plan': 'Premium'
 *     });
 *
 *     // properties can be strings, integers or dates
 *
 * @param {Object|String} prop If a string, this is the name of the property. If an object, this is an associative array of names and values.
 * @param {*} [to] A value to set on the given property name
 * @param {Function} [callback] If provided, the callback will be called after the tracking event
 */
MixpanelPeople.prototype.set_once = addOptOutCheckMixpanelPeople(function(prop, to, callback) {
    var data = {};
    var $set_once = {};
    if (_.isObject(prop)) {
        _.each(prop, function(v, k) {
            if (!this._is_reserved_property(k)) {
                $set_once[k] = v;
            }
        }, this);
        callback = to;
    } else {
        $set_once[prop] = to;
    }
    data[SET_ONCE_ACTION] = $set_once;
    return this._send_request(data, callback);
});

/*
 * Unset properties on a user record (permanently removes the properties and their values from a profile).
 *
 * ### Usage:
 *
 *     mixpanel.people.unset('gender');
 *
 *     // or unset multiple properties at once
 *     mixpanel.people.unset(['gender', 'Company']);
 *
 * @param {Array|String} prop If a string, this is the name of the property. If an array, this is a list of property names.
 * @param {Function} [callback] If provided, the callback will be called after the tracking event
 */
MixpanelPeople.prototype.unset = function(prop, callback) {
    var data = {};
    var $unset = [];
    if (!_.isArray(prop)) {
        prop = [prop];
    }

    _.each(prop, function(k) {
        if (!this._is_reserved_property(k)) {
            $unset.push(k);
        }
    }, this);

    data[UNSET_ACTION] = $unset;

    return this._send_request(data, callback);
};

/*
 * Increment/decrement numeric people analytics properties.
 *
 * ### Usage:
 *
 *     mixpanel.people.increment('page_views', 1);
 *
 *     // or, for convenience, if you're just incrementing a counter by
 *     // 1, you can simply do
 *     mixpanel.people.increment('page_views');
 *
 *     // to decrement a counter, pass a negative number
 *     mixpanel.people.increment('credits_left', -1);
 *
 *     // like mixpanel.people.set(), you can increment multiple
 *     // properties at once:
 *     mixpanel.people.increment({
 *         counter1: 1,
 *         counter2: 6
 *     });
 *
 * @param {Object|String} prop If a string, this is the name of the property. If an object, this is an associative array of names and numeric values.
 * @param {Number} [by] An amount to increment the given property
 * @param {Function} [callback] If provided, the callback will be called after the tracking event
 */
MixpanelPeople.prototype.increment = addOptOutCheckMixpanelPeople(function(prop, by, callback) {
    var data = {};
    var $add = {};
    if (_.isObject(prop)) {
        _.each(prop, function(v, k) {
            if (!this._is_reserved_property(k)) {
                if (isNaN(parseFloat(v))) {
                    console$1.error('Invalid increment value passed to mixpanel.people.increment - must be a number');
                    return;
                } else {
                    $add[k] = v;
                }
            }
        }, this);
        callback = by;
    } else {
        // convenience: mixpanel.people.increment('property'); will
        // increment 'property' by 1
        if (_.isUndefined(by)) {
            by = 1;
        }
        $add[prop] = by;
    }
    data[ADD_ACTION] = $add;

    return this._send_request(data, callback);
});

/*
 * Append a value to a list-valued people analytics property.
 *
 * ### Usage:
 *
 *     // append a value to a list, creating it if needed
 *     mixpanel.people.append('pages_visited', 'homepage');
 *
 *     // like mixpanel.people.set(), you can append multiple
 *     // properties at once:
 *     mixpanel.people.append({
 *         list1: 'bob',
 *         list2: 123
 *     });
 *
 * @param {Object|String} prop If a string, this is the name of the property. If an object, this is an associative array of names and values.
 * @param {*} [value] An item to append to the list
 * @param {Function} [callback] If provided, the callback will be called after the tracking event
 */
MixpanelPeople.prototype.append = addOptOutCheckMixpanelPeople(function(list_name, value, callback) {
    var data = {};
    var $append = {};
    if (_.isObject(list_name)) {
        _.each(list_name, function(v, k) {
            if (!this._is_reserved_property(k)) {
                $append[k] = v;
            }
        }, this);
        callback = value;
    } else {
        $append[list_name] = value;
    }
    data[APPEND_ACTION] = $append;

    return this._send_request(data, callback);
});

/*
 * Merge a given list with a list-valued people analytics property,
 * excluding duplicate values.
 *
 * ### Usage:
 *
 *     // merge a value to a list, creating it if needed
 *     mixpanel.people.union('pages_visited', 'homepage');
 *
 *     // like mixpanel.people.set(), you can append multiple
 *     // properties at once:
 *     mixpanel.people.union({
 *         list1: 'bob',
 *         list2: 123
 *     });
 *
 *     // like mixpanel.people.append(), you can append multiple
 *     // values to the same list:
 *     mixpanel.people.union({
 *         list1: ['bob', 'billy']
 *     });
 *
 * @param {Object|String} prop If a string, this is the name of the property. If an object, this is an associative array of names and values.
 * @param {*} [value] Value / values to merge with the given property
 * @param {Function} [callback] If provided, the callback will be called after the tracking event
 */
MixpanelPeople.prototype.union = addOptOutCheckMixpanelPeople(function(list_name, values, callback) {
    var data = {};
    var $union = {};
    if (_.isObject(list_name)) {
        _.each(list_name, function(v, k) {
            if (!this._is_reserved_property(k)) {
                $union[k] = _.isArray(v) ? v : [v];
            }
        }, this);
        callback = values;
    } else {
        $union[list_name] = _.isArray(values) ? values : [values];
    }
    data[UNION_ACTION] = $union;

    return this._send_request(data, callback);
});

/*
 * Record that you have charged the current user a certain amount
 * of money. Charges recorded with track_charge() will appear in the
 * Mixpanel revenue report.
 *
 * ### Usage:
 *
 *     // charge a user $50
 *     mixpanel.people.track_charge(50);
 *
 *     // charge a user $30.50 on the 2nd of january
 *     mixpanel.people.track_charge(30.50, {
 *         '$time': new Date('jan 1 2012')
 *     });
 *
 * @param {Number} amount The amount of money charged to the current user
 * @param {Object} [properties] An associative array of properties associated with the charge
 * @param {Function} [callback] If provided, the callback will be called when the server responds
 */
MixpanelPeople.prototype.track_charge = addOptOutCheckMixpanelPeople(function(amount, properties, callback) {
    if (!_.isNumber(amount)) {
        amount = parseFloat(amount);
        if (isNaN(amount)) {
            console$1.error('Invalid value passed to mixpanel.people.track_charge - must be a number');
            return;
        }
    }

    return this.append('$transactions', _.extend({
        '$amount': amount
    }, properties), callback);
});

/*
 * Permanently clear all revenue report transactions from the
 * current user's people analytics profile.
 *
 * ### Usage:
 *
 *     mixpanel.people.clear_charges();
 *
 * @param {Function} [callback] If provided, the callback will be called after the tracking event
 */
MixpanelPeople.prototype.clear_charges = function(callback) {
    return this.set('$transactions', [], callback);
};

/*
 * Permanently deletes the current people analytics profile from
 * Mixpanel (using the current distinct_id).
 *
 * ### Usage:
 *
 *     // remove the all data you have stored about the current user
 *     mixpanel.people.delete_user();
 *
 */
MixpanelPeople.prototype.delete_user = function() {
    if (!this._identify_called()) {
        console$1.error('mixpanel.people.delete_user() requires you to call identify() first');
        return;
    }
    var data = {'$delete': this._mixpanel.get_distinct_id()};
    return this._send_request(data);
};

MixpanelPeople.prototype.toString = function() {
    return this._mixpanel.toString() + '.people';
};

MixpanelPeople.prototype._send_request = function(data, callback) {
    data['$token'] = this._get_config('token');
    data['$distinct_id'] = this._mixpanel.get_distinct_id();

    var date_encoded_data = _.encodeDates(data);
    var truncated_data    = _.truncate(date_encoded_data, 255);
    var json_data         = _.JSONEncode(date_encoded_data);
    var encoded_data      = _.base64Encode(json_data);

    if (!this._identify_called()) {
        this._enqueue(data);
        if (!_.isUndefined(callback)) {
            if (this._get_config('verbose')) {
                callback({status: -1, error: null});
            } else {
                callback(-1);
            }
        }
        return truncated_data;
    }

    console$1.log('MIXPANEL PEOPLE REQUEST:');
    console$1.log(truncated_data);

    this._mixpanel._send_request(
        this._get_config('api_host') + '/engage/',
        {'data': encoded_data},
        this._mixpanel._prepare_callback(callback, truncated_data)
    );

    return truncated_data;
};

MixpanelPeople.prototype._get_config = function(conf_var) {
    return this._mixpanel.get_config(conf_var);
};

MixpanelPeople.prototype._identify_called = function() {
    return this._mixpanel._flags.identify_called === true;
};

// Queue up engage operations if identify hasn't been called yet.
MixpanelPeople.prototype._enqueue = function(data) {
    if (SET_ACTION in data) {
        this._mixpanel['persistence']._add_to_people_queue(SET_ACTION, data);
    } else if (SET_ONCE_ACTION in data) {
        this._mixpanel['persistence']._add_to_people_queue(SET_ONCE_ACTION, data);
    } else if (UNSET_ACTION in data) {
        this._mixpanel['persistence']._add_to_people_queue(UNSET_ACTION, data);
    } else if (ADD_ACTION in data) {
        this._mixpanel['persistence']._add_to_people_queue(ADD_ACTION, data);
    } else if (APPEND_ACTION in data) {
        this._mixpanel['persistence']._add_to_people_queue(APPEND_ACTION, data);
    } else if (UNION_ACTION in data) {
        this._mixpanel['persistence']._add_to_people_queue(UNION_ACTION, data);
    } else {
        console$1.error('Invalid call to _enqueue():', data);
    }
};

MixpanelPeople.prototype._flush_one_queue = function(action, action_method, callback, queue_to_params_fn) {
    var _this = this;
    var queued_data = _.extend({}, this._mixpanel['persistence']._get_queue(action));
    var action_params = queued_data;

    if (!_.isUndefined(queued_data) && _.isObject(queued_data) && !_.isEmptyObject(queued_data)) {
        _this._mixpanel['persistence']._pop_from_people_queue(action, queued_data);
        if (queue_to_params_fn) {
            action_params = queue_to_params_fn(queued_data);
        }
        action_method.call(_this, action_params, function(response, data) {
            // on bad response, we want to add it back to the queue
            if (response === 0) {
                _this._mixpanel['persistence']._add_to_people_queue(action, queued_data);
            }
            if (!_.isUndefined(callback)) {
                callback(response, data);
            }
        });
    }
};

// Flush queued engage operations - order does not matter,
// and there are network level race conditions anyway
MixpanelPeople.prototype._flush = function(
    _set_callback, _add_callback, _append_callback, _set_once_callback, _union_callback, _unset_callback
) {
    var _this = this;
    var $append_queue = this._mixpanel['persistence']._get_queue(APPEND_ACTION);

    this._flush_one_queue(SET_ACTION, this.set, _set_callback);
    this._flush_one_queue(SET_ONCE_ACTION, this.set_once, _set_once_callback);
    this._flush_one_queue(UNSET_ACTION, this.unset, _unset_callback, function(queue) { return _.keys(queue); });
    this._flush_one_queue(ADD_ACTION, this.increment, _add_callback);
    this._flush_one_queue(UNION_ACTION, this.union, _union_callback);

    // we have to fire off each $append individually since there is
    // no concat method server side
    if (!_.isUndefined($append_queue) && _.isArray($append_queue) && $append_queue.length) {
        var $append_item;
        var callback = function(response, data) {
            if (response === 0) {
                _this._mixpanel['persistence']._add_to_people_queue(APPEND_ACTION, $append_item);
            }
            if (!_.isUndefined(_append_callback)) {
                _append_callback(response, data);
            }
        };
        for (var i = $append_queue.length - 1; i >= 0; i--) {
            $append_item = $append_queue.pop();
            _this.append($append_item, callback);
        }
        // Save the shortened append queue
        _this._mixpanel['persistence'].save();
    }
};

MixpanelPeople.prototype._is_reserved_property = function(prop) {
    return prop === '$distinct_id' || prop === '$token';
};


// Internal class for notification display
MixpanelLib._Notification = function(notif_data, mixpanel_instance) {
    _.bind_instance_methods(this);

    this.mixpanel    = mixpanel_instance;
    this.persistence = this.mixpanel['persistence'];

    this.campaign_id = _.escapeHTML(notif_data['id']);
    this.message_id  = _.escapeHTML(notif_data['message_id']);

    this.body            = (_.escapeHTML(notif_data['body']) || '').replace(/\n/g, '<br/>');
    this.cta             = _.escapeHTML(notif_data['cta']) || 'Close';
    this.notif_type      = _.escapeHTML(notif_data['type']) || 'takeover';
    this.style           = _.escapeHTML(notif_data['style']) || 'light';
    this.title           = _.escapeHTML(notif_data['title']) || '';
    this.video_width     = MPNotif.VIDEO_WIDTH;
    this.video_height    = MPNotif.VIDEO_HEIGHT;

    // These fields are url-sanitized in the backend already.
    this.dest_url        = notif_data['cta_url'] || null;
    this.image_url       = notif_data['image_url'] || null;
    this.thumb_image_url = notif_data['thumb_image_url'] || null;
    this.video_url       = notif_data['video_url'] || null;

    this.clickthrough = true;
    if (!this.dest_url) {
        this.dest_url = '#dismiss';
        this.clickthrough = false;
    }

    this.mini = this.notif_type === 'mini';
    if (!this.mini) {
        this.notif_type = 'takeover';
    }
    this.notif_width = !this.mini ? MPNotif.NOTIF_WIDTH : MPNotif.NOTIF_WIDTH_MINI;

    this._set_client_config();
    this.imgs_to_preload = this._init_image_html();
    this._init_video();
};

MPNotif = MixpanelLib._Notification;

MPNotif.ANIM_TIME         = 200;
MPNotif.MARKUP_PREFIX     = 'mixpanel-notification';
MPNotif.BG_OPACITY        = 0.6;
MPNotif.NOTIF_TOP         = 25;
MPNotif.NOTIF_START_TOP   = 200;
MPNotif.NOTIF_WIDTH       = 388;
MPNotif.NOTIF_WIDTH_MINI  = 420;
MPNotif.NOTIF_HEIGHT_MINI = 85;
MPNotif.THUMB_BORDER_SIZE = 5;
MPNotif.THUMB_IMG_SIZE    = 60;
MPNotif.THUMB_OFFSET      = Math.round(MPNotif.THUMB_IMG_SIZE / 2);
MPNotif.VIDEO_WIDTH       = 595;
MPNotif.VIDEO_HEIGHT      = 334;

MPNotif.prototype.show = function() {
    var self = this;
    this._set_client_config();

    // don't display until HTML body exists
    if (!this.body_el) {
        setTimeout(function() { self.show(); }, 300);
        return;
    }

    this._init_styles();
    this._init_notification_el();

    // wait for any images to load before showing notification
    this._preload_images(this._attach_and_animate);
};

MPNotif.prototype.dismiss = _.safewrap(function() {
    if (!this.marked_as_shown) {
        // unexpected condition: user interacted with notif even though we didn't consider it
        // visible (see _mark_as_shown()); send tracking signals to mark delivery
        this._mark_delivery({'invisible': true});
    }

    var exiting_el = this.showing_video ? this._get_el('video') : this._get_notification_display_el();
    if (this.use_transitions) {
        this._remove_class('bg', 'visible');
        this._add_class(exiting_el, 'exiting');
        setTimeout(this._remove_notification_el, MPNotif.ANIM_TIME);
    } else {
        var notif_attr, notif_start, notif_goal;
        if (this.mini) {
            notif_attr  = 'right';
            notif_start = 20;
            notif_goal  = -100;
        } else {
            notif_attr  = 'top';
            notif_start = MPNotif.NOTIF_TOP;
            notif_goal  = MPNotif.NOTIF_START_TOP + MPNotif.NOTIF_TOP;
        }
        this._animate_els([
            {
                el:    this._get_el('bg'),
                attr:  'opacity',
                start: MPNotif.BG_OPACITY,
                goal:  0.0
            },
            {
                el:    exiting_el,
                attr:  'opacity',
                start: 1.0,
                goal:  0.0
            },
            {
                el:    exiting_el,
                attr:  notif_attr,
                start: notif_start,
                goal:  notif_goal
            }
        ], MPNotif.ANIM_TIME, this._remove_notification_el);
    }
});

MPNotif.prototype._add_class = _.safewrap(function(el, class_name) {
    class_name = MPNotif.MARKUP_PREFIX + '-' + class_name;
    if (typeof el === 'string') {
        el = this._get_el(el);
    }
    if (!el.className) {
        el.className = class_name;
    } else if (!~(' ' + el.className + ' ').indexOf(' ' + class_name + ' ')) {
        el.className += ' ' + class_name;
    }
});
MPNotif.prototype._remove_class = _.safewrap(function(el, class_name) {
    class_name = MPNotif.MARKUP_PREFIX + '-' + class_name;
    if (typeof el === 'string') {
        el = this._get_el(el);
    }
    if (el.className) {
        el.className = (' ' + el.className + ' ')
                .replace(' ' + class_name + ' ', '')
                .replace(/^[\s\xA0]+/, '')
                .replace(/[\s\xA0]+$/, '');
    }
});

MPNotif.prototype._animate_els = _.safewrap(function(anims, mss, done_cb, start_time) {
    var self = this,
        in_progress = false,
        ai, anim,
        cur_time = 1 * new Date(), time_diff;

    start_time = start_time || cur_time;
    time_diff = cur_time - start_time;

    for (ai = 0; ai < anims.length; ai++) {
        anim = anims[ai];
        if (typeof anim.val === 'undefined') {
            anim.val = anim.start;
        }
        if (anim.val !== anim.goal) {
            in_progress = true;
            var anim_diff = anim.goal - anim.start,
                anim_dir = anim.goal >= anim.start ? 1 : -1;
            anim.val = anim.start + anim_diff * time_diff / mss;
            if (anim.attr !== 'opacity') {
                anim.val = Math.round(anim.val);
            }
            if ((anim_dir > 0 && anim.val >= anim.goal) || (anim_dir < 0 && anim.val <= anim.goal)) {
                anim.val = anim.goal;
            }
        }
    }
    if (!in_progress) {
        if (done_cb) {
            done_cb();
        }
        return;
    }

    for (ai = 0; ai < anims.length; ai++) {
        anim = anims[ai];
        if (anim.el) {
            var suffix = anim.attr === 'opacity' ? '' : 'px';
            anim.el.style[anim.attr] = String(anim.val) + suffix;
        }
    }
    setTimeout(function() { self._animate_els(anims, mss, done_cb, start_time); }, 10);
});

MPNotif.prototype._attach_and_animate = _.safewrap(function() {
    var self = this;

    // no possibility to double-display
    if (this.shown || this._get_shown_campaigns()[this.campaign_id]) {
        return;
    }
    this.shown = true;

    this.body_el.appendChild(this.notification_el);
    setTimeout(function() {
        var notif_el = self._get_notification_display_el();
        if (self.use_transitions) {
            if (!self.mini) {
                self._add_class('bg', 'visible');
            }
            self._add_class(notif_el, 'visible');
            self._mark_as_shown();
        } else {
            var notif_attr, notif_start, notif_goal;
            if (self.mini) {
                notif_attr  = 'right';
                notif_start = -100;
                notif_goal  = 20;
            } else {
                notif_attr  = 'top';
                notif_start = MPNotif.NOTIF_START_TOP + MPNotif.NOTIF_TOP;
                notif_goal  = MPNotif.NOTIF_TOP;
            }
            self._animate_els([
                {
                    el:    self._get_el('bg'),
                    attr:  'opacity',
                    start: 0.0,
                    goal:  MPNotif.BG_OPACITY
                },
                {
                    el:    notif_el,
                    attr:  'opacity',
                    start: 0.0,
                    goal:  1.0
                },
                {
                    el:    notif_el,
                    attr:  notif_attr,
                    start: notif_start,
                    goal:  notif_goal
                }
            ], MPNotif.ANIM_TIME, self._mark_as_shown);
        }
    }, 100);
    _.register_event(self._get_el('cancel'), 'click', function(e) {
        e.preventDefault();
        self.dismiss();
    });
    var click_el = self._get_el('button') ||
                       self._get_el('mini-content');
    _.register_event(click_el, 'click', function(e) {
        e.preventDefault();
        if (self.show_video) {
            self._track_event('$campaign_open', {'$resource_type': 'video'});
            self._switch_to_video();
        } else {
            self.dismiss();
            if (self.clickthrough) {
                self._track_event('$campaign_open', {'$resource_type': 'link'}, function() {
                    window$1.location.href = self.dest_url;
                });
            }
        }
    });
});

MPNotif.prototype._get_el = function(id) {
    return document$1.getElementById(MPNotif.MARKUP_PREFIX + '-' + id);
};

MPNotif.prototype._get_notification_display_el = function() {
    return this._get_el(this.notif_type);
};

MPNotif.prototype._get_shown_campaigns = function() {
    return this.persistence['props'][CAMPAIGN_IDS_KEY] || (this.persistence['props'][CAMPAIGN_IDS_KEY] = {});
};

MPNotif.prototype._browser_lte = function(browser, version) {
    return this.browser_versions[browser] && this.browser_versions[browser] <= version;
};

MPNotif.prototype._init_image_html = function() {
    var imgs_to_preload = [];

    if (!this.mini) {
        if (this.image_url) {
            imgs_to_preload.push(this.image_url);
            this.img_html = '<img id="img" src="' + this.image_url + '"/>';
        } else {
            this.img_html = '';
        }
        if (this.thumb_image_url) {
            imgs_to_preload.push(this.thumb_image_url);
            this.thumb_img_html =
                    '<div id="thumbborder-wrapper"><div id="thumbborder"></div></div>' +
                    '<img id="thumbnail"' +
                        ' src="' + this.thumb_image_url + '"' +
                        ' width="' + MPNotif.THUMB_IMG_SIZE + '"' +
                        ' height="' + MPNotif.THUMB_IMG_SIZE + '"' +
                    '/>' +
                    '<div id="thumbspacer"></div>';
        } else {
            this.thumb_img_html = '';
        }
    } else {
        this.thumb_image_url = this.thumb_image_url || '//cdn.mxpnl.com/site_media/images/icons/notifications/mini-news-dark.png';
        imgs_to_preload.push(this.thumb_image_url);
    }

    return imgs_to_preload;
};

MPNotif.prototype._init_notification_el = function() {
    var notification_html = '';
    var video_src         = '';
    var video_html        = '';
    var cancel_html       = '<div id="cancel">' +
                                    '<div id="cancel-icon"></div>' +
                                '</div>';

    this.notification_el = document$1.createElement('div');
    this.notification_el.id = MPNotif.MARKUP_PREFIX + '-wrapper';
    if (!this.mini) {
        // TAKEOVER notification
        var close_html  = (this.clickthrough || this.show_video) ? '' : '<div id="button-close"></div>',
            play_html   = this.show_video ? '<div id="button-play"></div>' : '';
        if (this._browser_lte('ie', 7)) {
            close_html = '';
            play_html = '';
        }
        notification_html =
                '<div id="takeover">' +
                    this.thumb_img_html +
                    '<div id="mainbox">' +
                        cancel_html +
                        '<div id="content">' +
                            this.img_html +
                            '<div id="title">' + this.title + '</div>' +
                            '<div id="body">' + this.body + '</div>' +
                            '<div id="tagline">' +
                                '<a href="http://mixpanel.com?from=inapp" target="_blank">POWERED BY MIXPANEL</a>' +
                            '</div>' +
                        '</div>' +
                        '<div id="button">' +
                            close_html +
                            '<a id="button-link" href="' + this.dest_url + '">' + this.cta + '</a>' +
                            play_html +
                        '</div>' +
                    '</div>' +
                '</div>';
    } else {
        // MINI notification
        notification_html =
                '<div id="mini">' +
                    '<div id="mainbox">' +
                        cancel_html +
                        '<div id="mini-content">' +
                            '<div id="mini-icon">' +
                                '<div id="mini-icon-img"></div>' +
                            '</div>' +
                            '<div id="body">' +
                                '<div id="body-text"><div>' + this.body + '</div></div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div id="mini-border"></div>' +
                '</div>';
    }
    if (this.youtube_video) {
        video_src = '//www.youtube.com/embed/' + this.youtube_video +
                '?wmode=transparent&showinfo=0&modestbranding=0&rel=0&autoplay=1&loop=0&vq=hd1080';
        if (this.yt_custom) {
            video_src += '&enablejsapi=1&html5=1&controls=0';
            video_html =
                    '<div id="video-controls">' +
                        '<div id="video-progress" class="video-progress-el">' +
                            '<div id="video-progress-total" class="video-progress-el"></div>' +
                            '<div id="video-elapsed" class="video-progress-el"></div>' +
                        '</div>' +
                        '<div id="video-time" class="video-progress-el"></div>' +
                    '</div>';
        }
    } else if (this.vimeo_video) {
        video_src = '//player.vimeo.com/video/' + this.vimeo_video + '?autoplay=1&title=0&byline=0&portrait=0';
    }
    if (this.show_video) {
        this.video_iframe =
                '<iframe id="' + MPNotif.MARKUP_PREFIX + '-video-frame" ' +
                    'width="' + this.video_width + '" height="' + this.video_height + '" ' +
                    ' src="' + video_src + '"' +
                    ' frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen="1" scrolling="no"' +
                '></iframe>';
        video_html =
                '<div id="video-' + (this.flip_animate ? '' : 'no') + 'flip">' +
                    '<div id="video">' +
                        '<div id="video-holder"></div>' +
                        video_html +
                    '</div>' +
                '</div>';
    }
    var main_html = video_html + notification_html;
    if (this.flip_animate) {
        main_html =
                (this.mini ? notification_html : '') +
                '<div id="flipcontainer"><div id="flipper">' +
                    (this.mini ? video_html : main_html) +
                '</div></div>';
    }

    this.notification_el.innerHTML =
            ('<div id="overlay" class="' + this.notif_type + '">' +
                '<div id="campaignid-' + this.campaign_id + '">' +
                    '<div id="bgwrapper">' +
                        '<div id="bg"></div>' +
                        main_html +
                    '</div>' +
                '</div>' +
            '</div>')
            .replace(/class=\"/g, 'class="' + MPNotif.MARKUP_PREFIX + '-')
            .replace(/id=\"/g, 'id="' + MPNotif.MARKUP_PREFIX + '-');
};

MPNotif.prototype._init_styles = function() {
    if (this.style === 'dark') {
        this.style_vals = {
            bg:             '#1d1f25',
            bg_actions:     '#282b32',
            bg_hover:       '#3a4147',
            bg_light:       '#4a5157',
            border_gray:    '#32353c',
            cancel_opacity: '0.4',
            mini_hover:     '#2a3137',
            text_title:     '#fff',
            text_main:      '#9498a3',
            text_tagline:   '#464851',
            text_hover:     '#ddd'
        };
    } else {
        this.style_vals = {
            bg:             '#fff',
            bg_actions:     '#e7eaee',
            bg_hover:       '#eceff3',
            bg_light:       '#f5f5f5',
            border_gray:    '#e4ecf2',
            cancel_opacity: '1.0',
            mini_hover:     '#fafafa',
            text_title:     '#5c6578',
            text_main:      '#8b949b',
            text_tagline:   '#ced9e6',
            text_hover:     '#7c8598'
        };
    }
    var shadow = '0px 0px 35px 0px rgba(45, 49, 56, 0.7)',
        video_shadow = shadow,
        mini_shadow = shadow,
        thumb_total_size = MPNotif.THUMB_IMG_SIZE + MPNotif.THUMB_BORDER_SIZE * 2,
        anim_seconds = (MPNotif.ANIM_TIME / 1000) + 's';
    if (this.mini) {
        shadow = 'none';
    }

    // don't display on small viewports
    var notif_media_queries = {},
        min_width = MPNotif.NOTIF_WIDTH_MINI + 20;
    notif_media_queries['@media only screen and (max-width: ' + (min_width - 1) + 'px)'] = {
        '#overlay': {
            'display': 'none'
        }
    };
    var notif_styles = {
        '.flipped': {
            'transform': 'rotateY(180deg)'
        },
        '#overlay': {
            'position': 'fixed',
            'top': '0',
            'left': '0',
            'width': '100%',
            'height': '100%',
            'overflow': 'auto',
            'text-align': 'center',
            'z-index': '10000',
            'font-family': '"Helvetica", "Arial", sans-serif',
            '-webkit-font-smoothing': 'antialiased',
            '-moz-osx-font-smoothing': 'grayscale'
        },
        '#overlay.mini': {
            'height': '0',
            'overflow': 'visible'
        },
        '#overlay a': {
            'width': 'initial',
            'padding': '0',
            'text-decoration': 'none',
            'text-transform': 'none',
            'color': 'inherit'
        },
        '#bgwrapper': {
            'position': 'relative',
            'width': '100%',
            'height': '100%'
        },
        '#bg': {
            'position': 'fixed',
            'top': '0',
            'left': '0',
            'width': '100%',
            'height': '100%',
            'min-width': this.doc_width * 4 + 'px',
            'min-height': this.doc_height * 4 + 'px',
            'background-color': 'black',
            'opacity': '0.0',
            '-ms-filter': 'progid:DXImageTransform.Microsoft.Alpha(Opacity=60)', // IE8
            'filter': 'alpha(opacity=60)', // IE5-7
            'transition': 'opacity ' + anim_seconds
        },
        '#bg.visible': {
            'opacity': MPNotif.BG_OPACITY
        },
        '.mini #bg': {
            'width': '0',
            'height': '0',
            'min-width': '0'
        },
        '#flipcontainer': {
            'perspective': '1000px',
            'position': 'absolute',
            'width': '100%'
        },
        '#flipper': {
            'position': 'relative',
            'transform-style': 'preserve-3d',
            'transition': '0.3s'
        },
        '#takeover': {
            'position': 'absolute',
            'left': '50%',
            'width': MPNotif.NOTIF_WIDTH + 'px',
            'margin-left': Math.round(-MPNotif.NOTIF_WIDTH / 2) + 'px',
            'backface-visibility': 'hidden',
            'transform': 'rotateY(0deg)',
            'opacity': '0.0',
            'top': MPNotif.NOTIF_START_TOP + 'px',
            'transition': 'opacity ' + anim_seconds + ', top ' + anim_seconds
        },
        '#takeover.visible': {
            'opacity': '1.0',
            'top': MPNotif.NOTIF_TOP + 'px'
        },
        '#takeover.exiting': {
            'opacity': '0.0',
            'top': MPNotif.NOTIF_START_TOP + 'px'
        },
        '#thumbspacer': {
            'height': MPNotif.THUMB_OFFSET + 'px'
        },
        '#thumbborder-wrapper': {
            'position': 'absolute',
            'top': (-MPNotif.THUMB_BORDER_SIZE) + 'px',
            'left': (MPNotif.NOTIF_WIDTH / 2 - MPNotif.THUMB_OFFSET - MPNotif.THUMB_BORDER_SIZE) + 'px',
            'width': thumb_total_size + 'px',
            'height': (thumb_total_size / 2) + 'px',
            'overflow': 'hidden'
        },
        '#thumbborder': {
            'position': 'absolute',
            'width': thumb_total_size + 'px',
            'height': thumb_total_size + 'px',
            'border-radius': thumb_total_size + 'px',
            'background-color': this.style_vals.bg_actions,
            'opacity': '0.5'
        },
        '#thumbnail': {
            'position': 'absolute',
            'top': '0px',
            'left': (MPNotif.NOTIF_WIDTH / 2 - MPNotif.THUMB_OFFSET) + 'px',
            'width': MPNotif.THUMB_IMG_SIZE + 'px',
            'height': MPNotif.THUMB_IMG_SIZE + 'px',
            'overflow': 'hidden',
            'z-index': '100',
            'border-radius': MPNotif.THUMB_IMG_SIZE + 'px'
        },
        '#mini': {
            'position': 'absolute',
            'right': '20px',
            'top': MPNotif.NOTIF_TOP + 'px',
            'width': this.notif_width + 'px',
            'height': MPNotif.NOTIF_HEIGHT_MINI * 2 + 'px',
            'margin-top': 20 - MPNotif.NOTIF_HEIGHT_MINI + 'px',
            'backface-visibility': 'hidden',
            'opacity': '0.0',
            'transform': 'rotateX(90deg)',
            'transition': 'opacity 0.3s, transform 0.3s, right 0.3s'
        },
        '#mini.visible': {
            'opacity': '1.0',
            'transform': 'rotateX(0deg)'
        },
        '#mini.exiting': {
            'opacity': '0.0',
            'right': '-150px'
        },
        '#mainbox': {
            'border-radius': '4px',
            'box-shadow': shadow,
            'text-align': 'center',
            'background-color': this.style_vals.bg,
            'font-size': '14px',
            'color': this.style_vals.text_main
        },
        '#mini #mainbox': {
            'height': MPNotif.NOTIF_HEIGHT_MINI + 'px',
            'margin-top': MPNotif.NOTIF_HEIGHT_MINI + 'px',
            'border-radius': '3px',
            'transition': 'background-color ' + anim_seconds
        },
        '#mini-border': {
            'height': (MPNotif.NOTIF_HEIGHT_MINI + 6) + 'px',
            'width': (MPNotif.NOTIF_WIDTH_MINI + 6) + 'px',
            'position': 'absolute',
            'top': '-3px',
            'left': '-3px',
            'margin-top': MPNotif.NOTIF_HEIGHT_MINI + 'px',
            'border-radius': '6px',
            'opacity': '0.25',
            'background-color': '#fff',
            'z-index': '-1',
            'box-shadow': mini_shadow
        },
        '#mini-icon': {
            'position': 'relative',
            'display': 'inline-block',
            'width': '75px',
            'height': MPNotif.NOTIF_HEIGHT_MINI + 'px',
            'border-radius': '3px 0 0 3px',
            'background-color': this.style_vals.bg_actions,
            'background': 'linear-gradient(135deg, ' + this.style_vals.bg_light + ' 0%, ' + this.style_vals.bg_actions + ' 100%)',
            'transition': 'background-color ' + anim_seconds
        },
        '#mini:hover #mini-icon': {
            'background-color': this.style_vals.mini_hover
        },
        '#mini:hover #mainbox': {
            'background-color': this.style_vals.mini_hover
        },
        '#mini-icon-img': {
            'position': 'absolute',
            'background-image': 'url(' + this.thumb_image_url + ')',
            'width': '48px',
            'height': '48px',
            'top': '20px',
            'left': '12px'
        },
        '#content': {
            'padding': '30px 20px 0px 20px'
        },
        '#mini-content': {
            'text-align': 'left',
            'height': MPNotif.NOTIF_HEIGHT_MINI + 'px',
            'cursor': 'pointer'
        },
        '#img': {
            'width': '328px',
            'margin-top': '30px',
            'border-radius': '5px'
        },
        '#title': {
            'max-height': '600px',
            'overflow': 'hidden',
            'word-wrap': 'break-word',
            'padding': '25px 0px 20px 0px',
            'font-size': '19px',
            'font-weight': 'bold',
            'color': this.style_vals.text_title
        },
        '#body': {
            'max-height': '600px',
            'margin-bottom': '25px',
            'overflow': 'hidden',
            'word-wrap': 'break-word',
            'line-height': '21px',
            'font-size': '15px',
            'font-weight': 'normal',
            'text-align': 'left'
        },
        '#mini #body': {
            'display': 'inline-block',
            'max-width': '250px',
            'margin': '0 0 0 30px',
            'height': MPNotif.NOTIF_HEIGHT_MINI + 'px',
            'font-size': '16px',
            'letter-spacing': '0.8px',
            'color': this.style_vals.text_title
        },
        '#mini #body-text': {
            'display': 'table',
            'height': MPNotif.NOTIF_HEIGHT_MINI + 'px'
        },
        '#mini #body-text div': {
            'display': 'table-cell',
            'vertical-align': 'middle'
        },
        '#tagline': {
            'margin-bottom': '15px',
            'font-size': '10px',
            'font-weight': '600',
            'letter-spacing': '0.8px',
            'color': '#ccd7e0',
            'text-align': 'left'
        },
        '#tagline a': {
            'color': this.style_vals.text_tagline,
            'transition': 'color ' + anim_seconds
        },
        '#tagline a:hover': {
            'color': this.style_vals.text_hover
        },
        '#cancel': {
            'position': 'absolute',
            'right': '0',
            'width': '8px',
            'height': '8px',
            'padding': '10px',
            'border-radius': '20px',
            'margin': '12px 12px 0 0',
            'box-sizing': 'content-box',
            'cursor': 'pointer',
            'transition': 'background-color ' + anim_seconds
        },
        '#mini #cancel': {
            'margin': '7px 7px 0 0'
        },
        '#cancel-icon': {
            'width': '8px',
            'height': '8px',
            'overflow': 'hidden',
            'background-image': 'url(//cdn.mxpnl.com/site_media/images/icons/notifications/cancel-x.png)',
            'opacity': this.style_vals.cancel_opacity
        },
        '#cancel:hover': {
            'background-color': this.style_vals.bg_hover
        },
        '#button': {
            'display': 'block',
            'height': '60px',
            'line-height': '60px',
            'text-align': 'center',
            'background-color': this.style_vals.bg_actions,
            'border-radius': '0 0 4px 4px',
            'overflow': 'hidden',
            'cursor': 'pointer',
            'transition': 'background-color ' + anim_seconds
        },
        '#button-close': {
            'display': 'inline-block',
            'width': '9px',
            'height': '60px',
            'margin-right': '8px',
            'vertical-align': 'top',
            'background-image': 'url(//cdn.mxpnl.com/site_media/images/icons/notifications/close-x-' + this.style + '.png)',
            'background-repeat': 'no-repeat',
            'background-position': '0px 25px'
        },
        '#button-play': {
            'display': 'inline-block',
            'width': '30px',
            'height': '60px',
            'margin-left': '15px',
            'background-image': 'url(//cdn.mxpnl.com/site_media/images/icons/notifications/play-' + this.style + '-small.png)',
            'background-repeat': 'no-repeat',
            'background-position': '0px 15px'
        },
        'a#button-link': {
            'display': 'inline-block',
            'vertical-align': 'top',
            'text-align': 'center',
            'font-size': '17px',
            'font-weight': 'bold',
            'overflow': 'hidden',
            'word-wrap': 'break-word',
            'color': this.style_vals.text_title,
            'transition': 'color ' + anim_seconds
        },
        '#button:hover': {
            'background-color': this.style_vals.bg_hover,
            'color': this.style_vals.text_hover
        },
        '#button:hover a': {
            'color': this.style_vals.text_hover
        },

        '#video-noflip': {
            'position': 'relative',
            'top': (-this.video_height * 2) + 'px'
        },
        '#video-flip': {
            'backface-visibility': 'hidden',
            'transform': 'rotateY(180deg)'
        },
        '#video': {
            'position': 'absolute',
            'width': (this.video_width - 1) + 'px',
            'height': this.video_height + 'px',
            'top': MPNotif.NOTIF_TOP + 'px',
            'margin-top': '100px',
            'left': '50%',
            'margin-left': Math.round(-this.video_width / 2) + 'px',
            'overflow': 'hidden',
            'border-radius': '5px',
            'box-shadow': video_shadow,
            'transform': 'translateZ(1px)', // webkit rendering bug http://stackoverflow.com/questions/18167981/clickable-link-area-unexpectedly-smaller-after-css-transform
            'transition': 'opacity ' + anim_seconds + ', top ' + anim_seconds
        },
        '#video.exiting': {
            'opacity': '0.0',
            'top': this.video_height + 'px'
        },
        '#video-holder': {
            'position': 'absolute',
            'width': (this.video_width - 1) + 'px',
            'height': this.video_height + 'px',
            'overflow': 'hidden',
            'border-radius': '5px'
        },
        '#video-frame': {
            'margin-left': '-1px',
            'width': this.video_width + 'px'
        },
        '#video-controls': {
            'opacity': '0',
            'transition': 'opacity 0.5s'
        },
        '#video:hover #video-controls': {
            'opacity': '1.0'
        },
        '#video .video-progress-el': {
            'position': 'absolute',
            'bottom': '0',
            'height': '25px',
            'border-radius': '0 0 0 5px'
        },
        '#video-progress': {
            'width': '90%'
        },
        '#video-progress-total': {
            'width': '100%',
            'background-color': this.style_vals.bg,
            'opacity': '0.7'
        },
        '#video-elapsed': {
            'width': '0',
            'background-color': '#6cb6f5',
            'opacity': '0.9'
        },
        '#video #video-time': {
            'width': '10%',
            'right': '0',
            'font-size': '11px',
            'line-height': '25px',
            'color': this.style_vals.text_main,
            'background-color': '#666',
            'border-radius': '0 0 5px 0'
        }
    };

    // IE hacks
    if (this._browser_lte('ie', 8)) {
        _.extend(notif_styles, {
            '* html #overlay': {
                'position': 'absolute'
            },
            '* html #bg': {
                'position': 'absolute'
            },
            'html, body': {
                'height': '100%'
            }
        });
    }
    if (this._browser_lte('ie', 7)) {
        _.extend(notif_styles, {
            '#mini #body': {
                'display': 'inline',
                'zoom': '1',
                'border': '1px solid ' + this.style_vals.bg_hover
            },
            '#mini #body-text': {
                'padding': '20px'
            },
            '#mini #mini-icon': {
                'display': 'none'
            }
        });
    }

    // add vendor-prefixed style rules
    var VENDOR_STYLES   = ['backface-visibility', 'border-radius', 'box-shadow', 'opacity',
                               'perspective', 'transform', 'transform-style', 'transition'],
        VENDOR_PREFIXES = ['khtml', 'moz', 'ms', 'o', 'webkit'];
    for (var selector in notif_styles) {
        for (var si = 0; si < VENDOR_STYLES.length; si++) {
            var prop = VENDOR_STYLES[si];
            if (prop in notif_styles[selector]) {
                var val = notif_styles[selector][prop];
                for (var pi = 0; pi < VENDOR_PREFIXES.length; pi++) {
                    notif_styles[selector]['-' + VENDOR_PREFIXES[pi] + '-' + prop] = val;
                }
            }
        }
    }

    var inject_styles = function(styles, media_queries) {
        var create_style_text = function(style_defs) {
            var st = '';
            for (var selector in style_defs) {
                var mp_selector = selector
                        .replace(/#/g, '#' + MPNotif.MARKUP_PREFIX + '-')
                        .replace(/\./g, '.' + MPNotif.MARKUP_PREFIX + '-');
                st += '\n' + mp_selector + ' {';
                var props = style_defs[selector];
                for (var k in props) {
                    st += k + ':' + props[k] + ';';
                }
                st += '}';
            }
            return st;
        };
        var create_media_query_text = function(mq_defs) {
            var mqt = '';
            for (var mq in mq_defs) {
                mqt += '\n' + mq + ' {' + create_style_text(mq_defs[mq]) + '\n}';
            }
            return mqt;
        };

        var style_text = create_style_text(styles) + create_media_query_text(media_queries),
            head_el = document$1.head || document$1.getElementsByTagName('head')[0] || document$1.documentElement,
            style_el = document$1.createElement('style');
        head_el.appendChild(style_el);
        style_el.setAttribute('type', 'text/css');
        if (style_el.styleSheet) { // IE
            style_el.styleSheet.cssText = style_text;
        } else {
            style_el.textContent = style_text;
        }
    };
    inject_styles(notif_styles, notif_media_queries);
};

MPNotif.prototype._init_video = _.safewrap(function() {
    if (!this.video_url) {
        return;
    }
    var self = this;

    // Youtube iframe API compatibility
    self.yt_custom = 'postMessage' in window$1;

    self.dest_url = self.video_url;
    var youtube_match = self.video_url.match(
                // http://stackoverflow.com/questions/2936467/parse-youtube-video-id-using-preg-match
                /(?:youtube(?:-nocookie)?\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i
            ),
        vimeo_match = self.video_url.match(
                /vimeo\.com\/.*?(\d+)/i
            );
    if (youtube_match) {
        self.show_video = true;
        self.youtube_video = youtube_match[1];

        if (self.yt_custom) {
            window$1['onYouTubeIframeAPIReady'] = function() {
                if (self._get_el('video-frame')) {
                    self._yt_video_ready();
                }
            };

            // load Youtube iframe API; see https://developers.google.com/youtube/iframe_api_reference
            var tag = document$1.createElement('script');
            tag.src = '//www.youtube.com/iframe_api';
            var firstScriptTag = document$1.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }
    } else if (vimeo_match) {
        self.show_video = true;
        self.vimeo_video = vimeo_match[1];
    }

    // IE <= 7, FF <= 3: fall through to video link rather than embedded player
    if (self._browser_lte('ie', 7) || self._browser_lte('firefox', 3)) {
        self.show_video = false;
        self.clickthrough = true;
    }
});

MPNotif.prototype._mark_as_shown = _.safewrap(function() {
    // click on background to dismiss
    var self = this;
    _.register_event(self._get_el('bg'), 'click', function() {
        self.dismiss();
    });

    var get_style = function(el, style_name) {
        var styles = {};
        if (document$1.defaultView && document$1.defaultView.getComputedStyle) {
            styles = document$1.defaultView.getComputedStyle(el, null); // FF3 requires both args
        } else if (el.currentStyle) { // IE
            styles = el.currentStyle;
        }
        return styles[style_name];
    };

    if (this.campaign_id) {
        var notif_el = this._get_el('overlay');
        if (notif_el && get_style(notif_el, 'visibility') !== 'hidden' && get_style(notif_el, 'display') !== 'none') {
            this._mark_delivery();
        }
    }
});

MPNotif.prototype._mark_delivery = _.safewrap(function(extra_props) {
    if (!this.marked_as_shown) {
        this.marked_as_shown = true;

        if (this.campaign_id) {
            // mark notification shown (local cache)
            this._get_shown_campaigns()[this.campaign_id] = 1 * new Date();
            this.persistence.save();
        }

        // track delivery
        this._track_event('$campaign_delivery', extra_props);

        // mark notification shown (mixpanel property)
        this.mixpanel['people']['append']({
            '$campaigns': this.campaign_id,
            '$notifications': {
                'campaign_id': this.campaign_id,
                'message_id':  this.message_id,
                'type':        'web',
                'time':        new Date()
            }
        });
    }
});

MPNotif.prototype._preload_images = function(all_loaded_cb) {
    var self = this;
    if (this.imgs_to_preload.length === 0) {
        all_loaded_cb();
        return;
    }

    var preloaded_imgs = 0;
    var img_objs = [];
    var onload = function() {
        preloaded_imgs++;
        if (preloaded_imgs === self.imgs_to_preload.length && all_loaded_cb) {
            all_loaded_cb();
            all_loaded_cb = null;
        }
    };
    for (var i = 0; i < this.imgs_to_preload.length; i++) {
        var img = new Image();
        img.onload = onload;
        img.src = this.imgs_to_preload[i];
        if (img.complete) {
            onload();
        }
        img_objs.push(img);
    }

    // IE6/7 doesn't fire onload reliably
    if (this._browser_lte('ie', 7)) {
        setTimeout(function() {
            var imgs_loaded = true;
            for (i = 0; i < img_objs.length; i++) {
                if (!img_objs[i].complete) {
                    imgs_loaded = false;
                }
            }
            if (imgs_loaded && all_loaded_cb) {
                all_loaded_cb();
                all_loaded_cb = null;
            }
        }, 500);
    }
};

MPNotif.prototype._remove_notification_el = _.safewrap(function() {
    window$1.clearInterval(this._video_progress_checker);
    this.notification_el.style.visibility = 'hidden';
    this.body_el.removeChild(this.notification_el);
});

MPNotif.prototype._set_client_config = function() {
    var get_browser_version = function(browser_ex) {
        var match = navigator.userAgent.match(browser_ex);
        return match && match[1];
    };
    this.browser_versions = {};
    this.browser_versions['chrome']  = get_browser_version(/Chrome\/(\d+)/);
    this.browser_versions['firefox'] = get_browser_version(/Firefox\/(\d+)/);
    this.browser_versions['ie']      = get_browser_version(/MSIE (\d+).+/);
    if (!this.browser_versions['ie'] && !(window$1.ActiveXObject) && 'ActiveXObject' in window$1) {
        this.browser_versions['ie'] = 11;
    }

    this.body_el = document$1.body || document$1.getElementsByTagName('body')[0];
    if (this.body_el) {
        this.doc_width = Math.max(
                this.body_el.scrollWidth, document$1.documentElement.scrollWidth,
                this.body_el.offsetWidth, document$1.documentElement.offsetWidth,
                this.body_el.clientWidth, document$1.documentElement.clientWidth
            );
        this.doc_height = Math.max(
                this.body_el.scrollHeight, document$1.documentElement.scrollHeight,
                this.body_el.offsetHeight, document$1.documentElement.offsetHeight,
                this.body_el.clientHeight, document$1.documentElement.clientHeight
            );
    }

    // detect CSS compatibility
    var ie_ver = this.browser_versions['ie'];
    var sample_styles = document$1.createElement('div').style,
        is_css_compatible = function(rule) {
            if (rule in sample_styles) {
                return true;
            }
            if (!ie_ver) {
                rule = rule[0].toUpperCase() + rule.slice(1);
                var props = ['O' + rule, 'Webkit' + rule, 'Moz' + rule];
                for (var i = 0; i < props.length; i++) {
                    if (props[i] in sample_styles) {
                        return true;
                    }
                }
            }
            return false;
        };
    this.use_transitions = this.body_el &&
        is_css_compatible('transition') &&
        is_css_compatible('transform');
    this.flip_animate = (this.browser_versions['chrome'] >= 33 || this.browser_versions['firefox'] >= 15) &&
        this.body_el &&
        is_css_compatible('backfaceVisibility') &&
        is_css_compatible('perspective') &&
        is_css_compatible('transform');
};

MPNotif.prototype._switch_to_video = _.safewrap(function() {
    var self = this,
        anims = [
            {
                el:    self._get_notification_display_el(),
                attr:  'opacity',
                start: 1.0,
                goal:  0.0
            },
            {
                el:    self._get_notification_display_el(),
                attr:  'top',
                start: MPNotif.NOTIF_TOP,
                goal:  -500
            },
            {
                el:    self._get_el('video-noflip'),
                attr:  'opacity',
                start: 0.0,
                goal:  1.0
            },
            {
                el:    self._get_el('video-noflip'),
                attr:  'top',
                start: -self.video_height * 2,
                goal:  0
            }
        ];

    if (self.mini) {
        var bg = self._get_el('bg'),
            overlay = self._get_el('overlay');
        bg.style.width = '100%';
        bg.style.height = '100%';
        overlay.style.width = '100%';

        self._add_class(self._get_notification_display_el(), 'exiting');
        self._add_class(bg, 'visible');

        anims.push({
            el:    self._get_el('bg'),
            attr:  'opacity',
            start: 0.0,
            goal:  MPNotif.BG_OPACITY
        });
    }

    var video_el = self._get_el('video-holder');
    video_el.innerHTML = self.video_iframe;

    var video_ready = function() {
        if (window$1['YT'] && window$1['YT']['loaded']) {
            self._yt_video_ready();
        }
        self.showing_video = true;
        self._get_notification_display_el().style.visibility = 'hidden';
    };
    if (self.flip_animate) {
        self._add_class('flipper', 'flipped');
        setTimeout(video_ready, MPNotif.ANIM_TIME);
    } else {
        self._animate_els(anims, MPNotif.ANIM_TIME, video_ready);
    }
});

MPNotif.prototype._track_event = function(event_name, properties, cb) {
    if (this.campaign_id) {
        properties = properties || {};
        properties = _.extend(properties, {
            'campaign_id':     this.campaign_id,
            'message_id':      this.message_id,
            'message_type':    'web_inapp',
            'message_subtype': this.notif_type
        });
        this.mixpanel['track'](event_name, properties, cb);
    } else if (cb) {
        cb.call();
    }
};

MPNotif.prototype._yt_video_ready = _.safewrap(function() {
    var self = this;
    if (self.video_inited) {
        return;
    }
    self.video_inited = true;

    var progress_bar  = self._get_el('video-elapsed'),
        progress_time = self._get_el('video-time'),
        progress_el   = self._get_el('video-progress');

    new window$1['YT']['Player'](MPNotif.MARKUP_PREFIX + '-video-frame', {
        'events': {
            'onReady': function(event) {
                var ytplayer = event['target'],
                    video_duration = ytplayer['getDuration'](),
                    pad = function(i) {
                        return ('00' + i).slice(-2);
                    },
                    update_video_time = function(current_time) {
                        var secs = Math.round(video_duration - current_time),
                            mins = Math.floor(secs / 60),
                            hours = Math.floor(mins / 60);
                        secs -= mins * 60;
                        mins -= hours * 60;
                        progress_time.innerHTML = '-' + (hours ? hours + ':' : '') + pad(mins) + ':' + pad(secs);
                    };
                update_video_time(0);
                self._video_progress_checker = window$1.setInterval(function() {
                    var current_time = ytplayer['getCurrentTime']();
                    progress_bar.style.width = (current_time / video_duration * 100) + '%';
                    update_video_time(current_time);
                }, 250);
                _.register_event(progress_el, 'click', function(e) {
                    var clickx = Math.max(0, e.pageX - progress_el.getBoundingClientRect().left);
                    ytplayer['seekTo'](video_duration * clickx / progress_el.clientWidth, true);
                });
            }
        }
    });
});

// EXPORTS (for closure compiler)

// MixpanelLib Exports
MixpanelLib.prototype['init']                            = MixpanelLib.prototype.init;
MixpanelLib.prototype['reset']                           = MixpanelLib.prototype.reset;
MixpanelLib.prototype['disable']                         = MixpanelLib.prototype.disable;
MixpanelLib.prototype['time_event']                      = MixpanelLib.prototype.time_event;
MixpanelLib.prototype['track']                           = MixpanelLib.prototype.track;
MixpanelLib.prototype['track_links']                     = MixpanelLib.prototype.track_links;
MixpanelLib.prototype['track_forms']                     = MixpanelLib.prototype.track_forms;
MixpanelLib.prototype['track_pageview']                  = MixpanelLib.prototype.track_pageview;
MixpanelLib.prototype['register']                        = MixpanelLib.prototype.register;
MixpanelLib.prototype['register_once']                   = MixpanelLib.prototype.register_once;
MixpanelLib.prototype['unregister']                      = MixpanelLib.prototype.unregister;
MixpanelLib.prototype['identify']                        = MixpanelLib.prototype.identify;
MixpanelLib.prototype['alias']                           = MixpanelLib.prototype.alias;
MixpanelLib.prototype['name_tag']                        = MixpanelLib.prototype.name_tag;
MixpanelLib.prototype['set_config']                      = MixpanelLib.prototype.set_config;
MixpanelLib.prototype['get_config']                      = MixpanelLib.prototype.get_config;
MixpanelLib.prototype['get_property']                    = MixpanelLib.prototype.get_property;
MixpanelLib.prototype['get_distinct_id']                 = MixpanelLib.prototype.get_distinct_id;
MixpanelLib.prototype['toString']                        = MixpanelLib.prototype.toString;
MixpanelLib.prototype['_check_and_handle_notifications'] = MixpanelLib.prototype._check_and_handle_notifications;
MixpanelLib.prototype['_show_notification']              = MixpanelLib.prototype._show_notification;
MixpanelLib.prototype['opt_out_tracking']                = MixpanelLib.prototype.opt_out_tracking;
MixpanelLib.prototype['opt_in_tracking']                 = MixpanelLib.prototype.opt_in_tracking;
MixpanelLib.prototype['has_opted_out_tracking']          = MixpanelLib.prototype.has_opted_out_tracking;
MixpanelLib.prototype['has_opted_in_tracking']           = MixpanelLib.prototype.has_opted_in_tracking;
MixpanelLib.prototype['clear_opt_in_out_tracking']       = MixpanelLib.prototype.clear_opt_in_out_tracking;

// MixpanelPersistence Exports
MixpanelPersistence.prototype['properties']            = MixpanelPersistence.prototype.properties;
MixpanelPersistence.prototype['update_search_keyword'] = MixpanelPersistence.prototype.update_search_keyword;
MixpanelPersistence.prototype['update_referrer_info']  = MixpanelPersistence.prototype.update_referrer_info;
MixpanelPersistence.prototype['get_cross_subdomain']   = MixpanelPersistence.prototype.get_cross_subdomain;
MixpanelPersistence.prototype['clear']                 = MixpanelPersistence.prototype.clear;

// MixpanelPeople Exports
MixpanelPeople.prototype['set']           = MixpanelPeople.prototype.set;
MixpanelPeople.prototype['set_once']      = MixpanelPeople.prototype.set_once;
MixpanelPeople.prototype['unset']         = MixpanelPeople.prototype.unset;
MixpanelPeople.prototype['increment']     = MixpanelPeople.prototype.increment;
MixpanelPeople.prototype['append']        = MixpanelPeople.prototype.append;
MixpanelPeople.prototype['union']         = MixpanelPeople.prototype.union;
MixpanelPeople.prototype['track_charge']  = MixpanelPeople.prototype.track_charge;
MixpanelPeople.prototype['clear_charges'] = MixpanelPeople.prototype.clear_charges;
MixpanelPeople.prototype['delete_user']   = MixpanelPeople.prototype.delete_user;
MixpanelPeople.prototype['toString']      = MixpanelPeople.prototype.toString;

_.safewrap_class(MixpanelLib, ['identify', '_check_and_handle_notifications', '_show_notification']);

var instances = {};
var extend_mp = function() {
    // add all the sub mixpanel instances
    _.each(instances, function(instance, name) {
        if (name !== PRIMARY_INSTANCE_NAME) { mixpanel_master[name] = instance; }
    });

    // add private functions as _
    mixpanel_master['_'] = _;
};

var override_mp_init_func = function() {
    // we override the snippets init function to handle the case where a
    // user initializes the mixpanel library after the script loads & runs
    mixpanel_master['init'] = function(token, config, name) {
        if (name) {
            // initialize a sub library
            if (!mixpanel_master[name]) {
                mixpanel_master[name] = instances[name] = create_mplib(token, config, name);
                mixpanel_master[name]._loaded();
            }
            return mixpanel_master[name];
        } else {
            var instance = mixpanel_master;

            if (instances[PRIMARY_INSTANCE_NAME]) {
                // main mixpanel lib already initialized
                instance = instances[PRIMARY_INSTANCE_NAME];
            } else if (token) {
                // intialize the main mixpanel lib
                instance = create_mplib(token, config, PRIMARY_INSTANCE_NAME);
                instance._loaded();
                instances[PRIMARY_INSTANCE_NAME] = instance;
            }

            mixpanel_master = instance;
            if (init_type === INIT_SNIPPET) {
                window$1[PRIMARY_INSTANCE_NAME] = mixpanel_master;
            }
            extend_mp();
        }
    };
};

var add_dom_loaded_handler = function() {
    // Cross browser DOM Loaded support
    function dom_loaded_handler() {
        // function flag since we only want to execute this once
        if (dom_loaded_handler.done) { return; }
        dom_loaded_handler.done = true;

        DOM_LOADED = true;
        ENQUEUE_REQUESTS = false;

        _.each(instances, function(inst) {
            inst._dom_loaded();
        });
    }

    function do_scroll_check() {
        try {
            document$1.documentElement.doScroll('left');
        } catch(e) {
            setTimeout(do_scroll_check, 1);
            return;
        }

        dom_loaded_handler();
    }

    if (document$1.addEventListener) {
        if (document$1.readyState === 'complete') {
            // safari 4 can fire the DOMContentLoaded event before loading all
            // external JS (including this file). you will see some copypasta
            // on the internet that checks for 'complete' and 'loaded', but
            // 'loaded' is an IE thing
            dom_loaded_handler();
        } else {
            document$1.addEventListener('DOMContentLoaded', dom_loaded_handler, false);
        }
    } else if (document$1.attachEvent) {
        // IE
        document$1.attachEvent('onreadystatechange', dom_loaded_handler);

        // check to make sure we arn't in a frame
        var toplevel = false;
        try {
            toplevel = window$1.frameElement === null;
        } catch(e) {
            // noop
        }

        if (document$1.documentElement.doScroll && toplevel) {
            do_scroll_check();
        }
    }

    // fallback handler, always will work
    _.register_event(window$1, 'load', dom_loaded_handler, true);
};

function init_as_module() {
    init_type = INIT_MODULE;
    mixpanel_master = new MixpanelLib();

    override_mp_init_func();
    mixpanel_master['init']();
    add_dom_loaded_handler();

    return mixpanel_master;
}

var mixpanel = init_as_module();

module.exports = mixpanel;
},{}],2:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var click_action_1 = __importDefault(require("./actions/click-action"));
var error_1 = __importDefault(require("./exceptions/error"));
var ActionFactory = /** @class */ (function () {
    function ActionFactory() {
    }
    ActionFactory.createAction = function (type, config) {
        // Check if the action is available
        if (ActionFactory.classDictionary[type] == undefined) {
            throw new error_1.default(type + ' is not available.');
        }
        else {
            // Create a action
            var action = Object.create(ActionFactory.classDictionary[type].prototype);
            action.constructor.apply(action, [config]);
            action = action;
            return action;
        }
    };
    ActionFactory.classDictionary = {
        'click': click_action_1.default
    };
    return ActionFactory;
}());
exports.default = ActionFactory;

},{"./actions/click-action":5,"./exceptions/error":14}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ActionHandlers = /** @class */ (function () {
    function ActionHandlers() {
        this.actions = [];
        var self = this;
        var callback = function () {
            if (self.timeout) {
                clearTimeout(self.timeout);
            }
            self.timeout = setTimeout(function () {
                console.log('[BitAnalytics] Content modified, refreshing trackers');
                self.refreshTrackers();
                self.timeout = undefined;
            }, 300);
        };
        if (MutationObserver) {
            var targetNode = document.getElementsByTagName('body');
            var config = { attributes: true, childList: true, subtree: true };
            // Create an observer instance linked to the callback function
            var observer = new MutationObserver(callback);
            // Start observing the target node for configured mutations
            observer.observe(targetNode[0], config);
        }
        else {
            window.addEventListener("DOMSubtreeModified", callback);
        }
    }
    /**
     *
     * Public methods
     *
     */
    ActionHandlers.prototype.refreshTrackers = function () {
        this.actions.map(function (action) {
            try {
                action.stopTracking();
            }
            catch (err) {
                console.log(err);
            }
            try {
                action.startTracking();
            }
            catch (err) {
                console.log(err);
            }
        });
    };
    ActionHandlers.prototype.trackAction = function (action) {
        this.actions.push(action);
    };
    return ActionHandlers;
}());
exports.default = ActionHandlers;

},{}],4:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var error_1 = __importDefault(require("./exceptions/error"));
var Action = /** @class */ (function () {
    function Action(config) {
        if (!config.name) {
            throw new error_1.default('Action should have a name config : { name : ... }');
        }
        this.name = config.name;
        this.isTracking = false;
    }
    return Action;
}());
exports.default = Action;

},{"./exceptions/error":14}],5:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var action_1 = __importDefault(require("../action"));
var log_event_handlers_1 = __importDefault(require("../log-event-handlers"));
var log_event_1 = __importDefault(require("../log-event"));
var error_1 = __importDefault(require("../exceptions/error"));
var ClickAction = /** @class */ (function (_super) {
    __extends(ClickAction, _super);
    function ClickAction(config) {
        var _this = _super.call(this, config) || this;
        _this.params = [];
        if (!config.class || !config.channels) {
            throw new error_1.default('ClickAction should have a config like this : { class : ..., channels: ... }');
        }
        if (config.params) {
            _this.params = config.params;
        }
        _this.class = config.class;
        _this.channels = config.channels;
        var self = _this;
        _this.listener = function (event) {
            var params = {};
            var target = _this.searchTarget(event.srcElement);
            // If I found my element, that should happen 100%
            if (target) {
                self.params.map(function (param) {
                    var value = target[param];
                    if (value) {
                        params[param] = value;
                    }
                    else {
                        var item = target.attributes.getNamedItem(param);
                        if (item) {
                            params[param] = item.value;
                        }
                    }
                });
            }
            var paramsArray = [params];
            self.channels.forEach(function (channel) {
                paramsArray.push({});
            });
            var logEvent = new log_event_1.default(self.name, paramsArray, self.channels);
            log_event_handlers_1.default.sharedInstance().postEvent(logEvent);
        };
        _this.isTracking = false;
        return _this;
    }
    /**
     *
     * Private methods
     *
     */
    ClickAction.prototype.searchTarget = function (element) {
        if (element && element.classList && element.classList.contains(this.class)) {
            return element;
        }
        else if (element.parentElement) {
            return this.searchTarget(element.parentElement);
        }
        else {
            return undefined;
        }
    };
    /**
     *
     * Public methods
     *
     */
    ClickAction.prototype.startTracking = function () {
        if (this.isTracking) {
            throw new error_1.default('Tracking already started.');
        }
        this.isTracking = true;
        var elements = document.getElementsByClassName(this.class);
        // Add event listener to all the elements found
        for (var i = 0; i < elements.length; i++) {
            var element = elements[i];
            element.addEventListener('click', this.listener);
        }
    };
    ClickAction.prototype.stopTracking = function () {
        if (!this.isTracking) {
            throw new error_1.default('Tracking already stopped.');
        }
        var elements = document.getElementsByClassName(this.class);
        // Add event listener to all the elements found
        for (var i = 0; i < elements.length; i++) {
            var element = elements[i];
            element.removeEventListener('click', this.listener);
        }
        this.isTracking = false;
    };
    return ClickAction;
}(action_1.default));
exports.default = ClickAction;

},{"../action":4,"../exceptions/error":14,"../log-event":21,"../log-event-handlers":20}],6:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var log_event_handlers_1 = __importDefault(require("./log-event-handlers"));
var log_event_1 = __importDefault(require("./log-event"));
var action_factory_1 = __importDefault(require("./action-factory"));
var adjust_channel_1 = __importDefault(require("./channels/adjust-channel"));
var mixpanel_channel_1 = __importDefault(require("./channels/mixpanel-channel"));
var action_handlers_1 = __importDefault(require("./action-handlers"));
var channels;
(function (channels) {
    channels.AdjustChannel = adjust_channel_1.default;
    channels.MixpanelChannel = mixpanel_channel_1.default;
})(channels = exports.channels || (exports.channels = {}));
var BitAnalytics = /** @class */ (function () {
    function BitAnalytics() {
    }
    BitAnalytics.initialize = function (os, appVersion, channelConfigs) {
        if (window == undefined) {
            console.error('[BitAnalytics] BitAnalytics cannot be integrated in window.');
        }
        BitAnalytics.LogEventHandlers = new log_event_handlers_1.default(os, appVersion, channelConfigs);
        BitAnalytics.ActionHandlers = new action_handlers_1.default();
        BitAnalytics.LogEvent = log_event_1.default;
        BitAnalytics.ActionFactory = action_factory_1.default;
    };
    BitAnalytics.main = function () {
        if (window) {
            window.BitAnalytics = BitAnalytics;
        }
    };
    /**
     * @param name - The name of the event.
     * @param channelParams - The parameters to send to the channels.
     *   Params in the common object are added to all channels.
     *   {
     *     common: {
     *       a: 'b',
     *     },
     *     ga: {w
     *       c: 'd'
     *     },
     *     leanplum {
     *       e: 'f'
     *     }
     *   }
     */
    BitAnalytics.postEvent = function (name, channelParams) {
        var event = log_event_1.default.fromDictionary(name, channelParams);
        log_event_handlers_1.default.sharedInstance().postEvent(event);
    };
    /**
     *
     * @param {string} actionType - e.g. 'click'
     * @param {string} eventName - The name of the event sent to the analytics channel, e.g. 'link_click_out'.
     * @param {string} targetElementsClassName - The class name of the elements to listen for the action, e.g. 'track_link_click_out'
     * @param {string[]} attributes - Attributes from the element to include with the event, e.g. ['href', 'id', 'outerText'],
     * @param {string[]} channelNames - The channels to send the event to, e.g. ['firebase', 'adjust', 'ga', 'leanplum']
     */
    BitAnalytics.trackAction = function (actionType, eventName, targetElementsClassName, attributes, channelNames) {
        var action = action_factory_1.default.createAction(actionType, {
            name: eventName,
            class: targetElementsClassName,
            params: attributes,
            channels: channelNames
        });
        this.ActionHandlers.trackAction(action);
    };
    return BitAnalytics;
}());
exports.default = BitAnalytics;
BitAnalytics.main();

},{"./action-factory":2,"./action-handlers":3,"./channels/adjust-channel":9,"./channels/mixpanel-channel":13,"./log-event":21,"./log-event-handlers":20}],7:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var adjust_channel_1 = __importDefault(require("./channels/adjust-channel"));
var firebase_channel_1 = __importDefault(require("./channels/firebase-channel"));
var ga_channel_1 = __importDefault(require("./channels/ga-channel"));
var leanplum_channel_1 = __importDefault(require("./channels/leanplum-channel"));
var error_1 = __importDefault(require("./exceptions/error"));
var ChannelFactory = /** @class */ (function () {
    function ChannelFactory() {
    }
    ChannelFactory.createChannel = function (name, config) {
        // Check if the channel is available
        if (ChannelFactory.classDictionary[name] == undefined) {
            throw new error_1.default(name + ' is not available.');
        }
        else {
            // Create a channel
            var channel = Object.create(ChannelFactory.classDictionary[name].prototype);
            channel.constructor.apply(channel, [name, config]);
            channel = channel;
            return channel;
        }
    };
    ChannelFactory.classDictionary = {
        'adjust': adjust_channel_1.default,
        'firebase': firebase_channel_1.default,
        'ga': ga_channel_1.default,
        'leanplum': leanplum_channel_1.default
    };
    return ChannelFactory;
}());
exports.default = ChannelFactory;

},{"./channels/adjust-channel":9,"./channels/firebase-channel":10,"./channels/ga-channel":11,"./channels/leanplum-channel":12,"./exceptions/error":14}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Channel = /** @class */ (function () {
    function Channel(name) {
        this.isReady = false;
        this.queue = new Array();
        this.name = name;
    }
    /**
     *
     * Protected methods
     *
     */
    Channel.prototype.flush = function () {
        this.queue.forEach(function (f) {
            f();
        });
        this.queue = new Array();
    };
    Channel.prototype.enqueue = function (f) {
        this.queue.push(f);
    };
    return Channel;
}());
exports.default = Channel;

},{}],9:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var channel_1 = __importDefault(require("../channel"));
var error_1 = __importDefault(require("../exceptions/error"));
var id_manager_1 = __importDefault(require("../id-manager"));
// Loading Adjust websdk
require('../external-libs/adjust');
var AdjustChannel = /** @class */ (function (_super) {
    __extends(AdjustChannel, _super);
    function AdjustChannel(name, config) {
        var _this = _super.call(this, name) || this;
        if (!config.token) {
            throw new error_1.default('Adjust config is missing token.');
        }
        if (!config.eventTypes) {
            throw new error_1.default('Adjust config is missing event types.');
        }
        if (!Adjust) {
            throw new error_1.default('Adjust cordova plugin is not installed correctly.');
        }
        _this.eventTypes = config.eventTypes;
        var os = _this.adjustedOs(config.os);
        _this.advertisingId = id_manager_1.default.shared.getAdId(os);
        // TODO: Different initialisation for Cordova.
        var sessionParams = {
            app_version: config.appVersion,
            app_version_short: config.appVersion,
            os_name: os
        };
        _this.addAdvertisingId(os, sessionParams);
        var environment = config.environment || 'production';
        _this.adjustInstance = new Adjust(config.token, environment, os);
        _this.adjustInstance.trackSession(sessionParams);
        _this.isReady = true;
        return _this;
    }
    /**
     *
     * Public methods
     *
     */
    AdjustChannel.prototype.postEvent = function (name, params) {
        if (this.isReady) {
            var eventType = this.eventTypes[name];
            // Each event needs to be added on adjust, and config for adjust.
            if (!eventType) {
                throw new error_1.default('This event name does not exist on Adjust.');
            }
            // Don't want adjust-specfic changes to affect the passed-in params.
            var adjustParams_1 = {};
            var keys = Object.keys(params);
            keys.forEach(function (key) {
                adjustParams_1[key] = params[key];
            });
            adjustParams_1.os = this.adjustedOs(adjustParams_1.os);
            this.addAdvertisingId(adjustParams_1.os, adjustParams_1);
            this.adjustInstance.trackEvent(eventType, adjustParams_1);
        }
    };
    AdjustChannel.prototype.setUserAttributes = function (attributes) { };
    AdjustChannel.prototype.setVariables = function (variables) { };
    AdjustChannel.prototype.getVariables = function () { };
    /**
     *
     * Private methods
     *
     */
    AdjustChannel.prototype.addAdvertisingId = function (os, params) {
        if (os === 'ios') {
            params.idfa = this.advertisingId;
        }
        else if (os === 'android') {
            params.gps_adid = this.advertisingId;
        }
        else {
            params.win_hwid = this.advertisingId;
            params.win_naid = this.advertisingId;
            params.win_adid = this.advertisingId;
        }
    };
    // Desktop version will pretend to be Windows
    AdjustChannel.prototype.adjustedOs = function (os) {
        if (os === 'ios' || os === 'android') {
            return os;
        }
        else {
            return 'wstore';
        }
    };
    return AdjustChannel;
}(channel_1.default));
exports.default = AdjustChannel;

},{"../channel":8,"../exceptions/error":14,"../external-libs/adjust":15,"../id-manager":19}],10:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var channel_1 = __importDefault(require("../channel"));
var error_1 = __importDefault(require("../exceptions/error"));
var FirebaseChannel = /** @class */ (function (_super) {
    __extends(FirebaseChannel, _super);
    function FirebaseChannel(name, config) {
        var _this = _super.call(this, name) || this;
        /**
         * Firebase available only on ios and android
         */
        if (config.os != 'android' && config.os != 'ios') {
            throw new error_1.default('Firebase is not supported on ' + config.os);
        }
        if (!window.FirebasePlugin) {
            throw new error_1.default('Firebase cordova plugin is not installed correctly.');
        }
        _this.firebaseInstance = window.FirebasePlugin;
        _this.isReady = true;
        return _this;
    }
    /**
     *
     * Public methods
     *
     */
    FirebaseChannel.prototype.postEvent = function (name, params) {
        var _this = this;
        var sanitizedParams = this.sanitizeParams(params);
        if (!this.isReady) {
            this.enqueue(function () { _this.postEvent(name, sanitizedParams); });
        }
        else {
            this.firebaseInstance.logEvent(name, sanitizedParams);
        }
    };
    FirebaseChannel.prototype.setUserAttributes = function (attributes) { };
    FirebaseChannel.prototype.setVariables = function (variables) { };
    FirebaseChannel.prototype.getVariables = function () { };
    /**
     *
     * Private methods
     *
     */
    // [Firebase/Analytics][I-ACS013002] Event parameter name must contain only letters, numbers, or underscores
    FirebaseChannel.prototype.sanitizeParams = function (params) {
        var keys = Object.keys(params);
        var keysLength = keys.length;
        var sanitized = {};
        keys.map(function (key) {
            var cleanKey = key.replace('-', '_').replace(/[\W]+/g, '');
            sanitized[cleanKey] = params[key];
        });
        return sanitized;
    };
    return FirebaseChannel;
}(channel_1.default));
exports.default = FirebaseChannel;

},{"../channel":8,"../exceptions/error":14}],11:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var channel_1 = __importDefault(require("../channel"));
var ga_1 = __importDefault(require("../external-libs/ga"));
var error_1 = __importDefault(require("../exceptions/error"));
var GoogleAnalyticsChannel = /** @class */ (function (_super) {
    __extends(GoogleAnalyticsChannel, _super);
    function GoogleAnalyticsChannel(name, config) {
        var _this = _super.call(this, name) || this;
        _this.gaInstance = null;
        _this.eventLabels = ['id'];
        if (!config.trackingId) {
            throw new error_1.default('Google Analytics config is missing tracking ID.');
        }
        if (config.eventLabels) {
            _this.eventLabels = config.eventLabels;
        }
        _this.gaInstance = new ga_1.default({
            trackID: config.trackingId,
            appVersion: config.appVersion,
            appName: config.appName || 'App'
        });
        _this.isReady = true;
        return _this;
    }
    /**
     *
     * Public methods
     *
     */
    GoogleAnalyticsChannel.prototype.postEvent = function (name, params) {
        if (this.isReady) {
            var category = params.eventCategory || name;
            var action = params.eventAction || name;
            var label = params.eventLabel || name;
            var value = params.value || '';
            for (var _i = 0, _a = this.eventLabels; _i < _a.length; _i++) {
                var eventLabel = _a[_i];
                if (params[eventLabel]) {
                    label = params[eventLabel];
                    break;
                }
            }
            this.gaInstance.event(category, action, label, value);
        }
    };
    GoogleAnalyticsChannel.prototype.setUserAttributes = function (attributes) { };
    GoogleAnalyticsChannel.prototype.setVariables = function (variables) { };
    GoogleAnalyticsChannel.prototype.getVariables = function () { };
    return GoogleAnalyticsChannel;
}(channel_1.default));
exports.default = GoogleAnalyticsChannel;

},{"../channel":8,"../exceptions/error":14,"../external-libs/ga":16}],12:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var channel_1 = __importDefault(require("../channel"));
var leanplum_min_js_1 = __importDefault(require("../external-libs/leanplum.min.js"));
var id_manager_1 = __importDefault(require("../id-manager"));
var LeanplumChannel = /** @class */ (function (_super) {
    __extends(LeanplumChannel, _super);
    function LeanplumChannel(name, config) {
        var _this = _super.call(this, name) || this;
        if (!config.appId) {
            throw new Error('[BitAnalytics] Leanplum config is missing app ID.');
        }
        if (!config.key) {
            throw new Error('[BitAnalytics] Leanplum config is missing key.');
        }
        if (config.key.indexOf('prod_') === 0) {
            leanplum_min_js_1.default.setAppIdForProductionMode(config.appId, config.key);
        }
        else {
            leanplum_min_js_1.default.setAppIdForDevelopmentMode(config.appId, config.key);
        }
        leanplum_min_js_1.default.setAppVersion(config.appVersion);
        leanplum_min_js_1.default.setSystemName(config.os);
        _this.userId = id_manager_1.default.shared.getAdId(config.os);
        if (config.variables) {
            leanplum_min_js_1.default.setVariables(config.variables);
        }
        leanplum_min_js_1.default.start(_this.userId, function (success) {
            console.log('[BitAnalytics] Leanplum start() returned with success: "' + success + '"');
            console.log('[BitAnalytics] Leanplum variables: ', leanplum_min_js_1.default.getVariables());
            //console.log('[BitAnalytics] Leanplum variables', Leanplum.getVariables());
            if (success) {
                _this.isReady = true;
                _this.flush();
            }
            else {
                console.error('[BitAnalytics] Leanplum failed to start.');
            }
        });
        return _this;
    }
    /**
     *
     * Public methods
     *
     */
    LeanplumChannel.prototype.postEvent = function (name, params) {
        var _this = this;
        if (this.isReady) {
            var eventValue = params.value;
            if (eventValue) {
                console.log('Tracking Leanplum event with value: ' + eventValue.toFixed(2));
                leanplum_min_js_1.default.track(name, eventValue, params);
            }
            else {
                leanplum_min_js_1.default.track(name, params);
            }
        }
        else {
            this.enqueue(function () { _this.postEvent(name, params); });
        }
    };
    LeanplumChannel.prototype.getVariables = function () {
        return leanplum_min_js_1.default.getVariables();
    };
    LeanplumChannel.prototype.setVariables = function (variables) {
        leanplum_min_js_1.default.setVariables(variables);
        if (this.isReady) {
            leanplum_min_js_1.default.startFromCache(this.userId);
        }
    };
    LeanplumChannel.prototype.setUserAttributes = function (attributes) {
        // Get the channel names by the keys
        var attributeNames = Object.keys(attributes);
        // Iterate to init the several channels given in the config
        attributeNames.forEach(function (attributeName) {
            var attribute = attributes[attributeName];
            if (attributeName === 'email') {
                leanplum_min_js_1.default.setEmail(attribute);
            }
            else if (attributeName === 'deviceId') {
                leanplum_min_js_1.default.setDeviceId(attribute);
            }
            else if (attributeName === 'deviceName') {
                leanplum_min_js_1.default.setDeviceName(attribute);
            }
            else if (attributeName === 'deviceModel') {
                leanplum_min_js_1.default.setDeviceModel(attribute);
            }
            else if (attributeName === 'systemName') {
                leanplum_min_js_1.default.setSystemName(attribute);
            }
            else if (attributeName === 'systemVersion') {
                leanplum_min_js_1.default.setSystemVersion(attribute);
            }
        });
        leanplum_min_js_1.default.setUserAttributes(attributes);
    };
    return LeanplumChannel;
}(channel_1.default));
exports.default = LeanplumChannel;

},{"../channel":8,"../external-libs/leanplum.min.js":17,"../id-manager":19}],13:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var channel_1 = __importDefault(require("../channel"));
var error_1 = __importDefault(require("../exceptions/error"));
var mixpanel = require('mixpanel-browser');
var MixpanelChannel = /** @class */ (function (_super) {
    __extends(MixpanelChannel, _super);
    function MixpanelChannel(name, config) {
        var _this = _super.call(this, name) || this;
        if (!config.token) {
            throw new error_1.default('Config incorrect.');
        }
        _this.mixpanelInstance = mixpanel;
        mixpanel.init(config.token, config.config);
        return _this;
    }
    /**
     *
     * Public methods
     *
     */
    MixpanelChannel.prototype.postEvent = function (name, params) {
        var result = this.mixpanelInstance.track(name);
    };
    MixpanelChannel.prototype.setUserAttributes = function (attributes) { };
    MixpanelChannel.prototype.setVariables = function (variables) { };
    MixpanelChannel.prototype.getVariables = function () { };
    return MixpanelChannel;
}(channel_1.default));
exports.default = MixpanelChannel;

},{"../channel":8,"../exceptions/error":14,"mixpanel-browser":1}],14:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var BAError = /** @class */ (function (_super) {
    __extends(BAError, _super);
    function BAError(message) {
        return _super.call(this, '[BitAnalytics] ' + message) || this;
    }
    return BAError;
}(Error));
exports.default = BAError;

},{}],15:[function(require,module,exports){
"use strict";
(function (window) {
    var sendRequest = function (method, url, data, success_cb, error_cb) {
        var req = new XMLHttpRequest();
        req.open(method, url, !0);
        req.setRequestHeader("Client-SDK", "js4.0.0");
        req.onreadystatechange = function () { if (req.readyState == 4) {
            if (req.status >= 200 && req.status < 400) {
                !!success_cb && success_cb(req.responseText);
            }
            else if (!!error_cb) {
                !!error_cb && error_cb(new Error("Server responded with HTTP " + req.status), xhr);
            }
        } };
        if (!!error_cb) {
            req.onerror = error_cb;
        }
        req.send(data);
    };
    var encodeQueryString = function (params) {
        var pairs = [];
        for (var k in params) {
            if (!params.hasOwnProperty(k)) {
                continue;
            }
            pairs.push(encodeURIComponent(k) + "=" + encodeURIComponent(params[k]));
        }
        return pairs.join("&");
    };
    var cloneObj = function (obj) {
        var copy = {};
        if (typeof (obj) != "object" || !obj) {
            return copy;
        }
        for (var k in obj) {
            if (!obj.hasOwnProperty(k)) {
                continue;
            }
            copy[k] = obj[k];
        }
        return copy;
    };
    if (!'withCredentials' in new XMLHttpRequest()) {
        sendRequest = function () { };
    }
    window.Adjust = function (app_token, environment, os_name) { this.trackSession = function (device_ids) { var params = cloneObj(device_ids); params.app_token = app_token; params.os_name = os_name; params.environment = environment; sendRequest("GET", "https://app.adjust.com/session?" + encodeQueryString(params)); }; this.trackEvent = function (event_token, device_ids) { var params = cloneObj(device_ids); params.app_token = app_token; params.event_token = event_token; params.os_name = os_name; params.environment = environment; sendRequest("GET", "https://app.adjust.com/event?" + encodeQueryString(params)); }; };
})(window);

},{}],16:[function(require,module,exports){
"use strict";
/*
 * name: nwjs-analytics -Node-Webkit Google Analytics integration
 * version: 1.0.2
 * github: https://github.com/Daaru00/nwjs-analytics
 */
function GA(opt) {
    this.apiVersion = opt.apiVersion || '1';
    this.trackID = opt.trackID || 'UA-XXXXXXXX-X';
    this.clientID = opt.clientID || null;
    this.userID = opt.userID || null;
    this.appName = opt.appName || 'App';
    this.appVersion = opt.appVersion || '1.0.0';
    this.debug = opt.debug || false;
    this.performanceTracking = opt.performanceTracking || true;
    this.errorTracking = opt.errorTracking || true;
    this.userLanguage = opt.userLanguage || "en";
    this.currency = opt.currency || "EUR";
    this.lastScreenName = opt.lastScreenName || '';
}
GA.prototype.sendRequest = function (data, callback) {
    var ga = this;
    if (!this.clientID || this.clientID == null)
        this.clientID = this.generateClientID();
    if (!this.userID || this.userID == null)
        this.userID = this.generateClientID();
    var postData = "v=" + this.apiVersion
        + "&an=" + this.appName
        + "&av=" + this.appVersion
        + "&tid=" + this.trackID
        + "&cid=" + this.clientID
        + "&sr=" + this.getScreenResolution()
        + "&vp=" + this.getViewportSize();
    Object.keys(data).forEach(function (key) {
        var val = data[key];
        if (typeof val != "undefined")
            postData += "&" + key + "=" + val;
    });
    var http = new XMLHttpRequest();
    var url = "https://www.google-analytics.com";
    if (!this.debug)
        url += "/collect";
    else
        url += "/debug/collect";
    http.open("GET", url + "?" + postData, true);
    http.onreadystatechange = function () {
        if (ga.debug)
            console.log(http.response);
        if (http.readyState == 4 && http.status == 200) {
            if (callback)
                callback(true);
        }
        else {
            if (callback)
                callback(false);
        }
    };
    http.send();
};
GA.prototype.generateClientID = function () {
    var id = "";
    var possibilities = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 5; i++)
        id += possibilities.charAt(Math.floor(Math.random() * possibilities.length));
    return id;
};
GA.prototype.getScreenResolution = function () {
    return screen.width + "x" + screen.height;
};
GA.prototype.getColorDept = function () {
    return screen.colorDepth + "-bits";
};
GA.prototype.getUserAgent = function () {
    return navigator.userAgent;
};
GA.prototype.getViewportSize = function () {
    return window.screen.availWidth + "x" + window.screen.availHeight;
};
/*
 * Measurement Protocol
 * [https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide]
 */
GA.prototype.screenView = function (screename) {
    var data = {
        't': 'screenview',
        'cd': screename
    };
    this.sendRequest(data);
    this.lastScreenName = screename;
};
GA.prototype.event = function (category, action, label, value) {
    var data = {
        't': 'event',
        'ec': category,
        'ea': action,
    };
    if (label) {
        data['el'] = label;
    }
    if (value) {
        data['ev'] = value;
    }
    if (this.lastScreenName) {
        data['cd'] = this.lastScreenName;
    }
    this.sendRequest(data);
};
GA.prototype.exception = function (msg, fatal) {
    var data = {
        't': 'exception',
        'exd': msg,
        'exf': fatal || 0
    };
    this.sendRequest(data);
};
GA.prototype.timing = function (category, variable, time, label) {
    var data = {
        't': 'timing',
        'utc': category,
        'utv': variable,
        'utt': time,
        'utl': label,
    };
    this.sendRequest(data);
},
    GA.prototype.ecommerce = {
        transactionID: false,
        generateTransactionID: function () {
            var id = "";
            var possibilities = "0123456789";
            for (var i = 0; i < 5; i++)
                id += possibilities.charAt(Math.floor(Math.random() * possibilities.length));
            return id;
        },
        transaction: function (total, items) {
            var t_id = "";
            if (!this.ecommerce.transactionID)
                t_id = this.ecommerce.generateTransactionID();
            else
                t_id = this.ecommerce.transactionID;
            var data = {
                't': 'transaction',
                'ti': t_id,
                'tr': total,
                'cu': this.currency,
            };
            this.sendRequest(data);
            items.forEach(function (item) {
                var data = {
                    't': 'item',
                    'ti': t_id,
                    'in': item.name,
                    'ip': item.price,
                    'iq': item.qty,
                    'ic': item.id,
                    'cu': this.currency
                };
                this.sendRequest(data);
            });
        }
    },
    GA.prototype.custom = function (data) {
        this.sendRequest(data);
    };
module.exports = GA;

},{}],17:[function(require,module,exports){
"use strict";
!function (a, b) { "object" == typeof exports && "object" == typeof module ? module.exports = b() : "function" == typeof define && define.amd ? define([], b) : "object" == typeof exports ? exports.Leanplum = b() : a.Leanplum = b(); }(this, function () {
    return function (a) { function b(d) { if (c[d])
        return c[d].exports; var e = c[d] = { i: d, l: !1, exports: {} }; return a[d].call(e.exports, e, e.exports, b), e.l = !0, e.exports; } var c = {}; return b.m = a, b.c = c, b.i = function (a) { return a; }, b.d = function (a, c, d) { b.o(a, c) || Object.defineProperty(a, c, { configurable: !1, enumerable: !0, get: d }); }, b.n = function (a) { var c = a && a.__esModule ? function () { return a.default; } : function () { return a; }; return b.d(c, "a", c), c; }, b.o = function (a, b) { return Object.prototype.hasOwnProperty.call(a, b); }, b.p = "", b(b.s = 33); }([function (a, b, c) { var d = c(20), e = "object" == typeof self && self && self.Object === Object && self, f = d || e || Function("return this")(); a.exports = f; }, function (a, b, c) { var d, e, f; !function (c, g) { e = [a, b], d = g, void 0 !== (f = "function" == typeof d ? d.apply(b, e) : d) && (a.exports = f); }(0, function (a, b) {
            "use strict";
            Object.defineProperty(b, "__esModule", { value: !0 }), b.default = { METHODS: { START: "start", STOP: "stop", ADVANCE: "advance", TRACK: "track", PAUSE_SESSION: "pauseSession", RESUME_SESSION: "resumeSession", PAUSE_STATE: "pauseState", RESUME_STATE: "resumeState", DOWNLOAD_FILE: "downloadFile", MULTI: "multi", SET_VARS: "setVars", GET_VARS: "getVars", SET_USER_ATTRIBUTES: "setUserAttributes", SET_DEVICE_ATTRIBUTES: "setDeviceAttributes", UPLOAD_FILE: "uploadFile", REGISTER_DEVICE: "registerDevice" }, SDK_VERSION: "1.3.0", CLIENT: "js", PARAMS: { ACTION: "action", APP_ID: "appId", CLIENT: "client", CLIENT_KEY: "clientKey", DEVICE_ID: "deviceId", SDK_VERSION: "sdkVersion", USER_ID: "userId", NEW_USER_ID: "newUserId", DEV_MODE: "devMode", VERSION_NAME: "versionName", SYSTEM_NAME: "systemName", SYSTEM_VERSION: "systemVersion", BROWSER_NAME: "browserName", BROWSER_VERSION: "browserVersion", DEVICE_NAME: "deviceName", DEVICE_MODEL: "deviceModel", USER_ATTRIBUTES: "userAttributes", LOCALE: "locale", COUNTRY: "country", REGION: "region", CITY: "city", LOCATION: "location", STATE: "state", INFO: "info", EVENT: "event", VALUE: "value", FILENAME: "filename", TIME: "time", DATA: "data", VARS: "vars", FILE: "file", SIZE: "size", VARIATION: "variation", HASH: "hash", EMAIL: "email", VARIABLES: "vars", PARAMS: "params", INCLUDE_DEFAULTS: "includeDefaults", INCLUDE_VARIANT_DEBUG_INFO: "includeVariantDebugInfo", WEB_PUSH_SUBSCRIPTION: "webPushSubscription" }, KEYS: { IS_REGISTERED: "isRegistered", LATEST_VERSION: "latestVersion", VARS: "vars", VARIANTS: "variants", VARIANT_DEBUG_INFO: "variantDebugInfo", ACTION_METADATA: "actionMetadata", TOKEN: "token" }, DEFAULT_KEYS: { COUNT: "__leanplum_unsynced", ITEM: "__leanplum_unsynced_", VARIABLES: "__leanplum_variables", VARIANTS: "__leanplum_variants", VARIANT_DEBUG_INFO: "__leanplum_variant_debug_info", ACTION_METADATA: "__leanplum_action_metadata", TOKEN: "__leanplum_token", DEVICE_ID: "__leanplum_device_id", USER_ID: "__leanplum_user_id", PUSH_SUBSCRIPTION: "__leanplum_push_subscription" }, VALUES: { DETECT: "(detect)" } }, a.exports = b.default;
        }); }, function (a, b, c) { function d(a, b) { var c = f(a, b); return e(c) ? c : void 0; } var e = c(51), f = c(64); a.exports = d; }, function (a, b, c) { var d, e, f; !function (g, h) { e = [a, b, c(1)], d = h, void 0 !== (f = "function" == typeof d ? d.apply(b, e) : d) && (a.exports = f); }(0, function (a, b, c) {
            "use strict";
            function d(a, b) { if (!(a instanceof b))
                throw new TypeError("Cannot call a class as a function"); }
            Object.defineProperty(b, "__esModule", { value: !0 });
            var e = function (a) { return a && a.__esModule ? a : { default: a }; }(c), f = function () { function a(a, b) { for (var c = 0; c < b.length; c++) {
                var d = b[c];
                d.enumerable = d.enumerable || !1, d.configurable = !0, "value" in d && (d.writable = !0), Object.defineProperty(a, d.key, d);
            } } return function (b, c, d) { return c && a(b.prototype, c), d && a(b, d), b; }; }(), g = function () { function a() { d(this, a), this.argString = "", this.argValues = {}; } return f(a, [{ key: "add", value: function (a, b) { if (void 0 === b)
                        return this; this.argString && (this.argString += "&"); var c = encodeURIComponent(b); return this.argString += a + "=" + c, this.argValues[a] = b, this; } }, { key: "body", value: function (a) { return a ? (this._body = a, this) : this._body; } }, { key: "attachApiKeys", value: function (a, b) { return this.add(e.default.PARAMS.APP_ID, a).add(e.default.PARAMS.CLIENT, e.default.CLIENT).add(e.default.PARAMS.CLIENT_KEY, b); } }, { key: "build", value: function () { return this.argString; } }, { key: "buildDict", value: function () { return this.argValues; } }]), a; }();
            b.default = g, a.exports = b.default;
        }); }, function (a, b, c) { var d, e, f; !function (g, h) { e = [a, b, c(1), c(3), c(12), c(17), c(5)], d = h, void 0 !== (f = "function" == typeof d ? d.apply(b, e) : d) && (a.exports = f); }(0, function (a, b, c, d, e, f, g) {
            "use strict";
            function h(a) { return a && a.__esModule ? a : { default: a }; }
            function i(a, b) { if (!(a instanceof b))
                throw new TypeError("Cannot call a class as a function"); }
            Object.defineProperty(b, "__esModule", { value: !0 });
            var j = h(c), k = h(d), l = h(e), m = h(f), n = h(g), o = function () { function a(a, b) { for (var c = 0; c < b.length; c++) {
                var d = b[c];
                d.enumerable = d.enumerable || !1, d.configurable = !0, "value" in d && (d.writable = !0), Object.defineProperty(a, d.key, d);
            } } return function (b, c, d) { return c && a(b.prototype, c), d && a(b, d), b; }; }(), p = void 0, q = null, r = function () { function a() { i(this, a); } return o(a, null, [{ key: "request", value: function (b, c, d) { if (d = d || {}, c = c || new k.default, a.deviceId || (a.deviceId = n.default.getFromLocalStorage(j.default.DEFAULT_KEYS.DEVICE_ID)), !a.deviceId) {
                        for (var e = "", f = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", g = 0; g < 16; g++)
                            e += f.charAt(Math.floor(Math.random() * f.length));
                        a.deviceId = e, n.default.saveToLocalStorage(j.default.DEFAULT_KEYS.DEVICE_ID, e);
                    } a.userId || (a.userId = n.default.getFromLocalStorage(j.default.DEFAULT_KEYS.USER_ID), a.userId || (a.userId = a.deviceId)), n.default.saveToLocalStorage(j.default.DEFAULT_KEYS.USER_ID, a.userId); var h = c.attachApiKeys(a.appId, a.clientKey).add(j.default.PARAMS.SDK_VERSION, j.default.SDK_VERSION).add(j.default.PARAMS.DEVICE_ID, a.deviceId).add(j.default.PARAMS.USER_ID, a.userId).add(j.default.PARAMS.ACTION, b).add(j.default.PARAMS.VERSION_NAME, a.versionName).add(j.default.PARAMS.DEV_MODE, l.default.devMode).add(j.default.PARAMS.TIME, ((new Date).getTime() / 1e3).toString()), i = d.success || d.response, o = d.error || d.response; if (!a.appId || !a.clientKey) {
                        var r = "Leanplum App ID and client key are not set. Make sure you are calling setAppIdForDevelopmentMode or setAppIdForProductionMode before issuing API calls.";
                        return console.error(r), void (o && o(r));
                    } if (c.body())
                        return void m.default.ajax("POST", a.apiPath + "?" + h.build(), c.body(), i, o, d.queued); var s = l.default.devMode || d.sendNow || !a.batchEnabled, t = function () { var b = a.popUnsentRequests(); if (b.length > 0) {
                        var c = JSON.stringify({ data: b }), e = (new k.default).attachApiKeys(a.appId, a.clientKey).add(j.default.PARAMS.SDK_VERSION, j.default.SDK_VERSION).add(j.default.PARAMS.ACTION, j.default.METHODS.MULTI).add(j.default.PARAMS.TIME, ((new Date).getTime() / 1e3).toString().toString()).build();
                        m.default.ajax("POST", a.apiPath + "?" + e, c, i, o, d.queued);
                    } }; if (!s && a.batchCooldown) {
                        var u = (new Date).getTime() / 1e3;
                        !p || u - p >= a.batchCooldown ? (s = !0, p = u) : q || (q = setTimeout(function () { q = null, p = (new Date).getTime() / 1e3, t(); }, 1e3 * (a.batchCooldown - (u - p))));
                    } a.saveRequestForLater(h.buildDict()), s && t(); } }, { key: "setNetworkTimeout", value: function (a) { m.default.setNetworkTimeout(a); } }, { key: "saveRequestForLater", value: function (a) { var b = n.default.getFromLocalStorage(j.default.DEFAULT_KEYS.COUNT) || 0, c = j.default.DEFAULT_KEYS.ITEM + b; n.default.saveToLocalStorage(c, JSON.stringify(a)), b++, n.default.saveToLocalStorage(j.default.DEFAULT_KEYS.COUNT, b); } }, { key: "popUnsentRequests", value: function () { var a = [], b = n.default.getFromLocalStorage(j.default.DEFAULT_KEYS.COUNT) || 0; n.default.removeFromLocalStorage(j.default.DEFAULT_KEYS.COUNT); for (var c = 0; c < b; c++) {
                        var d = j.default.DEFAULT_KEYS.ITEM + c;
                        try {
                            var e = JSON.parse(n.default.getFromLocalStorage(d));
                            a.push(e);
                        }
                        catch (a) { }
                        n.default.removeFromLocalStorage(d);
                    } return a; } }, { key: "numResponses", value: function (a) { return a && a.response ? a.response.length : 0; } }, { key: "getResponseAt", value: function (a, b) { return a && a.response ? a.response[b] : null; } }, { key: "getLastResponse", value: function (b) { var c = a.numResponses(b); return c > 0 ? a.getResponseAt(b, c - 1) : null; } }, { key: "isResponseSuccess", value: function (a) { return !!a && !!a.success; } }, { key: "getResponseError", value: function (a) { if (!a)
                        return null; var b = a.error; return b ? b.message : null; } }]), a; }();
            r.apiPath = "https://www.leanplum.com/api", r.batchEnabled = !0, r.batchCooldown = 5, b.default = r, a.exports = b.default;
        }); }, function (a, b, c) { var d, e, f; !function (c, g) { e = [a, b], d = g, void 0 !== (f = "function" == typeof d ? d.apply(b, e) : d) && (a.exports = f); }(0, function (a, b) {
            "use strict";
            function c(a, b) { if (!(a instanceof b))
                throw new TypeError("Cannot call a class as a function"); }
            Object.defineProperty(b, "__esModule", { value: !0 });
            var d = function () { function a(a, b) { for (var c = 0; c < b.length; c++) {
                var d = b[c];
                d.enumerable = d.enumerable || !1, d.configurable = !0, "value" in d && (d.writable = !0), Object.defineProperty(a, d.key, d);
            } } return function (b, c, d) { return c && a(b.prototype, c), d && a(b, d), b; }; }(), e = void 0, f = {}, g = function () { function a() { c(this, a); } return d(a, null, [{ key: "getFromLocalStorage", value: function (a) { return !1 === e ? f[a] : localStorage[a]; } }, { key: "saveToLocalStorage", value: function (a, b) { if (!1 === e)
                        return void (f[a] = b); try {
                        localStorage[a] = b;
                    }
                    catch (c) {
                        e = !1, f[a] = b;
                    } } }, { key: "removeFromLocalStorage", value: function (a) { if (!1 === e)
                        return void delete f[a]; try {
                        localStorage.removeItem(a);
                    }
                    catch (b) {
                        e = !1, delete f[a];
                    } } }]), a; }();
            b.default = g, a.exports = b.default;
        }); }, function (a, b, c) { function d(a) { var b = -1, c = null == a ? 0 : a.length; for (this.clear(); ++b < c;) {
            var d = a[b];
            this.set(d[0], d[1]);
        } } var e = c(74), f = c(75), g = c(76), h = c(77), i = c(78); d.prototype.clear = e, d.prototype.delete = f, d.prototype.get = g, d.prototype.has = h, d.prototype.set = i, a.exports = d; }, function (a, b, c) { function d(a, b) { for (var c = a.length; c--;)
            if (e(a[c][0], b))
                return c; return -1; } var e = c(22); a.exports = d; }, function (a, b, c) { function d(a) { return null == a ? void 0 === a ? i : h : j && j in Object(a) ? f(a) : g(a); } var e = c(14), f = c(61), g = c(87), h = "[object Null]", i = "[object Undefined]", j = e ? e.toStringTag : void 0; a.exports = d; }, function (a, b, c) { function d(a, b) { var c = a.__data__; return e(b) ? c["string" == typeof b ? "string" : "hash"] : c.map; } var e = c(71); a.exports = d; }, function (a, b, c) { var d = c(2), e = d(Object, "create"); a.exports = e; }, function (a, b) { function c(a) { return null != a && "object" == typeof a; } a.exports = c; }, function (a, b, c) { var d, e, f; !function (c, g) { e = [a, b], d = g, void 0 !== (f = "function" == typeof d ? d.apply(b, e) : d) && (a.exports = f); }(0, function (a, b) {
            "use strict";
            function c(a, b) { if (!(a instanceof b))
                throw new TypeError("Cannot call a class as a function"); }
            Object.defineProperty(b, "__esModule", { value: !0 });
            var d = function () { function a(a, b) { for (var c = 0; c < b.length; c++) {
                var d = b[c];
                d.enumerable = d.enumerable || !1, d.configurable = !0, "value" in d && (d.writable = !0), Object.defineProperty(a, d.key, d);
            } } return function (b, c, d) { return c && a(b.prototype, c), d && a(b, d), b; }; }(), e = function () { function a() { c(this, a); } return d(a, null, [{ key: "addStartResponseHandler", value: function (b) { a.startHandlers.push(b), a.hasStarted && b(a.startSuccessful); } }, { key: "removeStartResponseHandler", value: function (b) { var c = a.startHandlers.indexOf(b); c >= 0 && a.startHandlers.splice(c, 1); } }, { key: "triggerStartHandlers", value: function () { for (var b = 0; b < a.startHandlers.length; b++)
                        a.startHandlers[b](a.startSuccessful); } }, { key: "addVariablesChangedHandler", value: function (b) { a.variablesChangedHandlers.push(b), a.hasReceivedDiffs && b(); } }, { key: "removeVariablesChangedHandler", value: function (b) { var c = a.variablesChangedHandlers.indexOf(b); c >= 0 && a.variablesChangedHandlers.splice(c, 1); } }, { key: "triggerVariablesChangedHandlers", value: function () { for (var b = 0; b < a.variablesChangedHandlers.length; b++)
                        a.variablesChangedHandlers[b](); } }, { key: "setVariantDebugInfoEnabled", value: function (b) { a.variantDebugInfoEnabled = b; } }]), a; }();
            e.devMode = !1, e.variablesChangedHandlers = [], e.hasReceivedDiffs = !1, e.startHandlers = [], e.hasStarted = !1, e.startSuccessful = !1, e.variantDebugInfoEnabled = !1, b.default = e, a.exports = b.default;
        }); }, function (a, b, c) { var d = c(2), e = c(0), f = d(e, "Map"); a.exports = f; }, function (a, b, c) { var d = c(0), e = d.Symbol; a.exports = e; }, function (a, b) { var c = Array.isArray; a.exports = c; }, function (a, b, c) { var d, e, f; !function (g, h) { e = [a, b, c(1), c(12), c(3), c(5), c(4)], d = h, void 0 !== (f = "function" == typeof d ? d.apply(b, e) : d) && (a.exports = f); }(0, function (a, b, c, d, e, f, g) {
            "use strict";
            function h(a) { return a && a.__esModule ? a : { default: a }; }
            function i(a, b) { if (!(a instanceof b))
                throw new TypeError("Cannot call a class as a function"); }
            Object.defineProperty(b, "__esModule", { value: !0 });
            var j = h(c), k = h(d), l = h(e), m = h(f), n = h(g), o = function () { function a(a, b) { for (var c = 0; c < b.length; c++) {
                var d = b[c];
                d.enumerable = d.enumerable || !1, d.configurable = !0, "value" in d && (d.writable = !0), Object.defineProperty(a, d.key, d);
            } } return function (b, c, d) { return c && a(b.prototype, c), d && a(b, d), b; }; }(), p = function () { function a() { i(this, a); } return o(a, null, [{ key: "applyDiffs", value: function (b, c, d) { a.diffs = b, a.variants = c, a.actionMetadata = d, k.default.hasReceivedDiffs = !0, a.merged = a.mergeHelper(a.variables, b), a.saveDiffs(), a.onUpdate && a.onUpdate(); } }, { key: "loadDiffs", value: function () { try {
                        a.applyDiffs(JSON.parse(m.default.getFromLocalStorage(j.default.DEFAULT_KEYS.VARIABLES) || null), JSON.parse(m.default.getFromLocalStorage(j.default.DEFAULT_KEYS.VARIANTS) || null), JSON.parse(m.default.getFromLocalStorage(j.default.DEFAULT_KEYS.ACTION_METADATA) || null)), a.token = m.default.getFromLocalStorage(j.default.DEFAULT_KEYS.TOKEN), a.variantDebugInfo = m.default.getFromLocalStorage(j.default.DEFAULT_KEYS.VARIANT_DEBUG_INFO);
                    }
                    catch (a) {
                        console.log("Leanplum: Invalid diffs: " + a);
                    } } }, { key: "saveDiffs", value: function () { m.default.saveToLocalStorage(j.default.DEFAULT_KEYS.VARIABLES, JSON.stringify(a.diffs || {})), m.default.saveToLocalStorage(j.default.DEFAULT_KEYS.VARIANTS, JSON.stringify(a.variants || [])), m.default.saveToLocalStorage(j.default.DEFAULT_KEYS.ACTION_METADATA, JSON.stringify(a.actionMetadata || {})), m.default.saveToLocalStorage(j.default.DEFAULT_KEYS.VARIANT_DEBUG_INFO, JSON.stringify(a.variantDebugInfo || {})), m.default.saveToLocalStorage(j.default.DEFAULT_KEYS.TOKEN, a.token); } }, { key: "setVariables", value: function (b) { a.variables = b; } }, { key: "getVariables", value: function () { return void 0 !== a.merged ? a.merged : a.variables; } }, { key: "getVariantDebugInfo", value: function () { return a.variantDebugInfo; } }, { key: "sendVariables", value: function () { var b = {}; b[j.default.PARAMS.VARIABLES] = a.variables, n.default.request(j.default.METHODS.SET_VARS, (new l.default).body(JSON.stringify(b)), { sendNow: !0 }); } }, { key: "mergeHelper", value: function (b, c) { if ("number" == typeof c || "boolean" == typeof c || "string" == typeof c)
                        return c; if (null === c || void 0 === c)
                        return b; var d = function (a) { return function (b) { if (a instanceof Array)
                        for (var c = 0; c < a.length; c++)
                            b(a[c]);
                    else
                        for (var d in a)
                            ({}).hasOwnProperty.call(a, d) && b(d); }; }, e = d(b), f = d(c), g = !1; if (null === b && !(c instanceof Array)) {
                        g = null;
                        for (var h in c)
                            if (c.hasOwnProperty(h)) {
                                if (null === g && (g = !0), "string" != typeof h) {
                                    g = !1;
                                    break;
                                }
                                if (h.length < 3 || "[" !== h.charAt(0) || "]" !== h.charAt(h.length - 1)) {
                                    g = !1;
                                    break;
                                }
                                var i = h.substring(1, h.length - 1);
                                if (!parseInt(i).toString() === i) {
                                    g = !1;
                                    break;
                                }
                            }
                    } if (b instanceof Array || g) {
                        var j = [];
                        return e(function (a) { j.push(a); }), f(function (b) { for (var d = parseInt(b.substring(1, b.length - 1)), e = c[b]; d >= j.length;)
                            j.push(null); j[d] = a.mergeHelper(j[d], e); }), j;
                    } var k = {}; return e(function (a) { null !== c[a] && void 0 !== c[a] || (k[a] = b[a]); }), f(function (d) { k[d] = a.mergeHelper(null !== b ? b[d] : null, c[d]); }), k; } }]), a; }();
            p.diffs = void 0, p.variables = null, p.variants = [], p.variantDebugInfo = {}, p.merged = void 0, p.onUpdate = void 0, p.token = "", p.actionMetadata = {}, b.default = p, a.exports = b.default;
        }); }, function (a, b, c) { var d, e, f; !function (c, g) { e = [a, b], d = g, void 0 !== (f = "function" == typeof d ? d.apply(b, e) : d) && (a.exports = f); }(0, function (a, b) {
            "use strict";
            function c(a, b) { if (!(a instanceof b))
                throw new TypeError("Cannot call a class as a function"); }
            Object.defineProperty(b, "__esModule", { value: !0 });
            var d = function () { function a(a, b) { for (var c = 0; c < b.length; c++) {
                var d = b[c];
                d.enumerable = d.enumerable || !1, d.configurable = !0, "value" in d && (d.writable = !0), Object.defineProperty(a, d.key, d);
            } } return function (b, c, d) { return c && a(b.prototype, c), d && a(b, d), b; }; }(), e = [], f = 10, g = function () { function a() { c(this, a); } return d(a, null, [{ key: "setNetworkTimeout", value: function (a) { f = a; } }, { key: "ajax", value: function (b, c, d, e, g, h, i) { if (h) {
                        if (a.runningRequest)
                            return a.enqueueRequest(arguments);
                        a.runningRequest = !0;
                    } if ("undefined" != typeof XDomainRequest)
                        return "http:" === location.protocol && 0 === c.indexOf("https:") && (c = "http:" + c.substring(6)), Reflect.apply(a.ajaxIE8, null, arguments); var j = !1, k = new XMLHttpRequest; k.onreadystatechange = function () { if (4 === k.readyState) {
                        if (j)
                            return;
                        j = !0;
                        var b = void 0, c = !1;
                        if (i)
                            b = k.responseText;
                        else
                            try {
                                b = JSON.parse(k.responseText);
                            }
                            catch (a) {
                                setTimeout(function () { g && g(null, k); }, 0), c = !0;
                            }
                        c || (k.status >= 200 && k.status < 300 ? setTimeout(function () { e && e(b, k); }, 0) : setTimeout(function () { g && g(b, k); }, 0)), h && (a.runningRequest = !1, a.dequeueRequest());
                    } }, k.open(b, c, !0), k.setRequestHeader("Content-Type", "text/plain"), k.send(d), setTimeout(function () { j || k.abort(); }, 1e3 * f); } }, { key: "ajaxIE8", value: function (b, c, d, e, g, h, i) { var j = new XDomainRequest; j.onload = function () { var b = void 0, c = !1; if (i)
                        b = j.responseText;
                    else
                        try {
                            b = JSON.parse(j.responseText);
                        }
                        catch (a) {
                            setTimeout(function () { g && g(null, j); }, 0), c = !0;
                        } c || setTimeout(function () { e && e(b, j); }, 0), h && (a.runningRequest = !1, a.dequeueRequest()); }, j.onerror = j.ontimeout = function () { setTimeout(function () { g && g(null, j); }, 0), h && (a.runningRequest = !1, a.dequeueRequest()); }, j.onprogress = function () { }, j.open(b, c), j.timeout = 1e3 * f, j.send(d); } }, { key: "enqueueRequest", value: function (a) { e.push(a); } }, { key: "dequeueRequest", value: function () { var b = e.shift(); b && Reflect.apply(a.ajax, null, b); } }]), a; }();
            b.default = g, a.exports = b.default;
        }); }, function (a, b, c) { function d(a) { var b = -1, c = null == a ? 0 : a.length; for (this.clear(); ++b < c;) {
            var d = a[b];
            this.set(d[0], d[1]);
        } } var e = c(79), f = c(80), g = c(81), h = c(82), i = c(83); d.prototype.clear = e, d.prototype.delete = f, d.prototype.get = g, d.prototype.has = h, d.prototype.set = i, a.exports = d; }, function (a, b, c) { function d(a, b, c, d, j, k) { var l = c & h, m = a.length, n = b.length; if (m != n && !(l && n > m))
            return !1; var o = k.get(a); if (o && k.get(b))
            return o == b; var p = -1, q = !0, r = c & i ? new e : void 0; for (k.set(a, b), k.set(b, a); ++p < m;) {
            var s = a[p], t = b[p];
            if (d)
                var u = l ? d(t, s, p, b, a, k) : d(s, t, p, a, b, k);
            if (void 0 !== u) {
                if (u)
                    continue;
                q = !1;
                break;
            }
            if (r) {
                if (!f(b, function (a, b) { if (!g(r, b) && (s === a || j(s, a, c, d, k)))
                    return r.push(b); })) {
                    q = !1;
                    break;
                }
            }
            else if (s !== t && !j(s, t, c, d, k)) {
                q = !1;
                break;
            }
        } return k.delete(a), k.delete(b), q; } var e = c(39), f = c(46), g = c(56), h = 1, i = 2; a.exports = d; }, function (a, b, c) { (function (b) { var c = "object" == typeof b && b && b.Object === Object && b; a.exports = c; }).call(b, c(102)); }, function (a, b) { function c(a) { if (null != a) {
            try {
                return e.call(a);
            }
            catch (a) { }
            try {
                return a + "";
            }
            catch (a) { }
        } return ""; } var d = Function.prototype, e = d.toString; a.exports = c; }, function (a, b) { function c(a, b) { return a === b || a !== a && b !== b; } a.exports = c; }, function (a, b, c) { (function (a) { var d = c(0), e = c(101), f = "object" == typeof b && b && !b.nodeType && b, g = f && "object" == typeof a && a && !a.nodeType && a, h = g && g.exports === f, i = h ? d.Buffer : void 0, j = i ? i.isBuffer : void 0, k = j || e; a.exports = k; }).call(b, c(29)(a)); }, function (a, b, c) { function d(a, b) { return e(a, b); } var e = c(49); a.exports = d; }, function (a, b, c) { function d(a) { if (!f(a))
            return !1; var b = e(a); return b == h || b == i || b == g || b == j; } var e = c(8), f = c(27), g = "[object AsyncFunction]", h = "[object Function]", i = "[object GeneratorFunction]", j = "[object Proxy]"; a.exports = d; }, function (a, b) { function c(a) { return "number" == typeof a && a > -1 && a % 1 == 0 && a <= d; } var d = 9007199254740991; a.exports = c; }, function (a, b) { function c(a) { var b = typeof a; return null != a && ("object" == b || "function" == b); } a.exports = c; }, function (a, b, c) { var d = c(52), e = c(55), f = c(86), g = f && f.isTypedArray, h = g ? e(g) : d; a.exports = h; }, function (a, b) { a.exports = function (a) { return a.webpackPolyfill || (a.deprecate = function () { }, a.paths = [], a.children || (a.children = []), Object.defineProperty(a, "loaded", { enumerable: !0, get: function () { return a.l; } }), Object.defineProperty(a, "id", { enumerable: !0, get: function () { return a.i; } }), a.webpackPolyfill = 1), a; }; }, function (a, b, c) { var d, e, f; !function (c, g) { e = [a, b], d = g, void 0 !== (f = "function" == typeof d ? d.apply(b, e) : d) && (a.exports = f); }(0, function (a, b) {
            "use strict";
            function c(a, b) { if (!(a instanceof b))
                throw new TypeError("Cannot call a class as a function"); }
            Object.defineProperty(b, "__esModule", { value: !0 });
            var d = function () { function a(a, b) { for (var c = 0; c < b.length; c++) {
                var d = b[c];
                d.enumerable = d.enumerable || !1, d.configurable = !0, "value" in d && (d.writable = !0), Object.defineProperty(a, d.key, d);
            } } return function (b, c, d) { return c && a(b.prototype, c), d && a(b, d), b; }; }(), e = [{ string: navigator.userAgent, subString: "Chrome", identity: "Chrome" }, { string: navigator.userAgent, subString: "OmniWeb", versionSearch: "OmniWeb/", identity: "OmniWeb" }, { string: navigator.vendor, subString: "Apple", identity: "Safari", versionSearch: "Version" }, { prop: window.opera, identity: "Opera", versionSearch: "Version" }, { string: navigator.vendor, subString: "iCab", identity: "iCab" }, { string: navigator.vendor, subString: "KDE", identity: "Konqueror" }, { string: navigator.userAgent, subString: "Firefox", identity: "Firefox" }, { string: navigator.vendor, subString: "Camino", identity: "Camino" }, { string: navigator.userAgent, subString: "Netscape", identity: "Netscape" }, { string: navigator.userAgent, subString: "MSIE", identity: "Explorer", versionSearch: "MSIE" }, { string: navigator.userAgent, subString: "Gecko", identity: "Mozilla", versionSearch: "rv" }, { string: navigator.userAgent, subString: "Mozilla", identity: "Netscape", versionSearch: "Mozilla" }], f = [{ string: navigator.platform, subString: "Win", identity: "Windows" }, { string: navigator.platform, subString: "Mac", identity: "Mac OS" }, { string: navigator.userAgent, subString: "iPhone", identity: "iOS" }, { string: navigator.platform, subString: "Linux", identity: "Linux" }], g = function () { function a() { c(this, a), this.browser = this._searchString(e) || "Unknown Browser", this.version = this._searchVersion(navigator.userAgent) || this._searchVersion(navigator.appVersion) || "Unknown Version", this.OS = this._searchString(f) || "Unknown OS"; } return d(a, [{ key: "_searchString", value: function (a) { for (var b = 0; b < a.length; b++) {
                        var c = a[b].string, d = a[b].prop;
                        if (this.versionSearchString = a[b].versionSearch || a[b].identity, c) {
                            if (-1 !== c.indexOf(a[b].subString))
                                return a[b].identity;
                        }
                        else if (d)
                            return a[b].identity;
                    } } }, { key: "_searchVersion", value: function (a) { if (!a)
                        return -1; var b = a.indexOf(this.versionSearchString); return -1 === b ? -1 : parseFloat(a.substring(b + this.versionSearchString.length + 1)); } }]), a; }();
            b.default = g, a.exports = b.default;
        }); }, function (a, b, c) { var d, e, f; !function (g, h) { e = [a, b, c(1), c(3), c(34), c(16), c(4), c(24)], d = h, void 0 !== (f = "function" == typeof d ? d.apply(b, e) : d) && (a.exports = f); }(0, function (a, b, c, d, e, f, g, h) {
            "use strict";
            function i(a) { return a && a.__esModule ? a : { default: a }; }
            function j(a, b) { if (!(a instanceof b))
                throw new TypeError("Cannot call a class as a function"); }
            Object.defineProperty(b, "__esModule", { value: !0 });
            var k = i(c), l = i(d), m = i(e), n = i(f), o = i(g), p = i(h), q = function () { function a(a, b) { for (var c = 0; c < b.length; c++) {
                var d = b[c];
                d.enumerable = d.enumerable || !1, d.configurable = !0, "value" in d && (d.writable = !0), Object.defineProperty(a, d.key, d);
            } } return function (b, c, d) { return c && a(b.prototype, c), d && a(b, d), b; }; }(), r = function () { function a() { j(this, a); } return q(a, null, [{ key: "connect", value: function () { if (!WebSocket)
                        return void console.log("Your browser doesn't support WebSockets."); var b = new m.default, c = !1; b.onopen = function () { if (!c) {
                        console.log("Leanplum: Connected to development server.");
                        var a = {};
                        a[k.default.PARAMS.APP_ID] = o.default.appId, a[k.default.PARAMS.DEVICE_ID] = o.default.deviceId, b.send("auth", a), c = !0;
                    } }, b.onerror = function (a) { console.log("Leanplum: Socket error", a); }, b.onmessage = function (a, c) { "updateVars" === a ? o.default.request(k.default.METHODS.GET_VARS, (new l.default).add(k.default.PARAMS.INCLUDE_DEFAULTS, !1), { queued: !1, sendNow: !0, response: function (a) { var b = o.default.getLastResponse(a), c = b[k.default.KEYS.VARS], d = b[k.default.KEYS.VARIANTS], e = b[k.default.KEYS.ACTION_METADATA]; (0, p.default)(c, n.default.diffs) || n.default.applyDiffs(c, d, e); } }) : "getVariables" === a ? (n.default.sendVariables(), b.send("getContentResponse", { updated: !0 })) : "getActions" === a ? b.send("getContentResponse", { updated: !1 }) : "registerDevice" === a && alert("Your device has been registered to " + c[0].email + "."); }, b.onclose = function () { console.log("Leanplum: Disconnected to development server."), c = !1; }, b.connect(a.socketHost), setInterval(function () { b.connected || b.connecting || b.connect(a.socketHost); }, 5e3); } }]), a; }();
            r.socketHost = "dev.leanplum.com", b.default = r, a.exports = b.default;
        }); }, function (a, b, c) { var d, e, f; !function (g, h) { e = [a, b, c(1), c(3), c(24), c(5), c(4)], d = h, void 0 !== (f = "function" == typeof d ? d.apply(b, e) : d) && (a.exports = f); }(0, function (a, b, c, d, e, f, g) {
            "use strict";
            function h(a) { return a && a.__esModule ? a : { default: a }; }
            function i(a, b) { if (!(a instanceof b))
                throw new TypeError("Cannot call a class as a function"); }
            Object.defineProperty(b, "__esModule", { value: !0 });
            var j = h(c), k = h(d), l = h(e), m = h(f), n = h(g), o = function () { function a(a, b) { for (var c = 0; c < b.length; c++) {
                var d = b[c];
                d.enumerable = d.enumerable || !1, d.configurable = !0, "value" in d && (d.writable = !0), Object.defineProperty(a, d.key, d);
            } } return function (b, c, d) { return c && a(b.prototype, c), d && a(b, d), b; }; }(), p = !1, q = null, r = function () { function a() { i(this, a); } return o(a, null, [{ key: "isWebPushSupported", value: function () { return navigator && navigator.serviceWorker && "serviceWorker" in navigator && "PushManager" in window; } }, { key: "isWebPushSubscribed", value: function () { return a.isWebPushSupported() ? a.getServiceWorkerRegistration().then(function (b) { return new Promise(function (c) { b ? b.pushManager.getSubscription().then(function (b) { p = null !== b, p && a.updateNewSubscriptionOnServer(b), c(p); }) : c(!1); }); }) : new Promise(function (a) { a(!1); }); } }, { key: "register", value: function (b, c) { if (!a.isWebPushSupported())
                        return console.log("Leanplum: Push messaging is not supported."), c(!1); navigator.serviceWorker.register(b || "/sw.min.js", null).then(function (b) { q = b, q.pushManager.getSubscription().then(function (b) { if (p = !(null === b), p && a.updateNewSubscriptionOnServer(b), c)
                        return c(p); }); }).catch(function (a) { console.log("Leanplum: Service Worker Error: ", a); }); } }, { key: "subscribeUser", value: function () { var b = a.urlB64ToUint8Array("BInWPpWntfR39rgXSP04pqdmEdDGa50z6zqbMvxyxJCwzXIuSpSh8C888-CfJ82WELl7Xe8cjAnfCt-3vK0Ci68"); return new Promise(function (c, d) { return q.pushManager.subscribe({ userVisibleOnly: !0, applicationServerKey: b }).then(function (b) { return b ? (a.updateNewSubscriptionOnServer(b), p = !0, c(p)) : (p = !1, d()); }).catch(function (a) { return d("Leanplum: Failed to subscribe the user: " + a); }); }); } }, { key: "unsubscribeUser", value: function () { return new Promise(function (b, c) { a.isWebPushSubscribed().then(function (a) { if (!a)
                        return b(); q.pushManager.getSubscription().then(function (a) { return a ? a.unsubscribe() : c(); }).catch(function (a) { c("Leanplum: Error unsubscribing: " + a); }).then(function (a) { return a ? (p = !1, b()) : c(); }); }, function (a) { return c(); }); }); } }, { key: "getServiceWorkerRegistration", value: function () { return new Promise(function (a) { q ? a(q) : navigator.serviceWorker.getRegistration().then(function (b) { q = b, a(b); }); }); } }, { key: "urlB64ToUint8Array", value: function (a) { for (var b = "=".repeat((4 - a.length % 4) % 4), c = (a + b).replace(/-/g, "+").replace(/_/g, "/"), d = window.atob(c), e = new Uint8Array(d.length), f = 0; f < d.length; ++f)
                        e[f] = d.charCodeAt(f); return e; } }, { key: "prepareSubscription", value: function (a) { var b = a.getKey ? a.getKey("p256dh") : "", c = a.getKey ? a.getKey("auth") : "", d = btoa(Reflect.apply(String.fromCharCode, null, new Uint8Array(b))), e = btoa(Reflect.apply(String.fromCharCode, null, new Uint8Array(c))); return { endpoint: a.endpoint, key: d, auth: e }; } }, { key: "updateNewSubscriptionOnServer", value: function (b) { if (b) {
                        var c = a.prepareSubscription(b), d = JSON.stringify(c), e = m.default.getFromLocalStorage(j.default.DEFAULT_KEYS.PUSH_SUBSCRIPTION);
                        (0, l.default)(e, d) || (m.default.saveToLocalStorage(j.default.DEFAULT_KEYS.PUSH_SUBSCRIPTION, d), a.setSubscription(d));
                    } } }, { key: "setSubscription", value: function (a) { a && n.default.request(j.default.METHODS.SET_DEVICE_ATTRIBUTES, (new k.default).add(j.default.PARAMS.WEB_PUSH_SUBSCRIPTION, a), { queued: !1, sendNow: !0 }); } }]), a; }();
            b.default = r, a.exports = b.default;
        }); }, function (a, b, c) {
            var d, e, f;
            !function (g, h) { e = [a, b, c(1), c(12), c(3), c(30), c(32), c(5), c(16), c(4), c(31)], d = h, void 0 !== (f = "function" == typeof d ? d.apply(b, e) : d) && (a.exports = f); }(0, function (a, b, c, d, e, f, g, h, i, j, k) {
                "use strict";
                function l(a) { return a && a.__esModule ? a : { default: a }; }
                function m(a, b) { if (!(a instanceof b))
                    throw new TypeError("Cannot call a class as a function"); }
                Object.defineProperty(b, "__esModule", { value: !0 });
                var n = l(c), o = l(d), p = l(e), q = l(f), r = l(g), s = l(h), t = l(i), u = l(j), v = l(k), w = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (a) { return typeof a; } : function (a) { return a && "function" == typeof Symbol && a.constructor === Symbol && a !== Symbol.prototype ? "symbol" : typeof a; }, x = function () { function a(a, b) { for (var c = 0; c < b.length; c++) {
                    var d = b[c];
                    d.enumerable = d.enumerable || !1, d.configurable = !0, "value" in d && (d.writable = !0), Object.defineProperty(a, d.key, d);
                } } return function (b, c, d) { return c && a(b.prototype, c), d && a(b, d), b; }; }(), y = new q.default, z = function () {
                    function a() { m(this, a); }
                    return x(a, null, [{ key: "setApiPath", value: function (a) { u.default.apiPath && (u.default.apiPath = a); } }, { key: "setEmail", value: function (b) { a._email = b; } }, { key: "setNetworkTimeout", value: function (a) { u.default.setNetworkTimeout(a); } }, { key: "setVariantDebugInfoEnabled", value: function (a) { o.default.setVariantDebugInfoEnabled(a); } }, { key: "getVariantDebugInfo", value: function () { return t.default.getVariantDebugInfo(); } }, { key: "setAppIdForDevelopmentMode", value: function (a, b) { u.default.appId = a, u.default.clientKey = b, o.default.devMode = !0; } }, { key: "setAppIdForProductionMode", value: function (a, b) { u.default.appId = a, u.default.clientKey = b, o.default.devMode = !1; } }, { key: "setSocketHost", value: function (a) { v.default.socketHost = a; } }, { key: "setDeviceId", value: function (a) { u.default.deviceId = a; } }, { key: "setAppVersion", value: function (a) { u.default.versionName = a; } }, { key: "setDeviceName", value: function (b) { a._deviceName = b; } }, { key: "setDeviceModel", value: function (b) { a._deviceModel = b; } }, { key: "setSystemName", value: function (b) { a._systemName = b; } }, { key: "setSystemVersion", value: function (b) { a._systemVersion = b; } }, { key: "setVariables", value: function (a) { t.default.setVariables(a); } }, { key: "setRequestBatching", value: function (a, b) { u.default.batchEnabled = a, u.default.batchCooldown = b; } }, { key: "getVariables", value: function () { return t.default.getVariables(); } }, { key: "getVariable", value: function () { for (var b = a.getVariables(), c = arguments.length, d = Array(c), e = 0; e < c; e++)
                                d[e] = arguments[e]; for (var f = 0; f < d.length; f++)
                                b = b[d[f]]; return b; } }, { key: "getVariants", value: function () { return t.default.variants || []; } }, { key: "addStartResponseHandler", value: function (a) { o.default.addStartResponseHandler(a); } }, { key: "addVariablesChangedHandler", value: function (a) { o.default.addVariablesChangedHandler(a); } }, { key: "removeStartResponseHandler", value: function (a) { o.default.removeStartResponseHandler(a); } }, { key: "removeVariablesChangedHandler", value: function (a) { o.default.removeVariablesChangedHandler(a); } }, { key: "forceContentUpdate", value: function (a) { u.default.request(n.default.METHODS.GET_VARS, (new p.default).add(n.default.PARAMS.INCLUDE_DEFAULTS, !1).add(n.default.PARAMS.INCLUDE_VARIANT_DEBUG_INFO, o.default.variantDebugInfoEnabled), { queued: !1, sendNow: !0, response: function (b) { var c = u.default.getLastResponse(b), d = u.default.isResponseSuccess(c); d && (t.default.applyDiffs(c[n.default.KEYS.VARS], c[n.default.KEYS.VARIANTS], c[n.default.KEYS.ACTION_METADATA]), t.default.variantDebugInfo = c[n.default.KEYS.VARIANT_DEBUG_INFO]), a && a(d); } }); } }, { key: "start", value: function (b, c, d) {
                                "function" == typeof b ? (d = b, c = {}, b = null) : "object" === (void 0 === b ? "undefined" : w(b)) && null !== b && void 0 !== b ? (d = c, c = b, b = null) : "function" == typeof c && (d = c, c = {}), u.default.userId = b, d && a.addStartResponseHandler(d), t.default.onUpdate = function () { o.default.triggerVariablesChangedHandlers(); };
                                var e = (new p.default).add(n.default.PARAMS.USER_ATTRIBUTES, JSON.stringify(c)).add(n.default.PARAMS.COUNTRY, n.default.VALUES.DETECT).add(n.default.PARAMS.REGION, n.default.VALUES.DETECT).add(n.default.PARAMS.CITY, n.default.VALUES.DETECT).add(n.default.PARAMS.LOCATION, n.default.VALUES.DETECT).add(n.default.PARAMS.SYSTEM_NAME, a._systemName || y.OS).add(n.default.PARAMS.SYSTEM_VERSION, (a._systemVersion || "").toString()).add(n.default.PARAMS.BROWSER_NAME, y.browser).add(n.default.PARAMS.BROWSER_VERSION, y.version.toString()).add(n.default.PARAMS.LOCALE, n.default.VALUES.DETECT).add(n.default.PARAMS.DEVICE_NAME, a._deviceName || y.browser + " " + y.version).add(n.default.PARAMS.DEVICE_MODEL, a._deviceModel || "Web Browser").add(n.default.PARAMS.INCLUDE_DEFAULTS, !1).add(n.default.PARAMS.INCLUDE_VARIANT_DEBUG_INFO, o.default.variantDebugInfoEnabled);
                                u.default.request(n.default.METHODS.START, e, { queued: !0, sendNow: !0, response: function (a) { o.default.hasStarted = !0; var b = u.default.getLastResponse(a); if (u.default.isResponseSuccess(b)) {
                                        if (o.default.startSuccessful = !0, o.default.devMode) {
                                            var c = b[n.default.KEYS.LATEST_VERSION];
                                            c && console.log("A newer version of Leanplum, " + c + ", is available. Go toleanplum.com to download it."), v.default.connect();
                                        }
                                        t.default.applyDiffs(b[n.default.KEYS.VARS], b[n.default.KEYS.VARIANTS], b[n.default.KEYS.ACTION_METADATA]), t.default.variantDebugInfo = b[n.default.KEYS.VARIANT_DEBUG_INFO], t.default.token = b[n.default.KEYS.TOKEN];
                                    }
                                    else
                                        o.default.startSuccessful = !1, t.default.loadDiffs(); o.default.triggerStartHandlers(); } });
                            } }, { key: "startFromCache", value: function (b, c, d) { "function" == typeof b ? (d = b, c = {}, b = null) : "object" === (void 0 === b ? "undefined" : w(b)) && null !== b && void 0 !== b ? (d = c, c = b, b = null) : "function" == typeof c && (d = c, c = {}), u.default.userId = b, d && a.addStartResponseHandler(d), o.default.hasStarted = !0, o.default.startSuccessful = !0, o.default.devMode && v.default.connect(), t.default.loadDiffs(), o.default.triggerStartHandlers(); } }, { key: "stop", value: function () { u.default.request(n.default.METHODS.STOP, void 0, { sendNow: !0, queued: !0 }); } }, { key: "pauseSession", value: function () { u.default.request(n.default.METHODS.PAUSE_SESSION, void 0, { sendNow: !0, queued: !0 }); } }, { key: "resumeSession", value: function () { u.default.request(n.default.METHODS.RESUME_SESSION, void 0, { sendNow: !0, queued: !0 }); } }, { key: "pauseState", value: function () { u.default.request(n.default.METHODS.PAUSE_STATE, void 0, { queued: !0 }); } }, { key: "resumeState", value: function () { u.default.request(n.default.METHODS.RESUME_STATE, void 0, { queued: !0 }); } }, { key: "setUserId", value: function (b) { a.setUserAttributes(b); } }, { key: "setUserAttributes", value: function (a, b) { if (void 0 === b)
                                if ("object" === (void 0 === a ? "undefined" : w(a)))
                                    b = a, a = void 0;
                                else if ("string" != typeof a)
                                    return void console.log("Leanplum: setUserAttributes expects a string or an object"); u.default.request(n.default.METHODS.SET_USER_ATTRIBUTES, (new p.default).add(n.default.PARAMS.USER_ATTRIBUTES, b ? JSON.stringify(b) : void 0).add(n.default.PARAMS.NEW_USER_ID, a), { queued: !0 }), a && (u.default.userId = a, s.default.saveToLocalStorage(n.default.DEFAULT_KEYS.USER_ID, u.default.userId)); } }, { key: "track", value: function (a, b, c, d) { "object" === (void 0 === b ? "undefined" : w(b)) && null !== b && void 0 !== b ? (d = b, c = void 0, b = void 0) : "string" == typeof b ? (d = c, c = b, b = void 0) : "object" === (void 0 === c ? "undefined" : w(c)) && null !== c && void 0 !== c && (d = c, c = void 0), u.default.request(n.default.METHODS.TRACK, (new p.default).add(n.default.PARAMS.EVENT, a).add(n.default.PARAMS.VALUE, b || 0).add(n.default.PARAMS.INFO, c).add(n.default.PARAMS.PARAMS, JSON.stringify(d)), { queued: !0 }); } }, { key: "advanceTo", value: function (a, b, c) { "object" === (void 0 === b ? "undefined" : w(b)) && null !== b && void 0 !== b && (c = b, b = void 0), u.default.request(n.default.METHODS.ADVANCE, (new p.default).add(n.default.PARAMS.STATE, a).add(n.default.PARAMS.INFO, b).add(n.default.PARAMS.PARAMS, JSON.stringify(c)), { queued: !0 }); } }, { key: "isWebPushSupported", value: function () { return r.default.isWebPushSupported(); } }, { key: "isWebPushSubscribed", value: function () { return r.default.isWebPushSubscribed(); } }, { key: "registerForWebPush", value: function (a) { return new Promise(function (b, c) { return r.default.isWebPushSupported() ? r.default.register(a, function (a) { return a ? b(!0) : r.default.subscribeUser(); }) : c("Leanplum: WebPush is not supported."); }); } }, { key: "unregisterFromWebPush", value: function () { return r.default.unsubscribeUser(); } }]), a;
                }();
                b.default = z, a.exports = b.default;
            });
        }, function (a, b, c) { var d, e, f; !function (g, h) { e = [a, b, c(17)], d = h, void 0 !== (f = "function" == typeof d ? d.apply(b, e) : d) && (a.exports = f); }(0, function (a, b, c) {
            "use strict";
            function d(a, b) { if (!(a instanceof b))
                throw new TypeError("Cannot call a class as a function"); }
            Object.defineProperty(b, "__esModule", { value: !0 });
            var e = function (a) { return a && a.__esModule ? a : { default: a }; }(c), f = function () { function a(a, b) { for (var c = 0; c < b.length; c++) {
                var d = b[c];
                d.enumerable = d.enumerable || !1, d.configurable = !0, "value" in d && (d.writable = !0), Object.defineProperty(a, d.key, d);
            } } return function (b, c, d) { return c && a(b.prototype, c), d && a(b, d), b; }; }(), g = function () { function a() { d(this, a), this.connected = !1, this.connecting = !1; } return f(a, [{ key: "connect", value: function (a) { var b = this; b.connecting = !0, e.default.ajax("POST", "https://" + a + "/socket.io/1", "", function (c) { var d = c.split(":"), e = d[0], f = parseInt(d[1]) / 2 * 1e3; b.socket = new WebSocket("wss://" + a + "/socket.io/1/websocket/" + e); var g = null; b.socket.onopen = function () { b.connected = !0, b.connecting = !1, b.onopen && b.onopen(), g = setInterval(function () { b.socket.send("2:::"); }, f); }, b.socket.onclose = function () { b.connected = !1, clearInterval(g), b.onclose && b.onclose(); }, b.socket.onmessage = function (a) { var c = a.data.split(":"), d = parseInt(c[0]); if (2 === d)
                        b.socket.send("2::");
                    else if (5 === d) {
                        var e = c[1], f = JSON.parse(c.slice(3).join(":")), g = f.name, h = f.args;
                        e && b.socket.send("6:::" + e), b.onmessage && b.onmessage(g, h);
                    }
                    else
                        7 === d && console.log("Socket error: " + a.data); }, b.socket.onerror = function (a) { b.socket.close(), b.onerror && b.onerror(a); }; }, null, !1, !0); } }, { key: "send", value: function (a, b) { if (!this.connected)
                        return void console.log("Leanplum: Socket is not connected."); var c = JSON.stringify({ name: a, args: b }); this.socket.send("5:::" + c); } }]), a; }();
            b.default = g, a.exports = b.default;
        }); }, function (a, b, c) { var d = c(2), e = c(0), f = d(e, "DataView"); a.exports = f; }, function (a, b, c) { function d(a) { var b = -1, c = null == a ? 0 : a.length; for (this.clear(); ++b < c;) {
            var d = a[b];
            this.set(d[0], d[1]);
        } } var e = c(65), f = c(66), g = c(67), h = c(68), i = c(69); d.prototype.clear = e, d.prototype.delete = f, d.prototype.get = g, d.prototype.has = h, d.prototype.set = i, a.exports = d; }, function (a, b, c) { var d = c(2), e = c(0), f = d(e, "Promise"); a.exports = f; }, function (a, b, c) { var d = c(2), e = c(0), f = d(e, "Set"); a.exports = f; }, function (a, b, c) { function d(a) { var b = -1, c = null == a ? 0 : a.length; for (this.__data__ = new e; ++b < c;)
            this.add(a[b]); } var e = c(18), f = c(89), g = c(90); d.prototype.add = d.prototype.push = f, d.prototype.has = g, a.exports = d; }, function (a, b, c) { function d(a) { var b = this.__data__ = new e(a); this.size = b.size; } var e = c(6), f = c(92), g = c(93), h = c(94), i = c(95), j = c(96); d.prototype.clear = f, d.prototype.delete = g, d.prototype.get = h, d.prototype.has = i, d.prototype.set = j, a.exports = d; }, function (a, b, c) { var d = c(0), e = d.Uint8Array; a.exports = e; }, function (a, b, c) { var d = c(2), e = c(0), f = d(e, "WeakMap"); a.exports = f; }, function (a, b) { function c(a, b) { for (var c = -1, d = null == a ? 0 : a.length, e = 0, f = []; ++c < d;) {
            var g = a[c];
            b(g, c, a) && (f[e++] = g);
        } return f; } a.exports = c; }, function (a, b, c) { function d(a, b) { var c = g(a), d = !c && f(a), k = !c && !d && h(a), m = !c && !d && !k && j(a), n = c || d || k || m, o = n ? e(a.length, String) : [], p = o.length; for (var q in a)
            !b && !l.call(a, q) || n && ("length" == q || k && ("offset" == q || "parent" == q) || m && ("buffer" == q || "byteLength" == q || "byteOffset" == q) || i(q, p)) || o.push(q); return o; } var e = c(54), f = c(97), g = c(15), h = c(23), i = c(70), j = c(28), k = Object.prototype, l = k.hasOwnProperty; a.exports = d; }, function (a, b) { function c(a, b) { for (var c = -1, d = b.length, e = a.length; ++c < d;)
            a[e + c] = b[c]; return a; } a.exports = c; }, function (a, b) { function c(a, b) { for (var c = -1, d = null == a ? 0 : a.length; ++c < d;)
            if (b(a[c], c, a))
                return !0; return !1; } a.exports = c; }, function (a, b, c) { function d(a, b, c) { var d = b(a); return f(a) ? d : e(d, c(a)); } var e = c(45), f = c(15); a.exports = d; }, function (a, b, c) { function d(a) { return f(a) && e(a) == g; } var e = c(8), f = c(11), g = "[object Arguments]"; a.exports = d; }, function (a, b, c) { function d(a, b, c, g, h) { return a === b || (null == a || null == b || !f(a) && !f(b) ? a !== a && b !== b : e(a, b, c, g, d, h)); } var e = c(50), f = c(11); a.exports = d; }, function (a, b, c) { function d(a, b, c, d, q, s) { var t = j(a), u = j(b), v = t ? o : i(a), w = u ? o : i(b); v = v == n ? p : v, w = w == n ? p : w; var x = v == p, y = w == p, z = v == w; if (z && k(a)) {
            if (!k(b))
                return !1;
            t = !0, x = !1;
        } if (z && !x)
            return s || (s = new e), t || l(a) ? f(a, b, c, d, q, s) : g(a, b, v, c, d, q, s); if (!(c & m)) {
            var A = x && r.call(a, "__wrapped__"), B = y && r.call(b, "__wrapped__");
            if (A || B) {
                var C = A ? a.value() : a, D = B ? b.value() : b;
                return s || (s = new e), q(C, D, c, d, s);
            }
        } return !!z && (s || (s = new e), h(a, b, c, d, q, s)); } var e = c(40), f = c(19), g = c(58), h = c(59), i = c(63), j = c(15), k = c(23), l = c(28), m = 1, n = "[object Arguments]", o = "[object Array]", p = "[object Object]", q = Object.prototype, r = q.hasOwnProperty; a.exports = d; }, function (a, b, c) { function d(a) { return !(!g(a) || f(a)) && (e(a) ? o : j).test(h(a)); } var e = c(25), f = c(72), g = c(27), h = c(21), i = /[\\^$.*+?()[\]{}|]/g, j = /^\[object .+?Constructor\]$/, k = Function.prototype, l = Object.prototype, m = k.toString, n = l.hasOwnProperty, o = RegExp("^" + m.call(n).replace(i, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"); a.exports = d; }, function (a, b, c) { function d(a) { return g(a) && f(a.length) && !!h[e(a)]; } var e = c(8), f = c(26), g = c(11), h = {}; h["[object Float32Array]"] = h["[object Float64Array]"] = h["[object Int8Array]"] = h["[object Int16Array]"] = h["[object Int32Array]"] = h["[object Uint8Array]"] = h["[object Uint8ClampedArray]"] = h["[object Uint16Array]"] = h["[object Uint32Array]"] = !0, h["[object Arguments]"] = h["[object Array]"] = h["[object ArrayBuffer]"] = h["[object Boolean]"] = h["[object DataView]"] = h["[object Date]"] = h["[object Error]"] = h["[object Function]"] = h["[object Map]"] = h["[object Number]"] = h["[object Object]"] = h["[object RegExp]"] = h["[object Set]"] = h["[object String]"] = h["[object WeakMap]"] = !1, a.exports = d; }, function (a, b, c) { function d(a) { if (!e(a))
            return f(a); var b = []; for (var c in Object(a))
            h.call(a, c) && "constructor" != c && b.push(c); return b; } var e = c(73), f = c(85), g = Object.prototype, h = g.hasOwnProperty; a.exports = d; }, function (a, b) { function c(a, b) { for (var c = -1, d = Array(a); ++c < a;)
            d[c] = b(c); return d; } a.exports = c; }, function (a, b) { function c(a) { return function (b) { return a(b); }; } a.exports = c; }, function (a, b) { function c(a, b) { return a.has(b); } a.exports = c; }, function (a, b, c) { var d = c(0), e = d["__core-js_shared__"]; a.exports = e; }, function (a, b, c) { function d(a, b, c, d, e, x, z) { switch (c) {
            case w:
                if (a.byteLength != b.byteLength || a.byteOffset != b.byteOffset)
                    return !1;
                a = a.buffer, b = b.buffer;
            case v: return !(a.byteLength != b.byteLength || !x(new f(a), new f(b)));
            case m:
            case n:
            case q: return g(+a, +b);
            case o: return a.name == b.name && a.message == b.message;
            case r:
            case t: return a == b + "";
            case p: var A = i;
            case s:
                var B = d & k;
                if (A || (A = j), a.size != b.size && !B)
                    return !1;
                var C = z.get(a);
                if (C)
                    return C == b;
                d |= l, z.set(a, b);
                var D = h(A(a), A(b), d, e, x, z);
                return z.delete(a), D;
            case u: if (y)
                return y.call(a) == y.call(b);
        } return !1; } var e = c(14), f = c(41), g = c(22), h = c(19), i = c(84), j = c(91), k = 1, l = 2, m = "[object Boolean]", n = "[object Date]", o = "[object Error]", p = "[object Map]", q = "[object Number]", r = "[object RegExp]", s = "[object Set]", t = "[object String]", u = "[object Symbol]", v = "[object ArrayBuffer]", w = "[object DataView]", x = e ? e.prototype : void 0, y = x ? x.valueOf : void 0; a.exports = d; }, function (a, b, c) { function d(a, b, c, d, g, i) { var j = c & f, k = e(a), l = k.length; if (l != e(b).length && !j)
            return !1; for (var m = l; m--;) {
            var n = k[m];
            if (!(j ? n in b : h.call(b, n)))
                return !1;
        } var o = i.get(a); if (o && i.get(b))
            return o == b; var p = !0; i.set(a, b), i.set(b, a); for (var q = j; ++m < l;) {
            n = k[m];
            var r = a[n], s = b[n];
            if (d)
                var t = j ? d(s, r, n, b, a, i) : d(r, s, n, a, b, i);
            if (!(void 0 === t ? r === s || g(r, s, c, d, i) : t)) {
                p = !1;
                break;
            }
            q || (q = "constructor" == n);
        } if (p && !q) {
            var u = a.constructor, v = b.constructor;
            u != v && "constructor" in a && "constructor" in b && !("function" == typeof u && u instanceof u && "function" == typeof v && v instanceof v) && (p = !1);
        } return i.delete(a), i.delete(b), p; } var e = c(60), f = 1, g = Object.prototype, h = g.hasOwnProperty; a.exports = d; }, function (a, b, c) { function d(a) { return e(a, g, f); } var e = c(47), f = c(62), g = c(99); a.exports = d; }, function (a, b, c) { function d(a) { var b = g.call(a, i), c = a[i]; try {
            a[i] = void 0;
            var d = !0;
        }
        catch (a) { } var e = h.call(a); return d && (b ? a[i] = c : delete a[i]), e; } var e = c(14), f = Object.prototype, g = f.hasOwnProperty, h = f.toString, i = e ? e.toStringTag : void 0; a.exports = d; }, function (a, b, c) { var d = c(43), e = c(100), f = Object.prototype, g = f.propertyIsEnumerable, h = Object.getOwnPropertySymbols, i = h ? function (a) { return null == a ? [] : (a = Object(a), d(h(a), function (b) { return g.call(a, b); })); } : e; a.exports = i; }, function (a, b, c) { var d = c(35), e = c(13), f = c(37), g = c(38), h = c(42), i = c(8), j = c(21), k = j(d), l = j(e), m = j(f), n = j(g), o = j(h), p = i; (d && "[object DataView]" != p(new d(new ArrayBuffer(1))) || e && "[object Map]" != p(new e) || f && "[object Promise]" != p(f.resolve()) || g && "[object Set]" != p(new g) || h && "[object WeakMap]" != p(new h)) && (p = function (a) { var b = i(a), c = "[object Object]" == b ? a.constructor : void 0, d = c ? j(c) : ""; if (d)
            switch (d) {
                case k: return "[object DataView]";
                case l: return "[object Map]";
                case m: return "[object Promise]";
                case n: return "[object Set]";
                case o: return "[object WeakMap]";
            } return b; }), a.exports = p; }, function (a, b) { function c(a, b) { return null == a ? void 0 : a[b]; } a.exports = c; }, function (a, b, c) { function d() { this.__data__ = e ? e(null) : {}, this.size = 0; } var e = c(10); a.exports = d; }, function (a, b) { function c(a) { var b = this.has(a) && delete this.__data__[a]; return this.size -= b ? 1 : 0, b; } a.exports = c; }, function (a, b, c) { function d(a) { var b = this.__data__; if (e) {
            var c = b[a];
            return c === f ? void 0 : c;
        } return h.call(b, a) ? b[a] : void 0; } var e = c(10), f = "__lodash_hash_undefined__", g = Object.prototype, h = g.hasOwnProperty; a.exports = d; }, function (a, b, c) { function d(a) { var b = this.__data__; return e ? void 0 !== b[a] : g.call(b, a); } var e = c(10), f = Object.prototype, g = f.hasOwnProperty; a.exports = d; }, function (a, b, c) { function d(a, b) { var c = this.__data__; return this.size += this.has(a) ? 0 : 1, c[a] = e && void 0 === b ? f : b, this; } var e = c(10), f = "__lodash_hash_undefined__"; a.exports = d; }, function (a, b) { function c(a, b) { var c = typeof a; return !!(b = null == b ? d : b) && ("number" == c || "symbol" != c && e.test(a)) && a > -1 && a % 1 == 0 && a < b; } var d = 9007199254740991, e = /^(?:0|[1-9]\d*)$/; a.exports = c; }, function (a, b) { function c(a) { var b = typeof a; return "string" == b || "number" == b || "symbol" == b || "boolean" == b ? "__proto__" !== a : null === a; } a.exports = c; }, function (a, b, c) { function d(a) { return !!f && f in a; } var e = c(57), f = function () { var a = /[^.]+$/.exec(e && e.keys && e.keys.IE_PROTO || ""); return a ? "Symbol(src)_1." + a : ""; }(); a.exports = d; }, function (a, b) { function c(a) { var b = a && a.constructor; return a === ("function" == typeof b && b.prototype || d); } var d = Object.prototype; a.exports = c; }, function (a, b) { function c() { this.__data__ = [], this.size = 0; } a.exports = c; }, function (a, b, c) { function d(a) { var b = this.__data__, c = e(b, a); return !(c < 0) && (c == b.length - 1 ? b.pop() : g.call(b, c, 1), --this.size, !0); } var e = c(7), f = Array.prototype, g = f.splice; a.exports = d; }, function (a, b, c) { function d(a) { var b = this.__data__, c = e(b, a); return c < 0 ? void 0 : b[c][1]; } var e = c(7); a.exports = d; }, function (a, b, c) { function d(a) { return e(this.__data__, a) > -1; } var e = c(7); a.exports = d; }, function (a, b, c) { function d(a, b) { var c = this.__data__, d = e(c, a); return d < 0 ? (++this.size, c.push([a, b])) : c[d][1] = b, this; } var e = c(7); a.exports = d; }, function (a, b, c) { function d() { this.size = 0, this.__data__ = { hash: new e, map: new (g || f), string: new e }; } var e = c(36), f = c(6), g = c(13); a.exports = d; }, function (a, b, c) { function d(a) { var b = e(this, a).delete(a); return this.size -= b ? 1 : 0, b; } var e = c(9); a.exports = d; }, function (a, b, c) { function d(a) { return e(this, a).get(a); } var e = c(9); a.exports = d; }, function (a, b, c) { function d(a) { return e(this, a).has(a); } var e = c(9); a.exports = d; }, function (a, b, c) { function d(a, b) { var c = e(this, a), d = c.size; return c.set(a, b), this.size += c.size == d ? 0 : 1, this; } var e = c(9); a.exports = d; }, function (a, b) { function c(a) { var b = -1, c = Array(a.size); return a.forEach(function (a, d) { c[++b] = [d, a]; }), c; } a.exports = c; }, function (a, b, c) { var d = c(88), e = d(Object.keys, Object); a.exports = e; }, function (a, b, c) { (function (a) { var d = c(20), e = "object" == typeof b && b && !b.nodeType && b, f = e && "object" == typeof a && a && !a.nodeType && a, g = f && f.exports === e, h = g && d.process, i = function () { try {
            var a = f && f.require && f.require("util").types;
            return a || h && h.binding && h.binding("util");
        }
        catch (a) { } }(); a.exports = i; }).call(b, c(29)(a)); }, function (a, b) { function c(a) { return e.call(a); } var d = Object.prototype, e = d.toString; a.exports = c; }, function (a, b) { function c(a, b) { return function (c) { return a(b(c)); }; } a.exports = c; }, function (a, b) { function c(a) { return this.__data__.set(a, d), this; } var d = "__lodash_hash_undefined__"; a.exports = c; }, function (a, b) { function c(a) { return this.__data__.has(a); } a.exports = c; }, function (a, b) { function c(a) { var b = -1, c = Array(a.size); return a.forEach(function (a) { c[++b] = a; }), c; } a.exports = c; }, function (a, b, c) { function d() { this.__data__ = new e, this.size = 0; } var e = c(6); a.exports = d; }, function (a, b) { function c(a) { var b = this.__data__, c = b.delete(a); return this.size = b.size, c; } a.exports = c; }, function (a, b) { function c(a) { return this.__data__.get(a); } a.exports = c; }, function (a, b) { function c(a) { return this.__data__.has(a); } a.exports = c; }, function (a, b, c) { function d(a, b) { var c = this.__data__; if (c instanceof e) {
            var d = c.__data__;
            if (!f || d.length < h - 1)
                return d.push([a, b]), this.size = ++c.size, this;
            c = this.__data__ = new g(d);
        } return c.set(a, b), this.size = c.size, this; } var e = c(6), f = c(13), g = c(18), h = 200; a.exports = d; }, function (a, b, c) { var d = c(48), e = c(11), f = Object.prototype, g = f.hasOwnProperty, h = f.propertyIsEnumerable, i = d(function () { return arguments; }()) ? d : function (a) { return e(a) && g.call(a, "callee") && !h.call(a, "callee"); }; a.exports = i; }, function (a, b, c) { function d(a) { return null != a && f(a.length) && !e(a); } var e = c(25), f = c(26); a.exports = d; }, function (a, b, c) { function d(a) { return g(a) ? e(a) : f(a); } var e = c(44), f = c(53), g = c(98); a.exports = d; }, function (a, b) { function c() { return []; } a.exports = c; }, function (a, b) { function c() { return !1; } a.exports = c; }, function (a, b) { var c; c = function () { return this; }(); try {
            c = c || Function("return this")() || (0, eval)("this");
        }
        catch (a) {
            "object" == typeof window && (c = window);
        } a.exports = c; }]);
});

},{}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var IdFactory = /** @class */ (function () {
    function IdFactory() {
    }
    /**
     *
     * Public methods
     *
     */
    IdFactory.createAdId = function (os) {
        var adid;
        if (os === 'ios') {
            adid = IdFactory.generateRandomGuid().toUpperCase();
        }
        else if (os === 'android') {
            adid = IdFactory.generateRandomGuid();
        }
        else {
            adid = IdFactory.generateWindowsAdvertisingId();
        }
        return adid;
    };
    /**
     *
     * Private methods
     *
     */
    IdFactory.generateRandomGuid = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };
    // Example: 107e8ea14329d4a2194ebbb6dc0c0fd7
    IdFactory.generateWindowsAdvertisingId = function () {
        var id = '';
        for (var i = 0; i < 32; i++) {
            id += Math.floor(Math.random() * 16).toString(16);
        }
        return id;
    };
    return IdFactory;
}());
exports.default = IdFactory;

},{}],19:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var id_factory_1 = __importDefault(require("./id-factory"));
var IdManager = /** @class */ (function () {
    function IdManager() {
    }
    IdManager.prototype.getAdId = function (os) {
        var adid = localStorage.getItem('adid');
        if (!adid) {
            adid = id_factory_1.default.createAdId(os);
            localStorage.setItem('adid', adid);
        }
        return adid;
    };
    // Singleton
    IdManager.shared = new IdManager();
    return IdManager;
}());
exports.default = IdManager;

},{"./id-factory":18}],20:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var channel_factory_1 = __importDefault(require("./channel-factory"));
var error_1 = __importDefault(require("./exceptions/error"));
var LogEventHandlers = /** @class */ (function () {
    function LogEventHandlers(os, appVersion, channelConfigs) {
        this.os = os;
        this.appVersion = appVersion;
        this.channels = [];
        this.isReady = false; // Ready once all channels are ready or one channel is ready?
        this.initializeChannels(channelConfigs);
        LogEventHandlers.instance = this;
    }
    /**
     *
     * Public methods
     *
     */
    LogEventHandlers.sharedInstance = function () {
        if (LogEventHandlers.instance) {
            return LogEventHandlers.instance;
        }
        else {
            throw new error_1.default('LogEventHandlers need to be initialized');
        }
    };
    LogEventHandlers.prototype.postEvent = function (logEvent) {
        var _this = this;
        var commonChannelParams = logEvent.params.common || {};
        this.addDefaultParams(commonChannelParams);
        var destinationChannelNames = Object.keys(logEvent.params);
        destinationChannelNames.forEach(function (channelName) {
            if (channelName !== 'common') {
                var thisChannelParams = logEvent.params[channelName];
                // Allow channel-specific params to override common params
                _this.concatObject(commonChannelParams, thisChannelParams);
                var channel = _this.getChannelByName(channelName);
                if (channel) {
                    _this.postEventToChannel(channel, channelName, logEvent.name, thisChannelParams);
                }
                else {
                    // Channel not available
                    console.log('[BitAnalytics] LogEvent "' + name + '" cannot be sent to ' + channelName + ', this channel is not available.');
                }
            }
        });
    };
    LogEventHandlers.prototype.setUserAttributes = function (attributes) {
        this.channels.forEach(function (channel) {
            channel.setUserAttributes(attributes);
        });
    };
    LogEventHandlers.prototype.setVariables = function (variables) {
        this.channels.forEach(function (channel) {
            channel.setVariables(variables);
        });
    };
    /**
     * getVariablesFromChannel
     */
    LogEventHandlers.prototype.getVariablesFromChannel = function (channelName) {
        var channel = this.getChannelByName(channelName);
        if (channel) {
            return channel.getVariables();
        }
        else {
            return undefined;
        }
    };
    /**
     *
     * Private methods
     *
     */
    LogEventHandlers.prototype.addDefaultParams = function (to) {
        to.os = to.os || this.os;
        to.appVersion = to.appVersion || this.appVersion;
    };
    LogEventHandlers.prototype.concatObject = function (from, to) {
        var keys = Object.keys(from);
        keys.forEach(function (key) {
            if (!to[key]) {
                to[key] = from[key];
            }
        });
        return to;
    };
    LogEventHandlers.prototype.getChannelByName = function (channelName) {
        var channels = this.channels.filter(function (channel) { return channel.name == channelName; });
        if (channels.length > 0) {
            return channels[0];
        }
        else {
            return undefined;
        }
    };
    LogEventHandlers.prototype.initializeChannels = function (channelConfigs) {
        var _this = this;
        // Get the channel names by the keys
        var channelNames = Object.keys(channelConfigs);
        // Iterate to init the several channels given in the config
        channelNames.forEach(function (channelName) {
            var channelConfig = channelConfigs[channelName];
            // OS shared to check the availability of this channel on this OS.
            channelConfig.os = _this.os;
            channelConfig.appVersion = _this.appVersion;
            try {
                var channel = channel_factory_1.default.createChannel(channelName, channelConfig);
                _this.channels.push(channel);
            }
            catch (error) {
                console.log(error.message);
            }
        });
    };
    LogEventHandlers.prototype.postEventToChannel = function (channel, channelName, name, params) {
        try {
            channel.postEvent(name, params);
            console.log('[BitAnalytics] LogEvent "' + name + '" sent to ' + channelName + '.');
        }
        catch (e) {
            console.error('[BitAnalytics] LogEvent "' + name + '" failed to send with "' + channelName + '. ');
            console.log(e);
        }
    };
    return LogEventHandlers;
}());
exports.default = LogEventHandlers;

},{"./channel-factory":7,"./exceptions/error":14}],21:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var error_1 = __importDefault(require("./exceptions/error"));
var LogEvent = /** @class */ (function () {
    /**
     *
     * @param {string} name - The name of the event.
     * @param {Dictionary | Array} params - Params to send to each channel, one object per channel.
     * If an array, items from the first element are added to all channels.
     * If dictionary:
     *   Params in the common object are added to all channels.
     *   {
     *     common: {
     *       a: 'b',
     *     },
     *     ga: {
     *       c: 'd'
     *     },
     *     leanplum {
     *       e: 'f'
     *     }
     *   }
     * @param {undefined | Array} channelNames - The name of the channel to send the corresponding params to from the params array.
     */
    function LogEvent(name, params, channelNames) {
        var _this = this;
        this.name = name;
        if (Array.isArray(params)) {
            if (!channelNames || (channelNames && channelNames.length === 0)) {
                throw new error_1.default('Minimum one channel is needed.');
            }
            if (params.length !== channelNames.length + 1) { // +1 for common params
                throw new error_1.default('The number of channels specified is incorrect for the number of params given.');
            }
            this.params = {
                common: params[0]
            };
            channelNames.forEach(function (channelName, index) {
                _this.params[channelName] = params[index + 1];
            });
        }
        else {
            this.params = params;
        }
    }
    LogEvent.fromArray = function (name, params, channelNames) {
        return new LogEvent(name, params, channelNames);
    };
    LogEvent.fromDictionary = function (name, params) {
        return new LogEvent(name, params);
    };
    return LogEvent;
}());
exports.default = LogEvent;

},{"./exceptions/error":14}]},{},[6])(6)
});
