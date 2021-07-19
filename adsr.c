extern float powf(float x, float f);

typedef unsigned int uint32_t;
typedef struct
{
	uint32_t att_steps, decay_steps, release_steps;
	uint32_t sustain;
	float db_attenuate;
	float att_rate, decay_rate, release_rate;
} adsr_t;
#define fmax(a, b) a > b ? a : b

adsr_t *newEnvelope(void *ptr, short centAtt, short centDecay, short centRelease, short sustain, int sampleRate)
{
	adsr_t *env = (adsr_t *)ptr;

	env->att_steps = powf(2.0f, centAtt * 1.0f / 1200.0f) * sampleRate;
	env->decay_steps = powf(2.0f, centDecay * 1.0f / 1200.0f) * sampleRate;
	env->release_steps = powf(2.0f, centRelease * 1.0f / 1200.0f) * sampleRate;

	if (env->att_steps < 12)
	{
		env->att_steps = 0;
		env->db_attenuate = 0.0f;
	}
	env->sustain = sustain;
	env->att_rate = -960.0f / env->att_steps;
	env->decay_rate = -powf(10.0f, sustain / -200.0f) * powf(2.f, centDecay / 1200.0f);
	env->release_rate = 960.0f / env->release_steps;
	env->db_attenuate = 960.0f;

	return env;
}
float envShift(adsr_t *env)
{
	if (env->att_steps > 0)
	{
		env->att_steps--;
		env->db_attenuate += env->att_rate;
	}
	else if (env->decay_steps > 0)
	{
		env->decay_steps--;
		float egval = (1 - env->db_attenuate) * 960.0f;
		egval *= env->decay_rate;
		env->db_attenuate = 960.0f * egval - egval;
	}
	else if (env->release_steps > 0)
	{
		env->release_steps--;
		env->db_attenuate += env->release_rate;
	}
	if (env->db_attenuate > 960)
	{
		env->db_attenuate = 960.0f;
	}
	if (env->db_attenuate < 0.0)
	{
		env->db_attenuate = 0.0f;
	}

	return env->db_attenuate;
}
void adsrRelease(adsr_t *env)
{
	env->decay_steps = 0;
	env->att_steps = 0;
}
