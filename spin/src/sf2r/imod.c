
#include "gnames.h"
#include "pdta.c"
void findIbagModulators(ibag *ib) {
  ibag *nib = ib + 1;
  for (imod *im = imods + ib->imod_id; im < imods + nib->imod_id; im++) {
    printf(
        "\nImod\n****(%#02x),"
        "\n**type %d,"
        "\n** polarity: %d,"
        "\n** direction %hd,"
        "\n** CC %d, \n** index: %d",
        im->sfModSrcOper, im->sfModSrcOper >> 10, im->sfModSrcOper >> 9 & 0x01,
        im->sfModSrcOper >> 8 & 0x01, im->sfModSrcOper >> 7 & 0x01,
        im->sfModSrcOper & 0x0f);
    if ((im->sfModSrcOper >> 7 & 0x01) == 0) {
      switch (im->sfModSrcOper & 0x0f) {
        case 2:
          printf("\nnote on key");
          break;
        case 3:
          printf("note on vel");
          break;
      }
    }

    printf("\ndestination %hd %s", im->sfModDestOper,
           generator[im->sfModDestOper]);
    printf("\ntransform type:%d", im->sfModTransOper);
    printf("\n** amt %d", im->modAmount);
  }
}