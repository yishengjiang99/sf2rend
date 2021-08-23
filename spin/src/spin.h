#ifndef SPIN_H
#define SPIN_H
#include "calc.h"
#include "eg.h"
#include "lpf.h"
#include "sf2.h"

typedef struct {
  float *inputf, *outputf;
  float fract;
  uint32_t position, loopStart, loopEnd;
  float stride, strideInc;
  lpf_t* lpf;
  zone_t* zone;
  EG *voleg, *modeg;
  uint8_t channelId;
} spinner;
short aZone[60] = {
    0,      0,   0,    0,     0,     0,      40,     0,      27000,  -10,
    0,      0,   0,    20,    598,   300,    40,     -1000,  527,    0,
    0,      -2,  -884, -2,    -1200, -10800, -10800, -10800, -10800, 0,
    -10800, 0,   0,    -3969, -3969, -7811,  2400,   960,    1200,   0,
    0,      237, 0,    17664, 32512, 0,      -2,     -2,     0,      0,
    0,      0,   -1,   123,   1,     0,      200,    0,      44,     0};
void set_zone(spinner* x, zone_t* z);
spinner* newSpinner(zone_t* zoneRef, int idx);
void eg_release(spinner* x);
void reset(spinner* x);
float spin(spinner* x, int n);

// borrowed from tml.h
enum TMLController {
  TML_BANK_SELECT_MSB,
  TML_MODULATIONWHEEL_MSB,
  TML_BREATH_MSB,
  TML_FOOT_MSB = 4,
  TML_PORTAMENTO_TIME_MSB,
  TML_DATA_ENTRY_MSB,
  TML_VOLUME_MSB,
  TML_BALANCE_MSB,
  TML_PAN_MSB = 10,
  TML_EXPRESSION_MSB,
  TML_EFFECTS1_MSB,
  TML_EFFECTS2_MSB,
  TML_GPC1_MSB = 16,
  TML_GPC2_MSB,
  TML_GPC3_MSB,
  TML_GPC4_MSB,
  TML_BANK_SELECT_LSB = 32,
  TML_MODULATIONWHEEL_LSB,
  TML_BREATH_LSB,
  TML_FOOT_LSB = 36,
  TML_PORTAMENTO_TIME_LSB,
  TML_DATA_ENTRY_LSB,
  TML_VOLUME_LSB,
  TML_BALANCE_LSB,
  TML_PAN_LSB = 42,
  TML_EXPRESSION_LSB,
  TML_EFFECTS1_LSB,
  TML_EFFECTS2_LSB,
  TML_GPC1_LSB = 48,
  TML_GPC2_LSB,
  TML_GPC3_LSB,
  TML_GPC4_LSB,
  TML_SUSTAIN_SWITCH = 64,
  TML_PORTAMENTO_SWITCH,
  TML_SOSTENUTO_SWITCH,
  TML_SOFT_PEDAL_SWITCH,
  TML_LEGATO_SWITCH,
  TML_HOLD2_SWITCH,
  TML_SOUND_CTRL1,
  TML_SOUND_CTRL2,
  TML_SOUND_CTRL3,
  TML_SOUND_CTRL4,
  TML_SOUND_CTRL5,
  TML_SOUND_CTRL6,
  TML_SOUND_CTRL7,
  TML_SOUND_CTRL8,
  TML_SOUND_CTRL9,
  TML_SOUND_CTRL10,
  TML_GPC5,
  TML_GPC6,
  TML_GPC7,
  TML_GPC8,
  TML_PORTAMENTO_CTRL,
  TML_FX_REVERB = 91,
  TML_FX_TREMOLO,
  TML_FX_CHORUS,
  TML_FX_CELESTE_DETUNE,
  TML_FX_PHASER,
  TML_DATA_ENTRY_INCR,
  TML_DATA_ENTRY_DECR,
  TML_NRPN_LSB,
  TML_NRPN_MSB,
  TML_RPN_LSB,
  TML_RPN_MSB,
  TML_ALL_SOUND_OFF = 120,
  TML_ALL_CTRL_OFF,
  TML_LOCAL_CONTROL,
  TML_ALL_NOTES_OFF,
  TML_OMNI_OFF,
  TML_OMNI_ON,
  TML_POLY_OFF,
  TML_POLY_ON
};
#endif