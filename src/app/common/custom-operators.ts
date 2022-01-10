import { filter, from, map, mergeAll, mergeWith, MonoTypeOperatorFunction, Observable, ObservableInput, ObservableInputTuple, OperatorFunction, shareReplay } from 'rxjs';

export const filterMap = <T, U>(job: (param: T) => U): OperatorFunction<T, U> => (source$: Observable<T>): Observable<U> => source$.pipe(
    map(value => job(value)),
    filter(value => value !== undefined)
);

export const shareReplayLast = <T>(): MonoTypeOperatorFunction<T> => (source$: Observable<T>): Observable<T> => source$.pipe(
    shareReplay({ bufferSize: 1, refCount: false })
);

// Will subscribe to all passed observables with the source observable, but publish only the source observable.
export const subscribeWith = <T, A extends readonly unknown[]>(...others: [...ObservableInputTuple<A>]): MonoTypeOperatorFunction<T> => (source$: Observable<T>): Observable<T> => {
    const argsOrArgArray = <U>(args: (U | U[])[]): U[] => args.length === 1 && Array.isArray(args[0]) ? args[0] : (args as U[]);
    const others$ = argsOrArgArray(others) as ObservableInput<A>[];
    return from(others$).pipe(
        mergeAll(),
        filterMap(() => undefined as never), // stop all the passed observables
        mergeWith(source$) // and just publish the source
    );
};
