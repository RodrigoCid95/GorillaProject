import { Lib } from 'gorilla/core'
export class HomeModel {
  @Lib('lib') private lib: string
  public getMessage() {
    return this.lib
  }
}