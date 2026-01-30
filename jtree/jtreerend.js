import SF2Service from "../sf2-service/index.js";

const url = "file.sf2";
const extWait = new Promise((r) => Ext.onReady(r));
Ext.define("RiffChunk", {
  extend: "Ext.data.TreeModel",
  fields: ["fourcc", "bytelength", "desc"],
  idProperty: "fourcc",
});

Ext.define("Phdr", {
  extend: "Ext.data.TreeModel",
  idProperty: "presetId",
  hasMany: Ext.create("Ext.data.TreeModel", {
    idProperty: "presetId",
    rootProperty: "zones",
    fields: ["pid", "bankId", "name", "presetId", "zones"],
  }),
});
Ext.define("Pdta", {
  extend: "RiffChunk",
  hasMany: "Phdr",
});
async function rendsf2tree(url, dest) {
  const sf2loader = new SF2Service(url);
  const sf2file = await sf2loader.load();
  const tree = new Ext.data.TreeStore({
    model: "RiffChunk",
    root: {
      fourcc: sf2file.meta.sig.join(""),
      desc: sf2file.nsamples + " samples",
      expanded: true,
      children: [
        {
          fourcc: "INFO",
          desc: "list of meta",
          children: sf2file.infos.map(([sectionname, value]) => ({
            fourcc: sectionname,
            desc: value,
            leaf: true,
          })),
        },
        new Pdta({
          fourcc: "pdta",
          desc: "present data",
          children: [],
          expanded: true,
        }),
      ],
    },
  });
  new Ext.TreePanel({
    store: tree,
    resizeable: true,
    renderTo: dest,
    groupBy: "bid",
    columns: [
      {
        xtype: "treecolumn",
      },
      {
        title: "BankId",
        dataIndex: "bid",
        renderer(value, meta, record) {
          if (value != undefined) return value;
          else return record.data.fourcc;
        },
      },
      {
        title: "pid",
        dataIndex: "pid",
      },
      {
        title: "desc",
        dataIndex: "desc",
        flex: 3,
        renderer(value, meta, record) {
          if (value) return value;
          return record.data.name;
        },
      },
      {
        title: "id",
        dataIndex: "id",
        renderer(_, _1, r) {
          return r.id;
        },
      },
    ],
  });
  return [tree, sf2loader];
}
document.body.innerHTML += "<div id='rendt'></div>";

promise_testa(async () => {
  const [tree, sf2loader] = await rendsf2tree(url, "rendt");

  console.log(tree);

  assert_true(!!tree, "treeloaded");
  let pdta = tree.getById("pdta");

  const ret = await sf2loader.load({
    onHeader: function ({ pid, bid, name }) {
      pdta.appendChild(
        new Phdr({
          fourcc: "phdr",
          pid,
          bid,
          name,
          presetId: pid | bid,
          zones: [],
        })
      );
    },
  });
  console.log(ret);
  assert_true(true);
  window.treee = tree;
});
function promise_testa(fn) {
  fn();
}
