export default {
    svgURL(uml) {
        return this.compress(uml)
    },
    encode64_(e) {
        let r, i;
        for (r = "", i = 0; i < e.length; i += 3)
            i + 2 == e.length ? r += this.append3bytes(e[i], e[i + 1], 0) : i + 1 == e.length ? r += this.append3bytes(e[i], 0, 0) : r += this.append3bytes(e[i], e[i + 1], e[i + 2]);
        return r;
    },
    append3bytes(e, n, t) {
        let c1, c2, c3, c4, r;
        return c1 = e >> 2,
            c2 = (3 & e) << 4 | n >> 4,
            c3 = (15 & n) << 2 | t >> 6,
            c4 = 63 & t,
            r = "",
            r += this.encode6bit(63 & c1),
            r += this.encode6bit(63 & c2),
            r += this.encode6bit(63 & c3),
            r += this.encode6bit(63 & c4),
            r;
    },
    encode6bit(e) {
        return e < 10 ? String.fromCharCode(48 + e) : (e -= 10) < 26 ? String.fromCharCode(65 + e) : (e -= 26) < 26 ? String.fromCharCode(97 + e) : 0 == (e -= 26) ? "-" : 1 == e ? "_" : "?"
    },
    compress(s) {
        s = unescape(encodeURIComponent(s));
        let arr = [];
        for (var i = 0; i < s.length; i++) {
            arr.push(s.charCodeAt(i));
        }
        // eslint-disable-next-line no-undef
        let compressor = new Zopfli.RawDeflate(arr);
        let compressed = compressor.compress();
        return "http://www.plantuml.com/plantuml/svg/" + this.encode64_(compressed);
    }
};
