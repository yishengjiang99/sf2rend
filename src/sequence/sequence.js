import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import React from 'react'
const eventPipe = mkeventPipe()


export const Sequence = forwardRef((props, ref) => {
  const { nsemi, width, preset, height, division, nbars, ppqn, chId, mStart } =
    props
  const canvasRef = useRef()
  const barInc = width / nbars
  const semiHeight = height / nsemi
  useEffect(() => {
    if (!canvasRef.current) {
      throw new Error('adsfasd')
    }
  });
    const semiHeight = height / nsemi
    const ctx = canvasRef.current.getContext('2d')
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = 'rgba(0, 0, 0, 0)'
    ctx.font = '25px Courier New'

    ctx.fillRect(0, 0, width, height)
    for (let i = 0; i < nbars; i++) {
      ctx.beginPath()
      if (i % division === 0) {
        ctx.strokeStyle = 'white'
      } else {
        ctx.strokeStyle = 'grey'
      }
      ctx.moveTo(i * barInc, 0)
      ctx.lineTo(i * barInc, height)
      ctx.stroke()
      if (chId === 0 && i % division === 0) {
        ctx.strokeStyle = 'yellow'
        ctx.strokeText(i, i * barInc, 20)
      }
    }
    for (let i = nsemi; i >= 0; i--) {
      if ([1, 3, 5, 8, 10].indexOf(i % 12) > -1) {
        ctx.fillStyle = 'rgba(22, 22, 22, 1.0)'
      } else {
        ctx.fillStyle = 'rgba(33, 33, 33, 1.0)'
      }
      ctx.fillRect(0, i * semiHeight, width, semiHeight)
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(1, 1, 1, 1.0)'
      ctx.moveTo(0, i * semiHeight)
      ctx.lineTo(width, i * semiHeight)
      ctx.stroke()
    }
  }, [width, chId, height, division, nbars, nsemi, barInc])

  useImperativeHandle(
    ref,
    () => {
      return {
        drawBarN (t1, t2, midi) {
          if (!canvasRef.current) return false
          let d = midi - mStart
          while (d > 24) {
            d--
          }
          const ctx = canvasRef.current.getContext('2d')
          ctx.save()
          ctx.fillStyle = `rgb(${(127 - midi) * 2},0,${midi * 2})`
          ctx.fillRect(
            (t1 / ppqn + 12) * barInc - 1,
            d * semiHeight - 1,
            (barInc * (t2 - t1)) / ppqn,
            semiHeight
          )
          ctx.restore()
        },
        drawBar (qn, midi) {
          this.drawBarN(qn * ppqn, (qn + 1) / ppqn, midi)
        }
      }
    },
    [barInc, mStart, ppqn, semiHeight]
  )

  return (
    <div className={preset ? 'panel' : 'hidden'}>
      <canvas ref={canvasRef} width={width} height={height}></canvas>
    </div>
  )
})
