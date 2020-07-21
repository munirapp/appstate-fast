/**
 * 'JSON path' from root of a state object to a nested property.
 * Return type of [StateMethod.path](#readonly-path).
 *
 * For example, an object `{ a: [{ b: 1 }, { 1000: 'value' }, '3rd'] }`,
 * has got the following paths pointing to existing properties:
 *
 * - `[]`
 * - `['a']`
 * - `['a', 0]`
 * - `['a', 0, 'b']`
 * - `['a', 1]`
 * - `['a', 1, 1000]`
 * - `['a', 2]`
 */
type Path = ReadonlyArray<string | number>;
/**
 * Type of an argument of [StateMethods.set](#set).
 *
 * @typeparam S Type of a value of a state
 */
type SetStateAction<S> = (S | Promise<S>) | ((prevState: S) => S | Promise<S>);
/**
 * Type of an argument of [StateMethods.merge](#merge).
 *
 * @typeparam S Type of a value of a state
 */
type SetPartialStateAction<S> = S extends ReadonlyArray<infer U> ? ReadonlyArray<U> | Record<number, U> | ((prevValue: S) => ReadonlyArray<U> | Record<number, U>) : S extends Record<string, unknown> | string ? Partial<S> | ((prevValue: S) => Partial<S>) : S | ((prevState: S) => S);
/**
 * Type of an argument of [createState](#createstate) and [useState](#usestate).
 *
 * @typeparam S Type of a value of a state
 */
type SetInitialStateAction<S> = S | Promise<S> | (() => S | Promise<S>);
/**
 * Special symbol which might be returned by onPromised callback of [StateMethods.map](#map) function.
 *
 * [Learn more...](https://hookstate.js.org/docs/asynchronous-state#executing-an-action-when-state-is-loaded)
 */
declare const postpone: unique symbol;
/**
 * Special symbol which might be used to delete properties
 * from an object calling [StateMethods.set](#set) or [StateMethods.merge](#merge).
 *
 * [Learn more...](https://hookstate.js.org/docs/nested-state#deleting-existing-element)
 */
declare const none: unknown;
/**
 * Return type of [StateMethods.keys](#readonly-keys).
 *
 * @typeparam S Type of a value of a state
 */
type InferredStateKeysType<S> = S extends ReadonlyArray<infer _> ? ReadonlyArray<number> : S extends null ? undefined : S extends Record<string, unknown> ? ReadonlyArray<keyof S> : undefined;
/**
 * Return type of [StateMethods.map()](#map).
 *
 * @typeparam S Type of a value of a state
 */
type InferredStateOrnullType<S> = S extends undefined ? undefined : S extends null ? null : State<S>;
/**
 * For plugin developers only.
 * An instance to manipulate the state in more controlled way.
 *
 * @typeparam S Type of a value of a state
 *
 * [Learn more...](https://hookstate.js.org/docs/writing-plugin)
 */
interface PluginStateControl<S> {
    /**
     * Get state value, but do not leave the traces of reading it.
     */
    getUntracked(): S;
    /**
     * Set new state value, but do not trigger rerender.
     *
     * @param newValue new value to set to a state.
     */
    setUntracked(newValue: SetStateAction<S>): Path[];
    /**
     * Merge new state value, but do not trigger rerender.
     *
     * @param mergeValue new partial value to merge with the current state value and set.
     */
    mergeUntracked(mergeValue: SetPartialStateAction<S>): Path[];
    /**
     * Trigger rerender for hooked states, where values at the specified paths are used.
     *
     * @param paths paths of the state variables to search for being used by components and rerender
     */
    rerender(paths: Path[]): void;
}
/**
 * An interface to manage a state in Hookstate.
 *
 * @typeparam S Type of a value of a state
 */
