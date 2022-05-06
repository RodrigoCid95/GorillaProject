import { Model } from 'gorilla/core'
import { On, Methods, Request, Response } from 'gorilla/http'
import { HomeModel } from 'models'
export class HomeController {
  @Model('HomeModel') model: HomeModel
  @On(Methods.GET, '/home')
  public index(_: Request, res: Response): void {
    res.status(200).send(this.model.getMessage())
  }
}
