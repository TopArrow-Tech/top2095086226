// server/index.mjs
import http from "node:http";

// package.json
var package_default = {
  name: "fitnote",
  private: true,
  type: "module",
  scripts: {
    build: "node scripts/build.mjs",
    start: "node server/standalone.mjs",
    test: "node --test tests/*.test.mjs",
    typecheck: "tsc --noEmit",
    package: "node scripts/package.mjs"
  },
  dependencies: {
    "@pdf-lib/fontkit": "^1.1.1",
    fflate: "^0.8.2",
    "lucide-react": "^0.468.0",
    "pdf-lib": "^1.17.1",
    "pdfjs-dist": "^5.7.284",
    react: "^19.2.0",
    "react-dom": "^19.2.0"
  },
  devDependencies: {
    vite: "^6.4.1",
    typescript: "^5.9.3",
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    esbuild: "^0.25.12"
  },
  version: "1.0.0"
};

// server/index.mjs
import { execFile } from "node:child_process";
import { promisify } from "node:util";

// server/manual-backups.mjs
import fs from "node:fs";
import path2 from "node:path";
import { createHash } from "node:crypto";
import { DatabaseSync as DatabaseSync2, backup } from "node:sqlite";

// node_modules/fflate/esm/index.mjs
import { createRequire } from "module";
var require2 = createRequire("/");
var _a;
var Worker;
var isMarkedAsUntransferable;
try {
  _a = require2("worker_threads"), Worker = _a.Worker, isMarkedAsUntransferable = _a.isMarkedAsUntransferable;
} catch (e) {
}
var u8 = Uint8Array;
var u16 = Uint16Array;
var i32 = Int32Array;
var fleb = new u8([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  0,
  /* unused */
  0,
  0,
  /* impossible */
  0
]);
var fdeb = new u8([
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
  /* unused */
  0,
  0
]);
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var freb = function(eb, start) {
  var b = new u16(31);
  for (var i = 0; i < 31; ++i) {
    b[i] = start += 1 << eb[i - 1];
  }
  var r = new i32(b[30]);
  for (var i = 1; i < 30; ++i) {
    for (var j = b[i]; j < b[i + 1]; ++j) {
      r[j] = j - b[i] << 5 | i;
    }
  }
  return { b, r };
};
var _a = freb(fleb, 2);
var fl = _a.b;
var revfl = _a.r;
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0);
var fd = _b.b;
var revfd = _b.r;
var rev = new u16(32768);
for (i = 0; i < 32768; ++i) {
  x = (i & 43690) >> 1 | (i & 21845) << 1;
  x = (x & 52428) >> 2 | (x & 13107) << 2;
  x = (x & 61680) >> 4 | (x & 3855) << 4;
  rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
}
var x;
var i;
var hMap = (function(cd, mb, r) {
  var s = cd.length;
  var i = 0;
  var l = new u16(mb);
  for (; i < s; ++i) {
    if (cd[i])
      ++l[cd[i] - 1];
  }
  var le = new u16(mb);
  for (i = 1; i < mb; ++i) {
    le[i] = le[i - 1] + l[i - 1] << 1;
  }
  var co;
  if (r) {
    co = new u16(1 << mb);
    var rvb = 15 - mb;
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        var sv = i << 4 | cd[i];
        var r_1 = mb - cd[i];
        var v = le[cd[i] - 1]++ << r_1;
        for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
          co[rev[v] >> rvb] = sv;
        }
      }
    }
  } else {
    co = new u16(s);
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        co[i] = rev[le[cd[i] - 1]++] >> 15 - cd[i];
      }
    }
  }
  return co;
});
var flt = new u8(288);
for (i = 0; i < 144; ++i)
  flt[i] = 8;
var i;
for (i = 144; i < 256; ++i)
  flt[i] = 9;
var i;
for (i = 256; i < 280; ++i)
  flt[i] = 7;
var i;
for (i = 280; i < 288; ++i)
  flt[i] = 8;
var i;
var fdt = new u8(32);
for (i = 0; i < 32; ++i)
  fdt[i] = 5;
