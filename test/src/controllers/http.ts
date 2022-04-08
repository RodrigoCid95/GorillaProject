import { Model } from 'gorilla/core'
import { On, Methods, Request, Response } from 'gorilla/http'
import * as fs from 'fs'
import { HomeModel } from 'models'
export class HomeController {
  @Model('HomeModel') model: HomeModel
  @On(Methods.POST, '/send')
  public index(req: Request, res: Response): void {
    this.model.io.emit('chat message', req.body.message)
    const list = fs.readdirSync(__dirname)
    res.status(200).send(list.join(', '))
  }
}
