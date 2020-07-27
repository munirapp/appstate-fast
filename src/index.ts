import { ref, Ref, onUnmounted, triggerRef } from 'vue'

export class State<S> {
  private val: S
  private readonly subscribers: ((value: S) => void)[]

  constructor(value: S) {
    this.val = value
    this.subscribers = []
  }

  get value(): S {
    return this.val
  }

  set(value: S): void {
    this.val = value
    this.subscribers.forEach(s => s(this.val))
  }

  update(op: (value: S) => S): void {
    this.val = op(this.val)
    this.subscribers.forEach(s => s(this.val))
  }

  subscribe(sub: (value: S) => void): () => void {
    this.subscribers.push(sub)
    return () => {
      const index = this.subscribers.indexOf(sub)
      if (index !== -1) {
        this.subscribers.splice(index, 1)
      }
    }
  }
}

export function createState<S>(source: S): State<S> {
  const state = new State(source)
  return state
}

interface StateMethods<S> {
  set: (value: S) => void
  get: () => S
}

export function useState<S>(state: S | State<S>): StateMethods<S> {
  if (state instanceof State) {
    const value = ref(state.value) as Ref<S>

    const get = () => value.value
    const set = (newValue: S) => {
      value.value = newValue
      triggerRef(value)
    }

    const unsubscribe = state.subscribe(set)
    onUnmounted(() => unsubscribe())

    return { set, get }
  } else {
    const value = ref(state) as Ref<S>

    const get = () => value.value
    const set = (newValue: S) => {
      value.value = newValue
      triggerRef(value)
    }

    return { set, get }
  }
}