var i;
var flm = /* @__PURE__ */ hMap(flt, 9, 0);
var flrm = /* @__PURE__ */ hMap(flt, 9, 1);
var fdm = /* @__PURE__ */ hMap(fdt, 5, 0);
var fdrm = /* @__PURE__ */ hMap(fdt, 5, 1);
var max = function(a) {
  var m = a[0];
  for (var i = 1; i < a.length; ++i) {
    if (a[i] > m)
      m = a[i];
  }
  return m;
};
var bits = function(d, p, m) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8) >> (p & 7) & m;
};
var bits16 = function(d, p) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8 | d[o + 2] << 16) >> (p & 7);
};
var shft = function(p) {
  return (p + 7) / 8 | 0;
};
var slc = function(v, s, e) {
  if (s == null || s < 0)
    s = 0;
  if (e == null || e > v.length)
    e = v.length;
  return new u8(v.subarray(s, e));
};
var ec = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  // determined by compression function
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data"
  // determined by unknown compression method
];
var err = function(ind, msg, nt) {
  var e = new Error(msg || ec[ind]);
  e.code = ind;
  if (Error.captureStackTrace)
    Error.captureStackTrace(e, err);
  if (!nt)
    throw e;
  return e;
};
var inflt = function(dat, st, buf, dict) {
  var sl = dat.length, dl = dict ? dict.length : 0;
  if (!sl || st.f && !st.l)
    return buf || new u8(0);
  var noBuf = !buf;
  var resize = noBuf || st.i != 2;
  var noSt = st.i;
  if (noBuf)
    buf = new u8(sl * 3);
  var cbuf = function(l2) {
    var bl = buf.length;
    if (l2 > bl) {
      var nbuf = new u8(Math.max(bl * 2, l2));
      nbuf.set(buf);
      buf = nbuf;
    }
  };
  var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
  var tbts = sl * 8;
  do {
    if (!lm) {
      final = bits(dat, pos, 1);
      var type = bits(dat, pos + 1, 3);
      pos += 3;
      if (!type) {
        var s = shft(pos) + 4, l = dat[s - 4] | dat[s - 3] << 8, t = s + l;
        if (t > sl) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + l);
        buf.set(dat.subarray(s, t), bt);
        st.b = bt += l, st.p = pos = t * 8, st.f = final;
        continue;
      } else if (type == 1)
        lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
      else if (type == 2) {
        var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
        var tl = hLit + bits(dat, pos + 5, 31) + 1;
        pos += 14;
        var ldt = new u8(tl);
        var clt = new u8(19);
        for (var i = 0; i < hcLen; ++i) {
          clt[clim[i]] = bits(dat, pos + i * 3, 7);
        }
        pos += hcLen * 3;
        var clb = max(clt), clbmsk = (1 << clb) - 1;
        var clm = hMap(clt, clb, 1);
        for (var i = 0; i < tl; ) {
          var r = clm[bits(dat, pos, clbmsk)];
          pos += r & 15;
          var s = r >> 4;
          if (s < 16) {
            ldt[i++] = s;
          } else {
            var c = 0, n = 0;
            if (s == 16)
              n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];
            else if (s == 17)
              n = 3 + bits(dat, pos, 7), pos += 3;
            else if (s == 18)
              n = 11 + bits(dat, pos, 127), pos += 7;
            while (n--)
              ldt[i++] = c;
          }
        }
        var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
        lbt = max(lt);
        dbt = max(dt);
        lm = hMap(lt, lbt, 1);
        dm = hMap(dt, dbt, 1);
      } else
        err(1);
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
    }
    if (resize)
      cbuf(bt + 131072);
    var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
    var lpos = pos;
    for (; ; lpos = pos) {
      var c = lm[bits16(dat, pos) & lms], sym = c >> 4;
      pos += c & 15;
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
      if (!c)
        err(2);
      if (sym < 256)
        buf[bt++] = sym;
      else if (sym == 256) {
        lpos = pos, lm = null;
        break;
      } else {
        var add = sym - 254;
        if (sym > 264) {
          var i = sym - 257, b = fleb[i];
          add = bits(dat, pos, (1 << b) - 1) + fl[i];
          pos += b;
        }
        var d = dm[bits16(dat, pos) & dms], dsym = d >> 4;
        if (!d)
          err(3);
        pos += d & 15;
        var dt = fd[dsym];
        if (dsym > 3) {
          var b = fdeb[dsym];
          dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
        }
        if (pos > tbts) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + 131072);
        var end = bt + add;
        if (bt < dt) {
          var shift = dl - dt, dend = Math.min(dt, end);
          if (shift + bt < 0)
            err(3);
          for (; bt < dend; ++bt)
            buf[bt] = dict[shift + bt];
        }
        for (; bt < end; ++bt)
          buf[bt] = buf[bt - dt];
      }
    }
    st.l = lm, st.p = lpos, st.b = bt, st.f = final;
    if (lm)
      final = 1, st.m = lbt, st.d = dm, st.n = dbt;
  } while (!final);
  return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
};
var wbits = function(d, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v;
  d[o + 1] |= v >> 8;
};
var wbits16 = function(d, p, v) {
  v <<= p & 7;
  var o = p / 8 | 0;
  d[o] |= v;
  d[o + 1] |= v >> 8;
  d[o + 2] |= v >> 16;
};
var hTree = function(d, mb) {
  var t = [];
  for (var i = 0; i < d.length; ++i) {
    if (d[i])
      t.push({ s: i, f: d[i] });
  }
  var s = t.length;
  var t2 = t.slice();
  if (!s)
    return { t: et, l: 0 };
  if (s == 1) {
    var v = new u8(t[0].s + 1);
    v[t[0].s] = 1;
    return { t: v, l: 1 };
  }
  t.sort(function(a, b) {
    return a.f - b.f;
  });
  t.push({ s: -1, f: 25001 });
  var l = t[0], r = t[1], i0 = 0, i1 = 1, i2 = 2;
  t[0] = { s: -1, f: l.f + r.f, l, r };
  while (i1 != s - 1) {
    l = t[t[i0].f < t[i2].f ? i0++ : i2++];
    r = t[i0 != i1 && t[i0].f < t[i2].f ? i0++ : i2++];
    t[i1++] = { s: -1, f: l.f + r.f, l, r };
  }
  var maxSym = t2[0].s;
  for (var i = 1; i < s; ++i) {
    if (t2[i].s > maxSym)
      maxSym = t2[i].s;
  }
  var tr = new u16(maxSym + 1);
  var mbt = ln(t[i1 - 1], tr, 0);
  if (mbt > mb) {
    var i = 0, dt = 0;
    var lft = mbt - mb, cst = 1 << lft;
    t2.sort(function(a, b) {
      return tr[b.s] - tr[a.s] || a.f - b.f;
    });
    for (; i < s; ++i) {
      var i2_1 = t2[i].s;
      if (tr[i2_1] > mb) {
        dt += cst - (1 << mbt - tr[i2_1]);
        tr[i2_1] = mb;
      } else
        break;
    }
    dt >>= lft;
    while (dt > 0) {
      var i2_2 = t2[i].s;
      if (tr[i2_2] < mb)
        dt -= 1 << mb - tr[i2_2]++ - 1;
      else
        ++i;
    }
    for (; i >= 0 && dt; --i) {
      var i2_3 = t2[i].s;
      if (tr[i2_3] == mb) {
        --tr[i2_3];
        ++dt;
      }
    }
    mbt = mb;
  }
  return { t: new u8(tr), l: mbt };
};
var ln = function(n, l, d) {
  return n.s == -1 ? Math.max(ln(n.l, l, d + 1), ln(n.r, l, d + 1)) : l[n.s] = d;
};
var lc = function(c) {
  var s = c.length;
  while (s && !c[--s])
    ;
  var cl = new u16(++s);
  var cli = 0, cln = c[0], cls = 1;
  var w = function(v) {
    cl[cli++] = v;
  };
  for (var i = 1; i <= s; ++i) {
    if (c[i] == cln && i != s)
      ++cls;
    else {
      if (!cln && cls > 2) {
        for (; cls > 138; cls -= 138)
          w(32754);
        if (cls > 2) {
          w(cls > 10 ? cls - 11 << 5 | 28690 : cls - 3 << 5 | 12305);
          cls = 0;
        }
      } else if (cls > 3) {
        w(cln), --cls;
        for (; cls > 6; cls -= 6)
          w(8304);
        if (cls > 2)
          w(cls - 3 << 5 | 8208), cls = 0;
      }
      while (cls--)
        w(cln);
      cls = 1;
      cln = c[i];
    }
  }
  return { c: cl.subarray(0, cli), n: s };
};
var clen = function(cf, cl) {
  var l = 0;
  for (var i = 0; i < cl.length; ++i)
    l += cf[i] * cl[i];
  return l;
};
var wfblk = function(out, pos, dat) {
  var s = dat.length;
  var o = shft(pos + 2);
  out[o] = s & 255;
  out[o + 1] = s >> 8;
  out[o + 2] = out[o] ^ 255;
  out[o + 3] = out[o + 1] ^ 255;
  for (var i = 0; i < s; ++i)
    out[o + i + 4] = dat[i];
  return (o + 4 + s) * 8;
};
var wblk = function(dat, out, final, syms, lf, df, eb, li, bs, bl, p) {
  wbits(out, p++, final);
  ++lf[256];
  var _a2 = hTree(lf, 15), dlt = _a2.t, mlb = _a2.l;
  var _b2 = hTree(df, 15), ddt = _b2.t, mdb = _b2.l;
  var _c = lc(dlt), lclt = _c.c, nlc = _c.n;
  var _d = lc(ddt), lcdt = _d.c, ndc = _d.n;
  var lcfreq = new u16(19);
  for (var i = 0; i < lclt.length; ++i)
    ++lcfreq[lclt[i] & 31];
  for (var i = 0; i < lcdt.length; ++i)
    ++lcfreq[lcdt[i] & 31];
  var _e = hTree(lcfreq, 7), lct = _e.t, mlcb = _e.l;
  var nlcc = 19;
  for (; nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc)
    ;
  var flen = bl + 5 << 3;
  var ftlen = clen(lf, flt) + clen(df, fdt) + eb;
  var dtlen = clen(lf, dlt) + clen(df, ddt) + eb + 14 + 3 * nlcc + clen(lcfreq, lct) + 2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18];
  if (bs >= 0 && flen <= ftlen && flen <= dtlen)
    return wfblk(out, p, dat.subarray(bs, bs + bl));
  var lm, ll, dm, dl;
  wbits(out, p, 1 + (dtlen < ftlen)), p += 2;
  if (dtlen < ftlen) {
    lm = hMap(dlt, mlb, 0), ll = dlt, dm = hMap(ddt, mdb, 0), dl = ddt;
    var llm = hMap(lct, mlcb, 0);
    wbits(out, p, nlc - 257);
    wbits(out, p + 5, ndc - 1);
    wbits(out, p + 10, nlcc - 4);
    p += 14;
    for (var i = 0; i < nlcc; ++i)
      wbits(out, p + 3 * i, lct[clim[i]]);
    p += 3 * nlcc;
    var lcts = [lclt, lcdt];
    for (var it = 0; it < 2; ++it) {
      var clct = lcts[it];
      for (var i = 0; i < clct.length; ++i) {
        var len = clct[i] & 31;
        wbits(out, p, llm[len]), p += lct[len];
        if (len > 15)
          wbits(out, p, clct[i] >> 5 & 127), p += clct[i] >> 12;
      }
    }
  } else {
    lm = flm, ll = flt, dm = fdm, dl = fdt;
  }
  for (var i = 0; i < li; ++i) {
    var sym = syms[i];
    if (sym > 255) {
      var len = sym >> 18 & 31;
      wbits16(out, p, lm[len + 257]), p += ll[len + 257];
      if (len > 7)
        wbits(out, p, sym >> 23 & 31), p += fleb[len];
      var dst = sym & 31;
      wbits16(out, p, dm[dst]), p += dl[dst];
      if (dst > 3)
        wbits16(out, p, sym >> 5 & 8191), p += fdeb[dst];
    } else {
      wbits16(out, p, lm[sym]), p += ll[sym];
    }
  }
  wbits16(out, p, lm[256]);
  return p + ll[256];
};
var deo = /* @__PURE__ */ new i32([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
var et = /* @__PURE__ */ new u8(0);
var dflt = function(dat, lvl, plvl, pre, post, st) {
  var s = st.z || dat.length;
  var o = new u8(pre + s + 5 * (1 + Math.ceil(s / 7e3)) + post);
  var w = o.subarray(pre, o.length - post);
  var lst = st.l;
  var pos = (st.r || 0) & 7;
  if (lvl) {
    if (pos)
      w[0] = st.r >> 3;
    var opt = deo[lvl - 1];
    var n = opt >> 13, c = opt & 8191;
    var msk_1 = (1 << plvl) - 1;
    var prev = st.p || new u16(32768), head = st.h || new u16(msk_1 + 1);
    var bs1_1 = Math.ceil(plvl / 3), bs2_1 = 2 * bs1_1;
    var hsh = function(i2) {
      return (dat[i2] ^ dat[i2 + 1] << bs1_1 ^ dat[i2 + 2] << bs2_1) & msk_1;
    };
    var syms = new i32(25e3);
    var lf = new u16(288), df = new u16(32);
    var lc_1 = 0, eb = 0, i = st.i || 0, li = 0, wi = st.w || 0, bs = 0;
    for (; i + 2 < s; ++i) {
      var hv = hsh(i);
      var imod = i & 32767, pimod = head[hv];
      prev[imod] = pimod;
      head[hv] = imod;
      if (wi <= i) {
        var rem = s - i;
        if ((lc_1 > 7e3 || li > 24576) && (rem > 423 || !lst)) {
          pos = wblk(dat, w, 0, syms, lf, df, eb, li, bs, i - bs, pos);
          li = lc_1 = eb = 0, bs = i;
          for (var j = 0; j < 286; ++j)
            lf[j] = 0;
          for (var j = 0; j < 30; ++j)
            df[j] = 0;
        }
        var l = 2, d = 0, ch_1 = c, dif = imod - pimod & 32767;
        if (rem > 2 && hv == hsh(i - dif)) {
          var maxn = Math.min(n, rem) - 1;
          var maxd = Math.min(32767, i);
          var ml = Math.min(258, rem);
          while (dif <= maxd && --ch_1 && imod != pimod) {
            if (dat[i + l] == dat[i + l - dif]) {
              var nl = 0;
              for (; nl < ml && dat[i + nl] == dat[i + nl - dif]; ++nl)
                ;
              if (nl > l) {
                l = nl, d = dif;
                if (nl > maxn)
                  break;
                var mmd = Math.min(dif, nl - 2);
                var md = 0;
                for (var j = 0; j < mmd; ++j) {
                  var ti = i - dif + j & 32767;
                  var pti = prev[ti];
                  var cd = ti - pti & 32767;
                  if (cd > md)
                    md = cd, pimod = ti;
                }
              }
            }
            imod = pimod, pimod = prev[imod];
            dif += imod - pimod & 32767;
          }
        }
        if (d) {
          syms[li++] = 268435456 | revfl[l] << 18 | revfd[d];
          var lin = revfl[l] & 31, din = revfd[d] & 31;
          eb += fleb[lin] + fdeb[din];
          ++lf[257 + lin];
          ++df[din];
          wi = i + l;
          ++lc_1;
        } else {
          syms[li++] = dat[i];
          ++lf[dat[i]];
        }
      }
    }
    for (i = Math.max(i, wi); i < s; ++i) {
      syms[li++] = dat[i];
      ++lf[dat[i]];
    }
    pos = wblk(dat, w, lst, syms, lf, df, eb, li, bs, i - bs, pos);
    if (!lst) {
      st.r = pos & 7 | w[pos / 8 | 0] << 3;
      pos -= 7;
      st.h = head, st.p = prev, st.i = i, st.w = wi;
    }
  } else {
    for (var i = st.w || 0; i < s + lst; i += 65535) {
      var e = i + 65535;
      if (e >= s) {
        w[pos / 8 | 0] = lst;
        e = s;
      }
      pos = wfblk(w, pos + 1, dat.subarray(i, e));
    }
    st.i = s;
  }
  return slc(o, 0, pre + shft(pos) + post);
};
var crct = /* @__PURE__ */ (function() {
  var t = new Int32Array(256);
  for (var i = 0; i < 256; ++i) {
    var c = i, k = 9;
    while (--k)
      c = (c & 1 && -306674912) ^ c >>> 1;
    t[i] = c;
  }
  return t;
})();
var crc = function() {
  var c = -1;
  return {
    p: function(d) {
      var cr = c;
      for (var i = 0; i < d.length; ++i)
        cr = crct[cr & 255 ^ d[i]] ^ cr >>> 8;
      c = cr;
    },
    d: function() {
      return ~c;
    }
  };
};
var dopt = function(dat, opt, pre, post, st) {
  if (!st) {
    st = { l: 1 };
    if (opt.dictionary) {
      var dict = opt.dictionary.subarray(-32768);
      var newDat = new u8(dict.length + dat.length);
      newDat.set(dict);
      newDat.set(dat, dict.length);
      dat = newDat;
      st.w = dict.length;
    }
  }
  return dflt(dat, opt.level == null ? 6 : opt.level, opt.mem == null ? st.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5) : 20 : 12 + opt.mem, pre, post, st);
};
var mrg = function(a, b) {
  var o = {};
  for (var k in a)
    o[k] = a[k];
  for (var k in b)
    o[k] = b[k];
  return o;
};
var b2 = function(d, b) {
  return d[b] | d[b + 1] << 8;
};
var b4 = function(d, b) {
  return (d[b] | d[b + 1] << 8 | d[b + 2] << 16 | d[b + 3] << 24) >>> 0;
};
var b8 = function(d, b) {
  return b4(d, b) + b4(d, b + 4) * 4294967296;
};
var wbytes = function(d, b, v) {
  for (; v; ++b)
    d[b] = v, v >>>= 8;
};
function deflateSync(data, opts) {
  return dopt(data, opts || {}, 0, 0);
}
function inflateSync(data, opts) {
  return inflt(data, { i: 2 }, opts && opts.out, opts && opts.dictionary);
}
var fltn = function(d, p, t, o) {
  for (var k in d) {
    var val = d[k], n = p + k, op = o;
    if (Array.isArray(val))
      op = mrg(o, val[1]), val = val[0];
    if (ArrayBuffer.isView(val))
      t[n] = [val, op];
    else {
      t[n += "/"] = [new u8(0), op];
      fltn(val, n, t, o);
    }
  }
};
var te = typeof TextEncoder != "undefined" && /* @__PURE__ */ new TextEncoder();
var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
var tds = 0;
try {
  td.decode(et, { stream: true });
  tds = 1;
} catch (e) {
}
var dutf8 = function(d) {
  for (var r = "", i = 0; ; ) {
    var c = d[i++];
    var eb = (c > 127) + (c > 223) + (c > 239);
    if (i + eb > d.length)
      return { s: r, r: slc(d, i - 1) };
    if (!eb)
      r += String.fromCharCode(c);
    else if (eb == 3) {
      c = ((c & 15) << 18 | (d[i++] & 63) << 12 | (d[i++] & 63) << 6 | d[i++] & 63) - 65536, r += String.fromCharCode(55296 | c >> 10, 56320 | c & 1023);
    } else if (eb & 1)
      r += String.fromCharCode((c & 31) << 6 | d[i++] & 63);
    else
      r += String.fromCharCode((c & 15) << 12 | (d[i++] & 63) << 6 | d[i++] & 63);
  }
};
function strToU8(str, latin1) {
  if (latin1) {
    var ar_1 = new u8(str.length);
    for (var i = 0; i < str.length; ++i)
      ar_1[i] = str.charCodeAt(i);
    return ar_1;
  }
  if (te)
    return te.encode(str);
  var l = str.length;
  var ar = new u8(str.length + (str.length >> 1));
  var ai = 0;
  var w = function(v) {
    ar[ai++] = v;
  };
  for (var i = 0; i < l; ++i) {
    if (ai + 5 > ar.length) {
      var n = new u8(ai + 8 + (l - i << 1));
      n.set(ar);
      ar = n;
    }
    var c = str.charCodeAt(i);
    if (c < 128 || latin1)
      w(c);
    else if (c < 2048)
      w(192 | c >> 6), w(128 | c & 63);
    else if (c > 55295 && c < 57344)
      c = 65536 + (c & 1023 << 10) | str.charCodeAt(++i) & 1023, w(240 | c >> 18), w(128 | c >> 12 & 63), w(128 | c >> 6 & 63), w(128 | c & 63);
    else
      w(224 | c >> 12), w(128 | c >> 6 & 63), w(128 | c & 63);
  }
  return slc(ar, 0, ai);
}
function strFromU8(dat, latin1) {
  if (latin1) {
    var r = "";
    for (var i = 0; i < dat.length; i += 16384)
      r += String.fromCharCode.apply(null, dat.subarray(i, i + 16384));
    return r;
  } else if (td) {
    return td.decode(dat);
  } else {
    var _a2 = dutf8(dat), s = _a2.s, r = _a2.r;
    if (r.length)
      err(8);
    return s;
  }
}
var slzh = function(d, b) {
  return b + 30 + b2(d, b + 26) + b2(d, b + 28);
};
var zh = function(d, b, z) {
  var fnl = b2(d, b + 28), efl = b2(d, b + 30), fn = strFromU8(d.subarray(b + 46, b + 46 + fnl), !(b2(d, b + 8) & 2048)), es = b + 46 + fnl;
  var _a2 = z64hs(d, es, efl, z, b4(d, b + 20), b4(d, b + 24), b4(d, b + 42)), sc = _a2[0], su = _a2[1], off = _a2[2];
  return [b2(d, b + 10), sc, su, fn, es + efl + b2(d, b + 32), off];
};
var z64hs = function(d, b, l, z, sc, su, off) {
  var nsc = sc == 4294967295, nsu = su == 4294967295, noff = off == 4294967295, e = b + l;
  var nf = nsc + nsu + noff;
  if (z && nf) {
    for (; b + 4 < e; b += 4 + b2(d, b + 2)) {
      if (b2(d, b) == 1) {
        return [
          nsc ? b8(d, b + 4 + 8 * nsu) : sc,
          nsu ? b8(d, b + 4) : su,
          noff ? b8(d, b + 4 + 8 * (nsu + nsc)) : off,
          1
        ];
      }
    }
    if (z < 2)
      err(13);
  }
  return [sc, su, off, 0];
};
var exfl = function(ex) {
  var le = 0;
  if (ex) {
    for (var k in ex) {
      var l = ex[k].length;
      if (l > 65535)
        err(9);
      le += l + 4;
    }
  }
  return le;
};
var wzh = function(d, b, f, fn, u, c, ce, co) {
  var fl2 = fn.length, ex = f.extra, col = co && co.length;
  var exl = exfl(ex);
  wbytes(d, b, ce != null ? 33639248 : 67324752), b += 4;
  if (ce != null)
    d[b++] = 20, d[b++] = f.os;
  d[b] = 20, b += 2;
  d[b++] = f.flag << 1 | (c < 0 && 8), d[b++] = u && 8;
  d[b++] = f.compression & 255, d[b++] = f.compression >> 8;
  var dt = new Date(f.mtime == null ? Date.now() : f.mtime), y = dt.getFullYear() - 1980;
  if (y < 0 || y > 119)
    err(10);
  wbytes(d, b, y << 25 | dt.getMonth() + 1 << 21 | dt.getDate() << 16 | dt.getHours() << 11 | dt.getMinutes() << 5 | dt.getSeconds() >> 1), b += 4;
  if (c != -1) {
    wbytes(d, b, f.crc);
    wbytes(d, b + 4, c < 0 ? -c - 2 : c);
    wbytes(d, b + 8, f.size);
  }
  wbytes(d, b + 12, fl2);
  wbytes(d, b + 14, exl), b += 16;
  if (ce != null) {
    wbytes(d, b, col);
    wbytes(d, b + 6, f.attrs);
    wbytes(d, b + 10, ce), b += 14;
  }
  d.set(fn, b);
  b += fl2;
  if (exl) {
    for (var k in ex) {
      var exf = ex[k], l = exf.length;
      wbytes(d, b, +k);
      wbytes(d, b + 2, l);
      d.set(exf, b + 4), b += 4 + l;
    }
  }
  if (col)
    d.set(co, b), b += col;
  return b;
};
var wzf = function(o, b, c, d, e) {
  wbytes(o, b, 101010256);
  wbytes(o, b + 8, c);
  wbytes(o, b + 10, c);
  wbytes(o, b + 12, d);
  wbytes(o, b + 16, e);
};
function zipSync(data, opts) {
  if (!opts)
    opts = {};
  var r = {};
  var files = [];
  fltn(data, "", r, opts);
  var o = 0;
  var tot = 0;
  for (var fn in r) {
    var _a2 = r[fn], file = _a2[0], p = _a2[1];
    var compression = p.level == 0 ? 0 : 8;
    var f = strToU8(fn), s = f.length;
    var com = p.comment, m = com && strToU8(com), ms = m && m.length;
    var exl = exfl(p.extra);
    if (s > 65535)
      err(11);
    var d = compression ? deflateSync(file, p) : file, l = d.length;
    var c = crc();
    c.p(file);
    files.push(mrg(p, {
      size: file.length,
      crc: c.d(),
      c: d,
      f,
      m,
      u: s != fn.length || m && com.length != ms,
      o,
      compression
    }));
    o += 30 + s + exl + l;
    tot += 76 + 2 * (s + exl) + (ms || 0) + l;
  }
  var out = new u8(tot + 22), oe = o, cdl = tot - o;
  for (var i = 0; i < files.length; ++i) {
    var f = files[i];
    wzh(out, f.o, f, f.f, f.u, f.c.length);
    var badd = 30 + f.f.length + exfl(f.extra);
    out.set(f.c, f.o + badd);
    wzh(out, o, f, f.f, f.u, f.c.length, f.o, f.m), o += 16 + badd + (f.m ? f.m.length : 0);
  }
  wzf(out, o, files.length, cdl, oe);
  return out;
}
function unzipSync(data, opts) {
  var files = {};
  var e = data.length - 22;
  for (; b4(data, e) != 101010256; --e) {
    if (!e || data.length - e > 65558)
      err(13);
  }
  ;
  var c = b2(data, e + 8);
  if (!c)
    return {};
  var o = b4(data, e + 16);
  var z = b4(data, e - 20) == 117853008;
  if (z) {
    var ze = b4(data, e - 12);
    z = b4(data, ze) == 101075792;
    if (z) {
      c = b4(data, ze + 32);
      o = b4(data, ze + 48);
    }
  }
  var fltr = opts && opts.filter;
  for (var i = 0; i < c; ++i) {
    var _a2 = zh(data, o, z), c_2 = _a2[0], sc = _a2[1], su = _a2[2], fn = _a2[3], no = _a2[4], off = _a2[5], b = slzh(data, off);
    o = no;
    if (!fltr || fltr({
      name: fn,
      size: sc,
      originalSize: su,
      compression: c_2
    })) {
      if (!c_2)
        files[fn] = slc(data, b, b + sc);
      else if (c_2 == 8)
        files[fn] = inflateSync(data.subarray(b, b + sc), { out: new u8(su) });
      else
        err(14, "unknown compression type " + c_2);
    }
  }
  return files;
}

// server/storage.mjs
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
var uid = () => randomUUID();
var now = () => (/* @__PURE__ */ new Date()).toISOString();
var types = ["\u897F\u88C5\u4E0A\u8863", "\u886C\u886B", "\u897F\u88E4", "\u8FDE\u8863\u88D9", "\u5A5A\u7EB1\u793C\u670D", "\u71D5\u5C3E\u670D", "T\u6064\u886B"];
function validateDocument(d) {
  if (!d || typeof d !== "object" || !Array.isArray(d.items) || d.items.length > 500) throw Error("\u4FEE\u6539\u9879\u76EE\u683C\u5F0F\u65E0\u6548\u6216\u8D85\u8FC7 500 \u9879");
  for (const k of ["number", "customer", "type", "name", "date", "operator", "note"]) if (typeof d[k] !== "string" || d[k].length > (k === "note" ? 5e3 : 200)) throw Error("\u57FA\u672C\u8D44\u6599\u683C\u5F0F\u65E0\u6548");
  if (!d.number.trim() || !d.customer.trim() || !types.includes(d.type) || !/^\d{4}-\d{2}-\d{2}$/.test(d.date)) throw Error("\u8BF7\u586B\u5199\u7F16\u53F7\u3001\u5BA2\u6237\u3001\u670D\u88C5\u7C7B\u578B\u548C\u6709\u6548\u65E5\u671F");
  if (d.templateVersion !== 1) throw Error("\u670D\u88C5\u6A21\u677F\u7248\u672C\u4E0D\u652F\u6301");
  if (d.contact != null && (typeof d.contact !== "string" || d.contact.length > 200)) throw Error("\u8054\u7CFB\u65B9\u5F0F\u683C\u5F0F\u65E0\u6548");
  const ids = /* @__PURE__ */ new Set(), numbers = /* @__PURE__ */ new Set();
  for (const i of d.items) {
    if (!i || typeof i.id !== "string" || ids.has(i.id) || !Number.isInteger(i.number) || i.number < 1 || numbers.has(i.number)) throw Error("\u4FEE\u6539\u9879\u76EE\u7F16\u53F7\u91CD\u590D\u6216\u65E0\u6548");
    ids.add(i.id);
    numbers.add(i.number);
    if (!["front", "back"].includes(i.view) || !Number.isFinite(i.x) || !Number.isFinite(i.y) || i.x < 0 || i.x > 1 || i.y < 0 || i.y > 1) throw Error("\u6807\u8BB0\u5750\u6807\u8D85\u51FA\u56FE\u7EB8");
    if (!["\u5F85\u5904\u7406", "\u4FEE\u6539\u4E2D", "\u5DF2\u5B8C\u6210", "\u9700\u590D\u6838"].includes(i.status) || !["cm", "mm", "in"].includes(i.unit)) throw Error("\u9879\u76EE\u72B6\u6001\u6216\u5355\u4F4D\u65E0\u6548");
    for (const k of ["part", "action", "value", "note", "basis"]) if (typeof i[k] !== "string" || i[k].length > 5e3) throw Error("\u4FEE\u6539\u9879\u76EE\u6587\u5B57\u65E0\u6548");
    if (i.value && !/^\d{1,5}(\.\d{1,3})?$/.test(i.value)) throw Error("\u4FEE\u6539\u6570\u503C\u9700\u4E3A\u975E\u8D1F\u6570\u5B57\uFF0C\u6700\u591A\u4E09\u4F4D\u5C0F\u6570");
    if (typeof i.cancelled !== "boolean") throw Error("\u4FEE\u6539\u9879\u76EE\u53D6\u6D88\u72B6\u6001\u65E0\u6548");
  }
  if (!Array.isArray(d.photos) || d.photos.length > 100) throw Error("\u7167\u7247\u6570\u91CF\u8D85\u8FC7\u9650\u5236");
  for (const p of d.photos) {
    if (!p || typeof p.id !== "string" || !/^photos\/[a-f0-9-]+\.(jpg|png|webp)$/.test(p.path) || !Array.isArray(p.annotations) || p.annotations.length > 300 || typeof p.note !== "string" || p.note.length > 5e3) throw Error("\u7167\u7247\u8BB0\u5F55\u65E0\u6548");
    for (const a of p.annotations) {
      if (!a || typeof a.id !== "string" || typeof a.text !== "string" || a.text.length > 5e3 || !Array.isArray(a.itemIds) || a.itemIds.some((id) => !ids.has(id))) throw Error("\u7167\u7247\u6807\u6CE8\u5173\u8054\u65E0\u6548");
      for (const k of ["x", "y", "w", "h"]) if (!Number.isFinite(a[k]) || a[k] < 0 || a[k] > 1) throw Error("\u7167\u7247\u533A\u57DF\u5750\u6807\u65E0\u6548");
      if (a.x + a.w > 1.001 || a.y + a.h > 1.001) throw Error("\u7167\u7247\u533A\u57DF\u8D85\u51FA\u56FE\u7247");
    }
  }
}
function openStore(root2) {
  for (const d of ["database", "photos", "exports", "logs"]) mkdirSync(path.join(root2, d), { recursive: true });
  const db = new DatabaseSync(path.join(root2, "database", "fitnote.db"));
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY, number TEXT NOT NULL UNIQUE, archived INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS versions(id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id), seq INTEGER NOT NULL, parent_id TEXT REFERENCES versions(id), state TEXT NOT NULL DEFAULT 'draft' CHECK(state IN ('draft','final')), revision INTEGER NOT NULL DEFAULT 1, document TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(order_id,seq));
    CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
    INSERT OR IGNORE INTO migrations VALUES(1,datetime('now'));`);
  const read = (v) => v ? { ...v, document: JSON.parse(v.document) } : null;
  const version = (id) => read(db.prepare("SELECT * FROM versions WHERE id=?").get(id));
  const tx = (fn) => {
    db.exec("BEGIN IMMEDIATE");
    try {
      const r = fn();
      db.exec("COMMIT");
      return r;
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  };
  const deletionInfo = (id) => {
    const order = db.prepare("SELECT * FROM orders WHERE id=?").get(id);
    if (!order) throw Error("\u4FEE\u6539\u5355\u4E0D\u5B58\u5728");
    if (!order.archived) throw Error("\u8BF7\u5148\u5F52\u6863\u4FEE\u6539\u5355\uFF0C\u518D\u6267\u884C\u5220\u9664");
    return { number: order.number, stamp: JSON.stringify([order, db.prepare("SELECT id,revision,seq FROM versions WHERE order_id=? ORDER BY seq").all(id)]) };
  };
  return {
    db,
    version,
    deletionInfo,
    deleteArchived(id, expectedStamp) {
      return tx(() => {
        const current = deletionInfo(id);
        if (current.stamp !== expectedStamp) throw Error("\u5355\u636E\u5DF2\u53D1\u751F\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00\u540E\u91CD\u8BD5");
        const photos = [...new Set(db.prepare("SELECT document FROM versions WHERE order_id=?").all(id).flatMap((v) => JSON.parse(v.document).photos.map((p) => p.path)))];
        db.prepare("DELETE FROM versions WHERE order_id=?").run(id);
        db.prepare("DELETE FROM orders WHERE id=?").run(id);
        return { number: current.number, photos };
      });
    },
    list() {
      return db.prepare(`SELECT o.*,v.id as version_id,v.seq,v.state,v.document FROM orders o JOIN versions v ON v.order_id=o.id WHERE v.seq=(SELECT MAX(seq) FROM versions WHERE order_id=o.id) ORDER BY o.updated_at DESC`).all().map((x) => ({ ...x, document: JSON.parse(x.document) }));
    },
    history(id) {
      return db.prepare("SELECT * FROM versions WHERE order_id=? ORDER BY seq DESC").all(id).map(read);
    },
    create(d) {
      validateDocument(d);
      return tx(() => {
        const id = uid(), vid = uid(), t = now();
        db.prepare("INSERT INTO orders VALUES(?,?,0,?,?)").run(id, d.number, t, t);
        db.prepare("INSERT INTO versions VALUES(?,?,1,NULL,'draft',1,?,?,?)").run(vid, id, JSON.stringify(d), t, t);
        return version(vid);
      });
    },
    save(id, d, revision) {
      validateDocument(d);
      return tx(() => {
        const v = version(id);
        if (!v) throw Error("\u4FEE\u6539\u5355\u4E0D\u5B58\u5728");
        if (v.state !== "draft") throw Error("\u5386\u53F2\u5B9A\u7A3F\u4E0D\u53EF\u4FEE\u6539\uFF0C\u8BF7\u521B\u5EFA\u65B0\u8BD5\u8863\u7248\u672C");
        if (v.revision !== revision) throw Error("\u8BB0\u5F55\u5DF2\u5728\u5176\u4ED6\u7A97\u53E3\u66F4\u65B0\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00\u540E\u7F16\u8F91");
        const t = now();
        db.prepare("UPDATE orders SET number=?,updated_at=? WHERE id=?").run(d.number, t, v.order_id);
        db.prepare("UPDATE versions SET document=?,revision=revision+1,updated_at=? WHERE id=?").run(JSON.stringify(d), t, id);
        return version(id);
      });
    },
    finalize(id, revision) {
      return tx(() => {
        const v = version(id);
        if (!v || v.revision !== revision) throw Error("\u4FDD\u5B58\u7248\u672C\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00");
        if (v.state === "final") return v;
        db.prepare("UPDATE versions SET state='final', revision=revision+1,updated_at=? WHERE id=?").run(now(), id);
        return version(id);
      });
    },
    next(id) {
      return tx(() => {
        const v = version(id);
        if (!v || v.state !== "final") throw Error("\u8BF7\u5148\u5B9A\u7A3F\u5F53\u524D\u8BD5\u8863\u8BB0\u5F55");
        if (db.prepare("SELECT MAX(seq) as n FROM versions WHERE order_id=?").get(v.order_id).n !== v.seq) throw Error("\u8BF7\u4ECE\u6700\u65B0\u7248\u672C\u521B\u5EFA\u65B0\u8BD5\u8863");
        const vid = uid(), t = now(), d = structuredClone(v.document);
        d.date = (/* @__PURE__ */ new Date()).toLocaleDateString("sv-SE");
        db.prepare("INSERT INTO versions VALUES(?,?,?,?,'draft',1,?,?,?)").run(vid, v.order_id, v.seq + 1, id, JSON.stringify(d), t, t);
        db.prepare("UPDATE orders SET updated_at=? WHERE id=?").run(t, v.order_id);
        return version(vid);
      });
    },
    archive(id, archived) {
      db.prepare("UPDATE orders SET archived=?,updated_at=? WHERE id=?").run(archived ? 1 : 0, now(), id);
    },
    settings() {
      return Object.fromEntries(db.prepare("SELECT * FROM settings").all().map((x) => [x.key, JSON.parse(x.value)]));
    },
    setSettings(s) {
      tx(() => {
        for (const k of ["studio", "unit", "header", "locale"]) if (k in s) {
          if (typeof s[k] !== "string" || s[k].length > 500) throw Error("\u8BBE\u7F6E\u5185\u5BB9\u65E0\u6548");
          if (k === "locale" && !["zh-CN", "en-US"].includes(s[k])) throw Error("\u8BED\u8A00\u8BBE\u7F6E\u65E0\u6548");
          if (k === "unit" && !["cm", "mm", "in"].includes(s[k])) throw Error("\u5355\u4F4D\u65E0\u6548");
          db.prepare("INSERT INTO settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(k, JSON.stringify(s[k]));
        }
      });
    }
  };
}

// server/manual-backups.mjs
var hash = (b) => createHash("sha256").update(b).digest("hex");
var photo = (p) => /^photos\/[a-f0-9-]+\.(jpg|png|webp)$/.test(p);
var validName = (n) => typeof n === "string" && /^衣改备份_[0-9T_-]+_[a-f0-9]{8}\.fitbackup$/.test(n);
var capacity = "\u5907\u4EFD\u8D85\u51FA\u5BB9\u91CF\u9650\u5236\uFF08\u6587\u4EF6 200MB\uFF0C\u539F\u59CB\u6570\u636E 400MB\uFF09";
function fileError(e) {
  if (["ENOSPC", "EDQUOT"].includes(e.code)) return Error("\u78C1\u76D8\u7A7A\u95F4\u4E0D\u8DB3\uFF0C\u64CD\u4F5C\u672A\u5B8C\u6210");
  if (["EACCES", "EPERM", "EROFS"].includes(e.code)) return Error("\u76EE\u5F55\u4E0D\u53EF\u5199\u6216\u6743\u9650\u4E0D\u8DB3\uFF0C\u64CD\u4F5C\u672A\u5B8C\u6210");
  return e;
}
function manualBackups(root2, store2) {
  const dir = path2.join(root2, "backups");
  function directory(create2 = false) {
    if (create2) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(dir)) return false;
    const stat = fs.lstatSync(dir);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw Error("\u5907\u4EFD\u76EE\u5F55\u65E0\u6548");
    return true;
  }
  function target(name) {
    if (!validName(name)) throw Error("\u5907\u4EFD\u6587\u4EF6\u540D\u65E0\u6548");
    if (!directory()) throw Error("\u5907\u4EFD\u6587\u4EF6\u4E0D\u5B58\u5728");
    const p = path2.join(dir, name);
    if (!fs.existsSync(p) || !fs.lstatSync(p).isFile() || fs.lstatSync(p).isSymbolicLink()) throw Error("\u5907\u4EFD\u6587\u4EF6\u4E0D\u5B58\u5728");
    return p;
  }
  function decode(bytes) {
    if (bytes.length > 200 * 1024 * 1024) throw Error(capacity);
    let size = 0, count = 0, files;
    try {
      files = unzipSync(bytes, { filter: (f) => {
        size += f.originalSize;
        count++;
        if (size > 400 * 1024 * 1024 || count > 1e4) throw Error(capacity);
        return true;
      } });
    } catch (e) {
      if (e.message === capacity) throw e;
      throw Error("\u4E0D\u662F\u6709\u6548\u7684\u8863\u6539\u5907\u4EFD\u6587\u4EF6");
    }
    if (!files["manifest.json"] || !files["database/fitnote.db"]) throw Error("\u4E0D\u662F\u6709\u6548\u7684\u8863\u6539\u5907\u4EFD\u6587\u4EF6");
    let m;
    try {
      m = JSON.parse(strFromU8(files["manifest.json"]));
    } catch {
      throw Error("\u5907\u4EFD\u6587\u4EF6\u6821\u9A8C\u5931\u8D25");
    }
    if (m.format !== "fitnote-business-backup" || m.version !== 1 || !m.files || typeof m.files !== "object" || Array.isArray(m.files)) throw Error("\u5907\u4EFD\u7248\u672C\u4E0D\u652F\u6301");
    for (const [p, b] of Object.entries(files)) {
      if (p === "manifest.json") continue;
      if (p !== "database/fitnote.db" && !photo(p)) throw Error("\u5907\u4EFD\u5305\u542B\u4E0D\u5141\u8BB8\u7684\u8DEF\u5F84");
      if (m.files[p] !== hash(b)) throw Error("\u5907\u4EFD\u6587\u4EF6\u6821\u9A8C\u5931\u8D25");
    }
    for (const p of Object.keys(m.files)) if (!files[p] || p === "manifest.json") throw Error("\u5907\u4EFD\u6587\u4EF6\u4E0D\u5B8C\u6574");
    return files;
  }
  async function create() {
    directory(true);
    if (fs.lstatSync(path2.join(root2, "photos")).isSymbolicLink()) throw Error("\u7167\u7247\u8DEF\u5F84\u65E0\u6548");
    const temp = path2.join(dir, uid() + ".db"), partial = path2.join(dir, uid() + ".partial");
    try {
      await backup(store2.db, temp);
      const files = { "database/fitnote.db": new Uint8Array(fs.readFileSync(temp)) };
      let size = files["database/fitnote.db"].length, count = 1;
      const snapshot = new DatabaseSync2(temp, { readOnly: true });
      try {
        for (const row of snapshot.prepare("SELECT document FROM versions").all()) for (const p of JSON.parse(row.document).photos) {
          if (!photo(p.path)) throw Error("\u7167\u7247\u8DEF\u5F84\u65E0\u6548");
          if (files[p.path]) continue;
          const actual = path2.join(root2, p.path);
          if (!fs.existsSync(actual)) throw Error("\u7167\u7247\u9644\u4EF6\u7F3A\u5931\uFF0C\u65E0\u6CD5\u5B8C\u6210\u5907\u4EFD");
          const st = fs.lstatSync(actual);
          if (!st.isFile() || st.isSymbolicLink() || fs.realpathSync(path2.dirname(actual)) !== fs.realpathSync(path2.join(root2, "photos"))) throw Error("\u7167\u7247\u8DEF\u5F84\u65E0\u6548");
          size += st.size;
          count++;
          if (size > 400 * 1024 * 1024 || count > 9999) throw Error(capacity);
          files[p.path] = new Uint8Array(fs.readFileSync(actual));
        }
      } finally {
        snapshot.close();
      }
      files["manifest.json"] = strToU8(JSON.stringify({ format: "fitnote-business-backup", version: 1, createdAt: (/* @__PURE__ */ new Date()).toISOString(), files: Object.fromEntries(Object.entries(files).map(([p, b]) => [p, hash(b)])) }));
      if (size + files["manifest.json"].length > 400 * 1024 * 1024) throw Error(capacity);
      const bytes = zipSync(files, { level: 1 });
      if (bytes.length > 200 * 1024 * 1024) throw Error(capacity);
      fs.writeFileSync(partial, bytes, { flag: "wx" });
      decode(fs.readFileSync(partial));
      const date = /* @__PURE__ */ new Date(), pad = (n) => String(n).padStart(2, "0");
      const stamp = [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join("-") + "_" + [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join("");
      const name = `\u8863\u6539\u5907\u4EFD_${stamp}_${uid().slice(0, 8)}.fitbackup`;
      fs.renameSync(partial, path2.join(dir, name));
      return { name, size: bytes.length };
    } catch (e) {
      throw fileError(e);
    } finally {
      for (const p of [temp, temp + "-shm", temp + "-wal", partial]) fs.rmSync(p, { force: true });
    }
  }
  function list() {
    if (!directory()) return [];
    return fs.readdirSync(dir).filter(validName).flatMap((name) => {
      try {
        const s = fs.lstatSync(path2.join(dir, name));
        return s.isFile() && !s.isSymbolicLink() ? [{ name, size: s.size, createdAt: s.mtime.toISOString() }] : [];
      } catch (e) {
        if (e.code === "ENOENT") return [];
        throw e;
      }
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async function restore(bytes) {
    const files = decode(bytes);
    if (fs.lstatSync(path2.join(root2, "photos")).isSymbolicLink()) throw Error("\u7167\u7247\u8DEF\u5F84\u65E0\u6548");
    const temp = path2.join(root2, "database", uid() + ".restore-db");
    let candidate, attached = false, committed = false;
    const copied = [];
    try {
      fs.writeFileSync(temp, files["database/fitnote.db"], { flag: "wx" });
      candidate = new DatabaseSync2(temp, { readOnly: true });
      candidate.exec("PRAGMA trusted_schema=OFF");
      if (candidate.prepare("PRAGMA integrity_check").get().integrity_check !== "ok" || candidate.prepare("PRAGMA foreign_key_check").all().length) throw Error("\u6570\u636E\u5E93\u5B8C\u6574\u6027\u6821\u9A8C\u5931\u8D25");
      const migrations = candidate.prepare("SELECT version FROM migrations").all();
      if (migrations.length !== 1 || migrations[0].version !== 1) throw Error("\u6570\u636E\u5E93\u7248\u672C\u4E0D\u652F\u6301");
      for (const t of ["orders", "versions", "settings"]) {
        const expected = store2.db.prepare(`PRAGMA table_info(${t})`).all().map((x) => x.name);
        const actual = candidate.prepare(`PRAGMA table_info(${t})`).all().map((x) => x.name);
        if (JSON.stringify(expected) !== JSON.stringify(actual)) throw Error("\u6570\u636E\u5E93\u7248\u672C\u4E0D\u652F\u6301");
      }
      for (const row of candidate.prepare("SELECT document FROM versions").all()) {
        const d = JSON.parse(row.document);
        validateDocument(d);
        for (const p of d.photos) if (!files[p.path]) throw Error("\u5907\u4EFD\u7F3A\u5C11\u7167\u7247\u9644\u4EF6");
      }
      for (const { key, value } of candidate.prepare("SELECT * FROM settings").all()) {
        const v = JSON.parse(value);
        if (!["studio", "unit", "header", "locale"].includes(key) || typeof v !== "string" || v.length > 500 || key === "unit" && !["cm", "mm", "in"].includes(v) || key === "locale" && !["zh-CN", "en-US"].includes(v)) throw Error("\u8BBE\u7F6E\u5185\u5BB9\u65E0\u6548");
      }
      candidate.close();
      candidate = null;
      for (const [p, b] of Object.entries(files)) if (photo(p)) {
        const dest = path2.join(root2, p);
        if (fs.existsSync(dest)) {
          const st = fs.lstatSync(dest);
          if (st.isSymbolicLink() || !st.isFile() || hash(fs.readFileSync(dest)) !== hash(b)) throw Error("\u9644\u4EF6\u4E0E\u672C\u673A\u6587\u4EF6\u51B2\u7A81\uFF0C\u6062\u590D\u5DF2\u53D6\u6D88");
        } else {
          const fd2 = fs.openSync(dest, "wx");
          copied.push(dest);
          try {
            fs.writeFileSync(fd2, b);
          } finally {
            fs.closeSync(fd2);
          }
        }
      }
      store2.db.prepare("ATTACH DATABASE ? AS restored").run(temp);
      attached = true;
      store2.db.exec("BEGIN IMMEDIATE");
      try {
        const oldRevision = store2.db.prepare("SELECT COALESCE(MAX(revision),0) AS n FROM versions").get().n;
        store2.db.exec("DELETE FROM versions;DELETE FROM orders;DELETE FROM settings;INSERT INTO orders SELECT * FROM restored.orders;INSERT INTO versions SELECT * FROM restored.versions ORDER BY seq;INSERT INTO settings SELECT * FROM restored.settings;");
        store2.db.prepare("UPDATE versions SET revision=revision+?").run(oldRevision + 1);
        store2.db.exec("COMMIT");
        committed = true;
      } catch (e) {
        store2.db.exec("ROLLBACK");
        throw e;
      }
      return { ok: true };
    } catch (e) {
      throw fileError(e);
    } finally {
      candidate?.close();
      if (attached) store2.db.exec("DETACH DATABASE restored");
      if (!committed) for (const p of copied) fs.rmSync(p, { force: true });
      for (const p of [temp, temp + "-shm", temp + "-wal"]) fs.rmSync(p, { force: true });
    }
  }
  return { create, list, restore, directory: () => directory(false) ? dir : null, resolve: target, remove(name) {
    try {
      fs.unlinkSync(target(name));
      return { ok: true };
    } catch (e) {
      throw fileError(e);
    }
  } };
}

// server/index.mjs
import fs2 from "node:fs";
import path3 from "node:path";
import { fileURLToPath } from "node:url";
var appRoot = path3.resolve(path3.dirname(fileURLToPath(import.meta.url)), "..");
var root = process.env.TOPARROW_DATA_DIR;
var port = Number(process.env.TOPARROW_APP_PORT);
if (!root || !path3.isAbsolute(root) || !Number.isInteger(port) || port < 1 || port > 65535) throw Error("\u8BF7\u4ECE\u9876\u7BAD\u542F\u52A8\uFF1A\u9700\u8981\u6709\u6548\u7684 TOPARROW_DATA_DIR \u548C TOPARROW_APP_PORT");
var store = openStore(root);
var backups = manualBackups(root, store);
var maintenance = false;
function ready() {
  if (maintenance) throw Error("\u6B63\u5728\u5907\u4EFD\u6216\u6062\u590D\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
}
async function exclusive(fn) {
  ready();
  maintenance = true;
  try {
    return await fn();
  } finally {
    maintenance = false;
  }
}
async function openBackupFolder(name) {
  const file = backups.resolve(name);
  const runtime = process.env.TOPARROW_RUNTIME_DIR || path3.resolve(path3.dirname(process.execPath), process.platform === "darwin" ? "../.." : "..");
  const executable = process.platform === "darwin" ? path3.join(runtime, "electron", "Electron.app", "Contents", "MacOS", "Electron") : process.platform === "win32" ? path3.join(runtime, "electron", "electron.exe") : null;
  if (!executable || !fs2.existsSync(executable)) throw Error("\u9876\u7BAD\u684C\u9762\u8FD0\u884C\u65F6\u4E0D\u53EF\u7528\uFF0C\u65E0\u6CD5\u6253\u5F00\u76EE\u5F55");
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  await promisify(execFile)(executable, [path3.join(appRoot, "server", "open-folder.cjs"), path3.dirname(file)], { cwd: root, env, timeout: 2e4, windowsHide: true });
  return { ok: true };
}
var safePhoto = (p) => typeof p === "string" && /^photos\/[a-f0-9-]+\.(jpg|png|webp)$/.test(p);
var send = (res, status, data, type = "application/json; charset=utf-8") => {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" });
  res.end(type.startsWith("application/json") ? JSON.stringify(data) : data);
};
async function body(req, max2 = 45 * 1024 * 1024) {
  const parts = [];
  let n = 0;
  for await (const b of req) {
    n += b.length;
    if (n > max2) throw Error("\u6587\u4EF6\u8D85\u8FC7\u5927\u5C0F\u9650\u5236");
    parts.push(b);
  }
  return Buffer.concat(parts);
}
var json = async (req) => {
  const value = JSON.parse((await body(req)).toString("utf8"));
  ready();
  return value;
};
var mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".ttf": "font/ttf", ".otf": "font/otf", ".woff2": "font/woff2", ".woff": "font/woff", ".txt": "text/plain; charset=utf-8" };
var server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost"), p = url.pathname;
    if (!/^((127\.0\.0\.1|localhost)(:\d+)?)$/.test(req.headers.host || "")) return send(res, 403, { error: "\u8BF7\u6C42\u5730\u5740\u65E0\u6548" });
    if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) return send(res, 403, { error: "\u7981\u6B62\u8DE8\u7AD9\u8BF7\u6C42" });
    if (p === "/__health") return send(res, 200, { ok: true });
    if (p.startsWith("/api/")) {
      ready();
      if (req.method !== "GET" && req.headers["x-fitnote-request"] !== "local") return send(res, 403, { error: "\u8BF7\u6C42\u6821\u9A8C\u5931\u8D25" });
      if (p === "/api/bootstrap" && req.method === "GET") return send(res, 200, { orders: store.list(), settings: store.settings(), dataDir: root, appVersion: package_default.version });
      if (p === "/api/backups" && req.method === "GET") return send(res, 200, backups.list());
      if (p === "/api/backups" && req.method === "POST") {
        await json(req);
        return send(res, 201, await exclusive(() => backups.create()));
      }
      if (p === "/api/backups/import" && req.method === "POST") {
        const bytes = await body(req, 200 * 1024 * 1024);
        ready();
        return send(res, 200, await exclusive(() => backups.restore(bytes)));
      }
      const backupMatch = p.match(/^\/api\/backups\/([^/]+)(?:\/(open-folder))?$/);
      if (backupMatch) {
        const name = decodeURIComponent(backupMatch[1]);
        if (req.method === "DELETE" && !backupMatch[2]) return send(res, 200, backups.remove(name));
        if (req.method === "POST" && backupMatch[2]) return send(res, 200, await openBackupFolder(name));
      }
      if (p === "/api/orders" && req.method === "POST") return send(res, 201, store.create(await json(req)));
      let match = p.match(/^\/api\/versions\/([a-f0-9-]+)(?:\/(finalize|next))?$/);
      if (match) {
        const [, id, action] = match;
        if (req.method === "GET" && !action) {
          const v = store.version(id);
          return send(res, v ? 200 : 404, v || { error: "\u4FEE\u6539\u5355\u4E0D\u5B58\u5728" });
        }
        if (req.method === "PUT" && !action) {
          const b = await json(req);
          return send(res, 200, store.save(id, b.document, b.revision));
        }
        if (req.method === "POST" && action === "finalize") return send(res, 200, store.finalize(id, (await json(req)).revision));
        if (req.method === "POST" && action === "next") return send(res, 201, store.next(id));
      }
      match = p.match(/^\/api\/orders\/([a-f0-9-]+)\/(history|archive)$/);
      if (match && match[2] === "history" && req.method === "GET") return send(res, 200, store.history(match[1]));
      if (match && match[2] === "archive" && req.method === "POST") {
        store.archive(match[1], (await json(req)).archived);
        return send(res, 200, { ok: true });
      }
      const deleteMatch = p.match(/^\/api\/orders\/([a-f0-9-]+)$/);
      if (deleteMatch && req.method === "DELETE") {
        const request = await json(req);
        const info = store.deletionInfo(deleteMatch[1]);
        if (request.number !== info.number) throw Error("\u4FEE\u6539\u5355\u7F16\u53F7\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00\u540E\u5220\u9664");
        const deleted = store.deleteArchived(deleteMatch[1], info.stamp);
        const used = new Set(store.db.prepare("SELECT document FROM versions").all().flatMap((v) => JSON.parse(v.document).photos.map((p2) => p2.path)));
        let cleanupWarnings = 0;
        for (const photo2 of deleted.photos) if (!used.has(photo2)) {
          try {
            if (!safePhoto(photo2)) throw Error("\u7167\u7247\u8DEF\u5F84\u65E0\u6548");
            fs2.rmSync(path3.join(root, photo2), { force: true });
          } catch {
            cleanupWarnings++;
          }
        }
        return send(res, 200, { number: deleted.number, cleanupWarnings });
      }
      if (p === "/api/settings" && req.method === "PUT") {
        store.setSettings(await json(req));
        return send(res, 200, store.settings());
      }
      if (p === "/api/photos" && req.method === "POST") {
        const b = await body(req, 15 * 1024 * 1024);
        ready();
        let ext;
        if (b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ext = "png";
        else if (b[0] === 255 && b[1] === 216 && b[2] === 255) ext = "jpg";
        else if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") ext = "webp";
        else throw Error("\u4EC5\u652F\u6301\u6709\u6548\u7684 JPG\u3001PNG\u3001WebP \u7167\u7247");
        const rel2 = `photos/${uid()}.${ext}`;
        fs2.writeFileSync(path3.join(root, rel2), b);
        return send(res, 201, { path: rel2 });
      }
      if (p === "/api/photo" && req.method === "GET") {
        const rel2 = url.searchParams.get("path");
        if (!safePhoto(rel2) || !fs2.existsSync(path3.join(root, rel2))) return send(res, 404, { error: "\u7167\u7247\u6587\u4EF6\u5DF2\u4E22\u5931" });
        return send(res, 200, fs2.readFileSync(path3.join(root, rel2)), mime[path3.extname(rel2)]);
      }
      if (p === "/api/export" && req.method === "POST") {
        const b = await json(req);
        if (typeof b.pdf !== "string" || b.pdf.length > 55 * 1024 * 1024) throw Error("PDF \u6587\u4EF6\u8FC7\u5927");
        const bytes = Buffer.from(b.pdf, "base64");
        if (bytes.toString("ascii", 0, 5) !== "%PDF-") throw Error("PDF \u6587\u4EF6\u65E0\u6548");
        const name = String(b.name || "\u4FEE\u6539\u5355.pdf").replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").slice(0, 150).replace(/\.pdf$/i, "") + ".pdf";
        const temp = path3.join(root, "exports", `${uid()}.tmp`), dest = path3.join(root, "exports", name);
        fs2.writeFileSync(temp, bytes);
        fs2.renameSync(temp, dest);
        return send(res, 200, { name });
      }
      return send(res, 404, { error: "\u63A5\u53E3\u4E0D\u5B58\u5728" });
    }
    if (req.method !== "GET") return send(res, 405, { error: "\u4E0D\u652F\u6301\u6B64\u64CD\u4F5C" });
    const build = path3.join(appRoot, "build");
    let rel = decodeURIComponent(p).replace(/^\/+/, ""), file = path3.resolve(build, rel || "index.html");
    if (!file.startsWith(build + path3.sep)) return send(res, 403, { error: "\u8DEF\u5F84\u65E0\u6548" });
    if (!fs2.existsSync(file)) {
      if (path3.extname(rel)) return send(res, 404, { error: "\u8D44\u6E90\u4E0D\u5B58\u5728" });
      file = path3.join(build, "index.html");
    }
    if (!fs2.existsSync(file) || !fs2.statSync(file).isFile()) return send(res, 404, { error: "\u8BF7\u5148\u6784\u5EFA\u5E94\u7528" });
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self'; frame-src 'self' blob:; worker-src 'self' blob:; object-src blob:; base-uri 'none'; frame-ancestors 'self'");
    return send(res, 200, fs2.readFileSync(file), mime[path3.extname(file)] || "application/octet-stream");
  } catch (error) {
    const e = fileError(error);
    console.error((/* @__PURE__ */ new Date()).toISOString(), e.message);
    if (!res.headersSent) send(res, 400, { error: /UNIQUE constraint/.test(e.message) ? "\u4FEE\u6539\u5355\u7F16\u53F7\u5DF2\u5B58\u5728\uFF0C\u8BF7\u66F4\u6362\u7F16\u53F7" : e.message || "\u64CD\u4F5C\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5" });
    else res.end();
  }
});
server.listen(port, "127.0.0.1", () => console.log(`FitNote ready on 127.0.0.1:${port}`));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close(() => {
  store.db.close();
  process.exit(0);
}));
