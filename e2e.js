import { mkcanvas, chart } from './chart/chart.js'
import { mkdiv } from 'https://unpkg.com/mkdiv@3.1.0/mkdiv.js'
import { mkpath } from './src/mkpath.js'
import SF2Service from './sf2-service/index.js'
import { newSFZone, newSFZoneMap } from './sf2-service/zoneProxy.js'

const sf2url = 'static/GeneralUserGS.sf2'
const zoneListArr = []
const sf2file = new SF2Service(sf2url)
const loadWait = sf2file.load({
  onZone: (pid, zoneRef, zoneArr) => {
    zoneListArr[pid] ||= []
    zoneListArr[pid].push(newSFZoneMap(zoneRef, zoneArr, 38))
  }
})

let program,
  spinner,
  zone,
  articleMain,
  genlist,
  main,
  rightPanel,
  zoneObj,
  audioPath,
  volMeters

renderMain().then(async () => {
  await new Promise(r => window.addEventListener('keydown', r, { once: true }))
  await startSpinner()
  if (document.hash !== '') {
    const hashId = document.location.hash.substring(1).split('|')
    rendProgram(...hashId)
  } else {
    rendProgram(60, 65)
  }
})

window.addEventListener('hashchange', e => {
  const hashId = document.location.hash.substring(1).split('|')

  rendProgram(...hashId)
})

async function renderMain () {
  await loadWait
  document.body.innerHTML = ''
  mkdiv('nav', [
    (volMeters = mkdiv('div', { id: 'volmeter', style: 'min-height:2em' })),
    mkdiv('div', [
      mkdiv(
        'button',
        {
          onmousedown: e => {
            rendSample(e, zoneObj)
          }
        },
        'play'
      ),
      mkdiv(
        'button',
        {
          onclick: () => audioPath.silenceAll()
        },
        'panick'
      )
    ])
  ]).attachTo(document.body)
  const progList = mkdiv(
    'ul',
    { class: 'notes-list' },
    sf2file.programNames.map((n, presetId) =>
      mkdiv(
        'div',
        { class: 'menu-link' },
        mkdiv('a', { href: `#${presetId}` }, n)
      )
    )
  )
  rightPanel = mkdiv('div', { class: 'col note-viewer' }, [])
  const leftNav = mkdiv(
    'section',
    {
      class: 'col sidebar'
    },
    [
      mkdiv(
        'section',
        { class: 'sidebar-header' },
        sf2file.url.split('/').pop()
      ),
      mkdiv('nav', {}, progList)
    ]
  )
  const vrPanel = mkdiv('div', { class: 'col' })
  main = mkdiv('div', { class: 'main' }, [leftNav, rightPanel, vrPanel])
  document.body.append(main)
}

async function rendProgram (pid, zoneRef) {
  const bid = 0
  await spinner.shipProgram(program)

  await sf2file.loadProgram(pid, bid)

  program = sf2file.loadProgram(pid, bid)
  if (!zone) {
    zone = zoneRef
      ? program.zMap.find(z => z.ref == zoneRef)[0]
      : program.filterKV(55, 98)[0]
  }

  const kRangeList = program.zMap.map(
    z =>
      `<option value=${z.ref} ${z.ref + '' == zone?.ref ? 'selected' : ''}>${
        z.PBagId + '|' + z.IbagId
      } ${
        'key ' +
        [z.KeyRange.lo, z.KeyRange.hi].join('-') +
        ' vel ' +
        [z.VelRange.lo, z.VelRange.hi].join('-')
      }</option>`
  )

  sf2file.load({
    onZone: (pid, zoneRef, zoneArr) => {
      zoneListArr[pid] ||= []
      zoneListArr[pid].push(newSFZoneMap(zoneRef, zoneArr, 38))
    }
  })

  document.location.background = '#222'

  const articleHeader = mkdiv(
    'div',
    { class: 'note-header' },

    [
      mkdiv(
        'select',
        {
          oninput: e => {
            // renderZ(program.zMap.filter((z) => z.ref == e.target.value)[0]);
            document.location.hash = '#' + pid + '|' + e.target.value
          }
        },
        kRangeList
      ),
      mkdiv('details', [
        '<summary>debug</summary>',
        ...zoneListArr[pid].map(list =>
          JSON.stringify(
            Object.entries(list).filter(
              ([k, v]) => k !== 'arr' && v != 0 && v != -12000
            )
          )
        )
      ])
    ]
  )
  articleMain = mkdiv('div', { class: 'note-preview' }, [
    mkdiv(
      'div',
      {
        style:
          'display:flex flex-direction:row; max-height:50vh; overflow-y:scroll; gap:0 20px 20px'
      },
      []
    )
  ])
  const mainRight = mkdiv('div', { class: 'note' }, [
    mkdiv('div', { class: 'note-title' }, [sf2file.programNames[pid]]),
    articleHeader
  ])
  rightPanel.replaceChildren(mainRight, articleMain)

  canvas = mkcanvas({ container: articleHeader })
  if (zone) renderZ(zone)
}
async function renderZ (zoneSelect) {
  if (!zoneSelect) {
    return
  }
  zoneObj = newSFZone(zoneSelect)
  const pcm = await zoneSelect.shdr.data()
  chart(canvas, pcm)

  const zoneinfo = mkdiv('div', [
    renderSampleView(zoneSelect),
    ...'Attenuation,VolEnv,Filter,LFO'
      .split(',')
      .map(keyword => renderArticle(keyword, zoneSelect))
  ])

  articleMain.replaceChildren(zoneinfo)
}