interface StateMethods<S> {
    /**
     * 'Javascript' object 'path' to an element relative to the root object
     * in the state. For example:
     *
     * ```tsx
     * const state = useState([{ name: 'First Task' }])
     * state.path IS []
     * state[0].path IS [0]
     * state.[0].name.path IS [0, 'name']
     * ```
     */
    readonly path: Path;
    /**
     * Return the keys of nested states.
     * For a given state of [State](#state) type,
     * `state.keys` will be structurally equal to Object.keys(state),
     * with two minor difference:
     * 1. if `state.value` is an array, the returned result will be
     * an array of numbers, not strings like with `Object.keys`.
     * 2. if `state.value` is not an object, the returned result will be undefined.
     */
    readonly keys: InferredStateKeysType<S>;
    /**
     * Unwraps and returns the underlying state value referred by
     * [path](#readonly-path) of this state instance.
     *
     * It returns the same result as [StateMethods.get](#get) method.
     *
     * This property is more useful than [get](#get) method for the cases,
     * when a value may hold null or undefined values.
     * Typescript compiler does not handle elimination of undefined with get(),
     * like in the following examples, but value does:
     *
     * ```tsx
     * const state = useState<number | undefined>(0)
     * const myvalue: number = state.value
     *      ? state.value + 1
     *      : 0; // <-- compiles
     * const myvalue: number = state.get()
     *      ? state.get() + 1
     *      : 0; // <-- does not compile
     * ```
     */
    readonly value: S;
    /**
     * True if state value is not yet available (eg. equal to a promise)
     */
    readonly promised: boolean;
    /**
     * If a state was set to a promise and the promise was rejected,
     * this property will return the error captured from the promise rejection
     */
    readonly error: StateErrorAtRoot | undefined;
    /**
     * Unwraps and returns the underlying state value referred by
     * [path](#readonly-path) of this state instance.
     *
     * It returns the same result as [StateMethods.value](#readonly-value) method.
     */
    get(): S;
    /**
     * Sets new value for a state.
     * If `this.path === []`,
     * it is similar to the `setState` variable returned by `React.useState` hook.
     * If `this.path !== []`, it sets only the segment of the state value, pointed out by the path.
     * Unlike [merge](#merge) method, this method will not accept partial updates.
     * Partial updates can be also done by walking the nested states and setting those.
     *
     * @param newValue new value to set to a state.
     * It can be a value, a promise resolving to a value
     * (only if [this.path](#readonly-path) is `[]`),
     * or a function returning one of these.
     * The function receives the current state value as an argument.
     */
    set(newValue: SetStateAction<S>): void;
    /**
     * Similarly to [set](#set) method updates state value.
     *
     * - If current state value is an object, it does partial update for the object.
     * - If state value is an array and the argument is an array too,
     * it concatenates the current value with the value of the argument and sets it to the state.
     * - If state value is an array and the `merge` argument is an object,
     * it does partial update for the current array value.
     * - If current state value is a string, it concatenates the current state
     * value with the argument converted to string and sets the result to the state.
     */
    merge(newValue: SetPartialStateAction<S>): void;
    /**
     * Returns nested state by key.
     * `state.nested('myprop')` returns the same as `state.myprop` or `state['myprop']`,
     * but also works for properties, which names collide with names of state methods.
     *
     * [Learn more about nested states...](https://hookstate.js.org/docs/nested-state)
     *
     * @param key child property name or index
     */
    nested<K extends keyof S>(key: K): State<S[K]>;
    /**
     * Runs the provided action callback with optimised re-rendering.
     * Updating state within a batch action does not trigger immediate rerendering.
     * Instead, all required rerendering is done once the batch is finished.
     *
     * [Learn more about batching...](https://hookstate.js.org/docs/performance-batched-updates
     *
     * @param action callback function to execute in a batch
     *
     * @param context custom user's value, which is passed to plugins
     */
    batch<R, C>(action: (s: State<S>) => R, context?: Exclude<C, Function>): R;
    /**
     * If state value is null or undefined, returns state value.
     * Otherwise, it returns this state instance but
     * with null and undefined removed from the type parameter.
     *
     * [Learn more...](https://hookstate.js.org/docs/nullable-state)
     */
    ornull: InferredStateOrnullType<S>;
    /**
     * Adds plugin to the state.
     *
     * [Learn more...](https://hookstate.js.org/docs/extensions-overview)
     */
    attach(plugin: () => Plugin): State<S>;
    /**
     * For plugin developers only.
     * It is a method to get the instance of the previously attached plugin.
     * If a plugin has not been attached to a state,
     * it returns an Error as the first element.
     * A plugin may trhow an error to indicate that plugin has not been attached.
     *
     * [Learn more...](https://hookstate.js.org/docs/writing-plugin)
     */
    attach(pluginId: symbol): [PluginCallbacks | Error, PluginStateControl<S>];
}
/**
 * Mixin for the [StateMethods](#interfacesstatemethodsmd) for a [State](#state),
 * which can be destroyed by a client.
 */
