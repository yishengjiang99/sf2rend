registerPaint(
  "connections",
  class {
    static get inputProperties() {
      return [
        "--connections-particleColor",
        "--connections-lineColor",
        "--connections-particleAmount",
        "--connections-defaultRadius",
        "--connections-variantRadius",
        "--connections-linkRadius",
      ];
    }
    hexToRgb(t) {
      let n = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(t);
      return n
        ? [parseInt(n[1], 16), parseInt(n[2], 16), parseInt(n[3], 16)]
        : null;
    }
    parseProps(t) {
      return [
        "--connections-particleColor",
        "--connections-lineColor",
        "--connections-particleAmount",
        "--connections-defaultRadius",
        "--connections-variantRadius",
        "--connections-linkRadius",
      ].map((n) => t.get(n).toString().trim() || void 0);
    }
    checkDistance(t, n, e, o) {
      return Math.sqrt(Math.pow(e - t, 2) + Math.pow(o - n, 2));
    }
    paint(t, n, e) {
      const { width: o, height: i } = n,
        [
          a = "rgb(74,74,74)",
          r = "rgb(76,76,76)",
          c = (o * i) / 1e3,
          s = 1.5,
          l = 3,
          h = 80,
        ] = this.parseProps(e);
      let d = [];
      const u = /^#([0-9A-F]{3}){1,2}$/i.test(r),
        [p, g, f] = u ? this.hexToRgb(r) : r.match(/\d+/g),
        m = (n, e) => {
          let o = +s + Math.random() * +l;
          return (
            t.beginPath(),
            t.arc(n, e, o, 0, 2 * Math.PI),
            (t.fillStyle = a),
            t.fill(),
            { x: n, y: e }
          );
        },
        M = (n) => {
          for (let e = 0; e < c; e++) {
            let o = 1 - this.checkDistance(n.x, n.y, d[e].x, d[e].y) / h;
            o > 0 &&
              ((t.lineWidth = 0.5),
              (t.strokeStyle = `rgba(${p}, ${g}, ${f}, ${o})`),
              t.beginPath(),
              t.moveTo(n.x, n.y),
              t.lineTo(d[e].x, d[e].y),
              t.closePath(),
              t.stroke());
          }
        };
      for (let t = 0; t < c; t++) {
        let t = Math.round(Math.random() * o),
          n = Math.round(Math.random() * i);
        d.push(m(t, n));
      }
      for (let t = 0; t < c; t++) M(d[t]);
    }
  }
);
