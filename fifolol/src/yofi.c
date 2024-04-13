#include <stdint.h>

#define QUEUE_SIZE 1 << 16

typedef struct {
  uint16_t head;
  uint16_t tail;
  char data[QUEUE_SIZE];
} queue_t;

queue_t instance[1];

queue_t* getInstance() { return instance; }

uint16_t queue_count(queue_t* queue) { return queue->head - queue->tail; }

char queue_read(queue_t* queue) {
  if (queue->tail == queue->head) return 0;
  return queue->data[queue->tail++];
}

int queue_write(queue_t* queue, char c) {
  queue->data[queue->head++] = c;
  return 0;
}
