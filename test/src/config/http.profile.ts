import { GorillaHTTPConfigProfile } from 'gorilla/http'
const gorillaHttpConfig: GorillaHTTPConfigProfile = {
  port: 3000,
  pathsPublic: [
    {
      route: '/',
      dir: 'public'
    }
  ]
}
export default gorillaHttpConfig