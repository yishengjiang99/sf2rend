#if !defined(mlt_h)
#define mlt_h

/* attack & decay/release time table (msec) */
static const short attack_time_tbl[128] = {
    32767, 32767, 5989, 4235, 2994, 2518, 2117, 1780, 1497, 1373, 1259, 1154,
    1058,  970,   890,  816,  707,  691,  662,  634,  607,  581,  557,  533,
    510,   489,   468,  448,  429,  411,  393,  377,  361,  345,  331,  317,
    303,   290,   278,  266,  255,  244,  234,  224,  214,  205,  196,  188,
    180,   172,   165,  158,  151,  145,  139,  133,  127,  122,  117,  112,
    107,   102,   98,   94,   90,   86,   82,   79,   75,   72,   69,   66,
    63,    61,    58,   56,   53,   51,   49,   47,   45,   43,   41,   39,
    37,    36,    34,   33,   31,   30,   29,   28,   26,   25,   24,   23,
    22,    21,    20,   19,   19,   18,   17,   16,   16,   15,   15,   14,
    13,    13,    12,   12,   11,   11,   10,   10,   10,   9,    9,    8,
    8,     8,     8,    7,    7,    7,    6,    0,
};

static const short decay_time_tbl[128] = {
    32767, 32767, 22614, 15990, 11307, 9508, 7995, 6723, 5653, 5184, 4754, 4359,
    3997,  3665,  3361,  3082,  2828,  2765, 2648, 2535, 2428, 2325, 2226, 2132,
    2042,  1955,  1872,  1793,  1717,  1644, 1574, 1507, 1443, 1382, 1324, 1267,
    1214,  1162,  1113,  1066,  978,   936,  897,  859,  822,  787,  754,  722,
    691,   662,   634,   607,   581,   557,  533,  510,  489,  468,  448,  429,
    411,   393,   377,   361,   345,   331,  317,  303,  290,  278,  266,  255,
    244,   234,   224,   214,   205,   196,  188,  180,  172,  165,  158,  151,
    145,   139,   133,   127,   122,   117,  112,  107,  102,  98,   94,   90,
    86,    82,    79,    75,    72,    69,   66,   63,   61,   58,   56,   53,
    51,    49,    47,    45,    43,    41,   39,   37,   36,   34,   33,   31,
    30,    29,    28,    26,    25,    24,   23,   22,
};
int snd_sf_vol_table[128] = {
    255, 111, 95, 86, 79, 74, 70, 66, 63, 61, 58, 56, 54, 52, 50, 49,
    47,  46,  45, 43, 42, 41, 40, 39, 38, 37, 36, 35, 34, 34, 33, 32,
    31,  31,  30, 29, 29, 28, 27, 27, 26, 26, 25, 24, 24, 23, 23, 22,
    22,  21,  21, 21, 20, 20, 19, 19, 18, 18, 18, 17, 17, 16, 16, 16,
    15,  15,  15, 14, 14, 14, 13, 13, 13, 12, 12, 12, 11, 11, 11, 10,
    10,  10,  10, 9,  9,  9,  8,  8,  8,  8,  7,  7,  7,  7,  6,  6,
    6,   6,   5,  5,  5,  5,  5,  4,  4,  4,  4,  3,  3,  3,  3,  3,
    2,   2,   2,  2,  2,  1,  1,  1,  1,  1,  0,  0,  0,  0,  0,  0,
};

static int search_tb(int val, const short* tb, int tb_size) {
  int left = 1, right = tb_size - 1;
  int mid;
  while (left < right) {
    mid = (left + right) / 2;
    if (val < (int)tb[mid]) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }
  return left;
}

#endif  // mlt_h