import { InitLibrary } from 'gorilla/core'
export const lib: InitLibrary = () => {
  return new Promise(resolve => setTimeout(() => resolve('Hello world!'), 500))
}