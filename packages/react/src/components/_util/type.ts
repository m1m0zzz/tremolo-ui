export type Override<T, U> = T & Omit<U, keyof T>