function renderSampleView (zoneSelect) {
  return mkdiv('div', [
    'smpl: ',
    zoneSelect.shdr.SampleId,
    ' ',
    zoneSelect.shdr.name,
    '<br>nsample: ',
    zoneSelect.shdr.nsamples,
    '<br>srate: ' + zoneSelect.shdr.originalPitch,
    '<br>Range: ',
    zoneSelect.shdr.range.join('-'),
    '<br>',
    'loop: ',
    zoneSelect.shdr.loops.join('-'),
    '<br>',

    JSON.stringify(zoneSelect.KeyRange),
    '<br>',
    JSON.stringify(zoneSelect.VelRange)
  ])
}

//drawEV(zone.arr.slice(33, 39), volEGCanvas);
function min_max_vals (k) {
  if (k.includes('Sustain')) {
    return { min: 0, max: 1000, step: 10 }
  } else
    return {
      min: -12000,
      max: 5000,
      step: 10
    }
}
function renderLPFView (zone) {}
function renderArticle (keyword, zone) {
  let canvas
  const zoneObj = newSFZone(zone)
  const zattrs = Object.entries(zone).filter(([k]) => k.includes(keyword))

  const attrVals = mkdiv(
    'ul',
    zattrs.map(([k, v]) =>
      mkdiv('li', [
        mkdiv('label', [k, ':']),
        mkdiv('code', [v]),
        mkdiv('input', {
          type: 'range',
          ...min_max_vals(k),
          value: v,
          oninput: e => {
            e.target.parentElement.querySelector('code').textContent =
              e.target.value
            zoneObj[k] = e.target.value
            if (canvas) drawEV(zoneObj, canvas)
          }
        })
      ])
    )
  )
  const details = mkdiv('div')
  const article = mkdiv('article', { class: 'article' }, [attrVals, details])
  if (keyword === 'VolEnv') {
    canvas = mkcanvas({ container: details, title: 'amp eg' })
    drawEV(zoneObj, canvas)
  }
  return article
}
let ctx
async function startSpinner () {
  ctx = new AudioContext()
  audioPath = await mkpath(ctx, {
    sf2file,
    sf2service
  })
  audioPath.bindKeyboard(() => 0)
  await audioPath.startAudio()
  spinner = audioPath.spinner

  if (program) {
    audioPath.loadProgram(program)
  }

  spinner.port.onmessage = ({ data }) => {
    if (data.currentFrame) {
      volMeters.innerHTML = data.currentFrame
    }
    if (data.ack) {
      console.log(data.ack)
    }
  }
  return audioPath
}
async function rendSample (e, zoneObj) {
  e.target.innerText = 'loading'
  if (!ctx || !spinner) {
    await startSpinner()
  }
  if (!zoneObj) return
  // if (program) await spinner.shipProgram(program);

  const { arr, ref } = zoneObj
  if (zoneObj.isDirty) {
    spinner.port.postMessage({
      cmd: 'newZone',
      zone: { arr, ref }
    })
    zoneObj.lastSync = new Date()
  }
  e.target.innerText = 'playing'

  spinner.port.postMessage([0x90, 0, 55, 122, ozon.presetId, ref])
  e.target.addEventListener(
    'mouseup',
    () => {
      spinner.port.postMessage([0x80, 0, 123])
      e.target.innerText = 'play'
    },
    { once: true }
  )
}
const drawEV = async (zone, target) => {
  const [delay, att, hold, decay, sustain, release] = zone.arr.slice(33, 39)
  console.log(delay, att, hold, decay, sustain, release)
  const tc2time = t => Math.pow(2, t / 1200)
  const ctx = new OfflineAudioContext(1, 33, 3000)
  const o = ctx.createOscillator({ frequency: 1 })
  const amp = new GainNode(ctx, { gain: 0 })
  amp.gain.setValueAtTime(0, 0)
  amp.gain.linearRampToValueAtTime(1, tc2time(att))
  amp.gain.linearRampToValueAtTime(1 - sustain / 1000, tc2time(decay))
  // amp.gain.cancelAndHoldAtTime(
  //   tc2time(att) + tc2time(tc2time(decay)) + tc2time(hold)
  // );
  // amp.gain.cancelAndHoldAtTime(
  //   tc2time(att) + tc2time(tc2time(decay)) + tc2time(hold) + 0.1
  // );

  o.connect(amp)
  amp.connect(ctx.destination)
  o.start(0)
  const rendbuff = await ctx.startRendering()
  chart(target, rendbuff.getChannelData(0))
}
