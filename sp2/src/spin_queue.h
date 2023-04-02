#include <math.h>
#include <stdlib.h>
#include <string.h>

#include "spin2.h"

extern void *malloc(unsigned long len);
extern void free(void *ptr);

typedef struct _SP {
  spinner *sp;
  struct _SP *next;
} SP_NODE;
SP_NODE *sp_queue = NULL;

void queue_reset() { sp_queue = NULL; }

SP_NODE *new_node(spinner *sp) {
  SP_NODE *node = (SP_NODE *)malloc(sizeof(SP_NODE));
  node->sp = sp;
  node->next = NULL;
  return node;
}

void insert_queue(spinner *sp) {
  SP_NODE *newNode = new_node(sp);
  SP_NODE **tracer = &sp_queue;
  while (*tracer) {
    tracer = &((*tracer)->next);
  }
  newNode->next = *tracer;
  *tracer = newNode;
}

int queue_count() {
  int count = 0;
  SP_NODE **tracer = &sp_queue;

  while (*tracer) {
    count++;
    tracer = &((*tracer)->next);
  }
  return count;
}
void remove_queue() {
  SP_NODE **tracer = &sp_queue;
  SP_NODE *old = NULL;
  while (*tracer && (*tracer)->sp != NULL) {
    if ((*tracer)->sp->voleg.section == DONE) {
      old = *tracer;
      *tracer = (*tracer)->next;
      free(old->sp);
    } else {
      tracer = &((*tracer)->next);
    }
  }
}

spinner *find_sp(int channel, int key) {
  SP_NODE **tracer = &sp_queue;
  while (*tracer) {
    spinner *x = (*tracer)->sp;
    if (x->channel == channel && x->key == key) return x;
    tracer = &((*tracer)->next);
  }
  return NULL;
}