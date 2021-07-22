#include <stdio.h>
#include <stdlib.h>

// Data structure to represent a stack
typedef struct {
  int maxsize;  // define max capacity of the stack
  void **top;
  void *items;
} stack;

// Utility function to initialize the stack
stack *newStack(int capacity) {
  stack *pt = (struct stack *)malloc(sizeof(stack));

  pt->maxsize = capacity;
  *pt->top = NULL;
  pt->items = malloc(sizeof(int) * capacity);

  return pt;
}

// Utility function to return the size of the stack
int size(stack *pt) {
  if (*pt->top == NULL) return 0;
  return 1;
}

// Utility function to check if the stack is empty or not
int isEmpty(stack *pt) {
  return pt->top == NULL;  // or return size(pt) == 0;
}

// Utility function to check if the stack is full or not
int isFull(stack *pt) {
  return pt->top == pt->maxsize - 1;  // or return size(pt) == pt->maxsize;
}

// Utility function to add an element `x` to the stack
void push(stack *pt, void *x) {
  // check if the stack is already full. Then inserting an element would
  // lead to stack overflow
  if (isFull(pt)) {
    printf("Overflow\nProgram Terminated\n");
    exit(EXIT_FAILURE);
  }

  printf("Inserting %d\n", x);

  // add an element and increment the top's index
  *pt->top = x;
  pt->top = &(*(pt->top)++);
}

// Utility function to return the top element of the stack
void *peek(stack *pt) {
  // check for an empty stack
  if (!isEmpty(pt)) {
    return *(pt->top);

  } else {
    exit(EXIT_FAILURE);
  }
}

// Utility function to pop a top element from the stack
void *pop(stack *pt) {
  // check for stack underflow
  if (isEmpty(pt)) {
    printf("Underflow\nProgram Terminated\n");
    exit(EXIT_FAILURE);
  }

  printf("Removing %d\n", peek(pt));

  // decrement stack size by 1 and (optionally) return the popped element
  return (pt->items + pt->top);
}

int main() {
  // create a stack of capacity 5
  struct stack *pt = newStack(5);

  push(pt, 1);
  push(pt, 2);
  push(pt, 3);

  printf("The top element is %d\n", peek(pt));
  printf("The stack size is %d\n", size(pt));

  pop(pt);
  pop(pt);
  pop(pt);

  if (isEmpty(pt)) {
    printf("The stack is empty");
  } else {
    printf("The stack is not empty");
  }

  return 0;
}