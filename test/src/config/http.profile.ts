import { GorillaHTTPConfigProfile } from 'gorilla/http'
import { renderFile } from 'pug'
const gorillaHttpConfig: GorillaHTTPConfigProfile = {
  port: 3000,
  pathsPublic: [
    {
      route: '/',
      dir: 'public'
    }
  ],
  engineTemplates: {
    ext: 'pug',
    callback: renderFile,
    name: 'pug',
    dirViews: 'views'
  }
}
export default gorillaHttpConfig
