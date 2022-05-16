import { Lib } from 'gorilla/core'
import { IO } from 'gorilla/web-sockets'
export class HomeModel {
  public io: IO
  @Lib('lib') private readonly lib: string
  public getMessage(): string {
    return this.lib
  }
}
