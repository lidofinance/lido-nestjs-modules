import { Queue } from '../src';

describe('Queue. ', () => {
  test('should perform basic functionality', () => {
    const queue = new Queue<string>();

    queue.enqueue('apple');
    expect(queue.length).toBe(1);

    queue.enqueue('orange');
    expect(queue.length).toBe(2);

    expect(queue.dequeue()).toBe('apple');
    expect(queue.length).toBe(1);

    expect(queue.dequeue()).toBe('orange');
    expect(queue.length).toBe(0);
  });

  test('should have FIFO behavior when getting one item from queue', () => {
    const queue = new Queue<string>();

    queue.enqueue('apple');
    queue.enqueue('orange');
    queue.enqueue('pineapple');

    expect(queue.dequeue()).toBe('apple');
    expect(queue.dequeue()).toBe('orange');
    expect(queue.dequeue()).toBe('pineapple');
    expect(queue.dequeue()).toBeUndefined();
    expect(queue.length).toBe(0);
  });

  test('should have FIFO behavior when getting multiple items from queue', () => {
    const queue = new Queue<string>();

    queue.enqueue('apple');
    queue.enqueue('orange');
    queue.enqueue('pineapple');

    const dequeued = queue.dequeueMultiple(3);

    expect(dequeued[0]).toBe('apple');
    expect(dequeued[1]).toBe('orange');
    expect(dequeued[2]).toBe('pineapple');
    expect(queue.dequeue()).toBeUndefined();
    expect(queue.length).toBe(0);
  });

  test('dequeueMultiple should not fail when dequeueing negative amount of elements', () => {
    const queue = new Queue<string>();

    queue.enqueue('apple');
    queue.enqueue('orange');

    const dequeued = queue.dequeueMultiple(-4);

    expect(dequeued).toHaveLength(1);
    expect(dequeued[0]).toBe('apple');
    expect(queue.length).toBe(1);
  });

  test('dequeueMultiple should dequeue less items if queue there are not enough elements in queue', () => {
    const queue = new Queue<string>();

    queue.enqueue('apple');
    queue.enqueue('orange');

    const dequeued = queue.dequeueMultiple(3);

    expect(dequeued).toHaveLength(2);
    expect(dequeued[0]).toBe('apple');
    expect(dequeued[1]).toBe('orange');
    expect(queue.length).toBe(0);
  });

  test('dequeue should return undefined when queue is empty', () => {
    const queue = new Queue<string>();
    const dequeued = queue.dequeue();
    expect(dequeued).toBeUndefined();
  });

  test('clear should make queue empty', () => {
    const queue = new Queue<string>();

    queue.enqueue('apple');
    queue.enqueue('orange');
    expect(queue.length).toBe(2);

    queue.clear();
    expect(queue.length).toBe(0);
  });
});
