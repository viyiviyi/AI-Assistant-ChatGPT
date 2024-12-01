type Action<T = void> = () => Promise<T>;
type Callback<T = any> = (result: T) => void;

type Task<T = any> = {
  action: Action<T>;
  cb?: Callback<T>;
  rj?: Callback;
};

export class TaskQueue {
  private taskQueue: Task[] = [];
  private runing = false;

  enqueue<T>(task: Action<T>): Promise<T> {
    let tasker: Task<T> = { action: task };
    this.taskQueue.push(tasker);
    let result = new Promise<T>((resolve, reject) => {
      tasker.cb = resolve;
      tasker.rj = reject;
    });
    this.processQueue();
    return result;
  }

  isEmpty(): boolean {
    return this.taskQueue.length === 0;
  }

  private async processQueue() {
    if (this.runing) return;
    this.runing = true;
    if (this.taskQueue.length > 0) {
      const task = this.taskQueue[0];
      await task.action().then(task.cb).catch(task.rj);
      this.taskQueue.shift();
      this.runing = false;
      this.processQueue();
    } else {
      this.runing = false;
    }
  }
}
