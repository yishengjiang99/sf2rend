#define saturation .8f

float saturate(float x)
{
  float a = saturation;
  if (x < a)
    return x;
  else if (x > 1.0f)
    return (a + 1.0f) / 2.0f;
  else
    return a + (x - a) / (1.0f + ((x - a) / (1 - a)) * ((x - a) / (1 - a)));
}