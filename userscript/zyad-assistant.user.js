// ==UserScript==
// @name         赵云与阿斗 - 免广告/固定消耗/无限馒头金币
// @namespace    zhaoyunadou.cheat
// @version      16.0
// @description  免广告、征兵消耗固定、馒头体力与战斗金币无限（Via/移动端兼容）
// @match        *://h.4399.com/play/262277.htm*
// @match        *://h.4399.com/zzy/262277.htm*
// @match        *://h.4399.com/wap/play_default.htm*
// @match        *://www.4399.com/flash/262277_1.htm*
// @match        *://sda.4399.com/4399swf/upload_swf/ftp56/huangcijin/20261016/12/*
// @run-at       document-start
// @all-frames   true
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  var GAME_PATH = '4399swf/upload_swf/ftp56/huangcijin/20261016/12/';
  var SCRIPT_ID = '__zyad_core';
  var SAVE_KEY = 'playerData';

  /* =========================================================
   * CORE：注入到游戏页执行。必须是纯函数、无注释、无特殊字符
   * ========================================================= */
  var CORE = function () {
    if (window.__zyadCore) return;
    window.__zyadCore = true;
    window.__zyadInstalled = true;
    window.__zyadBooted = true;

    var SAVE_KEY = 'playerData';
    var GOLD_SAVE = 999999;
    var STAMINA_MAX = 9999;
    var BATTLE_GOLD = 100000;
    var FIXED_COST = 2;

    function log(m) {
      try { console.log('[ZYAD] ' + m); } catch (e) {}
    }

    function installAdFree() {
      var names = ['h5api', 'H5API', 'h5wan', 'MetaH5Ad'];
      for (var i = 0; i < names.length; i++) {
        var h = window[names[i]];
        if (!h || h.__zyadAdFree) continue;
        var ok = function (cb) {
          try {
            if (typeof cb === 'function') {
              setTimeout(function () {
                cb({ ok: true, isEnded: true, code: 0, success: true, canPlay: true });
              }, 50);
            }
          } catch (e) {}
        };
        try { if (h.canPlayAd) h.canPlayAd = function (cb) { ok(cb); return true; }; } catch (e) {}
        try { if (h.playAd) h.playAd = function (cb) { ok(cb); }; } catch (e) {}
        try { if (h.playYlhAd) h.playYlhAd = function (p, cb) { ok(cb); }; } catch (e) {}
        try { if (h.playInterstitialAd) h.playInterstitialAd = function () {}; } catch (e) {}
        try { if (h.showAd) h.showAd = function (t, cb) { ok(cb); return true; }; } catch (e) {}
        h.__zyadAdFree = true;
      }
    }

    function fixRaw(raw) {
      if (!raw) return raw;
      var o;
      try { o = JSON.parse(raw); } catch (e) { return raw; }
      if (!o || typeof o !== 'object') return raw;
      o._gold = GOLD_SAVE;
      o._stamina = STAMINA_MAX;
      o._lastRecoverStaminaTime = Date.now();
      o._weaponFree = true;
      o._hasUsedFreeShovel = false;
      o._hasUsedFreeBulldozer = false;
      o._isAdFreeUser = true;
      try { return JSON.stringify(o); } catch (e) { return raw; }
    }

    function installStorage() {
      var L = window.Laya;
      if (!L || !L.LocalStorage) return;
      var LS = L.LocalStorage;
      if (LS.__zyad) return;
      var oSet = LS.setItem, oGet = LS.getItem;
      LS.setItem = function (k, v) {
        if (k === SAVE_KEY && v) v = fixRaw(v);
        return oSet.call(this, k, v);
      };
      LS.getItem = function (k) {
        var v = oGet.call(this, k);
        if (k === SAVE_KEY && v) {
          var f = fixRaw(v);
          try { oSet.call(this, k, f); } catch (e) {}
          return f;
        }
        return v;
      };
      LS.__zyad = true;
      window.__zyadGet = oGet;
    }

    function findGw() {
      var L = window.Laya;
      if (!L || !L.stage || !L.stage._children) return null;
      var sc = L.stage._children;
      for (var i = 0; i < sc.length; i++) {
        var c = sc[i];
        try { if (c && c.Gw) return c.Gw; } catch (e) {}
        if (!c || !c._children) continue;
        for (var j = 0; j < c._children.length; j++) {
          try {
            var g2 = c._children[j];
            if (g2 && g2.Gw) return g2.Gw;
          } catch (e) {}
        }
      }
      return null;
    }

    function lockCost(Q2) {
      if (!Q2 || Q2.__zyadCostLocked) return;
      var d;
      try { d = Object.getOwnPropertyDescriptor(Q2, 'Gs'); } catch (e) { return; }
      if (!d || !d.configurable) return;
      try {
        delete Q2.Gs;
        Object.defineProperty(Q2, 'Gs', {
          configurable: true, enumerable: true,
          get: function () { return FIXED_COST; },
          set: function () {}
        });
        Q2.__zyadCostLocked = true;
      } catch (e) {}
    }

    function lockBattle() {
      var Gw = findGw();
      if (!Gw) return;
      try {
        var p = Gw._player;
        if (p && p._data) {
          if (p._data._stamina !== STAMINA_MAX) p._data._stamina = STAMINA_MAX;
          if (p._data._gold !== GOLD_SAVE) p._data._gold = GOLD_SAVE;
        }
      } catch (e) {}
      try {
        var st = Gw._stamina;
        if (st && st.m2 < STAMINA_MAX) st.m2 = STAMINA_MAX;
      } catch (e) {}
      try {
        var Q2 = Gw.Q2;
        if (Q2) {
          lockCost(Q2);
          if (typeof Q2._gold === 'number' && Q2._gold < BATTLE_GOLD) Q2._gold = BATTLE_GOLD;
        }
      } catch (e) {}
    }

    function findTextProto(obj) {
      var p = Object.getPrototypeOf(obj);
      while (p) {
        if (Object.getOwnPropertyDescriptor(p, 'text')) return p;
        p = Object.getPrototypeOf(p);
      }
      return null;
    }

    function hookLabel(node, kind) {
      if (!node || node.__zyadHooked) return false;
      var proto = findTextProto(node);
      if (!proto) return false;
      var d = Object.getOwnPropertyDescriptor(proto, 'text');
      if (!d || !d.set) return false;
      var oGet = d.get, oSet = d.set;
      try {
        Object.defineProperty(node, 'text', {
          configurable: true, enumerable: false,
          get: function () { return oGet.call(this); },
          set: function (v) {
            if (kind === 'num') {
              var n = parseInt(v, 10);
              if (!isNaN(n) && n <= 100) v = String(STAMINA_MAX);
            } else if (kind === 'cap') {
              if (/^\/\d+$/.test(String(v))) v = '/' + STAMINA_MAX;
            }
            return oSet.call(this, v);
          }
        });
        node.__zyadHooked = true;
        return true;
      } catch (e) { return false; }
    }

    function lockUI() {
      var L = window.Laya;
      if (!L || !L.stage) return;
      var txt = null, cap = null;
      (function walk(n, dep) {
        if (dep > 30 || !n) return;
        try {
          if (n.name === 'staminaTxt') txt = n;
          if (n.name === 'txt' && n.text && /^\//.test(String(n.text))) cap = n;
        } catch (e) {}
        var c = 0;
        try { c = n.numChildren || 0; } catch (e) { c = 0; }
        for (var i = 0; i < c; i++) {
          try { walk(n.getChildAt(i), dep + 1); } catch (e) {}
        }
      })(L.stage, 0);
      if (txt) hookLabel(txt, 'num');
      if (cap) hookLabel(cap, 'cap');
      if (txt) { try { txt.text = String(STAMINA_MAX); } catch (e) {} }
      if (cap) { try { cap.text = '/' + STAMINA_MAX; } catch (e) {} }
    }

    function tick() {
      installAdFree();
      installStorage();
      lockBattle();
      lockUI();
    }

    setInterval(tick, 150);
    tick();

    window.__ZYAD__ = {
      tick: tick,
      state: function () {
        var Gw = findGw();
        return {
          adFree: !!(window.h5api && window.h5api.__zyadAdFree),
          inBattle: !!Gw,
          cost: Gw && Gw.Q2 ? Gw.Q2.Gs : null,
          costLocked: !!(Gw && Gw.Q2 && Gw.Q2.__zyadCostLocked),
          stamina: Gw && Gw._player && Gw._player._data ? Gw._player._data._stamina : null,
          battleGold: Gw && Gw.Q2 ? Gw.Q2._gold : null
        };
      }
    };
    log('core installed @ ' + location.href);
  };

  function coreSource() {
    try { return '(' + CORE.toString() + ')();'; } catch (e) { return null; }
  }

  function injectDoc(doc) {
    if (!doc || !doc.head) return false;
    if (doc.getElementById(SCRIPT_ID)) return true;
    var src = coreSource();
    if (!src) return false;
    try {
      var s = doc.createElement('script');
      s.id = SCRIPT_ID;
      s.type = 'text/javascript';
      s.textContent = src;
      doc.head.appendChild(s);
      return true;
    } catch (e) { return false; }
  }

  function diveDoc(doc, depth) {
    if (depth > 5 || !doc) return false;
    var ok = false;
    var frames;
    try { frames = doc.querySelectorAll('iframe'); } catch (e) { return false; }
    for (var i = 0; i < frames.length; i++) {
      var f = frames[i];
      var src = '';
      try { src = f.getAttribute('src') || ''; } catch (e) {}
      var sub = null;
      try { sub = f.contentDocument; } catch (e) { sub = null; }
      if (!sub) continue;
      if (src.indexOf(GAME_PATH) >= 0) {
        if (injectDoc(sub)) ok = true;
      }
      if (diveDoc(sub, depth + 1)) ok = true;
    }
    return ok;
  }

  function isGameDoc() {
    return location.href.indexOf(GAME_PATH) >= 0;
  }

  /* ---------- 纯 localStorage 兜底：不依赖 iframe 访问 ---------- */
  function storageFallback() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      var o = JSON.parse(raw);
      var changed = false;
      if (o._gold !== 999999) { o._gold = 999999; changed = true; }
      if (o._stamina !== 9999) { o._stamina = 9999; changed = true; }
      if (o._weaponFree !== true) { o._weaponFree = true; changed = true; }
      if (o._hasUsedFreeShovel !== false) { o._hasUsedFreeShovel = false; changed = true; }
      if (o._hasUsedFreeBulldozer !== false) { o._hasUsedFreeBulldozer = false; changed = true; }
      if (o._isAdFreeUser !== true) { o._isAdFreeUser = true; changed = true; }
      o._lastRecoverStaminaTime = Date.now();
      if (changed) localStorage.setItem(SAVE_KEY, JSON.stringify(o));
    } catch (e) {}
  }

  function boot() {
    if (window.__zyadTopBooted) return;
    window.__zyadTopBooted = true;

    if (isGameDoc()) {
      try { eval('(' + CORE.toString() + ')()'); } catch (e) {
        try { console.log('[ZYAD] inline fail: ' + e); } catch (x) {}
      }
      return;
    }

    var tries = 0;
    var timer = setInterval(function () {
      tries++;
      diveDoc(document, 0);
      if (tries > 400) clearInterval(timer);
    }, 250);

    /* localStorage 兜底：如果脚本就运行在游戏同域，直接改存档 */
    storageFallback();
    setInterval(storageFallback, 500);

    window.__ZYAD_TOP__ = {
      dive: function () { return diveDoc(document, 0); },
      fallback: storageFallback,
      status: function () {
        var out = [];
        (function scan(doc, path, d) {
          if (d > 5) return;
          var fs;
          try { fs = doc.querySelectorAll('iframe'); } catch (e) { return; }
          for (var i = 0; i < fs.length; i++) {
            var f = fs[i];
            var sub = null;
            try { sub = f.contentDocument; } catch (e) {}
            var item = {path: path + '/' + i, src: (f.getAttribute('src') || '').slice(-38)};
            if (sub) {
              item.hasCore = !!sub.getElementById(SCRIPT_ID);
              item.hasLaya = (function () {
                try { return typeof f.contentWindow.Laya; } catch (e) { return 'cross'; }
              })();
              item.booted = (function () {
                try { return !!f.contentWindow.__zyadCore; } catch (e) { return 'cross'; }
              })();
            } else {
              item.cross = true;
            }
            out.push(item);
            if (sub) scan(sub, path + '/' + i, d + 1);
          }
        })(document, 'top', 0);
        return out;
      }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  setTimeout(function () { boot(); }, 1200);
})();
