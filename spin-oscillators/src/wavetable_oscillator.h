#ifndef WAVETABLE_OSCILLATOR_H
# define WAVETABLE_OSCILLATOR_H

#include <stdint.h>
#define NUM_OSCILLATORS 16
#define SAMPLE_BLOCKSIZE 128

#define MASK_FRACTIONAL_BITS 0x000FFFFF
#define MASK_WAVEINDEX 0x00000FFFUL
#define WAVETABLE_SIZE 4096
#define LOG2_WAVETABLE_SIZE 12
#define PI 3.1415926539f
#define BIT32_NORMALIZATION 4294967296.0f
#define SCALAR_FRACTIONAL_BITS  ((float)WAVETABLE_SIZE) / BIT32_NORMALIZATION
#define SAMPLE_RATE 48000.0f

//
//  This typedef in wavetable_oscillator.h
//
typedef struct {
  float *output_ptr;      // 0
  int samples_per_block;  // 4

  uint32_t phase;  // 8
  int32_t phaseIncrement;
  int32_t frequencyIncrement;

  unsigned int num_fractionalBits;
  uint32_t mask_fractionalBits;  // 2^num_fractionalBits - 1
  unsigned int mask_waveIndex;
  float scaler_fractionalBits;  // 2^(-num_fractionalBits)

  float fadeDim1;
  float fadeDim1Increment;
  float fadeDim2;
  float fadeDim2Increment;
  float fadeDim3;
  float fadeDim3Increment;

  float *wave000;
  float *wave001;
  float *wave010;
  float *wave011;
  float *wave100;
  float *wave101;
  float *wave110;
  float *wave111;
} wavetable_oscillator_data;

#endif