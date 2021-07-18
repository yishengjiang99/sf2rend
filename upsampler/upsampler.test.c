#include<stdio.h>
#include<stdlib.h>
#include<math.h>
#include "upsample.c"
int main(){
  float output[4096];

  sampler_iterator*it= init(output,69,48000,489999);
  float sample[489999];
  for(int i=0;i<489999;i++){
    sample[i]=sinf((float)(2*M_PI*i*440)/48000.0f);
  }
  it->sample=sample;
  upsample_wave_table(it);
  printf("rat %f",it->ratio);
  for(int i=0;i<it->output_sample_block;i++){
    printf("\n%d, %f",i,it->output[i]);
  }
}