interface StateMethodsDestroy {
    /**
     * Destroys an instance of a state, so
     * it can clear the allocated native resources (if any)
     * and can not be used anymore after it has been destroyed.
     */
    destroy(): void;
}
/**
 * Type of a result of [createState](#createstate) and [useState](#usestate) functions
 *
 * @typeparam S Type of a value of a state
 *
 * [Learn more about global states...](https://hookstate.js.org/docs/global-state)
 * [Learn more about local states...](https://hookstate.js.org/docs/local-state)
 * [Learn more about nested states...](https://hookstate.js.org/docs/nested-state)
 */
type State<S> = StateMethods<S> & (S extends ReadonlyArray<infer U> ? ReadonlyArray<State<U>> : S extends Record<string, unknown> ? Omit<{
    readonly [K in keyof Required<S>]: State<S[K]>;
}, keyof StateMethods<S> | keyof StateMethodsDestroy> : Record<string, unknown>);
/**
 * For plugin developers only.
 * Type alias to highlight the places where we are dealing with root state value.
 *
 * @hidden
 * @ignore
 */
type StateValueAtRoot = unknown;
/**
 * For plugin developers only.
 * Type alias to highlight the places where we are dealing with nested state value.
 *
 * @hidden
 * @ignore
 */
type StateValueAtPath = unknown;
/**
 * For plugin developers only.
 * Type alias to highlight the places where we are dealing with state error.
 *
 * @hidden
 * @ignore
 */
type StateErrorAtRoot = unknown;
/**
 * For plugin developers only.
 * Type alias to highlight the places where we are dealing with context value.
 *
 * @hidden
 * @ignore
 */
type AnyContext = unknown;
/**
 * For plugin developers only.
 * PluginCallbacks.onSet argument type.
 */
interface PluginCallbacksOnSetArgument {
    readonly path: Path;
    readonly state?: StateValueAtRoot;
    readonly previous?: StateValueAtPath;
    readonly value?: StateValueAtPath;
    readonly merged?: StateValueAtPath;
}
/**
 * For plugin developers only.
 * PluginCallbacks.onDestroy argument type.
 */
interface PluginCallbacksOnDestroyArgument {
    readonly state?: StateValueAtRoot;
}
/**
 * For plugin developers only.
 * PluginCallbacks.onBatchStart/Finish argument type.
 */
interface PluginCallbacksOnBatchArgument {
    readonly path: Path;
    readonly state?: StateValueAtRoot;
    readonly context?: AnyContext;
}
/**
 * For plugin developers only.
 * Set of callbacks, a plugin may subscribe to.
 *
 * [Learn more...](https://hookstate.js.org/docs/writing-plugin)
 */
interface PluginCallbacks {
    readonly onSet?: (arg: PluginCallbacksOnSetArgument) => void;
    readonly onDestroy?: (arg: PluginCallbacksOnDestroyArgument) => void;
    readonly onBatchStart?: (arg: PluginCallbacksOnBatchArgument) => void;
    readonly onBatchFinish?: (arg: PluginCallbacksOnBatchArgument) => void;
}
/**
 * For plugin developers only.
 * Hookstate plugin specification and factory method.
 *
 * [Learn more...](https://hookstate.js.org/docs/writing-plugin)
 */
