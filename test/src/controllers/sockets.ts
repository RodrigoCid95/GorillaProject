import { On, IO } from 'gorilla/web-sockets'
export class HomeController {
  private io: IO
  @On('chat message')
  public chatMessage(msg: string) {
    this.io.emit('chat message', msg)
  }
}
