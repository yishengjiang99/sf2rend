#include <stdint.h>

#define QUEUE_SIZE 0xffff

typedef struct {
  uint16_t head;
  uint16_t tail;
  uint8_t data[QUEUE_SIZE];
} queue_t;

queue_t instance[1];

int queue_count(queue_t* queue) { return queue->head - queue->tail; }
uint8_t queue_read(queue_t* queue) { return queue->data[queue->tail++] & 0xff; }

int queue_write(queue_t* queue, uint8_t c) {
  if (queue->tail - queue->head >= QUEUE_SIZE) return 1;
  queue->data[queue->head++] = c;
  return 0;
}
