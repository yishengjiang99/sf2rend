#include <stdio.h>
#include <stdlib.h>
int main(int argc,char**argv){
  if(argc<2)  return 0;
  while(*argv[1]){
     printf("\n--- %d  ----", *argv[1]++);
  }

  return argv[1][0];
}
