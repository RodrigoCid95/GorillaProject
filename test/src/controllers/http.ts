import { On, Methods } from 'gorilla/http'
import * as fs from 'fs'
export class HomeController {
  @On(Methods.GET, '/home')
  public index(req, res) {
    const list = fs.readdirSync(__dirname)
    res.status(200).send(list.join(', '))
  }
}