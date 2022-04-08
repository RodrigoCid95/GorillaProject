import { Model } from 'gorilla/core'
import { On, IO } from 'gorilla/web-sockets'
import { HomeModel } from 'models'
export class HomeController {
  private readonly io: IO
  @Model('HomeModel') model: HomeModel
  constructor() {
    this.model.io = this.io
  }

  @On('chat message')
  public chatMessage(msg: string): void {
    this.io.emit('chat message', msg)
  }
}