interface Plugin {
    /**
     * Unique identifier of a plugin.
     */
    readonly id: symbol;
    /**
     * Initializer for a plugin when it is attached for the first time.
     */
    readonly init?: (state: State<StateValueAtRoot>) => PluginCallbacks;
}
/**
 * Creates new state and returns it.
 *
 * You can create as many global states as you need.
 *
 * When you the state is not needed anymore,
 * it should be destroyed by calling
 * `destroy()` method of the returned instance.
 * This is necessary for some plugins,
 * which allocate native resources,
 * like subscription to databases, broadcast channels, etc.
 * In most cases, a global state is used during
 * whole life time of an application and would not require
 * destruction. However, if you have got, for example,
 * a catalog of dynamically created and destroyed global states,
 * the states should be destroyed as advised above.
 *
 * @param initial Initial value of the state.
 * It can be a value OR a promise,
 * which asynchronously resolves to a value,
 * OR a function returning a value or a promise.
 *
 * @typeparam S Type of a value of the state
 *
 * @returns [State](#state) instance,
 * which can be used directly to get and set state value
 * outside of React components.
 * When you need to use the state in a functional `React` component,
 * pass the created state to [useState](#usestate) function and
 * use the returned result in the component's logic.
 */
declare function createState<S>(initial: SetInitialStateAction<S>): State<S> & StateMethodsDestroy;
/**
 * Enables a functional React component to use a state,
 * either created by [createState](#createstate) (*global* state) or
 * derived from another call to [useState](#usestate) (*scoped* state).
 *
 * The `useState` forces a component to rerender everytime, when:
 * - a segment/part of the state data is updated *AND only if*
 * - this segement was **used** by the component during or after the latest rendering.
 *
 * For example, if the state value is `{ a: 1, b: 2 }` and
 * a component uses only `a` property of the state, it will rerender
 * only when the whole state object is updated or when `a` property is updated.
 * Setting the state value/property to the same value is also considered as an update.
 *
 * A component can use one or many states,
 * i.e. you may call `useState` multiple times for multiple states.
 *
 * The same state can be used by multiple different components.
 *
 * @param source a reference to the state to hook into
 *
 * The `useState` is a hook and should follow React's rules of hooks.
 *
 * @returns an instance of [State](#state),
 * which **must be** used within the component (during rendering
 * or in effects) or it's children.
 */
declare function useState<S>(source: State<S>): State<S>;
/**
 * For plugin developers only.
 * Reserved plugin ID for developers tools extension.
 *
 * @hidden
 * @ignore
 */
declare const devToolsID: unique symbol;
/**
 * Return type of [DevTools](#devtools).
 */
interface DevToolsExtensions {
    /**
     * Assigns custom label to identify the state in the development tools
     * @param name label for development tools
     */
    label(name: string): void;
    /**
     * Logs to the development tools
     */
    log(str: string, data?: unknown): void;
}
/**
 * Returns access to the development tools for a given state.
 * Development tools are delivered as optional plugins.
 * You can activate development tools from `@hookstate/devtools`package,
 * for example. If no development tools are activated,
 * it returns an instance of dummy tools, which do nothing, when called.
 *
 * [Learn more...](https://hookstate.js.org/docs/devtools)
 *
 * @param state A state to relate to the extension.
 *
 * @returns Interface to interact with the development tools for a given state.
 *
 * @typeparam S Type of a value of a state
 */
declare function devTools<S>(state: State<S>): DevToolsExtensions;
export { Path, SetStateAction, SetPartialStateAction, SetInitialStateAction, postpone, none, InferredStateKeysType, InferredStateOrnullType, PluginStateControl, StateMethods, StateMethodsDestroy, State, StateValueAtRoot, StateValueAtPath, StateErrorAtRoot, AnyContext, PluginCallbacksOnSetArgument, PluginCallbacksOnDestroyArgument, PluginCallbacksOnBatchArgument, PluginCallbacks, Plugin, createState, useState, devToolsID, DevToolsExtensions, devTools };