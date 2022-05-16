import { InitLibrary } from 'gorilla/core'
export const lib: InitLibrary = async (): Promise<string> => {
  return await new Promise<string>(resolve => setTimeout(() => resolve('Hello world!'), 500))
}
