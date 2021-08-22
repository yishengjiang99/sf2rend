class SharedRiffPipe{
	constructor(){
		this.sb=srb;
    this.updateArray = new Uint32Array(this.sb, 0, CH_META_LEN * 32);
    this.outputSnap = new Float32Array(
      this.sb,
      CH_META_LEN * 32 * Uint32Array.BYTES_PER_ELEMENT,
      REND_BLOCK * nchannels
    );
	}


	read(){
    const [
      updateFlag,
      channel,
      sampleId,
      loopstart,
      loopend,
      zoneRef,
      pitchRatio,
      ...blankForNow
    ] = new Uint32Array(this.sb, 4 * offset, CH_META_LEN);

    console.assert(this.sampleIdRefs[sampleId], "sample id posted");

    this.inst.exports.set_attrs(
      this.spinners[channel],
      this.sampleIdRefs[sampleId],
      loopstart,
      loopend
    );
    this.inst.exports.setStride(this.spinners[channel], pitchRatio / 0xffff);
    this.inst.exports.setZone(this.spinners[channel], this.presetRefs[zoneRef]);

    this.updateArray[offset] = 0;

    this.inst.exports.reset(this.spinners[channel]);
    if (this.updateArray[offset + CH_META_LEN] != 0) {
      this.sync(offset + CH_META_LEN);
    }
  }

	}
}